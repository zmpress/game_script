// ==UserScript==
// @name         Torn Cooldown check
// @namespace    http://tampermonkey.net/
// @version      3.3 // 修正了读取缓存时未减去时间差的问题
// @description  Torn Cooldowns & Organized Crime 倒计时显示到秒，PC/移动端分别优化，PC换行，手机版一行并左对齐，PC输入框更窄，按钮紧凑
// @match        *://*/*
// @run-at       document-idle
// @grant        GM_xmlhttpRequest
// ==/UserScript==

(function () {
    const LOCAL_KEY = 'torn_cooldown_api_key';
    const CACHE_KEY = 'torn_cooldown_cache'; // 用于 drug/medical/booster 冷却时间
    const OC_CACHE_KEY = 'torn_oc_cache'; // 用于 Organized Crime 冷却时间

    const CONFIG = {
        cacheDuration: 60, // 缓存有效期 60 秒
        redWhenLow: true,
        redThresholdMinutes: 5,
        showSecondsThresholdMinutes: 5,
    };

    /**
     * 格式化剩余秒数。如果是 0 或负数，显示 '0s'。
     * @param {number} seconds - 剩余秒数。
     * @returns {string} 格式化的时间字符串。
     */
    function formatTime(seconds) {
        let s = Math.floor(seconds);

        // 如果剩余秒数小于或等于 0，直接返回 '0s'
        if (s <= 0) return '0s';

        const days = Math.floor(s / 86400); s %= 86400;
        const hours = Math.floor(s / 3600); s %= 3600;
        const minutes = Math.floor(s / 60); s %= 60;

        const showSecondsThreshold = CONFIG.showSecondsThresholdMinutes * 60;

        if (seconds <= showSecondsThreshold) {
            // 在阈值内显示到秒
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

    function createInputUI(container) {
        if (!container) return;
        if (document.getElementById('tm-extra-input-wrap')) return;

        const isMobile = container.className.startsWith('user-information-mobile');
        const existingHr = findDelimiter(container);

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

        if (existingHr && existingHr.parentElement === container) {
            existingHr.insertAdjacentElement('afterend', wrap);
            wrap.insertAdjacentElement('afterend', hrBelow);
        } else {
            container.appendChild(wrap);
            container.appendChild(hrBelow);
        }
    }

    function createTimeDisplay(container, cooldowns, ocTime) {
        if (document.getElementById('tm-cooldown-display')) return;

        const wrap = document.createElement('div');
        wrap.id = 'tm-cooldown-display';

        const isMobile = container.className.startsWith('user-information-mobile');

        if (isMobile) {
            wrap.style.display = 'flex';
            wrap.style.flexDirection = 'row';
            wrap.style.gap = '8px';
            wrap.style.flexWrap = 'wrap';
            wrap.style.margin = '2px 0';
            wrap.style.height = '1em';
            wrap.style.alignItems = 'center';
            wrap.style.paddingLeft = '10px';
        } else {
            wrap.style.whiteSpace = 'pre-line';
            wrap.style.margin = '6px 0';
            wrap.style.fontSize = '14px';
            wrap.style.lineHeight = '1.6';
        }

        const liveCooldowns = { ...cooldowns };
        const liveOcTime = ocTime ? { value: ocTime.value } : null;

        function render() {
            wrap.innerHTML = '';
            const items = [];

            // 渲染 Drug/Medical/Booster
            for (const key of ['drug', 'medical', 'booster']) {
                if (!(key in liveCooldowns)) continue;
                let remaining = liveCooldowns[key];
                const formatted = formatTime(remaining);
                // 仅在剩余时间大于 0 时才应用红色阈值判断
                const red = CONFIG.redWhenLow && remaining > 0 && remaining < CONFIG.redThresholdMinutes * 60;

                const span = document.createElement('span');
                span.textContent = `${key}: ${formatted}`;
                if (red) span.style.color = 'red';
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
                spanOC.textContent = `OC: ${formattedOC}`;
                if (redOC) spanOC.style.color = 'red';
                if (!isMobile) spanOC.style.display = 'block';
                items.push(spanOC);

                liveOcTime.value = Math.max(remainingOC - 1, 0);
            }

            items.forEach(item => wrap.appendChild(item));
        }

        render();
        setInterval(render, 1000);

        const existingHr = findDelimiter(container);
        if (existingHr) {
            existingHr.insertAdjacentElement('afterend', wrap);
        } else {
            container.appendChild(wrap);
        }

        if (!isMobile) {
            const hrBelow = document.createElement('hr');
            hrBelow.className = 'delimiter';
            container.appendChild(hrBelow);
        }
    }


    /**
     * 通过 API 获取冷却时间 (drugcd, medicalcd)，并处理 60 秒缓存。
     * @param {string} key - API Key。
     * @param {function(Object|null)} callback - 回调函数。
     */
    function fetchCooldowns(key, callback) {
        const defaultCooldowns = { drug: 0, medical: 0, booster: 0 };
        const cacheRaw = localStorage.getItem(CACHE_KEY);

        if (cacheRaw) {
            try {
                const cache = JSON.parse(cacheRaw);
                const elapsedSeconds = (Date.now() - cache._timestamp) / 1000;

                // 确保缓存数据结构是有效的，并且未过期
                if (cache.data && (typeof cache.data.drug === 'number') && (elapsedSeconds < CONFIG.cacheDuration * 1000)) {

                    // 修正：从缓存时间中减去流逝的时间
                    const correctedCooldowns = {
                        drug: Math.max(cache.data.drug - elapsedSeconds, 0),
                        medical: Math.max(cache.data.medical - elapsedSeconds, 0),
                        booster: Math.max(cache.data.booster - elapsedSeconds, 0)
                    };

                    callback(correctedCooldowns); // 使用校正后的数据
                    return;
                }
            } catch (e) {
                console.error("Error parsing Cooldowns cache:", e);
                // 缓存解析失败，继续API请求
            }
        }

        GM_xmlhttpRequest({
            method: 'GET',
            url: `https://api.torn.com/user/?selections=cooldowns&key=${key}`,
            headers: { accept: 'application/json' },
            onload: (res) => {
                try {
                    const data = JSON.parse(res.responseText);

                    // 1. API 错误检查
                    if (data.error) {
                        console.error('Torn API Error (Cooldowns):', data.error);
                        callback(defaultCooldowns);
                        return;
                    }
                    if (!data.cooldowns) {
                        console.error('Torn API Error (Cooldowns): Missing cooldowns data', data);
                        callback(defaultCooldowns);
                        return;
                    }

                    // 2. 确保 API 返回的值是数字（使用用户提供的键名 drug, medical, booster）
                    const drugRemaining = data.cooldowns.drug || 0;
                    const medicalRemaining = data.cooldowns.medical || 0;
                    const boosterRemaining = data.cooldowns.booster || 0;

                    const cooldowns = {
                        // 假设 API 返回的就是剩余秒数，确保计算结果不小于 0
                        drug: Math.max(drugRemaining, 0),
                        medical: Math.max(medicalRemaining, 0),
                        booster: Math.max(boosterRemaining, 0)
                    };

                    localStorage.setItem(CACHE_KEY, JSON.stringify({ _timestamp: Date.now(), data: cooldowns }));
                    callback(cooldowns);

                } catch(e) {
                    console.error('Error parsing Cooldowns response or calculating:', e);
                    callback(defaultCooldowns); // 解析失败返回默认值
                }
            },
            onerror: () => {
                console.error('GM_xmlhttpRequest failed for Cooldowns.');
                callback(defaultCooldowns); // 网络请求失败返回默认值
            }
        });
    }

    /**
     * 通过 API 获取 OC 冷却时间，并处理 60 秒缓存。
     * @param {string} key - API Key。
     * @param {function(Object|null)} callback - 回调函数。
     */
    function fetchOC(key, callback) {
        const cacheRaw = localStorage.getItem(OC_CACHE_KEY);
        if (cacheRaw) {
            try {
                const cache = JSON.parse(cacheRaw);
                const elapsedSeconds = (Date.now() - cache._timestamp) / 1000;

                if (elapsedSeconds < CONFIG.cacheDuration * 1000) {

                    // 修正：从缓存时间中减去流逝的时间
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

                    // OC 计算逻辑 (包含空槽位惩罚)
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

    function tryInit() {
        let container = null;
        const mobileContainer = document.querySelector('[class^="user-information-mobile"]');
        if (mobileContainer) {
            container = mobileContainer;
        } else {
            const ul = findStatusIcons();
            if (!ul) return false;
            container = ul.closest('div');
        }

        const savedKey = localStorage.getItem(LOCAL_KEY);

        if (!savedKey) {
            createInputUI(container);
        } else {
            // 1. 获取 Cooldowns 数据
            fetchCooldowns(savedKey, (cooldowns) => {
                const finalCooldowns = cooldowns;

                // 2. 获取 Organized Crime (OC) 数据
                fetchOC(savedKey, (ocTime) => {
                    // 3. 创建时间显示 UI
                    createTimeDisplay(container, finalCooldowns, ocTime);
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