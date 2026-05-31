# 🐍 Gesture Snake Game

> A browser-based Snake game controlled entirely by hand gestures using your webcam — no keyboard, no touch, just your hand.

![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=flat&logo=javascript&logoColor=black)
![Firebase](https://img.shields.io/badge/Firebase-FFCA28?style=flat&logo=firebase&logoColor=black)
![MediaPipe](https://img.shields.io/badge/MediaPipe-0097A7?style=flat&logo=google&logoColor=white)
![HTML5](https://img.shields.io/badge/HTML5-E34F26?style=flat&logo=html5&logoColor=white)

---

## 🎮 Live Demo

**[Play Now → augmented-snakegame.netlify.app](https://augmented-snakegame.netlify.app/)**

---

## ✨ Features

- 👋 **Gesture Control** — pinch your thumb and index finger and move your hand to steer the snake
- ⏸️ **Auto Pause** — game freezes instantly when your hand leaves the camera frame and resumes when it comes back
- 🏆 **Live Leaderboard** — top 10 scores stored in Firebase Firestore, updated in real time
- ⌨️ **Keyboard Fallback** — arrow keys and WASD work as a backup control method
- 📷 **Camera Preview** — live hand skeleton overlay shown in the corner so you can see what the model detects
- ⏱️ **Countdown Timer** — 3 second countdown before the game starts so you can position your hand
- 📱 **Responsive** — works on any screen size

---

## 🛠️ Tech Stack

| Technology | Purpose |
|---|---|
| **MediaPipe Hands** | Real-time hand landmark detection (21 points) |
| **HTML5 Canvas** | Game rendering |
| **Vanilla JavaScript** | Game logic, gesture detection |
| **Firebase Firestore** | Real-time database for scores and leaderboard |
| **CSS3** | UI styling with animations |
| **Netlify** | Deployment |

---

## 🕹️ How to Play

1. Open the game in **Chrome** or any modern browser
2. Click **PLAY** and allow camera access when prompted
3. **Pinch** your thumb and index finger together in front of the camera
4. **Move your pinched hand** in any direction to steer the snake
5. Eat the 🔴 red fruit to grow and score points
6. Avoid hitting the walls or your own tail
7. When the game ends, enter your name to save your score to the leaderboard

**Tips:**
- Good lighting on your hand improves detection significantly
- Keep your hand clearly in the camera frame
- Use slow, deliberate swipes rather than fast jittery ones
- A plain background behind your hand helps tracking accuracy

---

## 🚀 Run Locally

Since the game uses ES modules and requires camera access, it must be served over HTTP — simply double-clicking the HTML file won't work.

**Option 1 — VS Code Live Server (recommended)**
```bash
# 1. Clone the repo
git clone https://github.com/RidhamGupta1201/Augmented_Snake-Game.git
cd Augmented_Snake-Game

# 2. Open in VS Code
code .

# 3. Install the Live Server extension
# 4. Right-click index.html → Open with Live Server
# 5. Opens at http://localhost:5500
```

**Option 2 — npx serve**
```bash
git clone https://github.com/RidhamGupta1201/Augmented_Snake-Game.git
cd Augmented_Snake-Game
npx serve .
# Opens at http://localhost:3000
```

---

## 📁 Project Structure

```
Augmented_Snake-Game/
├── index.html       # Game markup + Firebase config
├── style.css        # All styling and animations
└── script.js        # Game logic + gesture detection + Firebase calls
```

No build tools. No npm install. No dependencies. Just three files.

---

## 🔥 Firebase Setup (if forking)

If you want to fork this project with your own database:

1. Create a project at [console.firebase.google.com](https://console.firebase.google.com)
2. Enable **Firestore Database** in test mode
3. Replace the `firebaseConfig` object in `index.html` with your own credentials
4. Set Firestore security rules:

```js
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /scores/{doc} {
      allow read: if true;
      allow write: if request.resource.data.score is int
                   && request.resource.data.score >= 0
                   && request.resource.data.score < 10000
                   && request.resource.data.name is string
                   && request.resource.data.name.size() <= 30;
    }
  }
}
```

---

## 🐛 Interesting Bugs Fixed

**Mirror flip issue**
The webcam preview is CSS-mirrored for a natural feel, but MediaPipe reads raw unflipped coordinates. Moving your hand left registered as right. Fixed by flipping the X axis: `fingerX = 1 - lm.x`

**Jittery single finger tracking**
Index fingertip alone was too unstable. Switched to tracking the **midpoint between thumb tip and index tip** so wobbles in either finger average out.

**Direction changing on micro-tremors**
Added a minimum movement threshold of 5.5% of frame width, plus a dominant axis ratio check — one axis must be 1.8× larger than the other before a direction change registers.

**Edge browser leaderboard failing silently**
Edge's tracking prevention blocked Firestore's IndexedDB cache, causing reads to fail while writes succeeded. Fixed by using `getDocsFromServer` instead of `getDocs` to bypass the cache entirely.

**ES Module timing race**
Firebase loads as an ES module (deferred) while the game runs in a classic script. The leaderboard was called before Firebase was ready. Fixed by awaiting a custom `firebase-ready` event inline instead of returning early.

---

## 📊 Gesture Detection Logic

```
Webcam frames (30fps)
        ↓
MediaPipe Hands model
        ↓
21 hand landmarks (normalized 0→1 coordinates)
        ↓
Pinch midpoint = avg(thumb tip #4, index tip #8)
        ↓
Delta from previous frame (dx, dy)
        ↓
Threshold check (> 0.055) + axis dominance check (1.8×)
        ↓
Direction change → Snake moves
```

---

## 🏆 Leaderboard

Scores are stored in Firebase Firestore and displayed after every game. The top 10 scores are shown with 🥇🥈🥉 medals for the top 3.

**Current highest score: 8** — think you can beat it? [Try now!](https://augmented-snakegame.netlify.app/)

---

## 🙏 Acknowledgements

- [MediaPipe](https://mediapipe.dev/) by Google — hand tracking model
- [Firebase](https://firebase.google.com/) — real-time database
- Inspired by the classic Nokia Snake game 🐍

---

## 📄 License

MIT License — feel free to fork, modify, and build on top of this.

---

<p align="center">Made with ☕ and a lot of hand waving by <a href="https://github.com/RidhamGupta1201">Ridham Gupta</a></p>