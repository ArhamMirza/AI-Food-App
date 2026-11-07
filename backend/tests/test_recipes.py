from tests.conftest import ALICE, BOB

RECIPES = "/api/v1/recipe"


def add_recipe(store, user_id, title="Curry"):
    rid = f"{len(store['recipes']) + 1:024x}"
    store["recipes"][rid] = {"_id": rid, "user_id": user_id, "title": title,
                             "content": {"text": "Cook it"}}
    return rid


def test_requires_authentication(client):
    assert client.get(f"{RECIPES}/user/{ALICE}").status_code in (401, 403)


def test_owner_can_list_and_read(client, store, alice):
    rid = add_recipe(store, ALICE)

    res = client.get(f"{RECIPES}/user/{ALICE}", headers=alice)
    assert res.status_code == 200
    assert [r["title"] for r in res.json()["data"]] == ["Curry"]

    res = client.get(f"{RECIPES}/{rid}", headers=alice)
    assert res.status_code == 200
    assert res.json()["data"]["recipe_id"] == rid


def test_cannot_list_another_users_recipes(client, alice):
    assert client.get(f"{RECIPES}/user/{BOB}", headers=alice).status_code == 403


def test_cannot_read_or_edit_another_users_recipe(client, store, alice):
    rid = add_recipe(store, BOB)

    assert client.get(f"{RECIPES}/{rid}", headers=alice).status_code == 403
    res = client.put(f"{RECIPES}/{rid}", json={"title": "x", "content": "y"}, headers=alice)
    assert res.status_code == 403
    assert store["recipes"][rid]["title"] == "Curry"


def test_owner_can_edit_recipe(client, store, alice):
    rid = add_recipe(store, ALICE)
    res = client.put(f"{RECIPES}/{rid}", json={"title": "Better curry", "content": "More spice"}, headers=alice)
    assert res.status_code == 200
    assert res.json()["data"]["title"] == "Better curry"


def test_missing_recipe_returns_404(client, alice):
    assert client.get(f"{RECIPES}/{'0' * 24}", headers=alice).status_code == 404
    res = client.put(f"{RECIPES}/{'0' * 24}", json={"title": "x", "content": "y"}, headers=alice)
    assert res.status_code == 404
