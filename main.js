const eye     = document.querySelector('.eye');
const eyeball = document.querySelector('.eyeball');
const part1   = document.querySelector('.part1');
const part2   = document.querySelector('.part2');
const ticker  = document.querySelector('.ticker');
const downBtn = document.querySelector('.down-btn');
const menu    = document.querySelector('.menu');

// denemeaaaaaa

document.addEventListener('mousemove', event => {
    const maxPos = eye.clientWidth - eye.clientHeight;
    const maxWidth = window.innerWidth;
    const newPos = (event.x / maxWidth) * maxPos;
    eyeball.style.right = newPos + 'px';
});

const distribute = () => {
    ticker.style.width = part1.offsetWidth + 'px';
    distributeLetters(part2, part1);
};
window.addEventListener('load', distribute);
window.addEventListener('resize', distribute);

downBtn.addEventListener('click', () => {
    menu.scrollIntoView({ behavior: 'smooth' });
});

function distributeLetters(target, reference) {
    const text = target.innerText.replace(/\s/g, '');
    target.replaceChildren();

    const letters = [];
    for (let i = 0; i < text.length; i++) {
        const letter = document.createElement('span');
        letter.style.display = 'inline-block';
        letter.innerText = text[i];
        target.appendChild(letter);
        letters.push(letter);
    }

    const totalWidth = letters.reduce((acc, cur) => acc + cur.offsetWidth, 0);
    const spacing = (reference.offsetWidth - totalWidth) / (text.length - 1);
    target.style.gap = spacing + 'px';
}