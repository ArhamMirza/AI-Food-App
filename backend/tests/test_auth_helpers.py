import pytest
from fastapi import HTTPException

from app.core.auth import ensure_owner
from app.core.security import create_access_token, verify_token


def test_ensure_owner_accepts_matching_id():
    ensure_owner("abc", "abc")


def test_ensure_owner_rejects_other_user():
    with pytest.raises(HTTPException) as exc:
        ensure_owner("abc", "xyz")
    assert exc.value.status_code == 403


def test_access_token_round_trip():
    token = create_access_token({"sub": "user-1", "type": "access"})
    payload = verify_token(token)
    assert payload["sub"] == "user-1"
    assert payload["type"] == "access"


def test_tampered_token_is_rejected():
    token = create_access_token({"sub": "user-1", "type": "access"})
    assert verify_token(token + "x") is None
