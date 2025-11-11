// ==UserScript==
// @name         Torn Cooldown check
// @namespace    http://tampermonkey.net/
// @version      3.7 // 修正移动端容器查找和插入逻辑，确保显示
// @description  Torn Cooldowns & Organized Crime 倒计时显示到秒，PC/移动端分别优化，PC换行，手机版一行并左对齐，PC输入框更窄，按钮紧凑
// @match        *://*/*
// @run-at       document-idle
// @grant        GM_xmlhttpRequest
// ==/UserScript==

(function () {
    const LOCAL_KEY = 'torn_cooldown_api_key';
    const CACHE_KEY = 'torn_cooldown_cache';
    const OC_CACHE_KEY = 'torn_oc_cache';

    const CONFIG = {
        cacheDuration: 60, // 缓存有效期 60 秒
        redWhenLow: true,
        redThresholdMinutes: 5,
        showSecondsThresholdMinutes: 5,
    };

    // --- 样式配置 ---
    const BASE_FONT_SIZE_PC = '15px';
    const BASE_FONT_SIZE_MOBILE = '13px';
    const LABEL_COLOR = '#999';
    const TIME_VALUE_COLOR = '#4A85C2'; // 饱和度更高的淡蓝色
    const TIME_FONT_WEIGHT = '100'; // 最细字体
    const PLACEHOLDER_MIN_HEIGHT_PC = '110px'; // 预留PC端空间
    const PLACEHOLDER_MIN_HEIGHT_MOBILE = '20px'; // 预留手机端空间
    // ---

    /**
     * 格式化剩余秒数。如果是 0 或负数，显示 '0s'。
     */
    function formatTime(seconds) {
        let s = Math.floor(seconds);
        if (s <= 0) return '0s';

        const days = Math.floor(s / 86400); s %= 86400;
        const hours = Math.floor(s / 3600); s %= 3600;
        const minutes = Math.floor(s / 60); s %= 60;

        const showSecondsThreshold = CONFIG.showSecondsThresholdMinutes * 60;

        if (seconds <= showSecondsThreshold) {
            return `${minutes}m${s}s`;
        } else if (days > 0) {
            return `${days}d${hours}h${minutes}m`;
        } else if (hours > 0) {
            return `${hours}h${minutes}m`;
        } else {
            return `${minutes}m`;
        }
    }

    function findStatusIcons() {
        return [...document.querySelectorAll('ul')].find(ul => ul.className.split(' ').some(c => c.startsWith('status-icons')));
    }

    function findDelimiter(container) {
        return [...container.querySelectorAll('hr')].find(hr => hr.className.includes('delimiter'));
    }

    // 统一的插入函数
    function insertElement(container, element) {
        const existingHr = findDelimiter(container);
        if (existingHr) {
            // 如果找到分割线，插入到分割线之后
            existingHr.insertAdjacentElement('afterend', element);
        } else {
            // 否则插入到容器末尾
            container.appendChild(element);
        }
    }


    function createInputUI(container) {
        if (!container) return;
        if (document.getElementById('tm-extra-input-wrap')) return;

        const isMobile = container.className.startsWith('user-information-mobile');

        const wrap = document.createElement('div');
        wrap.id = 'tm-extra-input-wrap';
        wrap.style.display = 'flex';
        wrap.style.gap = '6px';
        wrap.style.alignItems = 'center';
        wrap.style.margin = '8px 0';
        wrap.style.flexDirection = isMobile ? 'row' : 'column';

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

        // 使用统一插入逻辑，但确保 hrBelow 在 wrap 之后
        insertElement(container, wrap);
        wrap.insertAdjacentElement('afterend', hrBelow);
    }

    /**
     * 核心显示函数：负责创建占位符并实时渲染内容。
     */
    function createTimeDisplay(container, cooldowns, ocTime, isPlaceholder = false) {
        let wrap = document.getElementById('tm-cooldown-display');
        const isMobile = container.className.startsWith('user-information-mobile');

        // 1. 创建或获取占位符
        if (!wrap) {
            wrap = document.createElement('div');
            wrap.id = 'tm-cooldown-display';
            insertElement(container, wrap); // 使用统一插入逻辑
        }

        // 2. 应用占位符/基本样式
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
        wrap.style.minHeight = 'auto'; // 内容加载后允许高度自适应

        const liveCooldowns = { ...cooldowns };
        const liveOcTime = ocTime ? { value: ocTime.value } : null;

        // 确保计时器只设置一次
        if (wrap._timer) clearInterval(wrap._timer);

        function render() {
            wrap.innerHTML = '';
            const items = [];

            // 渲染 Drug/Medical/Booster
            for (const key of ['drug', 'medical', 'booster']) {
                if (!(key in liveCooldowns)) continue;
                let remaining = liveCooldowns[key];
                const formatted = formatTime(remaining);

                const red = CONFIG.redWhenLow && remaining > 0 && remaining < CONFIG.redThresholdMinutes * 60;

                const span = document.createElement('span');

                let timeHtml = `<span style="color: ${TIME_VALUE_COLOR}; font-weight: ${TIME_FONT_WEIGHT};">${formatted}</span>`;
                if (red) {
                    timeHtml = `<span style="color: red !important; font-weight: ${TIME_FONT_WEIGHT};">${formatted}</span>`;
                }

                span.innerHTML = `<span style="color: ${LABEL_COLOR};">${key}:</span> ${timeHtml}`;

                if (!isMobile) span.style.display = 'block';
                items.push(span);

                liveCooldowns[key] = Math.max(remaining - 1, 0);
            }

            // 渲染 OC
            if (liveOcTime) {
                let remainingOC = liveOcTime.value;
                const formattedOC = formatTime(remainingOC);
                const redOC = CONFIG.redWhenLow && remainingOC > 0 && remainingOC < CONFIG.redThresholdMinutes * 60;

                const spanOC = document.createElement('span');

                let timeOcHtml = `<span style="color: ${TIME_VALUE_COLOR}; font-weight: ${TIME_FONT_WEIGHT};">${formattedOC}</span>`;
                if (redOC) {
                    timeOcHtml = `<span style="color: red !important; font-weight: ${TIME_FONT_WEIGHT};">${formattedOC}</span>`;
                }

                spanOC.innerHTML = `<span style="color: ${LABEL_COLOR};">oc:</span> ${timeOcHtml}`;

                if (!isMobile) spanOC.style.display = 'block';
                items.push(spanOC);

                liveOcTime.value = Math.max(remainingOC - 1, 0);
            }

            items.forEach(item => wrap.appendChild(item));
        }

        render();
        wrap._timer = setInterval(render, 1000); // 存储定时器

        // 在 PC 端，确保底部有一条 HR 分隔线
        if (!isMobile && !container.querySelector('.tm-bottom-delimiter')) {
            const hrBelow = document.createElement('hr');
            hrBelow.className = 'delimiter tm-bottom-delimiter';
            container.appendChild(hrBelow);
        }
    }


    function fetchCooldowns(key, callback) {
        const defaultCooldowns = { drug: 0, medical: 0, booster: 0 };
        const cacheRaw = localStorage.getItem(CACHE_KEY);

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
                    return;
                }
            } catch (e) {
                console.error("Error parsing Cooldowns cache:", e);
            }
        }

        GM_xmlhttpRequest({
            method: 'GET',
            url: `https://api.torn.com/user/?selections=cooldowns&key=${key}`,
            headers: { accept: 'application/json' },
            onload: (res) => {
                try {
                    const data = JSON.parse(res.responseText);

                    if (data.error || !data.cooldowns) {
                        console.error('Torn API Error (Cooldowns):', data.error || 'Missing cooldowns data');
                        callback(defaultCooldowns);
                        return;
                    }

                    const drugRemaining = data.cooldowns.drug || 0;
                    const medicalRemaining = data.cooldowns.medical || 0;
                    const boosterRemaining = data.cooldowns.booster || 0;

                    const cooldowns = {
                        drug: Math.max(drugRemaining, 0),
                        medical: Math.max(medicalRemaining, 0),
                        booster: Math.max(boosterRemaining, 0)
                    };

                    localStorage.setItem(CACHE_KEY, JSON.stringify({ _timestamp: Date.now(), data: cooldowns }));
                    callback(cooldowns);

                } catch(e) {
                    console.error('Error parsing Cooldowns response or calculating:', e);
                    callback(defaultCooldowns);
                }
            },
            onerror: () => {
                console.error('GM_xmlhttpRequest failed for Cooldowns.');
                callback(defaultCooldowns);
            }
        });
    }

    function fetchOC(key, callback) {
        const cacheRaw = localStorage.getItem(OC_CACHE_KEY);
        if (cacheRaw) {
            try {
                const cache = JSON.parse(cacheRaw);
                const elapsedSeconds = (Date.now() - cache._timestamp) / 1000;

                if (elapsedSeconds < CONFIG.cacheDuration) {

                    const remainingOC = Math.max(cache.data.value - elapsedSeconds, 0);

                    const correctedOcTime = { value: remainingOC };

                    callback(correctedOcTime);
                    return;
                }
            } catch (e) {}
        }

        GM_xmlhttpRequest({
            method: 'GET',
            url: `https://api.torn.com/v2/user/organizedcrime?key=${key}`,
            headers: { accept: 'application/json' },
            onload: (res) => {
                try {
                    const data = JSON.parse(res.responseText);
                    const oc = data.organizedCrime;

                    if (data.error || !oc) {
                        console.error('Torn API Error (OC):', data.error || 'Missing OC data');
                        callback(null);
                        return;
                    }

                    let emptySlots = oc.slots.filter(s => !s.user).length;
                    let remaining = oc.ready_at - Math.floor(Date.now() / 1000) + emptySlots * 86400;

                    if (remaining < 0) remaining = 0;
                    const ocTime = { value: remaining };
                    localStorage.setItem(OC_CACHE_KEY, JSON.stringify({_timestamp: Date.now(), data: ocTime}));
                    callback(ocTime);
                } catch(e) {
                    console.error('Error fetching OC:', e);
                    callback(null);
                }
            },
            onerror: () => callback(null)
        });
    }

    // 核心启动逻辑
    function tryInit() {
        let container = null;
        // 移动端查找
        const mobileContainer = document.querySelector('[class^="user-information-mobile"]');
        if (mobileContainer) {
            container = mobileContainer;
        } else {
            // PC端查找
            const ul = findStatusIcons();
            if (!ul) return false;
            container = ul.closest('div');
        }

        if (!container) return false;

        const savedKey = localStorage.getItem(LOCAL_KEY);

        if (!savedKey) {
            createInputUI(container);
        } else {
            // 立即创建占位符
            createTimeDisplay(container, null, null, true);

            // 异步获取数据并填充占位符
            fetchCooldowns(savedKey, (cooldowns) => {
                fetchOC(savedKey, (ocTime) => {
                    // 数据准备好后，填充内容并开始倒计时
                    createTimeDisplay(container, cooldowns, ocTime, false);
                });
            });
        }

        return true;
    }

    if (!tryInit()) {
        const obs = new MutationObserver(() => {
            if (tryInit()) obs.disconnect();
        });
        obs.observe(document.documentElement, { childList: true, subtree: true });
    }
})();