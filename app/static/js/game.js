const startButton = document.getElementById('start-button');
const timeDisplay = document.getElementById('time-display');
const scoreDisplay = document.getElementById('score-display');
const feedback = document.getElementById('feedback');
const targets = Array.from(document.querySelectorAll('.target'));

let isRunning = false;
let score = 0;
let timeLeft = 30;
let timerInterval = null;
let spawnTimeout = null;
let activeIndex = null;

function resetGameState() {
    score = 0;
    timeLeft = 30;
    updateScore();
    updateTime();
    feedback.textContent = '';
    clearActiveTarget();
    activeIndex = null;
}

function updateScore() {
    scoreDisplay.textContent = score;
}

function updateTime() {
    timeDisplay.textContent = timeLeft;
}

function clearActiveTarget() {
    if (activeIndex !== null) {
        targets[activeIndex].classList.remove('active');
    }
}

function activateRandomTarget() {
    const previousIndex = activeIndex;
    clearActiveTarget();

    const available = targets.filter((_, index) => index !== previousIndex);
    const nextTarget = available[Math.floor(Math.random() * available.length)];
    activeIndex = targets.indexOf(nextTarget);
    nextTarget.classList.add('active');
}

function scheduleNextTarget() {
    spawnTimeout = setTimeout(() => {
        if (!isRunning) {
            return;
        }
        activateRandomTarget();
        scheduleNextTarget();
    }, Math.max(600 - score * 10, 250));
}

function stopGame(message) {
    isRunning = false;
    startButton.disabled = false;
    startButton.textContent = 'Jogar novamente';
    clearInterval(timerInterval);
    clearTimeout(spawnTimeout);
    spawnTimeout = null;
    timerInterval = null;
    feedback.textContent = message;
    clearActiveTarget();
    activeIndex = null;
}

function startGame() {
    if (isRunning) {
        return;
    }

    resetGameState();
    isRunning = true;
    startButton.disabled = true;
    startButton.textContent = 'Jogando...';
    feedback.textContent = 'Toque rápido no alvo dourado!';

    activateRandomTarget();
    scheduleNextTarget();

    timerInterval = setInterval(() => {
        timeLeft -= 1;
        updateTime();

        if (timeLeft <= 0) {
            stopGame(`Fim de jogo! Você marcou ${score} ponto${score === 1 ? '' : 's'}.`);
        }
    }, 1000);
}

startButton.addEventListener('click', startGame);

targets.forEach((target) => {
    target.addEventListener('click', () => {
        if (!isRunning || !target.classList.contains('active')) {
            return;
        }

        score += 1;
        updateScore();
        feedback.textContent = 'Boa! Continue assim!';
        activateRandomTarget();
    });
});

window.addEventListener('beforeunload', () => {
    clearInterval(timerInterval);
    clearTimeout(spawnTimeout);
});
