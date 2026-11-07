"""Shared fixtures.

The API is exercised through FastAPI's TestClient with MongoDB-backed schema
classes replaced by in-memory fakes, so the tests need no database, Firebase
credentials or API keys.
"""
import os

# Must be set before any app module is imported.
os.environ.setdefault("SECRET_KEY", "test-secret-key")
os.environ.setdefault("GROQ_API_KEY", "test-groq-key")

import asyncio

import httpx
import pytest
from fastapi import FastAPI

from app.api.v1 import chatbot, meal, recipe
from app.core.security import create_access_token, create_refresh_token

ALICE = "a" * 24
BOB = "b" * 24


def bearer(user_id: str, refresh: bool = False) -> dict:
    make = create_refresh_token if refresh else create_access_token
    data = {"sub": user_id, "type": "refresh" if refresh else "access"}
    return {"Authorization": f"Bearer {make(data)}"}


@pytest.fixture
def alice() -> dict:
    return bearer(ALICE)


@pytest.fixture
def bob() -> dict:
    return bearer(BOB)


@pytest.fixture
def store(monkeypatch):
    """In-memory replacements for the Mongo-backed schema classes."""
    db = {"conversations": {}, "meal_plans": {}, "recipes": {}}
    counter = {"n": 0}

    def next_id() -> str:
        counter["n"] += 1
        return f"{counter['n']:024x}"

    # ---- conversations
    async def conv_find(conversation_id):
        return db["conversations"].get(conversation_id)

    async def conv_by_user(user_id):
        return [c for c in db["conversations"].values() if c["user_id"] == user_id]

    async def conv_create(conversation_id, user_id, title, initial_message=None):
        doc = {"_id": next_id(), "conversation_id": conversation_id,
               "user_id": user_id, "title": title, "messages": []}
        db["conversations"][conversation_id] = doc
        return doc

    async def conv_title(conversation_id, title):
        if conversation_id not in db["conversations"]:
            return False
        db["conversations"][conversation_id]["title"] = title
        return True

    async def conv_delete(conversation_id):
        return db["conversations"].pop(conversation_id, None) is not None

    async def conv_update_message(conversation_id, message_index, content, role):
        return conversation_id in db["conversations"]

    cs = chatbot.ChatSchema
    monkeypatch.setattr(cs, "find_by_conversation_id", staticmethod(conv_find))
    monkeypatch.setattr(cs, "find_by_user_id", staticmethod(conv_by_user))
    monkeypatch.setattr(cs, "create", staticmethod(conv_create))
    monkeypatch.setattr(cs, "update_title", staticmethod(conv_title))
    monkeypatch.setattr(cs, "delete", staticmethod(conv_delete))
    monkeypatch.setattr(cs, "update_message", staticmethod(conv_update_message))

    async def fake_process(message, user_id, conversation_id, search, search_type):
        return "ok", conversation_id or "new-conversation"

    monkeypatch.setattr(chatbot.chat_service, "process_message", fake_process)

    # ---- meal plans
    async def meal_create(data):
        doc = {"_id": next_id(), **data}
        db["meal_plans"][doc["_id"]] = doc
        return doc

    async def meal_find(meal_plan_id):
        return db["meal_plans"].get(meal_plan_id)

    async def meal_by_user(user_id):
        return [m for m in db["meal_plans"].values() if m["user_id"] == user_id]

    async def meal_update(meal_plan_id, data):
        if meal_plan_id not in db["meal_plans"]:
            return None
        db["meal_plans"][meal_plan_id].update(data)
        return db["meal_plans"][meal_plan_id]

    async def meal_delete(meal_plan_id):
        return db["meal_plans"].pop(meal_plan_id, None) is not None

    async def meal_range(user_id, start_date, end_date):
        return [m for m in db["meal_plans"].values()
                if m["user_id"] == user_id and start_date <= m["date"] <= end_date]

    ms = meal.MealPlanSchema
    monkeypatch.setattr(ms, "create", staticmethod(meal_create))
    monkeypatch.setattr(ms, "find_by_id", staticmethod(meal_find))
    monkeypatch.setattr(ms, "find_by_user_id", staticmethod(meal_by_user))
    monkeypatch.setattr(ms, "update", staticmethod(meal_update))
    monkeypatch.setattr(ms, "delete", staticmethod(meal_delete))
    monkeypatch.setattr(ms, "find_by_date_range", staticmethod(meal_range))

    # ---- recipes
    async def rec_create(user_id, title, content):
        doc = {"_id": next_id(), "user_id": user_id, "title": title, "content": content}
        db["recipes"][doc["_id"]] = doc
        return doc

    async def rec_find(document_id):
        return db["recipes"].get(document_id)

    async def rec_by_user(user_id):
        return [r for r in db["recipes"].values() if r["user_id"] == user_id]

    async def rec_update(document_id, data):
        if document_id not in db["recipes"]:
            return False
        db["recipes"][document_id].update(data)
        return True

    rs = recipe.RecipeSchema
    monkeypatch.setattr(rs, "create", staticmethod(rec_create))
    monkeypatch.setattr(rs, "find_by_id", staticmethod(rec_find))
    monkeypatch.setattr(rs, "find_by_user_id", staticmethod(rec_by_user))
    monkeypatch.setattr(rs, "update", staticmethod(rec_update))

    return db


class SyncClient:
    """Minimal synchronous client that drives the ASGI app through httpx.

    Starlette's TestClient breaks with the httpx version pinned in
    requirements.txt, so requests go through httpx's ASGI transport instead.
    """

    def __init__(self, app):
        self.app = app

    def request(self, method, url, **kwargs):
        async def run():
            transport = httpx.ASGITransport(app=self.app)
            async with httpx.AsyncClient(transport=transport, base_url="http://testserver") as c:
                return await c.request(method, url, **kwargs)

        return asyncio.run(run())

    def get(self, url, **kw):
        return self.request("GET", url, **kw)

    def post(self, url, **kw):
        return self.request("POST", url, **kw)

    def put(self, url, **kw):
        return self.request("PUT", url, **kw)

    def delete(self, url, **kw):
        return self.request("DELETE", url, **kw)


@pytest.fixture
def client(store):
    app = FastAPI()
    app.include_router(chatbot.router, prefix="/api/v1/chatbot")
    app.include_router(meal.router, prefix="/api/v1/meal-plan")
    app.include_router(recipe.router, prefix="/api/v1/recipe")
    return SyncClient(app)
