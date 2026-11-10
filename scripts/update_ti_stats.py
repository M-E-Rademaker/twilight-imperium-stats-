#!/usr/bin/env python3
"""
TI Stats Updater

Fetches finished group games from twilightwars.com and appends them to
data/games.csv and data/results.csv. The website reads these CSV files
directly at build time, so committing them is all that is needed to deploy.

Credentials are read from the environment (TW_EMAIL, TW_PASSWORD) or from a
`.env` file in the repository root (see .env.example). Never commit them.

Usage:
    python scripts/update_ti_stats.py                 # all new games, commit + push
    python scripts/update_ti_stats.py <game_id>       # one specific game
    python scripts/update_ti_stats.py --no-push       # commit only
    python scripts/update_ti_stats.py --dry-run       # fetch + print, write nothing
    python scripts/update_ti_stats.py --non-interactive   # no prompts (used in CI)
"""

from __future__ import annotations

import argparse
import csv
import os
import subprocess
import sys
from datetime import datetime, timezone
from pathlib import Path

import requests

BASE = "https://www.twilightwars.com"
REPO = Path(__file__).resolve().parent.parent
DATA = REPO / "data"
GAMES_CSV = DATA / "games.csv"
RESULTS_CSV = DATA / "results.csv"
FACTIONS_CSV = DATA / "factions.csv"

# twilightwars username -> name used on the dashboard
USERNAME_MAP = {
    "ManolosMagnos": "Manu",
    "Thomas": "Thomas",
    "Keineui": "Eric",
    "L1z4Rd": "Frank",
    "Starki": "Starki",
}

# Faction names as twilightwars reports them that differ from factions.csv full_name
FACTION_ALIASES = {
    "The L1Z1X Mindset": "L1Z1X",
    "The Sardakk N'orr": "Sardakk",
    "The Keleres": "Keleres",
}

# Games manually excluded from the dashboard
EXCLUDED_GAME_IDS = {
    "69256c61fa804c7cd64e3d0f",  # Die lustigen 5 - marked irrelevant
    "69554f3a40e20c90c204b346",  # Respect ;-) - Ketherus game
    "6925531afa804c7cd63c3e87",  # not a group game; excluded 2026-11-10 with all games not imported by then
}

# All of these players must be present for a game to count as a group game
CORE_PLAYERS = {"ManolosMagnos", "Thomas", "Keineui"}  # Manu, Thomas, Eric

GAME_COLUMNS = ["game_id", "game_name", "start_date", "end_date", "rounds", "max_victory_points",
                "win_category", "winner_had_support", "game_medium", "win_description"]
RESULT_COLUMNS = ["game_id", "player_name", "faction", "victory_points", "starting_position"]


# --------------------------------------------------------------------------- config

def load_dotenv(path: Path) -> None:
    """Minimal .env loader (KEY=VALUE per line) so no extra dependency is needed."""
    if not path.exists():
        return
    for line in path.read_text(encoding="utf-8").splitlines():
        line = line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        key, value = line.split("=", 1)
        os.environ.setdefault(key.strip(), value.strip().strip('"').strip("'"))


def credentials() -> tuple[str, str]:
    load_dotenv(REPO / ".env")
    email, password = os.environ.get("TW_EMAIL"), os.environ.get("TW_PASSWORD")
    if not email or not password:
        sys.exit("Missing TW_EMAIL / TW_PASSWORD. Set them in the environment or in .env (see .env.example).")
    return email, password


def faction_lookup() -> dict[str, str]:
    """full name -> short name, built from factions.csv plus aliases."""
    with FACTIONS_CSV.open(encoding="utf-8", newline="") as f:
        lookup = {row["full_name"]: row["faction"] for row in csv.DictReader(f)}
    return {**lookup, **FACTION_ALIASES}


# --------------------------------------------------------------------------- twilightwars

