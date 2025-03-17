// ==UserScript==
// @name       giveaway-helper
// @namespace  nodelore.torn.giveaway-helper
// @version    1.0.0
// @author     nodelore[2786679]
// @icon       data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAIAAAACACAYAAADDPmHLAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAA4RpVFh0WE1MOmNvbS5hZG9iZS54bXAAAAAAADw/eHBhY2tldCBiZWdpbj0i77u/IiBpZD0iVzVNME1wQ2VoaUh6cmVTek5UY3prYzlkIj8+IDx4OnhtcG1ldGEgeG1sbnM6eD0iYWRvYmU6bnM6bWV0YS8iIHg6eG1wdGs9IkFkb2JlIFhNUCBDb3JlIDUuNi1jMTQyIDc5LjE2MDkyNCwgMjAxNy8wNy8xMy0wMTowNjozOSAgICAgICAgIj4gPHJkZjpSREYgeG1sbnM6cmRmPSJodHRwOi8vd3d3LnczLm9yZy8xOTk5LzAyLzIyLXJkZi1zeW50YXgtbnMjIj4gPHJkZjpEZXNjcmlwdGlvbiByZGY6YWJvdXQ9IiIgeG1sbnM6eG1wTU09Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC9tbS8iIHhtbG5zOnN0UmVmPSJodHRwOi8vbnMuYWRvYmUuY29tL3hhcC8xLjAvc1R5cGUvUmVzb3VyY2VSZWYjIiB4bWxuczp4bXA9Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC8iIHhtcE1NOk9yaWdpbmFsRG9jdW1lbnRJRD0ieG1wLmRpZDo0ZGUwOGRiNi0zMGM1LWI0NGQtYTc1Ni1mNjQ2MmU1MzBiMWUiIHhtcE1NOkRvY3VtZW50SUQ9InhtcC5kaWQ6MzU2ODRGRTVGRTgxMTFFODg4RUQ5NDE3MDZENDZFNjgiIHhtcE1NOkluc3RhbmNlSUQ9InhtcC5paWQ6MzU2ODRGRTRGRTgxMTFFODg4RUQ5NDE3MDZENDZFNjgiIHhtcDpDcmVhdG9yVG9vbD0iQWRvYmUgUGhvdG9zaG9wIENDIDIwMTggKFdpbmRvd3MpIj4gPHhtcE1NOkRlcml2ZWRGcm9tIHN0UmVmOmluc3RhbmNlSUQ9InhtcC5paWQ6ZjlkYWE3M2ItOWU0MC04NTQwLTgwMGYtMjlhNjgxNmU4MDRkIiBzdFJlZjpkb2N1bWVudElEPSJhZG9iZTpkb2NpZDpwaG90b3Nob3A6ZGI1M2M3MWItNDYwYi0yNDRkLWFhNDkt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
// @match      https://www.torn.com/item.php?*
// @match      https://www.torn.com/profiles.php?XID=*
// @require    https://cdn.jsdelivr.net/npm/vue@3.4.18/dist/vue.global.prod.js
// @require    data:application/javascript,%3Bwindow.Vue%3DVue%3B
// @require    https://cdn.jsdelivr.net/npm/element-plus@2.5.5/dist/index.full.min.js
// @require    https://cdn.jsdelivr.net/npm/@element-plus/icons-vue@2.3.1/dist/index.iife.min.js
// @resource   animate.css                  https://cdn.jsdelivr.net/npm/animate.css@4.1.1/animate.css
// @resource   element-plus/dist/index.css  https://cdn.jsdelivr.net/npm/element-plus@2.5.5/dist/index.css
// @grant      GM_addStyle
// @grant      GM_getResourceText
// @updateURL    https://raw.githubusercontent.com/zmpress/game_script/refs/heads/main/porn_city/userscript/giveaway_helper.js
// @downloadURL    https://raw.githubusercontent.com/zmpress/game_script/refs/heads/main/porn_city/userscript/giveaway_helper.js

// ==/UserScript==

/**
 * 请配合文档食用，自行创建文档的副本后构建URL
 * https://docs.qq.com/sheet/DTWlOWEZYTkJEQ3J3?tab=BB08J2
 */
(e=>{if(typeof GM_addStyle=="function"){GM_addStyle(e);return}const t=document.createElement("style");t.textContent=e,document.head.append(t)})(" .giveaway-status[data-v-0f492b8d]{position:fixed;z-index:999999;width:320px;height:auto;right:20px;top:120px;display:flex;flex-flow:column nowrap;border-radius:10px;box-sizing:border-box}.giveaway-status div *[data-v-0f492b8d]{font-size:14px}.card-header[data-v-0f492b8d],.card-footer[data-v-0f492b8d]{display:flex;width:100%;align-items:center}fieldset[data-v-0f492b8d]{border:1px solid rgba(1,1,1,.3);display:block;margin-inline-start:2px;margin-inline-end:2px;padding-block-start:.35em;padding-inline-start:.75em;padding-inline-end:.75em;padding-block-end:.625em;min-inline-size:min-content}fieldset legend[data-v-0f492b8d]{font-size:14px;display:block;padding-inline-start:2px;padding-inline-end:2px;border-width:initial;border-style:none;border-color:initial;border-image:initial}.card-header *[data-v-0f492b8d]{font-size:18px!important}.giveaway-detail[data-v-0f492b8d]{position:fixed;z-index:99999999;width:720px;height:450px;left:50%;margin-left:-300px;top:120px;overflow-y:hidden}.el-table .warning-row[data-v-0f492b8d]{background-color:red!important}.el-table .success-row[data-v-0f492b8d]{--el-table-tr-bg-color: #f0f9eb !important}.el-table .cell[data-v-0f492b8d]{text-align:center!important}.el-row[data-v-0f492b8d]{height:18px;line-height:18px}.tooltip[data-v-0f492b8d]{z-index:19999999}[data-v-0f492b8d]::-webkit-scrollbar{display:none} ");

