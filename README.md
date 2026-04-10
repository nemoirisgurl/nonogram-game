# Nonogram Game/Solver 🃏
## Contents
1. [Introduction](#introduction)
2. [Features](#features)
3. [Project Directory](#directory)
## Introduction
This React app acts as a Nonogram Puzzle and Solver in one app. I was addicted with Nonogram game in my iPad and I was too lazy to solve them manually so I created this app.

## Features
### 🎮 Interactive Gameplay
- **Variable Grid Sizes**: Play puzzles ranging from **5x5** up to **25x25**.
- **Intuitive Controls**: Easy cell toggling to mark filled or empty (X) spaces.
- **Visual Aids**: Automatic marking of completed rows and columns.
- **Hint System**: Get intelligent hints when you're stuck, guiding you towards the unique solution.

### 🧠 Advanced Nonogram Solver
- **Powerful Algorithm**: Utilizes a backtracking solver with efficient pattern generation via combinations.
- **Constraint Support**: Allows users to input partial solutions (marks) to guide the solver.
- **Solution Validation**: Detects if a puzzle has a unique solution, multiple solutions, or is unsolvable.

### 🎲 Puzzle Generation
- **Procedural Puzzles**: Generates random puzzles on the fly.
- **Uniqueness Guarantee**: For smaller boards, the generator ensures a unique solution exists before presenting the puzzle.

### 👤 User Management & Profiles
- **Secure Authentication**: Integrated with **Supabase** for robust login and registration.
- **Personalized Profiles**: Manage your player profile, including custom avatar selection.
- **Progress Tracking**: Keep track of your game history and achievements.

### 🎨 Modern UI/UX
- **Responsive Design**: Fully playable on both desktop and mobile devices.
- **Polished Aesthetics**: Clean, modern interface with smooth transitions and interactive components.
- **Integrated Navigation**: Seamless switching between Home, Game, Solver, and Profile pages.

## Directory
```text

|   .gitignore      
|   eslint.config.js
|   index.html
|   package-lock.json
|   package.json
|   README.md
|   vite.config.js
|
\---public
|       logo.png
|
\---src
    |   App.css
    |   App.jsx
    |   index.css
    |   main.jsx
    |
    +---assets
    |       size.csv
    |
    +---component
    |       avatarIcon.jsx
    |       navbar.jsx
    |       nonogram.jsx
    |
    +---lib
    |       combination.js
    |       nonogramEngine.js
    |       supabase.js
    |       utils.js
    |
    \---pages
            Game.jsx
            GameSetup.jsx
            Home.jsx
            Login.jsx
            Profile.jsx
            Register.jsx
            Setup.jsx
            Solver.jsx
```