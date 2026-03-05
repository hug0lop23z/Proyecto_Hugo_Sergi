// --- VARIABLES GLOBALES INYECTABLES (Simuladas) ---
let score = 15; // Determina la dificultad
let lives = 3;
const TIME_LIMIT = 10000; // 10 segundos en milisegundos

// Función global o externa (simulada aquí, en el proyecto real puede estar definida fuera)
window.nextLevel = window.nextLevel || function () {
    setTimeout(() => {
        alert("Redirigiendo al siguiente minijuego...\n[Llamada a nextLevel() completada]");
        // Para pruebas, reiniciamos el nivel sumando score
        score += 5;
        initGame();
    }, 1000);
};

// --- CONFIGURACIÓN DE DIFICULTAD ---
let targetFloors = 3;
let helicopterSpeedMod = 1;

// --- ELEMENTOS DEL DOM ---
const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
const timeBar = document.getElementById('time-bar');
const floorCounter = document.getElementById('floor-counter');
const msgOverlay = document.getElementById('message-overlay');
const msgText = document.getElementById('message-text');
const restartBtn = document.getElementById('restart-btn');

// --- ESTADO DEL JUEGO ---
let width, height;
let blocks = [];
let currentBlock = null;
let base = null;
let helicopter = null;

let startTime = 0;
let lastTime = 0;
let gameActive = false;
let camY = 0;
let gravity = 1800; // Gravedad (px / s^2)

let bw, bh; // Block width, Block height

function resize() {
    width = window.innerWidth;
    height = window.innerHeight;
    canvas.width = width;
    canvas.height = height;

    // Tamaños responsivos
    bw = Math.min(width * 0.25, 120);
    bh = bw * 0.6;

    // Instanciar o reubicar base
    if (!base) {
        base = {
            w: bw * 1.5,
            h: bh,
            color: '#7f8c8d'
        };
    }
    base.x = width / 2 - base.w / 2;
    base.y = height - base.h;

    if (!helicopter) {
        helicopter = {
            x: width / 2,
            y: height * 0.12,
            size: bh * 0.6,
            dir: 1,
            speed: width * helicopterSpeedMod
        };
        if (helicopter.size < 30) helicopter.size = 30;
    } else {
        helicopter.speed = width * helicopterSpeedMod;
    }
}

window.addEventListener('resize', resize);

// --- LÓGICA DE OBJETOS ---
function createBlock() {
    const hue = Math.floor(Math.random() * 360);
    return {
        x: helicopter.x - bw / 2,
        y: helicopter.y + helicopter.size * 0.5 - camY,
        w: bw,
        h: bh,
        color: `hsl(${hue}, 65%, 50%)`,
        falling: false,
        vy: 0,
        // Patrón aleatorio para las 8 ventanas (bitmask)
        winPattern: Math.floor(Math.random() * 256)
    };
}

function drawShape(obj, isBase = false, isHeli = false) {
    ctx.save();
    ctx.translate(obj.x, obj.y + camY);

    if (isBase) {
        ctx.fillStyle = obj.color;
        ctx.fillRect(0, 0, obj.w, obj.h);
        ctx.fillStyle = '#95a5a6';
        ctx.fillRect(0, 5, obj.w, 10);

        // Texto en la base
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 16px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('BASE', obj.w / 2, obj.h / 2 + 6);

    } else if (isHeli) {
        ctx.font = `${obj.size}px Arial`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        // Compensar la traslación de la esquina superior izquierda
        ctx.translate(-obj.x, -(obj.y + camY));
        ctx.fillText('🚁', obj.x, obj.y + camY);
    } else {
        // Dibujar bloque/piso
        ctx.fillStyle = obj.color;
        ctx.fillRect(0, 0, obj.w, obj.h);

        // Borde oscuro
        ctx.strokeStyle = '#2c3e50';
        ctx.lineWidth = 3;
        ctx.strokeRect(0, 0, obj.w, obj.h);

        // Dibujar 8 ventanas (2 filas, 4 columnas)
        let bitCounter = 0;
        const rows = 2, cols = 4;
        const pX = obj.w * 0.08, pY = obj.h * 0.15;
        const wW = (obj.w - pX * 2) / cols * 0.65;
        const wH = (obj.h - pY * 2) / rows * 0.65;
        const sX = (obj.w - pX * 2 - wW * cols) / (cols - 1);
        const sY = (obj.h - pY * 2 - wH * rows) / (rows - 1);

        for (let r = 0; r < rows; r++) {
            for (let c = 0; c < cols; c++) {
                const isLit = (obj.winPattern & (1 << bitCounter)) !== 0;
                ctx.fillStyle = isLit ? '#f1c40f' : '#2c3e50';
                ctx.fillRect(
                    pX + c * (wW + sX),
                    pY + r * (wH + sY),
                    wW, wH
                );
                bitCounter++;
            }
        }
    }

    ctx.restore();
}

function updateCamera() {
    if (blocks.length > 0) {
        // Asegurarse de que el bloque superior siempre esté visible por debajo del helicóptero
        const topPiso = blocks[blocks.length - 1];
        const targetY = topPiso.y;
        // Calculamos dónde queremos que quede visualmente en pantalla
        const idealScreenY = height * 0.5;
        const currentScreenY = targetY + camY;

        // Si se acerca a la parte superior, bajar la cámara (aumentar camY)
        if (currentScreenY < idealScreenY) {
            camY += (idealScreenY - currentScreenY) * 0.1;
        }
    }
}

// --- SISTEMA DE ENTRADA ---
function dropBlock() {
    if (gameActive && currentBlock && !currentBlock.falling) {
        currentBlock.falling = true;
        currentBlock.vy = 0;
    }
}

