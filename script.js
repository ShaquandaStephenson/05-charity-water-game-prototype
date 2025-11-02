// Main JavaScript file - entry point for the game

// Add a global keys object so keyboard + mobile controls share it
const keys = {}; // used by Pac-Man logic and mobile controls

// Initialize everything when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    console.log('Water Heroes game initializing...');
    
    // Initialize the country selection system
    initGame();
    
    // Add some loading animation and navigate into the game flow
    const startButton = document.getElementById('start-game');
    startButton.addEventListener('click', function() {
        // show immediate feedback
        this.innerHTML = `<span>Loading Mission...</span> <i class="arrow">⟳</i>`;
        this.style.pointerEvents = 'none';
        
        // wait for the animation, then switch screens to country selection
        setTimeout(() => {
            // hide opening screen and show country selection
            const opening = document.getElementById('opening-screen');
            const countries = document.getElementById('country-selection');
            if (opening && countries) {
                opening.classList.remove('active');
                countries.classList.add('active');
            }
            // restore button state for future visits (optional)
            this.style.display = '';
            this.style.pointerEvents = '';
            this.innerHTML = `<span>Start Your Mission</span> <i class="arrow">→</i>`;
        }, 800); // 800ms gives a quick feel of loading
    }); // closes startButton.addEventListener

}); // ADDED: close document.addEventListener('DOMContentLoaded'...)

