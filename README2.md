# ShowUp2Move

A sports matchmaking platform built with FastAPI + React.

## Backend

```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --reload
```

## Frontend

```bash
cd frontend
npm install
npm run dev
```

## Environment Variables

Create a `.env` file in `/backend` with:

```
DATABASE_URL=...
SECRET_KEY=...
SUPABASE_URL=...
SUPABASE_SERVICE_KEY=...
```
