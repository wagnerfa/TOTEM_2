        let video = document.getElementById('video');
        let canvas = document.getElementById('canvas');
        let ctx = canvas.getContext('2d');
        let currentStream = null;
        let selectedFrame = '';
        let capturedPhoto = null;

        // Elementos
        const cameraContainer = document.getElementById('cameraContainer');
        const framesPanel = document.getElementById('framesPanel');
        const controls = document.getElementById('controls');
        const frameOverlay = document.getElementById('frameOverlay');
        const captureBtn = document.getElementById('captureBtn');
        const downloadBtn = document.getElementById('downloadBtn');
        const statusDiv = document.getElementById('status');
        const timerDiv = document.getElementById('timer');

        // Iniciar câmera automaticamente
        startCamera();

        // Event listeners
        captureBtn.addEventListener('click', startTimer);
        downloadBtn.addEventListener('click', savePhoto);

        // Event listeners das molduras
        document.querySelectorAll('.frame-option').forEach(option => {
            option.addEventListener('click', () => selectFrame(option));
        });

        function showStatus(message, type = 'info') {
            statusDiv.textContent = message;
            statusDiv.className = `status ${type}`;
            statusDiv.classList.remove('hidden');

            setTimeout(() => {
                statusDiv.classList.add('hidden');
            }, 3000);
        }

        async function startCamera() {
            try {
                showStatus('Iniciando câmera...', 'info');

                const stream = await navigator.mediaDevices.getUserMedia({
                    video: {
                        width: { ideal: 1920 },
                        height: { ideal: 1080 },
                        facingMode: 'user'
                    }
                });

                currentStream = stream;
                video.srcObject = stream;

                // Aguardar carregamento do vídeo
                video.addEventListener('loadedmetadata', () => {
                    canvas.width = video.videoWidth;
                    canvas.height = video.videoHeight;
                    showStatus('Câmera ativa! Escolha uma moldura e tire sua foto.', 'success');
                });

            } catch (error) {
                console.error('Erro ao acessar câmera:', error);
                showStatus('Erro ao acessar a câmera. Verifique as permissões.', 'error');
            }
        }

        function startTimer() {
            let countdown = 5;
            timerDiv.textContent = countdown;
            timerDiv.classList.remove('hidden');
            captureBtn.disabled = true;
            captureBtn.style.opacity = '0.5';

            const interval = setInterval(() => {
                countdown--;
                if (countdown > 0) {
                    timerDiv.textContent = countdown;
                } else {
                    clearInterval(interval);
                    timerDiv.classList.add('hidden');
                    captureBtn.disabled = false;
                    captureBtn.style.opacity = '1';
                    capturePhoto();
                }
            }, 1000);
        }

        function selectFrame(frameElement) {
            // Remover seleção anterior
            document.querySelectorAll('.frame-option').forEach(opt => {
                opt.classList.remove('selected');
            });

            // Selecionar nova moldura
            frameElement.classList.add('selected');
            selectedFrame = frameElement.dataset.frame;

            // Atualizar overlay
            if (selectedFrame) {
                frameOverlay.style.backgroundImage = `url('/static/frames/${selectedFrame}')`;
                frameOverlay.style.opacity = '0.7';
            } else {
                frameOverlay.style.backgroundImage = 'none';
                frameOverlay.style.opacity = '0';
            }
        }

        function capturePhoto() {
            if (!currentStream) return;

            // Capturar frame do vídeo
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
            capturedPhoto = canvas.toDataURL('image/png');

            // Mostrar botão de download
            downloadBtn.classList.remove('hidden');

            showStatus('Foto capturada! Clique em Salvar para baixar.', 'success');
        }

        async function savePhoto() {
            if (!capturedPhoto) return;

            try {
                showStatus('Salvando foto...', 'info');

                const response = await fetch('/api/save-photo', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        photo: capturedPhoto,
                        frame: selectedFrame
                    })
                });

                const data = await response.json();

                if (data.filename) {
                    showStatus('Foto salva! Download iniciado.', 'success');

                    // Criar e clicar no link de download
                    const downloadLink = document.createElement('a');
                    downloadLink.href = data.url;
                    downloadLink.download = data.filename;
                    document.body.appendChild(downloadLink);
                    downloadLink.click();
                    document.body.removeChild(downloadLink);


                    // Esconder botão de download após usar
                    downloadBtn.classList.add('hidden');

                } else {
                    showStatus('Erro ao salvar foto.', 'error');
                }

            } catch (error) {
                console.error('Erro ao salvar foto:', error);
                showStatus('Erro ao salvar foto.', 'error');
            }
        }

        // Cleanup ao sair da página
        window.addEventListener('beforeunload', () => {
            if (currentStream) {
                currentStream.getTracks().forEach(track => track.stop());
            }
        });

        // Evitar zoom duplo toque no mobile
        let lastTouchEnd = 0;
        document.addEventListener('touchend', function (event) {
            const now = (new Date()).getTime();
            if (now - lastTouchEnd <= 300) {
                event.preventDefault();
            }
            lastTouchEnd = now;
        }, false);