(function (vue, ElementPlus, ElementPlusIconsVue) {
    'use strict';

    function _interopNamespaceDefault(e) {
        const n = Object.create(null, { [Symbol.toStringTag]: { value: 'Module' } });
        if (e) {
            for (const k in e) {
                if (k !== 'default') {
                    const d = Object.getOwnPropertyDescriptor(e, k);
                    Object.defineProperty(n, k, d.get ? d : {
                        enumerable: true,
                        get: () => e[k]
                    });
                }
            }
        }
        n.default = e;
        return Object.freeze(n);
    }

    const ElementPlusIconsVue__namespace = /*#__PURE__*/_interopNamespaceDefault(ElementPlusIconsVue);

    const cssLoader = (e) => {
        const t = GM_getResourceText(e);
        return GM_addStyle(t), t;
    };
    cssLoader("element-plus/dist/index.css");
    cssLoader("animate.css");
    const _export_sfc = (sfc, props) => {
        const target = sfc.__vccOpts || sfc;
        for (const [key, val] of props) {
            target[key] = val;
        }
        return target;
    };
    const _withScopeId = (n) => (vue.pushScopeId("data-v-0f492b8d"), n = n(), vue.popScopeId(), n);
    const _hoisted_1 = { class: "card-header" };
    const _hoisted_2 = /* @__PURE__ */ _withScopeId(() => /* @__PURE__ */ vue.createElementVNode("b", { style: { "margin-left": "5px" } }, "普照助手", -1));
    const _hoisted_3 = /* @__PURE__ */ _withScopeId(() => /* @__PURE__ */ vue.createElementVNode("legend", null, "发放目标", -1));
    const _hoisted_4 = /* @__PURE__ */ _withScopeId(() => /* @__PURE__ */ vue.createElementVNode("b", null, "目标：", -1));
    const _hoisted_5 = /* @__PURE__ */ _withScopeId(() => /* @__PURE__ */ vue.createElementVNode("b", null, "现金：", -1));
    const _hoisted_6 = /* @__PURE__ */ _withScopeId(() => /* @__PURE__ */ vue.createElementVNode("b", null, "发放状态：", -1));
    const _hoisted_7 = /* @__PURE__ */ _withScopeId(() => /* @__PURE__ */ vue.createElementVNode("b", null, "物品：", -1));
    const _hoisted_8 = /* @__PURE__ */ _withScopeId(() => /* @__PURE__ */ vue.createElementVNode("b", null, "数量：", -1));
    const _hoisted_9 = /* @__PURE__ */ _withScopeId(() => /* @__PURE__ */ vue.createElementVNode("b", null, "消息：", -1));
    const _hoisted_10 = { style: { "margin-top": "5px" } };
    const _hoisted_11 = /* @__PURE__ */ _withScopeId(() => /* @__PURE__ */ vue.createElementVNode("legend", null, "统计数据：", -1));
    const _hoisted_12 = /* @__PURE__ */ _withScopeId(() => /* @__PURE__ */ vue.createElementVNode("b", null, "模式：", -1));
    const _hoisted_13 = /* @__PURE__ */ _withScopeId(() => /* @__PURE__ */ vue.createElementVNode("b", null, "进度：", -1));
    const _hoisted_14 = /* @__PURE__ */ _withScopeId(() => /* @__PURE__ */ vue.createElementVNode("b", null, "下一目标：", -1));
    const _hoisted_15 = { class: "card-footer" };
    const _hoisted_16 = { class: "card-header" };
    const _hoisted_17 = /* @__PURE__ */ _withScopeId(() => /* @__PURE__ */ vue.createElementVNode("b", null, "普照详情", -1));
    const _hoisted_18 = { class: "dialog-footer" };
    const UID_CACHE_KEY = "UIDCACHE";
    const ITEM_CACHE_KEY = "ITEMCACHE";
    const STORAGE_KEY = "GIVEAWAY_CACHE";
    const _sfc_main = {
        __name: "App",
        setup(__props) {
            const appShow = vue.ref(true);
            const showDetail = vue.ref(false);
            const status = vue.ref("");
            const mode = vue.ref(-1);
            const modeText = vue.ref("");
            const startsWithProfile = location.href.startsWith("https://www.torn.com/profiles.php?XID=");
            const startsWithItem = location.href.startsWith("https://www.torn.com/item.php?");
            if (startsWithProfile) {
                mode.value = 0;
                modeText.value = "现金普照";
            } else if (startsWithItem) {
                mode.value = 1;
                modeText.value = "物品普照";
            }
            const API = localStorage.getItem("APIKey");
            if (!localStorage.getItem(UID_CACHE_KEY)) {
                localStorage.setItem(UID_CACHE_KEY, JSON.stringify({}));
            }
            const uidMap = JSON.parse(localStorage.getItem(UID_CACHE_KEY));
            if (!localStorage.getItem(ITEM_CACHE_KEY)) {
                localStorage.setItem(ITEM_CACHE_KEY, JSON.stringify({}));
            }
            const itemMap = JSON.parse(localStorage.getItem(ITEM_CACHE_KEY));
            const detailData = vue.ref([]);
            let SENDER;
            let giveaway_data;
            let moneyObserver;
            let current = [];
            let target;
            let itemObserver;
            let highlight;
            if (!localStorage.getItem(STORAGE_KEY)) {
                localStorage.setItem(STORAGE_KEY, JSON.stringify({
                    moneyState: {},
                    itemState: {}
                }));
            }
            giveaway_data = JSON.parse(localStorage.getItem(STORAGE_KEY));
            const fetchUser = async (uid) => {
                status.value = `请求用户${uid}数据中......`;
                const url = `https://api.torn.com/user/${uid}?selections=basic&key=${API}`;
                const resp = await fetch(url);
                const data = await resp.json();
                uidMap[uid] = data.name;
                localStorage.setItem(UID_CACHE_KEY, JSON.stringify(uidMap));
                return [data.name, data.player_id];
            };
            const fetchItemName = async (itemID) => {
                const url = `https://api.torn.com/torn/${itemID}?selections=items&key=${API}`;
                const resp = await fetch(url);
                const data = await resp.json();
                const itemName = data.items[itemID].name;
                if (itemName) {
                    itemMap[itemID] = data.items[itemID].name;
                    localStorage.setItem(ITEM_CACHE_KEY, JSON.stringify(itemMap));
                }
                return itemName;
            };
            const getTimeStr = () => {
                const currentDate = /* @__PURE__ */ new Date();
                const formattedDate = currentDate.toISOString().slice(0, 19).replace("T", " ");
                return formattedDate;
            };
            const toThousands = (num) => {
                if (num.toString().indexOf(",") >= 0) {
                    return parseThousands(num);
                } else if (!Number.isNaN(Number(num))) {
                    return num.toString().replace(/\d{1,3}(?=(\d{3})+$)/g, function(s) {
                        return s + ",";
                    });
                } else {
                    return 0;
                }
            };
            const getNextTarget = (state, skip = false) => {
                let hasSkip = false;
                let idx = 0;
                for (let uid in giveaway_data[state]) {
                    idx += 1;
                    const uid_state = giveaway_data[state][uid];
                    if (parseInt(uid) === SENDER) {
                        continue;
                    }
                    if (uid_state.status === false) {
                        if (skip && !hasSkip) {
                            hasSkip = true;
                            continue;
                        }
                        return [uid, uidMap[uid], idx];
                    }
                }
                return;
            };
            const viewGiveawayDetail = () => {
                const result = [];
                if (!giveaway_data) {
                    return;
                }
                if (startsWithProfile) {
                    for (let uid in giveaway_data.moneyState) {
                        const state = giveaway_data.moneyState[uid];
                        const item = {};
                        item["target"] = `${uidMap[uid]}[${uid}]`;
                        item["amount"] = toThousands(state["money"]);
                        item["status"] = "未发送";
                        if (state["status"]) {
                            item["status"] = "已发送";
                        }
                        item["time"] = state["sendTime"];
                        result.push(item);
                    }
                } else if (startsWithItem) {
                    for (let uid in giveaway_data.itemState) {
                        const state = giveaway_data.itemState[uid];
                        const item = {};
                        item["target"] = `${uidMap[uid]}[${uid}]`;
                        item["amount"] = `${state["amount"]}* ${state["item"]}`;
                        item["status"] = "未发送";
                        if (state["status"]) {
                            item["status"] = "已发送";
                        }
                        item["time"] = state["sendTime"];
                        result.push(item);
                    }
                }
                detailData.value = result;
                showDetail.value = true;
            };
            const target_text = vue.ref("");
            const money_text = vue.ref("");
            const send_status = vue.ref("");
            const message_text = vue.ref("");
            const next_target_text = vue.ref("");
            const next_target_link = vue.ref("");
            const progress_text = vue.ref("");
            const showOverloadConfirm = vue.ref(false);
            const overload_confirm_text = vue.ref("");
            const item_text = vue.ref("");
            const amount_text = vue.ref("");
            const updateMoneyDisplay = (current2, target2) => {
                if (!target2) {
                    target_text.value = "无";
                    money_text.value = "";
                    message_text.value = "";
                    send_status.value = "结束";
                    status.value = "普照完毕";
                    next_target_link.value = "";
                } else {
                    const total = Object.keys(giveaway_data.moneyState).length;
                    const idx = target2[2];
                    progress_text.value = `${idx}/${total}`;
                    target_text.value = `${current2[1]}[${current2[0]}]`;
                    let next;
                    if (giveaway_data.moneyState[current2[0]]) {
                        message_text.value = giveaway_data.moneyState[current2[0]].message;
                        money_text.value = giveaway_data.moneyState[current2[0]].money;
                        if (giveaway_data.moneyState[current2[0]].status) {
                            send_status.value = "发放完毕";
                            next = getNextTarget("moneyState");
                        } else {
                            send_status.value = "准备发放";
                            next = target2;
                        }
                    } else {
                        send_status.value = "不在列表";
                        next = getNextTarget("moneyState");
                    }
                    if (next) {
                        next_target_text.value = `${next[1]}[${next[0]}]`;
                        next_target_link.value = `https://www.torn.com/profiles.php?XID=${next[0]}`;
                    } else {
                        send_status.value = "结束";
                        next_target_text.value = `发完啦`;
                        status.value = "普照完毕";
                    }
                }
            };
            const updateHighlight = (target2) => {
                if (highlight) {
                    highlight.css({
                        background: "#f2f2f2"
                    });
                }
                if (!target2) {
                    return;
                }
                const uid = target2[0];
                const itemState = giveaway_data.itemState[uid];
                const itemID = itemState.itemID;
                highlight = $(`li[data-item=${itemID}]`);
                highlight.css({
                    "background": "#30991c66"
                });
            };
            const updateItemDisplay = (target2) => {
                if (!target2) {
                    target_text.value = "无";
                    item_text.value = "";
                    amount_text.value = "";
                    message_text.value = "";
                    send_status.value = "结束";
                    status.value = "普照完毕";
                } else {
                    const total = Object.keys(giveaway_data.itemState).length;
                    const idx = target2[2];
                    progress_text.value = `${idx}/${total}`;
                    const uid = target2[0];
                    const username = target2[1];
                    target_text.value = `${username}[${uid}]`;
                    let next;
                    const itemState = giveaway_data.itemState[uid];
                    if (itemState) {
                        message_text.value = itemState.message;
                        item_text.value = itemState.item;
                        amount_text.value = itemState.amount;
                        if (itemState.status) {
                            send_status.value = "发放完毕";
                            next = getNextTarget("moneyState");
                        } else {
                            send_status.value = "准备发放";
                            next = target2;
                        }
                    } else {
                        send_status.value = "不在列表";
                        next = getNextTarget("moneyState");
                    }
                    if (next) {
                        next_target_text.value = `${next[1]}[${next[0]}]`;
                    } else {
                        send_status.value = "结束";
                        next_target_text.value = `发完啦`;
                        status.value = "普照完毕";
                    }
                }
            };
            const tableRowClassName = ({
                                           _,
                                           rowIndex
                                       }) => {
                if (rowIndex === 1) {
                    return "warning-row";
                } else if (rowIndex === 3) {
                    return "success-row";
                }
                return "";
            };
            const overloadMoneyCache = async () => {
                try {
                    status.value = "正在加载数据中...";
                    const params = new URLSearchParams(location.href.split("#")[1]);
                    giveaway_data.moneyState = {};
                    localStorage.setItem(STORAGE_KEY, JSON.stringify(giveaway_data));
                    const uids = params.get("give_uid");
                    $("div#giveaway-target span").text("加载中");
                    const amount = params.get("give_amount");
                    const amountList = [];
                    if (amount) {
                        params.get("give_amount").split(",").map((item) => {
                            amountList.push(parseInt(item));
                        });
                    } else {
                        ElementPlus.ElMessage.error("不合法的数量参数，请检查URL");
                        return;
                    }
                    const message = params.get("message");
                    const messageList = [];
                    if (message) {
                        message.split("|||").map((item) => {
                            messageList.push(item);
                        });
                    } else {
                        messageList.push("");
                    }
                    const uidList = uids.split(",");
                    for (let i = 0; i < uidList.length; i++) {
                        const tempUid = parseInt(uidList[i]);
                        if (tempUid && SENDER && tempUid === SENDER) {
                            continue;
                        }
                        let username;
                        if (uidMap[tempUid]) {
                            username = uidMap[tempUid];
                        } else {
                            const res = await fetchUser(tempUid);
                            username = res[0];
                            uidMap[tempUid] = username;
                            localStorage.setItem(UID_CACHE_KEY, JSON.stringify(uidMap));
                        }
                        giveaway_data.moneyState[tempUid] = {
                            status: false,
                            money: amountList.length === 1 ? amountList[0] : amountList[i],
                            message: messageList.length === 1 ? messageList[0] : messageList[i],
                            sendTime: null
                        };
                        localStorage.setItem(STORAGE_KEY, JSON.stringify(giveaway_data));
                    }
                    return true;
                } catch (error) {
                    console.error(error);
                    ElementPlus.ElMessage.error("发生错误，请检查传递的参数是否合法");
                }
            };
            const giveawayMoneyMain = () => {
                status.value = "数据读取完毕，开始普照";
                target = getNextTarget("moneyState");
                updateMoneyDisplay(current, target);
                if (!target) {
                    status.value = "当前无可普照对象";
                    moneyObserver.disconnect();
                } else {
                    if (current && current[0] === target[0] && current[1] === target[1])
                        ;
                    else {
                        moneyObserver.disconnect();
                    }
                }
            };
            const overloadItemCache = async () => {
                try {
                    status.value = "正在加载数据中...";
                    giveaway_data.itemState = {};
                    localStorage.setItem(STORAGE_KEY, JSON.stringify(giveaway_data));
                    const ITEM_PREFIX = "https://www.torn.com/item.php?";
                    const params = new URLSearchParams(location.href.replace(ITEM_PREFIX, ""));
                    const uids = params.get("give_uid");
                    const uidList = uids.split(",");
                    const amount = params.get("give_amount");
                    const amountList = [];
                    if (amount) {
                        let errorFlag = false;
                        params.get("give_amount").split(",").map((item2) => {
                            item2 = parseInt(item2);
                            if (item2 <= 0) {
                                errorFlag = true;
                            }
                            amountList.push(item2);
                        });
                        if (errorFlag) {
                            ElementPlus.ElMessage.error("不合法的物品数量，请检查URL");
                            return;
                        }
                    } else {
                        ElementPlus.ElMessage.error("不合法的数量参数，请检查URL");
                        return;
                    }
                    const message = params.get("message");
                    const messageList = [];
                    if (message) {
                        message.split("|||").map((item2) => {
                            messageList.push(item2);
                        });
                    } else {
                        messageList.push("");
                    }
                    const item = params.get("give_item");
                    const itemSplit = item.split(",");
                    const itemList = [];
                    if (item && itemSplit.length > 0) {
                        let errorFlag = false;
                        for (let i = 0; i < itemSplit.length; i++) {
                            const itemID = itemSplit[i];
                            let itemName;
                            if (itemMap[itemID]) {
                                itemName = itemMap[itemID];
                            } else {
                                itemName = await fetchItemName(itemID);
                            }
                            if (itemName) {
                                itemList.push([itemID, itemName]);
                            } else {
                                errorFlag = true;
                            }
                        }
                        if (errorFlag) {
                            ElementPlus.ElMessage.error("不合法的物品ID，请检查URL");
                            return;
                        }
                    } else {
                        ElementPlus.ElMessage.error("不合法的物品ID，请检查URL");
                        return;
                    }
                    for (let i = 0; i < uidList.length; i++) {
                        const tempUid = parseInt(uidList[i]);
                        if (tempUid && SENDER && tempUid === SENDER) {
                            continue;
                        }
                        let username;
                        if (uidMap[tempUid]) {
                            username = uidMap[tempUid];
                        } else {
                            const res = await fetchUser(tempUid);
                            username = res[0];
                            uidMap[tempUid] = username;
                            localStorage.setItem(UID_CACHE_KEY, JSON.stringify(uidMap));
                        }
                        giveaway_data.itemState[tempUid] = {
                            status: false,
                            item: itemList.length === 1 ? itemList[0][1] : itemList[i][1],
                            itemID: itemList.length === 1 ? itemList[0][0] : itemList[i][0],
                            amount: amountList.length === 1 ? amountList[0] : amountList[i],
                            message: messageList.length === 1 ? messageList[0] : messageList[i],
                            sendTime: null
                        };
                        localStorage.setItem(STORAGE_KEY, JSON.stringify(giveaway_data));
                    }
                } catch (error) {
                    ElementPlus.ElMessage.error("读取数据发生错误，请检查URL和报错信息");
                    console.error(error);
                    return;
                }
            };
            const giveawayItemMain = () => {
                status.value = "数据读取完毕，开始普照";
                target = getNextTarget("itemState");
                if (!target) {
                    status.value = "当前无可普照对象";
                    if (itemObserver) {
                        itemObserver.disconnect();
                        itemObserver = null;
                    }
                } else {
                    updateItemDisplay(target);
                    updateHighlight(target);
                    if (!itemObserver) {
                        let uid = target[0];
                        let itemState = giveaway_data.itemState[uid];
                        let { message, item, amount, itemID } = itemState;
                        let regex = new RegExp(`Who would you like to send your ${item} to`);
                        let sentRegex = new RegExp(`You sent .*? ${item} to`);
                        itemObserver = new MutationObserver(async (mutationsList) => {
                            for (const mut of mutationsList) {
                                if (mut.type === "attributes") {
                                    if (mut.attributeName === "class" && $(mut.target).hasClass("send-act") && $(mut.target).hasClass("msg-active") && $(mut.target).find("h5").text().match(regex)) {
                                        $(mut.target).find("input.message").val(message);
                                    }
                                }
                                for (const addedNode of mut.addedNodes) {
                                    if (addedNode.tagName === "LI" && $(addedNode).attr("data-item") === itemID) {
                                        updateHighlight(target);
                                    } else if ($(addedNode).hasClass("send-act") && target) {
                                        if ($(addedNode).find("h5").text().match(regex)) {
                                            $(addedNode).find("input.user-id").val(target[0]);
                                            $(addedNode).find("input.amount").val(amount);
                                        }
                                    } else if (addedNode.tagName == "P" && $(addedNode).text().trim().match(sentRegex)) {
                                        const lastState = giveaway_data.itemState[uid];
                                        lastState["sendTime"] = getTimeStr();
                                        lastState["status"] = true;
                                        localStorage.setItem(STORAGE_KEY, JSON.stringify(giveaway_data));
                                        target = getNextTarget("itemState");
                                        updateHighlight(target);
                                        updateItemDisplay(target);
                                        if (!target) {
                                            itemObserver.disconnect();
                                        } else {
                                            uid = target[0];
                                            itemState = giveaway_data.itemState[uid];
                                            message = itemState.message;
                                            item = itemState.item;
                                            amount = itemState.amount;
                                            itemID = itemState.itemID;
                                            regex = new RegExp(`Who would you like to send your ${item} to`);
                                            sentRegex = new RegExp(`You sent .*? ${item} to`);
                                        }
                                    }
                                }
                            }
                        });
                        itemObserver.observe(document.getElementsByClassName("items-wrap")[0], { childList: true, subtree: true, attributes: true });
                    }
                }
            };
            const cancelOverload = () => {
                if (mode.value === 0) {
                    giveawayMoneyMain();
                } else if (mode.value === 1) {
                    giveawayItemMain();
                }
                showOverloadConfirm.value = false;
            };
            const confirmOverload = () => {
                if (mode.value === 0) {
                    overloadMoneyCache().then(() => {
                        giveawayMoneyMain();
                    });
                } else if (mode.value === 1) {
                    overloadItemCache().then(() => {
                        giveawayItemMain();
                    });
                }
                showOverloadConfirm.value = false;
            };
            if (!API) {
                status.value = "无法检测到API";
            } else {
                status.value = "检测到API，正在加载中";
                const loaded = vue.ref(false);
                fetchUser().then((res) => {
                    if (res) {
                        SENDER = parseInt(res[1]);
                        status.value = `API有效，开始读取数据`;
                        loaded.value = true;
                        if (startsWithProfile) {
                            const MONEY_PREFIX = "https://www.torn.com/profiles.php?XID=";
                            moneyObserver = new MutationObserver(async (mutationsList) => {
                                for (const mut of mutationsList) {
                                    for (const addedNode of mut.addedNodes) {
                                        if (addedNode.tagName === "DIV" && addedNode.classList.contains("send-cash") && target) {
                                            $(addedNode).find("div.input-money-group").addClass("success").children("input").val(toThousands(giveaway_data.moneyState[target[0]].money) + "-");
                                            $(addedNode).find("input.send-cash-message-input").val(giveaway_data.moneyState[target[0]].message);
                                            $(addedNode).find("div.input-money-group").addClass("success").children("input").focus();
                                        } else if (addedNode.tagName === "BUTTON" && addedNode.classList.contains("confirm-action") && target) {
                                            const sendText = $("div.profile-buttons-dialog").find("div.text").text().trim();
                                            const sendRegex = `You sent $${toThousands(giveaway_data.moneyState[target[0]].money)} to ${target[1]} with the message: ${giveaway_data.moneyState[target[0]].message}`;
                                            if (sendText === sendRegex) {
                                                giveaway_data.moneyState[target[0]]["status"] = true;
                                                giveaway_data.moneyState[target[0]]["sendTime"] = getTimeStr();
                                                localStorage.setItem(STORAGE_KEY, JSON.stringify(giveaway_data));
                                                updateMoneyDisplay(current, target);
                                            }
                                        }
                                    }
                                }
                            });
                            moneyObserver.observe($(".content-wrapper")[0], { childList: true, subtree: true, attributes: true });
                            current[0] = location.href.split("#")[0].replace(MONEY_PREFIX, "");
                            current[1] = $("span.honor-text").text();
                            if (!current[1]) {
                                if (uidMap[current[0]]) {
                                    console.log("网页加载迟缓，从缓存读取数据中...");
                                    current[1] = uidMap[current[0]];
                                }
                            }
                            if (location.href.split("#").length > 1) {
                                const totalState = Object.keys(giveaway_data.moneyState).length;
                                if (totalState > 0) {
                                    showOverloadConfirm.value = true;
                                    overload_confirm_text.value = `缓存内尚有${totalState}条记录，是否确认覆盖?`;
                                } else {
                                    overloadMoneyCache().then(() => {
                                        giveawayMoneyMain();
                                    });
                                }
                            } else {
                                giveawayMoneyMain();
                            }
                        } else if (startsWithItem) {
                            if (location.href.split("?").length > 1) {
                                const totalState = Object.keys(giveaway_data.itemState).length;
                                if (totalState) {
                                    showOverloadConfirm.value = true;
                                    overload_confirm_text.value = `缓存内尚有${totalState}条记录，是否确认覆盖?`;
                                } else {
                                    overloadItemCache().then(() => {
                                        giveawayItemMain();
                                    });
                                }
                            } else {
                                giveawayItemMain();
                            }
                        }
                    }
                });
            }
            return (_ctx, _cache) => {
                const _component_MessageBox = vue.resolveComponent("MessageBox");
                const _component_el_icon = vue.resolveComponent("el-icon");
                const _component_el_text = vue.resolveComponent("el-text");
                const _component_el_col = vue.resolveComponent("el-col");
                const _component_el_row = vue.resolveComponent("el-row");
                const _component_el_link = vue.resolveComponent("el-link");
                const _component_el_button = vue.resolveComponent("el-button");
                const _component_el_card = vue.resolveComponent("el-card");
                const _component_CircleClose = vue.resolveComponent("CircleClose");
                const _component_el_table_column = vue.resolveComponent("el-table-column");
                const _component_el_table = vue.resolveComponent("el-table");
                const _component_el_dialog = vue.resolveComponent("el-dialog");
                return vue.openBlock(), vue.createElementBlock(vue.Fragment, null, [
                    vue.withDirectives(vue.createVNode(_component_el_card, {
                        class: "giveaway-status animate__animated animate__bounce",
                        "body-style": { "padding-top": "10px", width: "100%", "box-sizing": "border-box" }
                    }, {
                        header: vue.withCtx(() => [
                            vue.createElementVNode("div", _hoisted_1, [
                                vue.createVNode(_component_el_icon, { size: 20 }, {
                                    default: vue.withCtx(() => [
                                        vue.createVNode(_component_MessageBox)
                                    ]),
                                    _: 1
                                }),
                                vue.createVNode(_component_el_text, { size: "large" }, {
                                    default: vue.withCtx(() => [
                                        _hoisted_2
                                    ]),
                                    _: 1
                                })
                            ])
                        ]),
                        footer: vue.withCtx(() => [
                            vue.createElementVNode("div", _hoisted_15, [
                                vue.createVNode(_component_el_text, {
                                    size: "large",
                                    type: "info"
                                }, {
                                    default: vue.withCtx(() => [
                                        vue.createTextVNode("当前状态：" + vue.toDisplayString(status.value), 1)
                                    ]),
                                    _: 1
                                })
                            ])
                        ]),
                        default: vue.withCtx(() => [
                            vue.createElementVNode("div", null, [
                                vue.createElementVNode("fieldset", null, [
                                    _hoisted_3,
                                    vue.createVNode(_component_el_row, null, {
                                        default: vue.withCtx(() => [
                                            vue.createVNode(_component_el_col, { span: 8 }, {
                                                default: vue.withCtx(() => [
                                                    _hoisted_4
                                                ]),
                                                _: 1
                                            }),
                                            vue.createVNode(_component_el_col, { span: 16 }, {
                                                default: vue.withCtx(() => [
                                                    vue.createElementVNode("b", null, [
                                                        vue.createVNode(_component_el_text, {
                                                            type: "primary",
                                                            truncated: ""
                                                        }, {
                                                            default: vue.withCtx(() => [
                                                                vue.createTextVNode(vue.toDisplayString(target_text.value), 1)
                                                            ]),
                                                            _: 1
                                                        })
                                                    ])
                                                ]),
                                                _: 1
                                            })
                                        ]),
                                        _: 1
                                    }),
                                    mode.value === 0 ? (vue.openBlock(), vue.createBlock(_component_el_row, { key: 0 }, {
                                        default: vue.withCtx(() => [
                                            vue.createVNode(_component_el_col, { span: 8 }, {
                                                default: vue.withCtx(() => [
                                                    _hoisted_5
                                                ]),
                                                _: 1
                                            }),
                                            vue.createVNode(_component_el_col, { span: 16 }, {
                                                default: vue.withCtx(() => [
                                                    vue.createElementVNode("b", null, [
                                                        vue.createVNode(_component_el_text, { type: "primary" }, {
                                                            default: vue.withCtx(() => [
                                                                vue.createTextVNode(vue.toDisplayString(money_text.value), 1)
                                                            ]),
                                                            _: 1
                                                        })
                                                    ])
                                                ]),
                                                _: 1
                                            })
                                        ]),
                                        _: 1
                                    })) : vue.createCommentVNode("", true),
                                    mode.value === 0 ? (vue.openBlock(), vue.createBlock(_component_el_row, { key: 1 }, {
                                        default: vue.withCtx(() => [
                                            vue.createVNode(_component_el_col, { span: 8 }, {
                                                default: vue.withCtx(() => [
                                                    _hoisted_6
                                                ]),
                                                _: 1
                                            }),
                                            vue.createVNode(_component_el_col, { span: 16 }, {
                                                default: vue.withCtx(() => [
                                                    vue.createElementVNode("b", null, [
                                                        vue.createVNode(_component_el_text, { type: "primary" }, {
                                                            default: vue.withCtx(() => [
                                                                vue.createTextVNode(vue.toDisplayString(send_status.value), 1)
                                                            ]),
                                                            _: 1
                                                        })
                                                    ])
                                                ]),
                                                _: 1
                                            })
                                        ]),
                                        _: 1
                                    })) : vue.createCommentVNode("", true),
                                    mode.value === 1 ? (vue.openBlock(), vue.createBlock(_component_el_row, { key: 2 }, {
                                        default: vue.withCtx(() => [
                                            vue.createVNode(_component_el_col, { span: 8 }, {
                                                default: vue.withCtx(() => [
                                                    _hoisted_7
                                                ]),
                                                _: 1
                                            }),
                                            vue.createVNode(_component_el_col, { span: 16 }, {
                                                default: vue.withCtx(() => [
                                                    vue.createElementVNode("b", null, [
                                                        vue.createVNode(_component_el_text, { type: "primary" }, {
                                                            default: vue.withCtx(() => [
                                                                vue.createTextVNode(vue.toDisplayString(item_text.value), 1)
                                                            ]),
                                                            _: 1
                                                        })
                                                    ])
                                                ]),
                                                _: 1
                                            })
                                        ]),
                                        _: 1
                                    })) : vue.createCommentVNode("", true),
                                    mode.value === 1 ? (vue.openBlock(), vue.createBlock(_component_el_row, { key: 3 }, {
                                        default: vue.withCtx(() => [
                                            vue.createVNode(_component_el_col, { span: 8 }, {
                                                default: vue.withCtx(() => [
                                                    _hoisted_8
                                                ]),
                                                _: 1
                                            }),
                                            vue.createVNode(_component_el_col, { span: 16 }, {
                                                default: vue.withCtx(() => [
                                                    vue.createElementVNode("b", null, [
                                                        vue.createVNode(_component_el_text, { type: "primary" }, {
                                                            default: vue.withCtx(() => [
                                                                vue.createTextVNode(vue.toDisplayString(amount_text.value), 1)
                                                            ]),
                                                            _: 1
                                                        })
                                                    ])
                                                ]),
                                                _: 1
                                            })
                                        ]),
                                        _: 1
                                    })) : vue.createCommentVNode("", true),
                                    vue.createVNode(_component_el_row, null, {
                                        default: vue.withCtx(() => [
                                            vue.createVNode(_component_el_col, { span: 8 }, {
                                                default: vue.withCtx(() => [
                                                    _hoisted_9
                                                ]),
                                                _: 1
                                            }),
                                            vue.createVNode(_component_el_col, { span: 16 }, {
                                                default: vue.withCtx(() => [
                                                    vue.createElementVNode("b", null, [
                                                        vue.createVNode(_component_el_text, {
                                                            type: "primary",
                                                            truncated: ""
                                                        }, {
                                                            default: vue.withCtx(() => [
                                                                vue.createTextVNode(vue.toDisplayString(message_text.value), 1)
                                                            ]),
                                                            _: 1
                                                        })
                                                    ])
                                                ]),
                                                _: 1
                                            })
                                        ]),
                                        _: 1
                                    })
                                ])
                            ]),
                            vue.createElementVNode("div", _hoisted_10, [
                                vue.createElementVNode("fieldset", null, [
                                    _hoisted_11,
                                    vue.createVNode(_component_el_row, null, {
                                        default: vue.withCtx(() => [
                                            vue.createVNode(_component_el_col, { span: 8 }, {
                                                default: vue.withCtx(() => [
                                                    _hoisted_12
                                                ]),
                                                _: 1
                                            }),
                                            vue.createVNode(_component_el_col, { span: 16 }, {
                                                default: vue.withCtx(() => [
                                                    vue.createElementVNode("b", null, [
                                                        vue.createVNode(_component_el_text, { type: "primary" }, {
                                                            default: vue.withCtx(() => [
                                                                vue.createTextVNode(vue.toDisplayString(modeText.value), 1)
                                                            ]),
                                                            _: 1
                                                        })
                                                    ])
                                                ]),
                                                _: 1
                                            })
                                        ]),
                                        _: 1
                                    }),
                                    vue.createVNode(_component_el_row, null, {
                                        default: vue.withCtx(() => [
                                            vue.createVNode(_component_el_col, { span: 8 }, {
                                                default: vue.withCtx(() => [
                                                    _hoisted_13
                                                ]),
                                                _: 1
                                            }),
                                            vue.createVNode(_component_el_col, { span: 16 }, {
                                                default: vue.withCtx(() => [
                                                    vue.createElementVNode("b", null, [
                                                        vue.createVNode(_component_el_text, { type: "primary" }, {
                                                            default: vue.withCtx(() => [
                                                                vue.createTextVNode(vue.toDisplayString(progress_text.value), 1)
                                                            ]),
                                                            _: 1
                                                        })
                                                    ])
                                                ]),
                                                _: 1
                                            })
                                        ]),
                                        _: 1
                                    }),
                                    mode.value === 0 ? (vue.openBlock(), vue.createBlock(_component_el_row, { key: 0 }, {
                                        default: vue.withCtx(() => [
                                            vue.createVNode(_component_el_col, { span: 8 }, {
                                                default: vue.withCtx(() => [
                                                    _hoisted_14
                                                ]),
                                                _: 1
                                            }),
                                            vue.createVNode(_component_el_col, { span: 16 }, {
                                                default: vue.withCtx(() => [
                                                    vue.createElementVNode("b", null, [
                                                        vue.createVNode(_component_el_text, { type: "primary" }, {
                                                            default: vue.withCtx(() => [
                                                                vue.createVNode(_component_el_link, {
                                                                    href: next_target_link.value,
                                                                    type: "primary"
                                                                }, {
                                                                    default: vue.withCtx(() => [
                                                                        vue.createElementVNode("b", null, vue.toDisplayString(next_target_text.value), 1)
                                                                    ]),
                                                                    _: 1
                                                                }, 8, ["href"])
                                                            ]),
                                                            _: 1
                                                        })
                                                    ])
                                                ]),
                                                _: 1
                                            })
                                        ]),
                                        _: 1
                                    })) : vue.createCommentVNode("", true),
                                    vue.createVNode(_component_el_button, {
                                        type: "primary",
                                        style: { "margin-top": "5px" },
                                        size: "small",
                                        onClick: viewGiveawayDetail
                                    }, {
                                        default: vue.withCtx(() => [
                                            vue.createTextVNode("查看发放详情")
                                        ]),
                                        _: 1
                                    })
                                ])
                            ])
                        ]),
                        _: 1
                    }, 512), [
                        [vue.vShow, appShow.value]
                    ]),
                    vue.withDirectives(vue.createVNode(_component_el_card, {
                        class: "giveaway-detail animate__animated animate__fadeInUp",
                        "body-style": { "padding": 0 }
                    }, {
                        header: vue.withCtx(() => [
                            vue.createElementVNode("div", _hoisted_16, [
                                vue.createVNode(_component_el_text, { size: "large" }, {
                                    default: vue.withCtx(() => [
                                        _hoisted_17
                                    ]),
                                    _: 1
                                }),
                                vue.createVNode(_component_el_icon, {
                                    style: { "margin-left": "auto" },
                                    color: "red",
                                    onClick: _cache[0] || (_cache[0] = ($event) => showDetail.value = false),
                                    title: "关闭面板"
                                }, {
                                    default: vue.withCtx(() => [
                                        vue.createVNode(_component_CircleClose)
                                    ]),
                                    _: 1
                                })
                            ])
                        ]),
                        default: vue.withCtx(() => [
                            vue.createVNode(_component_el_table, {
                                data: detailData.value,
                                style: { "width": "100%", "font-size": "14px", "height": "375px", "box-sizing": "border-box" },
                                "row-class-name": tableRowClassName,
                                "header-cell-style": { "text-align": "center" },
                                "cell-style": { "text-align": "center" }
                            }, {
                                default: vue.withCtx(() => [
                                    vue.createVNode(_component_el_table_column, {
                                        prop: "target",
                                        label: "目标"
                                    }),
                                    vue.createVNode(_component_el_table_column, {
                                        prop: "amount",
                                        label: "物品"
                                    }),
                                    vue.createVNode(_component_el_table_column, {
                                        prop: "status",
                                        label: "状态"
                                    }),
                                    vue.createVNode(_component_el_table_column, {
                                        prop: "time",
                                        label: "发送时间"
                                    })
                                ]),
                                _: 1
                            }, 8, ["data"])
                        ]),
                        _: 1
                    }, 512), [
                        [vue.vShow, showDetail.value]
                    ]),
                    vue.createVNode(_component_el_dialog, {
                        modelValue: showOverloadConfirm.value,
                        "onUpdate:modelValue": _cache[3] || (_cache[3] = ($event) => showOverloadConfirm.value = $event),
                        title: "覆盖已有数据",
                        width: "400"
                    }, {
                        footer: vue.withCtx(() => [
                            vue.createElementVNode("div", _hoisted_18, [
                                vue.createVNode(_component_el_button, {
                                    onClick: _cache[1] || (_cache[1] = ($event) => cancelOverload())
                                }, {
                                    default: vue.withCtx(() => [
                                        vue.createTextVNode("Cancel")
                                    ]),
                                    _: 1
                                }),
                                vue.createVNode(_component_el_button, {
                                    type: "primary",
                                    onClick: _cache[2] || (_cache[2] = ($event) => {
                                        confirmOverload();
                                    })
                                }, {
                                    default: vue.withCtx(() => [
                                        vue.createTextVNode(" Confirm ")
                                    ]),
                                    _: 1
                                })
                            ])
                        ]),
                        default: vue.withCtx(() => [
                            vue.createElementVNode("span", null, vue.toDisplayString(overload_confirm_text.value), 1)
                        ]),
                        _: 1
                    }, 8, ["modelValue"])
                ], 64);
            };
        }
    };
    const App = /* @__PURE__ */ _export_sfc(_sfc_main, [["__scopeId", "data-v-0f492b8d"]]);
    const app = vue.createApp(App);
    for (const [key, component] of Object.entries(ElementPlusIconsVue__namespace)) {
        app.component(key, component);
    }
    app.use(ElementPlus);
    app.mount(
        (() => {
            const app2 = document.createElement("div");
            app2.id = "giveaway-helper-body";
            document.body.append(app2);
            return app2;
        })()
    );

})(Vue, ElementPlus, ElementPlusIconsVue);
