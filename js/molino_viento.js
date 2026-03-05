const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

const scoreEl = document.getElementById('score');
const modal = document.getElementById('game-over-modal');
const modalTitle = document.getElementById('modal-title');
const modalDesc = document.getElementById('modal-desc');
const finalScoreEl = document.getElementById('final-score');
const restartBtn = document.getElementById('restart-btn');

let score = 0;
let gameActive = false;
let entities = [];
let particles = [];
let lastSpawnTime = 0;
let spawnInterval = 1200; // ms
let animationFrameId;

// Temporizador
let timeLeft = 90;
let timerIntervalId;

// Variables dinámicas del canvas
let cx, cy;
let windmillRotorAngle = 0;

// Configurar Canvas inicial
function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    cx = canvas.width / 2;
    cy = canvas.height / 2;

    // Al redimensionar, actualizar la dirección de las entidades existentes
    entities.forEach(ent => ent.updateVelocity(cx, cy));
}
window.addEventListener('resize', resizeCanvas);
resizeCanvas(); // Llamada inicial

// Definición de Clases

class Entidad {
    constructor(tipo) {
        this.tipo = tipo; // 'nube' o 'viento'
        this.radio = tipo === 'nube' ? (Math.random() * 20 + 40) : (Math.random() * 10 + 15);
        this.marcadoParaBorrar = false;

        // Generar en los bordes de la pantalla
        const borde = Math.floor(Math.random() * 4);
        const offset = 100; // spawn fuera de la vista
        if (borde === 0) { // Arriba
            this.x = Math.random() * canvas.width;
            this.y = -offset;
        } else if (borde === 1) { // Derecha
            this.x = canvas.width + offset;
            this.y = Math.random() * canvas.height;
        } else if (borde === 2) { // Abajo
            this.x = Math.random() * canvas.width;
            this.y = canvas.height + offset;
        } else { // Izquierda
            this.x = -offset;
            this.y = Math.random() * canvas.height;
        }

        // Variación ligera para darle dinamismo a las nubes
        this.rotacion = Math.random() * Math.PI * 2;
        this.velocidadRotacion = (Math.random() - 0.5) * 0.02;

        this.updateVelocity(cx, cy);
    }

    updateVelocity(targetX, targetY) {
        const angulo = Math.atan2(targetY - this.y, targetX - this.x);

        // Multiplicador de dificultad progresiva
        let diffFactor = 1;
        if (score >= 20) diffFactor = 2.2;
        else if (score >= 10) diffFactor = 1.6;
        else if (score >= 5) diffFactor = 1.3;

        // Las nubes van un poco más rápidas que el viento, pero no tanto
        const velBase = this.tipo === 'viento' ? (Math.random() * 2 + 3) : (Math.random() * 2.5 + 4);
        const velReal = velBase * diffFactor;

        this.vx = Math.cos(angulo) * velReal;
        this.vy = Math.sin(angulo) * velReal;
        this.anguloMovimiento = angulo;
    }

    update() {
        this.x += this.vx;
        this.y += this.vy;
        this.rotacion += this.velocidadRotacion;

        // Comprobar colisión con el molino (centro)
        const dist = Math.hypot(this.x - cx, this.y - cy);
        if (dist < 40) { // Radio de colisión central
            this.marcadoParaBorrar = true;
            this.llegarAlMolino();
        }
    }

    llegarAlMolino() {
        if (!gameActive) return;

        if (this.tipo === 'viento') {
            score += 1;
            windmillRotorAngle += 0.5; // Impulse visual al molino
            createParticles(cx, cy, '#e0f2fe', 5); // Partículas de viento
        } else if (this.tipo === 'nube') {
            score -= 2;
            createParticles(cx, cy, '#475569', 15); // Partículas de humo oscuras
        }

        actualizarPuntuacion();
    }

    draw(ctx) {
        ctx.save();
        ctx.translate(this.x, this.y);

        if (this.tipo === 'nube') {
            ctx.rotate(this.rotacion);
            // Dibujar Nube (oscura / tormentosa)
            ctx.fillStyle = 'rgba(71, 85, 105, 0.9)'; // Slate-600
            ctx.beginPath();
            ctx.arc(0, 0, this.radio, 0, Math.PI * 2);
            ctx.arc(-this.radio * 0.6, 0, this.radio * 0.7, 0, Math.PI * 2);
            ctx.arc(this.radio * 0.6, 0, this.radio * 0.7, 0, Math.PI * 2);
            ctx.arc(0, -this.radio * 0.5, this.radio * 0.8, 0, Math.PI * 2);
            ctx.fill();
        } else {
            // Dibujar Viento (ráfagas blancas alineadas con el movimiento)
            ctx.rotate(this.anguloMovimiento);
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
            ctx.lineWidth = 4;
            ctx.lineCap = 'round';

            ctx.beginPath();
            ctx.moveTo(-10, 0);
            ctx.lineTo(this.radio * 2, 0);

            // Liñitas de velocidad extra
            ctx.moveTo(0, -10);
            ctx.lineTo(this.radio, -10);
            ctx.moveTo(5, 10);
            ctx.lineTo(this.radio * 1.5, 10);

            ctx.stroke();
        }
        ctx.restore();
    }
}

