// ==UserScript==
// @name         托恩帮派犯罪简化显示 (带排序和筛选)
// @namespace    http://tampermonkey.net/
// @version      1.1.4
// @description  优化 Torn 派系犯罪卡片的显示效果，并增加多级排序、筛选和简化开关
// @author       zmpress [3633431]
// @match        https://www.torn.com/factions.php?step=your*
// @grant        none
// @updateURL    https://raw.githubusercontent.com/zmpress/game_script/refs/heads/main/porn_city/userscript/OCSortAndDisplay.js
// @downloadURL    https://raw.githubusercontent.com/zmpress/game_script/refs/heads/main/porn_city/userscript/OCSortAndDisplay.js
// ==/UserScript==

(function () {
    'use strict';

    // --- 新增：本地存储和开关状态 ---
    const LS_KEY_SIMPLIFY = 'oc_simplify_display';
    const LS_KEY_SHOW_SCORE = 'oc_show_score'; // 工分显示开关
    // 默认值为 'true'。只有当 localStorage 明确存为 'false' 时才为 false。
    const simplifyEnabled = localStorage.getItem(LS_KEY_SIMPLIFY) !== 'false';
    const showScoreEnabled = localStorage.getItem(LS_KEY_SHOW_SCORE) !== 'false'; // 默认显示工分

    // 原有的功能开关（保留，以防你需要手动关闭）
    const isShowInfluence = true;
    const isShowOverlay = true;
    // --- 结束 ---

    // === daguofan 系数表集成 ===
    const XISHU_REMOTE_URL = "https://tornweb.tysnode.uk/xishu.json";
    const XISHU_CACHE_KEY = "dgf-xishu-cache-v1";
    const XISHU_CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24小时
    let XISHU_TABLE = {};

    function isValidXishuTable(obj) {
        return obj && typeof obj === "object" && !Array.isArray(obj);
    }

    function loadXishuCache() {
        try {
            const raw = localStorage.getItem(XISHU_CACHE_KEY);
            if (!raw) return null;
            const parsed = JSON.parse(raw);
            const ts = Number(parsed?.ts || 0);
            const data = parsed?.data;
            if (!ts || !isValidXishuTable(data)) return null;
            if (Date.now() - ts > XISHU_CACHE_TTL_MS) return null;
            return data;
        } catch (e) {
            console.error("[OCSort] load xishu cache failed:", e);
            return null;
        }
    }

    function saveXishuCache(data) {
        try {
            localStorage.setItem(XISHU_CACHE_KEY, JSON.stringify({ ts: Date.now(), data }));
        } catch (e) {
            console.error("[OCSort] save xishu cache failed:", e);
        }
    }

    async function fetchXishuTable() {
        // 先加载缓存
        const cached = loadXishuCache();
        if (cached) XISHU_TABLE = cached;

        // 再尝试远程获取
        try {
            const response = await fetch(XISHU_REMOTE_URL, { cache: 'no-cache' });
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            const data = await response.json();
            if (!isValidXishuTable(data)) throw new Error("invalid xishu json shape");
            XISHU_TABLE = data;
            saveXishuCache(data);
        } catch (e) {
            console.warn("[OCSort] fetch xishu failed, using cache/fallback:", e);
        }
    }

    function normalizeOcName(name) {
        return String(name ?? "")
            .replace(/\u00A0/g, " ")
            .replace(/\s+/g, " ")
            .trim();
    }

    function normalizeRole(role) {
        return String(role ?? "").replace(/\s+/g, "").trim();
    }

    function parseIntSafe(v) {
        const m = String(v ?? "").match(/-?\d+/);
        return m ? Number.parseInt(m[0], 10) : NaN;
    }

    function parseFloatSafe(v) {
        const m = String(v ?? "").match(/-?\d+(?:\.\d+)?/);
        return m ? Number.parseFloat(m[0]) : NaN;
    }

    function getXishuCoeff(ocName, level, role, chance) {
        const nameKey = normalizeOcName(ocName);
        const roleKey = normalizeRole(role);
        const levelKey = String(level);

        const byOc = XISHU_TABLE[nameKey];
        if (!byOc) return null;
        const byLevel = byOc[levelKey];
        if (!byLevel) return null;
        const ranges = byLevel[roleKey];
        if (!Array.isArray(ranges) || ranges.length === 0) return null;

        for (const r of ranges) {
            if (!Array.isArray(r) || r.length < 3) continue;
            const min = parseFloatSafe(r[0]);
            const max = parseFloatSafe(r[1]);
            const a = parseFloatSafe(r[2]);
            if (!Number.isFinite(min) || !Number.isFinite(max) || !Number.isFinite(a)) continue;
            if (chance >= min && chance <= max) return a;
        }
        return null;
    }

    function hasClassPrefix(el, prefix) {
        if (!el || !el.classList) return false;
        const p = `${prefix}___`;
        for (const c of el.classList) {
            if (c.startsWith(p)) return true;
        }
        return false;
    }

    function getXishuMatchResult(ocName, level, role, chance) {
        const nameKey = normalizeOcName(ocName);
        const roleKey = normalizeRole(role);
        const levelKey = String(level);

        const byOc = XISHU_TABLE[nameKey];
        if (!byOc) return { a: null, reason: "missing_oc" };
        const byLevel = byOc[levelKey];
        if (!byLevel) return { a: null, reason: "missing_level" };
        const ranges = byLevel[roleKey];
        if (!Array.isArray(ranges) || ranges.length === 0) return { a: null, reason: "missing_role" };

        let minAll = Infinity;
        let maxAll = -Infinity;
        for (const r of ranges) {
            if (!Array.isArray(r) || r.length < 3) continue;
            const min = parseFloatSafe(r[0]);
            const max = parseFloatSafe(r[1]);
            if (Number.isFinite(min)) minAll = Math.min(minAll, min);
            if (Number.isFinite(max)) maxAll = Math.max(maxAll, max);
        }

        const a = getXishuCoeff(nameKey, levelKey, roleKey, chance);
        if (Number.isFinite(a)) return { a, reason: "ok" };

        if (Number.isFinite(minAll) && chance < minAll) return { a: null, reason: "chance_too_low", minAll, maxAll };
        if (Number.isFinite(maxAll) && chance > maxAll) return { a: null, reason: "chance_too_high", minAll, maxAll };
        return { a: null, reason: "no_match", minAll, maxAll };
    }

    function formatProfitValue(value) {
        const s = Number(value).toFixed(3);
        return s.replace(/\.?0+$/, "");
    }

    // 初始化加载系数表
    fetchXishuTable();

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
      /* 新增：专门用来安全隐藏卡片的样式，不破坏 SVG */
      .oc-hidden-card {
        position: absolute !important;
        width: 0 !important;
        height: 0 !important;
        overflow: hidden !important;
        visibility: hidden !important;
        pointer-events: none !important;
        margin: 0 !important;
        padding: 0 !important;
        border: none !important;
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
        <button id="oc-sort-score" class="oc-btn" data-sort-state="none">工分</button>
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
        <button id="oc-toggle-score" class="oc-btn"></button>
      </div>
      <div id="oc-filter-count"></div>
    `;

        listContainer.parentNode.insertBefore(filterBar, listContainer);

        const sortDefaultBtn = filterBar.querySelector('#oc-sort-default');
        const sortLevelBtn = filterBar.querySelector('#oc-sort-level');
        const sortTimeBtn = filterBar.querySelector('#oc-sort-time');
        const sortScoreBtn = filterBar.querySelector('#oc-sort-score'); // 工分排序按钮
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
        
        // --- 工分显示开关逻辑 ---
        const scoreToggleBtn = filterBar.querySelector('#oc-toggle-score');
        if (showScoreEnabled) {
            scoreToggleBtn.textContent = '隐藏总工分';
            scoreToggleBtn.classList.add('active');
        } else {
            scoreToggleBtn.textContent = '展示总工分';
        }
        scoreToggleBtn.addEventListener('click', () => {
            localStorage.setItem(LS_KEY_SHOW_SCORE, !showScoreEnabled);
            location.reload();
        });
        // --- 结束 ---


        // --- 排序逻辑 ---
        function updateSortStates() {
            const levelState = sortLevelBtn.dataset.sortState;
            const timeState = sortTimeBtn.dataset.sortState;
            const scoreState = sortScoreBtn.dataset.sortState; // 工分排序状态

            if (levelState === 'none' && timeState === 'none' && scoreState === 'none') {
                sortDefaultBtn.dataset.sortState = 'active';
                sortDefaultBtn.classList.add('primary-sort');
                sortLevelBtn.classList.remove('primary-sort');
                sortTimeBtn.classList.remove('primary-sort');
                sortScoreBtn.classList.remove('primary-sort');
            } else {
                sortDefaultBtn.dataset.sortState = 'none';
                sortDefaultBtn.classList.remove('primary-sort');

                const levelIsPrimary = sortLevelBtn.classList.contains('primary-sort');
                const timeIsPrimary = sortTimeBtn.classList.contains('primary-sort');
                const scoreIsPrimary = sortScoreBtn.classList.contains('primary-sort');

                if (!levelIsPrimary && !timeIsPrimary && !scoreIsPrimary) {
                    if (levelState !== 'none') {
                        sortLevelBtn.classList.add('primary-sort');
                    } else if (timeState !== 'none') {
                        sortTimeBtn.classList.add('primary-sort');
                    } else if (scoreState !== 'none') {
                        sortScoreBtn.classList.add('primary-sort');
                    }
                } else if (levelIsPrimary && levelState === 'none') {
                    sortLevelBtn.classList.remove('primary-sort');
                    if (timeState !== 'none') {
                        sortTimeBtn.classList.add('primary-sort');
                    } else if (scoreState !== 'none') {
                        sortScoreBtn.classList.add('primary-sort');
                    }
                } else if (timeIsPrimary && timeState === 'none') {
                    sortTimeBtn.classList.remove('primary-sort');
                    if (levelState !== 'none') {
                        sortLevelBtn.classList.add('primary-sort');
                    } else if (scoreState !== 'none') {
                        sortScoreBtn.classList.add('primary-sort');
                    }
                } else if (scoreIsPrimary && scoreState === 'none') {
                    sortScoreBtn.classList.remove('primary-sort');
                    if (levelState !== 'none') {
                        sortLevelBtn.classList.add('primary-sort');
                    } else if (timeState !== 'none') {
                        sortTimeBtn.classList.add('primary-sort');
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
            const btnText = btn.id === 'oc-sort-level' ? '等级' : 
                           btn.id === 'oc-sort-time' ? '完成时间' : '工分';
            btn.textContent = `${btnText} ${nextState === 'asc' ? '⬆' : nextState === 'desc' ? '⬇' : ''}`.trim();

            updateSortStates();
            applyFiltersAndSorting();
        }

        sortLevelBtn.addEventListener('click', () => handleSortClick(sortLevelBtn));
        sortTimeBtn.addEventListener('click', () => handleSortClick(sortTimeBtn));
        sortScoreBtn.addEventListener('click', () => handleSortClick(sortScoreBtn)); // 工分排序

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
            
            sortScoreBtn.dataset.sortState = 'none'; // 重置工分排序
            sortScoreBtn.classList.remove('primary-sort');
            sortScoreBtn.textContent = '工分';

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
        const sortScoreState = filterBar.querySelector('#oc-sort-score').dataset.sortState; // 工分排序状态

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

// 【修改点】：用添加 CSS 类的方式隐藏，而不是 display: none
            if (isVisible) {
                card.classList.remove('oc-hidden-card');
                visibleCards.push(card);
            } else {
                card.classList.add('oc-hidden-card');
            }
        });

        if (sortDefaultState === 'active') {
            visibleCards.sort((a, b) => {
                const indexA = parseInt(a.dataset.ocOriginalIndex || '0');
                const indexB = parseInt(b.dataset.ocOriginalIndex || '0');
                return indexA - indexB;
            });
        } else {
            const primarySortBtn = filterBar.querySelector('#oc-sort-level.primary-sort, #oc-sort-time.primary-sort, #oc-sort-score.primary-sort');
            const primarySort = primarySortBtn ? (
                primarySortBtn.id === 'oc-sort-level' ? 'level' : 
                primarySortBtn.id === 'oc-sort-time' ? 'time' : 'score'
            ) : 'none';

            visibleCards.sort((a, b) => {
                const levelA = parseInt(a.dataset.ocLevel || '0');
                const levelB = parseInt(b.dataset.ocLevel || '0');
                const timeA = parseInt(a.dataset.ocTime || Number.MAX_SAFE_INTEGER);
                const timeB = parseInt(b.dataset.ocTime || Number.MAX_SAFE_INTEGER);
                const scoreA = parseFloat(a.dataset.ocMaxScore || '-1');
                const scoreB = parseFloat(b.dataset.ocMaxScore || '-1');

                let primaryCompare = 0;
                let secondaryCompare = 0;

                if (primarySort === 'level') {
                    if (sortLevelState !== 'none') {
                        primaryCompare = (sortLevelState === 'asc' ? levelA - levelB : levelB - levelA);
                    }
                    if (sortTimeState !== 'none') {
                        secondaryCompare = (sortTimeState === 'asc' ? timeA - timeB : timeB - timeA);
                    } else if (sortScoreState !== 'none') {
                        secondaryCompare = (sortScoreState === 'asc' ? scoreA - scoreB : scoreB - scoreA);
                    }
                } else if (primarySort === 'time') {
                    if (sortTimeState !== 'none') {
                        primaryCompare = (sortTimeState === 'asc' ? timeA - timeB : timeB - timeA);
                    }
                    if (sortLevelState !== 'none') {
                        secondaryCompare = (sortLevelState === 'asc' ? levelA - levelB : levelB - levelA);
                    } else if (sortScoreState !== 'none') {
                        secondaryCompare = (sortScoreState === 'asc' ? scoreA - scoreB : scoreB - scoreA);
                    }
                } else if (primarySort === 'score') {
                    if (sortScoreState !== 'none') {
                        primaryCompare = (sortScoreState === 'asc' ? scoreA - scoreB : scoreB - scoreA);
                    }
                    if (sortLevelState !== 'none') {
                        secondaryCompare = (sortLevelState === 'asc' ? levelA - levelB : levelB - levelA);
                    } else if (sortTimeState !== 'none') {
                        secondaryCompare = (sortTimeState === 'asc' ? timeA - timeB : timeB - timeA);
                    }
                }
                return primaryCompare !== 0 ? primaryCompare : secondaryCompare;
            });
        }

        visibleCards.forEach(card => parent.appendChild(card));

        const countEl = filterBar.querySelector('#oc-filter-count');
        countEl.textContent = `(${visibleCards.length}/${allCards.length})`;
    }

    // --- 全局计算最高分（用于颜色分级）---
    function calculateGlobalMaxScore() {
        const allCards = document.querySelectorAll('[data-oc-id]');
        let globalMaxScore = 0;
        
        allCards.forEach(card => {
            const notOpening = card.querySelector('[class*="notOpening___"]');
            if (!notOpening) return;
            
            const titleEl = card.querySelector('[class*="panelTitle___"]');
            const crimeName = titleEl ? titleEl.textContent.trim() : 'Unknown';
            const levelVal = card.querySelector('span[class^="levelValue"]');
            const crimeLevel = levelVal ? parseIntSafe(levelVal.textContent) : NaN;
            
            if (!Number.isFinite(crimeLevel)) return;
            
            // 统计空缺岗位数量
            const allSlots = Array.from(notOpening.children);
            let vacantCount = 0;
            allSlots.forEach(child => {
                const isVacant = child.querySelector('[class*="joinButton___"]') || 
                               child.querySelector('[class*="joinContainer___"]') ||
                               hasClassPrefix(child, "waitingJoin");
                if (isVacant) vacantCount++;
            });
            
            if (vacantCount <= 0) return;
            
            // 计算每个空缺岗位的分数
            Array.from(notOpening.children).forEach((child) => {
                const isVacant = child.querySelector('[class*="joinButton___"]') || 
                               child.querySelector('[class*="joinContainer___"]') ||
                               hasClassPrefix(child, "waitingJoin");
                
                if (!isVacant) return;
                
                const jobNameEl = child.querySelector('[class*="title___"]');
                const jobName = jobNameEl ? jobNameEl.textContent.trim() : 'Unknown';
                const chanceEl = child.querySelector('[class*="successChance___"]');
                const chance = chanceEl ? parseIntSafe(chanceEl.textContent) : NaN;
                
                if (Number.isFinite(chance)) {
                    const matchResult = getXishuMatchResult(crimeName, crimeLevel, jobName, chance);
                    if (matchResult.reason === "ok" && Number.isFinite(matchResult.a)) {
                        const totalProfit = matchResult.a * vacantCount;
                        globalMaxScore = Math.max(globalMaxScore, totalProfit);
                    }
                }
            });
        });
        
        return globalMaxScore;
    }

    function parseTornTimeToSeconds(text) {
        const parts = text.split(':').map(Number);
        if (parts.length !== 4) return Number.MAX_SAFE_INTEGER;
        const [dd, hh, mm, ss] = parts;
        return dd * 86400 + hh * 3600 + mm * 60 + ss;
    }

    function applyCornerNumbers(card) {
        const notOpening = card.querySelector('[class*="notOpening___"]');
        if (!notOpening) return;

        const titleEl = card.querySelector('[class*="panelTitle___"]');
        const crimeName = titleEl ? titleEl.textContent.trim() : 'Unknown';

        // 获取 OC 等级
        const levelVal = card.querySelector('span[class^="levelValue"]');
        const crimeLevel = levelVal ? parseIntSafe(levelVal.textContent) : NaN;

        // 统计空缺岗位数量
        const allSlots = Array.from(notOpening.children);
        let vacantCount = 0;
        allSlots.forEach(child => {
            const isVacant = child.querySelector('[class*="joinButton___"]') || 
                           child.querySelector('[class*="joinContainer___"]') ||
                           hasClassPrefix(child, "waitingJoin");
            if (isVacant) vacantCount++;
        });

        notOpening.style.overflow = 'visible';

        // 获取全局最高分
        const globalMaxScore = calculateGlobalMaxScore();
        
        // 计算当前卡片的最大工分（用于排序）
        let cardMaxScore = -1;

        // 应用显示和颜色
        Array.from(notOpening.children).forEach((child) => {
            const isVacant = child.querySelector('[class*="joinButton___"]') || 
                           child.querySelector('[class*="joinContainer___"]') ||
                           hasClassPrefix(child, "waitingJoin");
            
            // 如果不是空缺岗位，则不显示任何东西
            if (!isVacant) {
                child.querySelectorAll('.oc-corner-index').forEach(n => n.remove());
                return;
            }

            const cs = getComputedStyle(child);
            if (cs.position === 'static') child.style.position = 'relative';
            child.style.overflow = 'visible';

            const jobNameEl = child.querySelector('[class*="title___"]');
            const jobName = jobNameEl ? jobNameEl.textContent.trim() : 'Unknown';
            const chanceEl = child.querySelector('[class*="successChance___"]');
            const chance = chanceEl ? parseIntSafe(chanceEl.textContent) : NaN;

            // 使用 daguofan 的系数表计算工分
            let displayValue = '?';
            let bgColor = '#d3d3d3'; // 默认浅灰色背景（问号用）
            let totalProfit = -1;
            
            if (Number.isFinite(crimeLevel) && Number.isFinite(chance)) {
                const matchResult = getXishuMatchResult(crimeName, crimeLevel, jobName, chance);
                
                if (matchResult.reason === "chance_too_low") {
                    // 成功率太低，显示红色 0
                    displayValue = '0';
                    bgColor = '#ff6b6b'; // 红色背景
                } else if (matchResult.reason === "ok" && Number.isFinite(matchResult.a)) {
                    // 正常情况，显示总工分（系数 × 空缺岗位数）
                    totalProfit = matchResult.a * vacantCount;
                    displayValue = formatProfitValue(totalProfit);
                    
                    // 更新卡片最大分数
                    cardMaxScore = Math.max(cardMaxScore, totalProfit);
                    
                    // 根据全局最高分设置颜色
                    if (globalMaxScore > 0 && totalProfit === globalMaxScore) {
                        // 最高分：绿色
                        bgColor = '#51cf66';
                    } else if (globalMaxScore > 0 && totalProfit >= globalMaxScore * 0.8) {
                        // 较高分（>=80%最高分）：黄色
                        bgColor = '#ffe066';
                    } else if (globalMaxScore > 0 && totalProfit >= globalMaxScore * 0.6) {
                        // 中等分数（>=60%最高分）：橙色
                        bgColor = '#ffd43b';
                    } else {
                        // 普通分数：浅灰色
                        bgColor = '#c0c0c0';
                    }
                } else {
                    // 其他情况（未命中系数表等），保持问号，使用更浅的灰色
                    displayValue = '?';
                    bgColor = '#e0e0e0'; // 更浅的灰色背景
                }
            }

            child.querySelectorAll('.oc-corner-index').forEach(n => n.remove());

            // 根据开关决定是否显示工分
            if (showScoreEnabled) {
                const badge = document.createElement('div');
                badge.className = 'oc-corner-index';
                badge.textContent = displayValue;

                Object.assign(badge.style, {
                    position: 'absolute',
                    right: '-6px',
                    bottom: '-6px',
                    zIndex: '5',
                    padding: '2px 6px',
                    lineHeight: '1',
                    fontSize: '12px',
                    fontWeight: '700',
                    color: '#000', // 黑色字体
                    background: bgColor,
                    borderRadius: '999px',
                    boxShadow: `0 0 0 2px ${bgColor}`, // 边框颜色与背景色一致
                    pointerEvents: 'none',
                    userSelect: 'none',
                });
                child.appendChild(badge);
            }
        });
        
        // 保存卡片最大工分到 dataset（用于排序）
        card.dataset.ocMaxScore = cardMaxScore > 0 ? String(cardMaxScore) : '-1';
    }

    // --- ensureOverlay (仅在 simplifyEnabled=true 时运行) ---
    function ensureOverlay(card) {
        const scenario = card.querySelector('[class*="scenario___"]');
        if (!scenario) return;
        if (scenario.querySelector('[data-oc-overlay]')) return;
        if (scenario.querySelector('[class*="success___"]')) return;
        if (scenario.querySelector('[class*="failed___"]')) return;

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
        const titleEl = card.querySelector('[class*="panelTitle___"]');
        const levelVal = card.querySelector('span[class^="levelValue"]');
        const timerSrc = card.querySelector('[class*="phase___"] [class*="title___"]') || card.querySelector('[class*="title___"]');
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
            const o = card.querySelector('[class*="scenario___"]')._ocOverlay;
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
                    const o = card.querySelector('[class*="scenario___"]')._ocOverlay;
                    if (o) o.timerEl.textContent = newTimeText;
                }
            });
            card._ocObserver.observe(timerSrc, { childList: true, characterData: true, subtree: true });

            // 初始设置 overlay 计时器
            if (simplifyEnabled && isShowOverlay) {
                const o = card.querySelector('[class*="scenario___"]')._ocOverlay;
                if (o) o.timerEl.textContent = timerSrc.textContent;
            }
        }
    }

    function getStatus(card) {
        const phase = card.querySelector('[class*="phase___"]');
        if (!phase) return '';
        const icon = phase.querySelector('[class*="iconContainer___"]');
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

            if (simplifyEnabled) {
                // 简化显示模式：先创建 overlay，再更新数据，再加工分
                if (isShowInfluence === true) {
                    applyCornerNumbers(c);
                }
                if (isShowOverlay === true) {
                    ensureOverlay(c);
                }
                updateCardInfo(c);
            } else {
                // 原始显示模式：更新数据 + 显示工分
                updateCardInfo(c);
                if (isShowInfluence === true) {
                    applyCornerNumbers(c);
                }
            }
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