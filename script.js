document.addEventListener("DOMContentLoaded", () => {
    const secretButton = document.querySelector(".footer-content");
    secretButton.addEventListener("click", () => {
        createWhiteHole();
    });
});

function createWhiteHole() {
    const whiteHole = document.createElement("div");
    whiteHole.classList.add("white-hole");
    document.body.appendChild(whiteHole);

    const allElements = document.querySelectorAll('body *');
    allElements.forEach(element => {
        if (!element.classList.contains('white-hole') && !element.classList.contains('footer-content')) {
            element.classList.add('spiral-in');
        }
    });

    setTimeout(() => {
        allElements.forEach(element => {
            if (!element.classList.contains('white-hole') && !element.classList.contains('footer-content')) {
                element.classList.remove('spiral-in');
            }
        });
        whiteHole.remove();
    }, 3500);
}

document.addEventListener("DOMContentLoaded", () => {
    // Astronomy Animation Enhancements
    const astronomyAnimation = document.getElementById('astronomy-animation');
    const starsContainer = astronomyAnimation.querySelector('.stars');

    // Generate dynamic stars
    function createStars(numStars = 120, container = starsContainer) {
        for (let i = 0; i < numStars; i++) {
            const star = document.createElement('div');
            star.classList.add('star');
            const size = Math.random() * 2 + 1;
            star.style.width = `${size}px`;
            star.style.height = `${size}px`;
            star.style.top = `${Math.random() * 100}%`;
            star.style.left = `${Math.random() * 100}%`;
            star.style.opacity = Math.random() * 0.7 + 0.3;
            star.style.animationDelay = `${Math.random() * 8}s`;
            container.appendChild(star);
        }
    }
    createStars();

    // After 5 seconds (when animation is complete), fade out the overlay
    setTimeout(() => {
        astronomyAnimation.style.animation = 'fadeOutAstronomy 3s forwards';
        // Move stars to a persistent background container
        let bgStars = document.getElementById('background-stars');
        if (!bgStars) {
            bgStars = document.createElement('div');
            bgStars.id = 'background-stars';
            document.body.appendChild(bgStars);
        }
        bgStars.style.position = 'fixed';
        bgStars.style.top = '0';
        bgStars.style.left = '0';
        bgStars.style.width = '100vw';
        bgStars.style.height = '100vh';
        bgStars.style.zIndex = '0';
        bgStars.style.pointerEvents = 'none';
        // Move all stars
        while (starsContainer.firstChild) {
            bgStars.appendChild(starsContainer.firstChild);
        }
    }, 5000); // Matches the total duration of the planet animation
});
