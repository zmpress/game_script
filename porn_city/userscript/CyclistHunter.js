// ==UserScript==
// @name         Cyclist Hunter
// @namespace    nodelore.torn.cyclist-hunter
// @version      1.1
// @description  Hunt pickpocket cyclist for xanax!
// @author       nodelore[2786679]
// @fixer	         booboo001 [2582543]
// @license      MIT
// @match        https://www.torn.com/loader.php?sid=crimes*
// @grant        GM_addStyle
// @updateURL    https://raw.githubusercontent.com/zmpress/game_script/refs/heads/main/porn_city/userscript/CyclistHunter.js
// @downloadURL    https://raw.githubusercontent.com/zmpress/game_script/refs/heads/main/porn_city/userscript/CyclistHunter.js

// ==/UserScript==

(function(){
    'use strict';

    if(window.CYCLIST_HUNTER){
        return;
    }
    window.CYCLIST_HUNTER = true;

    console.log(`Cyclist hunter script start!`);

    const HUNTER_CACHE_KEY = "CYCLIST_HUNTER_RECORD";

    let record = {
        totalCounter: 0,
        huntCounter: 0,
        historyHunt: 0,
        moneyFetch: 0,
        items: {},
    };
    if(!localStorage.getItem(HUNTER_CACHE_KEY)){
        localStorage.setItem(HUNTER_CACHE_KEY, JSON.stringify(record));
    } else{
        record = JSON.parse(localStorage.getItem(HUNTER_CACHE_KEY));
    }

    if(!record.totalCounter){
        record.totalCounter = 0;
    }

    let inPickpocket = false;
    let inPDA = false;
    const PDAKey = "###PDA-APIKEY###";
    if(PDAKey.charAt(0) !== "#"){
        inPDA = true;
    }

    const isMobile = () => {
        return inPDA || window.innerWidth <= 768;
    }

    const is_cn = true;
    const notify_prefix = is_cn ? `Cyclist出现了，狙击Xan！剩余` : `Cyclist appears! For XANAX, remaining`

    GM_addStyle(`
        .border-blink {
            border: 2px solid red;
        }
        .border-blink::after {
            content: "";
            position: absolute;
            top: -10px;
            left: -10px;
            right: -10px;
            bottom: -10px;
            border: 2px dashed #f03e3e;
        }
        @keyframes blinkingBorder {
            50% {
                border-color: transparent;
            }
        }
        .border-blink {
            animation: blinkingBorder 2s infinite alternate;
        }
        body.dark-mode .cyclist_hunter_statistics{
            background: #444;
            color: #ddd;
        }
        .cyclist_hunter_statistics{
            height: 35px;
            background: #F2F2F2;
            width: 100%;
            position: relative;
            display: flex;
            align-items: center;
            justify-content: space-around;
            border-bottom: 1px solid rgba(1, 1, 1, .15);
        }

    `)

    const notifyCyclist = (leftTime)=>{
        const notification_text = `${notify_prefix}${leftTime}.`;
        if(inPDA){
            alert(notification_text);
        }
        else{
            if (Notification.permission === "granted") {
                new Notification(notification_text);
            }
            else if (Notification.permission !== "denied") {
                Notification.requestPermission().then(function (permission) {
                    if (permission === "granted") {
                        new Notification(notification_text);
                    }
                });
            }
        }
    }

    const extractPhysical = function(physicalProps){
        if(physicalProps.length > 0){
            const allText = physicalProps.text();
            if(allText.length > 0){
                const splitProps = allText.split(',');
                if(splitProps.length > 0){
                    return splitProps[0].split(' ')[0];
                }
            }
        }
        return '';
    }

    const getItemsTitle = ()=>{
        let result = `Money: $ ${record.moneyFetch}<br/>`;
        for(let name in record.items){
            result += `${name}: ${record.items[name]}<br/>`
        }
        result = result.substring(0, result.lastIndexOf("<br/>"));
        return result;
    }

    const getXanRate = ()=>{
        if(record.totalCounter === 0){
            return "0.00%";
        }
        return `${(record.historyHunt*100.0 / record.totalCounter).toFixed(2)}%`
    }

    const getItemCount = ()=>{
        let result = 0;
        for(let name in record.items){
            result += record.items[name];
        }
        return result;
    }

    const insertStatistics = ()=>{
        if($(".cyclist_hunter_statistics").length > 0){
            return;
        }
        const levelBar = $("div[class*=levelBar]");
        const item = $(`<div class="cyclist_hunter_statistics"></div>`);
        const totalCount = $(`<span class="cyclist_hunter_total" title="XAN出率：${getXanRate()}">总：${record.totalCounter}</span>`);
        const historyHunt = $(`<span class="cyclist_hunter_history" title="已获取XAN数量">已：${record.historyHunt}</span>`);
        const counter = $(`<span class="cyclist_hunter_counter" title="距离上次出XAN">距：${record.huntCounter}</span>`);
        const itemCount = $(`<span class="cyclist_hunter_items" title="${getItemsTitle()}">物：${getItemCount()}</span>`);

        item.append(totalCount, historyHunt, counter, itemCount);

        levelBar.after(item);
    }

    const refreshStatistics = ()=>{
        if($(".cyclist_hunter_statistics").length === 0){
            return;
        }
        $(".cyclist_hunter_total").text(`总：${record.totalCounter}`);
        $(".cyclist_hunter_total").attr("title", `XAN出率：${getXanRate()}`);
        $(".cyclist_hunter_history").text(`已：${record.historyHunt}`);
        $(".cyclist_hunter_counter").text(`距：${record.huntCounter}`);
        $(".cyclist_hunter_items").text(`物：${getItemCount()}`);
        $(".cyclist_hunter_items").attr("title", getItemsTitle());
    }

    const handlePickpocketResult = (params, data)=>{
        const outcome = data["DB"]["outcome"];
        if(outcome["result"] === "success"){
            const awards = outcome["rewards"];
            record.totalCounter += 1;
            record.huntCounter += 1;

            for(let award of awards){
                const award_type = award["type"];
                const award_value = award["value"];
                if(award_type === "items"){
                    for(let val of award_value){
                        if(!record.items[val["name"]]){
                            record.items[val["name"]] = 0;
                        }
                        record.items[val["name"]] += val["amount"];
                        if(val["id"] === 206){
                            record.historyHunt += 1;
                            record.huntCounter = 0;
                        }
                    }
                } else if(award_type === "money"){
                    record.moneyFetch += award_value;
                }
            }
            localStorage.setItem(HUNTER_CACHE_KEY, JSON.stringify(record));
            refreshStatistics();
        }
    }

    const interceptFetch = ()=>{
        const targetWindow = typeof unsafeWindow !== 'undefined' ? unsafeWindow : window;
        const origFetch = targetWindow.fetch;
        targetWindow.fetch = async (...args) => {
            const rsp = await origFetch(...args);
            const url = new URL(args[0], location.origin);
            const params = new URLSearchParams(url.search);

            if (url.pathname === '/loader.php' && params.get('sid') === 'crimesData') {
                if(inPickpocket){
                    const step = params.get("step");
                    const typeID = params.get("typeID");
                    const crimeID = params.get("crimeID");
                    if(step === "attempt" && typeID === "5" && crimeID === "43"){
                        const clonedRsp = rsp.clone();
                        handlePickpocketResult(params, await clonedRsp.json());
                    }
                }
            }

            return rsp;
        };
    }

    const updatePickpocket = (item)=>{
        const titleProps = item.find('div[class^=titleAndProps]');
        const nameItem = titleProps.find('div');
        const physicalProps = titleProps.find('button[class^=physicalPropsButton]');
        const activities = item.find('div[class^=activity]');

        if(titleProps.length > 0 && activities.length > 0){
            const title = nameItem.clone().remove('span').contents().filter(function(){
                return this.nodeType === 3;
            }).text().split(' ').slice(0, 2).join(' ').trim();
            const physical = extractPhysical(physicalProps);
            const activity = activities.contents().filter(function(){
                return this.nodeType === 3;
            }).text();
            if(title === "Cyclist"){
                const markColor = "#f03e3e";

                nameItem.css({
                    'color': markColor
                })
                item.css({
                    'border-left': `3px solid ${markColor}`
                });
                // Native style
                // item.find("button[class*='commitButton']").css({
                //     border: '2px solid red'
                // });
                item.find("button[class*='commitButton']").addClass("border-blink")
                const leftTime = activities.find('div[class*=clock]').text();
                notifyCyclist(leftTime);
            }
        }
    }

    let pickpocketObserver;
    const updatePage = ()=>{
        if(location.href.endsWith('pickpocketing')){


            inPickpocket = true;
            let interval = setInterval(()=>{
                const pickpocketTarget = '.pickpocketing-root [class*=virtualList___]';
                if($(pickpocketTarget).length > 0){
                    insertStatistics();
                    $(pickpocketTarget).find('div.crime-option').each(function(){
                        updatePickpocket($(this));
                    });
                    pickpocketObserver = new MutationObserver((mutationList)=>{
                        for(const mut of mutationList){
                            for(let addedNode of mut.addedNodes){
                                addedNode = $(addedNode).find(".crime-option")[0];
                                if(!addedNode){
                                    continue;
                                }
                                else if(addedNode.classList.contains('crime-option')){
                                    updatePickpocket($(addedNode));
                                }
                            }
                        }
                    })
                    pickpocketObserver.observe($(pickpocketTarget)[0], {subtree: true, childList: true, attributes: true});
                    clearInterval(interval);
                    interval = null;
                }
            }, 1000)
        } else{
            if(pickpocketObserver){
                pickpocketObserver.disconnect();
                pickpocketObserver = null;
                inPickpocket = false;
                $(".cyclist_hunter_statistics").remove();
            }
        }
    }

    window.onhashchange = ()=>{
        if(pickpocketObserver){
            pickpocketObserver.disconnect();
            pickpocketObserver = null;
            inPickpocket = false;
            $(".cyclist_hunter_statistics").remove();
        }
        updatePage();
    }

    interceptFetch();
    updatePage();

    const bindEventListener = function(type) {
        const historyEvent = history[type];
        return function() {
            const newEvent = historyEvent.apply(this, arguments);
            const e = new Event(type);
            e.arguments = arguments;
            window.dispatchEvent(e);
            return newEvent;
        };
    };
    history.pushState = bindEventListener('pushState');
    window.addEventListener('pushState', function(e) {
        updatePage();
    });
})();