def login(email: str, password: str) -> tuple[requests.Session, list[str]]:
    """Log in with a headless browser, return an authenticated session and the profile's game ids."""
    from playwright.sync_api import sync_playwright

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        page.goto(f"{BASE}/login", wait_until="networkidle")
        page.fill("input[name=email]", email)
        page.fill("input[name=password]", password)
        page.click("button[type=submit]")
        page.wait_for_load_state("networkidle")
        cookies = {c["name"]: c["value"] for c in page.context.cookies()}

        page.goto(f"{BASE}/u/me", wait_until="networkidle")
        game_ids: list[str] = []
        for link in page.query_selector_all("a"):
            href = link.get_attribute("href") or ""
            if href.startswith("/games/"):
                gid = href.removeprefix("/games/").strip()
                if gid and gid not in game_ids:
                    game_ids.append(gid)
        browser.close()

    if not cookies:
        sys.exit("Login failed: no cookies received.")
    session = requests.Session()
    session.cookies.update(cookies)
    return session, game_ids


def win_category_from_phase(phase: str | None) -> str:
    phase = (phase or "").lower()
    if "action" in phase:
        return "Aktionsphase"
    if "agenda" in phase:
        return "Agendaphase"
    return "Statusphase"


def winner_had_support(summary: dict, players_data: list[dict], log: list[dict]) -> int:
    """1 if the winner's VP cannot be fully explained by objectives, custodians and Imperial."""
    winner_doc_id = summary.get("winner")
    winner = next((p for p in players_data if p["_id"] == winner_doc_id), None)
    if not winner:
        return 0

    winner_user_id = winner["user"]["_id"]
    counted = 0
    for obj in summary.get("publicObjectives", []):
        counted += sum(obj["victoryPoints"] for s in obj.get("scores", []) if s["playerId"] == winner_doc_id)
    for obj in winner.get("revealedSecretObjectives", []):
        counted += sum(obj["victoryPoints"] for s in obj.get("scores", []) if s["playerId"] == winner_doc_id)
    if winner.get("hasCustodiansToken"):
        counted += 1

    # Imperial: +1 VP when played while controlling Mecatol Rex
    mecatol_holder = None
    for event in reversed(log):  # log is newest-first
        ev, user, details = event.get("event", ""), event.get("user"), event.get("details", {})
        if ev == "established control" and "Mecatol Rex" in (details.get("planetNames") or []):
            mecatol_holder = user
        if (ev == "primary ability resolved" and details.get("strategyCard") == "Imperial"
                and user == winner_user_id and mecatol_holder == winner_user_id):
            counted += 1

    return 1 if winner.get("victoryPoints", 0) - counted > 0 else 0


def fetch_game(session: requests.Session, game_id: str, factions: dict[str, str]):
    """Return (game_row, result_rows) or None if this is not a finished group game."""
    summary = session.get(f"{BASE}/games/{game_id}/summary", timeout=30).json()
    players_data = session.get(f"{BASE}/games/{game_id}/players", timeout=30).json()

    usernames = {p["user"]["username"] for p in players_data}
    if not CORE_PLAYERS.issubset(usernames):
        return None
    if not summary.get("winner"):
        print("  Skipping (game not finished yet).")
        return None

    log = session.get(f"{BASE}/games/{game_id}/log", timeout=30).json()

    def day(ts):
        return datetime.fromtimestamp(ts, tz=timezone.utc).date().isoformat()

    game_row = {
        "game_id": game_id,
        "game_name": summary["name"].strip(),
        "start_date": day(summary["createdAt"]),
        "end_date": day(summary.get("completedAt", summary["updatedAt"])),
        "rounds": summary["round"],
        "max_victory_points": summary["victoryPoints"],
        "win_category": win_category_from_phase(summary.get("phase")),
        "winner_had_support": winner_had_support(summary, players_data, log),
        "game_medium": "online",
        "win_description": "",
    }

    result_rows = []
    for p in sorted(players_data, key=lambda p: p.get("number", 0)):
        username = p["user"]["username"]
        faction_full = p.get("faction", "")
        faction = factions.get(faction_full)
        if not faction:
            sys.exit(f"Unknown faction '{faction_full}' ({username}). Add it to data/factions.csv "
                     f"(and an icon to website/public/icons/factions) or to FACTION_ALIASES.")
        result_rows.append({
            "game_id": game_id,
            "player_name": USERNAME_MAP.get(username, username),
            "faction": faction,
            "victory_points": p.get("victoryPoints", 0),
            "starting_position": p.get("number"),
        })
    return game_row, result_rows