// Pac-Man game implementation
function initPacmanLogic() {
    const canvas = document.getElementById('pacman-canvas');
    const ctx = canvas.getContext('2d');

    // Game variables
    let pacman = {
        x: 300,
        y: 200,
        radius: 15,
        speed: 2,
        direction: null,
        mouthOpen: true,
        mouthAngle: 0.2
    };

    let waterDroplets = [];
    let toolPacks = [];
    let obstacles = [];
    let contaminatedWater = [];
    let score = 0; // internal score owned by controller
    let gameRunning = true;
    let lives = 3;

    // Expose a simple controller so outer UI can control the loop and score
    window.gameController = {
        pause() { gameRunning = false; },
        resume() { if (!gameRunning) { gameRunning = true; gameLoop(); } },
        isPaused() { return !gameRunning; },
        incrementScore(delta) {
            score += delta;
            // keep score non-negative for display
            if (score < 0) score = 0;
            updateScoreDisplay(score);
        },
        getScore() { return score; },
        reset() { resetGame(); }
    };

    // Create water droplets
    function createWaterDroplets() {
        for (let i = 0; i < 20; i++) {
            waterDroplets.push({
                x: Math.random() * (canvas.width - 20) + 10,
                y: Math.random() * (canvas.height - 20) + 10,
                radius: 8,
                collected: false
            });
        }
    }
    
    // Create tool packs (big dots)
    function createToolPacks() {
        for (let i = 0; i < 5; i++) {
            toolPacks.push({
                x: Math.random() * (canvas.width - 30) + 15,
                y: Math.random() * (canvas.height - 30) + 15,
                radius: 12,
                collected: false
            });
        }
    }
    
    // Create obstacles
    function createObstacles() {
        for (let i = 0; i < 8; i++) {
            obstacles.push({
                x: Math.random() * (canvas.width - 40) + 20,
                y: Math.random() * (canvas.height - 40) + 20,
                width: 30,
                height: 30,
                color: '#8B4513' // Brown obstacles
            });
        }
    }
    
    // Create contaminated water
    function createContaminatedWater() {
        for (let i = 0; i < 6; i++) {
            contaminatedWater.push({
                x: Math.random() * (canvas.width - 20) + 10,
                y: Math.random() * (canvas.height - 20) + 10,
                radius: 10,
                collected: false,
                pulsePhase: Math.random() * Math.PI * 2
            });
        }
    }
    
    // Handle keyboard input
    // Note: keys object is now global for mobile controls access
    document.addEventListener('keydown', (e) => {
        keys[e.key] = true;
        e.preventDefault();
    });
    
    document.addEventListener('keyup', (e) => {
        keys[e.key] = false;
        e.preventDefault();
    });
    
    // Update pacman position
    function updatePacman() {
        let newX = pacman.x;
        let newY = pacman.y;
        
        if (keys['ArrowUp'] && pacman.y > pacman.radius) {
            newY -= pacman.speed;
            pacman.direction = 'up';
        }
        if (keys['ArrowDown'] && pacman.y < canvas.height - pacman.radius) {
            newY += pacman.speed;
            pacman.direction = 'down';
        }
        if (keys['ArrowLeft'] && pacman.x > pacman.radius) {
            newX -= pacman.speed;
            pacman.direction = 'left';
        }
        if (keys['ArrowRight'] && pacman.x < canvas.width - pacman.radius) {
            newX += pacman.speed;
            pacman.direction = 'right';
        }
        
        // Check collision with obstacles before moving
        let canMove = true;
        obstacles.forEach(obstacle => {
            if (newX + pacman.radius > obstacle.x && 
                newX - pacman.radius < obstacle.x + obstacle.width &&
                newY + pacman.radius > obstacle.y && 
                newY - pacman.radius < obstacle.y + obstacle.height) {
                canMove = false;
            }
        });
        
        if (canMove) {
            pacman.x = newX;
            pacman.y = newY;
        }
        
        // Animate mouth
        pacman.mouthOpen = !pacman.mouthOpen;
    }
    
    // Check collisions
    function checkCollisions() {
        // Check water droplet collisions
        waterDroplets.forEach(droplet => {
            if (!droplet.collected) {
                const distance = Math.sqrt(
                    Math.pow(pacman.x - droplet.x, 2) + 
                    Math.pow(pacman.y - droplet.y, 2)
                );
                
                if (distance < pacman.radius + droplet.radius) {
                    droplet.collected = true;
                    score += 10;
                    updateScore(10);
                    playSound('collect');
                    showGameMessage('+10 Clean water collected!', 'success');
                }
            }
        });
        
        // Check contaminated water collisions (lose points)
        contaminatedWater.forEach(contaminated => {
            if (!contaminated.collected) {
                const distance = Math.sqrt(
                    Math.pow(pacman.x - contaminated.x, 2) + 
                    Math.pow(pacman.y - contaminated.y, 2)
                );
                
                if (distance < pacman.radius + contaminated.radius) {
                    contaminated.collected = true;
                    score -= 20;
                    updateScore(-20);
                    playSound('error');
                    showGameMessage('-20 Contaminated water! Be careful!', 'error');
                    
                    // Reduce lives
                    lives--;
                    document.getElementById('lives').textContent = lives;
                    
                    if (lives <= 0) {
                        gameRunning = false;
                        setTimeout(() => {
                            if (confirm('Game Over! Would you like to try again?')) {
                                resetGame();
                            } else {
                                document.getElementById('game-screen').classList.remove('active');
                                document.getElementById('country-selection').classList.add('active');
                            }
                        }, 1000);
                    }
                }
            }
        });
        
        // Check tool pack collisions
        toolPacks.forEach(tool => {
            if (!tool.collected) {
                const distance = Math.sqrt(
                    Math.pow(pacman.x - tool.x, 2) + 
                    Math.pow(pacman.y - tool.y, 2)
                );
                
                if (distance < pacman.radius + tool.radius) {
                    tool.collected = true;
                    score += 50;
                    updateScore(50);
                    playSound('complete');
                    showGameMessage('+50 Tool pack collected!', 'success');
                }
            }
        });
        
        // Check if level is complete
        const allWaterCollected = waterDroplets.every(d => d.collected);
        const allToolsCollected = toolPacks.every(t => t.collected);
        
        if (allWaterCollected && allToolsCollected) {
            gameRunning = false;
            setTimeout(() => {
                showVictoryScreen();
            }, 1000);
        }
    }
    
    // Reset game function
    function resetGame() {
        score = 0;
        lives = 3;
        gameRunning = true;
        pacman.x = 300;
        pacman.y = 200;
        
        // Reset all items
        waterDroplets.forEach(d => d.collected = false);
        toolPacks.forEach(t => t.collected = false);
        contaminatedWater.forEach(c => c.collected = false);
        
        // re-create contaminants
        contaminatedWater = [];
        createContaminatedWater();
        
        // update UI
        updateScoreDisplay(score);
        document.getElementById('lives').textContent = lives;
        // restart loop
        gameLoop();
    }
    
    // Draw everything
    function draw() {
        // Clear canvas
        ctx.fillStyle = '#1a1a2e';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Draw grid pattern
        ctx.strokeStyle = '#16213e';
        ctx.lineWidth = 1;
        for (let i = 0; i < canvas.width; i += 40) {
            ctx.beginPath();
            ctx.moveTo(i, 0);
            ctx.lineTo(i, canvas.height);
            ctx.stroke();
        }
        for (let i = 0; i < canvas.height; i += 40) {
            ctx.beginPath();
            ctx.moveTo(0, i);
            ctx.lineTo(canvas.width, i);
            ctx.stroke();
        }
        
        // Draw obstacles
        obstacles.forEach(obstacle => {
            ctx.fillStyle = obstacle.color;
            ctx.fillRect(obstacle.x, obstacle.y, obstacle.width, obstacle.height);
            
            // Add texture
            ctx.strokeStyle = '#654321';
            ctx.lineWidth = 2;
            ctx.strokeRect(obstacle.x, obstacle.y, obstacle.width, obstacle.height);
        });
        
        // Draw contaminated water (pulsing)
        contaminatedWater.forEach(contaminated => {
            if (!contaminated.collected) {
                // Pulsing effect
                contaminated.pulsePhase += 0.1;
                const pulseScale = 1 + Math.sin(contaminated.pulsePhase) * 0.2;
                const currentRadius = contaminated.radius * pulseScale;
                
                // Warning glow
                ctx.fillStyle = 'rgba(255, 0, 0, 0.3)';
                ctx.beginPath();
                ctx.arc(contaminated.x, contaminated.y, currentRadius + 5, 0, Math.PI * 2);
                ctx.fill();
                
                // Contaminated water
                ctx.fillStyle = '#8B0000'; // Dark red
                ctx.beginPath();
                ctx.arc(contaminated.x, contaminated.y, currentRadius, 0, Math.PI * 2);
                ctx.fill();
                
                // Warning symbol
                ctx.fillStyle = '#FFFFFF';
                ctx.font = '12px Arial';
                ctx.textAlign = 'center';
                ctx.fillText('⚠️', contaminated.x, contaminated.y + 4);
            }
        });
        
        // Draw water droplets
        waterDroplets.forEach(droplet => {
            if (!droplet.collected) {
                ctx.fillStyle = '#00bfff';
                ctx.beginPath();
                ctx.arc(droplet.x, droplet.y, droplet.radius, 0, Math.PI * 2);
                ctx.fill();
                
                // Add sparkle effect
                ctx.fillStyle = '#ffffff';
                ctx.beginPath();
                ctx.arc(droplet.x - 3, droplet.y - 3, 2, 0, Math.PI * 2);
                ctx.fill();
            }
        });
        
        // Draw tool packs
        toolPacks.forEach(tool => {
            if (!tool.collected) {
                ctx.fillStyle = '#ffd700';
                ctx.beginPath();
                ctx.arc(tool.x, tool.y, tool.radius, 0, Math.PI * 2);
                ctx.fill();
                
                // Draw tool icon
                ctx.fillStyle = '#333';
                ctx.font = '16px Arial';
                ctx.textAlign = 'center';
                ctx.fillText('🔧', tool.x, tool.y + 5);
            }
        });
        
        // Draw Pac-Man
        ctx.fillStyle = '#ffff00';
        ctx.beginPath();
        
        if (pacman.mouthOpen) {
            let startAngle = 0;
            let endAngle = Math.PI * 2;
            
            // Adjust mouth direction based on movement
            switch (pacman.direction) {
                case 'right':
                    startAngle = pacman.mouthAngle;
                    endAngle = Math.PI * 2 - pacman.mouthAngle;
                    break;
                case 'left':
                    startAngle = Math.PI + pacman.mouthAngle;
                    endAngle = Math.PI - pacman.mouthAngle;
                    break;
                case 'up':
                    startAngle = -Math.PI/2 + pacman.mouthAngle;
                    endAngle = -Math.PI/2 - pacman.mouthAngle + Math.PI * 2;
                    break;
                case 'down':
                    startAngle = Math.PI/2 + pacman.mouthAngle;
                    endAngle = Math.PI/2 - pacman.mouthAngle + Math.PI * 2;
                    break;
                default:
                    startAngle = pacman.mouthAngle;
                    endAngle = Math.PI * 2 - pacman.mouthAngle;
            }
            
            ctx.arc(pacman.x, pacman.y, pacman.radius, startAngle, endAngle);
        } else {
            ctx.arc(pacman.x, pacman.y, pacman.radius, 0, Math.PI * 2);
        }
        
        ctx.closePath();
        ctx.fill();
        
        // Draw score and lives
        ctx.fillStyle = '#ffffff';
        ctx.font = '20px Arial';
        ctx.textAlign = 'left';
        ctx.fillText(`Score: ${score}`, 10, 30);
        ctx.fillText(`Lives: ${lives}`, 10, 55);
        
        // Draw instructions
        ctx.fillStyle = '#cccccc';
        ctx.font = '14px Arial';
        ctx.fillText('Avoid red contaminated water! Use arrow keys to move', 10, canvas.height - 10);
    }
    
    // Game loop
    function gameLoop() {
        if (gameRunning) {
            updatePacman();
            checkCollisions();
            draw();
            requestAnimationFrame(gameLoop);
        }
    }
    
    // Initialize game
    createWaterDroplets();
    createToolPacks();
    createObstacles();
    createContaminatedWater();
    
    // Add mobile controls
    addMobileControls();
    
    gameLoop();
    
    // Add some visual effects
    setInterval(() => {
        if (gameRunning) {
            // Add a new water droplet occasionally
            if (Math.random() < 0.02) {
                waterDroplets.push({
                    x: Math.random() * (canvas.width - 20) + 10,
                    y: Math.random() * (canvas.height - 20) + 10,
                    radius: 8,
                    collected: false
                });
            }
            
            // Occasionally move contaminated water
            if (Math.random() < 0.01) {
                contaminatedWater.forEach(contaminated => {
                    if (!contaminated.collected) {
                        contaminated.x += (Math.random() - 0.5) * 2;
                        contaminated.y += (Math.random() - 0.5) * 2;
                        
                        // Keep within bounds
                        contaminated.x = Math.max(10, Math.min(canvas.width - 10, contaminated.x));
                        contaminated.y = Math.max(10, Math.min(canvas.height - 10, contaminated.y));
                    }
                });
            }
        }
    }, 3000);
}

