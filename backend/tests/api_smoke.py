"""API smoke test for the running OneDW backend."""
import urllib.request
import json
import sys

BASE = "http://localhost:8000/api"
PASS = []
FAIL = []


def request(method, path, data=None, token=None):
    headers = {"Content-Type": "application/json"}
    if token:
        headers["Authorization"] = "Bearer " + token
    body = json.dumps(data).encode() if data else None
    req = urllib.request.Request(BASE + path, data=body, headers=headers, method=method)
    try:
        with urllib.request.urlopen(req, timeout=10) as r:
            return json.loads(r.read()), r.status
    except urllib.error.HTTPError as e:
        return json.loads(e.read()), e.code


def check(label, condition, detail=""):
    if condition:
        PASS.append(label)
        print(f"  PASS  {label}")
    else:
        FAIL.append(label)
        print(f"  FAIL  {label}  [{detail}]")


# -- 1. Admin login ---------------------------------------------------------
res, status = request("POST", "/auth/login", {"email": "admin@onedw.in", "password": "Admin@123"})
check("Admin login 200", status == 200, str(status))
check("Admin role", res.get("user", {}).get("role") == "admin", str(res.get("user", {})))
admin_token = res.get("access_token", "")

# -- 2. Admin dashboard -----------------------------------------------------
res, status = request("GET", "/admin/dashboard", token=admin_token)
check("Admin dashboard 200", status == 200, str(status))

# -- 3. Wrong password → 401 (not 500) --------------------------------------
res, status = request("POST", "/auth/login", {"email": "admin@onedw.in", "password": "wrongpass"})
check("Wrong password gives 401", status == 401, str(status))

# -- 4. Register new customer -----------------------------------------------
import random
uid = random.randint(10000, 99999)
res, status = request("POST", "/auth/register", {
    "name": "Test User",
    "email": f"testsmoke{uid}@test.com",
    "phone": "9876543210",
    "password": "Test@123",
    "role": "customer"
})
check("Register customer 201", status == 201, str(status))
user_token = res.get("access_token", "")

# -- 5. Wallet balance ------------------------------------------------------
res, status = request("GET", "/wallet", token=user_token)
check("Wallet GET 200", status == 200, str(status))

# -- 6. Apply promo code first time (SAVE50 = flat Rs 50) -------------------
res, status = request("POST", "/wallet/promo", {"code": "SAVE50", "booking_amount": 1000}, token=user_token)
check("Promo SAVE50 valid=True", res.get("valid") == True, str(res))
check("Promo SAVE50 status 200 not 500", status == 200, str(status))

# -- 7. Apply same code again — must return valid=False (no 500) ------------
res, status = request("POST", "/wallet/promo", {"code": "SAVE50", "booking_amount": 1000}, token=user_token)
check("Promo SAVE50 2nd use valid=False", res.get("valid") == False, str(res))
check("Promo SAVE50 2nd use status 200 not 500", status == 200, str(status))

# -- 8. Apply invalid promo code --------------------------------------------
res, status = request("POST", "/wallet/promo", {"code": "NOTEXIST", "booking_amount": 500}, token=user_token)
check("Invalid promo valid=False", res.get("valid") == False, str(res))

# -- Summary ----------------------------------------------------------------
print()
print(f"Results: {len(PASS)} passed, {len(FAIL)} failed")
if FAIL:
    print("FAILED:", FAIL)
    sys.exit(1)
else:
    print("All tests passed!")
