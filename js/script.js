document.addEventListener('DOMContentLoaded', () => {
    // Smooth scrolling for anchor links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();

            const targetId = this.getAttribute('href');
            if (targetId === '#') return;

            const targetElement = document.querySelector(targetId);

            if (targetElement) {
                targetElement.scrollIntoView({
                    behavior: 'smooth'
                });
            }
        });
    });

    // Elements to reveal with stagger on scroll
    const animateElements = document.querySelectorAll('.card, .doc-item, .game-card');

    const observerOptions = {
        threshold: 0.1,
        rootMargin: "0px 0px -50px 0px"
    };

    let delayIndex = 0;
    let delayTimeout;

    const observer = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const el = entry.target;

                // Efecto cascada (aparecen uno a uno de forma sucesiva)
                setTimeout(() => {
                    el.style.opacity = '1';
                    el.style.transform = 'translateY(0) scale(1)';
                }, 100 * delayIndex);

                delayIndex++;
                observer.unobserve(el);

                // Reiniciar el contador de retraso después de un corto tiempo para separar grupos
                clearTimeout(delayTimeout);
                delayTimeout = setTimeout(() => { delayIndex = 0; }, 200);
            }
        });
    }, observerOptions);

    animateElements.forEach(el => {
        el.style.opacity = '0';
        el.style.transform = 'translateY(30px) scale(0.95)';
        // Important: Remove the transform from here when hover triggers. CSS handles hover.
        el.style.transition = 'opacity 0.6s ease-out, transform 0.6s cubic-bezier(0.175, 0.885, 0.32, 1.275)';
        observer.observe(el);
    });

    // --- LÓGICA DEL ORQUESTADOR (WarioWare Style) ---
    const btnPlayHero = document.querySelector('.hero-content .cta-button');
    const orchModal = document.getElementById('orchestrator-modal');
    const iframe = document.getElementById('game-iframe');
    const scoreSpan = document.getElementById('orch-score');
    const livesDiv = document.getElementById('orch-lives');
    const closeBtn = document.getElementById('orch-close');
    const transitionOverlay = document.getElementById('orch-transition-overlay');
    const transitionText = document.getElementById('orch-transition-text');

    const microgames = [
        'apaga_el_fuego.html',
        'construye_la_torre.html',
        'juego_color.html',
        'juego_pescado.html',
        'molino_viento.html',
        'repair_heart.html'
    ];

    let currentScore = 0;
    let currentLives = 3;

    function updateOrchestratorUI() {
        scoreSpan.textContent = currentScore;
        let heartsHTML = '';
        for (let i = 0; i < currentLives; i++) {
            heartsHTML += '❤️';
        }
        for (let i = currentLives; i < 3; i++) {
            heartsHTML += '🖤'; // Vidas perdidas
        }
        livesDiv.textContent = heartsHTML;
    }

    function initOrchestrator() {
        currentScore = 0;
        currentLives = 3;
        updateOrchestratorUI();

        orchModal.classList.remove('hidden');
        document.body.style.overflow = 'hidden'; // Prevenir scroll lateral en el body main

        loadRandomGame();
    }

    function closeOrchestrator() {
        orchModal.classList.add('hidden');
        iframe.src = "about:blank";
        document.body.style.overflow = ''; // Restaurar scroll
    }

    function loadRandomGame() {
        if (currentLives <= 0) {
            closeOrchestrator();
            return;
        }

        const randomGame = microgames[Math.floor(Math.random() * microgames.length)];

        // Fase de "Prepárate"
        transitionText.textContent = "¡PREPÁRATE!";
        transitionText.style.color = "var(--text-color)";
        transitionText.style.textShadow = "2px 2px var(--neon-magenta)";
        transitionOverlay.classList.remove('hidden');
        iframe.src = "about:blank"; // Limpiar iframe anterior

        setTimeout(() => {
            transitionOverlay.classList.add('hidden');
            // Cargar el juego pasándole el score actual por URL (para dificultad progresiva si el juego lo soporta)
            iframe.src = `${randomGame}?sysScore=${currentScore}`;
            iframe.focus();
        }, 800);
    }

    function handleGameResult(won) {
        if (won) {
            currentScore++;
            transitionText.textContent = "¡ÉXITO!";
            transitionText.style.color = "var(--neon-lime)";
            transitionText.style.textShadow = "0 0 10px var(--neon-lime)";
        } else {
            currentLives--;
            transitionText.textContent = "¡FALLO!";
            transitionText.style.color = "#ff4444";
            transitionText.style.textShadow = "0 0 10px #ff0000";
        }

        updateOrchestratorUI();
        transitionOverlay.classList.remove('hidden');
        iframe.src = "about:blank"; // Inmediatamente ocultar el juego fallado/ganado

        setTimeout(() => {
            if (currentLives > 0) {
                loadRandomGame(); // Directo a otro juego
            } else {
                // Perder las 3 vidas = volver al inicio
                closeOrchestrator();
            }
        }, 1200);
    }

    // Escuchar mensajes provenientes de los iframes
    window.addEventListener('message', (event) => {
        // En producción se validaría event.origin
        if (event.data && event.data.type === 'game_result') {
            handleGameResult(event.data.win);
        }
    });

    // Eventos UI del Orquestador
    if (btnPlayHero) {
        btnPlayHero.addEventListener('click', (e) => {
            e.preventDefault(); // Evitar scroll
            initOrchestrator();
        });
    }

    closeBtn.addEventListener('click', closeOrchestrator);

    console.log('Microjuegos Sergi y Hugo - Landing Page Loaded');
});