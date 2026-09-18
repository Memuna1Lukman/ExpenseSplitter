from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from .. import models, schemas, oauth, momo_client
from ..database import get_db

router = APIRouter(prefix="/payments", tags=["Payments"])



@router.post("/momo/initiate", response_model=schemas.PaymentOut, status_code=status.HTTP_201_CREATED)
async def initiate_momo_payment(
    payment: schemas.InitiateMomoPayment,
    db: Session = Depends(get_db),
    current_user: models.Users = Depends(oauth.get_current_user)
):
    payee = db.query(models.Users).filter(models.Users.id == payment.paid_to).first()
    if not payee:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Payee not found")
    if payment.paid_to == current_user.id:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Cannot pay yourself")
    try:
        reference_id = await momo_client.request_to_pay(
            amount=str(payment.amount),
            phone_number=payment.phone_number,
            payer_message="Settling up on ExpenseSplitter",
            payee_note=payment.note or "Settlement"
        )
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail=f"MoMo request failed: {str(e)}")
    new_payment = models.Payments(
        group_id=payment.group_id,
        paid_by=current_user.id,
        paid_to=payment.paid_to,
        amount=payment.amount,
        provider="momo",
        provider_reference_id=reference_id,
        status="pending"
    )
    db.add(new_payment)
    db.commit()
    db.refresh(new_payment)
    return new_payment


@router.get("/momo/status/{payment_id}", response_model=schemas.PaymentOut)
async def check_momo_payment(
    payment_id: int,
    db: Session = Depends(get_db),
    current_user: models.Users = Depends(oauth.get_current_user)
):
    payment = db.query(models.Payments).filter(models.Payments.id == payment_id).first()
    if not payment:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Payment not found")
    if payment.provider != "momo" or not payment.provider_reference_id:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Not a MoMo payment")
    try:
        result = await momo_client.check_payment_status(payment.provider_reference_id)
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail=f"MoMo status check failed: {str(e)}")
    
    momo_status = result.get("status")
    if momo_status == "SUCCESSFUL":
        payment.status = "completed"
    elif momo_status in ("FAILED", "REJECTED", "TIMEOUT"):
        payment.status = "failed"

    db.commit()
    db.refresh(payment)
    return payment