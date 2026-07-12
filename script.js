// ==========================================================================
// Neon Tetris Core Game Engine
// Features: Web Audio API synth, Next & Hold Previews, Ghost Piece, Level speed scale
// ==========================================================================

// Tetris shapes matrix definition (Standard Tetrominoes)
const shapes = [
    // 0: I-piece
    [[0, 0, 0, 0],
     [1, 1, 1, 1],
     [0, 0, 0, 0],
     [0, 0, 0, 0]],

    // 1: J-piece
    [[1, 0, 0],
     [1, 1, 1],
     [0, 0, 0]],

    // 2: L-piece
    [[0, 0, 1],
     [1, 1, 1],
     [0, 0, 0]],

    // 3: O-piece
    [[1, 1],
     [1, 1]],

    // 4: S-piece
    [[0, 1, 1],
     [1, 1, 0],
     [0, 0, 0]],

    // 5: T-piece
    [[0, 1, 0],
     [1, 1, 1],
     [0, 0, 0]],

    // 6: Z-piece
    [[1, 1, 0],
     [0, 1, 1],
     [0, 0, 0]]
];

const colors = [
    "transparent",
    "#00f0ff", // I - Electric Cyan
    "#0044ff", // J - Neon Blue
    "#ff7700", // L - Neon Orange
    "#ffdd00", // O - Neon Yellow
    "#00ff66", // S - Neon Green
    "#9d00ff", // T - Neon Purple
    "#ff0055"  // Z - Neon Red
];

const rows = 20;
const cols = 10;

// Game State variables
let gameState = 'start'; // 'start', 'playing', 'paused', 'gameover'
let score = 0;
let level = 1;
let lines = 0;
let highscore = parseInt(localStorage.getItem("tetris_highscore")) || 0;

let grid = creategrid();
let pieceObj = null;
let nextPiece = null;
let holdPiece = null;
let hasHeld = false;

let gameInterval = null;
let dropSpeed = 600;

// Canvas setup
const canvas = document.querySelector("#tetris");
const ctx = canvas.getContext("2d");

// Web Audio API Synthesizer Class
class SoundEngine {
    constructor() {
        this.ctx = null;
        this.musicEnabled = false;
        this.sfxEnabled = true;
        this.musicInterval = null;
        this.musicVolume = 0.05;
        this.sfxVolume = 0.15;
    }

    init() {
        if (this.ctx) return;
        this.ctx = new (window.AudioContext || window.webkitAudioContext)();
    }

