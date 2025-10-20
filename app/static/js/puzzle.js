(function () {
    const pieces = Array.from(document.querySelectorAll('.puzzle-piece'));
    const shuffleButton = document.getElementById('shuffle-button');
    const overlay = document.getElementById('puzzle-complete');
    const playAgainButton = document.getElementById('play-again');

    const rows = 3;
    const cols = 3;
    let order = Array.from({ length: rows * cols }, (_, i) => i);
    let selectedIndex = null;

    function hideOverlay() {
        overlay.classList.remove('is-visible');
        overlay.setAttribute('hidden', '');
    }

    function showOverlay() {
        overlay.classList.add('is-visible');
        overlay.removeAttribute('hidden');
    }

    function setPieceVisual(piece, positionIndex) {
        const row = Math.floor(positionIndex / cols);
        const col = positionIndex % cols;

        const colPercent = cols === 1 ? 0 : (col / (cols - 1)) * 100;
        const rowPercent = rows === 1 ? 0 : (row / (rows - 1)) * 100;

        piece.style.backgroundPosition = `${colPercent}% ${rowPercent}%`;
        piece.dataset.correct = positionIndex;
    }

    function renderPieces() {
        pieces.forEach((piece, index) => {
            const targetPosition = order[index];
            setPieceVisual(piece, targetPosition);
            piece.classList.toggle('correct', targetPosition === index);
        });
    }

    function shufflePieces() {
        for (let i = order.length - 1; i > 0; i -= 1) {
            const j = Math.floor(Math.random() * (i + 1));
            const temp = order[i];
            order[i] = order[j];
            order[j] = temp;
        }

        if (order.every((value, index) => value === index)) {
            return shufflePieces();
        }

        selectedIndex = null;
        pieces.forEach((piece) => piece.classList.remove('is-selected'));
        hideOverlay();
        renderPieces();
    }

    function swapPieces(firstIndex, secondIndex) {
        const temp = order[firstIndex];
        order[firstIndex] = order[secondIndex];
        order[secondIndex] = temp;
        renderPieces();
        checkCompletion();
    }

    function checkCompletion() {
        const isComplete = order.every((value, index) => value === index);
        if (isComplete) {
            showOverlay();
        }
    }

    function handlePieceSelection(index) {
        const piece = pieces[index];

        if (selectedIndex === null) {
            selectedIndex = index;
            piece.classList.add('is-selected');
            return;
        }

        if (selectedIndex === index) {
            piece.classList.remove('is-selected');
            selectedIndex = null;
            return;
        }

        const previouslySelected = pieces[selectedIndex];
        previouslySelected.classList.remove('is-selected');
        swapPieces(selectedIndex, index);
        selectedIndex = null;
    }

    function attachListeners() {
        pieces.forEach((piece, index) => {
            piece.addEventListener('click', (event) => {
                event.preventDefault();
                handlePieceSelection(index);
            });

            piece.addEventListener('keydown', (event) => {
                if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault();
                    handlePieceSelection(index);
                }
            });
        });

        shuffleButton.addEventListener('click', shufflePieces);
        playAgainButton.addEventListener('click', shufflePieces);
    }

    function preloadImage(src) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = resolve;
            img.onerror = reject;
            img.src = src;
        });
    }

    function init() {
        pieces.forEach((piece) => {
            piece.style.backgroundImage = `url("${window.PUZZLE_IMAGE_URL}")`;
        });

        hideOverlay();
        renderPieces();
        shufflePieces();
        attachListeners();
    }

    preloadImage(window.PUZZLE_IMAGE_URL).then(init).catch(init);
})();
