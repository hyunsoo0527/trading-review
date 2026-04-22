document.addEventListener('DOMContentLoaded', () => {
    // --- DOM Element References ---
    const entryPriceInput = document.getElementById('entry-price');
    const positionSizeInput = document.getElementById('position-size');
    const averagePriceInput = document.getElementById('average-price');
    const startAnalysisBtn = document.querySelector('.start-analysis-section .cta-button');
    const uploadPlaceholders = document.querySelectorAll('.upload-placeholder');
    const languageButton = document.querySelector('.language-button');
    const languageDropdown = document.querySelector('.language-dropdown');
    const currentLangElement = document.getElementById('current-lang');

    // --- Translations ---
    const translations = {
        ko: {
            analyze_trades_title: "프로처럼<br>당신의 트레이딩을<br>분석하세요",
            header_subtitle: "차트를 업로드하고 당신의 트레이딩 결정을 체계화하세요.",
            upload_charts_title: "차트 업로드",
            upload_charts_subtitle: "다양한 시간대의 차트를 업로드하여 트레이딩을 분석하세요.",
            daily_chart: "일봉 차트",
            hourly_chart: "1시간봉 차트",
            three_min_chart: "3분봉 차트",
            upload_placeholder_text: "이미지를 드래그 앤 드롭하거나 클릭하여 업로드하세요",
            trading_info_title: "트레이딩 정보 입력",
            trading_info_subtitle: "포지션을 계산하려면 트레이딩 세부 정보를 입력하세요.",
            trading_info_card_header: "트레이딩 정보",
            entry_price_label: "진입 가격",
            position_size_label: "포지션 크기 (%)",
            average_price_label: "평균 가격",
            start_analysis_button: "분석 시작",
            footer_terms: "이용 약관",
            footer_privacy: "개인정보 처리방침",
            footer_rights: "모든 권리 보유."
        },
        en: {
            analyze_trades_title: "Analyze Your Trades<br>Like a Pro",
            header_subtitle: "Upload charts and structure your trading decisions.",
            upload_charts_title: "Upload Your Charts",
            upload_charts_subtitle: "Upload charts in different timeframes, to analyze your trades.",
            daily_chart: "Daily Chart",
            hourly_chart: "1H Chart",
            three_min_chart: "3min Chart",
            upload_placeholder_text: "Drag & drop or click to upload image",
            trading_info_title: "Enter Your Trading Information",
            trading_info_subtitle: "Input your trading details to calculate your position.",
            trading_info_card_header: "Trading Info",
            entry_price_label: "Entry Price",
            position_size_label: "Position Size (%)",
            average_price_label: "Average Price",
            start_analysis_button: "Start Analysis",
            footer_terms: "Terms",
            footer_privacy: "Privacy",
            footer_rights: "All rights reserved."
        },
        ja: {
            analyze_trades_title: "プロのように<br>取引の分析を<br>しましょう",
            header_subtitle: "チャートをアップロードし、取引の意思決定を体系化します。",
            upload_charts_title: "チャートをアップロード",
            upload_charts_subtitle: "さまざまなタイムフレームのチャートをアップロードして、取引を分析します。",
            daily_chart: "日足チャート",
            hourly_chart: "1時間足チャート",
            three_min_chart: "3分足チャート",
            upload_placeholder_text: "画像をドラッグ＆ドロップするか、クリックしてアップ로드します",
            trading_info_title: "取引情報を入力",
            trading_info_subtitle: "ポジションを計算するには、取引詳細を入力してください。",
            trading_info_card_header: "取引情報",
            entry_price_label: "エントリー価格",
            position_size_label: "ポジションサイズ (%)",
            average_price_label: "平均価格",
            start_analysis_button: "分析を開始",
            footer_terms: "利用規約",
            footer_privacy: "プライバシー",
            footer_rights: "全著作権所有。"
        }
    };

    // --- Language Functions ---
    function setLanguage(lang) {
        document.documentElement.lang = lang;
        currentLangElement.textContent = lang.toUpperCase();

        document.querySelectorAll('[data-translate-key]').forEach(element => {
            const key = element.getAttribute('data-translate-key');
            if (translations[lang][key]) {
                element.innerHTML = translations[lang][key];
            }
        });
        languageDropdown.style.display = 'none'; // Hide dropdown after selection
    }

    // --- Main Functions ---
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

    // --- Event Listeners ---
    startAnalysisBtn.addEventListener('click', () => {
        console.log("Analysis Started:", {
            entry: entryPriceInput.value,
            size: positionSizeInput.value,
            avgPrice: averagePriceInput.value
        });
        alert("Analysis started! Check the console for details.");
    });

    uploadPlaceholders.forEach(zone => {
        zone.addEventListener('click', () => {
            if (zone.querySelector('img')) return;
            const input = document.createElement('input');
            input.type = 'file';
            input.accept = 'image/*';
            input.style.display = 'none';
            input.addEventListener('change', (e) => handleFileSelect(e, zone));
            document.body.appendChild(input);
            input.click();
            document.body.removeChild(input);
        });
        zone.addEventListener('dragover', (e) => { e.preventDefault(); e.stopPropagation(); zone.style.borderColor = '#6ACC75'; });
        zone.addEventListener('dragleave', (e) => { e.preventDefault(); e.stopPropagation(); zone.style.borderColor = 'var(--border-color)'; });
        zone.addEventListener('drop', (e) => handleFileSelect(e, zone));
    });

    languageButton.addEventListener('click', (e) => {
        e.stopPropagation(); // Prevents the window click listener from firing immediately
        languageDropdown.style.display = languageDropdown.style.display === 'block' ? 'none' : 'block';
    });

    languageDropdown.addEventListener('click', (e) => {
        e.preventDefault();
        const lang = e.target.getAttribute('data-lang');
        if (lang) {
            setLanguage(lang);
        }
    });

    window.addEventListener('click', () => {
        if (languageDropdown.style.display === 'block') {
            languageDropdown.style.display = 'none';
        }
    });

    // --- Initial Setup ---
    if (entryPriceInput.placeholder) entryPriceInput.value = entryPriceInput.placeholder;
    if (positionSizeInput.placeholder) positionSizeInput.value = positionSizeInput.placeholder;
    if (averagePriceInput.placeholder) averagePriceInput.value = averagePriceInput.placeholder;
    
    // Set initial language
    setLanguage('ko');
});
