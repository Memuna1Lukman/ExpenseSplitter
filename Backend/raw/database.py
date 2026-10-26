from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.ext.declarative import declarative_base
from .config import settings
import redis.asyncio as redis

# Connect to Redis instance
redis_client = redis.from_url(settings.redis_url, decode_responses=True)

SQLALCHEMY_DATABASE_URL = (
    f'postgresql://{settings.database_username}:{settings.database_password}'
    f'@{settings.database_hostname}:{settings.database_port}/{settings.database_name}'
    f'?sslmode=require'
)

engine = create_engine(SQLALCHEMY_DATABASE_URL)


SessionLocal = sessionmaker(autoflush=False,autocommit=False,bind=engine)


Base= declarative_base()
   


def get_db():
    db=SessionLocal()
    try:
        yield db
    finally:
        db.close()


