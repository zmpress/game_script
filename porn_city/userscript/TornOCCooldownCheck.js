// ==UserScript==
// @name         Torn OC and Cooldown check
// @namespace    https://raw.githubusercontent.com/zmpress/game_script/refs/heads/main/porn_city/userscript/TornOCCooldownCheck.js
// @version      1.0.0.6
// @description  显示oc，drug，booster，medical剩余时间，并检查refills。在OC页面添加排序和筛选功能，支持移动端。
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
    const REFILL_CACHE_KEY = 'torn_refill_cache';
    const LOCAL_TT_INTEGRATION = 'torn_tt_oc_suppress';

    // 读取 TT 缓存状态 (全局常量)
    const TT_INTEGRATION_CACHED = localStorage.getItem(LOCAL_TT_INTEGRATION) === 'true';

    const CONFIG = {
        // --- 可通过修改 true/false 来控制显示/隐藏 ---
        SHOW_DRUG: true,
        SHOW_MEDICAL: true,
        SHOW_BOOSTER: true,
        SHOW_OC: true,

        // Refills 独立控制
        SHOW_REFILLS: true,
        SHOW_REFILL_ENERGY: true,
        SHOW_REFILL_NERVE: true,
        SHOW_REFILL_TOKEN: true,
        // ------------------------------------------

        cacheDuration: 60, // api查询结果缓存有效期 60 秒 (只用于 Cooldowns/OC)
        redWhenLow: true, // 低于阈值时是否标红 (警告功能保留)
        redThresholdMinutes: 5, // 在低于5分钟的时候标红字体
        showSecondsThresholdMinutes: 5, // 在低于5分钟的时候显示秒

        // 颜色配置
        NIGHT_MODE_COLOR: '#FF4136', // 红色 (作为警告色使用)

        // 时间段定义 (不再用于颜色判断)
        DAY_START_HOUR_BJT: 8,
        DAY_END_HOUR_BJT: 22,
        DEBUG_COLOR_BJT: '#90EE90',
    };

    // ====================================================================
    // 链接配置 (新增)
    // ====================================================================
    const NAVIGATION_LINKS = {
        drug: 'https://www.torn.com/item.php',
        medical: 'https://www.torn.com/factions.php?step=your#/tab=armoury&start=0&sub=medical',
        booster: 'https://www.torn.com/factions.php?step=your#/tab=armoury&start=0&sub=boosters',
        oc: 'https://www.torn.com/factions.php?step=your#/tab=crimes',
        refill: 'https://www.torn.com/page.php?sid=points',
    };
    // ====================================================================


    // --- 样式配置 ---
    const BASE_FONT_SIZE_MOBILE = '11px';
    const PC_FALLBACK_FONT_SIZE = '12px';
    const PC_FALLBACK_LINE_HEIGHT = '1.5';

    let PC_BASE_FONT_SIZE = PC_FALLBACK_FONT_SIZE;
    let PC_BASE_COLOR = 'inherit';
    let PC_BASE_LINE_HEIGHT = PC_FALLBACK_LINE_HEIGHT;
    let PC_STYLE_LOADED = false;

    const PC_LABEL_FONT_WEIGHT = 'bold';
    const PC_VALUE_FONT_WEIGHT = 'normal';

    const DEFAULT_COLOR = 'inherit';

    // Non-TT PC 模式下的紧凑样式配置
    const NON_TT_COMPACT_LINE_HEIGHT = '1.2';
    const NON_TT_COMPACT_MARGIN = '2px 0';

    // 原生 HR 样式缓存
    let NATIVE_HR_STYLE = {};

    // TT 集成模式下，各行内容的 order 值 (负数确保排在最前面)
    const TT_ORDER_MAP = {
        drug: -5,
        medical: -4,
        booster: -3,
        oc: -2,
        refill: -1,
    };
    // ---

    // ====================================================================
    // 实用函数 (保持原样)
    // ====================================================================

    function getTargetStyles() {
        const targetSection = document.getElementById('companyAddictionLevel');
        if (!targetSection) {
            PC_STYLE_LOADED = false;
            return;
        }

        const computedStyle = window.getComputedStyle(targetSection);
        PC_BASE_FONT_SIZE = computedStyle.fontSize || PC_FALLBACK_FONT_SIZE;
        PC_BASE_COLOR = computedStyle.color || PC_BASE_COLOR;
        PC_BASE_LINE_HEIGHT = computedStyle.lineHeight || PC_FALLBACK_LINE_HEIGHT;
        PC_STYLE_LOADED = true;
    }

    /**
     * 嗅探原生 HR 的样式并缓存
     */
    function getNativeHRStyle() {
        const nativeHR = document.querySelector('hr[class*="delimiter"]');
        if (nativeHR) {
            const style = window.getComputedStyle(nativeHR);
            NATIVE_HR_STYLE = {
                borderTop: style.borderTop,
                marginTop: style.marginTop,
                marginBottom: style.marginBottom,
                opacity: style.opacity || '1',
                boxSizing: style.boxSizing || 'content-box'
            };
        } else {
            // Fallback style
            NATIVE_HR_STYLE = {
                borderTop: '1px solid var(--default-delimiter-color, #333)',
                marginTop: '8px',
                marginBottom: '8px',
                opacity: '0.2',
                boxSizing: 'content-box'
            };
        }
    }

    /**
     * 将缓存的原生 HR 样式应用到自定义 HR 元素上
     */
    function applyStyleToHR(hrElement) {
        if (hrElement && NATIVE_HR_STYLE.borderTop) {
            hrElement.style.border = 'none'; // 清除默认 HR border
            hrElement.style.borderTop = NATIVE_HR_STYLE.borderTop;
            hrElement.style.marginTop = NATIVE_HR_STYLE.marginTop;
            hrElement.style.marginBottom = NATIVE_HR_STYLE.marginBottom;
            hrElement.style.opacity = NATIVE_HR_STYLE.opacity;
            hrElement.style.boxSizing = NATIVE_HR_STYLE.boxSizing;
            hrElement.style.height = '0'; // 确保它只是一条线
            hrElement.style.width = '100%';
            hrElement.style.padding = '0';
        }
    }


    function getRefillExpirationTimestamp() {
        const now = Date.now();
        const BJT_OFFSET = 8 * 3600000;
        const BJT_HOUR = 8;

        const utc = now + (new Date().getTimezoneOffset() * 60000);
        let expirationDate = new Date(utc);
        expirationDate.setUTCHours(BJT_HOUR - 8);
        expirationDate.setUTCMinutes(0);
        expirationDate.setUTCSeconds(0);
        expirationDate.setUTCMilliseconds(0);

        let expirationTimestamp = expirationDate.getTime() + BJT_OFFSET;

        if (now >= expirationTimestamp) {
            return expirationTimestamp + 86400000;
        } else {
            return expirationTimestamp;
        }
    }


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

    /**
     * 格式化时间值的 HTML。
     */
    function formatTimeHtml(formattedText, isMobile) {
        let timeHtml = '';
        const parts = formattedText.match(/(\d+[hms])/g) || [];

        const valueWeight = isMobile ? 'normal' : PC_VALUE_FONT_WEIGHT;

        parts.forEach((part, index) => {
            const match = part.match(/(\d+)([hms])/);

            if (match) {
                const value = match[1];
                const unit = match[2];

                timeHtml += `<span>`;
                timeHtml += `<span style="font-weight: ${valueWeight};">${value}</span>`;
                timeHtml += `<span>${unit}</span>`;
                timeHtml += `</span>`;

                if (index < parts.length - 1) {
                    timeHtml += ' ';
                }
            }
        });

        if (formattedText === '0s') {
            timeHtml = `<span style="font-weight: ${valueWeight};">0s</span>`;
        }

        // 返回包含时间值的span，用于后续的颜色控制
        return timeHtml;
    }

    // ... (API Key UI 和 Cooldown Display 函数保持原样) ...
    // ====================================================================
    // API Key UI (保持原样)
    // ====================================================================

    /**
     * 创建 API Key 输入 UI
     * @param {HTMLElement} placementContainer - The main parent container (e.g., div.cont-gray)
     * @param {boolean} isMobile - Whether in mobile mode
     * @param {boolean} ttIntegration - Whether TT is integrated
     * @param {HTMLElement | null} customInsertionPoint - The element to insert *after* (Non-TT PC mode) or *before* (TT mode)
     */
    function createInputUI(placementContainer, isMobile, ttIntegration, customInsertionPoint = null) {
        if (!placementContainer) return;
        if (document.getElementById('tm-extra-input-wrap')) return;

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
        applyStyleToHR(hrBelow);

        // --- 核心逻辑：确保 TT 和 Non-TT 模式下的正确插入位置 ---
        if (ttIntegration && customInsertionPoint) {
            // TT 模式：在 TT 侧边栏容器 (customInsertionPoint) 的上方插入
            placementContainer.insertBefore(hrBelow, customInsertionPoint);
            placementContainer.insertBefore(wrap, hrBelow);
        } else if (!isMobile) {
            // PC Non-TT: 插入到 Energy Bar 容器下方
            if (customInsertionPoint) {
                customInsertionPoint.insertAdjacentElement('afterend', wrap);
                wrap.insertAdjacentElement('afterend', hrBelow); // HR goes below the input box
            } else {
                // PC Fallback: 插入到顶部
                placementContainer.insertBefore(hrBelow, placementContainer.firstChild);
                placementContainer.insertBefore(wrap, hrBelow);
            }
        } else if (isMobile) {
            // v1.0.4.6: 移动端 API Key 输入框插入到容器底部，与内容对齐
            placementContainer.appendChild(hrBelow);
            placementContainer.appendChild(wrap);
        }
    }

    // ====================================================================
    // 核心显示函数 (保持原样)
    // ====================================================================

    /**
     * 在 TT 或 Non-TT 模式下创建或获取单个 <section> 元素
     */
    function getOrCreateSection(container, key, label, isEnabled, ttIntegration, isMobile) {
        const id = `tm-cd-${key}`;
        let section = document.getElementById(id);
        const linkTarget = NAVIGATION_LINKS[key] || '#'; // 获取链接目标

        if (isEnabled) {
            // 检查元素是否存在且父级是否正确
            if (section) {
                // 如果父级不正确，则移除并重建
                if (section.parentElement !== container) {
                    section.remove();
                    section = null;
                } else {
                    // 如果存在且父级正确，直接返回
                    section.style.display = ttIntegration ? 'flex' : (isMobile ? 'flex' : 'block');
                    return section;
                }
            }

            // 创建新的 section
            section = document.createElement('section');
            section.id = id;

            // 默认字体大小
            let finalFontSize = isMobile ? BASE_FONT_SIZE_MOBILE : (PC_STYLE_LOADED ? PC_BASE_FONT_SIZE : PC_FALLBACK_FONT_SIZE);
            section.style.fontSize = finalFontSize;

            const labelWeight = isMobile ? 'bold' : PC_LABEL_FONT_WEIGHT;

            // --- 关键修改：统一使用 <a> 标签作为标题链接 ---
            const titleLink = document.createElement('a');
            titleLink.classList.add('title');
            titleLink.href = linkTarget;
            titleLink.style.textDecoration = 'none'; // 确保链接没有下划线
            titleLink.style.color = 'inherit'; // 继承颜色

            // v1.0.4.4: Suppress 'Refill:' label on mobile
            if (isMobile && key === 'refill') {
                titleLink.textContent = '';
            } else {
                titleLink.textContent = `${label}: `;
            }
            titleLink.style.fontWeight = labelWeight;
            section.appendChild(titleLink);
            // --- 结束关键修改 ---


            if (ttIntegration) {
                section.style.order = TT_ORDER_MAP[key];
                section.style.display = 'flex';
                section.style.lineHeight = PC_BASE_LINE_HEIGHT; // TT 使用继承或基础行高
            } else {
                // Non-TT 模式：应用样式
                section.style.display = isMobile ? 'flex' : 'block'; // Mobile section is flex

                // v1.0.4.3: 移动端更紧凑的间距和垂直居中
                if (isMobile) {
                    section.style.margin = '0';
                    section.style.lineHeight = '1.0';
                    section.style.alignItems = 'center'; // 垂直居中
                } else {
                    section.style.margin = NON_TT_COMPACT_MARGIN;
                    section.style.lineHeight = NON_TT_COMPACT_LINE_HEIGHT;
                }
            }

            container.appendChild(section);

        } else {
            // 如果功能关闭，则隐藏元素
            if (section) section.style.display = 'none';
        }

        return section;
    }

    /**
     * 渲染和管理所有计时器
     */
    function createTimeDisplay(container, cooldowns, ocTime, refills, pcInsertionPoint = null, ttIntegration = false) {
        const isMobile = !!document.querySelector('[class*="user-information-mobile"]');
        let timerElement = null;
        let cdDrug, cdMedical, cdBooster, cdOC, cdRefill;
        let sectionContainer = container; // 默认容器

        // --- 1. Non-TT 模式：创建统一的 DIV 容器和 HR ---
        if (!ttIntegration) {
            let wrapper = document.getElementById('tm-cooldown-wrapper');
            let hrTop = document.getElementById('tm-cooldown-hr');

            // 确保在 PC 模式下，HR 分隔符被插入到正确位置 (低于 Energy/Nerve bar)
            if (pcInsertionPoint && !isMobile) {
                if (!hrTop) {
                    hrTop = document.createElement('hr');
                    hrTop.id = 'tm-cooldown-hr';
                    applyStyleToHR(hrTop);
                    pcInsertionPoint.insertAdjacentElement('afterend', hrTop); // 插入到 Energy Bar 容器下方
                }
            }

            // 确保内容 wrapper 存在
            if (!wrapper) {
                wrapper = document.createElement('div');
                wrapper.id = 'tm-cooldown-wrapper';

                if (hrTop) {
                    hrTop.insertAdjacentElement('afterend', wrapper);
                } else {
                    insertElement(container, wrapper); // 移动端或无 energy bar 时的 fallback
                }
            }
            sectionContainer = wrapper; // 所有 sections 都将插入到这个 wrapper 中

            // Non-TT wrapper 样式设置
            wrapper.style.minHeight = 'auto';
            wrapper.style.lineHeight = 'initial';
            wrapper.style.color = PC_BASE_COLOR;

            if (isMobile) {
                // v1.0.4.7: 最小化垂直间距到 0px
                wrapper.style.display = 'flex';
                wrapper.style.flexDirection = 'row';
                wrapper.style.flexWrap = 'wrap';
                wrapper.style.gap = '0px 10px'; // 减小垂直间距至 0px (垂直 0px)
                wrapper.style.alignItems = 'center'; // 垂直居中

                // 优化：将垂直 padding 强制设为 0，进一步压缩上下间距
                wrapper.style.padding = '0 10px'; // 保持水平 10px 填充，垂直 0px
            } else {
                wrapper.style.padding = '0';
            }
        }

        // --- 2. 创建所有 Sections (TT 和 Non-TT 统一) ---

        // Drug
        cdDrug = getOrCreateSection(sectionContainer, 'drug', 'Drug', CONFIG.SHOW_DRUG, ttIntegration, isMobile);
        // Medical (使用 Med 简写)
        cdMedical = getOrCreateSection(sectionContainer, 'medical', 'Med', CONFIG.SHOW_MEDICAL, ttIntegration, isMobile);
        // Booster
        cdBooster = getOrCreateSection(sectionContainer, 'booster', 'Booster', CONFIG.SHOW_BOOSTER, ttIntegration, isMobile);
        // OC (Non-TT 模式下显示 OC)
        const showOC = CONFIG.SHOW_OC && !ttIntegration;
        cdOC = getOrCreateSection(sectionContainer, 'oc', 'OC', showOC, ttIntegration, isMobile);
        // Refill
        const atLeastOneRefillEnabled = CONFIG.SHOW_REFILL_ENERGY || CONFIG.SHOW_REFILL_NERVE || CONFIG.SHOW_REFILL_TOKEN;
        const showRefill = CONFIG.SHOW_REFILLS && atLeastOneRefillEnabled;
        cdRefill = getOrCreateSection(sectionContainer, 'refill', 'Refill', showRefill, ttIntegration, isMobile);

        timerElement = cdDrug || cdMedical || cdBooster || cdOC || cdRefill;


        // --- 3. 停止旧的计时器 ---
        if (timerElement && timerElement._timer) {
            clearInterval(timerElement._timer);
            timerElement._timer = null;
        }

        // --- 4. 内容渲染函数 ---
        const liveCooldowns = cooldowns;
        const liveOcTime = ocTime;
        const liveRefills = refills;


        function render() {
            // 关键稳定性检查
            if (ttIntegration) {
                if (!container.closest('body')) {
                    if (timerElement && timerElement._timer) clearInterval(timerElement._timer);
                    console.log("TT container lost from DOM during render. Stopping timer.");
                    return;
                }
            } else if (!sectionContainer.closest('body')) {
                if (timerElement && timerElement._timer) clearInterval(timerElement._timer);
                console.log("Non-TT wrapper missing, stopping render.");
                return;
            }

            const BASE_COLOR = DEFAULT_COLOR;
            const valueWeight = isMobile ? 'normal' : PC_VALUE_FONT_WEIGHT;

            const renderSection = (section, itemKey, itemLabel, remainingTime, difficulty = null, isRefill = false) => {
                if (!section) return;

                // 移除旧的 value 元素和 position 标签
                section.querySelector('.tm-value')?.remove();
                section.querySelector('.position')?.remove();

                const isOC = itemKey === 'oc';

                let timeHtml = '';
                let finalColor = BASE_COLOR;

                if (isRefill) {
                    // Refill 特殊处理
                    if (liveRefills) {
                        // v1.0.4.6: PC/移动端缩写分离
                        let refillAbbrs = [];
                        if (isMobile) {
                            // 移动端: e, n, t (小写)
                            refillAbbrs = [
                                { key: 'energy', label: 'e', config: CONFIG.SHOW_REFILL_ENERGY },
                                { key: 'nerve', label: 'n', config: CONFIG.SHOW_REFILL_NERVE },
                                { key: 'token', label: 't', config: CONFIG.SHOW_REFILL_TOKEN },
                            ];
                        } else {
                            // PC 端: Energy, Nerve, Token (全称)
                            refillAbbrs = [
                                { key: 'energy', label: 'Energy', config: CONFIG.SHOW_REFILL_ENERGY },
                                { key: 'nerve', label: 'Nerve', config: CONFIG.SHOW_REFILL_NERVE },
                                { key: 'token', label: 'Token', config: CONFIG.SHOW_REFILL_TOKEN },
                            ];
                        }

                        // 过滤出已开启配置且返回 false (已使用/已消耗) 的 Refill 缩写
                        const usedRefillAbbreviations = refillAbbrs
                            .filter(item => item.config && liveRefills[item.key] === false)
                            .map(item => item.label);

                        // 确定显示文本 (v1.0.4.7: "可用" 改为 "已使用")
                        // 修正： Torn API 返回 true 为可用，false 为已使用/已消耗。
                        // 应当显示已使用的，即 liveRefills[item.key] === false

                        // 如果有任何已使用的，则显示已使用的列表
                        if (usedRefillAbbreviations.length > 0) {
                            timeHtml = `<span style="font-weight: ${valueWeight};">${usedRefillAbbreviations.join(', ')}</span>`;
                        } else {
                            // 检查所有已启用的 Refill 是否都可用
                            const allAvailable = refillAbbrs
                                .filter(item => item.config)
                                .every(item => liveRefills[item.key] === true);

                            // v1.0.4.7: 移动端如果所有启用的 refill 都可用，则隐藏整行内容
                            if (isMobile && allAvailable) {
                                section.style.display = 'none';
                                return;
                            }
                            // 否则，如果启用了 Refill，且不在隐藏状态，则显示“可用”
                            timeHtml = `<span style="font-weight: ${valueWeight};">可用</span>`;
                        }

                        // 确保 section 可见（如果它不是因为上面条件而隐藏）
                        section.style.display = isMobile ? 'flex' : (ttIntegration ? 'flex' : 'block');

                    }
                } else if (remainingTime !== null) {
                    const formattedText = formatTime(remainingTime);
                    const redOverride = CONFIG.redWhenLow && remainingTime >= 0 && remainingTime < CONFIG.redThresholdMinutes * 60;
                    finalColor = redOverride ? CONFIG.NIGHT_MODE_COLOR : BASE_COLOR;

                    timeHtml = formatTimeHtml(formattedText, isMobile);
                } else {
                    timeHtml = `<span style="font-weight: ${valueWeight};"></span>`;
                }

                // 创建新的 value 元素
                const valueSpan = document.createElement('span');
                valueSpan.classList.add('tm-value');
                valueSpan.style.color = finalColor;
                valueSpan.innerHTML = timeHtml;
                section.appendChild(valueSpan);

                // OC 特有的难度标签
                if (isOC && difficulty) {
                    let posSpan = document.createElement('span');
                    posSpan.classList.add('position');
                    posSpan.textContent = ` (Lvl ${difficulty})`;
                    section.appendChild(posSpan);
                }
            };

            // --- Sections 渲染 ---

            // Drug/Medical/Booster
            [
                { key: 'drug', label: 'Drug', section: cdDrug, config: CONFIG.SHOW_DRUG },
                { key: 'medical', label: 'Med', section: cdMedical, config: CONFIG.SHOW_MEDICAL }, // Med 简写
                { key: 'booster', label: 'Booster', section: cdBooster, config: CONFIG.SHOW_BOOSTER },
            ].forEach(item => {
                if (!item.config || !item.section) return;
                let remaining = liveCooldowns ? Math.max(liveCooldowns[item.key] - 1, 0) : null;
                renderSection(item.section, item.key, item.label, remaining);
                if (liveCooldowns?._fetched || liveCooldowns?._initial_timestamp) {
                    liveCooldowns[item.key] = Math.max(liveCooldowns[item.key] - 1, 0);
                }
            });

            // OC
            if (cdOC) {
                let remaining = liveOcTime ? liveOcTime.value : null;
                renderSection(cdOC, 'oc', 'OC', remaining, liveOcTime ? liveOcTime.difficulty : null);
                if (liveOcTime?._fetched || liveOcTime?._initial_timestamp) {
                    liveOcTime.value = Math.max(remaining - 1, 0);
                }
            }

            // Refill
            if (cdRefill) {
                renderSection(cdRefill, 'refill', 'Refill', null, null, true);
            }

            // 提示信息（如果有 Key 但所有内容都关闭）
            if (sectionContainer && sectionContainer.id === 'tm-cooldown-wrapper') {
                // 检查可见的 sections 数量（style 不包含 display: none）
                const enabledSections = sectionContainer.querySelectorAll('section').length;
                const hiddenSections = sectionContainer.querySelectorAll('section[style*="display: none"]').length;
                const hasEnabledContent = (enabledSections - hiddenSections) > 0;

                const infoSpan = document.getElementById('tm-info-span');

                if (!hasEnabledContent) {
                    if (!infoSpan) {
                        const newInfoSpan = document.createElement('span');
                        newInfoSpan.id = 'tm-info-span';
                        // 移动端不显示，因为它在 mobile 模式下与 bar-wrap 在同一级
                        if (!isMobile) {
                            newInfoSpan.textContent = '所有已启用的倒计时目前均已隐藏。请检查脚本顶部的配置。';
                            newInfoSpan.style.color = '#777';
                            newInfoSpan.style.display = 'block';
                            sectionContainer.appendChild(newInfoSpan);
                        }
                    }
                } else if (infoSpan) {
                    infoSpan.remove();
                }
            }
        }

        render();
        // 只有当有未加载的数据时，才开启计时器
        const hasNullData = liveCooldowns === null || (CONFIG.SHOW_OC && liveOcTime === null && !ttIntegration) || (CONFIG.SHOW_REFILLS && liveRefills === null);
        if (timerElement && (hasNullData || liveCooldowns)) {
            // 使用 timerElement 存储计时器，以方便在 render 内部进行清除
            timerElement._timer = setInterval(render, 1000);
        }
    }


    // ====================================================================
    // OC 排序和筛选功能 (已添加等级 10、全部按钮和互斥逻辑)
    // ====================================================================

    /**
     * 将时间字符串 "HH:MM:SS:mm" 转换为总秒数
     * @param {string} timeStr - 格式为 "HH:MM:SS:mm" 的时间字符串
     * @returns {number} 总秒数
     */
    function timeToSeconds(timeStr) {
        if (!timeStr) return 0;
        // TT 时间格式: HH:MM:SS:mm (4 parts)
        const parts = timeStr.split(':').map(p => parseInt(p.trim(), 10));
        if (parts.length < 4) return 0;
        const [h, m, s, ms] = parts;
        return h * 3600 + m * 60 + s + (ms / 100);
    }

    let currentSort = {
        key: null, // 'level' or 'time'
        direction: 0 // 0: off, 1: ASC (升序), -1: DESC (降序)
    };

    let selectedLevels = new Set();
    const FILTER_ALL_KEY = 'ALL';

    // 基础按钮样式 - 适配移动端
    const baseButtonStyle = `
        background-color: var(--default-element-background, #f2f2f2);
        color: var(--default-font-color, #333);
        border: 1px solid var(--default-element-border, #ccc);
        padding: 3px 6px; /* 移动端更紧凑 */
        margin-right: 5px;
        cursor: pointer;
        border-radius: 4px;
        font-size: 11px; /* 移动端更小 */
        white-space: nowrap;
    `;

    // 选中状态样式
    const activeButtonStyle = `
        background-color: var(--default-red-color, #ff4136);
        color: white;
        border: 1px solid var(--default-red-color, #ff4136);
    `;


    /**
     * 找到 OC 列表容器，兼容 TT 和原生移动端。
     * @returns {HTMLElement | null}
     */
    function findOCListContainer() {
        // 1. TornTools OC v2 列表
        const ttContainer = document.querySelector('.tt-oc2-list');
        if (ttContainer) return ttContainer;

        // 2. 原生/移动端 OC 列表容器（通常在 faction crimes 页面）
        const nativeOcElement = document.querySelector('[class*="oc-processed"]');
        if (nativeOcElement) {
            // 找到最近的、包含所有OC卡片的父级
            let container = nativeOcElement.closest('div[class*="organized-crimes-list"], [class*="list-wrap"]');
            if (container) return container;
        }

        // 3. Fallback: 尝试寻找 faction Crimes 页面主内容区域
        const factionCrimesTab = document.querySelector('#faction-crimes-tab');
        if (factionCrimesTab) {
            const list = factionCrimesTab.querySelector('div[role="list"]'); // 原生列表可能使用的角色
            if (list) return list;
        }

        return null;
    }


    function createOCControlBar(ocListContainer) {
        if (document.getElementById('tm-oc-control-bar')) return;

        const controlBar = document.createElement('div');
        controlBar.id = 'tm-oc-control-bar';
        controlBar.style.cssText = `
            display: flex;
            flex-direction: column; /* 移动端堆叠 */
            justify-content: flex-start;
            align-items: stretch; /* 确保子元素占满宽度 */
            padding: 8px; /* 移动端 padding */
            border-bottom: 1px solid var(--default-delimiter-color, #ccc);
            margin-bottom: 5px;
            background-color: var(--default-background-color, #fff); /* 确保背景色可见 */
            z-index: 10;
            position: sticky; /* 粘性定位 */
            top: 0;
        `;

        // 排序组
        const sortGroup = document.createElement('div');
        sortGroup.style.display = 'flex';
        sortGroup.style.alignItems = 'center';
        sortGroup.style.gap = '5px';
        sortGroup.style.marginBottom = '5px';
        sortGroup.innerHTML = `<span style="font-weight: bold; font-size: 11px;">排序:</span>`;

        // 筛选组容器 (用于 flex 布局和计数显示)
        const filterWrapper = document.createElement('div');
        filterWrapper.style.display = 'flex';
        filterWrapper.style.justifyContent = 'space-between';
        filterWrapper.style.alignItems = 'center';

        // 筛选按钮组
        const filterGroup = document.createElement('div');
        filterGroup.id = 'tm-oc-filter-group';
        filterGroup.style.display = 'flex';
        filterGroup.style.alignItems = 'center';
        filterGroup.style.gap = '5px';
        filterGroup.style.flexWrap = 'wrap';
        filterGroup.innerHTML = `<span style="font-weight: bold; font-size: 11px;">筛选等级:</span>`;

        // 筛选计数显示
        const countDisplay = document.createElement('span');
        countDisplay.id = 'tm-oc-count-display';
        countDisplay.textContent = '0/0';
        countDisplay.style.cssText = `
            font-weight: bold;
            font-size: 12px;
            color: var(--default-link-color, #666);
            padding-right: 5px;
            min-width: 30px; /* 确保空间 */
            text-align: right;
        `;

        filterWrapper.appendChild(filterGroup);
        filterWrapper.appendChild(countDisplay);

        controlBar.appendChild(sortGroup);
        controlBar.appendChild(filterWrapper);

        // 插入到 OC 列表上方
        ocListContainer.parentNode.insertBefore(controlBar, ocListContainer);

        return { sortGroup, filterGroup, countDisplay };
    }

    function createSortButton(group, key, label) {
        const button = document.createElement('button');
        button.textContent = label;
        button.style.cssText = baseButtonStyle;
        button.dataset.key = key;
        button.dataset.direction = 0; // 0: off, 1: ASC, -1: DESC

        group.appendChild(button);
        return button;
    }

    function createFilterButton(group, level) {
        const button = document.createElement('button');
        button.textContent = level;
        button.style.cssText = baseButtonStyle;
        button.dataset.level = level;

        group.appendChild(button);
        return button;
    }

    function updateSortButtonDisplay(button, key, direction) {
        button.dataset.direction = direction;
        button.style.cssText = baseButtonStyle;

        let arrow = '';
        if (direction === -1) {
            arrow = ' ↓'; // 降序 (DESC)
            button.style.cssText += activeButtonStyle;
        } else if (direction === 1) {
            arrow = ' ↑'; // 升序 (ASC)
            button.style.cssText += activeButtonStyle;
        }

        const baseLabel = button.dataset.key === 'level' ? '等级' : '时间';
        button.textContent = baseLabel + arrow;
    }

    /**
     * 更新筛选按钮的选中状态样式
     */
    function updateFilterButtonDisplay(button, isSelected) {
        button.style.cssText = baseButtonStyle;
        if (isSelected) {
            button.style.cssText += activeButtonStyle;
        }
    }


    function applySortAndFilter(countDisplayElement) {
        // 兼容 TT 和原生选择器
        const ocWrappers = document.querySelectorAll('.tt-oc2-list > div[data-oc-id], [class*="organized-crimes-list"] > div[class*="wrapper___"]');
        const ocListContainer = findOCListContainer();
        if (!ocListContainer) {
            if (countDisplayElement) countDisplayElement.textContent = '0/0';
            return;
        }

        let visibleCount = 0;
        const totalCount = ocWrappers.length;

        // 1. 筛选 (Filter)

        // 如果 selectedLevels 为空 (即没有选中任何等级)，则视同选中了 ALL
        const filterActive = selectedLevels.size > 0;
        const isAllSelected = !filterActive; // ALL 按钮的选中状态

        // 更新 ALL 按钮的状态（如果存在）
        const allBtn = document.querySelector(`#tm-oc-filter-group button[data-level="${FILTER_ALL_KEY}"]`);
        if (allBtn) {
            updateFilterButtonDisplay(allBtn, isAllSelected);
        }

        ocWrappers.forEach(wrapper => {
            // TT/原生 Level 选择器
            const levelSpan = wrapper.querySelector('.levelValue___TE4qC, [class*="level___"] [class*="textLevel___"] [class*="levelValue___"]');

            if (!levelSpan) {
                // 如果没有 Level 信息，默认显示 (只有在 ALL 模式或未筛选时才会计数/显示)
                // 在筛选模式下，没有等级信息的不应该显示
                wrapper.style.display = isAllSelected ? 'block' : 'none';
                if (isAllSelected) visibleCount++;
                return;
            }
            const level = parseInt(levelSpan.textContent.trim(), 10);

            let shouldDisplay = true;

            if (filterActive) {
                let matched = false;
                selectedLevels.forEach(filter => {
                    if (filter === '<=5' && level <= 5) {
                        matched = true;
                    } else if (parseInt(filter, 10) === level) {
                        matched = true;
                    }
                });
                if (!matched) {
                    shouldDisplay = false;
                }
            }

            // 确保不影响 display: none 的 OC (如 TT 的 History/Hidden)
            if (!wrapper.dataset.originalDisplay) {
                // 仅在首次运行时缓存元素的原始 display 属性
                wrapper.dataset.originalDisplay = window.getComputedStyle(wrapper).display;
            }

            // 筛选逻辑应用
            if (shouldDisplay) {
                wrapper.style.display = wrapper.dataset.originalDisplay;
                visibleCount++;
            } else {
                wrapper.style.display = 'none';
            }
        });

        // 3. 更新计数
        if (countDisplayElement) {
            countDisplayElement.textContent = `${visibleCount}/${totalCount}`;
        }


        // 2. 排序 (Sort)
        if (currentSort.direction !== 0) {
            const visibleWrappers = Array.from(ocWrappers).filter(w => w.style.display !== 'none');

            visibleWrappers.sort((a, b) => {
                let valA, valB;

                if (currentSort.key === 'level') {
                    // Level 选择器
                    const levelSpanA = a.querySelector('.levelValue___TE4qC, [class*="level___"] [class*="textLevel___"] [class*="levelValue___"]');
                    const levelSpanB = b.querySelector('.levelValue___TE4qC, [class*="level___"] [class*="textLevel___"] [class*="levelValue___"]');
                    valA = parseInt(levelSpanA?.textContent.trim() || '0', 10);
                    valB = parseInt(levelSpanB?.textContent.trim() || '0', 10);
                } else if (currentSort.key === 'time') {
                    // Time 选择器
                    const timeSpanA = a.querySelector('.title___pB5FU span[aria-hidden="true"]');
                    const timeSpanB = b.querySelector('.title___pB5FU span[aria-hidden="true"]');
                    valA = timeToSeconds(timeSpanA?.textContent.trim());
                    valB = timeToSeconds(timeSpanB?.textContent.trim());
                } else {
                    return 0;
                }

                let comparison = 0;
                if (valA < valB) comparison = -1;
                if (valA > valB) comparison = 1;

                // 1 for ASC (升序), -1 for DESC (降序)
                return comparison * currentSort.direction;
            });

            // 重新插入 DOM
            visibleWrappers.forEach(wrapper => ocListContainer.appendChild(wrapper));
        }
    }


    function initOCSortAndFilter() {
        const ocListContainer = findOCListContainer();
        if (!ocListContainer || document.getElementById('tm-oc-control-bar')) return;

        const { sortGroup, filterGroup, countDisplay } = createOCControlBar(ocListContainer);

        // --- 排序按钮 ---
        const levelBtn = createSortButton(sortGroup, 'level', '等级');
        const timeBtn = createSortButton(sortGroup, 'time', '时间');

        // 默认状态：等级降序
        currentSort = { key: 'level', direction: -1 };
        updateSortButtonDisplay(levelBtn, 'level', -1);
        updateSortButtonDisplay(timeBtn, 'time', 0);

        // 排序点击事件
        const handleSortClick = (e) => {
            const clickedBtn = e.target.closest('button');
            if (!clickedBtn || !clickedBtn.dataset.key) return;

            const key = clickedBtn.dataset.key;
            let currentDir = parseInt(clickedBtn.dataset.direction, 10);

            // 互斥逻辑：先清除另一个按钮的状态
            const otherKey = key === 'level' ? 'time' : 'level';
            const otherBtn = document.querySelector(`#tm-oc-control-bar button[data-key="${otherKey}"]`);
            if (otherBtn) {
                updateSortButtonDisplay(otherBtn, otherKey, 0);
            }

            // 循环状态：降序 -> 升序 -> 未选中
            let newDir;
            if (currentSort.key === key) {
                if (currentDir === -1) { // Current: DESC -> Next: ASC
                    newDir = 1;
                } else if (currentDir === 1) { // Current: ASC -> Next: OFF
                    newDir = 0;
                } else { // Current: OFF (Initial state) -> Next: DESC
                    newDir = -1;
                }
            } else {
                // Clicking a different button defaults to DESC (降序)
                newDir = -1;
            }

            currentSort.key = (newDir !== 0) ? key : null;
            currentSort.direction = newDir;

            // 更新显示
            updateSortButtonDisplay(levelBtn, 'level', currentSort.key === 'level' ? currentSort.direction : 0);
            updateSortButtonDisplay(timeBtn, 'time', currentSort.key === 'time' ? currentSort.direction : 0);

            applySortAndFilter(countDisplay);
        };

        levelBtn.addEventListener('click', handleSortClick);
        timeBtn.addEventListener('click', handleSortClick);

        // --- 筛选按钮 ---

        // 1. 添加 '全部' 按钮
        const allBtn = createFilterButton(filterGroup, '全部');
        allBtn.dataset.level = FILTER_ALL_KEY;

        // 2. 添加等级按钮 (包含 10)
        const filterLevels = ['<=5', '6', '7', '8', '9', '10'];
        const levelButtons = filterLevels.map(level => createFilterButton(filterGroup, level));

        // 3. 筛选点击事件和互斥逻辑
        const filterButtons = [allBtn, ...levelButtons];

        filterButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                const level = btn.dataset.level;

                if (level === FILTER_ALL_KEY) {
                    // 如果点击了 '全部'
                    selectedLevels.clear(); // 清空所有等级选中
                    levelButtons.forEach(lBtn => updateFilterButtonDisplay(lBtn, false));
                } else {
                    // 如果点击了等级按钮

                    // 切换当前等级的状态
                    if (selectedLevels.has(level)) {
                        selectedLevels.delete(level);
                    } else {
                        selectedLevels.add(level);
                    }

                    // 如果有任何等级被选中，则取消 '全部' 的逻辑由 applySortAndFilter 处理（当 selectedLevels.size > 0 时）

                    // 如果所有等级都被取消选中，逻辑也由 applySortAndFilter 处理（selectedLevels.size === 0 时自动视为 ALL）
                }

                // 重新渲染按钮状态和应用筛选
                levelButtons.forEach(lBtn => {
                    const isSelected = selectedLevels.has(lBtn.dataset.level);
                    updateFilterButtonDisplay(lBtn, isSelected);
                });

                applySortAndFilter(countDisplay);
            });
        });

        // 初始状态：默认选中 '全部'（即 selectedLevels.size === 0）
        // applySortAndFilter 会处理 ALL 按钮的选中状态显示。

        // 初始应用排序 (默认等级降序) 和计数
        applySortAndFilter(countDisplay);

        // 增加一个 MutationObserver 来处理 OC 列表的动态加载或刷新
        // 观察整个容器，因为移动端或 TT 可能会替换内容
        const observer = new MutationObserver((mutations) => {
            mutations.forEach(mutation => {
                // 监听子节点变化，这表示 OC 列表内容可能已加载或更换
                if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
                    // 延迟应用，确保所有 OC 卡片及其内容（特别是等级）都已加载
                    setTimeout(() => applySortAndFilter(countDisplay), 100);
                }
            });
        });

        observer.observe(ocListContainer, { childList: true, subtree: true });
    }

    // ====================================================================
    // API / 缓存函数 (保持原样)
    // ====================================================================

    function getCooldownsCacheSync() {
        const defaultCooldowns = null;
        const cacheRaw = localStorage.getItem(CACHE_KEY);
        const now = Date.now();

        if (cacheRaw) {
            try {
                const cache = JSON.parse(cacheRaw);
                const elapsedSeconds = (now - cache._timestamp) / 1000;

                if (cache.data && (typeof cache.data.drug === 'number') && (elapsedSeconds < CONFIG.cacheDuration)) {
                    const correctedCooldowns = {
                        drug: Math.max(cache.data.drug - elapsedSeconds, 0),
                        medical: Math.max(cache.data.medical - elapsedSeconds, 0),
                        booster: Math.max(cache.data.booster - elapsedSeconds, 0),
                        _initial_timestamp: cache._timestamp
                    };
                    return correctedCooldowns;
                }
            } catch (e) {}
        }
        return defaultCooldowns;
    }

    function getOCCacheSync() {
        const defaultOcTime = null;
        const cacheRaw = localStorage.getItem(OC_CACHE_KEY);
        const now = Date.now();

        if (cacheRaw) {
            try {
                const cache = JSON.parse(cacheRaw);
                const elapsedSeconds = (now - cache._timestamp) / 1000;

                if (elapsedSeconds < CONFIG.cacheDuration) {
                    const remainingOC = Math.max(cache.data.value - elapsedSeconds, 0);
                    const cachedOcTime = {
                        value: remainingOC,
                        difficulty: cache.data.difficulty || '?',
                        _initial_timestamp: cache._timestamp
                    };
                    return cachedOcTime;
                }
            } catch (e) {}
        }
        return defaultOcTime;
    }

    function getRefillsCacheSync() {
        const cacheRaw = localStorage.getItem(REFILL_CACHE_KEY);
        const now = Date.now();

        if (cacheRaw) {
            try {
                const cache = JSON.parse(cacheRaw);

                if (cache.data && cache._expiration_timestamp > now) {
                    return {...cache.data};
                }
            } catch (e) {}
        }
        return null;
    }

    function fetchCooldowns(key, callback) {
        const defaultCooldowns = { drug: 0, medical: 0, booster: 0 };

        GM_xmlhttpRequest({
            method: 'GET',
            url: `https://api.torn.com/user/?selections=cooldowns&key=${key}`,
            onload: function(response) {
                try {
                    const data = JSON.parse(response.responseText);
                    if (data.error || !data.cooldowns) {
                        callback(defaultCooldowns);
                        return;
                    }

                    const cooldowns = {
                        drug: Math.max(data.cooldowns.drug || 0, 0),
                        medical: Math.max(data.cooldowns.medical || 0, 0),
                        booster: Math.max(data.cooldowns.booster || 0, 0)
                    };

                    localStorage.setItem(CACHE_KEY, JSON.stringify({ _timestamp: Date.now(), data: cooldowns }));
                    callback({...cooldowns, _fetched: true});
                } catch (e) {
                    callback(defaultCooldowns);
                }
            },
            onerror: function() { callback(defaultCooldowns); }
        });
    }

    function fetchOC(key, callback, ttIntegration) {
        // 仅在 TT 正在运行时才跳过获取 OC
        if (ttIntegration) {
            callback(null);
            return;
        }

        const defaultOcTime = null;

        GM_xmlhttpRequest({
            method: 'GET',
            url: `https://api.torn.com/v2/user/organizedcrime?key=${key}`,
            onload: function(response) {
                try {
                    const data = JSON.parse(response.responseText);
                    const oc = data.organizedCrime;

                    if (data.error || !oc) {
                        callback(defaultOcTime);
                        return;
                    }

                    let emptySlots = oc.slots.filter(s => !s.user).length;
                    let remaining = oc.ready_at - Math.floor(Date.now() / 1000) + emptySlots * 86400;

                    if (remaining < 0) remaining = 0;

                    const difficulty = oc.difficulty || '?';
                    const ocTime = { value: remaining, difficulty: difficulty };

                    localStorage.setItem(OC_CACHE_KEY, JSON.stringify({_timestamp: Date.now(), data: ocTime}));
                    callback({...ocTime, _fetched: true});
                } catch (e) {
                    callback(defaultOcTime);
                }
            },
            onerror: function() { callback(defaultOcTime); }
        });
    }

    function fetchRefills(key, callback) {
        const defaultRefills = null;
        const now = Date.now();

        GM_xmlhttpRequest({
            method: 'GET',
            url: `https://api.torn.com/v2/user/refills?key=${key}`,
            onload: function(response) {
                try {
                    const data = JSON.parse(response.responseText);
                    if (data.error || !data.refills) {
                        callback(defaultRefills);
                        return;
                    }

                    const refills = {
                        energy: data.refills.energy || false,
                        nerve: data.refills.nerve || false,
                        token: data.refills.token || false,
                        special_count: data.refills.special_count || 0
                    };

                    const expirationTimestamp = getRefillExpirationTimestamp();

                    localStorage.setItem(REFILL_CACHE_KEY, JSON.stringify({
                        _timestamp: now,
                        _expiration_timestamp: expirationTimestamp,
                        data: refills
                    }));

                    callback({...refills});
                } catch (e) {
                    callback(defaultRefills);
                }
            },
            onerror: function() { callback(defaultRefills); }
        });
    }

    // ====================================================================
    // 核心启动逻辑
    // ====================================================================
    let ttSidebarObserver = null; // 全局存储 Observer

    function tryInit() {
        // --- 0. Aggressive Cleanup of ALL script elements ---
        document.querySelectorAll('[id^="tm-cd-"], #tm-cooldown-display, #tm-cooldown-wrapper, #tm-cooldown-hr, #tm-extra-input-wrap, .tm-delimiter, #tm-info-span, #tm-oc-control-bar').forEach(el => {
            if (el._timer) clearInterval(el.remove);
            el.remove();
        });
        // ---

        const isMobile = !!document.querySelector('[class*="user-information-mobile"]');
        let container = null;
        let insertionPoint = null; // PC Non-TT 模式下，HR 和内容应该插入的位置
        let ttIntegration = false;
        let ttSidebarElement = null; // TT 模式下的 TT 容器
        let apiInputContainer = null; // API Key 输入框的直接父容器
        let isOCPage = false; // 判断是否为 OC 页面

        // 检查是否在 Faction Crimes 页面
        if (document.location.href.includes('/factions.php?step=your')) {
            const hash = document.location.hash || '#/tab=crimes';
            if (hash.includes('tab=crimes')) {
                isOCPage = true;
            }
        }

        if (isMobile) {
            container = document.querySelector('[class*="user-information-mobile"]');
            apiInputContainer = container;
            getTargetStyles();
            getNativeHRStyle();
        } else {
            const ttContainer = document.querySelector('div.tt-sidebar-information');
            if (ttContainer) {
                // TT 模式
                container = ttContainer;
                apiInputContainer = ttContainer.parentElement; // TT 侧边栏的父级 (用于插入 Key 输入框)
                ttSidebarElement = ttContainer; // TT 侧边栏元素本身 (作为插入点的参考)
                ttIntegration = true;
                localStorage.setItem(LOCAL_TT_INTEGRATION, 'true');
                getTargetStyles();
                getNativeHRStyle();

                // --- 稳定增强: 监控 TT 容器的父级 ---
                const ttParent = container.parentElement;
                if (ttParent && !ttParent._tm_observer) {
                    if (ttSidebarObserver) ttSidebarObserver.disconnect();

                    ttSidebarObserver = new MutationObserver((mutationsList, observer) => {
                        if (!document.querySelector('div.tt-sidebar-information')) {
                            console.log("TornTools sidebar container removed. Restarting script.");
                            observer.disconnect();
                            ttSidebarObserver = null;
                            tryInit();
                        }
                    });
                    ttSidebarObserver.observe(ttParent, { childList: true });
                    ttParent._tm_observer = ttSidebarObserver;
                }
                // ---
            } else {
                // Non-TT 模式 (PC)
                if (localStorage.getItem(LOCAL_TT_INTEGRATION)) {
                    localStorage.removeItem(LOCAL_TT_INTEGRATION);
                }

                const mainSidebarContainer = document.querySelector('div.cont-gray');
                const energyBar = document.querySelector('a.bar-desktop___p5Cas.energy___hsTnO');

                if (mainSidebarContainer) {
                    // 主侧边栏容器 (用于定位输入框)
                    apiInputContainer = mainSidebarContainer;

                    // 倒计时内容的直接父容器 (使用 mainSidebarContainer 确保兼容性)
                    container = mainSidebarContainer;

                    // HR 和内容插入点 (Energy Bar 所在的 div)
                    if (energyBar) {
                        insertionPoint = energyBar.closest('div'); // div.bar-wrap
                    }
                    getTargetStyles();
                    getNativeHRStyle();
                } else {
                    // Fallback
                    const ul = findStatusIcons();
                    if (ul) container = ul.closest('div');
                    apiInputContainer = container;
                    getTargetStyles();
                    getNativeHRStyle();
                }
            }
        }

        if (!container) return false;

        // --- OC 排序和筛选功能初始化 ---
        if (isOCPage) {
            // 延迟执行，确保 OC 列表 DOM 完全加载
            setTimeout(initOCSortAndFilter, 1500);
        }

        const savedKey = localStorage.getItem(LOCAL_KEY);

        if (!savedKey) {
            // 在 Non-TT PC 模式下，使用 insertionPoint (能量条容器) 作为 customInsertionPoint，以放置在正确位置
            const customInsertionPoint = ttIntegration ? ttSidebarElement : insertionPoint;

            // placementContainer 仍然使用 apiInputContainer
            createInputUI(apiInputContainer, isMobile, ttIntegration, customInsertionPoint);
        } else {
            // 1. 同步读取缓存数据
            const cachedCooldowns = getCooldownsCacheSync();
            const cachedOcTime = getOCCacheSync();
            const cachedRefills = getRefillsCacheSync();

            // 第一次调用：使用缓存数据进行渲染，避免延迟闪烁
            createTimeDisplay(container, cachedCooldowns, cachedOcTime, cachedRefills, insertionPoint, ttIntegration);

            // 2. 异步获取最新数据
            fetchCooldowns(savedKey, (cooldowns) => {
                // 更新后，使用最新的 cooldowns 和缓存的 oc/refills 重新渲染
                createTimeDisplay(container, cooldowns, cachedOcTime, cachedRefills, insertionPoint, ttIntegration);

                // 3. 延迟获取 OC 和 Refill 数据，确保主屏不阻塞
                const fetchOptionalDataAndRender = () => {
                    const currentTtIntegration = !!document.querySelector('div.tt-sidebar-information');

                    fetchOC(savedKey, (ocTime) => {
                        fetchRefills(savedKey, (refills) => {
                            // 最后一次调用：所有数据加载完毕
                            createTimeDisplay(container, cooldowns, ocTime, refills, insertionPoint, currentTtIntegration);
                        }, currentTtIntegration);
                    }, currentTtIntegration);
                };

                setTimeout(fetchOptionalDataAndRender, 500);
            });
        }

        return true;
    }

    // 使用 MutationObserver 等待页面加载
    if (!tryInit()) {
        const obs = new MutationObserver(() => {
            // 等待主要元素加载完成后再执行初始化
            if (document.querySelector('div.user-information') || document.querySelector('[class*="user-information-mobile"]') || findOCListContainer()) {
                if (tryInit()) obs.disconnect();
            }
        });
        obs.observe(document.documentElement, { childList: true, subtree: true });
    }
})();