// Add mobile controls function
function addMobileControls() {
    const gameContainer = document.getElementById('game-container');
    
    // Create mobile control buttons
    const mobileControls = document.createElement('div');
    mobileControls.className = 'mobile-controls';
    mobileControls.innerHTML = `
        <div class="control-row">
            <button class="control-btn" id="btn-up">↑</button>
        </div>
        <div class="control-row">
            <button class="control-btn" id="btn-left">←</button>
            <button class="control-btn" id="btn-down">↓</button>
            <button class="control-btn" id="btn-right">→</button>
        </div>
    `;
    
    gameContainer.appendChild(mobileControls);
    
    // Add touch event listeners
    const btnUp = document.getElementById('btn-up');
    const btnDown = document.getElementById('btn-down');
    const btnLeft = document.getElementById('btn-left');
    const btnRight = document.getElementById('btn-right');
    
    // Touch start events
    btnUp.addEventListener('touchstart', (e) => {
        e.preventDefault();
        keys['ArrowUp'] = true;
    });
    
    btnDown.addEventListener('touchstart', (e) => {
        e.preventDefault();
        keys['ArrowDown'] = true;
    });
    
    btnLeft.addEventListener('touchstart', (e) => {
        e.preventDefault();
        keys['ArrowLeft'] = true;
    });
    
    btnRight.addEventListener('touchstart', (e) => {
        e.preventDefault();
        keys['ArrowRight'] = true;
    });
    
    // Touch end events
    btnUp.addEventListener('touchend', (e) => {
        e.preventDefault();
        keys['ArrowUp'] = false;
    });
    
    btnDown.addEventListener('touchend', (e) => {
        e.preventDefault();
        keys['ArrowDown'] = false;
    });
    
    btnLeft.addEventListener('touchend', (e) => {
        e.preventDefault();
        keys['ArrowLeft'] = false;
    });
    
    btnRight.addEventListener('touchend', (e) => {
        e.preventDefault();
        keys['ArrowRight'] = false;
    });
    
    // Also add click events for desktop testing
    btnUp.addEventListener('mousedown', () => keys['ArrowUp'] = true);
    btnUp.addEventListener('mouseup', () => keys['ArrowUp'] = false);
    
    btnDown.addEventListener('mousedown', () => keys['ArrowDown'] = true);
    btnDown.addEventListener('mouseup', () => keys['ArrowDown'] = false);
    
    btnLeft.addEventListener('mousedown', () => keys['ArrowLeft'] = true);
    btnLeft.addEventListener('mouseup', () => keys['ArrowLeft'] = false);
    
    btnRight.addEventListener('mousedown', () => keys['ArrowRight'] = true);
    btnRight.addEventListener('mouseup', () => keys['ArrowRight'] = false);
}

