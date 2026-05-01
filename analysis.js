document.addEventListener('DOMContentLoaded', () => {
    const analysisDateElem = document.getElementById('analysis-date');
    const analysisTimeElem = document.getElementById('analysis-time');
    const aiConclusionElem = document.getElementById('ai-conclusion');
    const timeframeGridElem = document.getElementById('timeframe-grid');
    const positionSummaryElem = document.getElementById('position-summary');
    const recommendationListElem = document.getElementById('recommendation-list');
    const chartAnalysisContainerElem = document.getElementById('chart-analysis-container');

    // 1. Load data from localStorage
    const storedData = localStorage.getItem('tradingAnalysisData');
    if (!storedData) {
        document.body.innerHTML = '<h1>오류: 분석 데이터를 찾을 수 없습니다.</h1><p>메인 페이지로 돌아가서 분석을 다시 시작해주세요.</p>';
        return;
    }

    const analysisData = JSON.parse(storedData);

    // 2. Display basic data
    const analysisDate = new Date(analysisData.timestamp);
    analysisDateElem.textContent = `분석 생성일: ${analysisDate.toLocaleString()}`;
    analysisTimeElem.textContent = `분석 시간: ${analysisDate.toLocaleString()}`;
    displayPositionSummary();
    
    // 3. Display uploaded charts
    displayUploadedCharts();

    // 4. Start the REAL AI analysis process
    runAIAnalysis();

    function displayPositionSummary() {
        const inputs = analysisData.inputs || {};
        positionSummaryElem.innerHTML = `
            <dl class="position-list">
                <div>
                    <dt>진입 가격</dt>
                    <dd>${escapeHTML(inputs.entry || '-')}</dd>
                </div>
                <div>
                    <dt>포지션 크기</dt>
                    <dd>${escapeHTML(inputs.size || '-')}</dd>
                </div>
                <div>
                    <dt>평균 가격</dt>
                    <dd>${escapeHTML(inputs.avgPrice || '-')}</dd>
                </div>
            </dl>
        `;
    }

    function displayUploadedCharts() {
        const images = analysisData.images || [];
        if (!images.length) {
            chartAnalysisContainerElem.innerHTML = '<div class="loading-row">표시할 차트가 없습니다.</div>';
            return;
        }

        chartAnalysisContainerElem.innerHTML = images.map(image => `
            <article class="chart-card">
                <img src="${image.src}" alt="${escapeHTML(image.timeframe)} Chart">
                <div class="chart-card-body">
                    <h3>${escapeHTML(image.timeframe)}</h3>
                    <p class="ai-chart-analysis">AI가 이 차트를 분석하고 있습니다...</p>
                </div>
            </article>
        `).join('');
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
            const conclusion = response.overall_conclusion || '종합 결론을 받지 못했습니다.';
            aiConclusionElem.textContent = conclusion;
            displayRecommendations(conclusion);

            // Update timeframe stack
            let timeframeHTML = '';
            if (response.timeframe_analysis) {
                 response.timeframe_analysis.forEach(tf => {
                    const sentimentClass = tf.sentiment ? tf.sentiment.toLowerCase() : 'neutral';
                    const icon = sentimentClass === 'bullish' ? 'trending_up' : (sentimentClass === 'bearish' ? 'trending_down' : 'trending_flat');
                    timeframeHTML += `
                        <article class="timeframe-card ${sentimentClass}">
                            <span class="material-icons">${icon}</span>
                            <div>
                                <p class="timeframe-title">${escapeHTML(tf.timeframe || '차트')}</p>
                                <p class="timeframe-status">${translateSentiment(sentimentClass)}</p>
                                <p class="timeframe-desc">${escapeHTML(tf.summary || '요약 없음')}</p>
                            </div>
                        </article>
                    `;
                });
            }
            timeframeGridElem.innerHTML = timeframeHTML || '<div class="loading-row">타임프레임 분석 결과가 없습니다.</div>';

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
            recommendationListElem.innerHTML = '<div class="loading-row">추천 행동을 생성하지 못했습니다.</div>';
        }
    }

    function displayRecommendations(conclusion) {
        const items = conclusion
            .split(/(?<=[.!?。]|다\.)\s+/)
            .map(item => item.trim())
            .filter(Boolean)
            .slice(0, 3);

        recommendationListElem.innerHTML = (items.length ? items : ['종합 결론과 차트별 분석을 함께 확인하세요.']).map(item => `
            <div class="recommendation-item">
                <span class="material-icons">check_circle</span>
                <p>${escapeHTML(item)}</p>
            </div>
        `).join('');
    }

    function translateSentiment(sentiment) {
        if (sentiment === 'bullish') return '상승 우세';
        if (sentiment === 'bearish') return '하락 우세';
        return '중립';
    }

    function escapeHTML(value) {
        return String(value)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }
});
