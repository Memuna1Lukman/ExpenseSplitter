from pwdlib import PasswordHash
import secrets

password_hash = PasswordHash.recommended()

def verify_password(plain_password, hashed_password):
    return password_hash.verify(plain_password, hashed_password)


def get_password_hash(password):
    return password_hash.hash(password)

# how to setup an otp
def generate_otp()->str:
    """Generates a cryptographically secure 6-digit numeric OTP."""
    return str(secrets.randbelow(900000)+ 100000)


def hash_otp(otp)->str:
    return password_hash.hash(otp)

def verify_otp(plain_otp: str, hashed_otp: str):
    return password_hash.verify(plain_otp,hashed_otp)