// Sistema de Partículas (Efectos visuales)
class Particle {
    constructor(x, y, color) {
        this.x = x;
        this.y = y;
        this.color = color;
        const angulo = Math.random() * Math.PI * 2;
        const velocidad = Math.random() * 4 + 1;
        this.vx = Math.cos(angulo) * velocidad;
        this.vy = Math.sin(angulo) * velocidad;
        this.life = 1.0;
        this.decay = Math.random() * 0.05 + 0.02;
        this.size = Math.random() * 6 + 2;
    }
    update() {
        this.x += this.vx;
        this.y += this.vy;
        this.life -= this.decay;
    }
    draw(ctx) {
        ctx.globalAlpha = Math.max(0, this.life);
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1.0;
    }
}

function createParticles(x, y, color, count) {
    for (let i = 0; i < count; i++) {
        particles.push(new Particle(x, y, color));
    }
}

// Dibujo del Escenario
function drawSky(ctx) {
    // Fondo de cielo celeste
    const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
    gradient.addColorStop(0, '#0ea5e9'); // Sky-500
    gradient.addColorStop(1, '#bae6fd'); // Sky-200
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Un pequeño círculo amarillo simulando el sol de fondo opcional
    ctx.fillStyle = 'rgba(253, 224, 71, 0.4)';
    ctx.beginPath();
    ctx.arc(cx - 200, cy - 200, 100, 0, Math.PI * 2);
    ctx.fill();
}

function drawWindmill(ctx) {
    ctx.save();
    ctx.translate(cx, cy);

    // 1. Base del molino
    ctx.fillStyle = '#f3f4f6'; // Gris clarito
    ctx.beginPath();
    ctx.moveTo(-25, 100);
    ctx.lineTo(25, 100);
    ctx.lineTo(15, -20);
    ctx.lineTo(-15, -20);
    ctx.fill();

    // Detalle de la puerta/ventanas
    ctx.fillStyle = '#374151';
    ctx.fillRect(-8, 50, 16, 25); // puerta

    // 2. Cúpula
    ctx.fillStyle = '#ef4444'; // Techo Rojo
    ctx.beginPath();
    ctx.arc(0, -20, 15, Math.PI, 0);
    ctx.fill();

    // 3. Rotor y Aspas
    ctx.translate(0, -20); // El eje es el top de la base
    ctx.rotate(windmillRotorAngle);

    // Eje central
    ctx.fillStyle = '#1f2937';
    ctx.beginPath();
    ctx.arc(0, 0, 8, 0, Math.PI * 2);
    ctx.fill();

    // Las 4 aspas
    ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
    ctx.strokeStyle = '#d1d5db';
    ctx.lineWidth = 2;
    for (let i = 0; i < 4; i++) {
        ctx.rotate(Math.PI / 2);
        ctx.beginPath();
        // Diseño de aspa tradicional
        ctx.moveTo(5, 5);
        ctx.lineTo(10, 80);
        ctx.lineTo(-10, 80);
        ctx.lineTo(-5, 5);
        ctx.fill();
        ctx.stroke();

        // Estructura de rejilla dentro del aspa
        ctx.strokeStyle = 'rgba(156, 163, 175, 0.5)';
        ctx.beginPath();
        for (let j = 20; j < 75; j += 10) {
            ctx.moveTo(-8, j);
            ctx.lineTo(8, j);
        }
        ctx.stroke();
    }

    ctx.restore();

    // Rotación pasiva base del molino
    let baseRotationSpeed = 0.01;
    // Gira más rápido cuantas más puntuación tengas (mejor viento)
    if (score > 0) baseRotationSpeed += Math.min(score * 0.002, 0.05);
    windmillRotorAngle += baseRotationSpeed;
}

