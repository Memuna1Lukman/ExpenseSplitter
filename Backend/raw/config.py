from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    database_hostname:str
    database_name: str
    database_username: str
    database_password:str
    database_port: str
    secret_key: str
    algorithm: str
    access_token_expire_minutes:int
    gemini_client_id:str
    gemini_secret:str
    redirect_uri:str
    reset_token_expire_minutes:int
    momo_subcription_key: str
    momo_api_user:str 
    momo_api_key: str
    momo_base_url: str
    momo_target_env:str
    model_config = {'env_file': '.env'}






settings = Settings()

