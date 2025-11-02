// Main game logic and utilities

// Update score with visual feedback
function updateScore(points, elementId = 'game-score') {
    const element = document.getElementById(elementId);
    const currentScore = parseInt(element.textContent) || 0;
    const newScore = currentScore + points;
    
    // Update score
    element.textContent = newScore;
    gameState.score = newScore;
    
    // Visual feedback
    element.style.color = '#28a745';
    element.style.transform = 'scale(1.2)';
    
    setTimeout(() => {
        element.style.color = '#007bff';
        element.style.transform = 'scale(1)';
    }, 300);
    
    // Update total score
    playerData.totalScore += points;
    savePlayerData();
}

// Show game message
function showGameMessage(message, type = 'info') {
    const messageDiv = document.createElement('div');
    messageDiv.className = `game-message ${type}`;
    messageDiv.textContent = message;
    messageDiv.style.cssText = `
        position: fixed;
        top: 20px;
        left: 50%;
        transform: translateX(-50%);
        background: ${type === 'success' ? '#28a745' : type === 'error' ? '#dc3545' : '#007bff'};
        color: white;
        padding: 1rem 2rem;
        border-radius: 25px;
        font-weight: 600;
        z-index: 1000;
        animation: slideDown 0.3s ease;
    `;
    
    document.body.appendChild(messageDiv);
    
    setTimeout(() => {
        messageDiv.remove();
    }, 3000);
}

// Play sound effect (using Web Audio API for simple sounds)
function playSound(type) {
    if (typeof AudioContext !== 'undefined' || typeof webkitAudioContext !== 'undefined') {
        const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        const oscillator = audioCtx.createOscillator();
        const gainNode = audioCtx.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioCtx.destination);
        
        switch (type) {
            case 'collect':
                oscillator.frequency.setValueAtTime(800, audioCtx.currentTime);
                oscillator.frequency.exponentialRampToValueAtTime(1200, audioCtx.currentTime + 0.1);
                break;
            case 'complete':
                oscillator.frequency.setValueAtTime(600, audioCtx.currentTime);
                oscillator.frequency.exponentialRampToValueAtTime(1000, audioCtx.currentTime + 0.2);
                break;
            case 'error':
                oscillator.frequency.setValueAtTime(300, audioCtx.currentTime);
                oscillator.frequency.exponentialRampToValueAtTime(200, audioCtx.currentTime + 0.1);
                break;
        }
        
        gainNode.gain.setValueAtTime(0.1, audioCtx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.2);
        
        oscillator.start(audioCtx.currentTime);
        oscillator.stop(audioCtx.currentTime + 0.2);
    }
}

// Add CSS for message animations
const style = document.createElement('style');
style.textContent = `
    @keyframes slideDown {
        from { transform: translateX(-50%) translateY(-100px); opacity: 0; }
        to { transform: translateX(-50%) translateY(0); opacity: 1; }
    }
    
    @keyframes fadeOut {
        from { opacity: 1; }
        to { opacity: 0; }
    }
    
    .game-message {
        transition: all 0.3s ease;
    }
    
    .game-message.fade-out {
        animation: fadeOut 0.3s ease forwards;
    }
`;
document.head.appendChild(style);