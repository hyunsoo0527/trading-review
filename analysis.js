document.addEventListener('DOMContentLoaded', () => {
    const analysisDateElem = document.getElementById('analysis-date');
    const aiConclusionElem = document.getElementById('ai-conclusion');
    const timeframeGridElem = document.getElementById('timeframe-grid');
    const chartAnalysisContainerElem = document.getElementById('chart-analysis-container');

    // 1. Load data from localStorage
    const storedData = localStorage.getItem('tradingAnalysisData');
    if (!storedData) {
        // If no data is found, show an error message
        document.body.innerHTML = '<h1>오류: 분석 데이터를 찾을 수 없습니다.</h1><p>메인 페이지로 돌아가서 분석을 다시 시작해주세요.</p>';
        return;
    }

    const analysisData = JSON.parse(storedData);

    // 2. Display basic data
    analysisDateElem.textContent = `분석 생성일: ${new Date(analysisData.timestamp).toLocaleString()}`;
    
    // 3. Display uploaded charts
    displayUploadedCharts();

    // 4. Start the AI analysis process
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
        // This is the placeholder for our future Serverless Function call
        console.log("Starting AI analysis with data:", analysisData);
        
        // In a real scenario, we would send `analysisData.images` to our backend.
        // For now, we will just simulate a delay and show placeholder text.
        
        try {
            // **IMPORTANT**: This is a placeholder. We will replace this with a real API call.
            const response = await callOpenAI_API_Placeholder(analysisData.images);

            // Update the UI with the AI-generated analysis
            aiConclusionElem.textContent = response.overall_conclusion;

            // Update timeframe stack
            let timeframeHTML = '';
            response.timeframe_analysis.forEach(tf => {
                timeframeHTML += `
                    <div class="timeframe-card">
                        <div class="timeframe-title">${tf.timeframe}</div>
                        <div class="timeframe-content ${tf.sentiment.toLowerCase()}">
                            <span class="material-icons">${tf.sentiment === 'Bullish' ? 'arrow_upward' : 'arrow_downward'}</span>
                            <span>${tf.summary}</span>
                        </div>
                    </div>
                `;
            });
            timeframeGridElem.innerHTML = timeframeHTML;

            // Update individual chart analysis
            const chartAnalysisElements = document.querySelectorAll('.ai-chart-analysis');
            response.chart_specific_analysis.forEach((analysis, index) => {
                if(chartAnalysisElements[index]) {
                    chartAnalysisElements[index].textContent = analysis.analysis;
                }
            });

        } catch (error) {
            console.error("AI 분석 중 오류 발생:", error);
            aiConclusionElem.textContent = "AI 분석에 실패했습니다. 나중에 다시 시도해주세요.";
        }
    }

    /**
     * --- PLACEHOLDER API FUNCTION ---
     * This function simulates a call to our future backend API.
     * It returns a fake analysis object after a short delay.
     */
    function callOpenAI_API_Placeholder(images) {
        console.log("Simulating API call with images:", images);

        return new Promise(resolve => {
            setTimeout(() => {
                const fakeAnalysis = {
                    overall_conclusion: "종합 분석 결과: 전반적인 상승 추세장에서 단기 하락 신호를 보고 성급하게 진입한 것으로 보입니다. 고점 징후가 있었지만, 더 큰 추세를 거스르기에는 역부족이었습니다. 진입 타점과 리스크 관리에 대한 재검토가 필요합니다.",
                    timeframe_analysis: [
                        { timeframe: "일봉 차트", sentiment: "Bullish", summary: "강한 상승 추세" },
                        { timeframe: "1시간봉 차트", sentiment: "Bearish", summary: "고점 징후 및 조정 가능성" },
                        { timeframe: "3분봉 차트", sentiment: "Bearish", summary: "단기 하락 돌파" },
                    ],
                    chart_specific_analysis: images.map(img => ({
                        timeframe: img.timeframe,
                        analysis: `(${img.timeframe}) AI 분석: 이 차트에서는 ... 특징이 보이며, 이는 단기적인 하락 압력을 시사하지만, 장기 이동평균선은 여전히 상승 방향을 가리키고 있습니다.`
                    }))
                };
                resolve(fakeAnalysis);
            }, 2000); // Simulate a 2-second network delay
        });
    }
});