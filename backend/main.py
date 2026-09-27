import os
import json
import urllib.request
import urllib.parse
from fastapi import FastAPI, Depends, HTTPException
from fastapi.responses import HTMLResponse, FileResponse
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel
from sqlalchemy import create_engine, Column, Integer, String
from sqlalchemy.orm import declarative_base, sessionmaker, Session
import jwt
from jwt import PyJWKClient
from dotenv import load_dotenv

load_dotenv()  
app = FastAPI()
FRONTEND_DIR = os.path.join(os.path.dirname(__file__), "..", "frontend")


# --- Database Setup (SQLite by default, easily swapped to Neon Postgres URL) ---
DATABASE_URL = os.getenv("POSTGRESQL_CONNECTION_URI")
engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False} if "sqlite" in DATABASE_URL else {})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

class LinkModel(Base):
    __tablename__ = "links"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(String, index=True)
    url = Column(String)
    title = Column(String)

Base.metadata.create_all(bind=engine)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# --- Auth Integration with CAS ---
security = HTTPBearer()
CAS_JWKS_URL = os.getenv("CAS_JWKS_URL", "http://localhost:3001/auth/jwt/jwks.json")
jwks_client = PyJWKClient(CAS_JWKS_URL)

def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    token = credentials.credentials
    try:
        signing_key = jwks_client.get_signing_key_from_jwt(token)
        # Add leeway=60 to handle clock drift between Docker and your host OS
        payload = jwt.decode(
            token, 
            signing_key.key, 
            algorithms=["RS256"], 
            options={"verify_aud": False},
            leeway=60 
        )
        return payload.get("sub")
    except Exception as e:
        print(f"JWT Verification Failed: {e}")
        raise HTTPException(status_code=401, detail="Invalid or expired token")

# --- Models & Utils ---
class Link(BaseModel):
    url: str

def get_yt_title(url):
    oembed_url = f"https://www.youtube.com/oembed?url={urllib.parse.quote(url)}&format=json"
    try:
        with urllib.request.urlopen(oembed_url) as response:
            data = json.loads(response.read().decode())
            return data.get("title", "Unknown Title")
    except Exception:
        return "Unknown Title"

# --- Endpoints ---
@app.get("/")
async def read_root():
    index_path = os.path.join(FRONTEND_DIR, "index.html")
    with open(index_path, "r") as f:
        return HTMLResponse(content=f.read(), status_code=200)

@app.post("/add")
async def add_link(link: Link, user_id: str = Depends(get_current_user), db: Session = Depends(get_db)):
    existing = db.query(LinkModel).filter(LinkModel.user_id == user_id, LinkModel.url == link.url).first()
    if not existing:
        title = get_yt_title(link.url)
        new_link = LinkModel(user_id=user_id, url=link.url, title=title)
        db.add(new_link)
        db.commit()
    return {"status": "success"}

@app.post("/remove")
async def remove_link(link: Link, user_id: str = Depends(get_current_user), db: Session = Depends(get_db)):
    db.query(LinkModel).filter(LinkModel.user_id == user_id, LinkModel.url == link.url).delete()
    db.commit()
    return {"status": "success"}

@app.get("/links")
async def get_links(user_id: str = Depends(get_current_user), db: Session = Depends(get_db)):
    links = db.query(LinkModel).filter(LinkModel.user_id == user_id).all()
    return [{"url": l.url, "title": l.title} for l in links]

@app.get("/manifest.json")
async def get_manifest():
    return FileResponse(os.path.join(FRONTEND_DIR, "manifest.json"))

@app.get("/sw.js")
async def get_sw():
    return FileResponse(os.path.join(FRONTEND_DIR, "sw.js"))