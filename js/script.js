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

    console.log('Microjuegos Sergi y Hugo - Landing Page Loaded');
});