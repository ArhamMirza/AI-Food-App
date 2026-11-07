from tests.conftest import ALICE, BOB, bearer

CHAT = "/api/v1/chatbot/chat"


def make_conversation(client, headers, user_id):
    res = client.post(f"{CHAT}/create", params={"user_id": user_id}, headers=headers)
    assert res.status_code == 200, res.text
    return res.json()["conversation_id"]


def test_requests_without_token_are_rejected(client):
    assert client.get(f"{CHAT}/user/{ALICE}").status_code in (401, 403)
    assert client.get(f"{CHAT}/some-id").status_code in (401, 403)
    res = client.post(f"{CHAT}/create", params={"user_id": ALICE})
    assert res.status_code in (401, 403)


def test_refresh_token_cannot_be_used_as_access_token(client):
    res = client.get(f"{CHAT}/user/{ALICE}", headers=bearer(ALICE, refresh=True))
    assert res.status_code == 401


def test_owner_can_create_and_read_conversation(client, alice):
    conv_id = make_conversation(client, alice, ALICE)
    res = client.get(f"{CHAT}/{conv_id}", headers=alice)
    assert res.status_code == 200
    assert res.json()["conversation_id"] == conv_id


def test_cannot_create_conversation_for_another_user(client, alice):
    res = client.post(f"{CHAT}/create", params={"user_id": BOB}, headers=alice)
    assert res.status_code == 403


def test_cannot_list_another_users_conversations(client, alice):
    for suffix in ("", "/ids", "/summary"):
        res = client.get(f"{CHAT}/user/{BOB}{suffix}", headers=alice)
        assert res.status_code == 403, suffix


def test_owner_can_list_own_conversations(client, alice):
    make_conversation(client, alice, ALICE)
    res = client.get(f"{CHAT}/user/{ALICE}", headers=alice)
    assert res.status_code == 200
    assert len(res.json()) == 1


def test_cannot_read_modify_or_delete_another_users_conversation(client, alice, bob):
    conv_id = make_conversation(client, bob, BOB)

    assert client.get(f"{CHAT}/{conv_id}", headers=alice).status_code == 403
    res = client.put(f"{CHAT}/{conv_id}/title", json={"title": "hijacked"}, headers=alice)
    assert res.status_code == 403
    res = client.put(f"{CHAT}/{conv_id}/message/0", json={"content": "x"}, headers=alice)
    assert res.status_code == 403
    assert client.delete(f"{CHAT}/{conv_id}", headers=alice).status_code == 403

    # Still intact for the real owner.
    assert client.get(f"{CHAT}/{conv_id}", headers=bob).status_code == 200


def test_owner_can_rename_and_delete(client, alice):
    conv_id = make_conversation(client, alice, ALICE)
    res = client.put(f"{CHAT}/{conv_id}/title", json={"title": "Dinner ideas"}, headers=alice)
    assert res.status_code == 200
    assert res.json()["title"] == "Dinner ideas"
    assert client.delete(f"{CHAT}/{conv_id}", headers=alice).status_code == 200
    assert client.get(f"{CHAT}/{conv_id}", headers=alice).status_code == 404


def test_unknown_conversation_returns_404(client, alice):
    assert client.get(f"{CHAT}/does-not-exist", headers=alice).status_code == 404


def test_chat_message_requires_matching_user(client, alice):
    params = {"user_id": BOB, "search": "false", "search_type": "recipe"}
    res = client.post(CHAT, params=params, json={"message": "hi"}, headers=alice)
    assert res.status_code == 403


def test_chat_message_works_for_owner(client, alice):
    params = {"user_id": ALICE, "search": "false", "search_type": "recipe"}
    res = client.post(CHAT, params=params, json={"message": "hi"}, headers=alice)
    assert res.status_code == 200
    assert res.json()["response"] == "ok"


def test_cannot_chat_in_another_users_conversation(client, alice, bob):
    conv_id = make_conversation(client, bob, BOB)
    params = {"user_id": ALICE, "conversation_id": conv_id,
              "search": "false", "search_type": "recipe"}
    res = client.post(CHAT, params=params, json={"message": "hi"}, headers=alice)
    assert res.status_code == 403


def test_save_recipe_only_for_self(client, alice):
    body = {"user_id": BOB, "title": "Soup", "content": "Boil water"}
    assert client.post(f"{CHAT}/save-recipe", json=body, headers=alice).status_code == 403

    body["user_id"] = ALICE
    res = client.post(f"{CHAT}/save-recipe", json=body, headers=alice)
    assert res.status_code == 200
    assert res.json()["title"] == "Soup"
