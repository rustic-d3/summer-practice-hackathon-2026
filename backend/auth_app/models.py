from pydantic import BaseModel, EmailStr
from typing import Optional, List

# User Schemas
class UserCreate(BaseModel):
    username: str
    email: EmailStr
    password: str

class UserPublic(BaseModel):
    id: int
    username: str
    email: str
    description: str = ""
    avatar_url: str = ""
    skill_level: str = "beginner"
    preferred_time: str = "anytime"
    disabled: bool = False

    class Config:
        from_attributes = True

class UserUpdate(BaseModel):
    description:    Optional[str] = None
    skill_level:    Optional[str] = None
    preferred_time: Optional[str] = None
    looking_for:    Optional[str] = None
    avatar_url:     Optional[str] = None
# Token Schemas
class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    username: Optional[str] = None

# Event Schemas
class EventCreate(BaseModel):
    title: str
    sport_type: str
    location: str
    event_skill_level: str
    event_time: str

class EventPublic(BaseModel):
    id: int
    title: str
    sport_type: str
    location: str
    event_skill_level: str
    event_time: str
    creator_id: int

    class Config:
        from_attributes = True