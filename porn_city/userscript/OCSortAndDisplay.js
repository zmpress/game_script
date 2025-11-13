// ==UserScript==
// @name         托恩帮派犯罪简化显示 (带排序和筛选)
// @namespace    http://tampermonkey.net/
// @version      1.1.1
// @description  优化 Torn 派系犯罪卡片的显示效果，并增加多级排序、筛选和简化开关
// @author       htys (zmpress修改版)
// @match        https://www.torn.com/factions.php?step=your*
// @grant        none
// @updateURL    https://raw.githubusercontent.com/zmpress/game_script/refs/heads/main/porn_city/userscript/OCSortAndDisplay.js
// @downloadURL    https://raw.githubusercontent.com/zmpress/game_script/refs/heads/main/porn_city/userscript/OCSortAndDisplay.js
// ==/UserScript==

(function () {
    'use strict';

    // --- 新增：本地存储和开关状态 ---
    const LS_KEY_SIMPLIFY = 'oc_simplify_display';
    // 默认值为 'true'。只有当 localStorage 明确存为 'false' 时才为 false。
    const simplifyEnabled = localStorage.getItem(LS_KEY_SIMPLIFY) !== 'false';

    // 原有的功能开关（保留，以防你需要手动关闭）
    const isShowInfluence = true;
    const isShowOverlay = true;
    // --- 结束 ---

    const INFLUENCE = {
        "Pet Project": { "Kidnapper": 41.14, "Muscle": 26.83, "Picklock": 32.03 },
        "Mob Mentality": { "Looter #1": 34.83, "Looter #2": 25.97, "Looter #3": 19.87, "Looter #4": 19.33 },
        "Cash Me if You Can": { "Thief #1": 46.67, "Thief #2": 21.87, "Lookout": 31.46 },
        "Best of the Lot": { "Picklock": 23.65, "Car Thief": 21.06, "Muscle": 36.43, "Imitator": 18.85 },
        "Market Forces": { "Enforcer": 27.56, "Negotiator": 25.59, "Lookout": 19.05, "Arsonist": 4.12, "Muscle": 23.68 },
        "Smoke and Wing Mirrors": { "Car Thief": 48.20, "Imitator": 26.30, "Hustler #1": 7.70, "Hustler #2": 17.81 },
        "Gaslight the Way": { "Imitator #1": 7.54, "Imitator #2": 34.85, "Imitator #3": 40.25, "Looter #1": 7.54, "Looter #2": 0.00, "Looter #3": 9.83 },
        "Stage Fright": { "Enforcer": 16.89, "Muscle #1": 21.92, "Muscle #2": 2.09, "Muscle #3": 9.49, "Lookout": 7.68, "Sniper": 41.92 },
        "Snow Blind": { "Hustler": 51.40, "Imitator": 30.44, "Muscle #1": 9.08, "Muscle #2": 9.08 },
        "Leave No Trace": { "Techie": 24.40, "Negotiator": 29.07, "Imitator": 46.54 },
        "No Reserve": { "Car Thief": 30.86, "Techie": 37.88, "Engineer": 31.27 },
        "Counter Offer": { "Robber": 33.29, "Looter": 4.69, "Hacker": 16.72, "Picklock": 17.10, "Engineer": 28.21 },
        "Honey Trap": { "Enforcer": 20.21, "Muscle #1": 34.32, "Muscle #2": 45.47 },
        "Bidding War": { "Robber #1": 6.82, "Driver": 21.93, "Robber #2": 19.63, "Robber #3": 25.65, "Bomber #1": 10.96, "Bomber #2": 15.00 },
        "Blast from the Past": { "Picklock #1": 9.81, "Hacker": 6.18, "Engineer": 25.29, "Bomber": 20.40, "Muscle": 36.75, "Picklock #2": 1.56 },
        "Break the Bank": { "Robber": 10.84, "Muscle #1": 10.27, "Muscle #2": 7.78, "Thief #1": 3.55, "Muscle #3": 33.54, "Thief #2": 34.03 },
        "Stacking the Deck": { "Cat Burglar": 31.99, "Driver": 3.86, "Hacker": 25.64, "Imitator": 38.52 },
        "Ace in the Hole": { "Imitator": 13.73, "Muscle #1": 18.55, "Muscle #2": 18.88, "Hacker": 37.49, "Driver": 11.35 }
    };

    // --- 注入CSS样式 ---
    function injectStyles() {
        const styleId = 'oc-filter-styles';
        if (document.getElementById(styleId)) return;

        const css = `
      #oc-filter-bar {
        padding: 10px;
        background: rgba(255, 255, 255, 0.15);
        border: 1px solid rgba(255, 255, 255, 0.2);
        border-radius: 6px;
        margin-bottom: 10px;
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
        align-items: center;
        color: #f0f0f0;
        font-size: 14px;
      }
      .oc-filter-group {
        display: flex;
        gap: 5px;
        align-items: center;
        padding-right: 10px;
        border-right: 1px solid #666;
      }
      .oc-filter-group span {
        font-weight: bold;
        font-size: 15px;
        color: #fff;
      }
      .oc-filter-group:last-of-type {
        border-right: none;
      }
      .oc-btn {
        padding: 5px 10px;
        border: 1px solid #999;
        background: #666;
        color: #fff;
        border-radius: 4px;
        cursor: pointer;
        font-size: 12px;
        user-select: none;
        white-space: nowrap;
        transition: border-color 0.2s, box-shadow 0.2s;
      }
      .oc-btn:hover {
        background: #777;
        border-color: #bbb;
      }
      .oc-btn.active, .oc-btn[data-sort-state="asc"], .oc-btn[data-sort-state="desc"] {
        background: #57a5e8;
        border-color: #68b6ff;
        font-weight: bold;
      }
      .oc-btn[data-sort-state="active"] {
        background: #57a5e8;
        border-color: #68b6ff;
        font-weight: bold;
      }
      .oc-btn.primary-sort {
        border-color: #ffd700;
        box-shadow: 0 0 8px rgba(255, 215, 0, 0.7);
      }
      #oc-filter-count {
        margin-left: auto;
        font-size: 15px;
        font-weight: bold;
        color: #fff;
        font-variant-numeric: tabular-nums;
      }
    `;

        const style = document.createElement('style');
        style.id = styleId;
        style.textContent = css;
        document.head.appendChild(style);
    }

    // --- 创建排序和筛选栏 (已修改) ---
    function createFilterBar(listContainer) {
        if (document.getElementById('oc-filter-bar')) return;

        const filterBar = document.createElement('div');
        filterBar.id = 'oc-filter-bar';
        filterBar.innerHTML = `
      <div class="oc-filter-group">
        <span>排序:</span>
        <button id="oc-sort-default" class="oc-btn primary-sort" data-sort-state="active">默认</button>
        <button id="oc-sort-level" class="oc-btn" data-sort-state="none">等级</button>
        <button id="oc-sort-time" class="oc-btn" data-sort-state="none">完成时间</button>
      </div>
      <div class="oc-filter-group">
        <span>筛选:</span>
        <button class="oc-btn active" data-level-filter="all">全部</button>
        <button class="oc-btn" data-level-filter="<=6">&lt;=6</button>
        <button class="oc-btn" data-level-filter=">=7">&gt;=7</button>
        <button class="oc-btn" data-level-filter="7">7</button>
        <button class="oc-btn" data-level-filter="8">8</button>
        <button class="oc-btn" data-level-filter="9">9</button>
        <button class="oc-btn" data-level-filter="10">10</button>
      </div>
      <div class="oc-filter-group">
        <span>显示:</span>
        <button id="oc-toggle-simplify" class="oc-btn"></button>
      </div>
      <div id="oc-filter-count"></div>
    `;

        listContainer.parentNode.insertBefore(filterBar, listContainer);

        const sortDefaultBtn = filterBar.querySelector('#oc-sort-default');
        const sortLevelBtn = filterBar.querySelector('#oc-sort-level');
        const sortTimeBtn = filterBar.querySelector('#oc-sort-time');
        const filterBtns = filterBar.querySelectorAll('[data-level-filter]');

        // --- 简化开关逻辑 (已修改) ---
        const simplifyBtn = filterBar.querySelector('#oc-toggle-simplify');
        if (simplifyEnabled) {
            simplifyBtn.textContent = '切换到原始显示';
            simplifyBtn.classList.add('active'); // 保持 "激活" 状态的蓝色
        } else {
            simplifyBtn.textContent = '切换到简化显示';
            // 默认没有 'active' 类，显示为灰色
        }
        simplifyBtn.addEventListener('click', () => {
            // 存储 *新* 的状态并刷新
            localStorage.setItem(LS_KEY_SIMPLIFY, !simplifyEnabled);
            location.reload();
        });
        // --- 结束 ---


        // --- 排序逻辑 ---
        function updateSortStates() {
            const levelState = sortLevelBtn.dataset.sortState;
            const timeState = sortTimeBtn.dataset.sortState;

            if (levelState === 'none' && timeState === 'none') {
                sortDefaultBtn.dataset.sortState = 'active';
                sortDefaultBtn.classList.add('primary-sort');
                sortLevelBtn.classList.remove('primary-sort');
                sortTimeBtn.classList.remove('primary-sort');
            } else {
                sortDefaultBtn.dataset.sortState = 'none';
                sortDefaultBtn.classList.remove('primary-sort');

                const levelIsPrimary = sortLevelBtn.classList.contains('primary-sort');
                const timeIsPrimary = sortTimeBtn.classList.contains('primary-sort');

                if (!levelIsPrimary && !timeIsPrimary) {
                    if (levelState !== 'none') {
                        sortLevelBtn.classList.add('primary-sort');
                    } else if (timeState !== 'none') {
                        sortTimeBtn.classList.add('primary-sort');
                    }
                } else if (levelIsPrimary && levelState === 'none') {
                    sortLevelBtn.classList.remove('primary-sort');
                    if (timeState !== 'none') {
                        sortTimeBtn.classList.add('primary-sort');
                    }
                } else if (timeIsPrimary && timeState === 'none') {
                    sortTimeBtn.classList.remove('primary-sort');
                    if (levelState !== 'none') {
                        sortLevelBtn.classList.add('primary-sort');
                    }
                }
            }
        }

        function handleSortClick(btn) {
            let currentState = btn.dataset.sortState;
            let nextState;

            if (currentState === 'none') {
                nextState = 'desc';
            } else if (currentState === 'desc') {
                nextState = 'asc';
            } else {
                nextState = 'desc';
            }

            btn.dataset.sortState = nextState;
            btn.textContent = `${btn.id === 'oc-sort-level' ? '等级' : '完成时间'} ${nextState === 'asc' ? '⬆' : nextState === 'desc' ? '⬇' : ''}`.trim();

            updateSortStates();
            applyFiltersAndSorting();
        }

        sortLevelBtn.addEventListener('click', () => handleSortClick(sortLevelBtn));
        sortTimeBtn.addEventListener('click', () => handleSortClick(sortTimeBtn));

        sortDefaultBtn.addEventListener('click', () => {
            if (sortDefaultBtn.dataset.sortState === 'active') return;

            sortDefaultBtn.dataset.sortState = 'active';
            sortDefaultBtn.classList.add('primary-sort');

            sortLevelBtn.dataset.sortState = 'none';
            sortLevelBtn.classList.remove('primary-sort');
            sortLevelBtn.textContent = '等级';

            sortTimeBtn.dataset.sortState = 'none';
            sortTimeBtn.classList.remove('primary-sort');
            sortTimeBtn.textContent = '完成时间';

            applyFiltersAndSorting();
        });


        // --- 筛选按钮逻辑 ---
        filterBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                const filter = btn.dataset.levelFilter;
                const wasActive = btn.classList.contains('active');
                const specificFilters = ['7', '8', '9', '10'];

                if (filter === 'all') {
                    if (wasActive) return;
                    filterBtns.forEach(b => b.classList.remove('active'));
                    btn.classList.add('active');
                } else {
                    btn.classList.toggle('active');
                    filterBar.querySelector('[data-level-filter="all"]').classList.remove('active');

                    if (btn.classList.contains('active')) {
                        if (filter === '<=6') {
                            filterBar.querySelector('[data-level-filter=">=7"]').classList.remove('active');
                            specificFilters.forEach(f => filterBar.querySelector(`[data-level-filter="${f}"]`).classList.remove('active'));
                        } else if (filter === '>=7') {
                            filterBar.querySelector('[data-level-filter="<=6"]').classList.remove('active');
                            specificFilters.forEach(f => filterBar.querySelector(`[data-level-filter="${f}"]`).classList.remove('active'));
                        } else if (specificFilters.includes(filter)) {
                            filterBar.querySelector('[data-level-filter="<=6"]').classList.remove('active');
                            filterBar.querySelector('[data-level-filter=">=7"]').classList.remove('active');
                        }
                    }

                    const anyActive = Array.from(filterBtns).some(b => b.classList.contains('active') && b.dataset.levelFilter !== 'all');
                    if (!anyActive) {
                        filterBar.querySelector('[data-level-filter="all"]').classList.add('active');
                    }
                }
                applyFiltersAndSorting();
            });
        });
    }

    // --- 应用排序和筛选的函数 ---
    function applyFiltersAndSorting() {
        const allCards = Array.from(document.querySelectorAll('[data-oc-id]'));
        if (allCards.length === 0) return;

        const parent = allCards[0].parentNode;
        const filterBar = document.getElementById('oc-filter-bar');
        if (!filterBar) return;

        const activeFilters = Array.from(filterBar.querySelectorAll('[data-level-filter].active'))
            .map(btn => btn.dataset.levelFilter);
        const isFilterAll = activeFilters.includes('all');

        const sortDefaultState = filterBar.querySelector('#oc-sort-default').dataset.sortState;
        const sortLevelState = filterBar.querySelector('#oc-sort-level').dataset.sortState;
        const sortTimeState = filterBar.querySelector('#oc-sort-time').dataset.sortState;

        let visibleCards = [];

        allCards.forEach(card => {
            const level = parseInt(card.dataset.ocLevel || '0');
            let isVisible = false;

            if (isFilterAll || activeFilters.length === 0) {
                isVisible = true;
            } else {
                isVisible = activeFilters.some(filter => {
                    if (filter === '<=6') return level <= 6;
                    if (filter === '>=7') return level >= 7;
                    return level == filter;
                });
            }

            card.style.display = isVisible ? '' : 'none';
            if (isVisible) {
                visibleCards.push(card);
            }
        });

        if (sortDefaultState === 'active') {
            visibleCards.sort((a, b) => {
                const indexA = parseInt(a.dataset.ocOriginalIndex || '0');
                const indexB = parseInt(b.dataset.ocOriginalIndex || '0');
                return indexA - indexB;
            });
        } else {
            const primarySortBtn = filterBar.querySelector('#oc-sort-level.primary-sort, #oc-sort-time.primary-sort');
            const primarySort = primarySortBtn ? (primarySortBtn.id === 'oc-sort-level' ? 'level' : 'time') : 'none';

            visibleCards.sort((a, b) => {
                const levelA = parseInt(a.dataset.ocLevel || '0');
                const levelB = parseInt(b.dataset.ocLevel || '0');
                const timeA = parseInt(a.dataset.ocTime || Number.MAX_SAFE_INTEGER);
                const timeB = parseInt(b.dataset.ocTime || Number.MAX_SAFE_INTEGER);

                let primaryCompare = 0;
                let secondaryCompare = 0;

                if (primarySort === 'level') {
                    if (sortLevelState !== 'none') {
                        primaryCompare = (sortLevelState === 'asc' ? levelA - levelB : levelB - levelA);
                    }
                    if (sortTimeState !== 'none') {
                        secondaryCompare = (sortTimeState === 'asc' ? timeA - timeB : timeB - timeA);
                    }
                } else {
                    if (sortTimeState !== 'none') {
                        primaryCompare = (sortTimeState === 'asc' ? timeA - timeB : timeB - timeA);
                    }
                    if (sortLevelState !== 'none') {
                        secondaryCompare = (sortLevelState === 'asc' ? levelA - levelB : levelB - levelA);
                    }
                }
                return primaryCompare !== 0 ? primaryCompare : secondaryCompare;
            });
        }

        visibleCards.forEach(card => parent.appendChild(card));

        const countEl = filterBar.querySelector('#oc-filter-count');
        countEl.textContent = `(${visibleCards.length}/${allCards.length})`;
    }

    function parseTornTimeToSeconds(text) {
        const parts = text.split(':').map(Number);
        if (parts.length !== 4) return Number.MAX_SAFE_INTEGER;
        const [dd, hh, mm, ss] = parts;
        return dd * 86400 + hh * 3600 + mm * 60 + ss;
    }

    function findMatchingCrimeName(inputName) {
        const possibleMatches = Object.keys(INFLUENCE).filter(key =>
            inputName.includes(key)
        );
        if (possibleMatches.length === 0) {
            console.error(`No matching crime found for "${inputName}"`);
            return null;
        }
        return possibleMatches.reduce((a, b) => a.length > b.length ? a : b);
    }

    function getInfluence(crimeName, jobName) {
        const matchedCrime = findMatchingCrimeName(crimeName);
        if (!matchedCrime) {
            return null;
        }
        if (!INFLUENCE[matchedCrime]) {
            console.error(`Crime "${matchedCrime}" not found`);
            return null;
        }
        if (INFLUENCE[matchedCrime][jobName] === undefined) {
            console.error(`Job "${jobName}" not found in crime "${matchedCrime}"`);
            return null;
        }
        return INFLUENCE[matchedCrime][jobName];
    }

    function applyCornerNumbers(card) {
        const notOpening = card.querySelector('.notOpening___BLPrF');
        if (!notOpening) return;

        const titleEl = card.querySelector('.panelTitle___aoGuV');
        const crimeName = titleEl ? titleEl.textContent.trim() : 'Unknown';

        notOpening.style.overflow = 'visible';

        Array.from(notOpening.children).forEach((child, idx) => {
            const cs = getComputedStyle(child);
            if (cs.position === 'static') child.style.position = 'relative';
            child.style.overflow = 'visible';

            const jobNameEl = child.querySelector('.title___UqFNy');
            const jobName = jobNameEl ? jobNameEl.textContent.trim() : 'Unknown';

            const jobInfluence = Math.round(getInfluence(crimeName, jobName));

            child.querySelectorAll('.oc-corner-index').forEach(n => n.remove());

            const badge = document.createElement('div');
            badge.className = 'oc-corner-index';
            badge.textContent = jobInfluence.toString();

            Object.assign(badge.style, {
                position: 'absolute',
                right: '-6px',
                bottom: '-6px',
                zIndex: '5',
                padding: '2px 6px',
                lineHeight: '1',
                fontSize: '12px',
                fontWeight: '700',
                color: '#fff',
                background: 'rgba(0,0,0,0.75)',
                borderRadius: '999px',
                boxShadow: '0 0 0 2px rgba(0,0,0,0.35)',
                pointerEvents: 'none',
                userSelect: 'none',
            });
            child.appendChild(badge);
        });
    }

    // --- ensureOverlay (仅在 simplifyEnabled=true 时运行) ---
    function ensureOverlay(card) {
        const scenario = card.querySelector('.scenario___cQfFm');
        if (!scenario) return;
        if (scenario.querySelector('[data-oc-overlay]')) return;
        if (scenario.querySelector('.failed___vUWp4')) return;
        if (scenario.querySelector('.success___AwcQT')) return;

        Array.from(scenario.children).forEach((child) => {
            child.style.visibility = 'hidden';
            child.style.pointerEvents = 'none';
            child.style.minHeight = '34px';
            child.style.height = '34px';
        });

        scenario.style.position = 'relative';
        const overlay = document.createElement('div');
        overlay.dataset.ocOverlay = '1';
        Object.assign(overlay.style, {
            position: 'absolute',
            inset: '0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-start',
            flexWrap: 'wrap',
            gap: '6px',
            padding: '4px 8px',
            background: 'rgba(255, 255, 255, 0.45)',
            fontSize: '12px',
            color: '#fff',
            pointerEvents: 'none',
        });

        function makeBlock(el, minWidth = 'auto', flex = '0 0 auto') {
            Object.assign(el.style, {
                display: 'inline-block',
                padding: '4px 6px',
                borderRadius: '4px',
                minWidth,
                flex,
                textAlign: 'center',
                whiteSpace: 'nowrap',
            });
            return el;
        }

        const statusEl = makeBlock(document.createElement('span'), '50px', '0 0 auto');
        statusEl.classList.add('oc-overlay-status');

        const timerEl = makeBlock(document.createElement('span'), '80px', '0 0 auto');
        timerEl.style.fontVariantNumeric = 'tabular-nums';
        timerEl.classList.add('oc-overlay-timer');

        const localEl = makeBlock(document.createElement('span'), '200px', '0 0 auto');
        localEl.classList.add('oc-overlay-local');

        const nameEl = makeBlock(document.createElement('span'), '160px', '1 1 auto');
        nameEl.style.overflow = 'hidden';
        nameEl.style.textOverflow = 'ellipsis';
        nameEl.classList.add('oc-overlay-name');

        const levelEl = makeBlock(document.createElement('span'), '40px', '0 0 auto');
        levelEl.style.fontWeight = '700';
        levelEl.classList.add('oc-overlay-level');

        overlay.append(statusEl, timerEl, localEl, nameEl, levelEl);
        scenario.appendChild(overlay);
        scenario._ocOverlay = { statusEl, timerEl, localEl, nameEl, levelEl };
    }

    // --- 重构：更新卡片信息 (数据绑定+可选的UI更新) ---
    function updateCardInfo(card) {
        // --- 1. 查找元素 ---
        const titleEl = card.querySelector('.panelTitle___aoGuV');
        const levelVal = card.querySelector('.levelValue___TE4qC');
        const timerSrc = card.querySelector('.title___pB5FU');

        const crimeName = titleEl ? titleEl.textContent.trim() : 'Unknown';
        const crimeLevel = levelVal ? levelVal.textContent.trim() : '?';
        const status = getStatus(card);
        const remaining = timerSrc ? timerSrc.textContent.trim() : '';
        const localTime = (status === 'active') ? calcLocalTime(remaining) : '未知';

        // --- 2. 始终绑定数据 (用于排序) ---
        card.dataset.ocLevel = levelVal ? parseInt(crimeLevel) : 0;
        if (status === 'active') {
            card.dataset.ocTime = parseTornTimeToSeconds(remaining);
        } else {
            card.dataset.ocTime = Number.MAX_SAFE_INTEGER;
        }

        // --- 3. 仅在 "简化" 模式下更新 overlay UI ---
        if (simplifyEnabled && isShowOverlay) {
            const o = card.querySelector('.scenario___cQfFm')._ocOverlay;
            if (!o) return;

            const levelColor = levelVal ? window.getComputedStyle(levelVal).color : 'inherit';

            o.statusEl.textContent = statusIcon(status);
            o.statusEl.style.backgroundColor = statusColor(status);
            o.timerEl.textContent = (status === 'recruiting') ? '' : remaining;
            o.timerEl.style.backgroundColor = statusColor(status);
            o.localEl.textContent = '倒计时结束于 ' + localTime;
            o.localEl.style.backgroundColor = statusColor(status);
            o.nameEl.textContent = crimeName;
            o.nameEl.style.backgroundColor = levelColor;
            o.levelEl.textContent = `Lv.${crimeLevel}`;
            o.levelEl.style.backgroundColor = levelColor;
        }

        // --- 4. 始终设置观察者 (用于更新数据和可选的UI) ---
        if (timerSrc && !card._ocObserver) { // 使用一个观察者
            card._ocObserver = new MutationObserver(() => {
                const newTimeText = timerSrc.textContent;
                const currentStatus = getStatus(card);

                // 始终更新数据
                if (currentStatus === 'active') {
                    card.dataset.ocTime = parseTornTimeToSeconds(newTimeText);
                } else {
                    card.dataset.ocTime = Number.MAX_SAFE_INTEGER;
                }

                // 仅在 "简化" 模式下更新 overlay 计时器
                if (simplifyEnabled && isShowOverlay) {
                    const o = card.querySelector('.scenario___cQfFm')._ocOverlay;
                    if (o) o.timerEl.textContent = newTimeText;
                }
            });
            card._ocObserver.observe(timerSrc, { childList: true, characterData: true, subtree: true });

            // 初始设置 overlay 计时器
            if (simplifyEnabled && isShowOverlay) {
                const o = card.querySelector('.scenario___cQfFm')._ocOverlay;
                if (o) o.timerEl.textContent = timerSrc.textContent;
            }
        }
    }

    function getStatus(card) {
        const phase = card.querySelector('.phase___LcbAX');
        if (!phase) return '';
        const icon = phase.querySelector('.iconContainer___TDZ9F');
        if (icon) return icon.getAttribute('aria-label');
    }

    function statusIcon(status) {
        if (status === 'paused') return '⏸ 暂停中';
        if (status === 'active') return '▶ 进行中';
        if (status === 'recruiting') return '⏹ 招募中';
        return '❓ 未知';
    }

    function statusColor(status) {
        if (status === 'paused') return '#757947';
        if (status === 'active') return '#62a362';
        if (status === 'recruiting') return '#4682b4';
        return '#033649';
    }

    function calcLocalTime(text) {
        const parts = text.split(':').map(Number);
        if (parts.length !== 4) return '';
        const [dd, hh, mm, ss] = parts;
        const totalSeconds = dd * 86400 + hh * 3600 + mm * 60 + ss;
        const end = new Date(Date.now() + totalSeconds * 1000);
        const options = {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: false
        };
        return end.toLocaleString('zh-CN', options).replace(/\//g, '/');
    }

    // --- 遍历应用 (已修改) ---
    function applyOverlays() {
        const cards = document.querySelectorAll('[data-oc-id]');
        cards.forEach((c, index) => {

            if (c.dataset.ocOriginalIndex === undefined) {
                c.dataset.ocOriginalIndex = index;
            }

            // --- 仅在 "简化" 模式下运行视觉修改 ---
            if (simplifyEnabled) {
                if (isShowInfluence === true) {
                    applyCornerNumbers(c);
                }
                if (isShowOverlay === true) {
                    ensureOverlay(c);
                }
            }

            // --- 始终运行数据绑定和(可选的)UI更新 ---
            updateCardInfo(c);
        });
    }


    // --- 启动逻辑 ---
    let appearObserver = null;
    let removalObserver = null;
    let currentListElement = null;

    function startWatchingForCrimesList(callback) {
        if (appearObserver) appearObserver.disconnect();
        let lastRun = 0;
        const interval = 200; // ms
        appearObserver = new MutationObserver(() => {
            const now = Date.now();
            if (now - lastRun < interval) return;
            lastRun = now;
            const list = document.querySelectorAll('[data-oc-id]');
            if (list.length > 0) {
                const first = list[0];
                if (first !== currentListElement) {
                    console.log('[data-oc-id] 出现了,一共 ' + list.length + ' 个');
                    currentListElement = first;
                    onCrimesListAppeared(first, callback);
                    watchCrimesListRemoval(first, callback);
                }
            }
        });

        appearObserver.observe(document.body, { childList: true, subtree: true });
        console.log('🔍 开始监听 [data-oc-id] 的出现');
    }

    function watchCrimesListRemoval(listElement, callback) {
        const parent = listElement.parentNode;
        if (!parent) {
            currentListElement = null;
            return startWatchingForCrimesList(callback);
        }
        let lastRun = 0;
        const interval = 200; // ms
        removalObserver = new MutationObserver(() => {
            const now = Date.now();
            if (now - lastRun < interval) return;
            lastRun = now;
            if (!document.body.contains(listElement)) {
                console.log('[data-oc-id] 被移除了');
                removalObserver.disconnect();
                currentListElement = null;
                startWatchingForCrimesList(callback);
            }
        });

        removalObserver.observe(parent, { childList: true, subtree: true });
        console.log('👀 开始监听 [data-oc-id] 的消失与变化');
    }

    function onCrimesListAppeared(root, callback) {
        const listContainer = root.parentNode;
        if (listContainer) {
            injectStyles(); // 始终注入 CSS (用于筛选栏)
            createFilterBar(listContainer); // 始终创建筛选栏 (包含开关)
        }

        callback(); // 执行原始的回调 (即 applyOverlays)
        applyFiltersAndSorting(); // 始终应用排序和筛选
    }

    // 启动监听
    startWatchingForCrimesList(() => {
        applyOverlays();
    });

})();