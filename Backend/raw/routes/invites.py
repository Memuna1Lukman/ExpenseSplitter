from datetime import datetime, timedelta, timezone
import secrets

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

import models
import oauth
import schemas
from config import settings
from database import get_db


router = APIRouter(tags=["Invites"])


def _group_membership(group_id: int, user_id: int, db: Session):
    return db.query(models.GroupMembers).filter(
        models.GroupMembers.group_id == group_id,
        models.GroupMembers.user_id == user_id,
    ).first()


@router.post(
    "/groups/{group_id}/invites",
    response_model=schemas.CreateInviteOut,
    status_code=status.HTTP_201_CREATED,
)
def create_invite(
    group_id: int,
    payload: schemas.CreateInvite,
    db: Session = Depends(get_db),
    current_user: models.Users = Depends(oauth.get_current_user),
):
    """Create a pending invite; it never adds the recipient to the group."""
    group = db.query(models.Groups).filter(models.Groups.id == group_id).first()
    if not group:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Group not found")
    if not _group_membership(group_id, current_user.id, db):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not a member of this group")

    invited_email = str(payload.email).lower()
    existing_user = db.query(models.Users).filter(models.Users.email == invited_email).first()
    if existing_user and _group_membership(group_id, existing_user.id, db):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="This person is already in the group")

    existing_invite = db.query(models.Invitation).filter(
        models.Invitation.group_id == group_id,
        models.Invitation.invited_email == invited_email,
        models.Invitation.status == "pending",
        models.Invitation.expires_at > datetime.now(timezone.utc),
    ).first()
    if existing_invite:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="A pending invite already exists for this email")

    invite = models.Invitation(
        group_id=group_id,
        invited_email=invited_email,
        invited_by=current_user.id,
        token=secrets.token_urlsafe(32),
        expires_at=datetime.now(timezone.utc) + timedelta(days=7),
        status="pending",
    )
    db.add(invite)
    db.commit()
    db.refresh(invite)

    # Send this URL from your email-provider integration. It is deliberately
    # returned only to the authenticated inviter, not exposed in list endpoints.
    accept_url = f"{settings.frontend_url.rstrip('/')}/invites/accept?token={invite.token}"
    return {**schemas.InviteOut.model_validate(invite).model_dump(), "accept_url": accept_url}


@router.get("/groups/{group_id}/invites", response_model=list[schemas.InviteOut])
def list_group_invites(
    group_id: int,
    db: Session = Depends(get_db),
    current_user: models.Users = Depends(oauth.get_current_user),
):
    if not _group_membership(group_id, current_user.id, db):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not a member of this group")
    return db.query(models.Invitation).filter(models.Invitation.group_id == group_id).order_by(
        models.Invitation.created_at.desc()
    ).all()


@router.post("/invites/accept", response_model=schemas.InviteOut)
def accept_invite(
    payload: schemas.AcceptInvite,
    db: Session = Depends(get_db),
    current_user: models.Users = Depends(oauth.get_current_user),
):
    invite = db.query(models.Invitation).filter(models.Invitation.token == payload.token).first()
    now = datetime.now(timezone.utc)
    if not invite:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="This invite is invalid or expired")
    if invite.invited_email.lower() != current_user.email.lower():
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Sign in with the email address that received this invite")

    # This makes the operation safe to retry (including React Strict Mode's
    # development re-mount) without adding a duplicate membership.
    if invite.status == "accepted":
        return invite
    if invite.status != "pending" or invite.expires_at <= now:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="This invite is invalid or expired")

    if not _group_membership(invite.group_id, current_user.id, db):
        db.add(models.GroupMembers(group_id=invite.group_id, user_id=current_user.id))
    invite.status = "accepted"
    invite.accepted_at = now
    db.commit()
    db.refresh(invite)
    return invite


@router.delete("/groups/{group_id}/invites/{invite_id}", status_code=status.HTTP_204_NO_CONTENT)
def revoke_invite(
    group_id: int,
    invite_id: int,
    db: Session = Depends(get_db),
    current_user: models.Users = Depends(oauth.get_current_user),
):
    invite = db.query(models.Invitation).filter(
        models.Invitation.id == invite_id,
        models.Invitation.group_id == group_id,
    ).first()
    if not invite:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Invite not found")
    if invite.invited_by != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only the inviter can revoke this invite")
    if invite.status != "pending":
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Only pending invites can be revoked")

    invite.status = "revoked"
    db.commit()
