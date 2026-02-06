# -*- coding: utf-8 -*-
"""
Transform Twilight Imperium data into the structure expected by the React app
"""
import pandas as pd
import numpy as np
import json
from pathlib import Path

# Read raw data
df_results = pd.read_excel("data/raw_data.xlsx", sheet_name="results")
df_games = pd.read_excel("data/raw_data.xlsx", sheet_name="games")
df_factions = pd.read_excel("data/raw_data.xlsx", sheet_name="factions")

# Combine data (same as original script)
df = pd.DataFrame({
    "game_id": np.repeat(df_games.game_id.unique(), len(df_results.player_name.unique())),
    "player_name": list(df_results.player_name.unique()) * len(df_games.game_id.unique())
})

df = df.merge(df_results, on=["game_id", "player_name"], how="left")
df = df.merge(df_games, on="game_id", how="left")
df = df.merge(df_factions, on="faction_short_name", how="left")

# Compute number of players per game
df_n_players = df.groupby("game_id", as_index=False).player_name.count()
df_n_players = df_n_players.rename(columns={"player_name": "game_n_players"})
df = df.merge(df_n_players, on="game_id", how="left")

# Compute participation and winner stats
df["participated"] = df["victory_points"].notnull()
df["winner"] = df["victory_points"] == df["game_max_victory_points"]

# Now transform into nested structure for the web app
games_list = []

for game_id in df["game_id"].unique():
    game_df = df[df["game_id"] == game_id].copy()

    # Get game info (same for all rows)
    game_info = game_df.iloc[0]

    # Build players array for this game
    players = []
    for _, player_row in game_df.iterrows():
        if pd.notna(player_row["victory_points"]):  # Only include players who participated
            players.append({
                "player_name": player_row["player_name"],
                "faction_short": player_row["faction_short_name"] if pd.notna(player_row["faction_short_name"]) else None,
                "faction_full": player_row["faction_full_name"] if pd.notna(player_row["faction_full_name"]) else None,
                "victory_points": int(player_row["victory_points"]) if pd.notna(player_row["victory_points"]) else None,
                "winner": bool(player_row["winner"])
            })

    # Sort players by victory points (descending)
    players.sort(key=lambda p: p["victory_points"], reverse=True)

    games_list.append({
        "game_id": game_info["game_id"],
        "game_name": game_info["game_name"],
        "start_date": game_info["start_date"].isoformat() if pd.notna(game_info["start_date"]) else None,
        "end_date": game_info["end_date"].isoformat() if pd.notna(game_info["end_date"]) else None,
        "rounds": int(game_info["rounds"]) if pd.notna(game_info["rounds"]) else None,
        "max_victory_points": int(game_info["game_max_victory_points"]),
        "n_players": len(players),
        "players": players
    })

# Sort games by start date
games_list.sort(key=lambda g: g["start_date"] if g["start_date"] else "")

# Get unique players (those who actually participated)
players_set = set()
for game in games_list:
    for player in game["players"]:
        players_set.add(player["player_name"])
players_list = sorted(list(players_set))

# Get unique factions
factions_dict = {}
for _, row in df_factions.iterrows():
    if pd.notna(row["faction_short_name"]):
        factions_dict[row["faction_short_name"]] = {
            "short": row["faction_short_name"] if pd.notna(row["faction_short_name"]) else None,
            "full": row["faction_full_name"] if pd.notna(row["faction_full_name"]) else None,
            "icon": f"/icons/faction_icons/{row['faction_short_name']}.png"
        }
factions_list = list(factions_dict.values())

# Create final structure
output_data = {
    "games": games_list,
    "players": players_list,
    "factions": factions_list
}

# Function to replace NaN with None recursively
def clean_nan(obj):
    if isinstance(obj, dict):
        return {k: clean_nan(v) for k, v in obj.items()}
    elif isinstance(obj, list):
        return [clean_nan(item) for item in obj]
    elif isinstance(obj, float) and np.isnan(obj):
        return None
    else:
        return obj

output_data = clean_nan(output_data)

# Write to JSON
output_path = Path("website/public/data/ti_data.json")
output_path.parent.mkdir(parents=True, exist_ok=True)

with open(output_path, 'w', encoding='utf-8') as f:
    json.dump(output_data, f, indent=2, ensure_ascii=False)

print(f"[OK] Processed {len(games_list)} games")
print(f"[OK] Found {len(players_list)} players: {', '.join(players_list)}")
print(f"[OK] Found {len(factions_list)} factions")
print(f"[OK] Data written to {output_path}")