// ---------------------
// New: UI + game bootstrap
// ---------------------

/*
  initGame()
  - populate a few example countries
  - make a simple carousel
  - handle mission popup open/close and Accept Mission
*/
function initGame() {
    // load persisted player data if available (countries.js provides loadPlayerData)
    if (typeof loadPlayerData === 'function') {
        loadPlayerData();
    }

    populateCountries();

    const track = document.getElementById('country-track');
    let currentIndex = 0;

    // simple prev/next buttons
    document.getElementById('prev-country').addEventListener('click', () => {
        currentIndex = Math.max(0, currentIndex - 1);
        track.style.transform = `translateX(-${currentIndex * 100}%)`;
    });
    document.getElementById('next-country').addEventListener('click', () => {
        const maxIndex = Math.max(0, track.children.length - 1);
        currentIndex = Math.min(maxIndex, currentIndex + 1);
        track.style.transform = `translateX(-${currentIndex * 100}%)`;
    });

    // mission popup close
    document.getElementById('close-mission').addEventListener('click', closeMissionPopup);
    document.getElementById('learn-more').addEventListener('click', () => {
        // For beginners, show a simple info alert
        alert('Learn more: charity:water partners with local communities to build sustainable water projects.');
    });

    // accept mission starts the selected game (Pac-Man for now)
    document.getElementById('accept-mission').addEventListener('click', () => {
        closeMissionPopup();
        startSelectedMission();
    });

    // back to countries from game screen
    document.getElementById('back-to-countries').addEventListener('click', () => {
        document.getElementById('game-screen').classList.remove('active');
        document.getElementById('country-selection').classList.add('active');
    });

    // Reset button: try to call gameController.reset() if available
    document.getElementById('reset-game').addEventListener('click', () => {
        if (window.gameController && typeof window.gameController.reset === 'function') {
            window.gameController.reset();
        } else {
            // fallback: restart the selected mission
            startSelectedMission(true);
        }
    });

    // Pause toggle button: use gameController.pause()/resume()
    const pauseBtn = document.getElementById('pause-game');
    pauseBtn.addEventListener('click', () => {
        if (window.gameController) {
            if (window.gameController.isPaused()) {
                window.gameController.resume();
                pauseBtn.textContent = 'Pause';
            } else {
                window.gameController.pause();
                pauseBtn.textContent = 'Resume';
            }
        } else {
            alert('Pause is not available yet.');
        }
    });
}

