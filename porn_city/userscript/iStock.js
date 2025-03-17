// ==UserScript==
// @name         iStock
// @namespace    TornExtensions
// @version      2.0.0
// @description  none
// @author       htys [1545351]
// @match        https://www.torn.com/*.php*
// @grant        none
// @updateURL    https://raw.githubusercontent.com/zmpress/game_script/refs/heads/main/porn_city/userscript/iStock.js
// @downloadURL    https://raw.githubusercontent.com/zmpress/game_script/refs/heads/main/porn_city/userscript/iStock.js

// ==/UserScript==

(function() {
    'use strict';
    const $ = window.jQuery;

    const is_history_low_allowed = true; //史低功能是否开启

    const is_percentage_allowed = false; //百分比止盈止跌提醒是否开启（默认不开启）

    //const is_significant_change_notification_allowed = getLocalStorage("ISTOCK", "is_significant_change") == 1; //价格巨变提醒是否开启
    //const significant_change_percentage = getLocalStorage("ISTOCK", "significant_change_percent") || 0.3; //价格巨变提醒百分比

    //const is_stack_change_notification_allowd = getLocalStorage("ISTOCK", "is_stack_change") == 1; //价格渐变提醒是否开启
    //const stack_change_percentage = getLocalStorage("ISTOCK", "stack_change_percent") || 0.3; //价格渐变提醒百分比
    //const stack_change_period = getLocalStorage("ISTOCK", "stack_change_time_window") || 15; //价格渐变提醒监视窗口（分钟）最多60min
    const stack_change_refresh_frequency = 5; //价格渐变提醒刷新频率（分钟）
    /*
    const stocks = {
        "1": {
            "name": "Torn & Shanghai Banking",
            "acronym": "TSB"
        },
        "2": {
            "name": "Torn City Investments",
            "acronym": "TCI"
        },
        "3": {
            "name": "Syscore MFG",
            "acronym": "SYS"
        },
        "4": {
            "name": "Legal Authorities Group",
            "acronym": "LAG"
        },
        "5": {
            "name": "Insured On Us",
            "acronym": "IOU"
        },
        "6": {
            "name": "Grain",
            "acronym": "GRN"
        },
        "7": {
            "name": "Torn City Health Service",
            "acronym": "THS"
        },
        "8": {
            "name": "Yazoo",
            "acronym": "YAZ"
        },
        "9": {
            "name": "The Torn City Times",
            "acronym": "TCT"
        },
        "10": {
            "name": "Crude & Co",
            "acronym": "CNC"
        },
        "11": {
            "name": "Messaging Inc.",
            "acronym": "MSG"
        },
        "12": {
            "name": "TC Music Industries",
            "acronym": "TMI"
        },
        "13": {
            "name": "TC Media Productions",
            "acronym": "TCP"
        },
        "14": {
            "name": "I Industries Ltd.",
            "acronym": "IIL"
        },
        "15": {
            "name": "Feathery Hotels Group",
            "acronym": "FHG"
        },
        "16": {
            "name": "Symbiotic Ltd.",
            "acronym": "SYM"
        },
        "17": {
            "name": "Lucky Shots Casino",
            "acronym": "LSC"
        },
        "18": {
            "name": "Performance Ribaldry",
            "acronym": "PRN"
        },
        "19": {
            "name": "Eaglewood Mercenary",
            "acronym": "EWM"
        },
        "20": {
            "name": "Torn City Motors",
            "acronym": "TCM"
        },
        "21": {
            "name": "Empty Lunchbox Traders",
            "acronym": "ELT"
        },
        "22": {
            "name": "Home Retail Group",
            "acronym": "HRG"
        },
        "23": {
            "name": "Tell Group Plc.",
            "acronym": "TGP"
        },
        "24": {
            "name": "Munster Beverage Corp.",
            "acronym": "MUN"
        },
        "25": {
            "name": "West Side University",
            "acronym": "WSU"
        },
        "26": {
            "name": "International School TC",
            "acronym": "IST"
        },
        "27": {
            "name": "Big Al's Gun Shop",
            "acronym": "BAG"
        },
        "28": {
            "name": "Evil Ducks Candy Corp",
            "acronym": "EVL"
        },
        "29": {
            "name": "Mc Smoogle Corp",
            "acronym": "MCS"
        },
        "30": {
            "name": "Wind Lines Travel",
            "acronym": "WLT"
        },
        "31": {
            "name": "Torn City Clothing",
            "acronym": "TCC"
        },
        "32": {
            "name": "Alcoholics Synonymous",
            "acronym": "ASS"
        },
        "33": {
            "name": "Herbal Releaf Co.",
            "acronym": "CBD"
        },
        "34": {
            "name": "Lo Squalo Waste",
            "acronym": "LOS"
        }
    };
    */
    let stocks = {};
    let APIKey = getAPIKey();
    const t_red = "#d83500";
    const t_green = "#678c00";
    if (window.location.href.indexOf('page.php?sid=stocks') >= 0) {
        getStocksObject()
            .then(function(obj) {
                console.log("istock init");
                console.log(obj)
                appendTable();
                if ($("#istock-table").length > 0) {
                    const tempInterval = setInterval(updatePrice, 5000);
                }
                if (is_history_low_allowed) {
                    checkHistory();
                    const historyInterval = setInterval(updateHistoryLow, 10000);
                }
                const hideInterval = setInterval(hideInstantly, 500);
                let flag = true;
                const significantInterval = setInterval(() => {
                    //console.log(flag)
                    if (getLocalStorage("ISTOCK", "is_significant_change") && flag) {
                        setTimeout(() => { significantChange({}) }, 20000);
                        flag = false;
                    }
                    if (!getLocalStorage("ISTOCK", "is_significant_change")) {
                        flag = true;
                    }
                }, 20000);

                const stackChangeInterval = setInterval(stackChange, stack_change_refresh_frequency * 60000);
            })
            .catch((e) => console.log(e));




    }

    function getStocksObject() {
        return new Promise((resolve) => {
            APIDetect("torn", "", "stocks", function(res) {
                stocks = res.stocks;
                console.log("getStocksObject");
                resolve(stocks);
            }, function(error_msg) { console.log(error_msg) });
        });
    }

    function stackChange() {
        if (getLocalStorage("ISTOCK", "is_stack_change")) {
            const promises = Object.keys(stocks).map(function(item, index) { return makePromises(item) });
            Promise.all(promises)
                .then(function(value) {
                    let notify_arr = [];
                    for (let i in value) {
                        notify_arr = notify_arr.concat(value[i]);
                    }

                    if (notify_arr.length > 0) {
                        notify_arr.sort(function(a, b) {
                            return b.value - a.value;
                        });
                    }

                    let notify_text = "";
                    for (let i = 0; i < notify_arr.length; i++) {
                        const value = notify_arr[i].value;
                        const value_show = value > 0 ? "+" + value.toFixed(2) + "%" : value.toFixed(2) + "%";
                        notify_text += `${notify_arr[i].name}${value_show}  `;
                    }
                    const stack_change_period = getLocalStorage("ISTOCK", "stack_change_time_window") || 15;
                    NotificationComm(`[iStock] 在过去的${stack_change_period}分钟内以下股票价格变化较大`, { body: notify_text });
                    console.log(notify_text)
                })
                .catch(() => console.log("error"))
        }
    }

    function makePromises(stock_id) {
        return new Promise((resolve) => {
            APIDetect("torn", stock_id, "stocks", function(res) {
                const history = res.stocks[stock_id].history;
                //console.log(history.length)
                let notify_arr = [];
                let lowest_price = Infinity;
                let highest_price = 0;
                const stack_change_period = getLocalStorage("ISTOCK", "stack_change_time_window") || 15;
                for (let i = 0; i < stack_change_period; i++) {
                    if (history[i].price < lowest_price) {
                        lowest_price = history[i].price;
                    }
                    if (history[i].price > highest_price) {
                        highest_price = history[i].price;
                    }
                }
                const stack_change_percentage = getLocalStorage("ISTOCK", "stack_change_percent") || 0.3;
                const current_price = res.stocks[stock_id].current_price;
                const up = (current_price - lowest_price) / lowest_price * 100;
                if (up > stack_change_percentage) {
                    notify_arr.push({ "name": stocks[stock_id].acronym, "value": up });
                }
                const down = (current_price - highest_price) / highest_price * 100;
                if (down < -stack_change_percentage) {
                    notify_arr.push({ "name": stocks[stock_id].acronym, "value": down });
                }
                resolve(notify_arr);
            }, function(error_msg) { console.log(error_msg) });
        });
    }

    function significantChange(stock_prices_min_ago) {
        console.log("significantChange per 5s")
        const target_rows = $("#stockmarketroot").children("[class^='stockMarket___']").children("ul");
        if (target_rows.length > 0) {
            let stock_prices_current = {};

            target_rows.each(function(index, ele) {
                const stock_id = $(this).attr("id");
                const current_price = currentPrice($(this));
                stock_prices_current[stock_id] = current_price;

                if (stock_prices_min_ago != {}) {
                    const change_percent = (current_price - stock_prices_min_ago[stock_id]) / stock_prices_min_ago[stock_id] * 100;
                    const significant_change_percentage = getLocalStorage("ISTOCK", "significant_change_percent") || 0.3;
                    if (change_percent - significant_change_percentage >= 0) {
                        NotificationComm(`[iStock] 股票 (${stocks[stock_id].acronym}) ${stocks[stock_id].name}`, { body: `与上分钟比涨了${change_percent.toFixed(2)}% 当前股价为$${current_price}` });
                    } else if (change_percent + significant_change_percentage <= 0) {
                        NotificationComm(`[iStock] 股票 (${stocks[stock_id].acronym}) ${stocks[stock_id].name}`, { body: `与上分钟比跌了${change_percent.toFixed(2)}% 当前股价为$${current_price}` });
                    }
                }
            });
            if (getLocalStorage("ISTOCK", "is_significant_change")) {
                setTimeout(() => { significantChange(stock_prices_current) }, 5000);
            }
        }

    }

    function checkHistory() {
        const flag = getLocalStorageRootNode("ISTOCK_HISTORY_LOW");
        if (flag == undefined || flag == null) {
            for (const stock_id in stocks) {
                updateStockHistory(stock_id);
            }
        }
    }

    function updateHistoryLow() {
        const head_node = $("div#price").children("div").children("input");
        const target_rows = $("#stockmarketroot").children("[class^='stockMarket___']").children("ul");
        if (head_node.length > 0 && target_rows.length > 0) {
            console.log("updateHistoryLow per 10s");
            //week
            if (head_node.attr("value") == "7d") {
                //console.log("week")
                target_rows.each(function(index, ele) {
                    const stock_id = $(this).attr("id");
                    const high_low_arr = getWeeklyLow(stock_id);
                    const current_price = currentPrice($(this));
                    const current_position = (current_price - high_low_arr[1]) / (high_low_arr[0] - high_low_arr[1]) * 100;
                    const low_node = $(this).children("[class^='stockOwned___']").children("[class^='value___']");
                    const position_node = $(this).children("[class^='stockOwned___']").children("[class^='count___']");
                    low_node.text("周低：$" + high_low_arr[1]);
                    position_node.text("位置：" + current_position.toFixed(2) + "%");
                    if (current_price < high_low_arr[1]) {
                        //史低
                        NotificationComm(`[iStock] 股票 (${stocks[stock_id].acronym}) ${stocks[stock_id].name}`, { body: `当前股价为$${current_price} 已跌破周史低$${high_low_arr[1]}` });
                        updateStockHistory(stock_id);
                    } else if (current_price > high_low_arr[0]) {
                        //史高
                        updateStockHistory(stock_id);
                    }
                });
            }
            //month
            else if (head_node.attr("value") == "1m") {
                //console.log("month")
                target_rows.each(function(index, ele) {
                    const stock_id = $(this).attr("id");
                    const high_low_arr = getMonthlyLow(stock_id);
                    const current_price = currentPrice($(this));
                    const current_position = (current_price - high_low_arr[1]) / (high_low_arr[0] - high_low_arr[1]) * 100;
                    const low_node = $(this).children("[class^='stockOwned___']").children("[class^='value___']");
                    const position_node = $(this).children("[class^='stockOwned___']").children("[class^='count___']");
                    low_node.text("月低：$" + high_low_arr[1]);
                    position_node.text("位置：" + current_position.toFixed(2) + "%");
                    if (current_price < high_low_arr[1]) {
                        //史低
                        NotificationComm(`[iStock] 股票 (${stocks[stock_id].acronym}) ${stocks[stock_id].name}`, { body: `当前股价为$${current_price} 已跌破月史低$${high_low_arr[1]}` });
                        updateStockHistory(stock_id);
                    } else if (current_price > high_low_arr[0]) {
                        //史高
                        updateStockHistory(stock_id);
                    }
                });
            }
            //year day hour minute
            else {
                //console.log("year day hour minute")
                target_rows.each(function(index, ele) {
                    const stock_id = $(this).attr("id");
                    const high_low_arr = getYearlyLow(stock_id);
                    const current_price = currentPrice($(this));
                    const current_position = (current_price - high_low_arr[1]) / (high_low_arr[0] - high_low_arr[1]) * 100;
                    const low_node = $(this).children("[class^='stockOwned___']").children("[class^='value___']");
                    const position_node = $(this).children("[class^='stockOwned___']").children("[class^='count___']");
                    low_node.text("年低：$" + high_low_arr[1]);
                    position_node.text("位置：" + current_position.toFixed(2) + "%");
                    if (current_price < high_low_arr[1]) {
                        //史低
                        NotificationComm(`[iStock] 股票 (${stocks[stock_id].acronym}) ${stocks[stock_id].name}`, { body: `当前股价为$${current_price} 已跌破年史低$${high_low_arr[1]}` });
                        updateStockHistory(stock_id);
                    } else if (current_price > high_low_arr[0]) {
                        //史高
                        updateStockHistory(stock_id);
                    }
                });
            }
        }
    }

    function currentPrice(node) {
        let price_arr = [];
        const price_number_nodes = node.children("[class^='stockPrice___']").children("[class^='price___']").children("[class^='number___']");
        price_number_nodes.each(function() {
            price_arr.push($(this).text());
        });
        return price_arr.join("");
    }

    function updateStockHistory(stock_id) {
        APIDetect("torn", stock_id, "stocks", function(res) {
            const last_week = res.stocks[stock_id].last_week;
            const last_month = res.stocks[stock_id].last_month;
            const last_year = res.stocks[stock_id].last_year;
            const value = {
                "last_week": last_week,
                "last_month": last_month,
                "last_year": last_year,
            };
            updateLocalStorage("ISTOCK_HISTORY_LOW", stock_id, value);
        }, function(error_msg) { console.log(error_msg) });
    }

    function getWeeklyLow(stock_id) {
        const value = getLocalStorage("ISTOCK_HISTORY_LOW", stock_id);
        if (value != undefined && value != null) {
            return [value.last_week.high, value.last_week.low];
        } else {
            return [0, 0];
        }
    }

    function getMonthlyLow(stock_id) {
        const value = getLocalStorage("ISTOCK_HISTORY_LOW", stock_id);
        if (value != undefined && value != null) {
            return [value.last_month.high, value.last_month.low];
        } else {
            return [0, 0];
        }
    }

    function getYearlyLow(stock_id) {
        const value = getLocalStorage("ISTOCK_HISTORY_LOW", stock_id);
        if (value != undefined && value != null) {
            return [value.last_year.high, value.last_year.low];
        } else {
            return [0, 0];
        }
    }

    function APIDetect(field, id, selections, success, failure) {
        const API = `https://api.torn.com/${field}/${id}?selections=${selections}&key=${APIKey}`;
        console.log(`Request: ${API}`);
        fetch(API)
            .then((res) => {
                if (res.ok) {
                    return res.json();
                } else {
                    failure('发生错误: 蛙蛙探测失败，请刷新重试');
                    return;
                }
            }, networkError => {
                failure('发生错误：蛙蛙探测失败，网络异常，请刷新重试');
                return;
            }).then((res) => {
            console.log(`Response: ${API}`);
            if (res.error != undefined) {
                if (res.error.code == 2) {
                    failure("错误代号：2 错误内容：APIKey已过期");
                    window.localStorage.setItem("APIKey", "");
                    getAPIKey();
                } else if (res.error.code == 7) {
                    failure("错误代号：7 错误内容：无读取权限");
                } else {
                    failure(`错误代号: ${res.error.code} 错误内容: ${res.error.error}`);
                }
                return;
            } else {
                success(res);
            }
        });
    }

    function appendTable() {
        /*
        绘制表头
        */
        $("#stockmarketroot").before(`
			<div id="istock-status" style="margin-bottom:10px;text-align: center;font-size: 20px; color: darkblue"></div>
			<div id="istock-table" style="margin-bottom:10px">
				<table style="margin: auto; background-color: white;">
					<tr class="istock-head">
						<th class="istock-buytime mobile-hide">入</th>
                        <th class="istock-benefit mobile-hide">分红</th>
						<th class="istock-logo mobile-show">图片</th>
						<th class="istock-abbr mobile-hide">缩写</th>
						<th class="istock-shares mobile-hide">股</th>
						<th class="istock-value mobile-show">总价</th>
						<th class="istock-buyprice mobile-hide">买入价</th>
						<th class="istock-currentprice mobile-show">当前价</th>
						<th class="istock-change mobile-show">变化</th>
						<th class="istock-profit mobile-show">盈利</th>
						<th class="istock-takeprofit mobile-hide">止盈值</th>
						<th class="istock-stoploss mobile-hide">止损值</th>
						<th class="istock-watch mobile-hide">提醒</th>
						<th class="istock-hide mobile-show">隐藏</th>
					</tr>
				</table>
			</div>
            <div id="istock-statistics" style="text-align:center;">
                <div style="padding:8px 5px 8px 5px; margin:0px 5px 5px 0px; background-color:rgb(69,137,148); display:inline-block;">
                    <span style="padding:3px; color:#fff; font-weight:bold;">历史盈利</span>
                    <span id="net_profit" style="padding:3px; background:rgb(3,54,73); border-radius:2px; color:#fff; font-weight:bold;"></span>
                    <span style="padding:3px; color:#fff; font-weight:bold;">占比</span>
                    <span id="net_percent" style="padding:3px; background:rgb(3,54,73); border-radius:2px; color:#fff; font-weight:bold;"></span>
                </div>
                <div style="padding:8px 5px 8px 5px; margin-bottom:5px; background-color:rgb(117, 121, 71); display:inline-block;">
                    <span style="padding:3px; color:#fff; font-weight:bold;">当前股本</span>
                    <span id="current_cap" style="padding:3px; background:rgb(47, 43, 3); border-radius:2px; color:#fff; font-weight:bold;"></span>
                    <span style="padding:3px; color:#fff; font-weight:bold;">盈利</span>
                    <span id="current_profit" style="padding:3px; background:rgb(47, 43, 3); border-radius:2px; color:#fff; font-weight:bold;"></span>
                </div>
            </div>
            <div id="istock-settings" style="text-align:center;">
                <div style="padding:5px; margin:0px 5px 5px 0px; background-color:rgb(69,137,148); display:inline-block;">
                    <span style="padding:3px; color:#fff; font-weight:bold;">突变提醒</span>
                    <input type="checkbox" id="significant_change""></span>
                    <span style="padding:3px; color:#fff; font-weight:bold;">幅度(%)</span>
                    <input type="text" size="2" id="significant_change_percent" style="border:1px solid darkgray; text-align:right"></span>
                </div>
                <div style="padding:5px; margin-bottom:5px; background-color:rgb(117, 121, 71); display:inline-block;">
                    <span style="padding:3px; color:#fff; font-weight:bold;">渐变提醒</span>
                    <input type="checkbox" id="stack_change""></span>
                    <span style="padding:3px; color:#fff; font-weight:bold;">幅度(%)</span>
                    <input type="text" size="2" id="stack_change_percent" style="border:1px solid darkgray; text-align:right"></span>
                    <span style="padding:3px; color:#fff; font-weight:bold;">窗口(min)</span>
                    <input type="text" size="2" id="stack_change_time_window" style="border:1px solid darkgray; text-align:right"></span>
                </div>
            </div>
		`);
        $("#istock-table").find("th").attr("style", "border: 1px solid darkgray; padding: 5px; background-color: black; color: white; font-weight: bold; text-align: center;");
        /*
        读取API user->stocks
        */
        //API = `https://api.torn.com/user/?selections=stocks&key=${APIKey}`;
        const tips = $("#istock-status");
        tips.text("---探测中---");
        APIDetect("user", "", "stocks,personalstats", function(res) {
            tips.text("---探测完成---");
            /*
            计算总净利润和百分比
            */
            const net_profit = res.personalstats.stockprofits - res.personalstats.stocklosses - res.personalstats.stockfees;
            const net_percent = net_profit / res.personalstats.stockprofits * 100;
            $("#net_profit").text("$" + toThousands(net_profit));
            $("#net_percent").text(net_percent.toFixed(2) + "%");
            /*
            按照购买时间排序
            */
            let sorted_res = [];
            $.each(res.stocks, function(index, value) {
                $.each(value.transactions, function(k, v) {
                    v.transaction_id = k;
                    v.stock_id = value.stock_id;
                    if ("benefit" in value) {
                        v.benefit = value.benefit;
                    } else if ("dividend" in value) {
                        v.benefit = value.dividend
                    } else {
                        v.benefit = 0;
                    }
                    sorted_res.push(v);
                });
            });
            sorted_res.sort(function(a, b) { return (b.time_bought - a.time_bought) });
            /*
            读取当前拥有的每条股票，并绘制表格内容
            */
            //console.log(sorted_res)
            $.each(sorted_res, function(index, value) {
                $("#istock-table").children().children().append(`
					<tr class="istock-content" transactionid="${value.transaction_id}" stockid="${value.stock_id}">
						<td class="istock-buytime mobile-hide" style="padding:5px;color:${timestamp2timespan(value.time_bought)[1]}; text-align:right;">${timestamp2timespan(value.time_bought)[0]}</td>
                        <td class="istock-benefit mobile-hide" style="padding:5px;color:${getBenefit(value.benefit)[0]}; text-align:center;font-weight:bold;">${getBenefit(value.benefit)[1]}</td>
						<td class="istock-logo mobile-show" style="padding:1px;text-align:center">
							<img src="/images/v2/stock-market/logos/${stocks[value.stock_id.toString()].acronym}.svg" style="height:20px;width:20px;margin-bottom:-4px;border:0px;padding:0px;cursor:pointer;">
						</td>
						<td class="istock-abbr mobile-hide" style="padding:5px;text-align:right"  title="${stocks[value.stock_id.toString()].name}" style="text-align:center">${stocks[value.stock_id.toString()].acronym}</td>
						<td class="istock-shares mobile-hide" style="padding:5px;text-align:right">${toThousands(value.shares)}</td>
						<td class="istock-value mobile-show" style="padding:5px;text-align:right">$${toThousands(parseInt(value.bought_price*value.shares))}</td>
						<td class="istock-buyprice mobile-hide" style="padding:5px;text-align:right">$${value.bought_price.toFixed(2)}</td>
						<td class="istock-currentprice mobile-show" style="padding:5px;text-align:right">当前价</td>
						<td class="istock-change mobile-show" style="padding:5px;text-align:right">变化</td>
						<td class="istock-profit mobile-show" style="padding:5px;text-align:right">盈利</td>
						<td class="istock-takeprofit mobile-hide" style="padding:3px;">
							<input type="text" size="4" style="border:1px solid darkgray; background-color:lightgreen;text-align:right">
						</td>
						<td class="istock-stoploss mobile-hide" style="padding:3px;">
							<input type="text" size="4" style="border:1px solid darkgray; background-color:lightgreen;text-align:right">
						</td>
						<td class="istock-watch mobile-hide" style="padding:4px;text-align:center">
							<input type="checkbox" class="istock-watch-checkbox">
						</td>
						<td class="istock-hide mobile-show" style="padding:4px;text-align:center">
							<input type="checkbox" class="istock-hide-checkbox">
						</td>
					</tr>
				`);
            });
            $("#istock-table").find("td").css("border", "1px solid darkgray");
            /*
            手机端显示优化
            */
            if ($("#stockmarketroot")[0].clientWidth < 400) {
                $("#istock-table").find(".mobile-hide").addClass("hide");
                $("#istock-table").find("th.istock-logo").text("图");
                $("#istock-table").find("th.istock-hide").text("隐");
                if ($("#istock-status").text().indexOf("错误") < 0) {
                    $("#istock-status").addClass("hide");
                }
            }
            /*
            单击图标快速定位股票
            */
            $("td.istock-logo").click(function() {
                const stock_id = $(this).parent().attr("stockid");
                window.location.hash = "#" + stock_id;
                $("#" + stock_id).css("background-color", "lightgreen");
                setTimeout(() => { removeColor(stock_id) }, 1000);
            });
            /*全选*/
            function checkAll(head_node, children_node) {
                head_node.css("cursor", "pointer");
                head_node.click(function() {
                    const checkArray = children_node.toArray();
                    let count = 0;
                    $.each(checkArray, function(key, val) {
                        if (val.checked) {
                            count++;
                        }
                    });
                    if (count == checkArray.length) {
                        children_node.attr("checked", false);
                    } else {
                        children_node.attr("checked", true);
                    }
                });
            }
            checkAll($("th.istock-watch"), $(".istock-watch-checkbox"));
            checkAll($("th.istock-hide"), $(".istock-hide-checkbox"));
            /*
            显示与隐藏模块
            */
            /*$(".istock-hide-checkbox").change(function() {
                const sib = $(this).parent().siblings();
                if (sib.first().css("opacity") == 1) {
                    sib.fadeTo("slow", 0.1);
                } else {
                    sib.fadeTo("slow", 1);
                }
            });*/
            /*
            表格载入后从localstorage读取配置
            */
            const settings = getLocalStorageRootNode("ISTOCK");
            if (settings != undefined && settings != null) {
                if (settings.is_significant_change == 1) {
                    $("#significant_change").prop("checked", true);
                }
                $("#significant_change_percent").val(settings.significant_change_percent);
                if (settings.is_stack_change == 1) {
                    $("#stack_change").prop("checked", true);
                }
                $("#stack_change_percent").val(settings.stack_change_percent);
                $("#stack_change_time_window").val(settings.stack_change_time_window);
            }
            $("tr.istock-content").each(function() {
                const ls_object = getLocalStorage("ISTOCK", $(this).attr("transactionid"));
                if (ls_object != undefined && ls_object != null) {
                    $(this).children(".istock-takeprofit").children().val(ls_object.take_profit);
                    $(this).children(".istock-stoploss").children().val(ls_object.stop_loss);
                    if (ls_object.watch == 1) {
                        $(this).children(".istock-watch").children().prop("checked", true);
                    }
                    if (ls_object.hide == 1) {
                        $(this).children(".istock-hide").children().prop("checked", true);
                        $(this).children(".istock-hide").siblings().fadeTo("slow", 0.1);
                    }
                }
            });
        }, function(error_msg) { tips.text(error_msg) });
    }

    function updatePrice() {
        console.log("updatePrice per 5s")
        let transaction_object = {};
        const target_nodes = $("#istock-table").find("td.istock-currentprice");
        //const name_containers = $("[class^='nameContainer___']");
        const stock_node = $("[class^='stock___']");
        /*
        统计总股本和总盈利
        */
        let current_cap = 0;
        let current_profit = 0;
        target_nodes.each(function(index, value) {
            /*
            用股票页面自带数据，更新表格内价格，不用读取API
            */
            const stock_name = $(this).siblings("td.istock-abbr").attr("title");
            const stock_abbr = $(this).siblings("td.istock-abbr").text();
            const stock_id = $(this).parent().attr("stockid");
            let stock_price_array = [];
            stock_node.each(function(k, v) {
                if ($(this).attr("id") == stock_id) {
                    const stock_price_numbers = $(this).children("[class^='stockPrice___']").children("[class^='price___']").children("[class^='number___']");
                    stock_price_numbers.each(function() {
                        stock_price_array.push($(this).text());
                    });
                }
            });
            const current_price = stock_price_array.join("");
            const bought_price = $(this).siblings("td.istock-buyprice").text().replace("$", "");
            const shares = $(this).siblings("td.istock-shares").text().replace(/,/g, "");
            const price_change = parseFloat(current_price) - parseFloat(bought_price);
            const price_change_percent = price_change / parseFloat(bought_price) * 100;
            const percent_color = price_change_percent >= 0 ? t_green : t_red;
            const profit = parseInt(shares) * price_change;
            const profit_color = profit >= 0 ? t_green : t_red;
            $(this).text("$" + current_price);
            $(this).siblings("td.istock-change").text(price_change_percent.toFixed(2) + "%").css("color", percent_color);
            $(this).siblings("td.istock-profit").text("$" + toThousands(Math.round(profit))).css("color", profit_color);
            /*
            统计总股本和总盈利
            */
            const cap = $(this).siblings("td.istock-value").text().replace("$", "").replace(/,/g, "");
            current_cap += parseInt(cap);
            current_profit += profit;
            /*
            表格信息存入array，之后会存入localstorage
            */
            const transcastion_id = $(this).parent().attr("transactionid");
            const take_profit = $(this).siblings(".istock-takeprofit").children("input").val();
            const stop_loss = $(this).siblings(".istock-stoploss").children("input").val();
            const watch = $(this).siblings(".istock-watch").children(":checked").length ? 1 : 0;
            const hide = $(this).siblings(".istock-hide").children(":checked").length ? 1 : 0;
            transaction_object[transcastion_id] = {
                "take_profit": take_profit,
                "stop_loss": stop_loss,
                "watch": watch,
                "hide": hide
            };
            /*
            右下角提醒模块
            */
            if (watch == 1 && take_profit != "" && isNaN(take_profit) == false) {
                if (is_percentage_allowed) {
                    if (price_change_percent >= take_profit) {
                        NotificationComm(`[iStock] 股票 (${stock_abbr}) ${stock_name}`, { body: `当前涨幅为${price_change_percent.toFixed(2)}% 已达到设置涨幅${take_profit}%` });
                        $(this).siblings(".istock-watch").children().prop("checked", false);
                    }
                } else {
                    if (parseFloat(current_price) >= take_profit) {
                        NotificationComm(`[iStock] 股票 (${stock_abbr}) ${stock_name}`, { body: `当前股价为${current_price} 已达到设置高价${take_profit}` });
                        $(this).siblings(".istock-watch").children().prop("checked", false);
                    }
                }
            }
            if (watch == 1 && stop_loss != "" && isNaN(stop_loss) == false) {
                if (is_percentage_allowed) {
                    if (price_change_percent <= stop_loss) {
                        NotificationComm(`[iStock] 股票 (${stock_abbr}) ${stock_name}`, { body: `当前跌幅为${price_change_percent.toFixed(2)}% 已达到设置跌幅${stop_loss}%` });
                        $(this).siblings(".istock-watch").children().prop("checked", false);
                    }
                } else {
                    if (parseFloat(current_price) <= stop_loss) {
                        NotificationComm(`[iStock] 股票 (${stock_abbr}) ${stock_name}`, { body: `当前股价为${current_price} 已达到设置低价${stop_loss}` });
                        $(this).siblings(".istock-watch").children().prop("checked", false);
                    }
                }
            }
        });
        /*
        正式存入localstorage
        */
        transaction_object["is_significant_change"] = $("#significant_change:checked").length ? 1 : 0;
        transaction_object["significant_change_percent"] = $("#significant_change_percent").val();
        transaction_object["is_stack_change"] = $("#stack_change:checked").length ? 1 : 0;
        transaction_object["stack_change_percent"] = $("#stack_change_percent").val();
        transaction_object["stack_change_time_window"] = $("#stack_change_time_window").val();
        window.localStorage.setItem("ISTOCK", JSON.stringify(transaction_object));

        /*
        更新顶部提示信息
        */
        const watch_task_number = $("td.istock-watch").children(":checked").length;
        if ($("#istock-status").text().indexOf("错误") < 0) {
            $("#istock-status").text(`当前有 ${watch_task_number} 个监视任务正在运行中……`);
        }
        /*
        统计总股本和总盈利
        */
        $("#current_cap").text("$" + toThousands(current_cap));
        $("#current_profit").text("$" + toThousands(Math.round(current_profit)));
    }

    function hideInstantly() {
        /*隐藏*/
        const hide_node = $("td.istock-hide");
        hide_node.each(function() {
            if ($(this).children().attr("checked") == "checked") {
                $(this).siblings().fadeTo("fast", 0.1);
            } else {
                $(this).siblings().fadeTo("fast", 1);
            }
        });
    }

    function toThousands(num) {
        return (num || 0).toString().replace(/(\d)(?=(?:\d{3})+$)/g, '$1,');
    }

    function removeColor(stock_id) {
        $("#" + stock_id).css("background-color", "");
    }

    function getBenefit(benefit) {
        //console.log(benefit)
        if (benefit == 0) {
            return [t_red, "未"];
        } else {
            if (benefit.ready == 0) {
                return [t_red, `${benefit.progress}/${benefit.frequency}`];
            } else {
                return [t_green, "已"];
            }
        }
    }

    function timestamp2timespan(ts) {
        const d = new Date();
        const now = parseInt(d.getTime() / 1000);
        const timediff = now - ts;
        let timediff_format = "";
        let timediff_color = "";
        if (timediff >= 60 && timediff < 3600) {
            timediff_format = parseInt(timediff / 60) + "m";
            timediff_color = "#7CCD7C";
        } else if (timediff >= 3600 && timediff < 86400) {
            timediff_format = parseInt(timediff / 3600) + "h";
            timediff_color = "#FF8C00";
        } else if (timediff >= 86400) {
            timediff_format = parseInt(timediff / 86400) + "d";
            timediff_color = "#FF3030";
        } else {
            timediff_format = timediff + "s";
            timediff_color = "#7CCD7C";
        }
        return [timediff_format, timediff_color];
    }

    function getLocalStorageRootNode(key1) {
        if (window.localStorage === undefined) {
            return undefined;
        } else if (window.localStorage.getItem(key1) === null) {
            return null;
        } else {
            const json = JSON.parse(window.localStorage.getItem(key1));
            return json;
        }
    }

    function getLocalStorage(key1, key2) {
        const json = getLocalStorageRootNode(key1);
        if (json === undefined) {
            return undefined;
        } else if (json === null) {
            return null;
        } else {
            if (json[key2] === undefined) {
                return undefined;
            } else {
                return json[key2];
            }
        }
    }

    function updateLocalStorage(key1, key2, value) {
        if (window.localStorage === undefined) {
            return undefined;
        } else if (window.localStorage.getItem(key1) === null) {
            let json = {};
            json[key2] = value;
            window.localStorage.setItem(key1, JSON.stringify(json));
        } else {
            let json = JSON.parse(window.localStorage.getItem(key1));
            json[key2] = value;
            window.localStorage.setItem(key1, JSON.stringify(json));
        }
    }

    function getAPIKey() {
        let key = window.localStorage.getItem("APIKey");
        if (key == null || key == "") {
            console.log('no key...');
            if (window.location.href.indexOf('preferences.php') >= 0) {
                console.log('on setting page');
                const refresher = setInterval(function() {
                    console.log('refreshing');
                    $("input").each(function() {
                        const input_value = $(this).val();
                        if (input_value.length == 16) {
                            key = input_value;
                            window.localStorage.setItem("APIKey", key);
                            console.log("apikey get " + key);
                            clearInterval(refresher);
                            alert('APIKey设置成功，点击确定前往股市页面');
                            window.location.href = 'https://www.torn.com/page.php?sid=stocks';
                        }
                    });
                }, 300);
            } else {
                console.log('switch to setting page');
                alert('APIKey未设置或设置错误，点击确定前往设置页面');
                window.location.href = 'https://www.torn.com/preferences.php#tab=api';
            }
        }
        return key;
    }

    function NotificationComm(title, option) {
        if ('Notification' in window) { // 判断浏览器是否兼容Notification消息通知
            window.Notification.requestPermission(function(res) { // 获取用户是否允许通知权限
                if (res === 'granted') { // 允许
                    let notification = new Notification(title || '这是一条新消息', Object.assign({}, {
                        dir: "auto", // 字体排版,auto,lt,rt
                        icon: '', // 通知图标
                        body: '请尽快处理该消息', // 主体内容
                        //tag: 'renotify',
                        renotify: false // 当有新消息提示时，是否一直关闭上一条提示
                    }, option || {}));
                    notification.onerror = function(err) { // error事件处理函数
                        throw err;
                    }
                    notification.onshow = function(ev) { // show事件处理函数
                        console.log(ev);
                    }
                    notification.onclick = function(ev) { // click事件处理函数
                        console.log(ev);
                        notification.close();
                    }
                    notification.onclose = function(ev) { // close事件处理函数
                        console.log(ev);
                    }
                } else {
                    alert('该网站通知已被禁用，请在设置中允许');
                }
            });
        } else { // 兼容当前浏览器不支持Notification的情况
            const documentTitle = document.title,
                index = 0;
            const time = setInterval(function() {
                index++;
                if (index % 2) {
                    document.title = '【　　　】' + documentTitle;
                } else {
                    document.title = '【新消息】' + documentTitle;
                }
            }, 1000);
            const fn = function() {
                if (!document.hidden && document.visibilityState === 'visible') {
                    clearInterval(time);
                    document.title = documentTitle;
                }
            }
            fn();
            document.addEventListener('visibilitychange', fn, false);
        }
    }

})();