# Neon Tetris — Premium Cyberpunk Retro-Arcade Game

A feature-rich, high-performance Tetris game built using vanilla **HTML5, CSS3, and JavaScript**. Styled with a premium glassmorphic dark-mode theme, it includes advanced gameplay mechanics (Ghost Piece, Hold Slot, Next Preview) and a custom real-time audio synthesizer built with the Web Audio API.

---

## Features

### 🌟 Core Gameplay & Mechanics
- **Standard Tetromino Rotation**: Full 7-tetromino shapes mapped with proper matrix rotation.
- **Wall Kicks**: Smart shift-offset detection (testing horizontal shifts on rotate) to allow smooth rotation even when pressing against walls or other blocks.
- **Cascading Line Clears**: Full line detection scans the playfield from bottom to top, clearing rows and shifting block layers down.
- **Hard Drop**: Pressing `Space` instantly drops and locks the tetromino, granting a score bonus.

### 🎁 UI/UX & Advanced Features
- **Neon-Cyberpunk Visual Theme**: Frosted glass panels, subtle border blurs, star-dappled backgrounds, and glowing neon visual cues.
- **Ghost Piece Landing Projection**: Renders a semi-transparent guide outline at the bottom of the board, indicating exactly where the active tetromino will land.
- **Hold Piece Container**: Swap and save a block (by pressing `C` or `Shift`) for later deployment.
- **Next Piece Preview**: Displays the upcoming piece in a secondary preview canvas to plan your strategies.
- **Dynamic Web Audio Synth**: Synthesizes arcade retro sound effects and loops the iconic Tetris theme (Korobeiniki) using browser oscillators (no external file downloads needed).
- **Difficulty Scaling (Levels)**: Difficulty increments every 10 cleared lines, increasing the gravitational falling speed.
- **Screen Overlays**: Start, Pause, and Game Over overlays instead of intrusive browser alerts.
- **Mobile Touch Controls**: Floating on-screen gamepad (D-pad and action buttons) displayed automatically on touch-enabled or mobile-sized screens.
- **Score Persistence**: Tracks score, level, lines, and saves your High Score in `localStorage`.

---

## Directory Structure

```text
tetris_game/
├── tetris.html      # Document structure, UI stats panel, state screen overlays
├── style.css        # Dark mode styling, neon colors variables, glassmorphism, responsive styles
├── script.js        # Game loop logic, Web Audio synthesizer, canvas renderers
├── tetris.java      # Reference notes on game engines
└── README.md        # Project documentation
```

---

## System Requirements
- **Web Browser**: Any modern browser (Chrome, Firefox, Safari, Edge, Opera) supporting HTML5 Canvas and the Web Audio API.
- **No dependencies**: Works out-of-the-box locally, requiring no dev server, bundlers, or local installation.

---

## Getting Started

### 1. Launching the Game
1. Locate the directory `C:\Users\ANUJ\OneDrive\Desktop\tetris_game\`.
2. Double-click the **`tetris.html`** file or right-click and choose **Open with** your preferred web browser.

### 2. Audio Control
- On the left sidebar panel, use the checkboxes to toggle **Background Music** or **Sound Effects** on/off.
- Click the glowing **START GAME** button to begin the game loop.

---

## Game Controls

| Action | Keyboard Key | Virtual Gamepad Button (Mobile) |
| :--- | :--- | :--- |
| **Move Left** | `←` or `A` | `←` |
| **Move Right** | `→` or `D` | `→` |
| **Soft Drop** | `↓` or `S` | `↓` |
| **Hard Drop** | `Spacebar` | `DROP` |
| **Rotate Clockwise** | `↑` or `W` | `↻` |
| **Hold / Swap Piece** | `C` or `Shift` | `HOLD` |
| **Pause / Resume** | `Escape` or `P` | `PAUSE GAME` button |

---

## Design Decisions

1. **Bevel 3D Canvas Rendering**: Rather than drawing flat rectangles, the grid renderer splits blocks into highlights and shadows using layered transparent fills. This creates a glossy 3D look resembling neon glass cubes.
2. **Built-in Web Audio API Synthesizer**: Using the browser's oscillator nodes (`triangle`, `sine`, `sawtooth`) prevents delay-loading or CORS blockages associated with host-hosted `.mp3` or `.wav` sound files. The iconic music melody uses pitch vibratos modulated via an LFO to emulate retro sound chips.
3. **Responsive Grid Layout**: Desktop layouts utilize a three-column panel distribution. On screen sizes below `900px`, the layout automatically collapses the side panels, centers the canvas, and overlays mobile-friendly action buttons.
4. **Collision and Boundaries**: Checks bounding coordinates `q >= 0` to allow spawning/rotating pieces slightly above the upper viewport grid lines, preventing out-of-bounds array crashes.
