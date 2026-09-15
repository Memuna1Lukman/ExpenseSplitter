from fastapi import APIRouter,Depends,HTTPException,status
from .. import models,schemas,oauth
from ..database import get_db
from sqlalchemy.orm import Session
from typing import List

router = APIRouter(
    tags=["Groups"],
    prefix="/groups"
)


@router.post("/",response_model=schemas.PostGroup,status_code=status.HTTP_201_CREATED)
def create_group(group:schemas.CreateGroup,db:Session = Depends(get_db),current_user:models.Users = Depends(oauth.get_current_user)):
    new_group = group.model_dump()
    # check whether the person is a user
    check_users = db.query(models.Users).filter(models.Users.id == current_user.id).first()
    if not check_users:
        raise HTTPException(
            status_code= status.HTTP_401_UNAUTHORIZED,
            detail="Not authorized"
        )
    new_group_created = models.Groups(**new_group,created_by=current_user.id)
    db.add(new_group_created)
    db.commit()
    db.refresh(new_group_created)

    # creator should usually be a member of their own group
    db.add(models.GroupMembers(group_id=new_group_created.id, user_id=current_user.id))
    db.commit()
    return new_group_created



@router.get("/",response_model=List[schemas.GetAllGroups])
def get_all_groups(db:Session = Depends(get_db),current_user:models.Users = Depends(oauth.get_current_user)):
    
    # if the person is logged in then,
    check_group = db.query(models.Groups).join(models.GroupMembers,models.GroupMembers.group_id == models.Groups.id).filter(models.GroupMembers.user_id == current_user.id).all()
    return check_group


# get group by id
@router.get("/{id}",response_model = schemas.GetOneGroup)
def get_group_id(id:int,db:Session = Depends(get_db),current_user:models.Users = Depends(oauth.get_current_user)):
   
    
    # check whether the id exist
    check_id = db.query(models.Groups).filter(models.Groups.id == id).first()
    if not check_id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Not found"
        )
    is_member = db.query(models.GroupMembers).filter(
        models.GroupMembers.group_id == id,
        models.GroupMembers.user_id == current_user.id
    ).first()
    if not is_member:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not a member of this group")
    
    
    return check_id

# patch the group why not put
@router.patch("/{id}",response_model=schemas.PostGroup)
def update_groups(id:int,group:schemas.CreateGroup,db:Session = Depends(get_db),current_user:models.Users = Depends(oauth.get_current_user)):
    # check whether the id exist
    query_id = db.query(models.Groups).filter(models.Groups.id == id)
    check_id = query_id.first()
    if not check_id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Not found"
    )
    if check_id.created_by != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN,detail = f"You have no groups created")
    query_id.update(group.model_dump(exclude_unset=True),synchronize_session=False)
    db.commit()
    db.refresh(check_id)
    return check_id

# delete or remove  a group
@router.delete("/{id}", status_code=status.HTTP_204_NO_CONTENT)
def del_group(id: int, db: Session = Depends(get_db), current_user: models.Users = Depends(oauth.get_current_user)):
    groups = db.query(models.Groups).filter(models.Groups.id == id).first()
    if not groups:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Group not found")
    if groups.created_by != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only the creator can delete this group")
    db.delete(groups)
    db.commit()
    return



# addding members to the memebers table

@router.post("/{id}/members",response_model=schemas.PostMembers,status_code=status.HTTP_201_CREATED)
def create_members(id:int,member:schemas.AddMembers,db:Session = Depends(get_db),current_user:models.Users = Depends(oauth.get_current_user)):
    member_dict = member.model_dump()
    # does the group exist()
    group = db.query(models.Groups).filter(models.Groups.id == id).first()
    if not group:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Not found"
       ) 

    # is the current user allowed to add members? (must be a member themselves)
    query_mgroup = db.query(models.GroupMembers).filter(
        models.GroupMembers.group_id == id,
        models.GroupMembers.user_id == current_user.id
    ).first()
    if not query_mgroup:
        raise HTTPException(
            status_code = status.HTTP_403_FORBIDDEN,
            detail="do not have an account"
        )
    # does the user being added actually exist?
    targeted_member = db.query(models.Users).filter(models.Users.id == member_dict["user_id"]).first()
    if not targeted_member:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Not found"
        )
    # is the user alreaddy in the group
    existing = db.query(models.GroupMembers).filter(
        models.GroupMembers.group_id == id,
        models.GroupMembers.user_id == member_dict["user_id"]
    ).first() 
    if existing:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Already in the group")
    add_members = models.GroupMembers(group_id=id, user_id=member_dict["user_id"])
    db.add(add_members)
    db.commit()
    db.refresh(add_members)
    return add_members



@router.get("/{id}/members", response_model=List[schemas.PostMembers]) # list all members in a group
def get_all_memebers(id:int,db:Session = Depends(get_db),current_user:models.Users = Depends(oauth.get_current_user)):
    query_group = db.query(models.GroupMembers).filter(models.GroupMembers.group_id == id).all()
    if not query_group:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Not found"
        )
    return query_group

# delete or remove a member


@router.delete("/{id}/members/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
def remove_member(id: int, user_id: int, db: Session = Depends(get_db), current_user: models.Users = Depends(oauth.get_current_user)):
    query_group = db.query(models.GroupMembers).filter(models.GroupMembers.group_id == id).first()
    if not query_group:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Not found"
        )
    # allow: the group creator removing anyone, OR a user removing themselves
    if  current_user.id != query_group.created_by and current_user.id == user_id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized to remove this member")
    membership = db.query(models.GroupMembers).filter(
        models.GroupMembers.group_id == id,
        models.GroupMembers.user_id == user_id
    ).first()
    if not membership:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User is not a member of this group")

    db.delete(membership)
    db.commit()
    return 

    
