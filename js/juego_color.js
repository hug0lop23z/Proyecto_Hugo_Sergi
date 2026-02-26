// Referencias a elementos del DOM
const scoreEl = document.getElementById('score');
const timerBar = document.getElementById('timer-bar');
const gameArea = document.getElementById('game-area');
const modal = document.getElementById('game-over-modal');
const finalScoreEl = document.getElementById('final-score');
const restartBtn = document.getElementById('restart-btn');

// Estado del juego
let score = 0;
let gameActive = false;
let timerTimeout = null;
const ROUND_TIME_MS = 2000; // 2 segundos por ronda
const FRUIT_SIZE = 70; // Tamaño de la fruta acorde al CSS (70x70)

function initGame() {
    score = 0;
    scoreEl.textContent = score;
    modal.classList.add('hidden');
    gameActive = true;
    startRound();
}

function startRound() {
    if (!gameActive) return;

    // Detener cualquier temporizador anterior
    clearTimeout(timerTimeout);

    // 1. Dificultad Progresiva: 
    // Empezamos con una diferencia de luminosidad de 25%.
    // A medida que la puntuación sube, la diferencia baja, hasta un mínimo de tan solo 2.5%.
    const lightDifference = Math.max(2.5, 25 - (score * 1.5));
    
    // 2. Lógica del color de la fruta
    const hue = Math.floor(Math.random() * 360); // Tono aleatorio (0-360)
    const saturation = 85; 
    const baseLightness = 60; // Frutas normales (brillantes)
    const darkLightness = baseLightness - lightDifference; // La fruta objetivo (más oscura)

    const normalColor = `hsl(${hue}, ${saturation}%, ${baseLightness}%)`;
    const targetColor = `hsl(${hue}, ${saturation}%, ${darkLightness}%)`;

    // Limpiar el área de juego
    gameArea.innerHTML = ''; 

    // Elegir cuál de las 3 frutas será la correcta
    const correctFruitIndex = Math.floor(Math.random() * 3);
    
    // Obtener las dimensiones del campo donde pueden aparecer (con margen)
    const padding = 15;
    const maxW = gameArea.clientWidth - FRUIT_SIZE - padding * 2;
    const maxH = gameArea.clientHeight - FRUIT_SIZE - padding * 2;

    const usedPositions = [];

    // Función auxiliar para evitar que las frutas se superpongan demasiado
    function getValidPosition() {
        let pos, isValid, attempts = 0;
        do {
            isValid = true;
            pos = {
                x: padding + Math.random() * maxW,
                y: padding + Math.random() * maxH
            };
            
            // Verificar colisión con otras frutas ya colocadas
            for (let p of usedPositions) {
                const dx = p.x - pos.x;
                const dy = p.y - pos.y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                if (distance < FRUIT_SIZE + 10) { // +10px de separación de seguridad
                    isValid = false;
                    break;
                }
            }
            attempts++;
        } while (!isValid && attempts < 50); // Intentar colocarla máximo 50 veces
        
        usedPositions.push(pos);
        return pos;
    }

    // 3. Generar las 3 frutas
    for (let i = 0; i < 3; i++) {
        const isCorrect = (i === correctFruitIndex);
        const fruitColor = isCorrect ? targetColor : normalColor;
        const pos = getValidPosition();

        const fruitEl = document.createElement('div');
        fruitEl.classList.add('fruit');
        fruitEl.style.backgroundColor = fruitColor;
        fruitEl.style.boxShadow = `0 10px 20px ${fruitColor}80, inset 0 -5px 15px rgba(0,0,0,0.2)`;
        fruitEl.style.left = `${pos.x}px`;
        fruitEl.style.top = `${pos.y}px`;

        // Evento 'pointerdown' reacciona instantáneo en móviles y en PC
        fruitEl.addEventListener('pointerdown', (e) => {
            e.preventDefault(); // Prevenir comportamientos por defecto
            handleFruitClick(isCorrect);
        });

        gameArea.appendChild(fruitEl);
    }

    // 4. Iniciar temporizador visual y lógico
    resetAndStartTimerBar();
}

function handleFruitClick(isCorrect) {
    if (!gameActive) return;

    if (isCorrect) {
        // Acierto
        score++;
        scoreEl.textContent = score;
        
        // Efecto visual al acertar (encoge el área un poquito y vuelve)
        gameArea.style.transform = 'scale(0.98)';
        setTimeout(() => gameArea.style.transform = 'scale(1)', 100);
        
        startRound();
    } else {
        // Error (Hizo clic en la fruta equivocada)
        endGame();
    }
}

function resetAndStartTimerBar() {
    // Para reiniciar la transición CSS, quitamos temporalmente la transición y reseteamos el transform
    timerBar.style.transition = 'none';
    timerBar.style.transform = 'scaleX(1)';
    
    // Forzamos un 'reflow' de la página antes de aplicar la nueva animación
    void timerBar.offsetWidth;

    // Reactivamos la transición y hacemos que gradualmente vaya a tamaño 0
    timerBar.style.transition = `transform ${ROUND_TIME_MS}ms linear`;
    timerBar.style.transform = 'scaleX(0)';

    // Programamos el Game Over lógico si se acaba el tiempo
    timerTimeout = setTimeout(() => {
        if (gameActive) {
            endGame(); // Se acabó el tiempo
        }
    }, ROUND_TIME_MS);
}

function endGame() {
    gameActive = false;
    clearTimeout(timerTimeout);
    
    // Detener la barra visualmente en donde se haya quedado
    const computedTransform = window.getComputedStyle(timerBar).transform;
    timerBar.style.transition = 'none';
    timerBar.style.transform = computedTransform;
    
    // Mostrar fin de partida
    finalScoreEl.textContent = score;
    modal.classList.remove('hidden');
}

// Configurar botón de reinicio
restartBtn.addEventListener('click', initGame);

// Iniciar el juego automáticamente al cargar la página
window.addEventListener('DOMContentLoaded', initGame);
