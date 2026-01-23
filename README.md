# AI-Dec-Tools

## url
take-me-chess-v0-production.up.railway.app


## Project Idea
### story behind it
My kid goes to a chess club, where the teacher introduce take me chess, and encourage them to play at home. 
Do i look like i can play chess? 
So i have this game created using ai dev tools. 

### how to play
- Objective
The goal is to **lose all of your own pieces**.     
The first player with no pieces remaining **wins**.     

- Turn Structure
1. Select a piece and move it to a legal square.   
2. After moving, choose one:   
   - **End Turn**, or   
   - **Declare “Take Me”**   

- Piece Rules
Pieces move according to **standard chess rules**, with the exceptions below.   
**There is no check or checkmate**.   
The king has **no royal status** and may be captured.   
Capturing the king does **not** end the game.   

- Captures
Captures are **only mandatory when “Take Me” is declared**.   
If “Take Me” is declared:   
  The opponent **must capture** one of your pieces if possible.   
  Only **one piece may be captured per turn**.   
If “Take Me” is **not** declared:   
  Captures are **optional**, even if available.   

This is intentional and differs from giveaway chess.   

- Scoring (Optional)
Scoring applies **only** when “Take Me” is declared.   
If one of your pieces is captured, you **gain points**.   
If no capture is possible, you **lose 5 points**.   
Score does **not** affect winning or losing.   

- Pawn Promotion
Pawns must be promoted upon reaching the final rank.   
A pawn may be promoted to **any piece**, including a **king**.   
Multiple kings may exist on the board.   

- End of Game
A player **wins** when they have no pieces remaining.   
If a player has **no legal moves**, the game ends in a **draw (stalemate)**.   

- Limitations
Castling is not allowed.   
En passant is not supported.   

### functionality
- leaderboard: after playing, the game stats will be in leaderboard

## how to run locally
```
docker compose up --build
```

## meet my team
<img width="580" height="383" alt="meet my team drawio" src="https://github.com/user-attachments/assets/cc8d8bac-5f9b-4e08-aa82-ae1e3acc7617" />


## AI-Dev-Tools
- prompt generating: chatgpt
- UI/Frontend: v0
- backend/database/dockerization: antigravity
- deployment: railway


## UI/frontend

### Technology
- v0 -> React / Next.js
### what does frontend do
- Renders the UI (game board, buttons, leaderboard, etc)
- Handles user interactions (moving pieces, clicking buttons)
- Sends requests to the backend API
### how to run frontend locally
```
cd frontend
npm run dev
```

## OPENAPI spec

### what does spec do
- openapi spec is a contract published by the backend to describe the API endpoints, request/response formats, and other details.
- frontend uses this spec to make requests to the backend.

## backend

### Technology
- FastAPI + Uvicorn
- Antigravity

### what does backend do
- game logic
- leaderboard updates

### how to run backend locally
```
cd backend
make run
```

## database
### Technology
- PostgreSQL
### what does database do
- stores leaderboard data
- stores user data
- stores game data

## Reverse Proxy / Web Server
### Technology
- Nginx
### what does reverse proxy do
-  serves frontend static files
- proxies /api/* requrests to fastapi

## containrization
### Technology
- Docker
### what does containrization do
- packages the application and its dependencies into a container
- ensures consistent environment across different platforms

## Deployment
### Technology
- Railway
### what does deployment do
- deploys the application to the cloud
### public url
take-me-chess-v0-production.up.railway.app


## CI/CD
### Technology
- Railway
### what does CI/CD do
- automates the process of building, testing, and deploying the application


## next step
- login: add login portal. if not login, use can still play the game and show up in leaderboard. if logged in, user could use realtime match and analysis feature
- realtime game match: connect two players online using WebSocket
- game analysis: have moves and scores dictated in database, and develop analysis strategy