/*
 Populate some example countries into the carousel.
 Keep the data simple for students.
*/
function populateCountries() {
    // Use the canonical countries array provided by countries.js
    const track = document.getElementById('country-track');
    track.innerHTML = ''; // clear

    // Correct check: ensure the global countries array exists and has items
    if (typeof countries === 'undefined' || countries.length === 0) {
        track.innerHTML = '<div class="no-continents">No countries available. Check countries.js</div>';
        return;
    }

    countries.forEach((c) => {
        const card = document.createElement('div');
        card.className = 'country-card';
        card.innerHTML = `
            <div class="country-flag">${c.flag || '🏳️'}</div>
            <div class="country-name">${c.name}</div>
            <div class="country-description">${c.description || ''}</div>
            <div class="country-stats">
                <div class="stat-chip">${c.levels || '-' } Levels</div>
                <div class="stat-chip">Available</div>
            </div>
        `;
        // open mission popup when a card is clicked
        card.addEventListener('click', () => showMissionPopup(c));
        track.appendChild(card);
    });
}

/*
  showMissionPopup(country) - fills popup with country data and shows it
*/
let _selectedMission = null;
function showMissionPopup(country) {
    _selectedMission = country;
    document.getElementById('mission-title').textContent = `Mission: ${country.name}`;
    document.getElementById('population').textContent = country.population;
    document.getElementById('without-water').textContent = country.withoutWater;
    document.getElementById('wait-time').textContent = country.waitTime;
    document.getElementById('mission-description').textContent = country.description;
    document.getElementById('mission-popup').classList.add('active');
}

function closeMissionPopup() {
    document.getElementById('mission-popup').classList.remove('active');
}

/*
  startSelectedMission(restart = false)
  - hides country-selection and shows game-screen
  - sets current country label
  - calls into the existing Pac-Man initializer
*/
function startSelectedMission(restart = false) {
    const countryName = _selectedMission ? _selectedMission.name : 'Unknown';
    document.getElementById('current-country').textContent = countryName;
    document.getElementById('country-selection').classList.remove('active');
    document.getElementById('victory-screen').classList.remove('active');
    document.getElementById('game-screen').classList.add('active');

    // reset UI score & lives
    updateScoreDisplay(0);
    document.getElementById('lives').textContent = '3';
    // Call Pac-Man setup (existing function in this file)
    // If restarting, it's okay to call again to rebind controls
    initPacmanLogic();
}

