// ==UserScript==
// @name         OCFacilitation
// @namespace    https://greasyfork.org/users/[daluo]
// @version      1.0.5.5
// @description  Make OC 2.0 easier for regular players
// @description:zh-CN  使普通玩家oc2.0更简单和方便
// @author       daluo
// @match        https://www.torn.com/*
// @run-at       document-start
// @grant        GM_xmlhttpRequest
// // @connect      *
// @license      MIT
// @updateURL    https://raw.githubusercontent.com/zmpress/game_script/refs/heads/main/porn_city/userscript/OCFacilitation.js
// @downloadURL    https://raw.githubusercontent.com/zmpress/game_script/refs/heads/main/porn_city/userscript/OCFacilitation.js

// ==/UserScript==

(function() {
    'use strict';

    // =============== 常量定义 ===============
    const DEFAULT_API_KEY = "不使用冰蛙的大佬,替换成自己的apiKey,limit就可以";
    // =============== 配置管理 ===============
    const CONFIG = {
        USER_ID: '',
        API: {
            KEY: localStorage.getItem("APIKey") || DEFAULT_API_KEY,
            BASE_URL: 'http://121.37.11.27:4321',
            ENDPOINTS: {
                CRIMES: '/faction/crimes',
            },
            HEADERS: {
                'Content-Type': 'application/json'
            }
        },
        UI: {
            LOAD_DELAY: 300,
            UPDATE_DEBOUNCE: 500,
            TIME_TOLERANCE: 2,
            SELECTORS: {
                WRAPPER: '.wrapper___U2Ap7',
                SLOTS: '.wrapper___Lpz_D',
                WAITING: '.waitingJoin___jq10k',
                TITLE: '.title___pB5FU',
                PANEL_TITLE: '.panelTitle___aoGuV',
                MOBILE_INFO: '.user-information-mobile___WjXnd'
            },
            STYLES: {
                URGENT: {
                    BORDER: '3px solid red',
                    COLOR: 'red'
                },
                STABLE: {
                    BORDER: '3px solid green',
                    COLOR: 'green'
                },
                EXCESS: {
                    BORDER: '3px solid yellow',
                    COLOR: 'blue'
                }
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
        /**
         * 获取当前页签名称
         * @returns {string|null} 页签名称
         */
        static getCurrentTab() {
            const match = window.location.hash.match(/#\/tab=([^&]*)/);
            return match ? match[1] : null;
        }

        /**
         * 检查当前页面是否为OC页面
         * @returns {boolean}
         */
        static isOCPage() {
            return this.getCurrentTab() === 'crimes';
        }

        /**
         * 检查是否为移动端
         * @returns {boolean}
         */
        static isMobileDevice() {
            return !!document.querySelector(CONFIG.UI.SELECTORS.MOBILE_INFO);
        }

        /**
         * 获取当前时间戳（秒）
         * @returns {number}
         */
        static getNow() {
            return Math.floor(Date.now() / 1000);
        }

        /**
         * 防抖函数
         * @param {Function} func - 需要防抖的函数
         * @param {number} wait - 等待时间（毫秒）
         */
        static debounce(func, wait) {
            let timeout;
            return function executedFunction(...args) {
                clearTimeout(timeout);
                timeout = setTimeout(() => func.apply(this, args), wait);
            };
        }

        /**
         * 检查URL是否包含factions.php
         * @returns {boolean} 是否为faction页面
         */
        static isFactionPage() {
            return window.location.pathname === '/factions.php';
        }

        /**
         * 等待元素出现
         * @param {string} selector - 选择器
         * @returns {Promise<Element>} - 元素
         */
        static waitForElement(selector) {
            return new Promise(resolve => {
                const element = document.querySelector(selector);
                if (element) return resolve(element);

                const observer = new MutationObserver(mutations => {
                    const element = document.querySelector(selector);
                    if (element) {
                        observer.disconnect();
                        resolve(element);
                    }
                });

                observer.observe(document.body, {
                    childList: true,
                    subtree: true
                });
            });
        }


        /**
         * 等待wrapper元素出现
         * @returns {Promise<Element>} - wrapper元素
         */
        static async waitForWrapper() {
            const maxAttempts = 10;
            const interval = 1000; // 1秒

            for (let attempts = 0; attempts < maxAttempts; attempts++) {
                const wrapper = document.querySelector(CONFIG.UI.SELECTORS.WRAPPER);
                if (wrapper?.parentNode) {
                    return wrapper.parentNode;
                }
                await this.delay(interval);
            }
            throw new Error('无法找到wrapper元素');
        }

        /**
         * 从天、小时、分钟、秒计算时间
         * @param {number} days - 天数
         * @param {number} hours - 小时数
         * @param {number} minutes - 分钟数
         * @param {number} seconds - 秒数
         * @returns {number} - 计算后的时间（秒）
         */
        static calculateTimeFromParts(days, hours, minutes, seconds) {
            return (days * CONFIG.TIME.SECONDS_PER_DAY) +
                (hours * 3600) +
                (minutes * 60) +
                seconds;
        }

        /**
         * 延迟函数
         * @param {number} ms - 延迟时间（毫秒）
         * @returns {Promise} - 延迟后的Promise
         */
        static delay(ms) {
            return new Promise(resolve => setTimeout(resolve, ms));
        }

        /**
         * 绘制一个扇形
         * @param {number} r - 半径
         * @param {number} startAngle - 起始角度
         * @param {number} angle - 角度
         * @param {boolean} clockwise - 是否顺时针
         * @param {string} color - 颜色
         * @returns {SVGSVGElement} - 绘制的扇形
         */
        static drawASectorShape(r, startAngle, angle, clockwise = true, color = '#5cb85c') {
            // 计算结束角度
            const endAngle = clockwise ? startAngle + angle : startAngle - angle;

            // 创建 SVG 元素
            const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
            svg.setAttribute('version', '1.1');
            svg.style.width = `${r * 2}px`;
            svg.style.height = `${r * 2}px`;
            svg.style.display = 'block';
            svg.setAttribute('viewBox', `0 0 ${r * 2} ${r * 2}`);
            svg.style.boxSizing = 'border-box';
            // 将角度转换为弧度
            const startRad = ((startAngle - 90) * Math.PI) / 180; // 从12点钟方向开始
            const endRad = ((endAngle - 90) * Math.PI) / 180;

            // 计算圆心坐标
            const cx = r;
            const cy = r;

            // 计算起点和终点坐标
            const x1 = cx + r * Math.cos(startRad);
            const y1 = cy + r * Math.sin(startRad);
            const x2 = cx + r * Math.cos(endRad);
            const y2 = cy + r * Math.sin(endRad);

            // 创建路径
            const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
            path.style.boxSizing = 'border-box';
            const largeArcFlag = angle <= 180 ? '0' : '1'; // 根据角度范围设置 largeArcFlag
            const sweepFlag = clockwise ? '1' : '0'; // 根据 clockwise 设置 sweepFlag
            path.setAttribute('d', `M ${cx},${cy} L ${x1},${y1} A ${r},${r} 0 ${largeArcFlag},${sweepFlag} ${x2},${y2} Z`);
            path.setAttribute('fill', color);

            svg.appendChild(path);
            return svg;
        }
    }

    // =============== 数据模型 ===============
    /**
     * 任务物品需求类
     */
    class ItemRequirement {
        constructor({ id, is_reusable, is_available }) {
            this.id = id;
            this.is_reusable = is_reusable;
            this.is_available = is_available;
        }
    }

    /**
     * 用户信息类
     */
    class User {
        constructor(data) {
            if (!data) return null;
            this.id = data.id;
            this.joined_at = data.joined_at;
            this.progress = data.progress;
            this.outcome = data.outcome;
        }
    }

    /**
     * 任务槽位类
     */
    class Slot {
        constructor(data) {
            this.position = data.position;
            this.item_requirement = data.item_requirement ? new ItemRequirement(data.item_requirement) : null;
            this.user = data.user ? new User(data.user) : null;
            this.user_id = this.user?.id;
            this.success_chance = data.success_chance;
        }
        // 是否有玩家
        isEmptySolt(){
            return this.user_id === null;
        }

        /**
         * 检查玩家是否有工具
         */
        hasTool() {
            if (this.item_requirement === null) return false;
            return this.item_requirement.is_available;
        }

    }

    // 定义犯罪任务信息
    class Crime {
        constructor(data) {
            Object.assign(this, {
                id: data.id,
                name: data.name,
                difficulty: data.difficulty,
                status: data.status,
                created_at: data.created_at,
                initiated_at: data.initiated_at,
                ready_at: data.ready_at,
                expired_at: data.expired_at,
                slots: data.slots.map(slot => new Slot(slot)),
                rewards: data.rewards,
                element: null
            });
        }

        setElement(element) {
            this.element = element;
        }

        getSoltNum() {
            return this.slots.length;
        }

        getEmptycNum() {
            return this.slots.filter(slot => slot.user_id === null).length;
        }

        getCurrentExtraTime() {
            return this.ready_at === null ? 0 : this.ready_at - Utils.getNow();
        }
        // 计算已准备的秒数
        getReadySeconds() {
            return this.getSoltNum()*60*60*24-(this.getCurrentExtraTime()+this.getEmptycNum()*60*60*24)
        }
        // 计算已完成人数
        getCompletedNum() {
            return this.getReadySeconds()/60/60/24
        }
        // 判断crime是否缺人
        isMissingUser() {
            return this.ready_at !== null && this.getCurrentExtraTime() / 3600 <= CONFIG.TIME.URGENT_THRESHOLD && !this.isFullyStaffed();
        }
        // 判断任务是否有人
        isUserd() {
            return this.getEmptycNum() !== this.getSoltNum();
        }

        // 判断任务是否满人
        isFullyStaffed() {
            return this.getEmptycNum() === 0;
        }

        // 获取DOM信息
        static getDOMInfo(element) {
            return {
                totalSlots: element.querySelectorAll(CONFIG.UI.SELECTORS.SLOTS).length,
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
        /**
         * 更新所有犯罪任务的UI
         * @param {HTMLElement} crimeListContainer - 犯罪任务列表容器
         */
        static updateAllCrimesUI(crimeListContainer) {
            if (!crimeListContainer) return;

            // 更新所有crime的UI
            Array.from(crimeListContainer.children).forEach(element => {
                this.updateSingleCrimeUI(element);
            });

            // 如果排序按钮不存在则添加排序按钮
            const sortButtonSet = crimeListContainer.parentElement.getElementsByClassName('sort-button');
            console.log(crimeListContainer.parentElement,sortButtonSet);

            if (sortButtonSet.length === 0) {
                this.addSortButton(crimeListContainer);
            }
        }

        static addSortButton(crimeListContainer) {
            const sortButton = document.createElement('button');
            sortButton.textContent = '按等级排序';
            sortButton.style.margin = '10px 0';
            sortButton.style.padding = '8px 16px';
            sortButton.style.border = 'none';
            sortButton.style.borderRadius = '4px';
            sortButton.style.backgroundColor = '#007bff';
            sortButton.style.color = '#fff';
            sortButton.style.fontWeight = '500';
            sortButton.style.cursor = 'pointer';
            sortButton.style.transition = 'all 0.2s ease';
            sortButton.style.boxShadow = '0 1px 2px rgba(0,0,0,0.1)';
            sortButton.style.letterSpacing = '0.3px';
            sortButton.style.fontSize = '14px';
            sortButton.style.display = 'block';
            sortButton.style.width = '100%';
            sortButton.style.textAlign = 'center';
            sortButton.style.textTransform = 'uppercase';
            sortButton.style.letterSpacing = '0.5px';
            sortButton.style.marginTop = '10px';
            sortButton.style.marginBottom = '10px';
            sortButton.addEventListener('click', () => this.sortCrimesByLevel(crimeListContainer));
            sortButton.classList.add('sort-button');
            crimeListContainer.before(sortButton);
        }

        /**
         * 排序犯罪任务
         * @param {HTMLElement} crimeListContainer - 犯罪任务列表
         */
        static sortCrimesByLevel(crimeListContainer) {
            // 获取并排序所有crime元素
            const sortedElements = Array.from(crimeListContainer.children)
                .sort((a, b) => {
                    const aLevel = parseInt(a.querySelector('.levelValue___TE4qC')?.textContent || '0');
                    const bLevel = parseInt(b.querySelector('.levelValue___TE4qC')?.textContent || '0');
                    return bLevel - aLevel;
                });

            // 重新添加排序后的元素
            sortedElements.forEach(element => {
                crimeListContainer.appendChild(element);
            });
        }
        /**
         * 更新单个犯罪任务的UI
         * @param {HTMLElement} element - 犯罪任务元素
         */
        static updateSingleCrimeUI(element) {
            const crimeNameEl = element.querySelector(CONFIG.UI.SELECTORS.PANEL_TITLE);
            if (!crimeNameEl) return;

            // 获取 DOM 信息
            const { totalSlots, emptySlots } = Crime.getDOMInfo(element);
            const currentUsers = totalSlots - emptySlots;

            // 计算剩余时间
            const readyAt = Crime.calculateReadyAtTime(element);
            const now = Utils.getNow();
            const extraTimeHours = readyAt ? (readyAt - now) / 3600 : 0;

            // 清除旧的 UI
            this.clearUI(element, crimeNameEl);

            // 添加新的状态信息
            if (currentUsers > 0) {
                this.addStatusInfo(element, crimeNameEl, {
                    currentUsers,
                    totalSlots,
                    extraTimeHours,
                    isFullyStaffed: emptySlots === 0
                });
            }
        }

        /**
         * 清除UI样式
         */
        static clearUI(element, crimeNameEl) {
            element.style.color = '';
            element.style.border = '';
            crimeNameEl.querySelectorAll('span[data-oc-ui]').forEach(span => span.remove());
        }

        /**
         * 添加状态信息
         */
        static addStatusInfo(element, crimeNameEl, stats) {
            const { currentUsers, totalSlots, extraTimeHours, isFullyStaffed } = stats;

            const statusSpan = document.createElement('span');
            statusSpan.setAttribute('data-oc-ui', 'status');
            statusSpan.textContent = `当前${currentUsers}人,共需${totalSlots}人。`;

            this.applyStatusStyle(element, statusSpan, extraTimeHours, isFullyStaffed);

            crimeNameEl.appendChild(document.createTextNode(' '));
            crimeNameEl.appendChild(statusSpan);
        }

        /**
         * 应用状态样式
         */
        static applyStatusStyle(element, statusSpan, extraTimeHours, isFullyStaffed) {
            // 基础样式
            statusSpan.style.padding = '4px 8px';
            statusSpan.style.borderRadius = '4px';
            statusSpan.style.fontWeight = '500';
            statusSpan.style.display = 'inline-block';
            statusSpan.style.boxShadow = '0 1px 2px rgba(0,0,0,0.1)';
            statusSpan.style.transition = 'all 0.2s ease';
            statusSpan.style.letterSpacing = '0.3px';

            // 检查是否为移动端
            const isMobile = Utils.isMobileDevice();
            statusSpan.style.fontSize = isMobile ? '10px' : '12px';

            if (extraTimeHours <= CONFIG.TIME.URGENT_THRESHOLD && !isFullyStaffed) {
                // 紧急状态
                element.style.border = CONFIG.UI.STYLES.URGENT.BORDER;
                statusSpan.style.background = 'linear-gradient(135deg, #ff4d4d 0%, #e60000 100%)';
                statusSpan.style.color = '#fff';
                statusSpan.style.border = '1px solid #cc0000';
                statusSpan.style.boxShadow = '0 1px 3px rgba(255,0,0,0.2)';

                const hours = Math.floor(extraTimeHours);
                const minutes = Math.floor((extraTimeHours % 1) * 60);
                statusSpan.innerHTML = isMobile
                    ? `<span style="font-size:11px">⚠</span> ${hours}h${minutes}m`
                    : `<span style="font-size:14px;margin-right:4px">⚠</span>急需人手！还剩<strong style="font-weight:600">${hours}小时${minutes}分</strong>`;

            } else if (extraTimeHours <= CONFIG.TIME.STABLE_THRESHOLD) {
                // 稳定状态
                element.style.border = CONFIG.UI.STYLES.STABLE.BORDER;
                statusSpan.style.background = 'linear-gradient(135deg, #4CAF50 0%, #45a049 100%)';
                statusSpan.style.color = '#fff';
                statusSpan.style.border = '1px solid #3d8b40';
                statusSpan.style.boxShadow = '0 1px 3px rgba(0,255,0,0.1)';

                statusSpan.innerHTML = isMobile
                    ? `<span style="font-size:11px">✓</span> 配置正常`
                    : `<span style="font-size:14px;margin-right:4px">✓</span>人员配置合理`;

            } else {
                const extraUsers = Math.floor(extraTimeHours/24) - 1;
                if (extraUsers > 0) {
                    // 人员过剩状态
                    element.style.border = CONFIG.UI.STYLES.EXCESS.BORDER;
                    statusSpan.style.background = 'linear-gradient(135deg, #2196F3 0%, #1976D2 100%)';
                    statusSpan.style.color = '#fff';
                    statusSpan.style.border = '1px solid #1565C0';
                    statusSpan.style.boxShadow = '0 1px 3px rgba(0,0,255,0.1)';

                    statusSpan.innerHTML = isMobile
                        ? `<span style="font-size:11px">ℹ</span> 可调${extraUsers}人`
                        : `<span style="font-size:14px;margin-right:4px">ℹ</span>可调配 <strong style="font-weight:600">${extraUsers}</strong> 人至其他OC`;
                } else {
                    // 稳定状态
                    element.style.border = CONFIG.UI.STYLES.STABLE.BORDER;
                    statusSpan.style.background = 'linear-gradient(135deg, #4CAF50 0%, #45a049 100%)';
                    statusSpan.style.color = '#fff';
                    statusSpan.style.border = '1px solid #3d8b40';
                    statusSpan.style.boxShadow = '0 1px 3px rgba(0,255,0,0.1)';

                    statusSpan.innerHTML = isMobile
                        ? `<span style="font-size:11px">✓</span> 配置正常`
                        : `<span style="font-size:14px;margin-right:4px">✓</span>人员配置合理`;
                }
            }

            // 添加悬停效果
            statusSpan.addEventListener('mouseover', () => {
                statusSpan.style.transform = 'translateY(-1px)';
                statusSpan.style.boxShadow = statusSpan.style.boxShadow.replace('3px', '4px');
            });

            statusSpan.addEventListener('mouseout', () => {
                statusSpan.style.transform = 'translateY(0)';
                statusSpan.style.boxShadow = statusSpan.style.boxShadow.replace('4px', '3px');
            });
        }
    }

    // =============== API管理类 ===============
    class APIManager {
        /**
         * 发送HTTP请求的通用方法
         * @param {string} endpoint - API端点
         * @param {Object} options - 请求选项
         * @returns {Promise<Object>} 响应数据
         */
        static async request(options = {}) {
            return new Promise((resolve, reject) => {
                GM_xmlhttpRequest({
                    ...options,
                    onload: function(response) {
                        if (response.status === 200) {
                            resolve(response);
                        } else {
                            reject(new Error(`HTTP Error: ${response.status}`));
                        }
                    },
                    onerror: function(error) {
                        reject(error);
                    }
                });
            });
        }

        /**
         * 从API获取最新的犯罪数据
         * @returns {Promise<Object>} 犯罪数据
         * @throws {Error} 当API请求失败时抛出错误
         */
        static async getCrimeData() {
            try {
                const crimeData = localStorage.getItem('crimeData');
                const currentTime = Date.now();
                const cacheExpirationTime = 60 * 1000; // 1分钟

                // 如果缓存未过期，则直接返回缓存数据
                if (crimeData && (currentTime - JSON.parse(crimeData).last_fetched_time) < cacheExpirationTime) {
                    const data = JSON.parse(crimeData);
                    return {
                        crimes: data.crimes.map(crime => new Crime(crime)),
                    };
                }

                // 如果缓存过期，则重新获取数据
                const response = await this.request({
                    url: `${CONFIG.API.BASE_URL}${CONFIG.API.ENDPOINTS.CRIMES}?user_id=${CONFIG.USER_ID}`,
                    method: 'GET',
                    headers: CONFIG.API.HEADERS
                });
                const data = JSON.parse(response.responseText);
                // 缓存数据
                localStorage.setItem('crimeData', JSON.stringify({
                    ...data,
                    last_fetched_time: currentTime
                }));
                return { crimes: data.crimes.map(crime => new Crime(crime)) };
            } catch (error) {
                console.error('获取犯罪数据失败:', error);
                throw error;
            }
        }

        /**
         * 从Torn API获取玩家基本信息
         * @returns {Promise<Object>} 玩家信息
         */
        static async fetchPlayerInfo() {
            try {
                const response = await fetch(`https://api.torn.com/user/?selections=basic&key=${CONFIG.API.KEY}`);
                const data = await response.json();
                if (data.error) {
                    throw new Error(`API错误: ${data.error.error}`);
                }

                return data;
            } catch (error) {
                console.error('获取玩家信息失败:', error);
                throw error;
            }
        }
    }

    // =============== 状态图标管理类 ===============
    class StatusIconManager {
        constructor(crimeInfo) {
            this.crimeInfo = crimeInfo;
        }

        /**
         * 更新状态图标
         */
        updateStatusIcons(userId) {
            // 获取状态容器
            const ocStatusContainer = document.getElementById('oc-status-container');
            if (!ocStatusContainer) {
                console.error('未找到状态容器');
                return;
            };

            // 🧹 清空旧的内容
            ocStatusContainer.innerHTML = '';


            const userCrime = this.findUserCrime(userId);
            if (userCrime) {
                this.renderParticipatingStatus(ocStatusContainer, userCrime,userId);
            } else {
                this.renderNonParticipatingStatus(ocStatusContainer);
            }
        }

        /**
         * 查找用户参与的犯罪任务
         */
        findUserCrime(userId) {
            return this.crimeInfo.crimes.find(crime =>
                crime.slots.some(slot => slot.user_id === userId)
            );
        }

        /**
         * 渲染参与中的状态
         */
        renderParticipatingStatus(container, userCrime,userId) {
            const slotIcons = this.createSlotIconsContainer();

            // 添加点击事件，跳转到对应的OC任务
            slotIcons.style.cursor = 'pointer';
            slotIcons.addEventListener('click', () => {
                window.location.href = `https://www.torn.com/factions.php?step=your#/tab=crimes&crimeId=${userCrime.id}`;
            });

            // 对 slots 进行排序
            const sortedSlots = userCrime.slots.sort((a, b) => {
                if (a.user_id && b.user_id) {
                    return a.user.joined_at - b.user.joined_at; // 假设 user 对象中有 joined_at 属性
                }
                return a.user_id ? -1 : 1; // 有玩家的 slot 排在前面
            });
            const speedOfProgress = userCrime.getCompletedNum();

            // 使用文档片段来减少 DOM 操作
            const fragment = document.createDocumentFragment();
            sortedSlots.forEach((slot, index) => {
                const SegmentedIconInfo = this.getSegmentedIconInfo(slot, speedOfProgress, index);
                const icon = this.createSlotIcon(slot, SegmentedIconInfo,userId);
                fragment.appendChild(icon);
            });
            slotIcons.appendChild(fragment);
            container.appendChild(slotIcons);
        }

        /**
         * 分段图标信息
         * @param {Object} slot - 犯罪任务插槽信息
         * @param {number} speedOfProgress - 犯罪任务进度
         * @param {number} index - 插槽索引
         * @returns {Object} - 分段图标信息
         */
        getSegmentedIconInfo(slot,speedOfProgress,index) {
            let SegmentedIconInfo = new Array()
            // 根据 speedOfProgress 设置颜色
            // 是否有用户
            if (slot.user_id) {
                // 判断该solt状态，未开始 进行中 已完成
                if (slot.user.progress === 0) {
                    // 未开始
                    SegmentedIconInfo.push({color:'#FFC107',percentage:100})
                } else if (slot.user.progress === 100) {
                    // 已完成
                    SegmentedIconInfo.push({color:'#5cb85c',percentage:100})
                } else {
                    // 进行中
                    const completionPercentage = speedOfProgress % 1; // 获取小数部分
                    SegmentedIconInfo.push({color:'#5cb85c',percentage:completionPercentage * 100})          // 绿色部分
                    SegmentedIconInfo.push({color:'#FFC107',percentage:(1-completionPercentage) * 100})          // 黄色部分
                }

            } else {
                // 没有用户
                SegmentedIconInfo.push({color:'#a4a4a4',percentage:100})
            }

            // if (index < Math.floor(speedOfProgress)) {
            //     // 完全完成的 slot
            //     SegmentedIconInfo.push({color:'#5cb85c',percentage:100})
            // } else if (index === Math.floor(speedOfProgress)) {
            //     // 部分完成的 slot
            //     const completionPercentage = speedOfProgress % 1; // 获取小数部分
            //     SegmentedIconInfo.push({color:'#5cb85c',percentage:completionPercentage * 100})          // 绿色部分
            //     SegmentedIconInfo.push({color:'#FFC107',percentage:(1-completionPercentage) * 100})          // 黄色部分
            // } else if (slot.user_id) {
            //     // 有用户但未开始的 slot
            //     SegmentedIconInfo.push({color:'#FFC107',percentage:100})
            // } else {
            //     // 没有用户的 slot
            //     SegmentedIconInfo.push({color:'#a4a4a4',percentage:100})
            // }
            return SegmentedIconInfo;
        }

        /**
         * 渲染未参与的状态
         */
        renderNonParticipatingStatus(container) {
            // 创建未参与的容器
            const notInOCContainer = this.createNotInOCContainer();
            // 创建提示文本
            const textSpan = this.createTextSpan();
            // 查找最佳可用的犯罪任务
            const targetCrime = this.findBestAvailableCrime();
            // 创建加入链接
            const joinLink = this.createJoinLink(targetCrime?.id || '');

            // 将提示文本和加入链接添加到未参与的容器
            notInOCContainer.appendChild(textSpan);
            notInOCContainer.appendChild(joinLink);
            // 将未参与的容器添加到状态容器
            container.appendChild(notInOCContainer);
        }

        /**
         * 创建slot图标容器
         */
        createSlotIconsContainer() {
            const container = document.createElement('div');
            container.style.display = 'flex';
            container.style.alignItems = 'center';
            container.style.height = '17px';
            container.style.cursor = 'pointer';
            container.style.boxSizing = 'border-box';

            // 添加渐变背景和质感效果
            container.style.background = 'linear-gradient(to bottom, rgba(30,30,30,0.02) 0%, rgba(0,0,0,0.02) 100%)';
            container.style.border = '1px solid rgba(128, 128, 128, 0.2)';
            container.style.borderRadius = '3px';
            container.style.padding = '3px 5px 3px 0px';
            container.style.boxShadow = 'inset 0 1px 0 rgba(255,255,255,0.05), 0 1px 2px rgba(0,0,0,0.02)';

            // 添加鼠标悬浮效果
            container.addEventListener('mouseover', () => {
                container.style.background = 'linear-gradient(to bottom, rgba(30,30,30,0.04) 0%, rgba(0,0,0,0.04) 100%)';
                container.style.boxShadow = 'inset 0 1px 0 rgba(255,255,255,0.08), 0 1px 3px rgba(0,0,0,0.03)';
                container.style.transition = 'all 0.2s ease';
            });

            // 添加鼠标离开效果
            container.addEventListener('mouseout', () => {
                container.style.background = 'linear-gradient(to bottom, rgba(30,30,30,0.02) 0%, rgba(0,0,0,0.02) 100%)';
                container.style.boxShadow = 'inset 0 1px 0 rgba(255,255,255,0.05), 0 1px 2px rgba(0,0,0,0.02)';
            });
            return container;
        }

        /**
         * 创建slot图标
         */
        createSlotIcon(slot,SegmentedIconInfo,userId) {
            const icon = document.createElement('div');
            // 基础样式设置
            icon.style.width = '17px';
            icon.style.height = '17px';
            icon.style.borderRadius = '50%';
            icon.style.position = 'relative';
            icon.style.margin = '5px 7.5px 5px 0px';
            icon.style.boxSizing = 'border-box';
            icon.style.display = 'flex';
            icon.style.alignItems = 'center';
            icon.style.justifyContent = 'center';
            icon.style.border = '1px solid #45a049';
            icon.style.boxShadow = 'inset 0 1px 1px rgba(255,255,255,0.2), 0 1px 2px rgba(0,0,0,0.1)';
            icon.style.boxSizing = 'border-box';
            // 如果只有一个颜色段，直接设置背景色
            if (SegmentedIconInfo.length === 1) {
                icon.style.background = SegmentedIconInfo[0].color;
            } else {
                // 黄色圆圈未完成部分
                icon.style.background = SegmentedIconInfo[1].color;
                icon.style.zIndex = '0';

                // 绘制扇形
                const angle = SegmentedIconInfo[0].percentage * 3.6; // 指定角度
                const r = parseInt(icon.style.width) / 2 - 1;
                const fanShape = this.createFanShape(r,angle,SegmentedIconInfo[0].color);
                icon.appendChild(fanShape);
            }
            // 添加玩家标记
            if (slot.user_id === userId) {
                this.addPlayerMarker(icon);
            }
            // 如果需要工具，添加工具标记
            if (slot.item_requirement) {
                this.addToolMark(slot, icon);
            }

            // 处理鼠标悬浮
            this.handleMouseHover(slot,icon,SegmentedIconInfo);

            return icon;
        }

        /**
         * 创建扇形
         */
        createFanShape(r,angle,color) {
            const fanShape = Utils.drawASectorShape(r, 0, angle,true,color);
            fanShape.style.position = 'absolute';
            fanShape.style.width = '100%';
            fanShape.style.height = '100%';
            fanShape.style.zIndex = '1';
            return fanShape;
        }

        /**
         * 处理鼠标悬浮
         */
        handleMouseHover(slot,icon,SegmentedIconInfo) {
            // 添加悬停效果
            icon.addEventListener('mouseover', () => {
                const fanShape = icon.querySelector('path')
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
                const fanShape = icon.querySelector('path')
                icon.style.transform = 'scale(1)';
                icon.style.transition = 'all 0.2s ease';
                icon.style.boxShadow = slot.user
                    ? 'inset 0 1px 1px rgba(255,255,255,0.2), 0 1px 2px rgba(0,0,0,0.1)'
                    : 'inset 0 1px 1px rgba(255,255,255,0.1), 0 1px 2px rgba(0,0,0,0.1)';
                if (fanShape) {
                    fanShape.style.transform = 'scale(1)';
                    fanShape.style.boxShadow = 'inset 0 1px 1px rgba(255,255,255,0.1), 0 1px 2px rgba(0,0,0,0.1)';
                }
            });

            // 创建自定义tooltip
            const tooltip = document.createElement('div');
            tooltip.style.position = 'fixed';  // 改为 fixed 定位
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

            // 设置tooltip内容
            let tooltipContent = slot.user
                ? `<div style="font-weight:500">${slot.user_id} 在这</div>`
                : '<div style="color:#aaa">空位</div>';

            if (SegmentedIconInfo.length === 2) {
                // 该玩家正在准备
                let totalSeconds = (24 - (SegmentedIconInfo[0].percentage/100 * 24))*3600;
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

                // 在鼠标进入时开始计时
                icon.addEventListener('mouseenter', () => {
                    intervalId = setInterval(() => {
                        totalSeconds -= 1;
                        if (totalSeconds <= 0) {
                            clearInterval(intervalId);
                            return;
                        }
                        const timeElement = tooltip.querySelector('#time-div');
                        if (timeElement) {
                            updateTime(timeElement);
                        }
                    }, 1000);
                });

                // 在鼠标离开时清除计时器
                icon.addEventListener('mouseleave', () => {
                    if (intervalId) {
                        clearInterval(intervalId);
                        intervalId = null;
                    }
                });
            }
            else if (SegmentedIconInfo[0].color === '#5cb85c') {
                tooltipContent += `<div style="margin-top:4px;padding-top:4px;border-top:1px solid rgba(255,255,255,0.1)">
                    已完成
                </div>`;
            } else if (SegmentedIconInfo[0].color === '#FFC107') {
                tooltipContent += `<div style="margin-top:4px;padding-top:4px;border-top:1px solid rgba(255,255,255,0.1)">
                未开始
                </div>`;
            } else if (SegmentedIconInfo[0].color === '#a4a4a4') {
                tooltipContent += `<div style="margin-top:4px;padding-top:4px;border-top:1px solid rgba(255,255,255,0.1)">
                待加入
                </div>`;
            } else {
                throw new Error("万万没想到");
            }

            // 添加工具信息
            if (slot.item_requirement) {
                if (slot.isEmptySolt()) {
                    tooltipContent += `
                        <div style="margin-top:4px;padding-top:4px;border-top:1px solid rgba(255,255,255,0.1)">
                            <span style="color:#FFA000">⚠</span> 需要工具
                        </div>`;
                } else {
                    if (slot.hasTool()) {
                        tooltipContent += `
                            <div style="margin-top:4px;padding-top:4px;border-top:1px solid rgba(255,255,255,0.1)">
                                <span style="color:green">✅</span> 有工具
                            </div>`;
                    } else {
                        tooltipContent += `
                            <div style="margin-top:4px;padding-top:4px;border-top:1px solid rgba(255,255,255,0.1)">
                                <span style="color:red">❌</span> 没有工具
                            </div>`;
                    }
                }
            }
            tooltip.innerHTML = tooltipContent;

            // 添加tooltip显示/隐藏逻辑
            icon.addEventListener('mouseenter', (e) => {
                tooltip.style.visibility = 'visible';
                tooltip.style.opacity = '1';
                tooltip.style.transform = 'translateY(0)';

                // 计算位置
                const rect = icon.getBoundingClientRect();
                const tooltipHeight = tooltip.offsetHeight;

                // 确保tooltip不会超出视窗顶部
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

        /**
         * 添加玩家标记
         */
        addPlayerMarker(icon) {
            const marker = document.createElement('span');
            marker.innerHTML = '★';
            marker.style.color = 'white';
            marker.style.fontSize = '10px';
            marker.style.textShadow = '0 0 1px #000';
            marker.style.zIndex = '2';
            icon.appendChild(marker);
        }

        /**
         * 添加工具标记
         */
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
                if (slot.hasTool()) {
                    toolMark.style.backgroundColor = 'green';
                } else {
                    toolMark.style.backgroundColor = 'red';
                }
            }

            icon.appendChild(toolMark);
        }

        /**
         * 创建未参加OC的容器
         */
        createNotInOCContainer() {
            const container = document.createElement('div');
            container.style.display = 'flex';
            container.style.alignItems = 'center';
            container.style.gap = '5px';
            container.style.backgroundColor = '#F44336';
            container.style.padding = '3px 8px';
            container.style.borderRadius = '3px';
            container.style.marginBottom = '10px';
            return container;
        }

        /**
         * 创建提示文本
         */
        createTextSpan() {
            const textSpan = document.createElement('span');
            textSpan.textContent = '未加入oc，';
            textSpan.style.fontSize = '12px';
            textSpan.style.color = 'white';
            return textSpan;
        }

        /**
         * 查找最佳可用的犯罪任务
         */
        findBestAvailableCrime() {
            let targetCrime = this.crimeInfo.crimes.find(crime =>
                crime.isMissingUser()
            );

            if (!targetCrime) {
                const emptyCrimes = this.crimeInfo.crimes.filter(crime =>
                    !crime.isUserd()
                );

                if (emptyCrimes.length > 0) {
                    targetCrime = emptyCrimes.reduce((highest, current) =>
                        current.difficulty > highest.difficulty ? current : highest
                    );
                } else {
                    const availableCrimes = this.crimeInfo.crimes.filter(crime =>
                        crime.slots.some(slot => !slot.user)
                    );
                    targetCrime = availableCrimes.reduce((highest, current) =>
                        current.difficulty > highest.difficulty ? current : highest
                    );
                }
            }

            return targetCrime;
        }

        /**
         * 创建加入链接
         */
        createJoinLink(crimeId) {
            const joinLink = document.createElement('a');
            joinLink.textContent = 'join';
            joinLink.href = `https://www.torn.com/factions.php?step=your#/tab=crimes&crimeId=${crimeId}`;
            joinLink.style.color = 'white';
            joinLink.style.textDecoration = 'underline';
            joinLink.style.fontSize = '13px';
            joinLink.style.fontWeight = 'bold';
            joinLink.style.textShadow = '0 0 1px rgba(255, 255, 255, 0.5)';
            joinLink.style.letterSpacing = '0.5px';

            this.addJoinLinkEffects(joinLink);
            return joinLink;
        }

        /**
         * 添加加入链接效果
         */
        addJoinLinkEffects(joinLink) {
            joinLink.addEventListener('mouseover', () => {
                joinLink.style.textShadow = '0 0 2px rgba(255, 255, 255, 0.8)';
                joinLink.style.transition = 'all 0.2s ease';
            });

            joinLink.addEventListener('mouseout', () => {
                joinLink.style.textShadow = '0 0 1px rgba(255, 255, 255, 0.5)';
            });

            // joinLink.addEventListener('click', async () => {
            //     try {
            //         const newData = await APIManager.getCrimeData();
            //         this.crimeInfo = newData;
            //         const player_id = CONFIG.USER_ID;
            //         this.updateStatusIcons(player_id);
            //     } catch (error) {
            //         console.error('更新OC数据失败:', error);
            //     }
            // });
        }
    }

    // =============== 主程序类 ===============
    class OCFacilitation {
        constructor() {
            this.crimeInfo = null;
            this.currentTab = null;
            this.isUpdating = false;
            this.observer = null;
            this.statusIconManager = null;
        }

        /**
         * 处理页面变化
         */
        async handlePageChange() {
            if (!Utils.isFactionPage() || !Utils.isOCPage()) {
                this.cleanup();
                return;
            }

            try {
                if (!this.crimeInfo) {
                    this.crimeInfo = await APIManager.getCrimeData();
                }

                const container = await Utils.waitForWrapper();
                await this.handleInitialUIUpdate(container);

                // 如果还没有设置观察器，设置它
                if (!this.observer) {
                    this.setupObserver(container);
                }
            } catch (error) {
                console.error('处理页面变化失败:', error);
            }
        }

        /**
         * 处理初始UI更新
         * @param {HTMLElement} container - 犯罪任务列表容器
         */
        async handleInitialUIUpdate(container) {
            await new Promise(resolve => setTimeout(resolve, CONFIG.UI.LOAD_DELAY));
            await this.updateCrimeListUI(container);
        }

        /**
         * 更新犯罪任务列表UI
         * @param {HTMLElement} container - 犯罪任务列表容器
         */
        async updateCrimeListUI(container) {
            if (this.isUpdating) return;

            try {
                this.isUpdating = true;
                CrimeUIManager.updateAllCrimesUI(container);
            } finally {
                this.isUpdating = false;
            }
        }

        /**
         * 设置观察器
         * @param {HTMLElement} container - 犯罪任务列表容器
         */
        setupObserver(container) {
            this.observer = new MutationObserver(Utils.debounce((mutations) => {
                const hasChildrenChanges = mutations.some(mutation =>
                    mutation.type === 'childList' &&
                    mutation.target === container
                );

                if (hasChildrenChanges) {
                    this.updateCrimeListUI(container)
                        .catch(error => console.error('更新犯罪任务UI失败:', error));
                }
            }, CONFIG.UI.UPDATE_DEBOUNCE));

            this.observer.observe(container, {
                childList: true,
                subtree: false,
                attributes: false,
                characterData: false
            });
        }

        /**
         * 清理资源
         */
        cleanup() {
            if (this.observer) {
                this.observer.disconnect();
                this.observer = null;
            }
            this.isUpdating = false;
        }
        /**
         * 获取状态容器父元素
         * @returns {HTMLElement|null}
         */
        getStatusContainerParent() {
            if (Utils.isMobileDevice()) {
                return document.querySelector('.user-information-mobile___WjXnd');
            } else {
                return document.getElementsByClassName("status-icons___gPkXF")[0]?.parentNode;
            }
        }

        /**
         * 创建状态容器
         */
        createStatusContainer() {
            const containerParent = this.getStatusContainerParent();
            if (!containerParent) {
                console.error('找不到状态容器的父元素');
                return null;
            }
            this.removeOldContainer();
            const container = document.createElement('div');
            container.style.display = 'flex';
            container.style.flexDirection = 'column';
            container.style.height = '32px';
            container.style.marginTop = '10px';
            container.id = 'oc-status-container';

            if (Utils.isMobileDevice()) {
                container.style.margin = '10px 15px';
                container.style.width = 'calc(100% - 30px)';
            }

            containerParent.appendChild(container);
            return container;
        }

        /**
         * 移除旧的状态容器
         */
        removeOldContainer() {
            const oldContainer = document.getElementById('oc-status-container');
            if (oldContainer) {
                oldContainer.remove();
            }
        }


        /**
         * 初始化程序
         */
        async initialize() {
            try {
                await this.initializeData();
                await this.setupStatusIcons();
                // 处理oc界面的ui
                this.setupPageChangeListeners();
            } catch (error) {
                console.error('初始化失败:', error);
            }
        }

        /**
         * 初始化数据
         */
        async initializeData() {
            // 直接从API获取新数据
            const playerInfo = await APIManager.fetchPlayerInfo();
            CONFIG.USER_ID = playerInfo.player_id;
            this.crimeInfo = await APIManager.getCrimeData();
            console.log('初始化数据成功', this.crimeInfo);

            this.statusIconManager = new StatusIconManager(this.crimeInfo);
        }

        /**
         * 设置UI
         */
        async setupStatusIcons() {
            // 获取玩家信息并更新状态图标
            const player_id = CONFIG.USER_ID;
            this.statusIconManager.updateStatusIcons(player_id);
        }

        /**
         * 设置页面变化监听器
         */
        setupPageChangeListeners() {
            // 监听hash变化（页签切换）
            window.addEventListener('hashchange', () => this.handlePageChange());

            // 监听页面加载完成
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
                clearInterval(createStatusContainerInterval);
                console.log("创建状态容器成功");
                app.initialize();
            }
        },300)

        // 页面卸载时清理资源
        window.addEventListener('unload', () => {
            app.cleanup();
        });
    })();
})();
