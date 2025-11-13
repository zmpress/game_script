// ==UserScript==
// @name         Torn OC and Cooldown check
// @namespace
// @version      1.0.0.9
// @description  显示oc，drug，booster，medical剩余时间，并检查refills。
// @author       zmpress
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

    // 读取 TT 缓存状态
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
        SHOW_REFILL_TOKEN: false,
        // ------------------------------------------

        // BJT 夜间模式 (22:00 - 08:00) 标红 (仅 Refill)
        BJT_NIGHT_MODE_WARNING: true,

        cacheDuration: 60, // api查询结果缓存有效期 60 秒 (只用于 Cooldowns/OC)
        redWhenLow: true, // 低于阈值时是否标红 (警告功能保留)

        // 在低于X分钟的时候标红字体 (独立配置)
        RED_THRESHOLDS_MINUTES: {
            drug: 5,
            medical: 5,
            booster: 5,
            oc: 5,
        },

        showSecondsThresholdMinutes: 5, // 在低于5分钟的时候显示秒

        // 颜色配置
        NIGHT_MODE_COLOR: '#FF4136', // 红色 (作为警告色使用)

        // 时间段定义
        DAY_START_HOUR_BJT: 8,
        DAY_END_HOUR_BJT: 22,
        DEBUG_COLOR_BJT: '#90EE90',
    };

    // ====================================================================
    // 链接配置
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

    // TT 集成模式下，各行内容的 order 值
    const TT_ORDER_MAP = {
        drug: -5,
        medical: -4,
        booster: -3,
        oc: -2,
        refill: -1,
    };
    // ---

    // ====================================================================
    // 实用函数
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

    /**
     * 计算 Refill 在北京时间 8:00 UTC+8 刷新的时间戳
     */
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
            return expirationTimestamp + 86400000; // 超过则设置为下一天的 8:00 BJT
        } else {
            return expirationTimestamp;
        }
    }

    // BJT 夜间模式检查
    function isBjtNightTime() {
        const BJT_OFFSET = 8 * 60; // UTC+8
        const now = new Date();
        const localOffset = -now.getTimezoneOffset(); // 本地时区偏移
        const bjtDate = new Date(now.getTime() + (BJT_OFFSET - localOffset) * 60000);

        const hour = bjtDate.getHours();

        // 22:00 (含) 到 07:59 (含)
        return hour >= CONFIG.DAY_END_HOUR_BJT || hour < CONFIG.DAY_START_HOUR_BJT;
    }


    function formatTime(totalSeconds) {
        let s = Math.floor(totalSeconds);
        if (s <= 0) return '0s';

        const showSecondsThreshold = CONFIG.showSecondsThresholdMinutes * 60;
        // 检查是否应该显示秒
        const shouldShowSeconds = (s <= showSecondsThreshold);

        // 1. 计算所有单位
        const d = Math.floor(s / 86400); // 天
        s %= 86400;
        const h = Math.floor(s / 3600); // 小时
        s %= 3600;
        const m = Math.floor(s / 60); // 分钟
        const s_rem = s % 60; // 剩余秒

        let parts = [];
        const formatPart = (value, unit) => `${value}${unit}`;

        // 2. 仅在值 > 0 时添加 d, h, m
        if (d > 0) {
            parts.push(formatPart(d, 'd'));
        }
        if (h > 0) {
            parts.push(formatPart(h, 'h'));
        }
        if (m > 0) {
            parts.push(formatPart(m, 'm'));
        }

        // 3. 仅在 (需要显示秒 且 s_rem > 0) 时添加秒
        if (shouldShowSeconds && s_rem > 0) {
            parts.push(formatPart(s_rem, 's'));
        }

        // 4. 处理边缘情况
        if (parts.length === 0) {
            // 这意味着 d=0, h=0, m=0

            if (shouldShowSeconds) {
                // 如果秒 > 0，它本应在上面被添加。
                // 如果 s_rem 也是 0，那么总时间就是 0，我们已经在顶部返回了 '0s'。
                // 所以，如果 `parts` 为空，s_rem 必定 > 0。
                parts.push(formatPart(s_rem, 's'));
            } else {
                // (例如，时间是 40s，但阈值是 0，不显示秒)
                // d=0, h=0, m=0，且我们不显示秒。
                // 这种情况下，我们显示 0m。
                parts.push(formatPart(0, 'm'));
            }
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
        const parts = formattedText.match(/(\d+[dhms])/g) || [];

        const valueWeight = isMobile ? 'normal' : PC_VALUE_FONT_WEIGHT;

        parts.forEach((part, index) => {
            const match = part.match(/(\d+)([dhms])/);

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

        if (formattedText === '0s' || formattedText === '0m') {
            const unit = formattedText.endsWith('m') ? 'm' : 's';
            timeHtml = `<span style="font-weight: ${valueWeight};">0${unit}</span>`;
        }

        // 返回包含时间值的span，用于后续的颜色控制
        return timeHtml;
    }

    // ====================================================================
    // API Key UI
    // ====================================================================

    /**
     * 创建 API Key 输入 UI
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
            // 移动端 API Key 输入框插入到容器底部，与内容对齐
            placementContainer.appendChild(hrBelow);
            placementContainer.appendChild(wrap);
        }
    }

    // ====================================================================
    // 核心显示函数
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

            // ** 注意：标签文本现在在 renderSection 中动态设置 **
            // 我们在这里设置一个“默认值”，在 renderSection 中会被覆盖
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

                // 移动端更紧凑的间距和垂直居中
                if (isMobile) {
                    section.style.margin = '0';
                    section.style.lineHeight = '1.0'; // 保持 1.0，确保字体不被裁剪
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
                    // 移动端 Fallback
                    container.appendChild(wrapper);
                }
            }
            sectionContainer = wrapper; // 所有 sections 都将插入到这个 wrapper 中

            // Non-TT wrapper 样式设置
            wrapper.style.minHeight = 'auto';
            wrapper.style.lineHeight = 'initial';
            wrapper.style.color = PC_BASE_COLOR;

            if (isMobile) {
                // 最小化垂直间距
                wrapper.style.display = 'flex';
                wrapper.style.flexDirection = 'row';
                wrapper.style.flexWrap = 'wrap';
                // 恢复 0px row-gap
                wrapper.style.gap = '0px 10px'; // (row-gap / column-gap)

                // ================================================================
                // *** 核心修改点 (布局) ***
                // ================================================================
                // 恢复 负-margin-top 策略，以“吃掉”上方的空白
                wrapper.style.marginTop = '-8px';
                // 新增 负-margin-bottom 策略，以“吃掉”下方的空白
                wrapper.style.marginBottom = '-8px';
                // ================================================================

                wrapper.style.alignItems = 'center'; // 垂直居中
                wrapper.style.padding = '0 10px'; // 保持水平 10px 填充，垂直 0px
            } else {
                wrapper.style.padding = '0';
                wrapper.style.marginTop = '0'; // 确保 PC 端不受影响
                wrapper.style.marginBottom = '0';
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
            // 关键稳定性检查 (TT 模式检查父级，Non-TT 模式检查 wrapper)
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

            // 检查是否为夜间模式
            const isNight = CONFIG.BJT_NIGHT_MODE_WARNING && isBjtNightTime();

            const renderSection = (section, itemKey, itemLabel, remainingTime, difficulty = null, isRefill = false) => {
                if (!section) return;

                // 1. 找到 titleLink (标签)
                const titleLink = section.querySelector('a.title');

                // 2. 移除旧的 value 元素和 position 标签
                section.querySelector('.tm-value')?.remove();
                section.querySelector('.position')?.remove();

                const isOC = itemKey === 'oc';

                // 3. 动态更新标签文本
                if (titleLink) {
                    if (isMobile && isOC) {
                        // 手机端 OC: 格式为 OC(7):
                        // (remainingTime !== null) 确保只在数据加载后显示 (Lvl)
                        titleLink.textContent = (difficulty && remainingTime !== null) ? `${itemLabel}(${difficulty}): ` : `${itemLabel}: `;
                    } else if (isMobile && itemKey === 'refill') {
                        // 手机端 Refill: 无标签
                        titleLink.textContent = '';
                    } else {
                        // PC 端或其他: 默认 "Label: " 格式
                        titleLink.textContent = `${itemLabel}: `;
                    }
                }

                let timeHtml = '';
                let finalColor = BASE_COLOR;

                // 定义空白占位符 (使用不换行空格 &nbsp; 来撑起高度，防止布局跳动)
                const blankPlaceholder = `<span style="font-weight: ${valueWeight};">&nbsp;</span>`;

                if (isRefill) {
                    // Refill 特殊处理
                    if (liveRefills) { // 数据已加载
                        // PC/移动端缩写分离
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

                        // 如果有任何已使用的，则显示已使用的列表
                        if (usedRefillAbbreviations.length > 0) {
                            timeHtml = `<span style="font-weight: ${valueWeight};">${usedRefillAbbreviations.join(', ')}</span>`;

                            // 夜间标红 *仅* 在 Refill 已使用时应用
                            finalColor = (isNight) ? CONFIG.NIGHT_MODE_COLOR : BASE_COLOR;

                        } else {
                            // 检查所有已启用的 Refill 是否都可用
                            const allAvailable = refillAbbrs
                                .filter(item => item.config)
                                .every(item => liveRefills[item.key] === true);

                            // 移动端如果所有启用的 refill 都可用，则隐藏整行内容
                            if (isMobile && allAvailable) {
                                section.style.display = 'none';
                                return;
                            }
                            // 否则，如果启用了 Refill，且不在隐藏状态，则显示“可用”
                            timeHtml = `<span style="font-weight: ${valueWeight};">可用</span>`;
                            finalColor = BASE_COLOR; // "可用" 状态不标红
                        }

                        // 确保 section 可见（如果它不是因为上面条件而隐藏）
                        section.style.display = isMobile ? 'flex' : (ttIntegration ? 'flex' : 'block');

                    } else { // 数据为 null (正在加载)
                        timeHtml = blankPlaceholder;
                    }
                } else if (remainingTime !== null) { // Cooldowns/OC 数据已加载
                    const formattedText = formatTime(remainingTime);

                    // 1. 使用独立的阈值
                    const threshold = CONFIG.RED_THRESHOLDS_MINUTES[itemKey] || 5; // Fallback to 5
                    const redOverride = CONFIG.redWhenLow && remainingTime >= 0 && remainingTime < threshold * 60;

                    if (redOverride) {
                        // 1. 优先：时间即将耗尽
                        finalColor = CONFIG.NIGHT_MODE_COLOR;
                    } else {
                        // 2. 默认 (移除 isNight 检查)
                        finalColor = BASE_COLOR;
                    }

                    timeHtml = formatTimeHtml(formattedText, isMobile);
                } else { // Cooldowns/OC 数据为 null (正在加载)
                    timeHtml = blankPlaceholder;
                }

                // 4. 创建新的 value 元素
                const valueSpan = document.createElement('span');
                valueSpan.classList.add('tm-value');
                valueSpan.style.color = finalColor;
                valueSpan.innerHTML = timeHtml;
                section.appendChild(valueSpan);

                // 5. OC 特有的难度标签 (仅 PC)
                if (isOC && difficulty && remainingTime !== null) {
                    if (!isMobile) {
                        let posSpan = document.createElement('span');
                        posSpan.classList.add('position');
                        posSpan.textContent = ` (Lvl ${difficulty})`;
                        section.appendChild(posSpan);
                    }
                }
            };


            // --- Sections 渲染 ---

            // Drug/Medical/Booster
            [
                { key: 'drug', label: 'Drug', section: cdDrug, config: CONFIG.SHOW_DRUG },
                // *** 核心修改 ***
                { key: 'medical', label: isMobile ? 'Med' : 'Medical', section: cdMedical, config: CONFIG.SHOW_MEDICAL }, // PC/Mobile 标签分离
                // *** 结束修改 ***
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
                        // 移动端不显示
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
        const hasNullData = liveCooldowns === null || (CONFIG.SHOW_OC && liveOcTime === null && !ttIntegration) || (CONFIG.SHOW_REFILLS === null);
        if (timerElement && (hasNullData || liveCooldowns)) {
            // 使用 timerElement 存储计时器
            timerElement._timer = setInterval(render, 1000);
        }
    }


    // ====================================================================
    // API / 缓存函数 (恢复版本)
    // ====================================================================

    // *** 新增：辅助函数，用于检查缓存是否过期 ***
    function isCacheStale(cacheKey, durationSeconds) {
        const cacheRaw = localStorage.getItem(cacheKey);
        if (!cacheRaw) return true; // 没有缓存 = 过期
        try {
            const cache = JSON.parse(cacheRaw);
            const elapsedSeconds = (Date.now() - cache._timestamp) / 1000;
            return elapsedSeconds >= durationSeconds; // 是否过期？
        } catch (e) {
            return true; // 缓存无效 = 过期
        }
    }

    function getCooldownsCacheSync() {
        const defaultCooldowns = null;
        const cacheRaw = localStorage.getItem(CACHE_KEY);
        const now = Date.now();

        if (cacheRaw) {
            try {
                const cache = JSON.parse(cacheRaw);
                const elapsedSeconds = (now - cache._timestamp) / 1000;

                // (Stale-while-revalidate)
                // *移除* (elapsedSeconds < CONFIG.cacheDuration) 检查
                // 只要有缓存，就返回计算后的值，即使已过期
                if (cache.data && (typeof cache.data.drug === 'number')) {
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

                // (Stale-while-revalidate)
                // *移除* (elapsedSeconds < CONFIG.cacheDuration) 检查
                if (cache.data) { // 只要有数据就返回
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

                // Refill 的缓存逻辑 *自带* 过期时间戳，这已经是 Stale-while-revalidate
                // 所以这里 *不需要* 修改
                if (cache.data && cache._expiration_timestamp > now) {
                    return {...cache.data};
                }
            } catch (e) {}
        }
        return null; // 返回 null 会自动触发 tryInit 中的重新获取
    }

    function fetchCooldowns(key, callback) {
        const defaultCooldowns = { drug: 0, medical: 0, booster: 0 };

        GM_xmlhttpRequest({
            method: 'GET',
            url: `https://api.torn.com/user/?selections=cooldowns&key=${key}`,
            onload: function(response) {
                try {
                    const data = JSON.parse(response.responseText);

                    // (API Key 异常处理)
                    if (data.error && data.error.code === 2) {
                        console.log("Incorrect API Key detected. Clearing key and reloading.");
                        localStorage.removeItem(LOCAL_KEY);
                        location.reload();
                        return; // 停止执行
                    }

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

                    // 也为 OC 添加 Key 错误检查
                    if (data.error && data.error.code === 2) {
                        console.log("Incorrect API Key detected. Clearing key and reloading.");
                        localStorage.removeItem(LOCAL_KEY);
                        location.reload();
                        return; // 停止执行
                    }

                    const oc = data.organizedCrime;

                    if (data.error || !oc) {
                        callback(defaultOcTime);
                        return;
                    }

                    // OC API v2 的时间计算逻辑
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

                    // 也为 Refills 添加 Key 错误检查
                    if (data.error && data.error.code === 2) {
                        console.log("Incorrect API Key detected. Clearing key and reloading.");
                        localStorage.removeItem(LOCAL_KEY);
                        location.reload();
                        return; // 停止执行
                    }

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
            if (el._timer) clearInterval(el._timer);
            el.remove();
        });
        // ---

        const isMobile = !!document.querySelector('[class*="user-information-mobile"]');
        let container = null;
        let insertionPoint = null;
        let ttIntegration = false;
        let ttSidebarElement = null;
        let apiInputContainer = null;

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
                apiInputContainer = ttContainer.parentElement;
                ttSidebarElement = ttContainer;
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
                    apiInputContainer = mainSidebarContainer;
                    container = mainSidebarContainer;

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

        const savedKey = localStorage.getItem(LOCAL_KEY);

        if (!savedKey) {
            // 在 Non-TT PC 模式下，使用 insertionPoint (能量条容器) 作为 customInsertionPoint，以放置在正确位置
            const customInsertionPoint = ttIntegration ? ttSidebarElement : insertionPoint;

            // placementContainer 仍然使用 apiInputContainer
            createInputUI(apiInputContainer, isMobile, ttIntegration, customInsertionPoint);
        } else {

            // (Stale-while-revalidate)

            // 1. 同步读取缓存数据 (无论是否过期)
            let latestCooldowns = getCooldownsCacheSync();
            let latestOcTime = getOCCacheSync();
            let latestRefills = getRefillsCacheSync();

            // 第一次调用：立即使用缓存数据进行渲染 (不会有空白闪烁)
            createTimeDisplay(container, latestCooldowns, latestOcTime, latestRefills, insertionPoint, ttIntegration);


            // 2. 异步并发获取最新数据 (仅在缓存过期时)

            // 定义一个统一的渲染函数
            function renderLatest() {
                const currentTtIntegration = !!document.querySelector('div.tt-sidebar-information');
                createTimeDisplay(container, latestCooldowns, latestOcTime, latestRefills, insertionPoint, currentTtIntegration);
            }

            // --- 检查是否需要重新获取 ---

            // (A) Cooldowns
            if (isCacheStale(CACHE_KEY, CONFIG.cacheDuration)) {
                fetchCooldowns(savedKey, (cooldowns) => {
                    latestCooldowns = cooldowns; // 更新 "cooldowns" 插槽
                    renderLatest(); // 使用最新数据重绘
                });
            }

            // (B) OC
            const initialTtIntegration = !!document.querySelector('div.tt-sidebar-information');
            if (isCacheStale(OC_CACHE_KEY, CONFIG.cacheDuration)) {
                fetchOC(savedKey, (ocTime) => {
                    if (ocTime !== null) {
                        latestOcTime = ocTime;
                    }
                    renderLatest(); // 使用最新数据重绘
                }, initialTtIntegration); // 传入当前的 ttIntegration 状态
            }

            // (C) Refills
            // `getRefillsCacheSync` 在过期时返回 null，这是最好的检查
            if (latestRefills === null) {
                fetchRefills(savedKey, (refills) => {
                    latestRefills = refills; // 更新 "refills" 插槽
                    renderLatest(); // 使用最新数据重绘
                });
            }
        }

        return true;
    }

    // ====================================================================
    // *** 启动逻辑修改 (v3 - 缩短延迟) ***
    // ====================================================================

    // 方案一：延迟 1 秒执行，给 TornTools 足够的加载时间
    setTimeout(() => {
        if (!tryInit()) {
            const obs = new MutationObserver(() => {
                // 等待主要元素加载完成后再执行初始化
                if (document.querySelector('div.user-information') || document.querySelector('[class*="user-information-mobile"]')) {
                    if (tryInit()) obs.disconnect();
                }
            });
            obs.observe(document.documentElement, { childList: true, subtree: true });
        }
    }, 100); // <-- 100ms 延迟


    // 方案二：启动一个定时器来强行处理SPA导航 (Torn 页面切换)
    // 每 1 秒检查一次 UI 是否还在
    setInterval(() => {
        // 检查UI元素是否还在
        const wrapper = document.getElementById('tm-cooldown-wrapper'); // Non-TT 容器
        const ttSection = document.getElementById('tm-cd-drug'); // TT 模式下的一个元素
        const inputUI = document.getElementById('tm-extra-input-wrap'); // API输入框

        // 如果我们有API Key，但所有UI元素都不见了 (说明页面跳转了)
        if (localStorage.getItem(LOCAL_KEY) && !wrapper && !ttSection && !inputUI) {
            console.log("[Torn OC Check] UI not found, re-initializing due to navigation...");
            tryInit(); // 尝试重新初始化
        }
    }, 1000); // <-- 1000ms 检查

})();