window.addEventListener('keydown', (e) => {
    if (e.code === 'Space') { e.preventDefault(); dropBlock(); }
});
window.addEventListener('mousedown', dropBlock);
window.addEventListener('touchstart', (e) => { e.preventDefault(); dropBlock(); }, { passive: false });

function endGame(victory) {
    if (!gameActive) return;
    gameActive = false;
    msgOverlay.style.opacity = 1;
    msgOverlay.style.pointerEvents = 'auto';
    if (victory) {
        msgText.innerText = "¡Edificio Completado!";
        msgText.style.color = "#4cc9f0";
        restartBtn.style.display = "none";
        setTimeout(() => window.nextLevel(), 1500);
    } else {
        msgText.innerText = "Derrota...";
        msgText.style.color = "#f94144";
        lives--;
        console.log(`Fallo. Vidas restantes (simuladas): ${lives}`);
        restartBtn.style.display = "block";
        restartBtn.innerText = "Reintentar";
    }
}

function update(dt) {
    if (!gameActive) return;

    // Mover helicóptero
    helicopter.x += helicopter.dir * helicopter.speed * dt;
    const edgeM = bw; // Margen para rebotar en paredes
    if (helicopter.x > width - edgeM) {
        helicopter.x = width - edgeM;
        helicopter.dir = -1;
    } else if (helicopter.x < edgeM) {
        helicopter.x = edgeM;
        helicopter.dir = 1;
    }

    // Sujetar bloque o dejarlo caer
    if (currentBlock && !currentBlock.falling) {
        currentBlock.x = helicopter.x - currentBlock.w / 2;
        currentBlock.y = helicopter.y + helicopter.size * 0.5 - camY;
    }

    updateCamera();

    // Simular física
    if (currentBlock && currentBlock.falling) {
        currentBlock.vy += gravity * dt;
        // Predecir la siguiente Y para colisión precisa
        let nextY = currentBlock.y + currentBlock.vy * dt;

        let targetRect = blocks.length > 0 ? blocks[blocks.length - 1] : base;

        // Detección de colisión vertical (cruzando el plano Y superior del target)
        if (currentBlock.y + currentBlock.h <= targetRect.y && nextY + currentBlock.h >= targetRect.y) {

            const offset = bw * 0.15; // Tolerancia permitida en bordes

            if (currentBlock.x + currentBlock.w > targetRect.x + offset &&
                currentBlock.x < targetRect.x + targetRect.w - offset) {

                // Impacto en el piso correcto
                currentBlock.y = targetRect.y - currentBlock.h;
                currentBlock.falling = false;
                blocks.push(currentBlock);

                // Actualizar UI y animar sutilmente
                floorCounter.innerText = `Pisos: ${blocks.length} / ${targetFloors}`;
                floorCounter.style.transform = `scale(1.2)`;
                setTimeout(() => floorCounter.style.transform = `scale(1)`, 150);

                // Si cumple, victoria directa
                if (blocks.length >= targetFloors) {
                    endGame(true);
                } else {
                    // Siguiente bloque
                    currentBlock = createBlock();

                    // Restablecer el reloj para el siguiente piso
                    startTime = performance.now();
                }
            } else {
                currentBlock.y = nextY; // Sigue cayendo
            }
        } else {
            currentBlock.y = nextY;
        }

        // Si el bloque cae por debajo de la pantalla visible, se pierde la partida
        if (currentBlock.y > height - camY + currentBlock.h) {
            endGame(false);
        }
    }

    // Gestión del temporizador
    let elapsed = performance.now() - startTime;
    let remaining = TIME_LIMIT - elapsed;

    if (remaining <= 0) {
        remaining = 0;
        timeBar.style.width = '0%';
        if (blocks.length < targetFloors) {
            endGame(false); // Se acabó el tiempo
        }
    } else {
        let perc = (remaining / TIME_LIMIT) * 100;
        timeBar.style.width = perc + '%';
        if (perc < 25) timeBar.style.background = '#f94144';
        else if (perc < 50) timeBar.style.background = '#f8961e';
        else timeBar.style.background = '#4cc9f0';
    }
}

function draw() {
    ctx.clearRect(0, 0, width, height);

    drawShape(base, true);

    for (let b of blocks) {
        drawShape(b);
    }

    if (currentBlock) {
        drawShape(currentBlock);
    }

    drawShape(helicopter, false, true);
}

function gameLoop(time) {
    let dt = (time - lastTime) / 1000;
    if (dt > 0.1) dt = 0.1; // Límite para cuando cambias de pestaña
    lastTime = time;

    update(dt);
    draw();

    requestAnimationFrame(gameLoop);
}

window.initGame = function () {
    resize();
    blocks = [];

    // Recalcular dificultad con la variable score actual (reacciona a la lógica del juego contenedor)
    if (score < 10) {
        targetFloors = 3;
        helicopterSpeedMod = 0.2;
    } else if (score <= 20) {
        targetFloors = 5;
        helicopterSpeedMod = 0.35;
    } else {
        targetFloors = 7;
        helicopterSpeedMod = 0.6;
    }

    // Refrescar en base al redimensionamiento
    helicopter.speed = width * helicopterSpeedMod;

    camY = 0; // Reiniciar cámara
    currentBlock = createBlock();

    startTime = performance.now();
    lastTime = startTime;
    gameActive = true;

    floorCounter.innerText = `Pisos: 0 / ${targetFloors}`;
    timeBar.style.background = '#4cc9f0';
    timeBar.style.width = '100%';

    msgOverlay.style.opacity = 0;
    msgOverlay.style.pointerEvents = 'none';
};

// Iniciar en el primer frame visual
requestAnimationFrame((t) => {
    lastTime = t;
    initGame();
    gameLoop(t);
});
