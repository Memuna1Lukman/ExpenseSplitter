from fastapi import FastAPI,Response
from . import models
from .database import engine
from .routes import auth,users,groups,expenses,payments
from fastapi.middleware.cors import CORSMiddleware


app = FastAPI()


app.include_router(auth.router)
app.include_router(users.router)
app.include_router(groups.router)
app.include_router(expenses.router)
app.include_router(payments.router)


app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"], # React Vite dev server
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)