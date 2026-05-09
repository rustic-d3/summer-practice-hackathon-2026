from typing import List, Optional

from fastapi import FastAPI, Depends, Form, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from datetime import timedelta
from dotenv import load_dotenv
from fastapi.middleware.cors import CORSMiddleware
# RIGHT
from models import EventCreate, UserPublic, UserUpdate, EventPublic
from database import EventDB  # EventDB is now here!

from fastapi import UploadFile, File
import httpx, os
load_dotenv()
SUPABASE_URL = os.environ["SUPABASE_URL"]
SUPABASE_KEY = os.environ["SUPABASE_SERVICE_KEY"]  



from auth import (
    authenticate_user,
    create_access_token,
    get_current_active_user,
    ACCESS_TOKEN_EXPIRE_MINUTES,
)
from database import Sport, UserSport, get_db, create_user, UserDB
# 1. Import Pydantic Schemas from models.py
from models import Token, UserCreate, UserPublic, UserUpdate

# 2. Import SQLAlchemy Tables from database.py
from database import EventDB, UserDB, get_db, engine, Base
from security import get_password_hash
from database import Sport, UserSport, get_db, create_user, UserDB, engine, Base
import models # Load all models

# This line MUST run to create the tables in the DB
Base.metadata.create_all(bind=engine)

app = FastAPI(title="FastAPI Auth Demo", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",   # Vite dev server
        "http://127.0.0.1:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


from security import get_password_hash

@app.post("/auth/register", response_model=UserPublic, status_code=201)
async def register(
    username: str = Form(...),
    email: str = Form(...),
    password: str = Form(...),
    description: str = Form(""),
    skill_level: str = Form("beginner"),
    preferred_time: str = Form("anytime"),
    looking_for: str = Form("both"),
    avatar: Optional[UploadFile] = File(None),
    db: Session = Depends(get_db)
):
    # 1. Check if user already exists
    existing = db.query(UserDB).filter(UserDB.username == username).first()
    if existing:
        raise HTTPException(status_code=400, detail="Username already registered")

    # 2. Handle Supabase Avatar Upload (if provided)
    public_url = ""
    if avatar:
        contents = await avatar.read()
        # Use username in path to keep files organized
        filename = f"{username}/{avatar.filename}"
        
        async with httpx.AsyncClient() as client:
            res = await client.post(
                f"{SUPABASE_URL}/storage/v1/object/avatars/{filename}",
                headers={
                    "Authorization": f"Bearer {SUPABASE_KEY}",
                    "Content-Type": avatar.content_type,
                },
                content=contents,
            )
            # If upload fails, you might want to log it or raise an error
            if res.status_code in [200, 201]:
                public_url = f"{SUPABASE_URL}/storage/v1/object/public/avatars/{filename}"

    # 3. Create user in local Database
    # Update your create_user helper to accept these new fields!
    user = UserDB(
        username=username,
        email=email,
        hashed_password=get_password_hash(password),
        description=description,
        avatar_url=public_url,
        skill_level=skill_level,
        preferred_time=preferred_time,
        looking_for=looking_for,
        disabled=False
    )
    
    db.add(user)
    db.commit()
    db.refresh(user)
    return user
@app.post("/auth/login", response_model=Token)
def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = authenticate_user(db, form_data.username, form_data.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    access_token = create_access_token(
        data={"sub": user.username},
        expires_delta=timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES),
    )
    return {"access_token": access_token, "token_type": "bearer"}


@app.get("/events/mine", response_model=List[EventPublic])
def get_my_events(
    current_user: UserDB = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    return db.query(EventDB).filter(EventDB.creator_id == current_user.id).all()

@app.get("/users/me", response_model=UserPublic) # Must be UserPublic!
def read_users_me(current_user: UserDB = Depends(get_current_active_user)):
    return current_user


@app.get("/users/me/items")
def read_own_items(current_user: UserPublic = Depends(get_current_active_user)):
    return [{"item_id": 1, "owner": current_user.username, "name": "My Secret Item"}]


@app.post("/users/me/avatar")
async def upload_avatar(
    file: UploadFile = File(...),
    current_user: UserPublic = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    contents = await file.read()
    filename = f"{current_user.username}/{file.filename}"

    # Upload to Supabase Storage
    async with httpx.AsyncClient() as client:
        res = await client.post(
            f"{SUPABASE_URL}/storage/v1/object/avatars/{filename}",
            headers={
                "Authorization": f"Bearer {SUPABASE_KEY}",
                "Content-Type": file.content_type,
            },
            content=contents,
        )

    public_url = f"{SUPABASE_URL}/storage/v1/object/public/avatars/{filename}"

    # Save URL to user row
    user = db.query(UserDB).filter(UserDB.username == current_user.username).first()
    user.avatar_url = public_url
    db.commit()

    return {"avatar_url": public_url}


@app.get("/sports")
def get_sports(db: Session = Depends(get_db)):
    return db.query(Sport).all()

@app.post("/users/me/sports")
def set_user_sports(
    sport_ids: list[int],
    current_user: UserPublic = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    # Remove old selections then insert new ones
    db.query(UserSport).filter(UserSport.username == current_user.username).delete()
    for sid in sport_ids:
        db.add(UserSport(username=current_user.username, sport_id=sid))
    db.commit()
    return {"updated": True}

@app.get("/users/me/sports")
def get_user_sports(
    current_user: UserPublic = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    rows = db.query(UserSport).filter(UserSport.username == current_user.username).all()
    return [r.sport_id for r in rows]


@app.patch("/users/me", response_model=UserPublic)
def update_profile(
    updates: UserUpdate,
    current_user: UserPublic = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    user = db.query(UserDB).filter(UserDB.username == current_user.username).first()
    for field, value in updates.model_dump(exclude_none=True).items():
        setattr(user, field, value)
    db.commit()
    db.refresh(user)
    return user


# main.py

@app.post("/events", response_model=EventPublic, status_code=201)
async def create_event(
    event_in: EventCreate, 
    current_user: UserDB = Depends(get_current_active_user), 
    db: Session = Depends(get_db)
):
    # Create the SQLAlchemy object
    new_event = EventDB(
        title=event_in.title,
        sport_type=event_in.sport_type,
        location=event_in.location,
        event_skill_level=event_in.event_skill_level,
        event_time=event_in.event_time,
        creator_id=current_user.id
    )
    
    db.add(new_event) # This will now work because EventDB is correctly mapped
    db.commit()
    db.refresh(new_event)
    return new_event

@app.get("/events/matches", response_model=List[EventPublic])
def get_matched_events(
    current_user: UserDB = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    query = db.query(EventDB).filter(
        EventDB.event_skill_level == current_user.skill_level,
        EventDB.creator_id != current_user.id
    )
    
    # If user isn't 'anytime', filter by their specific time
    if current_user.preferred_time != "anytime":
        query = query.filter(EventDB.event_time == current_user.preferred_time)
        
    return query.all()