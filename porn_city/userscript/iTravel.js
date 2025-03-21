// ==UserScript==
// @name         iTravel
// @namespace    TornExtensions
// @version      2.2
// @description  显示下次吃药时间，飞行到达目的地时间，方便设置闹钟
// @author       htys [1545351]
// @match        https://www.torn.com/*.php*
// @grant        GM_xmlhttpRequest
// @connect      yata.yt
// @updateURL    https://raw.githubusercontent.com/zmpress/game_script/refs/heads/main/porn_city/userscript/iTravel.js
// @downloadURL    https://raw.githubusercontent.com/zmpress/game_script/refs/heads/main/porn_city/userscript/iTravel.js

// ==/UserScript==

(function() {
    'use strict';
    //const $ = window.jQuery;
    const stockAPI = "https://yata.yt/api/v1/travel/export/";//海外库存数据源，此处为yata
    const stock_refresh = 10;    //库存数据源刷新频率，默认10分钟刷新一次（最小5）
    const basic_refresh = 1;     //基础刷新频率，默认1分钟最多读取2条torn api（最小1）
    const notify = true;         //是否开启通知提醒
    const notify_minute = 2;     //提前几分钟提醒，默认提前2分钟提醒（最小1）
    let APIKey = getAPIKey();
    const destination = {
        "Mexico": {
            "name3e" : "mex",
            "name3" : "墨西哥",
            "name" : "墨西哥",
            "time" : 18,
            "buylist" : {
                "258" : "[偶]Jaguar",
                "260" : "[花]Dahlia"
            }
        },
        "Cayman": {
            "name3e" : "cay",
            "name3" : "达开曼",
            "name" : "开曼",
            "time" : 25,
            "buylist" : {
                "616" : "[弹]Trout",
                "618" : "[偶]Stingray",
                "617" : "[花]BananaOrchid"
            }
        },
        "Canada": {
            "name3e" : "can",
            "name3" : "加拿大",
            "name" : "加拿大",
            "time" : 29,
            "buylist" : {
                "261" : "[偶]Wolverine",
                "263" : "[花]Crocus"
            }
        },
        "Hawaii": {
            "name3e" : "haw",
            "name3" : "夏威夷",
            "name" : "夏威夷",
            "time" : 94,
            "buylist" : {
                "264" : "[花]Orchid"
            }
        },
        "United": {
            "name3e" : "uni",
            "name3" : "达英国",
            "name" : "英国",
            "time" : 111,
            "buylist" : {
                "266" : "[偶]Nessie",
                "268" : "[偶]RedFox",
                "267" : "[花]Heather"
            }
        },
        "Argentina": {
            "name3e" : "arg",
            "name3" : "阿根廷",
            "name" : "阿根廷",
            "time" : 117,
            "buylist" : {
                "256" : "[弹]TearGas",
                "269" : "[偶]Monkey",
                "271" : "[花]Ceibo"
            }
        },
        "Switzerland": {
            "name3e" : "swi",
            "name3" : "达瑞士",
            "name" : "瑞士",
            "time" : 123,
            "buylist" : {
                "222" : "[弹]FlashGrenade",
                "273" : "[偶]Chamois",
                "272" : "[花]Edelweiss"
            }
        },
        "Japan": {
            "name3e" : "jap",
            "name3" : "达日本",
            "name" : "日本",
            "time" : 158,
            "buylist" : {
                "277" : "[花]CherryBlossom"
            }
        },
        "China": {
            "name3e" : "chi",
            "name3" : "达中国",
            "name" : "中国",
            "time" : 169,
            "buylist" : {
                "274" : "[偶]Panda",
                "276" : "[花]Peony"
            }
        },
        "UAE": {
            "name3e" : "uae",
            "name3" : "阿联酋",
            "name" : "阿联酋",
            "time" : 190,
            "buylist" : {
                "384" : "[偶]Camel",
                "385" : "[花]TribulusOmanense"
            }
        },
        "South": {
            "name3e" : "sou",
            "name3" : "达南非",
            "name" : "南非",
            "time" : 208,
            "buylist" : {
                //"226" : "[弹]SmokeGrenade",
                "206" : "[药]Xanax",
                "281" : "[偶]Lion",
                "282" : "[花]AfricanViolet"
            }
        },
        "Torn": {
            "name3e" : "tor",
            "name3" : "达Torn",
            "name" : "Torn",
            "time" : 0,
            "buylist" : ""
        }
    }

    if(basic_refresh >= 1 && APIKey != null && APIKey != "") {
        $(".tc-clock-tooltip").append("<div id='drugcd'></div><div id='travelcd'></div><div id='itravel'><p><a href='/travelagency.php' target='_blank'><span class='t-blue'>##### </span><span class='t-green'>iTravel 2.1</span><span class='t-blue'> #####</span></p></a></div><div id='travel-hub'></div>");
        iTravel();
        const intervalID = setInterval(iTravel, 60000 * basic_refresh);
        $('#itravel').click(function() {
            const item = $('#travel-hub');
            if(item.attr('hidden')) {
                item.removeAttr('hidden');
            }
            else {
                item.attr('hidden','hidden');
            }
        });
    }

    function getAPIKey() {
        let key = window.localStorage.getItem("APIKey");
        if(key == null || key == "") {
            console.log('no key...');
            if(window.location.href.indexOf('preferences.php') >= 0) {
                console.log('on setting page');
                const refresher = setInterval(function() {
                    console.log('refreshing');
                    $("input").each(function() {
                        const input_value = $(this).val();
                        if (input_value.length == 16) {
                            key = input_value;
                            window.localStorage.setItem("APIKey",key);
                            console.log("apikey get "+key);
                            clearInterval(refresher);
                            alert('APIKey设置成功，点击确定前往主页');
                            window.location.href = 'https://www.torn.com/index.php';
                        }
                    });
                }, 300);
            }
            else {
                console.log('switch to setting page');
                alert('APIKey未设置或设置错误，点击确定前往设置页面');
                window.location.href = 'https://www.torn.com/preferences.php#tab=api';
            }
        }
        return key;
    }

    function getLocalStorage(key1,key2) {
        if(!window.localStorage) {
            return false;
        }
        else if(!window.localStorage.getItem(key1)) {
            return false;
        }
        else {
            const json = JSON.parse(window.localStorage.getItem(key1));
            if(!json[key2]) {
                return false;
            }
            else {
                return json[key2];
            }
        }
    }

    function updateLocalStorage(key1,key2,value) {
        if(!window.localStorage) {
            return false;
        }
        else if(!window.localStorage.getItem(key1)) {
            return false;
        }
        else {
            const json = JSON.parse(window.localStorage.getItem(key1));
            json[key2] = value;
            window.localStorage.setItem(key1,JSON.stringify(json));
        }
    }

    function getYataData(now) {
        $('#travel-hub').append("<p><span class='t-blue'>##### </span><span class='t-green'>正在更新</span><span class='t-blue'> #####</span></p>");
        GM_xmlhttpRequest({
            method: 'GET',
            timeout: 40000,
            url: stockAPI,
            responseType: 'text',
            onload: function(e) {
                try {
                    console.log('yata fetched');
                    const stock = JSON.parse(e.responseText)['stocks'];
                    //console.log(typeof(e),typeof(e.responseText))
                    //const stock = e.responseText['stocks'];
                    let target_list = {};
                    target_list['last-updated'] = now;
                    target_list['stocks'] = {};
                    if (stock) {
                        //console.log(stock)
                        for (let country3e in stock) {
                            let buylist = {};
                            for (let country in destination) {
                                if (country3e == destination[country].name3e) {
                                    buylist = destination[country].buylist;
                                }
                            }

                            const country_stocks = stock[country3e].stocks;

                            for (let i=0;i<country_stocks.length;i++) {
                                if (country_stocks[i].id in buylist) {
                                    const item_id = country_stocks[i].id;
                                    target_list.stocks[item_id] = country_stocks[i];
                                }
                            }
                        }
                        window.localStorage.setItem("travel_stocks",JSON.stringify(target_list));
                        const travel_text = travelText(target_list.stocks,0);
                        $('#travel-hub').children().remove();
                        $('#travel-hub').append(travel_text);
                        const travel_des = getLocalStorage("travel","destination");
                        const des = travel_des.split(" ")[0];
                        if(des != 'Torn') {
                            $('#'+des+'').addClass('t-red');
                        }
                    }
                } catch (error) {
                    console.log(error);;
                }
            },
            onerror: (err) => {
                console.log('yata load failed');
            },
            onloadstart : (err) => {
                console.log('yata start to fetch');
            },
            ontimeout: (err) => {
                console.log('yata fetch timeout');
            }
        });
    }

    function iTravel() {
        const now = parseInt(new Date().getTime()/1000);
        const cooldown_ts = getLocalStorage("cooldown","tsDrug");
        const travel_des = getLocalStorage("travel","destination");
        const travel_ts = getLocalStorage("travel","tsArrive");
        const last = getLocalStorage("travel_stocks","last-updated");
        const stocks = getLocalStorage("travel_stocks","stocks");
        //console.log(Object.keys(stocks).length)
        $('#travel-hub').children(':last').remove();
        if(cooldown_ts > 0) {//LS中有CD数据
            const drug_diff = now - cooldown_ts;
            if(drug_diff >= 0) {//drug cd已结束，每隔1min读取一次api
                getCooldown(now);
            }
            else if(drug_diff < 0) {//CD未结束 显示下次吃药时间 CD不足2min则显示通知
                const drugCD = new Date(cooldown_ts*1000);
                const drugCD_str = drugCD.toTimeString().substr(0,8);
                $('#drugcd').children().remove();
                $('#drugcd').append("<span>下次吃药时间 - "+drugCD_str+"</span>")
                const cooldown_notify = getLocalStorage("cooldown","notify");
                if(notify && notify_minute >= 1 && drug_diff > (-60*notify_minute) && drug_diff < (60-60*notify_minute) && (cooldown_notify == "notyet" || !cooldown_notify)) {
                    NotificationComm('[iTravel] Drug冷却即将结束', { body: '将在'+notify_minute+'分钟内结束Drug冷却' });
                    updateLocalStorage("cooldown","notify","hasdone");
                }
            }
        }
        else {//LS中无CD数据，读取一次api
            getCooldown(now);
        }
        if(travel_ts > 0) {
            const travel_diff = now - travel_ts;
            if(travel_diff >= 0) {//现在时间 超过预计降落时间
                getTravel(now);
            }
            else if(travel_diff < 0) {//还未降落
                const travelCD = new Date(travel_ts*1000);
                const travelCD_str = travelCD.toTimeString().substr(0,8);
                const des = travel_des.split(" ")[0];
                const des_chn = destination[des].name3;
                $('#travelcd').children().remove();
                $('#travelcd').append("<span>到"+des_chn+"时间 - "+travelCD_str+"</span>")
                const travel_notify = getLocalStorage("travel","notify");
                if(notify && notify_minute >= 1 && travel_diff > (-60*notify_minute) && travel_diff < (60-60*notify_minute) && (travel_notify == "notyet" || !travel_notify)) {
                    NotificationComm('[iTravel] 飞行时间即将结束', { body: '将在'+notify_minute+'分钟内到'+des_chn });
                    updateLocalStorage("travel","notify","hasdone");
                }
            }
        }
        else{
            getTravel(now);
        }
        if(last > 0 && stock_refresh >= 5 && Object.keys(stocks).length > 0) {
            if(now - last > 60 * stock_refresh) {//每隔10min更新yata
                getYataData(now);
            }
            else {
                const travel_text = travelText(stocks,parseInt((now - last) / 60));
                $('#travel-hub').children().remove();
                $('#travel-hub').append(travel_text);
                const des = travel_des.split(" ")[0];
                if(des != 'Torn') {
                    $('#'+des).addClass('t-red');
                }
            }
        }
        else {
            getYataData(now);
        }
    }

    function travelText(stocks,min) {
        let travel_text = "";

        for(let country in destination) {
            if(country != 'Torn') {
                //console.log(country);
                let title_text = "<b>"+destination[country].name+"</b> :";
                let main_text = "";
                let buylist = []
                for(let item_id in destination[country].buylist) {
                    if (stocks[item_id] == undefined) {
                        console.log("no stocks for "+item_id);
                    }
                    else {
                        title_text += "<br><b>"+destination[country].buylist[item_id]+"</b> : "+stocks[item_id].quantity;
                        main_text += "|"+stocks[item_id].quantity;
                        buylist.push(stocks[item_id].quantity);
                    }
                }
                const sharps = sharpsAppend(destination[country].name,buylist);
                travel_text += "<p><span id='"+country+"' title='"+title_text+"'>"+destination[country].name+main_text.replace("|"," ")+"</span><span class='t-blue'> "+sharps+"</span></p>";
            }
        }
        travel_text += "<p><span class='t-blue'>##### </span><span class='t-green'>"+min+"m前更新</span><span class='t-blue'> #####</span></p>";


        return travel_text;
    }

    function sharpsAppend(country,s) {
        let digits = 0;
        //console.log(country.length);
        for(let i=0;i<s.length;i++) {
            if(s[i] <= 10000 && s[i] >= 1000) {
                digits += 4;
            }
            else if(s[i] <= 999 && s[i] >= 100) {
                digits += 3;
            }
            else if(s[i] <= 99 && s[i] >= 10) {
                digits += 2;
            }
            else{
                digits += 1;
            }
        }
        //console.log(digits);
        const result = 17 - country.length * 2 - digits;
        let sharps = "";
        if(result > 0) {
            sharps = "#".repeat(result);
            if(s.length <= 1) {
                sharps = sharps+"#";
            }
            else if(s.length == 2) {
                sharps = sharps+"|";
            }
        }
        return sharps;
    }

    function getCooldown(now) {

        const API = `https://api.torn.com/user/?selections=cooldowns&key=${APIKey}`;
        fetch(API)
            .then((res) => res.json())
            .then((res) => {
                if(res.cooldowns) {
                    console.log("cooldowns API fetched");
                    const drug = res.cooldowns.drug;
                    const drug_next = drug + now;
                    const json_set = {"tsDrug":drug_next,"notify":"notyet"};
                    window.localStorage.setItem("cooldown",JSON.stringify(json_set));
                    if(drug != 0) {
                        const drugCD = new Date(drug_next*1000);
                        const drugCD_str = drugCD.toTimeString().substr(0,8);
                        $('#drugcd').children().remove();
                        $('#drugcd').append("<span>下次吃药时间 - "+drugCD_str+"</span>")
                    }
                }
                else if(res.error.code == 2) {
                    console.log("Incorrect key");
                    window.localStorage.setItem("APIKey","");
                    APIKey = getAPIKey();
                }
                else {
                    console.log("other api error");
                }
            })
            .catch(e => console.log("fetch error", e));

    }

    function getTravel(now) {

        const API = `https://api.torn.com/user/?selections=travel&key=${APIKey}`;
        fetch(API)
            .then((res) => res.json())
            .then((res) => {
                if(res.travel) {
                    console.log("travel API fetched");
                    const des = res.travel.destination.split(" ")[0];
                    const des_chn = destination[des].name3;
                    const time_left = res.travel.time_left;
                    const tsArrive = time_left + now;
                    const json_set = {"destination":des, "tsArrive":tsArrive, "notify":"notyet"}
                    window.localStorage.setItem("travel",JSON.stringify(json_set));
                    if(time_left != 0) {
                        const travelCD = new Date(tsArrive*1000);
                        const travelCD_str = travelCD.toTimeString().substr(0,8);
                        $('#travelcd').children().remove();
                        $('#travelcd').append("<span>到"+des_chn+"时间 - "+travelCD_str+"</span>")
                    }
                }
                else if(res.error.code == 2) {
                    console.log("Incorrect key");
                    window.localStorage.setItem("APIKey","");
                    APIKey = getAPIKey();
                }
                else {
                    console.log("other api error");
                }
            })
            .catch(e => console.log("fetch error", e));

    }

    function NotificationComm(title, option) {
        if('Notification' in window){// 判断浏览器是否兼容Notification消息通知
            window.Notification.requestPermission(function(res){// 获取用户是否允许通知权限
                if(res === 'granted'){// 允许
                    let notification = new Notification(title || '这是一条新消息', Object.assign({}, {
                        dir: "auto", // 字体排版,auto,lt,rt
                        icon: '', // 通知图标
                        body: '请尽快处理该消息', // 主体内容
                        renotify: false // 当有新消息提示时，是否一直关闭上一条提示
                    }, option || {}));
                    notification.onerror = function(err){// error事件处理函数
                        throw err;
                    }
                    notification.onshow = function(ev){// show事件处理函数
                        console.log(ev);
                    }
                    notification.onclick = function(ev){// click事件处理函数
                        console.log(ev);
                        notification.close();
                    }
                    notification.onclose = function(ev){// close事件处理函数
                        console.log(ev);
                    }
                } else {
                    alert('该网站通知已被禁用，请在设置中允许');
                }
            });
        } else {// 兼容当前浏览器不支持Notification的情况
            const documentTitle = document.title,
                index = 0;
            const time = setInterval(function(){
                index++;
                if(index % 2){
                    document.title = '【　　　】' + documentTitle;
                } else {
                    document.title = '【新消息】' + documentTitle;
                }
            }, 1000);
            const fn = function(){
                if(!document.hidden && document.visibilityState === 'visible'){
                    clearInterval(time);
                    document.title = documentTitle;
                }
            }
            fn();
            document.addEventListener('visibilitychange', fn, false);
        }
    }

})();
