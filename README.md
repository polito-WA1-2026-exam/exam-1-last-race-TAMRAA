# Exam #1: "LAST RACE"

**Student:** s289234 TAMRA ABDALLAH

---

# React Client Application Routes

| Route | Page | Purpose |
|---------|---------|---------|
| `/` | HomePage | Displays game instructions and a preview of the metro network. Shows "Login to Play" for anonymous users or "Play the Game" for authenticated users. Anonymous users can only see the instructions and the network preview (not the full interactive map) |
| `/login` | LoginPage | Login form with email and password fields. Redirects to `/game` on successful authentication. Displays demo credentials for testing |
| `/game` | GamePage | Protected route – the main gameplay page. Manages the full game flow: loading metro data, planning phase (90-second timer, route building), execution phase (journey animation with random events), and game over modal |
| `/leaderboard` | LeaderboardPage | Displays the global ranking of top players (top 10 scores). If authenticated, also shows the user's personal game history (total games played, best score, and match history) |

---

# API Server

## Public Routes (No Authentication Required)

| Method | Endpoint | Request | Response |
|----------|-------------|-------------|-------------|
| GET | `/api/metro` | None | `{ lines, stations, connections, stationLines }` – Full network data including all lines, stations with coordinates, and connections between stations |
| GET | `/api/events` | None | `[ { id, name, description, coin_effect, probability } ]` – List of all events with their effects and probabilities |
| GET | `/api/leaderboard` | Query: `?limit=N` (default 10) | `{ scores: [ { id, username, score, rounds_completed, coins_remaining, played_at } ] }` – Top N scores from all users |

## Protected Routes (Authentication Required)

| Method | Endpoint | Request | Response |
|----------|-------------|-------------|-------------|
| POST | `/api/login` | `{ email, password }` | `{ id, email, name }` – User object on success; 401 on failure |
| POST | `/api/logout` | None | `204 No Content` |
| GET | `/api/session/current` | None | Current authenticated user; 401 if not authenticated |
| POST | `/api/game/start` | None | Creates a new game session with random origin/destination |
| GET | `/api/game/session` | None | Returns active game session |
| POST | `/api/game/route` | `{ sessionId, route: [...] }` | Returns game results, journey events, score updates, or invalid route error |
| POST | `/api/game/end` | `{ sessionId }` | Saves and returns final score |
| GET | `/api/leaderboard/me` | None | Current user's game history and statistics |

---

# Database Tables

| Table | Purpose |
|---------|---------|
| `user` | Stores registered users with hashed passwords using `crypto.scrypt()`. |
| `line` | Metro lines with unique ID, name, and color |
| `station` | Metro stations with coordinates |
| `station_line` | Junction table linking stations to lines |
| `connection` | Direct station-to-station connections |
| `event` | Random events with probabilities and coin effects |
| `game_session` | Active game sessions |
| `game_score` | Completed games used for leaderboard rankings |

---

# Main React Components

| Component | File | Purpose |
|------------|------------|------------|
| AuthProvider | `components/AuthContext.jsx` | Provides authentication state using React Context |
| Header | `components/Header.jsx` | Navigation bar with login/logout and navigation links |
| Footer | `components/Footer.jsx` | Footer with copyright and attribution |
| MetroMap | `components/MetroMap.jsx` | SVG metro network renderer |
| Timer | `components/Timer.jsx` | 90-second countdown timer |
| CoinCounter | `components/CoinCounter.jsx` | Displays current coins and animated changes |
| RouteBuilder | `components/RouteBuilder.jsx` | Route construction interface |
| JourneyAnimation | `components/JourneyAnimation.jsx` | Animates player journey execution |
| EventOverlay | `components/EventOverlay.jsx` | Displays random events during travel |
| GameOverModal | `components/GameOverModal.jsx` | End-of-game summary modal |
| HomePage | `pages/HomePage.jsx` | Landing page |
| LoginPage | `pages/LoginPage.jsx` | Authentication page |
| GamePage | `pages/GamePage.jsx` | Main game orchestration page |
| LeaderboardPage | `pages/LeaderboardPage.jsx` | Rankings and user statistics |

---

# Screenshots

