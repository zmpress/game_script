// ==UserScript==
// @name         水木家族RW状态监控
// @namespace    SMTH
// @version      1.2
// @description  用于在网页的侧边栏上显示水木家族（SMTH）的RW（Ranked War）状态监控信息
// @author       htys[1545351]
// @match        https://www.torn.com/*.php*
// @grant        none
// @updateURL    https://raw.githubusercontent.com/zmpress/game_script/refs/heads/main/porn_city/userscript/shuimu_rw_monitor.js
// @downloadURL    https://raw.githubusercontent.com/zmpress/game_script/refs/heads/main/porn_city/userscript/shuimu_rw_monitor.js

// ==/UserScript==

(function() {
    'use strict';
    const $ = window.jQuery;
    const APIKey = localStorage.getItem("APIKey");

    // 默认60s刷新一次，每个页面消耗6个api calls。
    // api紧张时避免开启过多页面，或增加刷新间隔
    const refresh_frequency = 60;
    const FACTION_IDS = {
        '9356': 'PTA',
        '11796': 'BSU',
        '16335': 'NOV.',
        '20465': 'PN',
        '27902': 'CCRC',
        '36134': 'SVH'
    };

    const addStyle = ()=>{
        const styles = `
            .fac-panel {
                position: relative;
                display: block;
                color: var(--default-color);
                background-color: var(--default-bg-panel-color);
                border-bottom-right-radius: 5px;
                border-top-right-radius: 5px;
                margin: 2px 0px;
            }
            .fac-panel .tooltip-text {
                visibility: hidden;
                width: 160px;
                background-color: var(--default-bg-panel-color);
                color: var(--default-color);
                text-align: left;
                padding: 6px;
                inline-height: 18px;
                border: 2px solid var(--default-color);
                border-radius: 6px;
                position: absolute;
                z-index: 999;
                top: 30px;
                left: 174px;
            }
            .fac-panel:hover .tooltip-text {
                visibility: visible;
            }
            .fac-panel .tooltip-text .tooltip-line {
                padding: 2px;
            }
            .fac-panel .updating-text {
                font-size: 22px;
                padding: 4px;
                text-align: center;
                color: var(--default-base-gold-color);
            }
            .fac-panel .fac-line {
                overflow: hidden;
            }
            .fac-panel .fac-line .fac-abbr {
                float: left;
                font-weight: bold;
                margin: 2px 0px 0px 2px;
            }
            .fac-panel .fac-line .fac-time {
                float: right;
                margin:2px 2px 0px 0px;
            }
            .fac-panel .fac-line .fac-score {
                float: left;
                font-weight: bold;
                margin: 2px 0px 2px 2px;
                color: rgb(199,139,7);
            }
            .fac-panel .fac-line .fac-target {
                float: right;
                font-weight: bold;
                margin: 2px 2px 2px 0px;
            }
            .fac-panel .fac-line a {
                color: var(--default-blue-color);
                text-decoration: none;
            }
        `;
        let style = document.createElement("style");
        style.type = "text/css";
        style.id = "smth-rw-monitor";
        style.innerHTML = styles;
        document.head.appendChild(style);

    }
    addStyle()

    // create wrapper
    let wrapper_html = `<div id="rw-status-wrapper">`;
    for (const fid in FACTION_IDS) {
        wrapper_html += `<div id=${fid} class="fac-panel"></div>`;
    }
    wrapper_html += `</div>`;
    $("#sidebar").children(":first").after(wrapper_html);

    // 网页载入第5秒先运行一次，后面每隔固定时间运行
    updateSidebar();
    const interval = setInterval(updateSidebar, 1000 * refresh_frequency);

    // 由于当用户离开页面时，后台的setInterval会被限流（参考https://developer.chrome.com/blog/timer-throttling-in-chrome-88?hl=zh-cn），
    // 控制刷新频率，并检测页面是否可见，以决定是否进行信息更新，避免在用户离开页面时积压过多的API调用。
    async function updateSidebar() {
        if (document.visibilityState === 'visible') {
            await new Promise(resolve => setTimeout(resolve, 5000)); // 暂停15秒
            for (const fid in FACTION_IDS) {
                try {
                    await getApi(fid);
                    //await new Promise(resolve => setTimeout(resolve, 500));
                    // Re-check visibility status before continuing the loop
                    if (document.visibilityState !== 'visible') {
                        console.log("Page is no longer visible, stopping updates.");
                        break;
                    }
                } catch (error) {
                    console.error(`Failed to get data for faction ${fid}:`, error);
                }
            }
        }
    }

    async function getApi(fid) {
        const url = `https://api.torn.com/faction/${fid}?selections=basic&key=${APIKey}`;
        try {
            const res = await fetch(url);
            if (!res.ok) {
                throw new Error(`API request failed with status ${res.status}`);
            }
            const json = await res.json();
            if (json.error) {
                console.error('Error fetching faction data:', json.error.error);
                return;
            }

            const html_appended = getHtml(json, fid);
            if (html_appended !== null) {
                const factionDiv = $("#" + fid);
                factionDiv.html(`<div class="updating-text">Updating...</div>`);
                await new Promise(resolve => setTimeout(resolve, 100));
                factionDiv.html(html_appended);
            }
        } catch (error) {
            console.error('Error fetching faction data:', error);
        }
    }

    function getHtml(json, fid) {
        const { rank, ranked_wars, members } = json;
        const rank_text = `${rank.name}-${rank.division}`;
        const faction_abbr = FACTION_IDS[fid];
        if (Object.keys(ranked_wars).length === 0) {
            //console.log(`${faction_abbr} has no ranked wars.`);
            return null;
        }

        const rw_id = Object.keys(ranked_wars)[0];
        const factions = ranked_wars[rw_id].factions;
        const war = ranked_wars[rw_id].war;
        const my_faction = formatFaction(factions[fid], fid);
        const other_faction_id = getOtherKey(Object.keys(factions), fid);
        const other_faction = formatFaction(factions[other_faction_id], other_faction_id);

        const { members_count, hosp_count } = countMembers(members);

        const score_color = getScoreColor(my_faction.fscore, other_faction.fscore);
        const score_diff = Math.abs(my_faction.fscore - other_faction.fscore);

        const { time_afflix, time_diff, time_start } = getTimeInfo(war, score_diff);

        return `
        <div class="fac-line">
            <span class="fac-abbr""><a href="/factions.php?step=profile&ID=${fid}" target="_blank">${faction_abbr}</a></span>
            <span class="fac-time">${getRankwarLink(rw_id, time_afflix)} ${time_diff}</span>
        </div>
        <div class="fac-line">
            <span class="fac-score">${my_faction.fscore} vs. ${other_faction.fscore}</span>
            <span class="fac-target ${score_color}">${score_diff}/${war.target}</span>
        </div>
        <div class="tooltip-text">
            <div class="tooltip-line bold">${faction_abbr} vs. ${other_faction.fname}</div>
            <div class="tooltip-line"><span class="bold">RWID: </span>${rw_id}</div>
            <div class="tooltip-line"><span class="bold">Start: </span>${time_start}</div>
            <div class="tooltip-line"><span class="bold">${faction_abbr}'s Rank: </span>${rank_text}</div>
            <div class="tooltip-line"><span class="bold">Chain: </span>${my_faction.fchain} vs. ${other_faction.fchain}</div>
            <div class="tooltip-line"><span class="bold">Hosp/Total: </span>${hosp_count}/${members_count}</div>
        </div>
        `;
    }

    function formatFaction(faction, fid) {
        return {
            fid: fid,
            fname: faction.name,
            fscore: faction.score,
            fchain: faction.chain
        };
    }

    function getRankwarLink(rw_id, time_afflix) {
        if (time_afflix === 'Ended in') {
            return `<a href="/war.php?step=rankreport&rankID=${rw_id}" target="_blank">${time_afflix}</a>`;
        }
        else {
            return time_afflix;
        }
    }

    function getTimeInfo(war, score_diff) {
        const current_timestamp = parseInt(new Date().getTime() / 1000);
        if (current_timestamp < war.start) {
            return { time_afflix: "Starts in", time_diff: formatTimeDifference(current_timestamp, war.start), time_start: formatTimestamp(war.start) };
        }
        if (war.end === 0) {
            //return { time_afflix: "Duration:", time_diff: formatTimeDifference(war.start, current_timestamp), time_start: formatTimestamp(war.start) };
            const estimated_end_timestamp = war.start + getEstimatedEnd(war, score_diff) * 3600;
            return { time_afflix: "预估结束:", time_diff: formatTimestamp(estimated_end_timestamp), time_start: formatTimestamp(war.start) };
        }
        return { time_afflix: "Ended in", time_diff: formatTimeDifference(war.end, current_timestamp), time_start: formatTimestamp(war.start) };
    }

    function getEstimatedEnd(war, score_diff) {
        const current_timestamp = parseInt(new Date().getTime() / 1000);
        const duration = Math.floor((current_timestamp - war.start) / 3600);
        let original_target = 0;
        if (duration < 24) {
            original_target = war.target;
        }
        else {
            original_target = Math.round(war.target * 100 / (100 - (duration - 24 + 1)), 0);
        }
        const estimated_end = Math.ceil((original_target - score_diff) * 100 / original_target) + 23;
        //const estimated_end2 = Math.ceil((war.target - score_diff) * 100 / original_target) + duration;
        //console.log(duration,original_target,estimated_end,estimated_end2)
        return estimated_end;
    }

    function countMembers(members) {
        let members_count = 0;
        let hosp_count = 0;
        for (const uid in members) {
            members_count++;
            if (members[uid].status.state === "Hospital") {
                hosp_count++;
            }
        }
        return { members_count, hosp_count };
    }

    function getScoreColor(my_score, other_score) {
        if (my_score < other_score) {
            return "t-red";
        }
        if (my_score > other_score) {
            return "t-green";
        }
        return "";
    }

    function getOtherKey(arr, key) {
        for (let item of arr) {
            if (item !== key) {
                return item;
            }
        }
        return null;
    }

    function formatTimeDifference(startTimestamp, endTimestamp) {
        let timeDiff = Math.abs(endTimestamp - startTimestamp);
        // 计算天数、小时数和分钟数
        let days = Math.floor(timeDiff / (60 * 60 * 24));
        let hours = Math.floor((timeDiff % (60 * 60 * 24)) / (60 * 60));
        let minutes = Math.floor((timeDiff % (60 * 60)) / 60);
        // 构造时间差字符串
        let timeDiffStr = '';
        if (days > 0) {
            timeDiffStr += days + 'd';
        }
        timeDiffStr += hours.toString().padStart(2, '0') + 'h' + minutes.toString().padStart(2, '0') + 'm';
        return timeDiffStr;
    }

    function formatTimestamp(timestamp) {
        const weekday = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];
        // Create a Date object from the timestamp
        // Assuming the timestamp is in milliseconds; if it's in seconds, uncomment the next line:
        timestamp = timestamp * 1000;
        const date = new Date(timestamp);

        // Extract parts of the date
        const year = date.getFullYear();
        const month = (date.getMonth() + 1).toString().padStart(2, '0'); // Months are zero-indexed
        const day = date.getDate().toString().padStart(2, '0');
        const hours = date.getHours().toString().padStart(2, '0');
        const minutes = date.getMinutes().toString().padStart(2, '0');
        const seconds = date.getSeconds().toString().padStart(2, '0');
        const wday = weekday[date.getDay()];
        // Construct the formatted date string
        //return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
        return `${wday} ${hours}:${minutes}:${seconds}`;
    }
})();