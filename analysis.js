document.addEventListener('DOMContentLoaded', () => {
    const analysisDateElem = document.getElementById('analysis-date');
    const aiConclusionElem = document.getElementById('ai-conclusion');
    const timeframeGridElem = document.getElementById('timeframe-grid');
    const chartAnalysisContainerElem = document.getElementById('chart-analysis-container');

    // 1. Load data from localStorage
    const storedData = localStorage.getItem('tradingAnalysisData');
    if (!storedData) {
        document.body.innerHTML = '<h1>오류: 분석 데이터를 찾을 수 없습니다.</h1><p>메인 페이지로 돌아가서 분석을 다시 시작해주세요.</p>';
        return;
    }

    const analysisData = JSON.parse(storedData);

    // 2. Display basic data
    analysisDateElem.textContent = `분석 생성일: ${new Date(analysisData.timestamp).toLocaleString()}`;
    
    // 3. Display uploaded charts
    displayUploadedCharts();

    // 4. Start the REAL AI analysis process
    runAIAnalysis();

    function displayUploadedCharts() {
        let chartHTML = ''
        analysisData.images.forEach(image => {
            chartHTML += `
                <div class="card chart-card">
                    <h3>${image.timeframe}</h3>
                    <img src="${image.src}" alt="${image.timeframe} Chart">
                    <p class="ai-chart-analysis">AI가 이 차트를 분석하고 있습니다...</p>
                </div>
            `;
        });
        chartAnalysisContainerElem.innerHTML = chartHTML;
    }

    async function runAIAnalysis() {
        console.log("Starting REAL AI analysis with data:", analysisData);
        
        aiConclusionElem.innerHTML = "AI가 차트를 분석하고 있습니다. 이미지 크기와 개수에 따라 최대 1분까지 소요될 수 있습니다...";

        try {
            // **REAL API CALL**: Call our Netlify Serverless Function
            const responseJSON = await fetch('/.netlify/functions/analyzeImage', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(analysisData), // Send all data
            });

            if (!responseJSON.ok) {
                const errorBody = await responseJSON.text();
                throw new Error(`API 요청 실패: ${responseJSON.status} ${responseJSON.statusText} - ${errorBody}`);
            }

            const response = await responseJSON.json();

            // Update the UI with the AI-generated analysis
            aiConclusionElem.textContent = response.overall_conclusion;

            // Update timeframe stack
            let timeframeHTML = '';
            if (response.timeframe_analysis) {
                 response.timeframe_analysis.forEach(tf => {
                    const sentimentClass = tf.sentiment ? tf.sentiment.toLowerCase() : 'neutral';
                    const icon = sentimentClass === 'bullish' ? 'arrow_upward' : (sentimentClass === 'bearish' ? 'arrow_downward' : 'horizontal_rule');
                    timeframeHTML += `
                        <div class="timeframe-card">
                            <div class="timeframe-title">${tf.timeframe}</div>
                            <div class="timeframe-content ${sentimentClass}">
                                <span class="material-icons">${icon}</span>
                                <span>${tf.summary}</span>
                            </div>
                        </div>
                    `;
                });
            }
            timeframeGridElem.innerHTML = timeframeHTML;

            // Update individual chart analysis
            const chartCards = document.querySelectorAll('.chart-card');
             if (response.chart_specific_analysis) {
                response.chart_specific_analysis.forEach(analysis => {
                    chartCards.forEach(card => {
                        const cardTitle = card.querySelector('h3').textContent;
                        if (cardTitle === analysis.timeframe) {
                            const analysisElement = card.querySelector('.ai-chart-analysis');
                            if(analysisElement) {
                                analysisElement.textContent = analysis.analysis;
                            }
                        }
                    });
                });
            }
             document.querySelectorAll('.ai-chart-analysis').forEach(el => {
                if (el.textContent.includes('분석하고 있습니다')) {
                    el.textContent = '이 차트에 대한 AI 분석을 받지 못했습니다.';
                }
             })

        } catch (error) {
            console.error("AI 분석 중 오류 발생:", error);
            aiConclusionElem.textContent = "AI 분석에 실패했습니다. API 키가 정확한지, Netlify 환경변수 설정이 올바른지 확인해주세요. 문제가 지속되면 개발자 콘솔(F12)을 확인하세요.";
        }
    }
});