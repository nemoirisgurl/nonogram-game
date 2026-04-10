# Nonogram Game/Solver 🃏
## Contents
1. [Introduction](#introduction)
2. [Features](#features)
3. [Getting Started](#getting-started)
4. [Deployment](#deployment)
5. [Project Directory](#directory)

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

## Getting Started
### Prerequisites
- [Node.js](https://nodejs.org/) (v18+)
- [Supabase Account](https://supabase.com/)

### Installation
1. Clone the repository:
   ```bash
   git clone https://github.com/nemoirisgurl/nonogram-game.git
   cd nonogram
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Set up environment variables:
   Create a `.env` file from the template:
   ```bash
   cp .env.template .env
   ```
   Fill in your `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`.

4. Run locally:
   ```bash
   npm run dev
   ```

## Deployment
### Using Docker
This project includes a production-ready Docker setup using Nginx.
1. Ensure your `.env` file is populated.
2. Build and run:
   ```bash
   docker-compose up --build
   ```
The app will be available at `http://localhost:8080`.

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