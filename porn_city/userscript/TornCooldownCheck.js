// ==UserScript==
// @name         Torn Cooldown check
// @namespace    http://tampermonkey.net/
// @version      2.9
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
        cacheDuration: 60,
        redWhenLow: true,
        redThresholdMinutes: 5,
        showSecondsThresholdMinutes: 5,
    };

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

    function createInputUI(container) {
        if (!container) return;
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
        input.style.width = isMobile ? 'auto' : '120px'; // PC更窄

        const btn = document.createElement('button');
        btn.textContent = '确定';
        btn.style.padding = '4px 6px'; // 更紧凑
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

        function render() {
            wrap.innerHTML = '';
            const items = [];
            for (const key of ['drug', 'medical', 'booster']) {
                if (!(key in cooldowns)) continue;
                const remaining = cooldowns[key];
                const formatted = formatTime(remaining);
                const red = CONFIG.redWhenLow && remaining < CONFIG.redThresholdMinutes * 60;
                const span = document.createElement('span');
                span.textContent = `${key}: ${formatted}`;
                if (red) span.style.color = 'red';
                if (!isMobile) span.style.display = 'block';
                items.push(span);
                cooldowns[key] = Math.max(remaining - 1, 0);
            }
            if (ocTime) {
                const remainingOC = Math.max(ocTime.value - 1, 0);
                const formattedOC = formatTime(remainingOC);
                const redOC = CONFIG.redWhenLow && remainingOC < CONFIG.redThresholdMinutes * 60;
                const spanOC = document.createElement('span');
                spanOC.textContent = `OC: ${formattedOC}`;
                if (redOC) spanOC.style.color = 'red';
                if (!isMobile) spanOC.style.display = 'block';
                items.push(spanOC);
                ocTime.value = remainingOC;
            }
            items.forEach(item => wrap.appendChild(item));
        }

        render();
        setInterval(render, 1000);
        container.appendChild(wrap);

        if (!isMobile) {
            const hrBelow = document.createElement('hr');
            hrBelow.className = 'delimiter';
            container.appendChild(hrBelow);
        }
    }

    function fetchOC(key, callback) {
        const cacheRaw = localStorage.getItem(OC_CACHE_KEY);
        if (cacheRaw) {
            try {
                const cache = JSON.parse(cacheRaw);
                if (Date.now() - cache._timestamp < CONFIG.cacheDuration * 1000) {
                    callback(cache.data);
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
                    if (!oc) { callback(null); return; }
                    let emptySlots = oc.slots.filter(s => !s.user).length;
                    let remaining = oc.ready_at - Math.floor(Date.now() / 1000) + emptySlots * 86400;
                    if (remaining < 0) remaining = 0;
                    const ocTime = { value: remaining };
                    localStorage.setItem(OC_CACHE_KEY, JSON.stringify({_timestamp: Date.now(), data: ocTime}));
                    callback(ocTime);
                } catch(e) {
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
            const cacheRaw = localStorage.getItem(CACHE_KEY);
            let cooldowns = null;
            if (cacheRaw) {
                try {
                    const cache = JSON.parse(cacheRaw);
                    if (Date.now() - cache._timestamp < CONFIG.cacheDuration * 1000) {
                        cooldowns = cache.data;
                    }
                } catch (e) {}
            }
            if (!cooldowns) {
                cooldowns = { drug: 10527, medical: 14597, booster: 0 };
                localStorage.setItem(CACHE_KEY, JSON.stringify({ data: cooldowns, _timestamp: Date.now() }));
            }

            fetchOC(savedKey, (ocTime) => {
                createTimeDisplay(container, cooldowns, ocTime);
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
