// ==UserScript==
// @name         Torn OC and Cooldown check
// @namespace    https://raw.githubusercontent.com/zmpress/game_script/refs/heads/main/porn_city/userscript/TornOCCooldownCheck.js
// @version      1.0.0.3
// @description  显示oc，drug，booster，medical剩余时间
// @match        https://www.torn.com/*
// @run-at       document-idle
// @grant        GM_xmlhttpRequest
// @updateURL    https://raw.githubusercontent.com/zmpress/game_script/refs/heads/main/porn_city/userscript/TornOCCooldownCheck.js
// @downloadURL    https://raw.githubusercontent.com/zmpress/game_script/refs/heads/main/porn_city/userscript/TornOCCooldownCheck.js
// ==/UserScript==

(function () {
    const LOCAL_KEY = 'torn_cooldown_api_key';
    const CACHE_KEY = 'torn_cooldown_cache';
    const OC_CACHE_KEY = 'torn_oc_cache';

    const CONFIG = {
        // --- 可通过修改 true/false 来控制显示/隐藏 ---
        // 注意：设置为 false 只会隐藏显示，但 API 仍然会获取和缓存所有数据。
        SHOW_DRUG: true,
        SHOW_MEDICAL: true,
        SHOW_BOOSTER: true,
        SHOW_OC: true,
        // ------------------------------------------

        cacheDuration: 60, // api查询结果缓存有效期 60 秒
        redWhenLow: true, // 是否在指定时间标红字体
        redThresholdMinutes: 5, // 在低于5分钟的时候标红字体
        showSecondsThresholdMinutes: 5, // 在低于5分钟的时候显示秒
    };

    // --- 样式配置 ---
    const BASE_FONT_SIZE_PC = '15px';
    const BASE_FONT_SIZE_MOBILE = '13px';
    const LABEL_COLOR = '#999';
    const TIME_VALUE_COLOR = '#4A85C2'; // 饱和度更高的淡蓝色
    const TIME_FONT_WEIGHT_NORMAL = '400';
    const TIME_FONT_WEIGHT_LIGHT = '100';
    const PLACEHOLDER_MIN_HEIGHT_PC = '110px';
    const PLACEHOLDER_MIN_HEIGHT_MOBILE = '20px';
    // ---

    // ====================================================================
    // 实用函数 (保持不变)
    // ====================================================================

    function formatTime(seconds) {
        let s = Math.floor(seconds);
        if (s <= 0) return '0s';

        const totalHours = Math.floor(s / 3600);
        s %= 3600;
        const minutes = Math.floor(s / 60);
        s %= 60;

        const showSecondsThreshold = CONFIG.showSecondsThresholdMinutes * 60;
        let parts = [];
        const formatPart = (value, unit) => `${value}${unit}`;

        if (seconds <= showSecondsThreshold) {
            if (totalHours > 0) {
                parts.push(formatPart(totalHours, 'h'));
            }
            parts.push(formatPart(minutes, 'm'));
            parts.push(formatPart(s, 's'));
        } else if (totalHours > 0) {
            parts.push(formatPart(totalHours, 'h'));
            parts.push(formatPart(minutes, 'm'));
        } else {
            parts.push(formatPart(minutes, 'm'));
        }

        return parts.join(' ');
    }

    function findStatusIcons() {
        return document.querySelector('ul[class*="status-icons"]');
    }

    function findDelimiter(container) {
        return [...container.querySelectorAll('hr')].find(hr => hr.className.includes('delimiter'));
    }

    function insertElement(container, element) {
        const existingHr = findDelimiter(container);
        if (existingHr) {
            existingHr.insertAdjacentElement('afterend', element);
        } else {
            container.appendChild(element);
        }
    }

    function formatTimeHtml(formattedText, color) {
        let timeHtml = '';
        const parts = formattedText.match(/(\d+[hms])/g) || [];

        parts.forEach((part, index) => {
            const match = part.match(/(\d+)([hms])/);

            if (match) {
                const value = match[1];
                const unit = match[2];

                timeHtml += `<span style="color: ${color};">`;
                timeHtml += `<span style="font-weight: ${TIME_FONT_WEIGHT_NORMAL};">${value}</span>`;
                timeHtml += `<span style="font-weight: ${TIME_FONT_WEIGHT_LIGHT};">${unit}</span>`;
                timeHtml += `</span>`;

                if (index < parts.length - 1) {
                    timeHtml += ' ';
                }
            }
        });

        if (formattedText === '0s') {
            timeHtml = `<span style="color: ${color}; font-weight: ${TIME_FONT_WEIGHT_NORMAL};">0s</span>`;
        }

        return timeHtml;
    }

    // ====================================================================
    // API Key UI
    // ====================================================================

    function createInputUI(container) {
        if (!container) return;
        if (document.getElementById('tm-extra-input-wrap')) return;

        const isMobile = container.className.includes('user-information-mobile');

        const wrap = document.createElement('div');
        wrap.id = 'tm-extra-input-wrap';
        wrap.style.display = 'flex';
        wrap.style.gap = '6px';
        wrap.style.alignItems = 'center';
        wrap.style.margin = '8px 0';
        wrap.style.flexDirection = isMobile ? 'row' : 'column';
        wrap.style.justifyContent = isMobile ? 'flex-start' : 'center';

        const input = document.createElement('input');
        input.type = 'text';
        input.placeholder = '请输入Minimal API Key';
        input.style.flex = isMobile ? '1' : 'none';
        input.style.padding = '4px 6px';
        input.style.width = isMobile ? 'auto' : '120px';

        const btn = document.createElement('button');
        btn.textContent = '确定';
        btn.style.padding = '4px 6px';
        btn.style.border = '1px solid #333';
        btn.style.width = 'auto';
        btn.style.minWidth = '30px';
        btn.style.height = '24px';
        btn.style.fontSize = '12px';
        btn.addEventListener('click', () => {
            const key = input.value.trim();
            if (key) {
                localStorage.setItem(LOCAL_KEY, key);
                location.reload();
            }
        });

        wrap.appendChild(input);
        wrap.appendChild(btn);

        const hrBelow = document.createElement('hr');
        hrBelow.className = 'tm-delimiter';

        insertElement(container, wrap);
        wrap.insertAdjacentElement('afterend', hrBelow);
    }

    // ====================================================================
    // 核心显示函数 (修改 OC 标签)
    // ====================================================================

    function createTimeDisplay(container, cooldowns, ocTime, isPlaceholder = false) {
        let wrap = document.getElementById('tm-cooldown-display');
        const isMobile = container.className.includes('user-information-mobile');
        const API_KEY = localStorage.getItem(LOCAL_KEY);

        // 1. 创建或获取占位符
        if (!wrap) {
            wrap = document.createElement('div');
            wrap.id = 'tm-cooldown-display';
            const inputWrap = document.getElementById('tm-extra-input-wrap');
            if (inputWrap) {
                inputWrap.insertAdjacentElement('afterend', wrap);
            } else {
                insertElement(container, wrap);
            }
        }

        // 2. 样式配置
        if (isMobile) {
            wrap.style.minHeight = PLACEHOLDER_MIN_HEIGHT_MOBILE;
            wrap.style.display = 'flex';
            wrap.style.flexDirection = 'row';
            wrap.style.gap = '8px';
            wrap.style.flexWrap = 'wrap';
            wrap.style.margin = '2px 0';
            wrap.style.height = '1em';
            wrap.style.alignItems = 'center';
            wrap.style.paddingLeft = '10px';
            wrap.style.fontSize = BASE_FONT_SIZE_MOBILE;
        } else {
            wrap.style.minHeight = PLACEHOLDER_MIN_HEIGHT_PC;
            wrap.style.whiteSpace = 'pre-line';
            wrap.style.margin = '6px 0';
            wrap.style.fontSize = BASE_FONT_SIZE_PC;
            wrap.style.lineHeight = '1.8';
        }


        // 3. 处理占位符内容
        if (isPlaceholder) {
            wrap.innerHTML = '<span style="color: #777;">载入中...</span>';
            return;
        }

        // 4. 清除占位符并开始渲染实时内容
        wrap.innerHTML = '';
        wrap.style.minHeight = 'auto';

        // 注意：这里 ocTime 现在包含 value 和 difficulty
        const liveCooldowns = { ...cooldowns };
        const liveOcTime = ocTime ? { value: ocTime.value, difficulty: ocTime.difficulty } : null;

        if (wrap._timer) clearInterval(wrap._timer);

        function render() {
            wrap.innerHTML = '';
            const items = [];

            // 渲染 Drug/Medical/Booster
            for (const key of ['drug', 'medical', 'booster']) {
                let shouldShow = false;
                if (key === 'drug' && CONFIG.SHOW_DRUG) shouldShow = true;
                if (key === 'medical' && CONFIG.SHOW_MEDICAL) shouldShow = true;
                if (key === 'booster' && CONFIG.SHOW_BOOSTER) shouldShow = true;

                if (!(key in liveCooldowns) || !shouldShow) continue;

                let remaining = liveCooldowns[key];

                const formattedText = formatTime(remaining);
                const red = CONFIG.redWhenLow && remaining >= 0 && remaining < CONFIG.redThresholdMinutes * 60;
                const finalColor = red ? 'red !important' : TIME_VALUE_COLOR;

                const timeHtml = formatTimeHtml(formattedText, finalColor);

                const span = document.createElement('span');
                span.innerHTML = `<span style="color: ${LABEL_COLOR};">${key}:</span> ${timeHtml}`;

                if (!isMobile) span.style.display = 'block';
                items.push(span);

                liveCooldowns[key] = Math.max(remaining - 1, 0);
            }

            // 渲染 OC (修改标签以包含难度)
            if (liveOcTime && CONFIG.SHOW_OC) {
                let remainingOC = liveOcTime.value;
                const formattedOCText = formatTime(remainingOC);

                const redOC = CONFIG.redWhenLow && remainingOC >= 0 && remainingOC < CONFIG.redThresholdMinutes * 60;
                const finalOCColor = redOC ? 'red !important' : TIME_VALUE_COLOR;

                const timeOcHtml = formatTimeHtml(formattedOCText, finalOCColor);

                // --- 核心修改：生成包含难度的标签 ---
                const ocLabel = `oc(${liveOcTime.difficulty || '?' }):`;
                // ---

                const spanOC = document.createElement('span');
                spanOC.innerHTML = `<span style="color: ${LABEL_COLOR};">${ocLabel}</span> ${timeOcHtml}`;

                if (!isMobile) spanOC.style.display = 'block';
                items.push(spanOC);

                liveOcTime.value = Math.max(remainingOC - 1, 0);
            }

            // 如果没有项目显示，提供提示
            if (items.length === 0 && API_KEY) {
                wrap.innerHTML = '<span style="color: #777;">所有已启用的倒计时目前均已隐藏。请检查脚本顶部的配置。</span>';
            } else if (items.length === 0 && !API_KEY) {
                wrap.innerHTML = '<span style="color: #777;">请在上方输入 API Key 以启用倒计时。</span>';
            } else {
                items.forEach(item => wrap.appendChild(item));
            }
        }

        render();
        wrap._timer = setInterval(render, 1000);

        // 在 PC 端，确保底部有一条 HR 分隔线
        if (!isMobile && !container.querySelector('.tm-bottom-delimiter')) {
            const hrBelow = document.createElement('hr');
            hrBelow.className = 'delimiter tm-bottom-delimiter';
            container.appendChild(hrBelow);
        }
    }

    // ====================================================================
    // 数据获取函数 (修改 fetchOC 以提取 difficulty)
    // ====================================================================

    function fetchCooldowns(key, callback) {
        const defaultCooldowns = { drug: 0, medical: 0, booster: 0 };
        const cacheRaw = localStorage.getItem(CACHE_KEY);
        let cacheValid = false;

        if (cacheRaw) {
            try {
                const cache = JSON.parse(cacheRaw);
                const elapsedSeconds = (Date.now() - cache._timestamp) / 1000;

                if (cache.data && (typeof cache.data.drug === 'number') && (elapsedSeconds < CONFIG.cacheDuration)) {
                    const correctedCooldowns = {
                        drug: Math.max(cache.data.drug - elapsedSeconds, 0),
                        medical: Math.max(cache.data.medical - elapsedSeconds, 0),
                        booster: Math.max(cache.data.booster - elapsedSeconds, 0)
                    };
                    callback(correctedCooldowns);
                    cacheValid = true;
                }
            } catch (e) {}
        }

        if (cacheValid) return;

        fetch(`https://api.torn.com/user/?selections=cooldowns&key=${key}`, {
            method: 'GET',
            headers: { accept: 'application/json' }
        })
            .then(res => res.json())
            .then(data => {
                if (data.error || !data.cooldowns) {
                    if (!cacheValid) callback(defaultCooldowns);
                    return;
                }

                const cooldowns = {
                    drug: Math.max(data.cooldowns.drug || 0, 0),
                    medical: Math.max(data.cooldowns.medical || 0, 0),
                    booster: Math.max(data.cooldowns.booster || 0, 0)
                };

                localStorage.setItem(CACHE_KEY, JSON.stringify({ _timestamp: Date.now(), data: cooldowns }));
                if (!cacheValid) callback(cooldowns);
            })
            .catch(() => { if (!cacheValid) callback(defaultCooldowns); });
    }

    function fetchOC(key, callback) {
        let defaultOcTime = null; // 默认值包含时间0和未知难度
        const cacheRaw = localStorage.getItem(OC_CACHE_KEY);
        let cacheValid = false;

        if (cacheRaw) {
            try {
                const cache = JSON.parse(cacheRaw);
                const elapsedSeconds = (Date.now() - cache._timestamp) / 1000;

                if (elapsedSeconds < CONFIG.cacheDuration) {
                    const remainingOC = Math.max(cache.data.value - elapsedSeconds, 0);
                    // 从缓存中恢复难度字段
                    const cachedOcTime = { value: remainingOC, difficulty: cache.data.difficulty || '?' };
                    callback(cachedOcTime);
                    cacheValid = true;
                }
            } catch (e) {}
        }

        if (cacheValid) return;

        fetch(`https://api.torn.com/v2/user/organizedcrime?key=${key}`, {
            method: 'GET',
            headers: { accept: 'application/json' }
        })
            .then(res => res.json())
            .then(data => {
                const oc = data.organizedCrime;

                if (data.error || !oc) {
                    if (!cacheValid) callback(defaultOcTime);
                    return;
                }

                let emptySlots = oc.slots.filter(s => !s.user).length;
                let remaining = oc.ready_at - Math.floor(Date.now() / 1000) + emptySlots * 86400;

                if (remaining < 0) remaining = 0;

                // --- 核心修改：提取 difficulty ---
                const difficulty = oc.difficulty || '?';
                const ocTime = { value: remaining, difficulty: difficulty };
                // ---

                // 缓存时也保存 difficulty
                localStorage.setItem(OC_CACHE_KEY, JSON.stringify({_timestamp: Date.now(), data: ocTime}));
                if (!cacheValid) callback(ocTime);
            })
            .catch(() => { if (!cacheValid) callback(defaultOcTime); });
    }

    // ====================================================================
    // 核心启动逻辑
    // ====================================================================

    function tryInit() {
        let container = null;
        container = document.querySelector('[class*="user-information-mobile"]');

        if (!container) {
            const ul = findStatusIcons();
            if (ul) {
                container = ul.closest('div');
            }
        }

        if (!container) return false;

        const savedKey = localStorage.getItem(LOCAL_KEY);

        if (!savedKey) {
            createInputUI(container);
        } else {
            const inputWrap = document.getElementById('tm-extra-input-wrap');
            if (inputWrap) inputWrap.remove();

            createTimeDisplay(container, null, null, true);

            fetchCooldowns(savedKey, (cooldowns) => {
                fetchOC(savedKey, (ocTime) => {
                    createTimeDisplay(container, cooldowns, ocTime, false);
                });
            });
        }

        return true;
    }

    // 使用 MutationObserver 等待页面加载
    if (!tryInit()) {
        const obs = new MutationObserver(() => {
            if (tryInit()) obs.disconnect();
        });
        obs.observe(document.documentElement, { childList: true, subtree: true });
    }
})();