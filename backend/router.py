import os
from fastapi import APIRouter, Depends
from fastapi.responses import HTMLResponse, FileResponse
from sqlalchemy.orm import Session

from config import FRONTEND_DIR
from database import get_db
from models import LinkModel
from schemas import Link
from auth import get_current_user
from utils import get_yt_title

router = APIRouter()

@router.post("/add")
async def add_link(link: Link, user_id: str = Depends(get_current_user), db: Session = Depends(get_db)): 
    existing = db.query(LinkModel).filter(LinkModel.user_id == user_id, LinkModel.url == link.url).first() 
    if not existing: 
        title = get_yt_title(link.url) 
        new_link = LinkModel(user_id=user_id, url=link.url, title=title) 
        db.add(new_link) 
        db.commit() 
    return {"status": "success"} 

@router.post("/remove")
async def remove_link(link: Link, user_id: str = Depends(get_current_user), db: Session = Depends(get_db)): 
    db.query(LinkModel).filter(LinkModel.user_id == user_id, LinkModel.url == link.url).delete() 
    db.commit() 
    return {"status": "success"} 

@router.get("/links")
async def get_links(user_id: str = Depends(get_current_user), db: Session = Depends(get_db)): 
    links = db.query(LinkModel).filter(LinkModel.user_id == user_id).all() 
    return [{"url": l.url, "title": l.title} for l in links] 