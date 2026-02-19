document.addEventListener('DOMContentLoaded', () => {

            // --- CONFIGURATION ---
            // Simulate random score for testing difficulty scaling
            // Change limits to test: 0-9 (Easy), 10-20 (Medium), 21+ (Hard)
            let currentScore = Math.floor(Math.random() * 30);

            // Game State
            let lives = 3; // Simulated lives
            const TIME_LIMIT = 3000; // 3 seconds
            let clicksRequired = 0;
            let currentClicks = 0;
            let gameActive = false;
            let timerInterval;

            // DOM Elements
            const leftHalf = document.getElementById('left-half');
            const rightHalf = document.getElementById('right-half');
            const heartContainer = document.getElementById('heart-container');
            const timerBar = document.getElementById('timer-bar');
            const feedbackEl = document.getElementById('feedback');
            const debugScore = document.getElementById('debug-score');
            const debugReq = document.getElementById('debug-req');
            const debugLives = document.getElementById('debug-lives');

            // --- INITIALIZATION ---
            function initGame() {
                // Difficulty Scaling Logic
                if (currentScore < 10) {
                    clicksRequired = 5;
                    document.body.style.backgroundColor = "#2b0000"; // Dark Red for Easy
                } else if (currentScore <= 20) {
                    clicksRequired = 12;
                    document.body.style.backgroundColor = "#2b1a00"; // Dark Orange for Medium
                } else {
                    clicksRequired = 20;
                    document.body.style.backgroundColor = "#1a002b"; // Dark Purple for Hard
                }

                currentClicks = 0;
                gameActive = true;

                // Set initial visual state (Broken)
                updateHeartVisuals();

                // Debug Info
                debugScore.textContent = currentScore;
                debugReq.textContent = clicksRequired;
                debugLives.textContent = lives;

                // Start Timer
                startTimer();

                console.log(`Game Started! Score: ${currentScore}, Target: ${clicksRequired}`);
            }

            // --- CORE MECHANICS ---
            heartContainer.addEventListener('mousedown', handleClick);
            heartContainer.addEventListener('touchstart', (e) => {
                e.preventDefault(); // Prevent double firing on touch devices
                handleClick();
            });

            function handleClick() {
                if (!gameActive) return;

                currentClicks++;

                // Visual Feedback on click
                pulseHeart();
                updateHeartVisuals();
                createParticle();

                // Check Win Condition
                if (currentClicks >= clicksRequired) {
                    winGame();
                }
            }

            function updateHeartVisuals() {
                // Calculate gap based on progress
                // 0 clicks = max gap (e.g., 20px total, 10px each side)
                // max clicks = 0 gap
                const progress = currentClicks / clicksRequired;
                const maxGap = 15; // Max displacement in pixels
                const currentGap = maxGap * (1 - progress);

                // Apply transform to SVG groups
                // Rotate slightly to emphasize brokenness
                const rotate = 10 * (1 - progress);

                leftHalf.style.transform = `translate(-${currentGap}px, 0) rotate(-${rotate}deg)`;
                rightHalf.style.transform = `translate(${currentGap}px, 0) rotate(${rotate}deg)`;

                // Ensure origin is center for rotation
                leftHalf.style.transformBox = "fill-box";
                leftHalf.style.transformOrigin = "bottom right";
                rightHalf.style.transformBox = "fill-box";
                rightHalf.style.transformOrigin = "bottom left";
            }

            function pulseHeart() {
                heartContainer.style.transform = "scale(1.1)";
                setTimeout(() => {
                    heartContainer.style.transform = "scale(1)";
                }, 100);
            }

            // --- TIMER LOGIC ---
            function startTimer() {
                let startTime = Date.now();

                timerInterval = setInterval(() => {
                    if (!gameActive) return;

                    let elapsedTime = Date.now() - startTime;
                    let timeLeft = TIME_LIMIT - elapsedTime;
                    let percentage = (timeLeft / TIME_LIMIT) * 100;

                    if (percentage <= 0) {
                        percentage = 0;
                        loseGame();
                    }

                    timerBar.style.width = `${percentage}%`;

                    // Change color based on urgency
                    if (percentage < 30) {
                        timerBar.style.backgroundColor = "#ff0000";
                    } else if (percentage < 60) {
                        timerBar.style.backgroundColor = "#ffff00";
                    }

                }, 16); // ~60 FPS
            }

            // --- WIN/LOSS STATES ---
            function winGame() {
                gameActive = false;
                clearInterval(timerInterval);

                // Snap to perfect center
                leftHalf.style.transform = `translate(0, 0) rotate(0deg)`;
                rightHalf.style.transform = `translate(0, 0) rotate(0deg)`;

                // Success visual
                feedbackEl.textContent = "¡ÉXITO!";
                feedbackEl.className = "success";
                feedbackEl.style.opacity = 1;

                // Simulate next level call
                console.log("Win! Calling nextLevel()...");
                setTimeout(nextLevel, 1500);
            }

            function loseGame() {
                gameActive = false;
                clearInterval(timerInterval);
                lives--;
                debugLives.textContent = lives;

                // Break visually (Heart turns grey/cracks more)
                leftHalf.style.fill = "#555";
                rightHalf.style.fill = "#555";
                leftHalf.style.transform = `translate(-20px, 10px) rotate(-20deg)`;
                rightHalf.style.transform = `translate(20px, 10px) rotate(20deg)`;

                // Fail visual
                feedbackEl.textContent = "¡FALLASTE!";
                feedbackEl.className = "fail";
                feedbackEl.style.opacity = 1;

                console.log("Loss! Lives remaining: " + lives);
            }

            // --- MOCK EXTERNAL FUNCTION ---
            function nextLevel() {
                // Reload page to simulate new game/reset with new random difficulty
                window.location.reload();
            }

            // --- UTILS ---
            function createParticle() {
                // Very simple particle effect
                const p = document.createElement('div');
                p.classList.add('particle');
                document.body.appendChild(p);

                // Random position around center
                const x = window.innerWidth / 2 + (Math.random() - 0.5) * 100;
                const y = window.innerHeight / 2 + (Math.random() - 0.5) * 100;

                p.style.left = x + 'px';
                p.style.top = y + 'px';

                // Animate out
                setTimeout(() => {
                    p.style.transition = "all 0.5s";
                    p.style.transform = `translate(${(Math.random() - 0.5) * 100}px, ${(Math.random() - 0.5) * 100}px)`;
                    p.style.opacity = 0;
                }, 10);

                setTimeout(() => p.remove(), 600);
            }

            // Start the game loop
            initGame();
        });