> Place screenshots in the `img/` folder

## Gameplay Screenshot

![Gameplay](./img/gameplay.png)

Planning phase showing metro map, timer, route builder, and mission display

## Leaderboard Screenshot

![Leaderboard](./img/leaderboard.png)

Leaderboard page displaying rankings and player statistics

---

# Users Credentials

| Username | Email | Password |
|-----------|-----------|-----------|
| Mario | mario@polito.it | password123 |
| Luigi | luigi@polito.it | password123 |
| Peach | peach@polito.it | password123 |

---

## Debugging Assistance

Used AI to diagnose and resolve issues such as SQLite constraint violations and asynchronous database operations


---

# How to Run the Application

## Prerequisites

- Node.js 24.x LTS
- npm or yarn
- nodemon

## Server Setup

```bash
cd server
npm install
npm run seed
npm start
```

Server runs on:

```text
http://localhost:3000
```

## Client Setup

```bash
cd client
npm install
npm run dev
```

Client runs on:

```text
http://localhost:5173
```

## Access the Application

1. Open `http://localhost:5173`
2. Login using one of the provided accounts
3. Start playing

---

# Metro Network (Torino Data)

## Lines

| Line | Name | Color | Stations |
|------|------|------|------|
| 🔴 R | Linea Rossa | #E53935 | Centrale → Porta Velaria → Crocevia del Falco → Piazza delle Lanterne → Porta Nuova |
| 🔵 B | Linea Blu | #1E88E5 | Fontana Oscura → Borgo Sereno → Centrale → Viale dei Mosaici → Lingotto |
| 🟢 G | Linea Verde | #43A047 | Porta Velaria → Fontana Oscura → Torre Cinerea → Campo dell'Eco → Cenisia |
| 🟡 Y | Linea Gialla | #FDD835 | Piazza delle Lanterne → Torre Cinerea → Viale dei Mosaici → Campo dell'Eco → Rebaudengo |

## Interchange Stations

- Centrale (Red, Blue)
- Porta Velaria (Red, Green)
- Fontana Oscura (Blue, Green)
- Piazza delle Lanterne (Red, Yellow)
- Torre Cinerea (Green, Yellow)
- Viale dei Mosaici (Blue, Yellow)

---

# Course Requirements Checklist

| Requirement | Status |
|------------|------------|
| Two-server pattern (React + Express) | ✅ |
| React 19 with Strict Mode | ✅ |
| Node.js 24.x LTS with Express | ✅ |
| SQLite database | ✅ |
| Passport.js authentication with session cookies | ✅ |
| crypto.scrypt() password hashing | ✅ |
| CORS configured | ✅ |
| 4+ metro lines | ✅ |
| 12+ stations | ✅ |
| 3+ interchange stations | ✅ |
| 8+ events with probabilities | ✅ |
| 3+ registered users | ✅ |
| 2+ users with pre-played games | ✅ |
| SPA without page reloads | ✅ |
| Desktop browser design | ✅ |
| Data validation | ✅ |
| README.md complete | ✅ |

---

# Project Structure

```text
race-the-rails/
├── README.md
├── server/
│   ├── db.mjs
│   ├── dao-user.mjs
│   ├── dao.mjs
│   ├── schema.sql
│   ├── seed.mjs
│   ├── server.mjs
│   └── package.json
└── client/
    ├── index.html
    ├── vite.config.js
    ├── package.json
    └── src/
        ├── main.jsx
        ├── index.css
        ├── App.jsx
        ├── lib/
        │   └── API.js
        ├── components/
        │   ├── AuthContext.jsx
        │   ├── Header.jsx
        │   ├── Footer.jsx
        │   ├── MetroMap.jsx
        │   ├── Timer.jsx
        │   ├── CoinCounter.jsx
        │   ├── RouteBuilder.jsx
        │   ├── JourneyAnimation.jsx
        │   ├── EventOverlay.jsx
        │   └── GameOverModal.jsx
        └── pages/
            ├── HomePage.jsx
            ├── LoginPage.jsx
            ├── GamePage.jsx
            └── LeaderboardPage.jsx
```

---

# License

This project was developed as part of the **Web Applications** course at **Politecnico di Torino**.