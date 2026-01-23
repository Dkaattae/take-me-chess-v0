# AI-Dec-Tools
## issues
1, when pawn move to the end of board, do not promote. currently bot got promote, but not player. 
2, verify that when all pawns move to the end of board, that player win, no matter of scores. 

## Project Idea
### story behind it
My kid goes to a chess club, where the teacher introduce take me chess, and encourage them to play at home. 
Do i look like i can play chess? 
So i have this game created using ai dev tools. 

### how to play
- pieces move like regular chess game.
- move pieces for opponant to capture it. if a player lost all pieces or only pawns moving to the end of board left, that player win.
- score calculation (not for winning). if player declare take me and the pieces got captured, the player get score. if the player declare take me but no pieces can be catured, the player lose 5 points.
- must click take me to declare take me status and win points. 

### functionality
- leaderboard: after playing, the game stats will be in leaderboard

## meet my team
<img width="580" height="383" alt="meet my team drawio" src="https://github.com/user-attachments/assets/cc8d8bac-5f9b-4e08-aa82-ae1e3acc7617" />


## UI/frontend

### UI

### frontend framework

### what does frontend do


## OPENAI spec

### what does spec do

## backend

### backend framework

### what does backend do

## database

### what does database do

## containrization

## how frontend and backend connected

## next step
- login: add login portal. if not login, use can still play the game and show up in leaderboard. if logged in, user could use realtime match and analysis feature
- realtime game match: connect two players online using WebSocket
- game analysis: have moves and scores dictated in database, and develop analysis strategy
