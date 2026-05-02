document.addEventListener('DOMContentLoaded', () => {
    const message = document.getElementById('analysis-message');
    const imageSlots = document.querySelectorAll('[data-image-slot]');
    const resultSlots = document.querySelectorAll('[data-result-slot]');

    function displayAnalysisResults() {
        const resultsJSON = sessionStorage.getItem('tradingAnalysisResults');
        if (!resultsJSON) {
            message.textContent = '분석할 데이터가 없습니다.';
            imageSlots.forEach(slot => {
                slot.innerHTML = '<span class="material-icons">image_not_supported</span><p>이미지 없음</p>';
            });
            resultSlots.forEach(slot => {
                slot.className = 'chart-flow-result pending';
                slot.textContent = '분석 데이터 없음';
            });
            return;
        }

        const results = JSON.parse(resultsJSON);
        message.textContent = '분석 완료';

        // Clear all slots first
        imageSlots.forEach(slot => slot.innerHTML = '');
        resultSlots.forEach(slot => slot.innerHTML = '');

        results.forEach(result => {
            const { originalIndex, src, timeframe, analysis } = result;

            // Render image
            const imageSlot = document.querySelector(`[data-image-slot="${originalIndex}"]`);
            if (imageSlot) {
                const img = document.createElement('img');
                img.src = src;
                img.alt = `${timeframe} 차트`;
                imageSlot.innerHTML = ''; // Clear placeholder
                imageSlot.appendChild(img);
            }

            // Render analysis
            const resultSlot = document.querySelector(`[data-result-slot="${originalIndex}"]`);
            if (resultSlot) {
                renderAnalysis(resultSlot, analysis);
            }
        });
    }

    function parseAnalysis(markdown) {
        try {
            return JSON.parse(markdown);
        } catch (error) {
            // 이전 마크다운 응답 형식도 계속 표시할 수 있게 둔다.
        }

        const lines = markdown.split('\n').filter(line => line.trim() !== '');
        const analysisData = {};
        const regex = /\*\*(.*?):\*\* (.*)/;

        lines.forEach(line => {
            const match = line.match(regex);
            if (match && match.length === 3) {
                analysisData[match[1].trim()] = match[2].trim();
            }
        });
        return analysisData;
    }

    function renderAnalysis(slot, markdown) {
        const data = parseAnalysis(markdown);

        const status = data['상태'] || 'N/A';
        const resistance = data['저항선'] || 'N/A';
        const support = data['지지선'] || 'N/A';
        const position = data['포지션'] || 'N/A';

        const statusMap = {
            '상승': { className: 'up', icon: 'trending_up' },
            '하강': { className: 'down', icon: 'trending_down' },
            '횡보': { className: 'sideways', icon: 'trending_flat' }
        };

        const statusInfo = statusMap[status] || { className: 'pending', icon: 'help_outline' };

        slot.className = `chart-flow-result ${statusInfo.className}`;
        slot.innerHTML = `
            <div class="flow-row status-row">
                <span>상태</span>
                <strong><span class="material-icons">${statusInfo.icon}</span>${status}</strong>
            </div>
            <div class="flow-row">
                <span>저항선</span>
                <strong>${resistance}</strong>
            </div>
            <div class="flow-row">
                <span>지지선</span>
                <strong>${support}</strong>
            </div>
            <div class="flow-row position-row">
                <span>포지션</span>
                <strong>${position}</strong>
            </div>
        `;
    }

    displayAnalysisResults();
});
