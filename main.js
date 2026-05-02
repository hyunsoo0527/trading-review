document.addEventListener('DOMContentLoaded', () => {
    const startAnalysisBtn = document.querySelector('.start-analysis-section .cta-button');
    const uploadPlaceholders = document.querySelectorAll('.upload-placeholder');

    function handleFileSelect(e, specificZone = null) {
        e.preventDefault();
        e.stopPropagation();
        const dropZone = specificZone || e.currentTarget;
        const files = e.dataTransfer ? e.dataTransfer.files : e.target.files;
        if (files.length > 0 && dropZone) {
            const file = files[0];
            if (file.type.startsWith('image/')) {
                const reader = new FileReader();
                reader.onload = function(event) {
                    dropZone.innerHTML = '';
                    dropZone.classList.add('has-uploaded-image');
                    const img = document.createElement('img');
                    img.src = event.target.result;
                    img.style.maxWidth = '100%';
                    img.style.maxHeight = '100%';
                    img.style.objectFit = 'contain';
                    img.style.borderRadius = '4px';
                    dropZone.appendChild(img);
                }
                reader.readAsDataURL(file);
            }
        }
    }

    async function analyzeAndRedirect() {
        const imagesData = [];
        document.querySelectorAll('.upload-box').forEach((box, index) => {
            const img = box.querySelector('.upload-placeholder img');
            if (img && img.src) {
                imagesData.push({
                    timeframe: box.querySelector('p').textContent,
                    src: img.src,
                    originalIndex: index
                });
            }
        });

        if (imagesData.length === 0) {
            alert("분석할 차트 이미지를 하나 이상 업로드해주세요.");
            return;
        }

        startAnalysisBtn.disabled = true;
        startAnalysisBtn.textContent = '분석 중...';

        try {
            const analysisPromises = imagesData.map(async (imageData) => {
                const response = await fetch('/.netlify/functions/analyzeImage', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ image: imageData.src }),
                });
                if (!response.ok) {
                    const errorBody = await response.json().catch(() => ({}));
                    const message = errorBody.error || `${response.status} ${response.statusText}`;
                    console.error('Analysis failed:', message);
                    throw new Error(message);
                }
                const result = await response.json();
                return {
                    ...imageData,
                    analysis: result.analysis,
                };
            });

            const results = await Promise.all(analysisPromises);

            sessionStorage.setItem('tradingAnalysisResults', JSON.stringify(results));

            window.location.href = 'analysis.html';

        } catch (error) {
            console.error("이미지 분석 중 에러 발생:", error);
            alert(`분석에 실패했습니다: ${error.message}`);
            startAnalysisBtn.disabled = false;
            startAnalysisBtn.textContent = '분석 시작';
        }
    }


    startAnalysisBtn.addEventListener('click', (e) => {
        e.preventDefault();
        analyzeAndRedirect();
    });

    uploadPlaceholders.forEach(zone => {
        zone.addEventListener('click', () => {
            const input = document.createElement('input');
            input.type = 'file';
            input.accept = 'image/*';
            input.style.display = 'none';
            input.addEventListener('change', (e) => {
                handleFileSelect(e, zone);
                input.remove();
            }, { once: true });
            document.body.appendChild(input);
            input.click();
        });
        zone.addEventListener('dragover', (e) => { e.preventDefault(); e.stopPropagation(); zone.style.borderColor = '#6ACC75'; });
        zone.addEventListener('dragleave', (e) => { e.preventDefault(); e.stopPropagation(); zone.style.borderColor = 'var(--border-color)'; });
        zone.addEventListener('drop', (e) => handleFileSelect(e, zone));
    });
});
