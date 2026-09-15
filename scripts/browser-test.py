"""Browser smoke test for ChatPlanner: login → task CRUD → streak → calendar → stats → logout."""
import json
import os
import re
import sys
import urllib.request
from playwright.sync_api import sync_playwright

BASE = "http://localhost:5173"


def load_root_env():
    """Load the gitignored repo-root .env file into os.environ (no-op if present)."""
    root_env = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), ".env")
    if not os.path.exists(root_env):
        return
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

SHOT_DIR = "C:/Users/Pcc/Documents/study track/.shots"

email = "browser.demo.%d@gmail.com" % __import__("time").time_ns()
password = "browserpass123"
passed = failed = 0


def check(name, cond, extra=""):
    global passed, failed
    if cond:
        passed += 1
        print(f"  PASS  {name}", flush=True)
    else:
        failed += 1
        print(f"  FAIL  {name}  {extra}", flush=True)


def admin_create(email, password):
    req = urllib.request.Request(
        f"{SUPA}/auth/v1/admin/users", method="POST",
        headers={"apikey": SECRET, "Authorization": f"Bearer {SECRET}", "Content-Type": "application/json"},
        data=json.dumps({"email": email, "password": password, "email_confirm": True, "user_metadata": {"full_name": "Browser Demo"}}).encode(),
    )
    with urllib.request.urlopen(req) as r:
        return json.loads(r.read())["id"]


def admin_delete(uid):
    req = urllib.request.Request(f"{SUPA}/auth/v1/admin/users/{uid}", method="DELETE",
                                 headers={"apikey": SECRET, "Authorization": f"Bearer {SECRET}"})
    try:
        urllib.request.urlopen(req)
    except Exception:
        pass


def main():
    global passed, failed
    uid = admin_create(email, password)

    try:
        with sync_playwright() as p:
            browser = p.chromium.launch(headless=True)
            ctx = browser.new_context(viewport={"width": 1280, "height": 800})
            page = ctx.new_page()

            # ── Login page ──
            page.goto(BASE)
            page.wait_for_load_state("networkidle")
            check("login page renders", page.get_by_text("ChatPlanner").first.is_visible())
            page.screenshot(path=f"{SHOT_DIR}/login.png")

            page.get_by_placeholder("College email").fill(email)
            page.get_by_placeholder("Password").fill(password)
            page.locator("form").get_by_role("button", name="Log in").click()

            # Wait for dashboard to appear (subtitle or the header title)
            try:
                page.get_by_text("Your study board").wait_for(state="visible", timeout=8000)
            except Exception:
                page.screenshot(path=f"{SHOT_DIR}/after-login.png", full_page=True)
                page.locator("body").inner_text().encode("ascii", "ignore").decode()
                print("Page content (ascii):", file=sys.stderr)
                for line in page.locator("body").inner_text().splitlines()[:30]:
                    print("  ", line.encode("ascii", "ignore").decode(), file=sys.stderr)
                raise

            check("dashboard renders", True)
            check("empty state", page.get_by_text("Your board is empty.").is_visible())

            # ── Create task via composer (opens modal with pre-filled title) ──
            composer = page.get_by_placeholder("Type a task or /task …")
            composer.fill("Math homework exercise 7.3")
            page.get_by_role("button", name="Send task").click()
            page.wait_for_timeout(600)
            # Modal opens with title pre-filled — confirm it
            page.locator("[role='dialog'] button[type='submit']").click()
            page.wait_for_timeout(1500)
            check("task appears in feed", page.get_by_text("Math homework exercise 7.3").first.is_visible())

            # ── Add another task via modal ──
            page.get_by_title("Add task").click()
            page.wait_for_timeout(500)
            page.get_by_placeholder("Task title").fill("Chemistry lab report")
            page.get_by_placeholder("Subject (e.g. Math)").fill("Chemistry")
            page.locator("[role='dialog'] button[type='submit']").click()
            page.wait_for_timeout(1200)
            check("modal task appears", page.get_by_text("Chemistry lab report").first.is_visible())

            # ── Add exam ──
            page.get_by_title("Add exam").click()
            page.wait_for_timeout(500)
            page.locator("[role='dialog'] input").first.fill("Physics")
            page.locator("[role='dialog'] input[type='datetime-local']").fill("2026-10-05T09:30")
            page.locator("[role='dialog'] button[type='submit']").click()
            page.wait_for_timeout(1200)
            check("exam appears", page.get_by_text("Physics").first.is_visible())
            page.screenshot(path=f"{SHOT_DIR}/feed.png", full_page=True)

            # ── Complete a task (streak) ──
            page.get_by_label("Mark complete").first.click()
            page.wait_for_timeout(2000)
            check("streak appears", page.locator("text=day streak").first.is_visible())
            page.screenshot(path=f"{SHOT_DIR}/streak.png", full_page=True)

            # ── Calendar page ──
            page.get_by_role("link", name="Calendar").click()
            page.wait_for_load_state("networkidle")
            page.wait_for_timeout(800)
            check("calendar renders", page.locator("body").inner_text().encode("ascii","ignore").decode().find("Nothing planned") != -1
                  or page.locator("body").inner_text().encode("ascii","ignore").decode().find("Mon") != -1)
            page.screenshot(path=f"{SHOT_DIR}/calendar.png", full_page=True)

            # ── Stats page ──
            page.get_by_role("link", name="Stats").click()
            page.wait_for_load_state("networkidle")
            page.wait_for_timeout(800)
            check("stats renders", page.locator("body").inner_text().encode("ascii","ignore").decode().find("Last 60 days") != -1)
            check("best streak shown", page.locator("body").inner_text().encode("ascii","ignore").decode().find("Best streak") != -1)
            page.screenshot(path=f"{SHOT_DIR}/stats.png", full_page=True)

            # ── Profile + logout ──
            page.get_by_role("link", name="Profile").click()
            page.wait_for_load_state("networkidle")
            page.wait_for_timeout(800)
            page_text = page.locator("body").inner_text().encode("ascii","ignore").decode()
            check("profile shows email", page_text.find(email) != -1)
            page.get_by_role("button", name="Log out").click()
            page.wait_for_load_state("networkidle")
            page.wait_for_timeout(1000)
            check("logged out", "login" in page.url or page.locator("body").inner_text().encode("ascii","ignore").decode().find("Sati Vidisha") != -1)

            browser.close()
    finally:
        admin_delete(uid)

    print(f"\nBROWSER RESULT: {passed} passed, {failed} failed", flush=True)
    raise SystemExit(1 if failed else 0)


if __name__ == "__main__":
    main()