/*
  Small set of helper functions that the Pac-Man code expects to call.
  Keep them simple and beginner-friendly.
*/

// updateScore(delta) - increments the visible game score
function updateScore(delta) {
    // If the running game exposes incrementScore, let it update the internal score and DOM
    if (window.gameController && typeof window.gameController.incrementScore === 'function') {
        window.gameController.incrementScore(delta);
    } else {
        // fallback: update DOM directly
        const el = document.getElementById('game-score');
        const current = parseInt(el.textContent || '0', 10);
        el.textContent = `${Math.max(0, current + delta)}`;
    }

    // Update the Total Impact number on selection screen
    const total = document.getElementById('total-score');
    const totalCurrent = parseInt(total.textContent || '0', 10);
    total.textContent = `${Math.max(0, totalCurrent + delta)}`;
}

// updateScoreDisplay(value) - set the visible game score to a value
function updateScoreDisplay(value = 0) {
    document.getElementById('game-score').textContent = `${value}`;
}

// playSound(name) - simple beeps via WebAudio (no external files)
const _audio = {
    ctx: null,
    ensure() {
        if (!this.ctx) {
            try {
                this.ctx = new (window.AudioContext || window.webkitAudioContext)();
            } catch (e) {
                console.log('WebAudio not supported', e);
            }
        }
    },
    beep(freq = 440, dur = 0.12) {
        this.ensure();
        if (!this.ctx) return;
        const o = this.ctx.createOscillator();
        const g = this.ctx.createGain();
        o.type = 'sine';
        o.frequency.value = freq;
        g.gain.value = 0.0001;
        o.connect(g);
        g.connect(this.ctx.destination);
        // gentle attack
        g.gain.exponentialRampToValueAtTime(0.12, this.ctx.currentTime + 0.01);
        o.start();
        // release
        setTimeout(() => {
            g.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + 0.04);
            setTimeout(() => {
                try { o.stop(); } catch (e) {}
            }, 60);
        }, dur * 1000);
    }
};

function playSound(name) {
    // Beginner-friendly mapping of event -> short beep
    switch (name) {
        case 'collect':
            _audio.beep(880, 0.08); // high quick beep
            break;
        case 'complete':
            _audio.beep(660, 0.14); // medium beep
            setTimeout(() => _audio.beep(880, 0.06), 120);
            break;
        case 'error':
            _audio.beep(220, 0.18); // low warning beep
            break;
        default:
            _audio.beep(440, 0.08); // default click
    }
}

// showGameMessage(text, type) - temporary message overlay
function showGameMessage(text, type = 'info') {
    const msg = document.createElement('div');
    msg.textContent = text;
    msg.style.position = 'fixed';
    msg.style.left = '50%';
    msg.style.top = '10%';
    msg.style.transform = 'translateX(-50%)';
    msg.style.background = type === 'error' ? '#ffb3b3' : '#b3ffcb';
    msg.style.color = '#111';
    msg.style.padding = '8px 12px';
    msg.style.borderRadius = '8px';
    msg.style.zIndex = 2000;
    document.body.appendChild(msg);
    setTimeout(() => { msg.remove(); }, 1500);
}

/*
  showVictoryScreen()
  - show the victory screen and trigger confetti if available
*/
function showVictoryScreen() {
    document.getElementById('game-screen').classList.remove('active');
    document.getElementById('victory-screen').classList.add('active');

    // Try to fire confetti if the library is loaded
    try {
        if (typeof confetti === 'function') {
            confetti({
                particleCount: 100,
                spread: 70,
                origin: { y: 0.3 }
            });
        }
    } catch (e) {
        console.log('confetti not available', e);
    }
}

// Placeholder functions for other game types
function initPuzzleLogic() {
    console.log('Puzzle game - to be implemented');
    // For now, show a completion message after a delay
    setTimeout(() => {
        showVictoryScreen();
    }, 5000);
}

function initMatchingLogic() {
    console.log('Matching game - to be implemented');
    setTimeout(() => {
        showVictoryScreen();
    }, 5000);
}

function initClickerLogic() {
    console.log('Clicker game - to be implemented');
    setTimeout(() => {
        showVictoryScreen();
    }, 5000);
}

function initPlatformerLogic() {
    console.log('Platformer game - to be implemented');
    setTimeout(() => {
        showVictoryScreen();
    }, 5000);
}