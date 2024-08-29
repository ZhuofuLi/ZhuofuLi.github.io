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

function createShootingStar() {
    const shootingStarsContainer = document.querySelector('.shooting-stars');
    const shootingStar = document.createElement('div');
    shootingStar.classList.add('shooting-star');

    // Random position for the shooting star
    shootingStar.style.top = Math.random() * window.innerHeight + 'px';
    shootingStar.style.left = Math.random() * window.innerWidth + 'px';

    // Append shooting star to container
    shootingStarsContainer.appendChild(shootingStar);

    // Remove the shooting star after the animation ends
    shootingStar.addEventListener('animationend', () => {
        shootingStar.remove();
    });
}

// Generate shooting stars at random intervals
setInterval(createShootingStar, 10);
