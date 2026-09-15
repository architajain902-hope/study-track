"""Debug: what does the page show after attempting login?"""
import json
import os
import re
import sys
import time
import urllib.request
from playwright.sync_api import sync_playwright


def load_root_env():
    root_env = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), ".env")
    if os.path.exists(root_env):
        for line in open(root_env, encoding="utf-8"):
            m = re.match(r"^\s*([A-Za-z0-9_.]+)\s*=\s*(.*?)\s*$", line)
            if m and m.group(1) not in os.environ:
                os.environ[m.group(1)] = m.group(2)


load_root_env()
SUPA = os.environ.get("SUPABASE_URL")
SECRET = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")
if not SUPA or not SECRET:
    print("Missing SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY (set in .env or environment).", file=sys.stderr)
    raise SystemExit(1)

email = "debug.show.%d@gmail.com" % time.time_ns()
password = "debugpass123"

req = urllib.request.Request(
    f"{SUPA}/auth/v1/admin/users", method="POST",
    headers={"apikey": SECRET, "Authorization": f"Bearer {SECRET}", "Content-Type": "application/json"},
    data=json.dumps({"email": email, "password": password, "email_confirm": True, "user_metadata": {"full_name": "Debug"} }).encode(),
)
with urllib.request.urlopen(req) as r:
    uid = json.loads(r.read())["id"]
try:
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page(viewport={"width": 1280, "height": 800})
        page.goto("http://localhost:5173")
        page.wait_for_load_state("networkidle")
        page.get_by_placeholder("College email").fill(email)
        page.get_by_placeholder("Password").fill(password)
        page.locator("form").get_by_role("button", name="Log in").click()
        page.wait_for_timeout(4000)
        print("URL:", page.url)
        print("--- visible text (first 40 lines):")
        for t in page.locator("body").inner_text().splitlines()[:40]:
            t = t.strip()
            if t:
                print("   ", t.encode("ascii", "ignore").decode())
        page.screenshot(path="C:/Users/Pcc/Documents/study track/.shots/debug-login.png", full_page=True)
        browser.close()
finally:
    urllib.request.urlopen(urllib.request.Request(f"{SUPA}/auth/v1/admin/users/{uid}", method="DELETE",
        headers={"apikey": SECRET, "Authorization": f"Bearer {SECRET}"}))