from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import config 
from database import engine, Base
from router import router

Base.metadata.create_all(bind=engine)

app = FastAPI()

app.add_middleware(
    CORSMiddleware, 
    allow_origins=["http://localhost:5173"], 
    allow_credentials=True, 
    allow_methods=["*"], 
    allow_headers=["*"], 
)

app.include_router(router)