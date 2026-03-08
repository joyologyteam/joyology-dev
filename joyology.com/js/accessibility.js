/**
 * Joyology Accessibility Widget
 * Self-contained ADA compliance toolkit
 * Injects its own CSS, creates UI, persists state in localStorage
 */
(function() {
    'use strict';

    var STORAGE_KEY = 'joyology-a11y';
    var defaults = {
        fontSize: 0,
        lineHeight: 0,
        letterSpacing: 0,
        wordSpacing: 0,
        highContrast: false,
        darkContrast: false,
        lightContrast: false,
        monochrome: false,
        highSaturation: false,
        lowSaturation: false,
        invertColors: false,
        dyslexiaFont: false,
        highlightLinks: false,
        highlightHeadings: false,
        bigCursor: false,
        readingGuide: false,
        focusIndicator: false,
        hideImages: false,
        pauseAnimations: false,
        textAlign: '',
        pageZoom: 0
    };

    var state = loadState();
    var panel = null;
    var toggleBtn = null;
    var readingGuideEl = null;
    var isOpen = false;

    function loadState() {
        try {
            var saved = localStorage.getItem(STORAGE_KEY);
            if (saved) {
                var parsed = JSON.parse(saved);
                var merged = {};
                for (var key in defaults) {
                    merged[key] = parsed.hasOwnProperty(key) ? parsed[key] : defaults[key];
                }
                return merged;
            }
        } catch(e) {}
        return JSON.parse(JSON.stringify(defaults));
    }

    function saveState() {
        try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch(e) {}
    }

    // ── Inject CSS ──
    function injectStyles() {
        // Load dyslexia font via link tag (not @import which blocks rendering)
        var fontLink = document.createElement('link');
        fontLink.rel = 'stylesheet';
        fontLink.href = 'https://fonts.googleapis.com/css2?family=Open+Dyslexic:wght@400;700&display=swap';
        document.head.appendChild(fontLink);

        var css = '';

        // ── Widget chrome ──
        css += '\n' +
        '.a11y-toggle{' +
            'position:fixed;bottom:84px;left:20px;z-index:99998;' +
            'width:52px;height:52px;border-radius:50%;border:none;' +
            'background:linear-gradient(135deg,#2A7C6F 0%,#1A1F1C 100%);' +
            'color:#fff;font-size:24px;cursor:pointer;' +
            'box-shadow:0 4px 20px rgba(0,0,0,0.25),0 0 0 3px rgba(140,197,65,0.3);' +
            'display:flex;align-items:center;justify-content:center;' +
            'transition:all 0.3s cubic-bezier(0.16,1,0.3,1);' +
        '}\n' +
        '.a11y-toggle:hover{transform:scale(1.1);box-shadow:0 6px 28px rgba(0,0,0,0.3),0 0 0 4px rgba(140,197,65,0.5);}\n' +
        '.a11y-toggle:focus-visible{outline:3px solid #E2F752;outline-offset:3px;}\n' +
        '.a11y-toggle svg{width:26px;height:26px;fill:currentColor;}\n' +

        '.a11y-panel{' +
            'position:fixed;bottom:0;left:0;z-index:99999;' +
            'width:380px;max-height:calc(100vh - 20px);' +
            'background:#1A1F1C;color:#fff;' +
            'border-radius:24px 24px 0 0;' +
            'box-shadow:0 -8px 60px rgba(0,0,0,0.4),0 0 0 1px rgba(255,255,255,0.06);' +
            'transform:translateY(100%);opacity:0;' +
            'transition:transform 0.45s cubic-bezier(0.16,1,0.3,1),opacity 0.3s ease;' +
            'display:flex;flex-direction:column;' +
            'font-family:"Nunito",sans-serif;' +
            'overflow:hidden;' +
        '}\n' +
        '.a11y-panel.open{transform:translateY(0);opacity:1;}\n' +

        '.a11y-panel-header{' +
            'display:flex;align-items:center;justify-content:space-between;' +
            'padding:20px 24px 16px;border-bottom:1px solid rgba(255,255,255,0.08);' +
            'flex-shrink:0;' +
        '}\n' +
        '.a11y-panel-title{font-size:18px;font-weight:900;display:flex;align-items:center;gap:10px;}\n' +
        '.a11y-panel-title svg{width:22px;height:22px;fill:#8CC541;}\n' +
        '.a11y-panel-close{background:rgba(255,255,255,0.08);border:none;color:#fff;' +
            'width:36px;height:36px;border-radius:50%;cursor:pointer;font-size:18px;' +
            'display:flex;align-items:center;justify-content:center;transition:all 0.2s;}\n' +
        '.a11y-panel-close:hover{background:rgba(255,255,255,0.15);}\n' +

        '.a11y-panel-body{overflow-y:auto;padding:8px 0 20px;flex:1;' +
            '-webkit-overflow-scrolling:touch;overscroll-behavior:contain;' +
            'scrollbar-width:thin;scrollbar-color:rgba(255,255,255,0.15) transparent;}\n' +
        '.a11y-panel-body::-webkit-scrollbar{width:6px;}\n' +
        '.a11y-panel-body::-webkit-scrollbar-track{background:transparent;}\n' +
        '.a11y-panel-body::-webkit-scrollbar-thumb{background:rgba(255,255,255,0.15);border-radius:3px;}\n' +

        '.a11y-section{padding:16px 24px 8px;}\n' +
        '.a11y-section-title{font-size:11px;font-weight:800;text-transform:uppercase;' +
            'letter-spacing:2px;color:#8CC541;margin-bottom:14px;display:flex;align-items:center;gap:8px;}\n' +
        '.a11y-section-title::before{content:"";width:16px;height:2px;background:#8CC541;border-radius:2px;}\n' +

        // Slider rows
        '.a11y-slider-row{display:flex;align-items:center;gap:12px;margin-bottom:14px;}\n' +
        '.a11y-slider-label{font-size:13px;font-weight:700;flex:1;white-space:nowrap;}\n' +
        '.a11y-slider-controls{display:flex;align-items:center;gap:6px;}\n' +
        '.a11y-slider-btn{width:32px;height:32px;border-radius:10px;border:1.5px solid rgba(255,255,255,0.12);' +
            'background:rgba(255,255,255,0.05);color:#fff;font-size:16px;cursor:pointer;' +
            'display:flex;align-items:center;justify-content:center;transition:all 0.2s;' +
            'font-family:"Nunito",sans-serif;font-weight:700;}\n' +
        '.a11y-slider-btn:hover{background:rgba(140,197,65,0.2);border-color:rgba(140,197,65,0.4);}\n' +
        '.a11y-slider-btn:active{transform:scale(0.92);}\n' +
        '.a11y-slider-val{min-width:36px;text-align:center;font-size:13px;font-weight:800;' +
            'color:#E2F752;font-variant-numeric:tabular-nums;}\n' +

        // Toggle tiles (grid)
        '.a11y-toggles{display:grid;grid-template-columns:1fr 1fr;gap:10px;}\n' +
        '.a11y-tile{' +
            'display:flex;flex-direction:column;align-items:center;justify-content:center;gap:6px;' +
            'padding:16px 8px;border-radius:16px;' +
            'border:1.5px solid rgba(255,255,255,0.08);background:rgba(255,255,255,0.03);' +
            'cursor:pointer;transition:all 0.25s cubic-bezier(0.16,1,0.3,1);text-align:center;' +
        '}\n' +
        '.a11y-tile:hover{background:rgba(255,255,255,0.06);border-color:rgba(255,255,255,0.15);}\n' +
        '.a11y-tile.active{background:rgba(140,197,65,0.12);border-color:rgba(140,197,65,0.4);}\n' +
        '.a11y-tile-icon{font-size:22px;line-height:1;}\n' +
        '.a11y-tile.active .a11y-tile-icon{color:#8CC541;}\n' +
        '.a11y-tile-label{font-size:11px;font-weight:700;line-height:1.2;color:rgba(255,255,255,0.7);}\n' +
        '.a11y-tile.active .a11y-tile-label{color:#fff;}\n' +

        // Text align row
        '.a11y-align-row{display:flex;gap:8px;margin-bottom:14px;}\n' +
        '.a11y-align-btn{flex:1;padding:10px;border-radius:12px;border:1.5px solid rgba(255,255,255,0.08);' +
            'background:rgba(255,255,255,0.03);color:#fff;cursor:pointer;font-size:16px;' +
            'display:flex;align-items:center;justify-content:center;transition:all 0.2s;}\n' +
        '.a11y-align-btn:hover{background:rgba(255,255,255,0.06);}\n' +
        '.a11y-align-btn.active{background:rgba(140,197,65,0.12);border-color:rgba(140,197,65,0.4);color:#8CC541;}\n' +

        // Reset button
        '.a11y-reset-wrap{padding:8px 24px 12px;flex-shrink:0;border-top:1px solid rgba(255,255,255,0.06);}\n' +
        '.a11y-reset{width:100%;padding:12px;border-radius:14px;border:none;' +
            'background:rgba(224,79,95,0.15);color:#E04F5F;font-family:"Nunito",sans-serif;' +
            'font-size:13px;font-weight:800;text-transform:uppercase;letter-spacing:1.5px;' +
            'cursor:pointer;transition:all 0.2s;}\n' +
        '.a11y-reset:hover{background:rgba(224,79,95,0.25);}\n' +

        // Statement link
        '.a11y-statement{padding:4px 24px 12px;text-align:center;}\n' +
        '.a11y-statement a{font-size:11px;color:rgba(255,255,255,0.35);text-decoration:underline;' +
            'text-underline-offset:2px;transition:color 0.2s;}\n' +
        '.a11y-statement a:hover{color:rgba(255,255,255,0.6);}\n' +

        // Reading guide line
        '.a11y-reading-guide{' +
            'position:fixed;left:0;right:0;height:12px;z-index:99997;pointer-events:none;' +
            'background:rgba(226,247,82,0.18);border-top:2px solid rgba(226,247,82,0.4);' +
            'border-bottom:2px solid rgba(226,247,82,0.4);display:none;' +
        '}\n' +

        // ── Applied accessibility styles ──

        // Font size
        'body.a11y-fs-1{font-size:18px !important;}' +
        'body.a11y-fs-2{font-size:20px !important;}' +
        'body.a11y-fs-3{font-size:22px !important;}' +
        'body.a11y-fs-4{font-size:24px !important;}\n' +

        // Line height
        'body.a11y-lh-1{line-height:1.8 !important;}body.a11y-lh-1 *{line-height:inherit !important;}' +
        'body.a11y-lh-2{line-height:2.0 !important;}body.a11y-lh-2 *{line-height:inherit !important;}' +
        'body.a11y-lh-3{line-height:2.4 !important;}body.a11y-lh-3 *{line-height:inherit !important;}' +
        'body.a11y-lh-4{line-height:2.8 !important;}body.a11y-lh-4 *{line-height:inherit !important;}\n' +

        // Letter spacing
        'body.a11y-ls-1{letter-spacing:1px !important;}body.a11y-ls-1 *{letter-spacing:inherit !important;}' +
        'body.a11y-ls-2{letter-spacing:2px !important;}body.a11y-ls-2 *{letter-spacing:inherit !important;}' +
        'body.a11y-ls-3{letter-spacing:3px !important;}body.a11y-ls-3 *{letter-spacing:inherit !important;}' +
        'body.a11y-ls-4{letter-spacing:4px !important;}body.a11y-ls-4 *{letter-spacing:inherit !important;}\n' +

        // Word spacing
        'body.a11y-ws-1{word-spacing:4px !important;}body.a11y-ws-1 *{word-spacing:inherit !important;}' +
        'body.a11y-ws-2{word-spacing:8px !important;}body.a11y-ws-2 *{word-spacing:inherit !important;}' +
        'body.a11y-ws-3{word-spacing:12px !important;}body.a11y-ws-3 *{word-spacing:inherit !important;}' +
        'body.a11y-ws-4{word-spacing:16px !important;}body.a11y-ws-4 *{word-spacing:inherit !important;}\n' +

        // Page zoom
        'body.a11y-zoom-1{zoom:1.1;}' +
        'body.a11y-zoom-2{zoom:1.25;}' +
        'body.a11y-zoom-3{zoom:1.5;}\n' +

        // Text alignment
        'body.a11y-align-left *{text-align:left !important;}' +
        'body.a11y-align-center *{text-align:center !important;}' +
        'body.a11y-align-right *{text-align:right !important;}' +
        'body.a11y-align-justify *{text-align:justify !important;}\n' +

        // High contrast
        'body.a11y-high-contrast{filter:contrast(1.4) !important;}' +
        'body.a11y-high-contrast *{border-color:currentColor !important;}\n' +

        // Dark contrast
        'body.a11y-dark-contrast{background:#000 !important;color:#fff !important;}' +
        'body.a11y-dark-contrast *{background-color:#000 !important;color:#fff !important;border-color:#fff !important;}' +
        'body.a11y-dark-contrast img{filter:brightness(0.8) !important;}\n' +

        // Light contrast
        'body.a11y-light-contrast{background:#fff !important;color:#000 !important;}' +
        'body.a11y-light-contrast *{background-color:#fff !important;color:#000 !important;border-color:#000 !important;}\n' +

        // Monochrome
        'body.a11y-monochrome{filter:grayscale(100%) !important;}\n' +

        // High saturation
        'body.a11y-high-saturation{filter:saturate(2) !important;}\n' +

        // Low saturation
        'body.a11y-low-saturation{filter:saturate(0.4) !important;}\n' +

        // Invert colors
        'body.a11y-invert{filter:invert(1) hue-rotate(180deg) !important;}' +
        'body.a11y-invert img,body.a11y-invert video{filter:invert(1) hue-rotate(180deg) !important;}\n' +

        // Dyslexia font
        'body.a11y-dyslexia *{font-family:"OpenDyslexic","Open Dyslexic",sans-serif !important;}\n' +

        // Highlight links
        'body.a11y-highlight-links a{outline:3px solid #E2F752 !important;outline-offset:2px !important;' +
            'text-decoration:underline !important;text-underline-offset:3px !important;}\n' +

        // Highlight headings
        'body.a11y-highlight-headings h1,body.a11y-highlight-headings h2,' +
        'body.a11y-highlight-headings h3,body.a11y-highlight-headings h4,' +
        'body.a11y-highlight-headings h5,body.a11y-highlight-headings h6{' +
            'outline:3px solid #41C6EF !important;outline-offset:4px !important;border-radius:4px;}\n' +

        // Big cursor
        'body.a11y-big-cursor,body.a11y-big-cursor *{' +
            'cursor:url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'48\' height=\'48\' viewBox=\'0 0 48 48\'%3E%3Cpath d=\'M8 4l28 20H20l8 16-5 2-8-16-7 7z\' fill=\'%23000\' stroke=\'%23fff\' stroke-width=\'2\'/%3E%3C/svg%3E") 4 4, auto !important;' +
        '}\n' +

        // Focus indicator
        'body.a11y-focus-indicator *:focus{outline:4px solid #E2F752 !important;outline-offset:4px !important;}\n' +
        'body.a11y-focus-indicator *:focus:not(:focus-visible){outline:none !important;}\n' +
        'body.a11y-focus-indicator *:focus-visible{outline:4px solid #E2F752 !important;outline-offset:4px !important;}\n' +

        // Hide images
        'body.a11y-hide-images img,body.a11y-hide-images svg:not(.a11y-icon),' +
        'body.a11y-hide-images [role="img"],body.a11y-hide-images picture{' +
            'opacity:0.05 !important;}\n' +

        // Pause animations — exclude the widget itself so it can still open/close
        'body.a11y-pause-animations *:not(.a11y-panel):not(.a11y-panel *)' +
        ':not(.a11y-toggle):not(.a11y-reading-guide){' +
            'animation-play-state:paused !important;' +
            'transition-duration:0s !important;' +
        '}\n' +
        'body.a11y-pause-animations{scroll-behavior:auto !important;}\n' +

        // Responsive
        '@media(max-width:480px){' +
            '.a11y-panel{width:100%;border-radius:20px 20px 0 0;}' +
            '.a11y-toggle{bottom:80px;left:14px;width:46px;height:46px;font-size:20px;}' +
            '.a11y-toggle svg{width:22px;height:22px;}' +
        '}\n' +

        // ── Shield: protect the widget from its own accessibility overrides ──
        '.a11y-panel,.a11y-panel *,.a11y-toggle,.a11y-toggle *{' +
            'font-family:"Nunito",sans-serif !important;' +
            'letter-spacing:normal !important;' +
            'word-spacing:normal !important;' +
            'text-align:left !important;' +
            'filter:none !important;' +
            'zoom:1 !important;' +
            'cursor:pointer !important;' +
        '}\n' +
        '.a11y-panel,.a11y-panel *{' +
            'background-color:initial;color:initial;border-color:initial;' +
        '}\n' +
        // Re-apply widget backgrounds that the shield clears
        '.a11y-panel{background:#1A1F1C !important;color:#fff !important;}\n' +
        '.a11y-panel-header{border-bottom-color:rgba(255,255,255,0.08) !important;}\n' +
        '.a11y-panel-title{color:#fff !important;}\n' +
        '.a11y-panel-title svg{fill:#8CC541 !important;}\n' +
        '.a11y-panel-close{background:rgba(255,255,255,0.08) !important;color:#fff !important;border-color:transparent !important;}\n' +
        '.a11y-section-title{color:#8CC541 !important;}\n' +
        '.a11y-slider-label{color:#fff !important;}\n' +
        '.a11y-slider-btn{background:rgba(255,255,255,0.05) !important;color:#fff !important;border-color:rgba(255,255,255,0.12) !important;}\n' +
        '.a11y-slider-val{color:#E2F752 !important;}\n' +
        '.a11y-tile{background:rgba(255,255,255,0.03) !important;border-color:rgba(255,255,255,0.08) !important;color:#fff !important;}\n' +
        '.a11y-tile.active{background:rgba(140,197,65,0.12) !important;border-color:rgba(140,197,65,0.4) !important;}\n' +
        '.a11y-tile-icon{color:rgba(255,255,255,0.7) !important;}\n' +
        '.a11y-tile.active .a11y-tile-icon{color:#8CC541 !important;}\n' +
        '.a11y-tile-label{color:rgba(255,255,255,0.7) !important;}\n' +
        '.a11y-tile.active .a11y-tile-label{color:#fff !important;}\n' +
        '.a11y-align-btn{background:rgba(255,255,255,0.03) !important;color:#fff !important;border-color:rgba(255,255,255,0.08) !important;}\n' +
        '.a11y-align-btn.active{background:rgba(140,197,65,0.12) !important;border-color:rgba(140,197,65,0.4) !important;color:#8CC541 !important;}\n' +
        '.a11y-reset{background:rgba(224,79,95,0.15) !important;color:#E04F5F !important;border-color:transparent !important;}\n' +
        '.a11y-reset-wrap{border-top-color:rgba(255,255,255,0.06) !important;}\n' +
        '.a11y-statement a{color:rgba(255,255,255,0.35) !important;outline:none !important;}\n' +
        // Shield: keep line-height sane inside widget
        '.a11y-panel *{line-height:1.4 !important;}\n' +
        '.a11y-panel .a11y-tile{line-height:1 !important;}\n' +
        // Shield: no image hiding inside widget
        '.a11y-panel svg,.a11y-toggle svg{opacity:1 !important;}\n' +
        // Shield: keep toggle visible and styled
        '.a11y-toggle{background:linear-gradient(135deg,#2A7C6F 0%,#1A1F1C 100%) !important;color:#fff !important;border-color:transparent !important;}\n';

        var style = document.createElement('style');
        style.id = 'a11y-styles';
        style.textContent = css;
        document.head.appendChild(style);
    }

    // ── Build UI ──
    function buildUI() {
        // Toggle button
        toggleBtn = document.createElement('button');
        toggleBtn.className = 'a11y-toggle';
        toggleBtn.setAttribute('aria-label', 'Open accessibility menu');
        toggleBtn.setAttribute('title', 'Accessibility options');
        toggleBtn.innerHTML = '<svg class="a11y-icon" viewBox="0 0 24 24"><path d="M12 2a2 2 0 1 1 0 4 2 2 0 0 1 0-4zm9 7h-6.8l-1.2-2h-2l-1.2 2H3a1 1 0 0 0 0 2h5.2l-1.8 4.3L4 18a1 1 0 0 0 .5 1.3 1 1 0 0 0 1.3-.5L8 15.3l2 4.4a1 1 0 0 0 1.8 0l2-4.4 2.2 3.5a1 1 0 0 0 1.3.5A1 1 0 0 0 18 18l-2.4-3.7L13.8 11H21a1 1 0 0 0 0-2z"/></svg>';
        toggleBtn.addEventListener('click', function() {
            togglePanel();
        });
        document.body.appendChild(toggleBtn);

        // Panel
        panel = document.createElement('div');
        panel.className = 'a11y-panel';
        panel.setAttribute('role', 'dialog');
        panel.setAttribute('aria-label', 'Accessibility settings');
        panel.innerHTML = buildPanelHTML();
        document.body.appendChild(panel);

        // Reading guide
        readingGuideEl = document.createElement('div');
        readingGuideEl.className = 'a11y-reading-guide';
        document.body.appendChild(readingGuideEl);

        // Events
        bindEvents();
    }

    function buildPanelHTML() {
        return '' +
        '<div class="a11y-panel-header">' +
            '<div class="a11y-panel-title">' +
                '<svg class="a11y-icon" viewBox="0 0 24 24"><path d="M12 2a2 2 0 1 1 0 4 2 2 0 0 1 0-4zm9 7h-6.8l-1.2-2h-2l-1.2 2H3a1 1 0 0 0 0 2h5.2l-1.8 4.3L4 18a1 1 0 0 0 .5 1.3 1 1 0 0 0 1.3-.5L8 15.3l2 4.4a1 1 0 0 0 1.8 0l2-4.4 2.2 3.5a1 1 0 0 0 1.3.5A1 1 0 0 0 18 18l-2.4-3.7L13.8 11H21a1 1 0 0 0 0-2z"/></svg>' +
                'Accessibility' +
            '</div>' +
            '<button class="a11y-panel-close" data-action="close" aria-label="Close accessibility menu"><i class="fas fa-times"></i></button>' +
        '</div>' +

        '<div class="a11y-panel-body">' +

            // Content adjustments
            '<div class="a11y-section">' +
                '<div class="a11y-section-title">Content Adjustments</div>' +
                buildSlider('Font Size', 'fontSize', 0, 4) +
                buildSlider('Line Height', 'lineHeight', 0, 4) +
                buildSlider('Letter Spacing', 'letterSpacing', 0, 4) +
                buildSlider('Word Spacing', 'wordSpacing', 0, 4) +
                buildSlider('Page Zoom', 'pageZoom', 0, 3) +
                '<div style="font-size:12px;font-weight:700;color:rgba(255,255,255,0.5);margin-bottom:10px;">Text Alignment</div>' +
                '<div class="a11y-align-row">' +
                    '<button class="a11y-align-btn' + (state.textAlign === 'left' ? ' active' : '') + '" data-align="left" aria-label="Align left"><i class="fas fa-align-left"></i></button>' +
                    '<button class="a11y-align-btn' + (state.textAlign === 'center' ? ' active' : '') + '" data-align="center" aria-label="Align center"><i class="fas fa-align-center"></i></button>' +
                    '<button class="a11y-align-btn' + (state.textAlign === 'right' ? ' active' : '') + '" data-align="right" aria-label="Align right"><i class="fas fa-align-right"></i></button>' +
                    '<button class="a11y-align-btn' + (state.textAlign === 'justify' ? ' active' : '') + '" data-align="justify" aria-label="Justify"><i class="fas fa-align-justify"></i></button>' +
                '</div>' +
            '</div>' +

            // Color adjustments
            '<div class="a11y-section">' +
                '<div class="a11y-section-title">Color Adjustments</div>' +
                '<div class="a11y-toggles">' +
                    buildTile('highContrast', '<i class="fas fa-circle-half-stroke"></i>', 'High Contrast') +
                    buildTile('darkContrast', '<i class="fas fa-moon"></i>', 'Dark Contrast') +
                    buildTile('lightContrast', '<i class="fas fa-sun"></i>', 'Light Contrast') +
                    buildTile('monochrome', '<i class="fas fa-droplet-slash"></i>', 'Monochrome') +
                    buildTile('highSaturation', '<i class="fas fa-palette"></i>', 'High Saturation') +
                    buildTile('lowSaturation', '<i class="fas fa-eye-dropper"></i>', 'Low Saturation') +
                    buildTile('invertColors', '<i class="fas fa-rotate"></i>', 'Invert Colors') +
                '</div>' +
            '</div>' +

            // Navigation & reading
            '<div class="a11y-section">' +
                '<div class="a11y-section-title">Navigation &amp; Reading</div>' +
                '<div class="a11y-toggles">' +
                    buildTile('dyslexiaFont', '<i class="fas fa-font"></i>', 'Dyslexia Font') +
                    buildTile('highlightLinks', '<i class="fas fa-link"></i>', 'Highlight Links') +
                    buildTile('highlightHeadings', '<i class="fas fa-heading"></i>', 'Highlight Headings') +
                    buildTile('bigCursor', '<i class="fas fa-arrow-pointer"></i>', 'Big Cursor') +
                    buildTile('readingGuide', '<i class="fas fa-grip-lines"></i>', 'Reading Guide') +
                    buildTile('focusIndicator', '<i class="fas fa-bullseye"></i>', 'Focus Indicator') +
                    buildTile('hideImages', '<i class="fas fa-image"></i>', 'Hide Images') +
                    buildTile('pauseAnimations', '<i class="fas fa-pause"></i>', 'Pause Animations') +
                '</div>' +
            '</div>' +

        '</div>' +

        // Footer
        '<div class="a11y-reset-wrap">' +
            '<button class="a11y-reset" data-action="reset">Reset All Settings</button>' +
        '</div>' +
        '<div class="a11y-statement">' +
            '<a href="/accessibility/">Accessibility Statement</a>' +
        '</div>';
    }

    function buildSlider(label, key, min, max) {
        return '' +
        '<div class="a11y-slider-row" data-slider="' + key + '">' +
            '<span class="a11y-slider-label">' + label + '</span>' +
            '<div class="a11y-slider-controls">' +
                '<button class="a11y-slider-btn" data-dir="-1" aria-label="Decrease ' + label + '">−</button>' +
                '<span class="a11y-slider-val" data-val="' + key + '">' + (state[key] === 0 ? 'Default' : '+' + state[key]) + '</span>' +
                '<button class="a11y-slider-btn" data-dir="1" aria-label="Increase ' + label + '">+</button>' +
            '</div>' +
        '</div>';
    }

    function buildTile(key, icon, label) {
        return '<button class="a11y-tile' + (state[key] ? ' active' : '') + '" data-toggle="' + key + '">' +
            '<span class="a11y-tile-icon">' + icon + '</span>' +
            '<span class="a11y-tile-label">' + label + '</span>' +
        '</button>';
    }

    // ── Event binding ──
    function bindEvents() {
        // Close button
        panel.querySelector('[data-action="close"]').addEventListener('click', function() {
            togglePanel(false);
        });

        // Reset
        panel.querySelector('[data-action="reset"]').addEventListener('click', function() {
            state = JSON.parse(JSON.stringify(defaults));
            saveState();
            applyAll();
            refreshUI();
        });

        // Sliders
        panel.querySelectorAll('.a11y-slider-row').forEach(function(row) {
            var key = row.getAttribute('data-slider');
            row.querySelectorAll('.a11y-slider-btn').forEach(function(btn) {
                btn.addEventListener('click', function() {
                    var dir = parseInt(btn.getAttribute('data-dir'));
                    var limits = {fontSize:4, lineHeight:4, letterSpacing:4, wordSpacing:4, pageZoom:3};
                    var max = limits[key] || 4;
                    state[key] = Math.max(0, Math.min(max, state[key] + dir));
                    saveState();
                    applyAll();
                    var valEl = row.querySelector('[data-val]');
                    valEl.textContent = state[key] === 0 ? 'Default' : '+' + state[key];
                });
            });
        });

        // Toggle tiles
        panel.querySelectorAll('.a11y-tile').forEach(function(tile) {
            tile.addEventListener('click', function() {
                var key = tile.getAttribute('data-toggle');

                // Mutual exclusion groups
                var colorGroup = ['highContrast','darkContrast','lightContrast','monochrome','highSaturation','lowSaturation','invertColors'];
                if (colorGroup.indexOf(key) > -1 && !state[key]) {
                    colorGroup.forEach(function(k) {
                        if (k !== key) state[k] = false;
                    });
                }

                state[key] = !state[key];
                saveState();
                applyAll();
                refreshTiles();
            });
        });

        // Alignment buttons
        panel.querySelectorAll('.a11y-align-btn').forEach(function(btn) {
            btn.addEventListener('click', function() {
                var align = btn.getAttribute('data-align');
                state.textAlign = (state.textAlign === align) ? '' : align;
                saveState();
                applyAll();
                panel.querySelectorAll('.a11y-align-btn').forEach(function(b) {
                    b.classList.toggle('active', b.getAttribute('data-align') === state.textAlign);
                });
            });
        });

        // Reading guide mouse tracking
        document.addEventListener('mousemove', function(e) {
            if (state.readingGuide && readingGuideEl) {
                readingGuideEl.style.top = (e.clientY - 6) + 'px';
            }
        });

        // Prevent page scroll when scrolling inside the panel
        var panelBody = panel.querySelector('.a11y-panel-body');
        panelBody.addEventListener('wheel', function(e) {
            var atTop = panelBody.scrollTop <= 0;
            var atBottom = panelBody.scrollTop + panelBody.clientHeight >= panelBody.scrollHeight;
            if ((e.deltaY < 0 && atTop) || (e.deltaY > 0 && atBottom)) {
                e.preventDefault();
            }
        }, { passive: false });

        // Prevent touch scroll propagation from panel to page
        panel.addEventListener('touchmove', function(e) {
            e.stopPropagation();
        }, { passive: true });

        // Close on escape
        document.addEventListener('keydown', function(e) {
            if (e.key === 'Escape' && isOpen) {
                togglePanel(false);
            }
        });

        // Close on click outside (use mousedown to avoid conflicts with button clicks)
        document.addEventListener('mousedown', function(e) {
            if (isOpen && !panel.contains(e.target) && !toggleBtn.contains(e.target)) {
                togglePanel(false);
            }
        });
    }

    function refreshUI() {
        // Update slider values
        panel.querySelectorAll('[data-val]').forEach(function(el) {
            var key = el.getAttribute('data-val');
            el.textContent = state[key] === 0 ? 'Default' : '+' + state[key];
        });

        // Update tiles
        refreshTiles();

        // Update align buttons
        panel.querySelectorAll('.a11y-align-btn').forEach(function(b) {
            b.classList.toggle('active', b.getAttribute('data-align') === state.textAlign);
        });
    }

    function refreshTiles() {
        panel.querySelectorAll('.a11y-tile').forEach(function(tile) {
            var key = tile.getAttribute('data-toggle');
            tile.classList.toggle('active', !!state[key]);
        });
    }

    // ── Apply state to DOM ──
    function applyAll() {
        var body = document.body;

        // Clear all a11y classes
        var classes = body.className.split(' ').filter(function(c) { return c.indexOf('a11y-') !== 0; });
        body.className = classes.join(' ');

        // Font size
        if (state.fontSize > 0) body.classList.add('a11y-fs-' + state.fontSize);

        // Line height
        if (state.lineHeight > 0) body.classList.add('a11y-lh-' + state.lineHeight);

        // Letter spacing
        if (state.letterSpacing > 0) body.classList.add('a11y-ls-' + state.letterSpacing);

        // Word spacing
        if (state.wordSpacing > 0) body.classList.add('a11y-ws-' + state.wordSpacing);

        // Page zoom
        if (state.pageZoom > 0) body.classList.add('a11y-zoom-' + state.pageZoom);

        // Text align
        if (state.textAlign) body.classList.add('a11y-align-' + state.textAlign);

        // Color toggles
        if (state.highContrast) body.classList.add('a11y-high-contrast');
        if (state.darkContrast) body.classList.add('a11y-dark-contrast');
        if (state.lightContrast) body.classList.add('a11y-light-contrast');
        if (state.monochrome) body.classList.add('a11y-monochrome');
        if (state.highSaturation) body.classList.add('a11y-high-saturation');
        if (state.lowSaturation) body.classList.add('a11y-low-saturation');
        if (state.invertColors) body.classList.add('a11y-invert');

        // Navigation toggles
        if (state.dyslexiaFont) body.classList.add('a11y-dyslexia');
        if (state.highlightLinks) body.classList.add('a11y-highlight-links');
        if (state.highlightHeadings) body.classList.add('a11y-highlight-headings');
        if (state.bigCursor) body.classList.add('a11y-big-cursor');
        if (state.focusIndicator) body.classList.add('a11y-focus-indicator');
        if (state.hideImages) body.classList.add('a11y-hide-images');
        if (state.pauseAnimations) body.classList.add('a11y-pause-animations');

        // Reading guide
        if (readingGuideEl) {
            readingGuideEl.style.display = state.readingGuide ? 'block' : 'none';
        }
    }

    function togglePanel(forceState) {
        isOpen = typeof forceState === 'boolean' ? forceState : !isOpen;
        panel.classList.toggle('open', isOpen);
        toggleBtn.setAttribute('aria-expanded', isOpen);
        if (isOpen) {
            panel.querySelector('.a11y-panel-close').focus();
        }
    }

    // ── Init ──
    function init() {
        // Wait for DOM
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', boot);
        } else {
            boot();
        }
    }

    function boot() {
        injectStyles();
        buildUI();
        applyAll();
    }

    init();
})();