# --------------------------------------------------------------------------- csv + git

def existing_game_ids() -> set[str]:
    with GAMES_CSV.open(encoding="utf-8", newline="") as f:
        return {row["game_id"] for row in csv.DictReader(f)}


def append_rows(path: Path, columns: list[str], rows: list[dict]) -> None:
    with path.open("a", encoding="utf-8", newline="") as f:
        csv.DictWriter(f, fieldnames=columns, lineterminator="\n").writerows(rows)


def git(*args: str) -> None:
    subprocess.run(["git", *args], cwd=REPO, check=True)


# --------------------------------------------------------------------------- main

def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("game_id", nargs="?", help="process only this game id")
    parser.add_argument("--no-push", action="store_true", help="commit but do not push")
    parser.add_argument("--no-commit", action="store_true", help="write CSVs but do not commit")
    parser.add_argument("--dry-run", action="store_true", help="fetch and print, write nothing")
    parser.add_argument("--non-interactive", action="store_true",
                        help="never prompt (default when not attached to a terminal or in CI)")
    args = parser.parse_args()
    interactive = not args.non_interactive and sys.stdin.isatty() and not os.environ.get("CI")

    email, password = credentials()
    factions = faction_lookup()

    print("Logging in to twilightwars.com...")
    session, profile_game_ids = login(email, password)
    print(f"Found {len(profile_game_ids)} games on profile.")

    known = existing_game_ids()
    to_process = [args.game_id] if args.game_id else [
        gid for gid in profile_game_ids if gid not in known and gid not in EXCLUDED_GAME_IDS
    ]
    if args.game_id and args.game_id in known:
        sys.exit(f"Game {args.game_id} is already in {GAMES_CSV.name}.")
    if not to_process:
        print("No new games found. Dashboard is up to date!")
        return

    new_games, new_results = [], []
    for game_id in to_process:
        print(f"\nFetching game {game_id}...")
        fetched = fetch_game(session, game_id, factions)
        if fetched is None:
            print("  Skipping (not a finished group game).")
            continue
        game_row, result_rows = fetched
        print(f"  {game_row['game_name']}  ({game_row['start_date']} -> {game_row['end_date']}, "
              f"{game_row['rounds']} rounds, {game_row['win_category']})")
        print("  " + ", ".join(f"{r['player_name']} [{r['faction']}] {r['victory_points']} VP" for r in result_rows))

        if interactive:
            try:
                game_row["win_description"] = input("  Win description (optional, Enter to skip): ").strip()
            except EOFError:
                pass
        new_games.append(game_row)
        new_results.extend(result_rows)

    if not new_games:
        print("\nNo group games to add.")
        return
    if args.dry_run:
        print("\nDry run: nothing written.")
        return

    append_rows(GAMES_CSV, GAME_COLUMNS, new_games)
    append_rows(RESULTS_CSV, RESULT_COLUMNS, new_results)
    print(f"\n[OK] Added {len(new_games)} game(s) to {GAMES_CSV.relative_to(REPO)}")

    if args.no_commit:
        return
    names = ", ".join(g["game_name"] for g in new_games)
    git("add", str(GAMES_CSV), str(RESULTS_CSV))
    git("commit", "-m", f"Add game data: {names}")
    if not args.no_push:
        git("push")
        print("Pushed. Netlify will rebuild the dashboard shortly.")


if __name__ == "__main__":
    main()
