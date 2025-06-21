from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import uvicorn

from app.database import connect_to_mongo, close_mongo_connection
from app.api.api import api_router
from app.config import settings

@asynccontextmanager
async def lifespan(app: FastAPI):
    print("⏳ Starting up...")
    await connect_to_mongo()
    print("✅ Connected to MongoDB")
    yield
    print("🛑 Shutting down...")
    await close_mongo_connection()  # Add await here
    print("✅ MongoDB connection closed")

app = FastAPI(
    title="AI Food Assistant API",
    description="Backend API for AI-powered food assistant application",
    version="1.0.0",
    lifespan=lifespan
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API router
app.include_router(api_router, prefix="/api/v1")

@app.get("/")
async def root():
    return {"message": "AI Food Assistant API is running!"}

@app.get("/health")
async def health_check():
    return {"status": "healthy", "database": "connected"}

if __name__ == "__main__":
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)