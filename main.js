document.addEventListener('DOMContentLoaded', () => {
    // State
    let trades = [];

    // Element References
    const totalProfitEl = document.getElementById('total-profit');
    const totalLossEl = document.getElementById('total-loss');
    const netPLEl = document.getElementById('balance');
    const winRateEl = document.getElementById('win-rate');
    const form = document.getElementById('transaction-form');
    const tradesList = document.getElementById('transactions-list');
    const screenshotUploadInput = document.getElementById('screenshot-upload');
    const ocrStatusEl = document.getElementById('ocr-status');
    
    // Form Inputs
    const typeInput = document.getElementById('transaction-type');
    const dateInput = document.getElementById('transaction-date');
    const assetInput = document.getElementById('transaction-category');
    const strategyInput = document.getElementById('transaction-description');
    const amountInput = document.getElementById('transaction-amount');

    // Icon mapping for assets and strategies
    function getAssetIcon(asset) {
        const normalized = asset.toLowerCase();
        if (normalized.includes('btc') || normalized.includes('crypto') || normalized.includes('비트')) return 'currency_bitcoin';
        if (normalized.includes('eth') || normalized.includes('이더')) return 'token';
        if (normalized.includes('주식') || normalized.includes('stock') || normalized.includes('nvda') || normalized.includes('appl')) return 'show_chart';
        if (normalized.includes('금') || normalized.includes('gold')) return 'monetization_on';
        if (normalized.includes('외환') || normalized.includes('fx')) return 'currency_exchange';
        return 'account_balance_wallet'; // Default
    }

    // Web Component for a single trade entry
    class TradeEntry extends HTMLElement {
        constructor() {
            super();
            this.attachShadow({ mode: 'open' });
        }

        connectedCallback() {
            this.render();
        }

        render() {
            const { type, date, asset, strategy, amount } = this.dataset;
            const isProfit = type === 'profit';
            const formattedAmount = `${isProfit ? '+' : '-'}${parseInt(amount).toLocaleString()}원`;
            const iconName = getAssetIcon(asset);
            const themeColor = isProfit ? 'var(--profit-color, #2ecc71)' : 'var(--loss-color, #e74c3c)';

            this.shadowRoot.innerHTML = `
                <style>
                    :host { 
                        display: block;
                        animation: fadeIn 0.4s ease-out;
                    }
                    .entry {
                        display: flex;
                        align-items: center;
                        background-color: #fff;
                        border-radius: 16px;
                        padding: 16px 20px;
                        box-shadow: 0 4px 12px rgba(0,0,0,0.05);
                        border-left: 6px solid ${themeColor};
                        transition: transform 0.2s;
                    }
                    .entry:hover {
                        transform: scale(1.01);
                    }
                    .icon-container {
                        width: 48px;
                        height: 48px;
                        border-radius: 12px;
                        background-color: ${isProfit ? '#e8f5e9' : '#ffebee'};
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        margin-right: 20px;
                    }
                    .icon {
                        font-family: 'Material Icons';
                        font-size: 24px;
                        color: ${themeColor};
                    }
                    .details { flex-grow: 1; }
                    .asset-info { display: flex; align-items: center; gap: 8px; }
                    .asset { font-weight: 700; font-size: 1.1rem; color: #1a1a1a; }
                    .type-badge {
                        font-size: 0.75rem;
                        padding: 2px 8px;
                        border-radius: 4px;
                        background: #f1f3f5;
                        color: #495057;
                        font-weight: 600;
                    }
                    .strategy { font-size: 0.9em; color: #666; margin-top: 2px; }
                    .date { font-size: 0.8em; color: #999; margin-top: 4px; }
                    .amount {
                        font-weight: 700;
                        font-size: 1.25rem;
                        color: ${themeColor};
                    }
                    @keyframes fadeIn {
                        from { opacity: 0; transform: translateY(10px); }
                        to { opacity: 1; transform: translateY(0); }
                    }
                </style>
                <div class="entry">
                    <div class="icon-container">
                        <span class="icon">${iconName}</span>
                    </div>
                    <div class="details">
                        <div class="asset-info">
                            <span class="asset">${asset}</span>
                            <span class="type-badge">${isProfit ? 'LONG' : 'SHORT'}</span>
                        </div>
                        <div class="strategy">${strategy}</div>
                        <div class="date">${date}</div>
                    </div>
                    <div class="amount">${formattedAmount}</div>
                </div>
            `;
        }
    }
    customElements.define('trade-entry', TradeEntry);

    // --- Main Functions ---

    function updateSummary() {
        const totalProfit = trades.filter(t => t.type === 'profit').reduce((sum, t) => sum + t.amount, 0);
        const totalLoss = trades.filter(t => t.type === 'loss').reduce((sum, t) => sum + t.amount, 0);
        const netPL = totalProfit - totalLoss;
        
        const totalTrades = trades.length;
        const winningTrades = trades.filter(t => t.type === 'profit').length;
        const winRate = totalTrades > 0 ? (winningTrades / totalTrades * 100).toFixed(1) : 0;

        totalProfitEl.textContent = `${totalProfit.toLocaleString()}원`;
        totalLossEl.textContent = `${totalLoss.toLocaleString()}원`;
        netPLEl.textContent = `${netPL.toLocaleString()}원`;
        winRateEl.textContent = `${winRate}%`;

        // Color coding Net P/L
        netPLEl.style.color = netPL >= 0 ? 'var(--profit-color)' : 'var(--loss-color)';
    }

    function renderTrades() {
        tradesList.innerHTML = '';
        trades.forEach(t => {
            const entry = document.createElement('trade-entry');
            entry.dataset.type = t.type;
            entry.dataset.date = t.date;
            entry.dataset.asset = t.asset;
            entry.dataset.strategy = t.strategy;
            entry.dataset.amount = t.amount;
            tradesList.appendChild(entry);
        });
    }

    function addTrade(e) {
        e.preventDefault();
        const newTrade = {
            type: typeInput.value,
            date: dateInput.value,
            asset: assetInput.value,
            strategy: strategyInput.value,
            amount: parseInt(amountInput.value, 10),
        };
        trades.push(newTrade);
        trades.sort((a, b) => new Date(b.date) - new Date(a.date));
        
        renderTrades();
        updateSummary();
        form.reset();
        dateInput.valueAsDate = new Date();
    }

    async function handleScreenshotUpload(e) {
        const file = e.target.files[0];
        if (!file) return;

        ocrStatusEl.textContent = '스크린샷을 분석 중입니다...';
        try {
            const { data: { text } } = await Tesseract.recognize(file, 'kor+eng');
            ocrStatusEl.textContent = '분석 완료! 정보를 확인해주세요.';

            // Try to find amounts (looks for numbers near profit/loss keywords)
            const amountMatch = text.match(/(?:Profit|Loss|P\/L|수익|손실|금액)[:\s]*([+-]?[\d,]+)/i);
            if (amountMatch && amountMatch[1]) {
                const val = amountMatch[1].replace(/,/g, '');
                amountInput.value = Math.abs(parseInt(val, 10));
                if (val.includes('-') || text.toLowerCase().includes('loss') || text.includes('손실')) {
                    typeInput.value = 'loss';
                } else {
                    typeInput.value = 'profit';
                }
            }

            // Try to find assets (common tickers)
            const assetMatch = text.match(/\b(BTC|ETH|NVDA|AAPL|TSLA|XAU|GOLD)\b/i);
            if (assetMatch) {
                assetInput.value = assetMatch[0].toUpperCase();
            }

            const dateMatch = text.match(/(\d{4}[-.년 ]+\d{2}[-.월 ]+\d{2})/);
            if (dateMatch && dateMatch[1]) {
                const parsedDate = new Date(dateMatch[1].replace(/[^\d-]/g, '-'));
                dateInput.value = parsedDate.toISOString().split('T')[0];
            }

        } catch (error) {
            console.error(error);
            ocrStatusEl.textContent = '오류: 스크린샷 분석에 실패했습니다.';
        }
    }

    // --- Event Listeners ---
    form.addEventListener('submit', addTrade);
    screenshotUploadInput.addEventListener('change', handleScreenshotUpload);

    // --- Initial Setup ---
    dateInput.valueAsDate = new Date();
    updateSummary();
});
