import uuid
import httpx
from .config import settings



async def get_access_token() -> str:
    url = f"{settings.momo_base_url}/collection/token"


    async with httpx.AsyncClient() as client:
        response = await client.post(
            url,
            auth = (settings.momo_api_user,settings.momo_api_key),
            headers={"Ocp-Apim-Subscription-Key": settings.momo_subcription_key}
        )
        response.raise_for_status()
        return response.json()["access_token"]



async def request_to_pay(amount: str, phone_number: str, payer_message: str, payee_note: str) -> str:
    token = await get_access_token
    reference_id = str(uuid.uuid4())

    url = f"{settings.momo_base_url}/collection/v1_0/requesttopay"
    async with httpx.AsyncClient() as client:
        response = await client.post(
            url,
            headers={
                "Authorization": f"Bearer {token}",
                "X-Reference-Id": reference_id,
                "X-Target-Environment": settings.momo_target_env,
                "Ocp-Apim-Subscription-Key": settings.momo_subcription_key,
                "Content-Type": "application/json"
            },
            json={
                "amount": amount,
                "currency": "EUR",
                "externalId": reference_id,
                "payer": {
                    "partyIdType": "MSISDN",
                    "partyId": phone_number
                },
                "payerMessage": payer_message,
                "payeeNote": payee_note
            }
        )
        response.raise_for_status()

    return reference_id


async def check_payment_status(reference_id: str) -> dict:
    token = await get_access_token()
    url = f"{settings.momo_base_url}/collection/v1_0/requesttopay/{reference_id}"

    async with httpx.AsyncClient() as client:
        response = await client.get(
            url,
            headers={
                "Authorization": f"Bearer {token}",
                "X-Target-Environment": settings.momo_target_env,
                "Ocp-Apim-Subscription-Key": settings.momo_subcription_key
            }
        )
        response.raise_for_status()
        return response.json()