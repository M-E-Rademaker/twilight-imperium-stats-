\## General Task



I want to write an app/a website that shows game statistics of a game called Twilight Imperium 

that I've been play with my friends for the last 2 years. 



\## Background \& requirements

* I want to host the website on netlifly via a git repo
* I require a self-contained client-side app that i can deploy without needing some server-side computation. 
* There is already a sketch of a website. I like the styling and color choice and the fact that is is a bit geeky
* We play on https://www.twilightwars.com/ which is a website that lets you play Twilight Imperium.



\## Data



I have

* game Id, 
* the name of the game, 
* the name of each player that participated, 
* the number of points they scored, 
* the number of points required to win the game (thus determining the winner as the player that has scored points equal to the max points possible), 
* the faction the player was playing, 
* the date the game started, 
* the date the game ended 
* and the number of rounds it took to until the game finished.



The raw data is spread across three sheets in the excel data/raw\_data.xlsx. Here is a simple script i wrote to join the data together. Please feel free to take parts if its helpful. Note that its not clear wheaterh saving as json is what is best. Please choose a data format that is most efficient in terms of IO.


\### START
# -\*- coding: utf-8 -\*-

import pandas as pd

import numpy as np



df\_results  = pd.read\_excel("raw\_data.xlsx", sheet\_name="results")

df\_games    = pd.read\_excel("raw\_data.xlsx", sheet\_name="games")

df\_factions = pd.read\_excel("raw\_data.xlsx", sheet\_name="factions")

\# %% Combine

df = pd.DataFrame({

&nbsp;   "game\_id"     : np.repeat(df\_games.game\_id.unique(), len(df\_results.player\_name.unique())),

&nbsp;   "player\_name" : list(df\_results.player\_name.unique()) \* len(df\_games.game\_id.unique())

})



df = df.merge(df\_results, on = \["game\_id", "player\_name"], how = "left")

df = df.merge(df\_games, on = "game\_id", how = "left")

df = df.merge(df\_factions, on = "faction\_short\_name", how = "left")



\# %% Compute number of players of each game and add



df\_n\_players = df.groupby("game\_id", as\_index = False).player\_name.count()

df\_n\_players = df\_n\_players.rename(columns = {"player\_name" : "game\_n\_players"})

df = df.merge(df\_n\_players, on = "game\_id", how = "left")



\# %% Compute number of games a player played

df\["participated"] = df\["victory\_points"].notnull()

df\["winner"] = df\["victory\_points"] == df\["game\_max\_victory\_points"]



df\["cumulated\_n\_participated"]   = df.groupby("player\_name", as\_index = True, dropna = True).participated.cumsum()

df\["cumulated\_n\_winner"]         = df.groupby("player\_name", as\_index = False, dropna = True).winner.cumsum()

df\["cumulated\_overall\_win\_rate"] = df\["cumulated\_n\_winner"] / df\["cumulated\_n\_participated"]



\# %% Add columns and reorder



cols = \[

&nbsp;   "game\_id",

&nbsp;   "game\_name",

&nbsp;   "game\_max\_victory\_points",

&nbsp;   "game\_n\_players",

&nbsp;   "start\_date",

&nbsp;   "end\_date",

&nbsp;   "rounds",

&nbsp;   "player\_name",

&nbsp;   "faction\_short\_name",

&nbsp;   "faction\_full\_name",

&nbsp;   "victory\_points",

&nbsp;   "participated",

&nbsp;   "winner",

&nbsp;   "cumulated\_n\_participated",

&nbsp;   "cumulated\_n\_winner",

&nbsp;   "cumulated\_overall\_win\_rate"  

]



df = df\[cols]



\# %%

df.to\_json('twilight\_imperium\_data.json', orient='records', date\_format='iso')



\# %%

df = df.sort\_values(\["player\_name", "start\_date"])



\#### END



\## What I want to see 



The key metric is the win rate of a player, i.e., the number of wins / number of games a player played

However, to make suitable comparisons one should be able to filter and/or compare the rates talking the following dimensions into account

* &nbsp;	the faction played
* &nbsp;	the number of players that participate (in our case: 3, 4 or 5)
* &nbsp;	the player composition (it’s typically a combination of Manu, Thomas, Eric and Frank with Manu being part of all games)
* &nbsp;	weather it’s a 10 or 14 win points game



I also want to show a Chart with the name of the player on the x-axis and time on the y axis. The chart should visually show when a player was involved in at least one game.



Moreover I need a chart that shows the win rate of a player over time so we can track the progress.