// Bucle del Juego
function gameLoop(timestamp) {
    if (!gameActive) return;

    // Calcular spawn
    if (timestamp - lastSpawnTime > spawnInterval) {
        spawnEntity();
        lastSpawnTime = timestamp;

        // Aumentar spawn rate con la dificultad
        if (score >= 20) spawnInterval = 600;
        else if (score >= 10) spawnInterval = 800;
        else if (score >= 5) spawnInterval = 1000;
        else spawnInterval = 1200;
    }

    // Dibujar Escenario
    drawSky(ctx);

    // Actualizar y dibujar Entidades
    for (let i = entities.length - 1; i >= 0; i--) {
        const ent = entities[i];
        ent.update();
        if (ent.marcadoParaBorrar) {
            entities.splice(i, 1);
        } else {
            ent.draw(ctx);
        }
    }

    // Dibujar Molino (sobre las entidades que van por detrás)
    drawWindmill(ctx);

    // Actualizar y dibujar Partículas
    for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.update();
        if (p.life <= 0) particles.splice(i, 1);
        else p.draw(ctx);
    }

    animationFrameId = requestAnimationFrame(gameLoop);
}

function spawnEntity() {
    // 60% chance de Nube, 40% chance de Viento
    const tipo = Math.random() > 0.4 ? 'nube' : 'viento';
    entities.push(new Entidad(tipo));
}

// Interacción del jugador
canvas.addEventListener('pointerdown', (e) => {
    if (!gameActive) return;

    // Obtener coordenadas correctas de clic
    const rect = canvas.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;

    // Recorrer de forma inversa (las dibujadas al final están encima en z-index visual)
    for (let i = entities.length - 1; i >= 0; i--) {
        const ent = entities[i];
        // Solo podemos eliminar nubes
        if (ent.tipo === 'nube') {
            const dist = Math.hypot(ent.x - clickX, ent.y - clickY);
            // Hitbox generosa, el radio base de la nube + un margen
            if (dist < ent.radio * 1.5) {
                // Eliminar nube (defensa exitosa)
                createParticles(ent.x, ent.y, '#94a3b8', 12); // Puf de humo
                entities.splice(i, 1);
                // Opcional: break aquí para eliminar de 1 en 1, o quitarlo para eliminar varias superpuestas
                break;
            }
        }
    }
});

function actualizarPuntuacion() {
    scoreEl.textContent = score;

    // Verificar Victoria
    if (score >= 30) {
        terminarJuego(true);
    }
    // Verificar Derrota
    else if (score < 0) {
        terminarJuego(false);
    }
}

function terminarJuego(esVictoria, esTiempoAgotado = false) {
    gameActive = false;
    cancelAnimationFrame(animationFrameId);
    clearInterval(timerIntervalId);

    if (esVictoria) {
        modalTitle.textContent = "¡Victoria!";
        modalTitle.className = "win";
        modalDesc.textContent = "¡Has salvado la energía del molino al máximo nivel!";

        setTimeout(() => {
            if (window.parent !== window) {
                window.parent.postMessage({ type: 'game_result', win: true }, '*');
            } else {
                finalScoreEl.textContent = score;
                modal.classList.remove('hidden');
            }
        }, 1500);

    } else {
        if (esTiempoAgotado) {
            modalTitle.textContent = "¡Tiempo Agotado!";
            modalTitle.className = "lose";
            modalDesc.textContent = "No lograste recolectar suficiente energía a tiempo.";
        } else {
            modalTitle.textContent = "¡Derrota!";
            modalTitle.className = "lose";
            modalDesc.textContent = "El molino se ha quedado sin energía ante la tormenta.";
        }

        setTimeout(() => {
            if (window.parent !== window) {
                window.parent.postMessage({ type: 'game_result', win: false }, '*');
            } else {
                finalScoreEl.textContent = score;
                modal.classList.remove('hidden');
            }
        }, 1500);
    }
}

function iniciarJuego() {
    score = 0;
    entities = [];
    particles = [];
    windmillRotorAngle = 0;
    spawnInterval = 1200;
    actualizarPuntuacion();

    modal.classList.add('hidden');

    gameActive = true;
    lastSpawnTime = performance.now();

    // Iniciar temporizador
    timeLeft = 90;
    actualizarTemporizadorUI();
    clearInterval(timerIntervalId);
    timerIntervalId = setInterval(() => {
        timeLeft--;
        actualizarTemporizadorUI();
        if (timeLeft <= 0) {
            terminarJuego(false, true); // Derrota por tiempo
        }
    }, 1000);

    animationFrameId = requestAnimationFrame(gameLoop);
}

function actualizarTemporizadorUI() {
    const timerEl = document.getElementById('timer');
    if (timerEl) {
        timerEl.textContent = timeLeft;
    }
}

// Escuchar botón de reiniciar
restartBtn.addEventListener('click', iniciarJuego);

// Iniciar al cargar
window.addEventListener('load', iniciarJuego);
