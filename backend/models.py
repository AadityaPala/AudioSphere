from sqlalchemy import Column, Integer, String
from database import Base

class LinkModel(Base):
    __tablename__ = "links"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(String, index=True)
    url = Column(String)
    title = Column(String)