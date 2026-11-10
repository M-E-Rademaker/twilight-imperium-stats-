# -*- coding: utf-8 -*-
import pandas as pd
import numpy as np

df_results  = pd.read_excel("../data/raw_data.xlsx", sheet_name="results")
df_games    = pd.read_excel("../data/raw_data.xlsx", sheet_name="games")
df_factions = pd.read_excel("../data/raw_data.xlsx", sheet_name="factions")
# %% Combine
df = pd.DataFrame({
    "game_id"     : np.repeat(df_games.game_id.unique(), len(df_results.player_name.unique())),
    "player_name" : list(df_results.player_name.unique()) * len(df_games.game_id.unique())
})

df = df.merge(df_results, on = ["game_id", "player_name"], how = "left")
df = df.merge(df_games, on = "game_id", how = "left")
df = df.merge(df_factions, on = "faction_short_name", how = "left")

# %% Compute number of players of each game and add

df_n_players = df.groupby("game_id", as_index = False).player_name.count()
df_n_players = df_n_players.rename(columns = {"player_name" : "game_n_players"})
df = df.merge(df_n_players, on = "game_id", how = "left")

# %% Compute number of games a player played
df["participated"] = df["victory_points"].notnull()
df["winner"] = df["victory_points"] == df["game_max_victory_points"]

df["cumulated_n_participated"]   = df.groupby("player_name", as_index = True, dropna = True).participated.cumsum()
df["cumulated_n_winner"]         = df.groupby("player_name", as_index = False, dropna = True).winner.cumsum()
df["cumulated_overall_win_rate"] = df["cumulated_n_winner"] / df["cumulated_n_participated"]

# %% Add columns and reorder

cols = [
    "game_id",
    "game_name",
    "game_max_victory_points",
    "game_n_players",
    "start_date",
    "end_date",
    "rounds",
    "player_name",
    "faction_short_name",
    "faction_full_name",
    "victory_points",
    "participated",
    "winner",
    "cumulated_n_participated",
    "cumulated_n_winner",
    "cumulated_overall_win_rate"  
]

df = df[cols]

# %%
df.to_json('../website/public/data/ti_data.json', orient='records', date_format='iso')

# %%
df = df.sort_values(["player_name", "start_date"])
