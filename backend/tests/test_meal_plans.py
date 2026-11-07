from tests.conftest import ALICE, BOB

MEALS = "/api/v1/meal-plan"


def plan(user_id, date="2025-01-06", meal_type="dinner"):
    return {"user_id": user_id, "date": date, "meal_type": meal_type, "recipe_title": "Pasta"}


def test_requires_authentication(client):
    assert client.get(f"{MEALS}/user/{ALICE}").status_code in (401, 403)
    assert client.post(f"{MEALS}/", json=plan(ALICE)).status_code in (401, 403)


def test_create_and_list_own_meal_plans(client, alice):
    res = client.post(f"{MEALS}/", json=plan(ALICE), headers=alice)
    assert res.status_code == 200, res.text
    assert res.json()["data"]["meal_type"] == "dinner"

    res = client.get(f"{MEALS}/user/{ALICE}", headers=alice)
    assert res.status_code == 200
    assert len(res.json()["data"]) == 1


def test_cannot_create_or_list_for_another_user(client, alice):
    assert client.post(f"{MEALS}/", json=plan(BOB), headers=alice).status_code == 403
    assert client.get(f"{MEALS}/user/{BOB}", headers=alice).status_code == 403


def test_cannot_touch_another_users_meal_plan(client, alice, bob):
    created = client.post(f"{MEALS}/", json=plan(BOB), headers=bob).json()["data"]
    plan_id = created["meal_plan_id"]

    assert client.get(f"{MEALS}/{plan_id}", headers=alice).status_code == 403
    res = client.put(f"{MEALS}/{plan_id}", json={"notes": "mine now"}, headers=alice)
    assert res.status_code == 403
    assert client.delete(f"{MEALS}/{plan_id}", headers=alice).status_code == 403

    assert client.get(f"{MEALS}/{plan_id}", headers=bob).status_code == 200


def test_owner_can_update_and_delete(client, alice):
    plan_id = client.post(f"{MEALS}/", json=plan(ALICE), headers=alice).json()["data"]["meal_plan_id"]

    res = client.put(f"{MEALS}/{plan_id}", json={"notes": "less salt"}, headers=alice)
    assert res.status_code == 200
    assert res.json()["data"]["notes"] == "less salt"

    assert client.delete(f"{MEALS}/{plan_id}", headers=alice).status_code == 200
    assert client.get(f"{MEALS}/{plan_id}", headers=alice).status_code == 404


def test_missing_meal_plan_returns_404(client, alice):
    assert client.get(f"{MEALS}/{'0' * 24}", headers=alice).status_code == 404


def test_week_view_is_scoped_to_owner(client, alice):
    client.post(f"{MEALS}/", json=plan(ALICE, "2025-01-06"), headers=alice)
    client.post(f"{MEALS}/", json=plan(ALICE, "2025-02-20"), headers=alice)

    body = {"user_id": ALICE, "start_date": "2025-01-06"}
    res = client.post(f"{MEALS}/week", json=body, headers=alice)
    assert res.status_code == 200
    assert [m["date"] for m in res.json()["data"]] == ["2025-01-06"]

    body["user_id"] = BOB
    assert client.post(f"{MEALS}/week", json=body, headers=alice).status_code == 403
