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