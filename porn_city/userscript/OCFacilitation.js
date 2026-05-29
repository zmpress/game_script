// ==UserScript==
// @name         OCFacilitation
// @namespace    https://greasyfork.org/users/[daluo]
// @version      1.0.5.7
// @description  Make OC 2.0 easier for regular players
// @description:zh-CN  使普通玩家oc2.0更简单和方便
// @author       daluo
// @match        https://www.torn.com/*
// @run-at       document-start
// @connect      *
// @license      MIT
// @updateURL    https://raw.githubusercontent.com/zmpress/game_script/refs/heads/main/porn_city/userscript/OCFacilitation.js
// @downloadURL    https://raw.githubusercontent.com/zmpress/game_script/refs/heads/main/porn_city/userscript/OCFacilitation.js

// ==/UserScript==

(function() {
    'use strict';

    // 防止PDA多次加载脚本
    if (window.__ocFacilitationAppStarted) return;
    window.__ocFacilitationAppStarted = true;
    console.log("🚀 OCFacilitation 启动");

    // =============== 配置管理 ===============
    const CONFIG = {
        USER_ID: '',
        CACHE: {
            OC_DATA_DURATION: 30, // Organized Crime API 缓存时间，单位：秒 (默认 30 秒)
            COOLDOWN_DURATION: 30, // Cooldowns API 缓存时间，单位：秒 (默认 30 秒)
            REFILLS_DURATION: 30 // Refills API 缓存时间，单位：秒 (默认 30 秒)
        },
        COOLDOWN_SETTINGS: { // true 打开 / false 关闭
            SHOW_ICONS: true, // 显示图标（false 时显示文字标签）
            SHOW_DRUG: true, // 显示药物冷却
            SHOW_MEDICAL: true, // 显示医疗冷却
            SHOW_BOOSTER: true, // 显示瓶装啤酒冷却
            WARNING_TIME: { // 预警时间（秒），低于此时间显示红色
                DRUG: 300, // 药物预警时间，单位：秒（默认 5 分钟）
                MEDICAL: 300, // 医疗预警时间，单位：秒（默认 5 分钟）
                BOOSTER: 300 // 啤酒预警时间，单位：秒（默认 5 分钟）
            }
        },
        REFILLS_SETTINGS: { // true 打开 / false 关闭
            SHOW_ENERGY: true, // 显示 energy 补充状态
            SHOW_NERVE: true, // 显示 nerve 补充状态
            SHOW_TOKEN: true // 显示 token 补充状态
        },
        API: {
            TORN_V2_URL: 'https://api.torn.com/v2',
            ENDPOINTS: {
                USER_OC: '/user/organizedcrime',
                USER_COOLDOWNS: '/user/cooldowns',
                USER_REFILLS: '/user/refills'
            }
        },
        UI: {
            LOAD_DELAY: 300,
            UPDATE_DEBOUNCE: 500,
            TIME_TOLERANCE: 2,
            SELECTORS: {
                WRAPPER: '[class^="wrapper___"]',
                SLOTS: '[class^="wrapper___"]',
                WAITING: '[class^="waitingJoin___"]',
                TITLE: '[class^="title___"]',
                PANEL_TITLE: '[class^="panelTitle___"]',
                MOBILE_INFO: '[class^="user-information-mobile___"]',
                STATUS_ICONS: '[class^="status-icons___"]',
                LEVEL_VALUE: '[class^="levelValue___"]'
            },
            STYLES: {
                URGENT: { BORDER: '3px solid red', COLOR: 'red' },
                STABLE: { BORDER: '3px solid green', COLOR: 'green' },
                EXCESS: { BORDER: '3px solid yellow', COLOR: 'blue' }
            }
        },
        TIME: {
            SECONDS_PER_DAY: 86400,
            HOURS_PER_DAY: 24,
            URGENT_THRESHOLD: 12,
            STABLE_THRESHOLD: 36
        }
    };

    // =============== 工具类 ===============
    class Utils {
        static getCurrentTab() {
            const match = window.location.hash.match(/#\/tab=([^&]*)/);
            return match ? match[1] : null;
        }

        static isOCPage() {
            return this.getCurrentTab() === 'crimes';
        }

        static isMobileDevice() {
            return !!document.querySelector(CONFIG.UI.SELECTORS.MOBILE_INFO);
        }

        static getNow() {
            return Math.floor(Date.now() / 1000);
        }

        static debounce(func, wait) {
            let timeout;
            return function executedFunction(...args) {
                clearTimeout(timeout);
                timeout = setTimeout(() => func.apply(this, args), wait);
            };
        }

        static isFactionPage() {
            return window.location.pathname === '/factions.php';
        }

        static async waitForWrapper() {
            const maxAttempts = 10;
            const interval = 1000;

            for (let attempts = 0; attempts < maxAttempts; attempts++) {
                const wrappers = document.querySelectorAll(CONFIG.UI.SELECTORS.WRAPPER);
                if (wrappers.length > 0 && wrappers[0].parentNode) {
                    return wrappers[0].parentNode;
                }
                await this.delay(interval);
            }
            throw new Error('无法找到wrapper元素');
        }

        static calculateTimeFromParts(days, hours, minutes, seconds) {
            return (days * CONFIG.TIME.SECONDS_PER_DAY) +
                (hours * 3600) +
                (minutes * 60) +
                seconds;
        }

        static delay(ms) {
            return new Promise(resolve => setTimeout(resolve, ms));
        }

        static drawASectorShape(r, startAngle, angle, clockwise = true, color = '#5cb85c') {
            const endAngle = clockwise ? startAngle + angle : startAngle - angle;
            const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
            svg.setAttribute('version', '1.1');
            svg.style.width = `${r * 2}px`;
            svg.style.height = `${r * 2}px`;
            svg.style.display = 'block';
            svg.setAttribute('viewBox', `0 0 ${r * 2} ${r * 2}`);
            svg.style.boxSizing = 'border-box';

            const startRad = ((startAngle - 90) * Math.PI) / 180;
            const endRad = ((endAngle - 90) * Math.PI) / 180;
            const cx = r, cy = r;
            const x1 = cx + r * Math.cos(startRad);
            const y1 = cy + r * Math.sin(startRad);
            const x2 = cx + r * Math.cos(endRad);
            const y2 = cy + r * Math.sin(endRad);

            const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
            path.style.boxSizing = 'border-box';
            const largeArcFlag = angle <= 180 ? '0' : '1';
            const sweepFlag = clockwise ? '1' : '0';
            path.setAttribute('d', `M ${cx},${cy} L ${x1},${y1} A ${r},${r} 0 ${largeArcFlag},${sweepFlag} ${x2},${y2} Z`);
            path.setAttribute('fill', color);

            svg.appendChild(path);
            return svg;
        }
    }

    // =============== DOM 辅助类 (用于帮派页面的UI渲染) ===============
    class CrimeDOMHelper {
        static getDOMInfo(element) {
            const slotWrappers = Array.from(element.querySelectorAll(CONFIG.UI.SELECTORS.SLOTS))
                .filter(el => el.parentElement !== element.parentElement);
            return {
                totalSlots: slotWrappers.length,
                emptySlots: element.querySelectorAll(CONFIG.UI.SELECTORS.WAITING).length,
                timeElement: element.querySelector(CONFIG.UI.SELECTORS.TITLE)
            };
        }

        static calculateReadyAtTime(element) {
            const { timeElement, emptySlots } = this.getDOMInfo(element);
            const completionTimeStr = timeElement?.textContent?.trim();
            const completionTime = this.EstimateCompletionTime(completionTimeStr);
            return completionTime - emptySlots * CONFIG.TIME.SECONDS_PER_DAY;
        }

        static EstimateCompletionTime(timeStr) {
            if (!timeStr) return null;
            try {
                const [days, hours, minutes, seconds] = timeStr.split(':').map(Number);
                return Utils.getNow() + Utils.calculateTimeFromParts(days, hours, minutes, seconds);
            } catch (error) {
                console.error("计算完成时间失败:", error, timeStr);
                return null;
            }
        }
    }

    // =============== UI管理类 ===============
    class CrimeUIManager {
        static updateAllCrimesUI(crimeListContainer) {
            if (!crimeListContainer) return;
            Array.from(crimeListContainer.children).forEach(element => {
                this.updateSingleCrimeUI(element);
            });

            const sortButtonSet = crimeListContainer.parentElement.getElementsByClassName('sort-button');
            if (sortButtonSet.length === 0) {
                this.addSortButton(crimeListContainer);
            }
        }

        static addSortButton(crimeListContainer) {
            const sortButton = document.createElement('button');
            sortButton.textContent = '按等级排序';
            Object.assign(sortButton.style, {
                margin: '10px 0', padding: '8px 16px', border: 'none', borderRadius: '4px',
                backgroundColor: '#007bff', color: '#fff', fontWeight: '500', cursor: 'pointer',
                transition: 'all 0.2s ease', boxShadow: '0 1px 2px rgba(0,0,0,0.1)',
                letterSpacing: '0.3px', fontSize: '14px', display: 'block', width: '100%',
                textAlign: 'center', textTransform: 'uppercase', marginBottom: '10px'
            });
            sortButton.addEventListener('click', () => this.sortCrimesByLevel(crimeListContainer));
            sortButton.classList.add('sort-button');
            crimeListContainer.before(sortButton);
        }

        static sortCrimesByLevel(crimeListContainer) {
            const sortedElements = Array.from(crimeListContainer.children)
                .sort((a, b) => {
                    const aLevel = a.querySelector(CONFIG.UI.SELECTORS.LEVEL_VALUE)?.textContent || '0';
                    const aTitle = a.querySelector(CONFIG.UI.SELECTORS.PANEL_TITLE)?.textContent || "AA"
                    const aSortText = aLevel + "_" + aTitle.replace(/[^a-zA-Z]/g, '')

                    const bLevel = b.querySelector(CONFIG.UI.SELECTORS.LEVEL_VALUE)?.textContent || '0';
                    const bTitle = b.querySelector(CONFIG.UI.SELECTORS.PANEL_TITLE)?.textContent || "AA"
                    const bSortText = bLevel + "_" + bTitle.replace(/[^a-zA-Z]/g, '')

                    return bSortText.localeCompare(aSortText);
                });

            sortedElements.forEach(element => crimeListContainer.appendChild(element));
        }

        static updateSingleCrimeUI(element) {
            const crimeNameEl = element.querySelector(CONFIG.UI.SELECTORS.PANEL_TITLE);
            if (!crimeNameEl) return;

            const { totalSlots, emptySlots } = CrimeDOMHelper.getDOMInfo(element);
            const currentUsers = totalSlots - emptySlots;

            const readyAt = CrimeDOMHelper.calculateReadyAtTime(element);
            const now = Utils.getNow();
            const extraTimeHours = readyAt ? (readyAt - now) / 3600 : 0;

            this.clearUI(element, crimeNameEl);

            if (currentUsers > 0) {
                this.addStatusInfo(element, crimeNameEl, {
                    currentUsers, totalSlots, extraTimeHours, isFullyStaffed: emptySlots === 0
                });
            }
        }

        static clearUI(element, crimeNameEl) {
            element.style.color = '';
            element.style.border = '';
            crimeNameEl.querySelectorAll('span[data-oc-ui]').forEach(span => span.remove());
        }

        static addStatusInfo(element, crimeNameEl, stats) {
            const { currentUsers, totalSlots, extraTimeHours, isFullyStaffed } = stats;
            const statusSpan = document.createElement('span');
            statusSpan.setAttribute('data-oc-ui', 'status');
            statusSpan.textContent = `当前${currentUsers}人,共需${totalSlots}人。`;
            this.applyStatusStyle(element, statusSpan, extraTimeHours, isFullyStaffed);
            crimeNameEl.appendChild(document.createTextNode(' '));
            crimeNameEl.appendChild(statusSpan);
        }

        static applyStatusStyle(element, statusSpan, extraTimeHours, isFullyStaffed) {
            statusSpan.style.padding = '4px 8px';
            statusSpan.style.borderRadius = '4px';
            statusSpan.style.fontWeight = '500';
            statusSpan.style.display = 'inline-block';
            statusSpan.style.boxShadow = '0 1px 2px rgba(0,0,0,0.1)';
            statusSpan.style.transition = 'all 0.2s ease';

            const isMobile = Utils.isMobileDevice();
            statusSpan.style.fontSize = isMobile ? '10px' : '12px';

            if (extraTimeHours <= CONFIG.TIME.URGENT_THRESHOLD && !isFullyStaffed) {
                element.style.border = CONFIG.UI.STYLES.URGENT.BORDER;
                statusSpan.style.background = 'linear-gradient(135deg, #ff4d4d 0%, #e60000 100%)';
                statusSpan.style.color = '#fff';
                statusSpan.style.border = '1px solid #cc0000';

                const hours = Math.floor(extraTimeHours);
                const minutes = Math.floor((extraTimeHours % 1) * 60);
                statusSpan.innerHTML = isMobile
                    ? `<span style="font-size:11px">⚠</span> ${hours}h${minutes}m`
                    : `<span style="font-size:14px;margin-right:4px">⚠</span>急需人手！还剩<strong style="font-weight:600">${hours}小时${minutes}分</strong>`;
            } else if (extraTimeHours <= CONFIG.TIME.STABLE_THRESHOLD) {
                element.style.border = CONFIG.UI.STYLES.STABLE.BORDER;
                statusSpan.style.background = 'linear-gradient(135deg, #4CAF50 0%, #45a049 100%)';
                statusSpan.style.color = '#fff';
                statusSpan.style.border = '1px solid #3d8b40';
                statusSpan.innerHTML = isMobile ? `<span style="font-size:11px">✓</span> 配置正常` : `<span style="font-size:14px;margin-right:4px">✓</span>人员配置合理`;
            } else {
                const extraUsers = Math.floor(extraTimeHours/24) - 1;
                if (extraUsers > 0) {
                    element.style.border = CONFIG.UI.STYLES.EXCESS.BORDER;
                    statusSpan.style.background = 'linear-gradient(135deg, #2196F3 0%, #1976D2 100%)';
                    statusSpan.style.color = '#fff';
                    statusSpan.style.border = '1px solid #1565C0';
                    statusSpan.innerHTML = isMobile
                        ? `<span style="font-size:11px">ℹ</span> 可调${extraUsers}人`
                        : `<span style="font-size:14px;margin-right:4px">ℹ</span>可调配 <strong style="font-weight:600">${extraUsers}</strong> 人至其他OC`;
                } else {
                    element.style.border = CONFIG.UI.STYLES.STABLE.BORDER;
                    statusSpan.style.background = 'linear-gradient(135deg, #4CAF50 0%, #45a049 100%)';
                    statusSpan.style.color = '#fff';
                    statusSpan.style.border = '1px solid #3d8b40';
                    statusSpan.innerHTML = isMobile ? `<span style="font-size:11px">✓</span> 配置正常` : `<span style="font-size:14px;margin-right:4px">✓</span>人员配置合理`;
                }
            }

            statusSpan.addEventListener('mouseover', () => statusSpan.style.transform = 'translateY(-1px)');
            statusSpan.addEventListener('mouseout', () => statusSpan.style.transform = 'translateY(0)');
        }
    }

    // =============== API管理类 ===============
    class APIManager {
        // 使用 Torn 官方 V2 API 获取个人 OC 数据 (带有时间缓存机制)
        static async getUserOCData() {
            const apiKey = localStorage.getItem("z_tornMinimalKey");
            if (!apiKey) return { error: true, message: "请输入 API Key" };

            try {
                const cacheKey = 'z_api2_userOrganizedcrime';
                const cachedDataStr = localStorage.getItem(cacheKey);
                const currentTime = Date.now();
                const cacheExpirationTime = CONFIG.CACHE.OC_DATA_DURATION * 1000;

                // 判断缓存是否在有效期内
                if (cachedDataStr) {
                    const parsed = JSON.parse(cachedDataStr);
                    if (currentTime - parsed.last_fetched_time < cacheExpirationTime) {
                        return { data: parsed.data };
                    }
                }

                // 缓存已过期，请求新数据
                const response = await fetch(`${CONFIG.API.TORN_V2_URL}${CONFIG.API.ENDPOINTS.USER_OC}?key=${apiKey}`);
                const data = await response.json();

                if (data.error) {
                    console.error(`Torn API错误: ${data.error.error}`);
                    // 如果因为 Key 错误导致报错，通知重新输入
                    if (data.error.code === 1 || data.error.code === 2 || data.error.code === 18) {
                        return { error: true, message: "API Key 无效，请检查" };
                    }
                    return null; // 其他服务器错误
                }

                // 将成功返回的数据存入缓存
                localStorage.setItem(cacheKey, JSON.stringify({
                    data: data.organizedCrime,
                    last_fetched_time: currentTime
                }));

                return { data: data.organizedCrime };
            } catch (error) {
                console.error('获取玩家OC数据失败:', error);
                return null;
            }
        }

        // 获取用户冷却时间数据
        static async getUserCooldowns() {
            const apiKey = localStorage.getItem("z_tornMinimalKey");
            if (!apiKey) return null;

            try {
                const cacheKey = 'z_api2_userCooldowns';
                const cachedDataStr = localStorage.getItem(cacheKey);
                const currentTime = Date.now();
                const cacheExpirationTime = CONFIG.CACHE.COOLDOWN_DURATION * 1000;

                // 判断缓存是否在有效期内
                if (cachedDataStr) {
                    const parsed = JSON.parse(cachedDataStr);
                    if (currentTime - parsed.last_fetched_time < cacheExpirationTime) {
                        return parsed.data;
                    }
                }

                // 缓存已过期，请求新数据
                const response = await fetch(`${CONFIG.API.TORN_V2_URL}${CONFIG.API.ENDPOINTS.USER_COOLDOWNS}?key=${apiKey}`);
                const data = await response.json();

                if (data.error) {
                    console.error(`获取冷却时间失败: ${data.error.error}`);
                    return null;
                }

                // 将成功返回的数据存入缓存
                localStorage.setItem(cacheKey, JSON.stringify({
                    data: data.cooldowns,
                    last_fetched_time: currentTime
                }));

                return data.cooldowns;
            } catch (error) {
                console.error('获取冷却时间数据失败:', error);
                return null;
            }
        }

        static async getPlayerId() {
            const playerId = localStorage.getItem('sessionTokenOwner') || localStorage.getItem('PlayerId');
            if (playerId !== null) return parseInt(playerId);

            const apiKey = localStorage.getItem("z_tornMinimalKey");
            if (!apiKey) return null;

            try {
                const response = await fetch(`https://api.torn.com/user/?selections=basic&key=${apiKey}`);
                const data = await response.json();
                if (data.error) throw new Error(`API错误: ${data.error.error}`);

                localStorage.setItem('PlayerId', data.player_id);
                return parseInt(data.player_id);
            } catch (error) {
                console.error('获取玩家信息失败:', error);
                return null;
            }
        }

        // 获取用户补充状态数据
        static async getUserRefills() {
            const apiKey = localStorage.getItem("z_tornMinimalKey");
            if (!apiKey) return null;

            try {
                const cacheKey = 'z_api2_userRefills';
                const cachedDataStr = localStorage.getItem(cacheKey);
                const currentTime = Date.now();
                const cacheExpirationTime = CONFIG.CACHE.REFILLS_DURATION * 1000;

                // 判断缓存是否在有效期内
                if (cachedDataStr) {
                    const parsed = JSON.parse(cachedDataStr);
                    if (currentTime - parsed.last_fetched_time < cacheExpirationTime) {
                        return parsed.data;
                    }
                }

                // 缓存已过期，请求新数据
                const response = await fetch(`${CONFIG.API.TORN_V2_URL}${CONFIG.API.ENDPOINTS.USER_REFILLS}?key=${apiKey}`);
                const data = await response.json();

                if (data.error) {
                    console.error(`获取补充状态失败: ${data.error.error}`);
                    return null;
                }

                // 将成功返回的数据存入缓存
                localStorage.setItem(cacheKey, JSON.stringify({
                    data: data.refills,
                    last_fetched_time: currentTime
                }));

                return data.refills;
            } catch (error) {
                console.error('获取补充状态数据失败:', error);
                return null;
            }
        }
    }

    // =============== 状态图标管理类 ===============
    class StatusIconManager {
        async updateStatusIcons() {
            const ocStatusContainer = document.getElementById('oc-status-container');
            if (!ocStatusContainer) return;

            // 每次渲染前清空之前的状态或输入框
            ocStatusContainer.innerHTML = '';

            const apiKey = localStorage.getItem("z_tornMinimalKey");
            if (!apiKey) {
                this.renderApiKeyInput(ocStatusContainer);
                return;
            }

            // 确保我们有 USER_ID（用来标记自己的星星标记）
            if (!CONFIG.USER_ID) {
                CONFIG.USER_ID = await APIManager.getPlayerId();
            }

            const response = await APIManager.getUserOCData();

            // 如果发生 Api key 无效等错误，则渲染输入框重新输入
            if (response && response.error) {
                this.renderApiKeyInput(ocStatusContainer, response.message);
                return;
            }

            const userOC = response ? response.data : null;

            if (userOC) {
                const mappedCrime = {
                    id: userOC.id,
                    slots: userOC.slots.map(s => ({
                        user_id: s.user ? s.user.id : null,
                        user: s.user ? {
                            id: s.user.id,
                            joined_at: s.user.joined_at,
                            progress: s.user.progress
                        } : null,
                        item_requirement: s.item_requirement,
                        isEmptySolt: function() { return this.user_id === null; },
                        hasTool: function() { return this.item_requirement && this.item_requirement.is_available; }
                    }))
                };
                this.renderParticipatingStatus(ocStatusContainer, mappedCrime, CONFIG.USER_ID);
            } else {
                this.renderNonParticipatingStatus(ocStatusContainer);
            }
        }

        renderApiKeyInput(container, errorMsg = "") {
            const inputContainer = document.createElement('div');
            inputContainer.style.display = 'flex';
            inputContainer.style.alignItems = 'center';
            inputContainer.style.gap = '5px';
            inputContainer.style.padding = '0px'; // 紧凑：移除这里的纵向 padding

            const input = document.createElement('input');
            input.type = 'text';
            input.placeholder = errorMsg || '输入 Minimal API Key';
            input.style.padding = '4px 8px';
            input.style.border = '1px solid #ccc';
            input.style.borderRadius = '3px';
            input.style.fontSize = '12px';
            input.style.color = '#333';
            input.style.width = '180px';
            input.style.outline = 'none';

            // 输入框提示灰字效果在 placeholder 中即可实现，如需改变 placeholder 颜色：
            input.style.setProperty('::placeholder', 'color: #999');

            const btn = document.createElement('button');
            btn.textContent = '确认';
            btn.style.padding = '4px 10px';
            btn.style.backgroundColor = '#4CAF50';
            btn.style.color = 'white';
            btn.style.border = 'none';
            btn.style.borderRadius = '3px';
            btn.style.cursor = 'pointer';
            btn.style.fontSize = '12px';

            btn.addEventListener('click', () => {
                const val = input.value.trim();
                if (val) {
                    // 1. 将 Key 永久保存到本地
                    localStorage.setItem('z_tornMinimalKey', val);
                    // 2. 清除之前的错误请求缓存以强制刷新
                    localStorage.removeItem('z_api2_userOrganizedcrime');
                    // 3. 重新渲染状态图标
                    this.updateStatusIcons();
                }
            });

            inputContainer.appendChild(input);
            inputContainer.appendChild(btn);
            container.appendChild(inputContainer);
        }

        renderParticipatingStatus(container, userCrime, userId) {
            const slotIcons = this.createSlotIconsContainer();

            const sortedSlots = userCrime.slots.sort((a, b) => {
                if (a.user_id && b.user_id) return a.user.joined_at - b.user.joined_at;
                return a.user_id ? -1 : 1;
            });

            const fragment = document.createDocumentFragment();
            sortedSlots.forEach((slot) => {
                const SegmentedIconInfo = this.getSegmentedIconInfo(slot);
                const icon = this.createSlotIcon(slot, SegmentedIconInfo, userId);
                // 为每个图标单独添加点击跳转事件
                icon.addEventListener('click', () => {
                    window.location.href = `https://www.torn.com/factions.php?step=your#/tab=crimes&crimeId=${userCrime.id}`;
                });
                fragment.appendChild(icon);
            });
            slotIcons.appendChild(fragment);
            
            // 添加冷却时间显示
            this.addCooldownDisplay(container, slotIcons);
            
            container.appendChild(slotIcons);
        }

        async addCooldownDisplay(container, slotIcons) {
            const cooldowns = await APIManager.getUserCooldowns();
            if (!cooldowns) return;

            const refills = await APIManager.getUserRefills();

            const isMobile = Utils.isMobileDevice();
            const cooldownContainer = document.createElement('div');
            cooldownContainer.id = 'oc-cooldown-display';
            
            // 根据设备类型设置不同的样式和位置
            if (isMobile) {
                // 手机端：在右侧显示
                cooldownContainer.style.display = 'flex';
                cooldownContainer.style.flexDirection = 'row';
                cooldownContainer.style.alignItems = 'center';
                cooldownContainer.style.gap = '8px';
                cooldownContainer.style.marginLeft = '10px';
                cooldownContainer.style.fontSize = '11px';
                cooldownContainer.style.color = '#666';
                
                // 将冷却时间容器放在 slotIcons 的右侧
                slotIcons.style.display = 'flex';
                slotIcons.style.alignItems = 'center';
                const wrapper = document.createElement('div');
                wrapper.style.display = 'flex';
                wrapper.style.alignItems = 'center';
                wrapper.appendChild(slotIcons);
                wrapper.appendChild(cooldownContainer);
                container.innerHTML = '';
                container.appendChild(wrapper);
            } else {
                // 电脑端：在下方显示，支持自动换行
                cooldownContainer.style.display = 'flex';
                cooldownContainer.style.flexDirection = 'row';
                cooldownContainer.style.flexWrap = 'wrap';
                cooldownContainer.style.gap = '12px';
                cooldownContainer.style.alignContent = 'flex-start';
                cooldownContainer.style.marginTop = '4px';
                cooldownContainer.style.fontSize = '11px';
                cooldownContainer.style.color = '#666';
                cooldownContainer.style.padding = '2px 0';
                cooldownContainer.style.lineHeight = '1';
                cooldownContainer.style.marginBottom = '0';
            }

            // 格式化并显示三个冷却项目
            this.renderCooldownItems(cooldownContainer, cooldowns);

            // 添加补充状态显示
            if (refills) {
                this.renderRefillsStatus(cooldownContainer, refills);
            }

            if (!isMobile) {
                container.appendChild(cooldownContainer);
            }
            
            // 启动定时器更新时间
            this.startCooldownTimer(cooldownContainer, cooldowns);
        }

        renderCooldownItems(container, cooldowns) {
            // 格式化并显示三个冷却项目
            const items = [
                { key: 'drug', label: 'Drug', icon: '💊' },
                { key: 'medical', label: 'Med', icon: '🏥' },
                { key: 'booster', label: 'Booster', icon: '🍺' }
            ];

            const showIcons = CONFIG.COOLDOWN_SETTINGS.SHOW_ICONS;

            items.forEach(item => {
                const seconds = cooldowns[item.key];
                const itemDiv = document.createElement('div');
                itemDiv.style.display = CONFIG.COOLDOWN_SETTINGS[`SHOW_${item.key.toUpperCase()}`] ? 'flex' : 'none';
                itemDiv.style.alignItems = 'center';
                itemDiv.style.gap = '3px';
                itemDiv.dataset.cooldownKey = item.key; // 用于后续更新
                itemDiv.style.cursor = 'pointer';
                
                const timeText = seconds > 0 ? this.formatCooldownTime(seconds) : '就绪';
                const warningTime = CONFIG.COOLDOWN_SETTINGS.WARNING_TIME[item.key.toUpperCase()];
                let colorStyle = 'color: #000;'; // 默认黑色
                
                if (seconds === 0) {
                    colorStyle = 'color: #4CAF50;'; // 就绪显示绿色
                } else if (warningTime && seconds <= warningTime) {
                    colorStyle = 'color: #FF0000;'; // 低于预警时间显示红色
                }
                
                // 根据开关决定显示图标还是文字标签
                const displayContent = showIcons ? item.icon : `${item.label}:`;
                
                itemDiv.innerHTML = `
                    <span>${displayContent}</span>
                    <span class="cooldown-time" style="${colorStyle} font-weight: 500;">${timeText}</span>
                `;
                
                // 添加点击跳转事件
                let targetUrl = '';
                if (item.key === 'medical') {
                    targetUrl = 'https://www.torn.com/factions.php?step=your#/tab=armoury';
                } else if (item.key === 'drug') {
                    targetUrl = 'https://www.torn.com/item.php';
                } else if (item.key === 'booster') {
                    targetUrl = 'https://www.torn.com/item.php';
                }
                
                if (targetUrl) {
                    itemDiv.addEventListener('click', () => {
                        window.location.href = targetUrl;
                    });
                }
                
                container.appendChild(itemDiv);
            });
        }
        
        renderRefillsStatus(container, refills) {
            const isMobile = Utils.isMobileDevice();
            
            // 检查哪些补充还没用（false 表示没用过）
            const unused = [];
            if (!refills.energy && CONFIG.REFILLS_SETTINGS.SHOW_ENERGY) {
                unused.push(isMobile ? 'e' : 'energy');
            }
            if (!refills.nerve && CONFIG.REFILLS_SETTINGS.SHOW_NERVE) {
                unused.push(isMobile ? 'n' : 'nerve');
            }
            if (!refills.token && CONFIG.REFILLS_SETTINGS.SHOW_TOKEN) {
                unused.push(isMobile ? 't' : 'token');
            }
            
            // 如果全部都用过了或都隐藏了，不显示
            if (unused.length === 0) return;
            
            // 创建显示元素
            const refillsDiv = document.createElement('div');
            refillsDiv.style.display = 'flex';
            refillsDiv.style.alignItems = 'center';
            refillsDiv.style.gap = '3px';
            refillsDiv.style.margin = '0';
            refillsDiv.style.padding = '0';
            refillsDiv.style.fontSize = '11px';
            refillsDiv.style.color = '#666';
            refillsDiv.style.cursor = 'pointer';
            
            const labelText = unused.join(',');
            refillsDiv.innerHTML = `<span style="font-weight: 500; color: #000;">${labelText}</span>`;
            
            // 添加点击跳转事件
            refillsDiv.addEventListener('click', () => {
                window.location.href = 'https://www.torn.com/page.php?sid=points';
            });
            
            container.appendChild(refillsDiv);
        }
        
        startCooldownTimer(container, initialCooldowns) {
            // 清除可能存在的旧定时器
            if (this.cooldownTimerId) {
                clearInterval(this.cooldownTimerId);
            }
            
            // 存储剩余秒数
            const remainingSeconds = {};
            Object.keys(initialCooldowns).forEach(key => {
                remainingSeconds[key] = initialCooldowns[key];
            });
            
            // 每秒更新一次
            this.cooldownTimerId = setInterval(() => {
                let allReady = true;
                
                // 更新每个冷却项
                container.querySelectorAll('[data-cooldown-key]').forEach(itemDiv => {
                    const key = itemDiv.dataset.cooldownKey;
                    const timeSpan = itemDiv.querySelector('.cooldown-time');
                    
                    if (remainingSeconds[key] > 0) {
                        remainingSeconds[key]--;
                        allReady = false;
                        
                        const timeText = this.formatCooldownTime(remainingSeconds[key]);
                        timeSpan.textContent = timeText;
                        
                        // 根据预警时间设置颜色
                        const warningTime = CONFIG.COOLDOWN_SETTINGS.WARNING_TIME[key.toUpperCase()];
                        if (warningTime && remainingSeconds[key] <= warningTime) {
                            timeSpan.style.color = '#FF0000'; // 低于预警时间显示红色
                        } else {
                            timeSpan.style.color = '#000'; // 默认黑色
                        }
                    } else {
                        timeSpan.textContent = '就绪';
                        timeSpan.style.color = '#4CAF50'; // 就绪显示绿色
                    }
                });
                
                // 如果所有冷却都就绪，停止定时器
                if (allReady) {
                    clearInterval(this.cooldownTimerId);
                    this.cooldownTimerId = null;
                }
            }, 1000);
        }

        formatCooldownTime(seconds) {
            if (seconds <= 0) return '就绪';
            
            const days = Math.floor(seconds / 86400);
            const hours = Math.floor((seconds % 86400) / 3600);
            const minutes = Math.floor((seconds % 3600) / 60);
            const secs = seconds % 60;
            
            if (days > 0) {
                return `${days}d ${hours}h`;
            } else if (hours > 0) {
                return `${hours}h ${minutes}m`;
            } else if (minutes >= 1) {
                return `${minutes}m`;
            } else {
                return `${secs}s`;
            }
        }

        getSegmentedIconInfo(slot) {
            let SegmentedIconInfo = [];
            if (slot.user_id) {
                const progress = slot.user.progress;
                if (progress === 0) {
                    SegmentedIconInfo.push({color:'#FFC107', percentage:100});
                } else if (progress === 100) {
                    SegmentedIconInfo.push({color:'#5cb85c', percentage:100});
                } else {
                    SegmentedIconInfo.push({color:'#5cb85c', percentage: progress});
                    SegmentedIconInfo.push({color:'#FFC107', percentage: 100 - progress});
                }
            } else {
                SegmentedIconInfo.push({color:'#a4a4a4', percentage:100});
            }
            return SegmentedIconInfo;
        }

        renderNonParticipatingStatus(container) {
            const notInOCContainer = this.createNotInOCContainer();
            const textSpan = this.createTextSpan();
            const joinLink = this.createJoinLink();

            notInOCContainer.appendChild(textSpan);
            notInOCContainer.appendChild(joinLink);
            container.appendChild(notInOCContainer);
        }

        createSlotIconsContainer() {
            const container = document.createElement('div');
            const isMobile = Utils.isMobileDevice();

            container.style.display = 'flex';
            container.style.alignItems = 'center';
            container.style.height = 'auto';
            container.style.cursor = 'pointer';
            container.style.boxSizing = 'border-box';

            // --- 修改点：移除外层矩形边框 ---
            container.style.border = 'none';
            // ----------------------------

            // 手机端可以适当减少背景的视觉占比或调整内边距
            container.style.background = 'transparent'; // 如果不需要背景底色，设为 transparent
            container.style.padding = isMobile ? '1px 2px' : '1px 5px 1px 0px';
            container.style.boxShadow = 'none'; // 如果有阴影也一并去掉

            container.addEventListener('mouseover', () => {
                // 如果去掉了背景色，这里可以根据需要调整悬浮效果
                container.style.background = 'rgba(0,0,0,0.03)';
                container.style.transition = 'all 0.2s ease';
            });

            container.addEventListener('mouseout', () => {
                container.style.background = 'transparent';
            });

            return container;
        }

        createSlotIcon(slot, SegmentedIconInfo, userId) {
            const icon = document.createElement('div');
            icon.style.width = '17px';
            icon.style.height = '17px';
            icon.style.borderRadius = '50%';
            icon.style.position = 'relative';
            icon.style.margin = '1px 7.5px 1px 0px'; // 紧凑：缩小圆圈本身的上下外边距
            icon.style.boxSizing = 'border-box';
            icon.style.display = 'flex';
            icon.style.alignItems = 'center';
            icon.style.justifyContent = 'center';
            icon.style.border = '1px solid #45a049';
            icon.style.boxShadow = 'inset 0 1px 1px rgba(255,255,255,0.2), 0 1px 2px rgba(0,0,0,0.1)';

            if (SegmentedIconInfo.length === 1) {
                icon.style.background = SegmentedIconInfo[0].color;
            } else {
                icon.style.background = SegmentedIconInfo[1].color;
                icon.style.zIndex = '0';
                const angle = SegmentedIconInfo[0].percentage * 3.6;
                const r = parseInt(icon.style.width) / 2 - 1;
                const fanShape = this.createFanShape(r, angle, SegmentedIconInfo[0].color);
                icon.appendChild(fanShape);
            }
            if (slot.user_id === userId) this.addPlayerMarker(icon);
            if (slot.item_requirement) this.addToolMark(slot, icon);

            this.handleMouseHover(slot, icon, SegmentedIconInfo);
            return icon;
        }

        createFanShape(r, angle, color) {
            const fanShape = Utils.drawASectorShape(r, 0, angle, true, color);
            fanShape.style.position = 'absolute';
            fanShape.style.width = '100%';
            fanShape.style.height = '100%';
            fanShape.style.zIndex = '1';
            return fanShape;
        }

        handleMouseHover(slot, icon, SegmentedIconInfo) {
            icon.addEventListener('mouseover', () => {
                const fanShape = icon.querySelector('path');
                icon.style.transform = 'scale(1.1)';
                icon.style.transition = 'all 0.2s ease';
                icon.style.boxShadow = slot.user
                    ? 'inset 0 1px 2px rgba(255,255,255,0.3), 0 2px 4px rgba(0,0,0,0.2)'
                    : 'inset 0 1px 2px rgba(255,255,255,0.2), 0 2px 4px rgba(0,0,0,0.2)';
                if (fanShape) {
                    fanShape.style.transform = 'scale(1.1)';
                    fanShape.style.boxShadow = 'inset 0 1px 2px rgba(255,255,255,0.3), 0 2px 4px rgba(0,0,0,0.2)';
                }
            });

            icon.addEventListener('mouseout', () => {
                const fanShape = icon.querySelector('path');
                icon.style.transform = 'scale(1)';
                icon.style.boxShadow = slot.user
                    ? 'inset 0 1px 1px rgba(255,255,255,0.2), 0 1px 2px rgba(0,0,0,0.1)'
                    : 'inset 0 1px 1px rgba(255,255,255,0.1), 0 1px 2px rgba(0,0,0,0.1)';
                if (fanShape) {
                    fanShape.style.transform = 'scale(1)';
                    fanShape.style.boxShadow = 'inset 0 1px 1px rgba(255,255,255,0.1), 0 1px 2px rgba(0,0,0,0.1)';
                }
            });

            const tooltip = document.createElement('div');
            tooltip.style.position = 'fixed';
            tooltip.style.visibility = 'hidden';
            tooltip.style.backgroundColor = 'rgba(40, 40, 40, 0.95)';
            tooltip.style.color = '#fff';
            tooltip.style.padding = '8px 12px';
            tooltip.style.borderRadius = '4px';
            tooltip.style.fontSize = '12px';
            tooltip.style.lineHeight = '1.4';
            tooltip.style.whiteSpace = 'nowrap';
            tooltip.style.zIndex = '1000';
            tooltip.style.boxShadow = '0 2px 8px rgba(0,0,0,0.2)';
            tooltip.style.transform = 'translateY(-5px)';
            tooltip.style.transition = 'all 0.2s ease';

            let tooltipContent = slot.user
                ? `<div style="font-weight:500">${slot.user_id} 在这</div>`
                : '<div style="color:#aaa">空位</div>';

            if (SegmentedIconInfo.length === 2) {
                let totalSeconds = (24 - (SegmentedIconInfo[0].percentage/100 * 24)) * 3600;
                const timeDiv = document.createElement('div');
                timeDiv.style.marginTop = '4px';
                timeDiv.style.paddingTop = '4px';
                timeDiv.style.borderTop = '1px solid rgba(255,255,255,0.1)';
                timeDiv.id = 'time-div';

                const updateTime = (timeElement) => {
                    const hours = Math.floor(totalSeconds/3600);
                    const minutes = Math.floor((totalSeconds % 3600) / 60);
                    const seconds = Math.floor(totalSeconds % 60);
                    timeElement.textContent = `${hours}:${minutes.toString().padStart(2,'0')}:${seconds.toString().padStart(2,'0')} 后完成`;
                    tooltipContent += timeElement.outerHTML;
                };
                updateTime(timeDiv);

                let intervalId;
                icon.addEventListener('mouseenter', () => {
                    intervalId = setInterval(() => {
                        totalSeconds -= 1;
                        if (totalSeconds <= 0) {
                            clearInterval(intervalId);
                            return;
                        }
                        const timeElement = tooltip.querySelector('#time-div');
                        if (timeElement) updateTime(timeElement);
                    }, 1000);
                });

                icon.addEventListener('mouseleave', () => {
                    if (intervalId) {
                        clearInterval(intervalId);
                        intervalId = null;
                    }
                });
            }
            else if (SegmentedIconInfo[0].color === '#5cb85c') {
                tooltipContent += `<div style="margin-top:4px;padding-top:4px;border-top:1px solid rgba(255,255,255,0.1)">已完成</div>`;
            } else if (SegmentedIconInfo[0].color === '#FFC107') {
                tooltipContent += `<div style="margin-top:4px;padding-top:4px;border-top:1px solid rgba(255,255,255,0.1)">未开始</div>`;
            } else if (SegmentedIconInfo[0].color === '#a4a4a4') {
                tooltipContent += `<div style="margin-top:4px;padding-top:4px;border-top:1px solid rgba(255,255,255,0.1)">待加入</div>`;
            }

            if (slot.item_requirement) {
                if (slot.isEmptySolt()) {
                    tooltipContent += `<div style="margin-top:4px;padding-top:4px;border-top:1px solid rgba(255,255,255,0.1)"><span style="color:#FFA000">⚠</span> 需要工具</div>`;
                } else {
                    if (slot.hasTool()) {
                        tooltipContent += `<div style="margin-top:4px;padding-top:4px;border-top:1px solid rgba(255,255,255,0.1)"><span style="color:green">✅</span> 有工具</div>`;
                    } else {
                        tooltipContent += `<div style="margin-top:4px;padding-top:4px;border-top:1px solid rgba(255,255,255,0.1)"><span style="color:red">❌</span> 没有工具</div>`;
                    }
                }
            }
            tooltip.innerHTML = tooltipContent;

            icon.addEventListener('mouseenter', (e) => {
                tooltip.style.visibility = 'visible';
                tooltip.style.opacity = '1';
                tooltip.style.transform = 'translateY(0)';
                const rect = icon.getBoundingClientRect();
                const tooltipHeight = tooltip.offsetHeight;
                const topPosition = Math.max(10, rect.top - tooltipHeight - 10);
                tooltip.style.left = rect.left + 'px';
                tooltip.style.top = topPosition + 'px';
            });

            icon.addEventListener('mouseleave', () => {
                tooltip.style.visibility = 'hidden';
                tooltip.style.opacity = '0';
                tooltip.style.transform = 'translateY(-5px)';
            });

            document.body.appendChild(tooltip);
        }

        addPlayerMarker(icon) {
            const marker = document.createElement('span');
            marker.innerHTML = '★';
            marker.style.color = 'white';
            marker.style.fontSize = '10px';
            marker.style.textShadow = '0 0 1px #000';
            marker.style.zIndex = '2';
            icon.appendChild(marker);
        }

        addToolMark(slot, icon) {
            const toolMark = document.createElement('div');
            toolMark.style.position = 'absolute';
            toolMark.style.bottom = '0';
            toolMark.style.right = '0';
            toolMark.style.width = '6px';
            toolMark.style.height = '6px';
            toolMark.style.borderRadius = '50%';
            toolMark.style.transform = 'translate(25%, 25%)';
            if (slot.isEmptySolt()) {
                toolMark.style.backgroundColor = '#FFC107';
            } else {
                toolMark.style.backgroundColor = slot.hasTool() ? 'green' : 'red';
            }
            icon.appendChild(toolMark);
        }

        createNotInOCContainer() {
            const container = document.createElement('div');
            container.style.display = 'flex';
            container.style.alignItems = 'center';
            container.style.gap = '5px';
            container.style.backgroundColor = '#F44336';
            container.style.padding = '1px 8px'; // 紧凑：缩小上下内边距
            container.style.borderRadius = '3px';
            container.style.marginBottom = '2px'; // 紧凑：缩小与下面元素的距离
            return container;
        }

        createTextSpan() {
            const textSpan = document.createElement('span');
            textSpan.textContent = '未加入oc，';
            textSpan.style.fontSize = '12px';
            textSpan.style.color = 'white';
            return textSpan;
        }

        createJoinLink() {
            const joinLink = document.createElement('a');
            joinLink.textContent = '去看看';
            joinLink.href = `https://www.torn.com/factions.php?step=your#/tab=crimes`;
            joinLink.style.color = 'white';
            joinLink.style.textDecoration = 'underline';
            joinLink.style.fontSize = '13px';
            joinLink.style.fontWeight = 'bold';
            joinLink.style.textShadow = '0 0 1px rgba(255, 255, 255, 0.5)';
            joinLink.style.letterSpacing = '0.5px';

            joinLink.addEventListener('mouseover', () => {
                joinLink.style.textShadow = '0 0 2px rgba(255, 255, 255, 0.8)';
                joinLink.style.transition = 'all 0.2s ease';
            });
            joinLink.addEventListener('mouseout', () => {
                joinLink.style.textShadow = '0 0 1px rgba(255, 255, 255, 0.5)';
            });
            return joinLink;
        }
    }

    // =============== 主程序类 ===============
    class OCFacilitation {
        constructor() {
            this.currentTab = null;
            this.isUpdating = false;
            this.observer = null;
            this.statusIconManager = null;
        }

        async handlePageChange() {
            if (!Utils.isFactionPage() || !Utils.isOCPage()) {
                this.cleanup();
                return;
            }

            try {
                const container = await Utils.waitForWrapper();
                await this.handleInitialUIUpdate(container);

                if (!this.observer) this.setupObserver(container);
            } catch (error) {
                console.error('处理页面变化失败:', error);
            }
        }

        async handleInitialUIUpdate(container) {
            await new Promise(resolve => setTimeout(resolve, CONFIG.UI.LOAD_DELAY));
            await this.updateCrimeListUI(container);
        }

        async updateCrimeListUI(container) {
            if (this.isUpdating) return;
            try {
                this.isUpdating = true;
                CrimeUIManager.updateAllCrimesUI(container);
            } finally {
                this.isUpdating = false;
            }
        }

        setupObserver(container) {
            this.observer = new MutationObserver(Utils.debounce((mutations) => {
                const hasChildrenChanges = mutations.some(mutation =>
                    mutation.type === 'childList' && mutation.target === container
                );

                if (hasChildrenChanges) {
                    this.updateCrimeListUI(container).catch(error => console.error('更新犯罪任务UI失败:', error));
                }
            }, CONFIG.UI.UPDATE_DEBOUNCE));

            this.observer.observe(container, { childList: true, subtree: false, attributes: false, characterData: false });
        }

        cleanup() {
            if (this.observer) {
                this.observer.disconnect();
                this.observer = null;
            }
            this.isUpdating = false;
        }

        getStatusContainerParent() {
            if (Utils.isMobileDevice()) {
                return document.querySelector(CONFIG.UI.SELECTORS.MOBILE_INFO);
            } else {
                const topIcons = document.querySelector(CONFIG.UI.SELECTORS.STATUS_ICONS);
                return topIcons ? topIcons.parentNode : null;
            }
        }

        createStatusContainer() {
            const containerParent = this.getStatusContainerParent();
            if (!containerParent) {
                return null;
            }
            this.removeOldContainer();
            const container = document.createElement('div');
            container.style.display = 'flex';
            container.style.flexDirection = 'column';
            container.style.height = 'auto'; // 紧凑：移除原先固定的 32px
            container.style.minHeight = '20px'; // 设定最小自适应高度
            container.style.marginTop = '2px'; // 紧凑：从 10px 降到 2px
            container.id = 'oc-status-container';

            if (Utils.isMobileDevice()) {
                container.style.margin = '2px 15px'; // 紧凑：移动端的 margin 也同步调小
                container.style.width = 'calc(100% - 30px)';
            }

            containerParent.appendChild(container);
            return container;
        }

        removeOldContainer() {
            const oldContainer = document.getElementById('oc-status-container');
            if (oldContainer) oldContainer.remove();
        }

        async initialize() {
            try {
                this.statusIconManager = new StatusIconManager();
                // 不再在此处强制等待 getPlayerId，交给 updateStatusIcons 处理
                await this.setupStatusIcons();
                this.setupPageChangeListeners();
            } catch (error) {
                console.error('初始化失败:', error);
            }
        }

        async setupStatusIcons() {
            this.statusIconManager.updateStatusIcons();
        }

        setupPageChangeListeners() {
            window.addEventListener('hashchange', () => this.handlePageChange());
            if (document.readyState === 'complete') {
                this.handlePageChange();
            } else {
                window.addEventListener('load', () => this.handlePageChange());
            }
        }
    }

    // 启动程序
    (() => {
        const app = new OCFacilitation();
        const createStatusContainerInterval = setInterval(() => {
            if (app.createStatusContainer() !== null) {
                console.log("状态容器创建成功");
                app.initialize();
                clearInterval(createStatusContainerInterval);
            }
        },300);

        window.addEventListener('unload', () => { app.cleanup(); });
    })();
})();