    playTone(freq, type, duration, volStart, volEnd) {
        this.init();
        if (!this.sfxEnabled) return;
        if (this.ctx.state === 'suspended') {
            this.ctx.resume();
        }

        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        
        osc.type = type;
        osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
        
        gain.gain.setValueAtTime(volStart * this.sfxVolume, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(volEnd * this.sfxVolume || 0.0001, this.ctx.currentTime + duration);
        
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        
        osc.start();
        osc.stop(this.ctx.currentTime + duration);
    }

    playMove() {
        this.playTone(140, 'triangle', 0.07, 0.4, 0.01);
    }

    playRotate() {
        this.playTone(280, 'sine', 0.1, 0.5, 0.01);
        setTimeout(() => this.playTone(390, 'sine', 0.1, 0.3, 0.01), 40);
    }

    playClear() {
        if (!this.ctx) this.init();
        if (this.ctx && this.ctx.state === 'suspended') this.ctx.resume();
        
        const now = this.ctx ? this.ctx.currentTime : 0;
        this.playTone(440, 'square', 0.12, 0.4, 0.05);
        setTimeout(() => this.playTone(554.37, 'square', 0.12, 0.4, 0.05), 80);
        setTimeout(() => this.playTone(659.25, 'square', 0.12, 0.4, 0.05), 160);
        setTimeout(() => this.playTone(880, 'square', 0.22, 0.5, 0.01), 240);
    }

    playLevelUp() {
        const notes = [261.63, 329.63, 392.00, 523.25, 659.25, 783.99];
        notes.forEach((freq, idx) => {
            setTimeout(() => this.playTone(freq, 'sine', 0.18, 0.4, 0.05), idx * 70);
        });
    }

    playGameOver() {
        this.playTone(180, 'sawtooth', 0.25, 0.5, 0.01);
        setTimeout(() => this.playTone(140, 'sawtooth', 0.3, 0.5, 0.01), 220);
        setTimeout(() => this.playTone(100, 'sawtooth', 0.45, 0.5, 0.01), 440);
    }

    startMusic() {
        this.init();
        if (this.musicInterval) return;
        this.musicEnabled = true;

        // Simplified, iconic Tetris melody loop
        const melody = [
            659.25, 493.88, 523.25, 587.33, 523.25, 493.88, 440.00, 440.00, 523.25, 659.25, 587.33, 523.25,
            493.88, 493.88, 523.25, 587.33, 659.25, 523.25, 440.00, 440.00, 0,
            587.33, 698.46, 880.00, 783.99, 698.46, 659.25, 523.25, 659.25, 587.33, 523.25,
            493.88, 493.88, 523.25, 587.33, 659.25, 523.25, 440.00, 440.00
        ];
        const durations = [
            400, 200, 200, 400, 200, 200, 400, 200, 200, 400, 200, 200,
            600, 200, 200, 400, 400, 400, 400, 400, 400,
            600, 200, 400, 200, 200, 600, 200, 400, 200, 200,
            600, 200, 200, 400, 400, 400, 400, 400
        ];

        let idx = 0;
        const playNextNote = () => {
            if (!this.musicEnabled) return;
            if (this.ctx.state === 'suspended') this.ctx.resume();
            
            const freq = melody[idx];
            const dur = durations[idx] / 1000;
            
            if (freq > 0) {
                const osc = this.ctx.createOscillator();
                const gain = this.ctx.createGain();
                osc.type = 'triangle';
                osc.frequency.value = freq;
                
                // Add soft pitch vibrato
                const lfo = this.ctx.createOscillator();
                const lfoGain = this.ctx.createGain();
                lfo.frequency.value = 6;
                lfoGain.gain.value = 4;
                lfo.connect(lfoGain);
                lfoGain.connect(osc.frequency);
                
                gain.gain.setValueAtTime(this.musicVolume, this.ctx.currentTime);
                gain.gain.linearRampToValueAtTime(0.001, this.ctx.currentTime + dur);
                
                osc.connect(gain);
                gain.connect(this.ctx.destination);
                
                lfo.start();
                osc.start();
                osc.stop(this.ctx.currentTime + dur);
            }
            
            this.musicInterval = setTimeout(playNextNote, durations[idx]);
            idx = (idx + 1) % melody.length;
        };

        playNextNote();
    }

    stopMusic() {
        this.musicEnabled = false;
        if (this.musicInterval) {
            clearTimeout(this.musicInterval);
            this.musicInterval = null;
        }
    }
}

const soundEngine = new SoundEngine();

// Scale main canvas context
ctx.setTransform(1, 0, 0, 1, 0, 0);
ctx.scale(30, 30);

// Initialize statistics
document.getElementById("highscore-val").innerText = highscore;

function generateRandomPiece() {
    let ran = Math.floor(Math.random() * shapes.length);
    return {
        piece: shapes[ran],
        x: Math.floor(cols / 2) - Math.floor(shapes[ran][0].length / 2),
        y: 0,
        colorIndex: ran + 1,
        typeIndex: ran
    };
}

function initGame() {
    grid = creategrid();
    score = 0;
    level = 1;
    lines = 0;
    holdPiece = null;
    hasHeld = false;
    
    updateStatsUI();
    
    pieceObj = generateRandomPiece();
    nextPiece = generateRandomPiece();
    
    renderNextPiece();
    renderHoldPiece();
    
    gameState = 'playing';
    
    // Manage UI screens
    document.getElementById("start-screen").classList.remove("active");
    document.getElementById("pause-screen").classList.remove("active");
    document.getElementById("game-over-screen").classList.remove("active");
    
    // Audio Start
    soundEngine.init();
    if (document.getElementById("music-toggle").checked) {
        soundEngine.startMusic();
    }
    
    updateDropSpeed();
}

function updateDropSpeed() {
    if (gameInterval) clearInterval(gameInterval);
    dropSpeed = Math.max(60, 600 - (level - 1) * 70);
    gameInterval = setInterval(newgamestate, dropSpeed);
}

function newgamestate() {
    if (gameState !== 'playing') return;
    moveDown();
}

// Fix functional bug: Correctly clear full lines, update score/level, and handle cascades.
function checkgrid() {
    let count = 0;
    
    for (let i = rows - 1; i >= 0; i--) {
        let allfilled = true;
        for (let j = 0; j < cols; j++) {
            if (grid[i][j] === 0) {
                allfilled = false;
                break;
            }
        }
        
        if (allfilled) {
            // Remove full line
            grid.splice(i, 1);
            // Insert empty line at the top
            grid.unshift(new Array(cols).fill(0));
            // Splicing shifts indices, so check the same row index again
            i++;
            count++;
        }
    }
    
    if (count > 0) {
        soundEngine.playClear();
        lines += count;
        
        // Standard Tetris scoring table
        const points = [0, 100, 300, 500, 800];
        score += (points[count] || 800) * level;
        
        // Update level every 10 lines
        const nextLevel = Math.floor(lines / 10) + 1;
        if (nextLevel > level) {
            level = nextLevel;
            soundEngine.playLevelUp();
            updateDropSpeed();
        }
        
        updateStatsUI();
        triggerFlashEffect();
    }
}

function triggerFlashEffect() {
    const canvasEl = document.getElementById("tetris");
    canvasEl.style.boxShadow = "0 0 40px #00ff66, inset 0 0 25px #00ff66";
    setTimeout(() => {
        canvasEl.style.boxShadow = "0 0 30px rgba(157, 0, 255, 0.25), inset 0 0 20px rgba(157, 0, 255, 0.15)";
    }, 150);
}

function updateStatsUI() {
    document.getElementById("score-val").innerText = score;
    document.getElementById("level-val").innerText = level;
    document.getElementById("lines-val").innerText = lines;
    document.getElementById("highscore-val").innerText = highscore;
}

// Draw a single piece block with 3D arcade styling details
function drawBlock(x, y, colorIndex, isGhost = false) {
    if (colorIndex === 0) return;
    const color = colors[colorIndex];
    
    if (isGhost) {
        ctx.strokeStyle = color;
        ctx.lineWidth = 0.08;
        ctx.strokeRect(x + 0.05, y + 0.05, 0.9, 0.9);
        ctx.fillStyle = "rgba(255, 255, 255, 0.015)";
        ctx.fillRect(x + 0.05, y + 0.05, 0.9, 0.9);
    } else {
        ctx.fillStyle = color;
        ctx.fillRect(x + 0.05, y + 0.05, 0.9, 0.9);
        
        // Shiny bevel highlight
        ctx.fillStyle = "rgba(255, 255, 255, 0.22)";
        ctx.fillRect(x + 0.1, y + 0.1, 0.8, 0.12);
        ctx.fillRect(x + 0.1, y + 0.22, 0.12, 0.55);
        
        // Inner shadow depth
        ctx.fillStyle = "rgba(0, 0, 0, 0.35)";
        ctx.fillRect(x + 0.1, y + 0.78, 0.8, 0.12);
        ctx.fillRect(x + 0.78, y + 0.1, 0.12, 0.8);
    }
}

function renderPiece() {
    if (!pieceObj) return;
    const { piece, x, y, colorIndex } = pieceObj;
    
    for (let i = 0; i < piece.length; i++) {
        for (let j = 0; j < piece[i].length; j++) {
            if (piece[i][j] === 1) {
                drawBlock(x + j, y + i, colorIndex);
            }
        }
    }
}

// Calculate landing location and render semi-transparent Ghost Piece preview
function renderGhostPiece() {
    if (!pieceObj) return;
    const { piece, x, colorIndex } = pieceObj;
    let ghostY = pieceObj.y;
    
    while (!collision(x, ghostY + 1)) {
        ghostY++;
    }
    
    // Only draw ghost if it lies below the active piece
    if (ghostY > pieceObj.y) {
        for (let i = 0; i < piece.length; i++) {
            for (let j = 0; j < piece[i].length; j++) {
                if (piece[i][j] === 1) {
                    drawBlock(x + j, ghostY + i, colorIndex, true);
                }
            }
        }
    }
}

function moveDown() {
    if (!pieceObj) return;
    
    if (!collision(pieceObj.x, pieceObj.y + 1)) {
        pieceObj.y += 1;
    } else {
        // Lock the piece onto the grid
        for (let i = 0; i < pieceObj.piece.length; i++) {
            for (let j = 0; j < pieceObj.piece[i].length; j++) {
                if (pieceObj.piece[i][j] === 1) {
                    let p = pieceObj.x + j;
                    let q = pieceObj.y + i;
                    
                    if (q >= 0 && q < rows && p >= 0 && p < cols) {
                        grid[q][p] = pieceObj.colorIndex;
                    }
                }
            }
        }
        
        // Game Over Trigger
        if (pieceObj.y <= 0) {
            triggerGameOver();
            return;
        }
        
        soundEngine.playMove(); // play drop contact SFX
        checkgrid();
        
        // Setup next tetromino
        pieceObj = nextPiece;
        nextPiece = generateRandomPiece();
        hasHeld = false;
        
        renderNextPiece();
        renderHoldPiece();
    }
    rendergrid();
}

function triggerGameOver() {
    gameState = 'gameover';
    clearInterval(gameInterval);
    gameInterval = null;
    soundEngine.stopMusic();
    soundEngine.playGameOver();
    
    if (score > highscore) {
        highscore = score;
        localStorage.setItem("tetris_highscore", highscore);
        document.getElementById("highscore-val").innerText = highscore;
    }
    
    document.getElementById("final-score").innerText = score;
    document.getElementById("game-over-screen").classList.add("active");
}

function moveLeft() {
    if (gameState !== 'playing') return;
    if (!collision(pieceObj.x - 1, pieceObj.y)) {
        pieceObj.x -= 1;
        soundEngine.playMove();
    }
    rendergrid();
}

function moveRight() {
    if (gameState !== 'playing') return;
    if (!collision(pieceObj.x + 1, pieceObj.y)) {
        pieceObj.x += 1;
        soundEngine.playMove();
    }
    rendergrid();
}

function hardDrop() {
    if (gameState !== 'playing') return;
    let drops = 0;
    while (!collision(pieceObj.x, pieceObj.y + 1)) {
        pieceObj.y += 1;
        drops++;
    }
    score += drops * 2; // Hard drop score bonus
    moveDown(); // Triggers lock & next block immediately
}

function holdActivePiece() {
    if (hasHeld || gameState !== 'playing') return;
    
    soundEngine.playMove();
    const currentType = pieceObj.typeIndex;
    
    if (holdPiece === null) {
        holdPiece = currentType;
        pieceObj = nextPiece;
        nextPiece = generateRandomPiece();
    } else {
        const temp = holdPiece;
        holdPiece = currentType;
        pieceObj = {
            piece: shapes[temp],
            x: Math.floor(cols / 2) - Math.floor(shapes[temp][0].length / 2),
            y: 0,
            colorIndex: temp + 1,
            typeIndex: temp
        };
    }
    
    hasHeld = true;
    renderHoldPiece();
    renderNextPiece();
    rendergrid();
}

function creategrid() {
    let newGrid = [];
    for (let i = 0; i < rows; i++) {
        newGrid.push(new Array(cols).fill(0));
    }
    return newGrid;
}

function rendergrid() {
    ctx.clearRect(0, 0, cols, rows);
    
    // Draw guide gridlines
    ctx.strokeStyle = "rgba(255, 255, 255, 0.02)";
    ctx.lineWidth = 0.02;
    for (let i = 0; i <= cols; i++) {
        ctx.beginPath();
        ctx.moveTo(i, 0);
        ctx.lineTo(i, rows);
        ctx.stroke();
    }
    for (let i = 0; i <= rows; i++) {
        ctx.beginPath();
        ctx.moveTo(0, i);
        ctx.lineTo(cols, i);
        ctx.stroke();
    }
    
    // Draw grid blocks
    for (let i = 0; i < grid.length; i++) {
        for (let j = 0; j < grid[i].length; j++) {
            if (grid[i][j] > 0) {
                drawBlock(j, i, grid[i][j]);
            }
        }
    }
    
    renderGhostPiece();
    renderPiece();
}

// Rotation with basic wall kick shifting
function rotate() {
    if (gameState !== 'playing') return;
    
    const piece = pieceObj.piece;
    const N = piece.length;
    let rotatedpiece = [];
    
    for (let i = 0; i < N; i++) {
        rotatedpiece.push(new Array(N).fill(0));
    }
    
    // Transpose and reverse (90-degree clockwise)
    for (let i = 0; i < N; i++) {
        for (let j = 0; j < N; j++) {
            rotatedpiece[j][N - 1 - i] = piece[i][j];
        }
    }
    
    // Wall kicks: Try [no kick, shift left 1, shift right 1, shift left 2, shift right 2]
    const kicks = [0, -1, 1, -2, 2];
    for (let dx of kicks) {
        if (!collision(pieceObj.x + dx, pieceObj.y, rotatedpiece)) {
            pieceObj.x += dx;
            pieceObj.piece = rotatedpiece;
            soundEngine.playRotate();
            rendergrid();
            return;
        }
    }
}

function collision(x, y, rotatedpiece) {
    let piece = rotatedpiece || pieceObj.piece;
    for (let i = 0; i < piece.length; i++) {
        for (let j = 0; j < piece[i].length; j++) {
            if (piece[i][j] === 1) {
                let p = x + j;
                let q = y + i;
                
                if (p < 0 || p >= cols || q >= rows) {
                    return true;
                }
                
                if (q >= 0 && grid[q][p] > 0) {
                    return true;
                }
            }
        }
    }
    return false;
}

// Canvas-preview renders for Sidecards
function renderPreviewPiece(canvasId, typeIndex) {
    const previewCanvas = document.getElementById(canvasId);
    const pCtx = previewCanvas.getContext("2d");
    pCtx.clearRect(0, 0, previewCanvas.width, previewCanvas.height);
    
    if (typeIndex === null || typeIndex === undefined) return;
    
    const piece = shapes[typeIndex];
    const colorIndex = typeIndex + 1;
    const blockSize = 20;
    
    const pieceWidth = piece[0].length * blockSize;
    const pieceHeight = piece.length * blockSize;
    
    const startX = (previewCanvas.width - pieceWidth) / 2;
    const startY = (previewCanvas.height - pieceHeight) / 2;
    
    for (let i = 0; i < piece.length; i++) {
        for (let j = 0; j < piece[i].length; j++) {
            if (piece[i][j] === 1) {
                const px = startX + j * blockSize;
                const py = startY + i * blockSize;
                
                pCtx.fillStyle = colors[colorIndex];
                pCtx.fillRect(px + 1, py + 1, blockSize - 2, blockSize - 2);
                
                pCtx.fillStyle = "rgba(255, 255, 255, 0.22)";
                pCtx.fillRect(px + 2, py + 2, blockSize - 4, 3);
                pCtx.fillRect(px + 2, py + 5, 3, blockSize - 8);
                
                pCtx.fillStyle = "rgba(0, 0, 0, 0.3)";
                pCtx.fillRect(px + 2, py + blockSize - 4, blockSize - 4, 2);
                pCtx.fillRect(px + blockSize - 4, py + 2, 2, blockSize - 4);
            }
        }
    }
}

function renderNextPiece() {
    renderPreviewPiece("next-canvas", nextPiece.typeIndex);
}

function renderHoldPiece() {
    renderPreviewPiece("hold-canvas", holdPiece);
}

// Pause/Resume game states
function togglePause() {
    if (gameState === 'playing') {
        gameState = 'paused';
        clearInterval(gameInterval);
        gameInterval = null;
        soundEngine.stopMusic();
        document.getElementById("pause-screen").classList.add("active");
    } else if (gameState === 'paused') {
        gameState = 'playing';
        document.getElementById("pause-screen").classList.remove("active");
        if (document.getElementById("music-toggle").checked) {
            soundEngine.startMusic();
        }
        updateDropSpeed();
    }
}

// ==========================================================================
// EVENT LISTENERS
// ==========================================================================

// Keyboard bindings
document.addEventListener("keydown", function(e) {
    const key = e.code;
    
    if (gameState === 'playing') {
        if (key === "ArrowDown" || key === "KeyS") {
            moveDown();
        } else if (key === "ArrowLeft" || key === "KeyA") {
            moveLeft();
        } else if (key === "ArrowRight" || key === "KeyD") {
            moveRight();
        } else if (key === "ArrowUp" || key === "KeyW") {
            rotate();
        } else if (key === "Space") {
            hardDrop();
            e.preventDefault();
        } else if (key === "KeyC" || key === "ShiftLeft" || key === "ShiftRight") {
            holdActivePiece();
        }
    }
    
    if (key === "KeyP" || key === "Escape") {
        togglePause();
    }
});

// UI overlays and screen buttons
document.getElementById("start-btn").addEventListener("click", () => {
    initGame();
});

document.getElementById("resume-btn").addEventListener("click", () => {
    togglePause();
});

document.getElementById("restart-btn").addEventListener("click", () => {
    initGame();
});

document.getElementById("retry-btn").addEventListener("click", () => {
    initGame();
});

document.getElementById("pause-btn").addEventListener("click", () => {
    togglePause();
});

// Audio Settings Toggles
document.getElementById("music-toggle").addEventListener("change", (e) => {
    soundEngine.init();
    if (e.target.checked) {
        if (gameState === 'playing') soundEngine.startMusic();
    } else {
        soundEngine.stopMusic();
    }
});

document.getElementById("sfx-toggle").addEventListener("change", (e) => {
    soundEngine.init();
    soundEngine.sfxEnabled = e.target.checked;
});

// Mobile Controller buttons touch events
document.getElementById("ctrl-left").addEventListener("click", () => moveLeft());
document.getElementById("ctrl-right").addEventListener("click", () => moveRight());
document.getElementById("ctrl-down").addEventListener("click", () => moveDown());
document.getElementById("ctrl-rotate").addEventListener("click", () => rotate());
document.getElementById("ctrl-hold").addEventListener("click", () => holdActivePiece());
document.getElementById("ctrl-drop").addEventListener("click", () => hardDrop());

// Pre-render state
grid = creategrid();
rendergrid();
updateStatsUI();
