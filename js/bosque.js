/* --- CONFIGURACIÓN --- */
        const TIME_LIMIT = 10000; // 10 segundos
        const FIRES_EASY = 5;
        const FIRES_MEDIUM = 12;
        const FIRES_HARD = 20;

        // Simulación de variables globales
        let score = 5; // CAMBIAR AQUÍ PARA PROBAR DIFICULTAD (<10, 10-20, >20)
        let lives = 3;

        /* --- ELEMENTOS DOM --- */
        const cursor = document.getElementById('water-cursor');
        const gameArea = document.getElementById('game-area');
        const timerBar = document.getElementById('timer-bar');
        const overlay = document.getElementById('game-overlay');
        const overlayTitle = document.getElementById('overlay-title');
        const overlayMsg = document.getElementById('overlay-msg');
        const body = document.body;

        /* --- ESTADO DEL JUEGO --- */
        let firesRemaining = 0;
        let gameActive = false;
        let startTime;
        let timerInterval;

        /* --- INICIALIZACIÓN --- */
        function initGame() {
            // Reset UI State (important for restarts)
            overlay.style.visibility = 'hidden';
            timerBar.style.width = '100%';
            timerBar.style.backgroundColor = '#ffcc00';
            body.classList.remove('burnt');

            // Remove any remaining fires
            document.querySelectorAll('.fire').forEach(f => f.remove());

            // Determinar dificultad
            let fireCount = FIRES_EASY;
            if (score >= 10 && score <= 20) fireCount = FIRES_MEDIUM;
            if (score > 20) fireCount = FIRES_HARD;

            firesRemaining = fireCount;
            gameActive = true;

            console.log(`Juego iniciado. Score: ${score}. Dificultad: ${fireCount} fuegos.`);

            spawnFires(fireCount);
            startTimer();
        }

        function nextLevel() {
            score += 5; // Aumentar puntuación para simular progresión
            initGame(); // Reiniciar el nivel con la nueva dificultad
        }

        function spawnFires(count) {
            const fires = [];
            const minDistance = 80; // Minimum distance between fires to avoid overlap

            let attempts = 0;
            while (fires.length < count && attempts < count * 10) {
                const maxX = window.innerWidth - 100;
                const maxY = window.innerHeight - 150; // Extra buffer for timer

                const x = Math.random() * maxX + 50;
                const y = Math.random() * maxY + 100; // Start lower to avoid timer

                // Check distance against existing fires
                let overlap = false;
                for (let f of fires) {
                    const dx = f.x - x;
                    const dy = f.y - y;
                    const distance = Math.sqrt(dx * dx + dy * dy);
                    if (distance < minDistance) {
                        overlap = true;
                        break;
                    }
                }

                if (!overlap) {
                    createFire(x, y);
                    fires.push({ x, y });
                }
                attempts++;
            }

            // Fallback if we couldn't place without overlap (just place it anyway to ensure count)
            while (fires.length < count) {
                createFire(Math.random() * (window.innerWidth - 100) + 50, Math.random() * (window.innerHeight - 150) + 100);
                fires.push({ x: 0, y: 0 });
            }
        }

        function createFire(x, y) {
            const fire = document.createElement('div');
            fire.classList.add('fire');
            fire.textContent = '🔥';

            fire.style.left = `${x}px`;
            fire.style.top = `${y}px`;

            // Evento Click
            fire.addEventListener('mousedown', (e) => {
                e.stopPropagation(); // Prevent hitting elements behind
                extinguishFire(fire);
            });

            gameArea.appendChild(fire);
        }

        /* --- LÓGICA DEL JUEGO --- */

        // Seguimiento del cursor
        document.addEventListener('mousemove', (e) => {
            cursor.style.left = `${e.clientX}px`;
            cursor.style.top = `${e.clientY}px`;
        });

        // Efecto visual de click
        document.addEventListener('mousedown', () => cursor.classList.add('active'));
        document.addEventListener('mouseup', () => cursor.classList.remove('active'));

        function extinguishFire(fireElement) {
            if (!gameActive) return;

            // Efecto de sonido (opcional, visual por ahora)
            // Eliminar elemento
            fireElement.remove();
            firesRemaining--;

            if (firesRemaining <= 0) {
                endGame(true);
            }
        }

        function startTimer() {
            startTime = Date.now();
            timerInterval = setInterval(() => {
                if (!gameActive) return;

                const elapsed = Date.now() - startTime;
                const remaining = TIME_LIMIT - elapsed;

                // Actualizar barra visual
                const percentage = (remaining / TIME_LIMIT) * 100;
                timerBar.style.width = `${percentage}%`;

                // Cambio de color de la barra (Verde -> Rojo)
                if (percentage < 30) timerBar.style.backgroundColor = '#ff4444';
                else timerBar.style.backgroundColor = '#ffcc00';

                // Chequear fin de tiempo
                if (remaining <= 0) {
                    endGame(false);
                }

            }, 50); // 20 FPS para la barra es suficiente
        }

        function endGame(won) {
            gameActive = false;
            clearInterval(timerInterval);
            overlay.style.visibility = 'visible';

            if (won) {
                overlayTitle.textContent = "¡BOSQUE SALVADO!";
                overlayTitle.style.color = "#44ff44"; // Verde victoria
                overlayMsg.textContent = "Has apagado todos los fuegos.";

                // Simular llamada a siguiente nivel
                setTimeout(() => {
                    console.log("Llamando a nextLevel()...");
                    nextLevel();
                }, 2000);

            } else {
                overlayTitle.textContent = "EL BOSQUE SE QUEMÓ";
                overlayTitle.style.color = "#ff4444"; // Rojo derrota
                overlayMsg.textContent = "Se acabó el tiempo.";

                // Efectos de derrota
                body.classList.add('burnt');
                lives--; // Restar vida
                console.log(`Vidas restantes: ${lives}`);
            }
        }

        // Iniciar al cargar
        initGame();