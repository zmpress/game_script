// ==UserScript==
// @name         Easy Crime
// @namespace    TornExtensions
// @version      1.1
// @description  不显示crime结果(只对crime2.0有效)，页面上方以文字方式显示当前等级和经验
// @author       htys [1545351]
// @match        https://www.torn.com/loader.php?sid=crimes*
// @grant        none
// @updateURL    https://raw.githubusercontent.com/zmpress/game_script/refs/heads/main/porn_city/userscript/EasyCrime.js
// @downloadURL    https://raw.githubusercontent.com/zmpress/game_script/refs/heads/main/porn_city/userscript/EasyCrime.js

// ==/UserScript==

(function() {
    'use strict';
    const $ = window.jQuery;
    // settings
    const SETTING_REMOVE_RESULT = true;
    const SETTING_RENDER_LEVEL_EXP = true;

    if (SETTING_REMOVE_RESULT) {
        const interval_200 = setInterval(removeResult, 200);
    }

    if (SETTING_RENDER_LEVEL_EXP) {
        const interval_1000 = setInterval(renderLevelExp, 1000);
    }

    function removeResult() {
        // remove crime result
        // const node = $("[class^='outcomePanel___']");
        const node = $("[class^='outcome']");
        if (node.length > 0) {
            node.remove();
        }
    }

    function renderLevelExp() {
        $("#render-level-exp").remove();
        const level = getLevel();
        const exp = getExp();
        const node = $(".crimeHeading___VaeQf");
        if (node.length > 0) {
            node.children(":first").after(`<div id="render-level-exp" class="title___MqBua">等级: ${level} 经验: ${exp}%</div>`);
        }
    }

    function getExp() {
        const node = $(".progressFill___ksrq5");
        if (node.length > 0) {
            const progress_text = node.attr("style");
            if (progress_text) {
                const progress_arr = progress_text.split(" ");
                const width = progress_arr[3].replace("%;", "");
                const left = progress_arr[5].replace("%;", "");
                const exp = parseInt(width) + parseInt(left);
                return exp;
            }
            else {
                return 0;
            }
        }
        else {
            return 0;
        }
    }

    function getLevel() {
        const node = $(".currentLevel___vCRVm .starWrapper___zinKC .levelStar___b63fd .level___tAlsk");
        if (node.length > 0) {
            if ($(".currentLevel___vCRVm").hasClass("invisible___ixW8G")) {
                return 100;
            }
            else {
                const position_text = node.attr("style");
                if (position_text) {
                    const position_arr = position_text.split(" ");
                    const x = position_arr[1].replace("px", "");
                    const y = position_arr[2].replace("px;", "");
                    const level = position2level(parseInt(x), parseInt(y));
                    return level;
                }
                else {
                    return 0;
                }
            }
        }
        else {
            return 0;
        }
    }

    function position2level(x, y) {
        // using https://www.torn.com/images/v2/crimes/level-star/numbers.svg to get level
        if (x == 0) {
            return 1;
        }
        else if (x == -35) {
            return 2 - y / 35;
        }
        else {
            return 25 * (-1 - x / 35) - y / 35;
        }
    }
})()