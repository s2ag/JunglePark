# 🌴 Jungle Park — Board Games Online

A React Native (Expo) multiplayer board game app featuring classic games with real-time online play.

## 🎮 Games

| Game | Players | Description |
|------|---------|-------------|
| 🎲 Ludo | 2–4 | Classic strategy board game with token captures |
| 🐍 Snake & Ladders | 2–4 | Race to 100 with snakes and ladders |
| ✖️ Tic Tac Toe | 2 | Quick tactical game |

## ✨ Features

- **Online Multiplayer** — Create/join rooms with 6-digit codes, real-time sync via Firebase
- **Offline Pass & Play** — Play locally with friends on one device
- **Beautiful UI** — Dark theme with smooth animations and emoji avatars
- **Guest Login** — Jump in instantly without creating an account
- **Emoji Reactions** — Send reactions during games
- **Leaderboard** — Track wins and stats

## 🚀 Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v18+)
- [Expo CLI](https://docs.expo.dev/get-started/installation/)
- A Firebase project (see setup below)

### Installation

```bash
# Install dependencies
npm install

# Start the development server
npx expo start
```

### Running on devices

```bash
# iOS simulator
npx expo start --ios

# Android emulator
npx expo start --android

# Web browser
npx expo start --web
```

## 🔥 Firebase Setup

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create a new project (or use existing)
3. Enable the following services:
   - **Authentication** → Anonymous sign-in
   - **Firestore Database** → Create in test mode
   - **Realtime Database** → Create in test mode
4. Add a Web app and copy your config to `src/config/firebase.js`

## 📁 Project Structure

```
├── App.js                    # Root navigation & auth gate
├── index.js                  # Entry point
├── app.json                  # Expo configuration
├── metro.config.js           # Metro bundler config
├── src/
│   ├── config/
│   │   ├── firebase.js       # Firebase initialization
│   │   └── theme.js          # Colors, fonts, sizes, shadows
│   ├── services/
│   │   ├── auth.js           # Authentication service
│   │   └── rooms.js          # Room management (RTDB)
│   ├── game/
│   │   ├── ludo/LudoEngine.js
│   │   ├── snl/SnLEngine.js
│   │   └── ttt/TicTacToeEngine.js
│   ├── screens/
│   │   ├── AuthScreen.js
│   │   ├── HomeScreen.js
│   │   ├── LobbyScreen.js
│   │   ├── WaitingRoomScreen.js
│   │   ├── LudoGameScreen.js
│   │   ├── SnLGameScreen.js
│   │   ├── TicTacToeGameScreen.js
│   │   ├── ResultsScreen.js
│   │   ├── ProfileScreen.js
│   │   └── LeaderboardScreen.js
│   └── components/
│       ├── Dice.js
│       ├── PlayerAvatar.js
│       ├── ReactionsBar.js
│       ├── ludo/LudoBoard.js
│       └── snl/SnLBoard.js
└── assets/
    ├── icon.png
    ├── splash-icon.png
    └── favicon.png
```

## 🛠 Tech Stack

- **React Native** (0.85) with **Expo** (SDK 56)
- **Firebase** — Auth, Firestore, Realtime Database
- **React Navigation** — Stack navigator
- **react-native-svg** — Game boards
- **Animated API** — Smooth animations

## 📝 Scripts

| Command | Description |
|---------|-------------|
| `npm start` | Start Expo dev server |
| `npm run android` | Start on Android |
| `npm run ios` | Start on iOS |
| `npm run web` | Start on web |

## 📄 License

MIT License — see [LICENSE](./LICENSE) for details.
