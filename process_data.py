#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Twilight Imperium Data Processing Script
Converts Excel data to optimized JSON format for web dashboard
"""

import pandas as pd
import json
from pathlib import Path

def process_ti_data():
    """Process Twilight Imperium Excel data into optimized JSON format"""

    # Mapping for faction short names to icon file names
    # (Some factions have spaces in their icon file names)
    ICON_NAME_MAP = {
        'Jol': 'Jol Nar',
        'Naaz': 'Naaz-Rokha',
        # Add more mappings as needed
    }

    print("Loading Excel data...")
    # Read the three sheets
    df_results = pd.read_excel("data/raw_data.xlsx", sheet_name="results")
    df_games = pd.read_excel("data/raw_data.xlsx", sheet_name="games")
    df_factions = pd.read_excel("data/raw_data.xlsx", sheet_name="factions")

    print(f"Loaded {len(df_games)} games, {len(df_results)} results, {len(df_factions)} factions")

    # Merge results with factions
    df_results = df_results.merge(df_factions, on="faction_short_name", how="left")

    # Build games list
    games = []
    for _, game_row in df_games.iterrows():
        game_id = game_row['game_id']

        # Get all players for this game
        game_results = df_results[df_results['game_id'] == game_id]

        players = []
        for _, player_row in game_results.iterrows():
            player = {
                "player_name": player_row['player_name'],
                "faction_short": player_row['faction_short_name'] if pd.notna(player_row['faction_short_name']) else None,
                "faction_full": player_row['faction_full_name'] if pd.notna(player_row['faction_full_name']) else None,
                "victory_points": int(player_row['victory_points']) if pd.notna(player_row['victory_points']) else None,
                "winner": bool(player_row['victory_points'] == game_row['game_max_victory_points']) if pd.notna(player_row['victory_points']) else False,
                "starting_position": int(player_row['starting_position']) if pd.notna(player_row.get('starting_position')) else None
            }
            players.append(player)

        # Count actual participants (non-null victory_points)
        n_players = sum(1 for p in players if p['victory_points'] is not None)

        game = {
            "game_id": game_id,
            "game_name": game_row['game_name'],
            "start_date": game_row['start_date'].strftime('%Y-%m-%d') if pd.notna(game_row['start_date']) else None,
            "end_date": game_row['end_date'].strftime('%Y-%m-%d') if pd.notna(game_row['end_date']) else None,
            "rounds": int(game_row['rounds']) if pd.notna(game_row['rounds']) else None,
            "max_victory_points": int(game_row['game_max_victory_points']),
            "n_players": n_players,
            "win_description": game_row['win_description'] if pd.notna(game_row.get('win_description')) else None,
            "players": players
        }
        games.append(game)

    # Sort games by start date
    games.sort(key=lambda x: x['start_date'] if x['start_date'] else '')

    # Get unique players (sorted by name)
    all_players = df_results['player_name'].unique().tolist()
    all_players.sort()

    # Build factions list
    factions = []
    for _, faction_row in df_factions.iterrows():
        short_name = faction_row['faction_short_name']
        # Use mapped icon name if available, otherwise use short name
        icon_name = ICON_NAME_MAP.get(short_name, short_name)

        faction = {
            "short": short_name,
            "full": faction_row['faction_full_name'],
            "icon": f"/icons/faction_icons/{icon_name}.png"
        }
        factions.append(faction)

    # Sort factions by short name
    factions.sort(key=lambda x: x['short'])

    # Build final data structure
    data = {
        "games": games,
        "players": all_players,
        "factions": factions
    }

    # Create output directory if it doesn't exist
    output_dir = Path("website/public/data")
    output_dir.mkdir(parents=True, exist_ok=True)

    # Write JSON file
    output_path = output_dir / "ti_data.json"
    with open(output_path, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)

    print(f"\nData processing complete!")
    print(f"Output written to: {output_path}")
    print(f"- {len(games)} games")
    print(f"- {len(all_players)} players")
    print(f"- {len(factions)} factions")

    # Calculate file size
    file_size = output_path.stat().st_size
    print(f"- File size: {file_size:,} bytes ({file_size/1024:.1f} KB)")

    return data

if __name__ == "__main__":
    process_ti_data()
