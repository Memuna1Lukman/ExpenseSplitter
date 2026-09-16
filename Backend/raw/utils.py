from pwdlib import PasswordHash


password_hash = PasswordHash.recommended()

def verify_password(plain_password, hashed_password):
    return password_hash.verify(plain_password, hashed_password)


def get_password_hash(password):
    return password_hash.hash(password)

# this is my first time of learning how to reset a password

# def reset_password(token:str)->str:

