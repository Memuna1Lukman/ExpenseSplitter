from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.ext.declarative import declarative_base
from .config import settings
import redis.asyncio as redis

# Connect to local Redis instance (default port 6379)
redis_client = redis.Redis(host=settings.database_hostname, port=6379, db=0, decode_responses=True)

SQLALCHEMY_DATABASE_URL = f'postgresql://{settings.database_username}:{settings.database_password}@{settings.database_hostname}:{settings.database_port}/{settings.database_name}'


engine = create_engine(SQLALCHEMY_DATABASE_URL)


SessionLocal = sessionmaker(autoflush=False,autocommit=False,bind=engine)


Base= declarative_base()
   


def get_db():
    db=SessionLocal()
    try:
        yield db
    finally:
        db.close()


           