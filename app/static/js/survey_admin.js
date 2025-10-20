(function () {
    const addQuestionBtn = document.getElementById('addQuestionBtn');
    const questionsContainer = document.getElementById('questionsContainer');
    const questionsDataInput = document.getElementById('questionsData');
    const surveyForm = document.getElementById('surveyForm');

    if (!addQuestionBtn || !questionsContainer || !questionsDataInput || !surveyForm) {
        return;
    }

    function updateQuestionIndexes() {
        const cards = questionsContainer.querySelectorAll('.question-card');
        cards.forEach((card, index) => {
            const label = card.querySelector('.question-index');
            if (label) {
                label.textContent = `Pergunta ${index + 1}`;
            }
        });
    }

    function createOptionRow(initialValue = '') {
        const row = document.createElement('div');
        row.className = 'option-row';
        row.innerHTML = `
            <input type="text" class="option-input" placeholder="Digite a alternativa" value="${initialValue}">
            <button type="button" class="remove-option">Remover</button>
        `;

        row.querySelector('.remove-option').addEventListener('click', () => {
            row.remove();
        });

        return row;
    }

    function toggleOptionsArea(card, type) {
        const optionsArea = card.querySelector('.options-area');
        if (!optionsArea) return;

        if (type === 'multipla') {
            optionsArea.classList.add('active');
            if (optionsArea.querySelectorAll('.option-row').length === 0) {
                optionsArea.querySelector('.options-list').appendChild(createOptionRow());
                optionsArea.querySelector('.options-list').appendChild(createOptionRow());
            }
        } else {
            optionsArea.classList.remove('active');
            optionsArea.querySelector('.options-list').innerHTML = '';
        }
    }

    function createQuestionCard() {
        const card = document.createElement('div');
        card.className = 'question-card';
        card.innerHTML = `
            <div class="question-header">
                <span class="question-title question-index">Pergunta</span>
                <button type="button" class="remove-question">Remover</button>
            </div>
            <label>Enunciado da pergunta
                <input type="text" class="question-text" placeholder="Digite a pergunta" required>
            </label>
            <label>Tipo de resposta
                <select class="question-type">
                    <option value="texto">Texto</option>
                    <option value="termometro">Termômetro</option>
                    <option value="multipla">Múltipla escolha</option>
                </select>
            </label>
            <div class="options-area">
                <p class="options-help">Adicione pelo menos duas alternativas.</p>
                <div class="options-list"></div>
                <button type="button" class="add-option">Adicionar alternativa</button>
            </div>
        `;

        const removeBtn = card.querySelector('.remove-question');
        removeBtn.addEventListener('click', () => {
            card.remove();
            updateQuestionIndexes();
        });

        const typeSelect = card.querySelector('.question-type');
        typeSelect.addEventListener('change', (event) => {
            toggleOptionsArea(card, event.target.value);
        });

        const addOptionBtn = card.querySelector('.add-option');
        addOptionBtn.addEventListener('click', () => {
            const list = card.querySelector('.options-list');
            list.appendChild(createOptionRow());
        });

        updateQuestionIndexes();
        return card;
    }

    addQuestionBtn.addEventListener('click', () => {
        const card = createQuestionCard();
        questionsContainer.appendChild(card);
        updateQuestionIndexes();
    });

    surveyForm.addEventListener('submit', (event) => {
        const cards = questionsContainer.querySelectorAll('.question-card');
        const questions = [];
        let hasError = false;

        cards.forEach((card) => {
            card.classList.remove('has-error');
            const textInput = card.querySelector('.question-text');
            const typeSelect = card.querySelector('.question-type');

            const text = textInput.value.trim();
            const type = typeSelect.value;

            if (!text) {
                card.classList.add('has-error');
                hasError = true;
                return;
            }

            const questionData = {
                text,
                type,
            };

            if (type === 'multipla') {
                const options = Array.from(card.querySelectorAll('.option-input'))
                    .map((input) => input.value.trim())
                    .filter((value) => value);

                if (options.length < 2) {
                    card.classList.add('has-error');
                    hasError = true;
                    return;
                }

                questionData.options = options;
            }

            questions.push(questionData);
        });

        if (questions.length === 0) {
            alert('Adicione pelo menos uma pergunta.');
            event.preventDefault();
            return;
        }

        if (hasError) {
            alert('Verifique as perguntas destacadas antes de salvar.');
            event.preventDefault();
            return;
        }

        questionsDataInput.value = JSON.stringify(questions);
    });

    // Inicia com uma pergunta em branco para guiar o usuário
    addQuestionBtn.click();
})();
