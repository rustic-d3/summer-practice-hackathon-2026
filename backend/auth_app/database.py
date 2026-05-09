from sqlalchemy import ForeignKey, Integer, create_engine, Column, String, Boolean, DateTime
from sqlalchemy.orm import DeclarativeBase, sessionmaker, Session
import os
from dotenv import load_dotenv  # Add this import

# Load the .env file
load_dotenv()

DATABASE_URL = os.environ.get("DATABASE_URL")

engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

class Base(DeclarativeBase):
    pass

# ── TABLES ──────────────────────────────────────────────────────────────────

class UserDB(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    description = Column(String, default="")
    hashed_password = Column(String, nullable=False)
    avatar_url = Column(String, default="")
    disabled = Column(Boolean, default=False)
    skill_level = Column(String, default="beginner")
    preferred_time = Column(String, default="anytime")
    looking_for = Column(String, default="both")

class Sport(Base):
    __tablename__ = "sports"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, nullable=False)

class UserSport(Base):
    __tablename__ = "user_sports"
    user_id = Column(Integer, ForeignKey("users.id"), primary_key=True)
    sport_id = Column(Integer, ForeignKey("sports.id"), primary_key=True)

class EventDB(Base):
    __tablename__ = "events"
    id = Column(Integer, primary_key=True, index=True)
    creator_id = Column(Integer, ForeignKey("users.id"))
    title = Column(String, nullable=False)
    sport_type = Column(String, nullable=False)
    event_skill_level = Column(String)
    event_time = Column(String)
    location = Column(String)
    date = Column(DateTime, nullable=True)

# ── DEPENDENCY & HELPERS ──────────────────────────────────────────────────────

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def create_user(db: Session, **kwargs) -> UserDB:
    user = UserDB(**kwargs)
    db.add(user)
    db.commit()
    db.refresh(user)
    return user