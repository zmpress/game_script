// ==UserScript==
// @name         攻击助手 Easy attack
// @namespace    TORN
// @version      2.0
// @description  Rearrange and resize weapon buttons and 'start fight' button
// @author       htys[1545351]
// @match        https://www.torn.com/loader.php?sid=attack*
// @grant        none
// @updateURL    https://raw.githubusercontent.com/zmpress/game_script/refs/heads/main/porn_city/userscript/easyAttack.js
// @downloadURL    https://raw.githubusercontent.com/zmpress/game_script/refs/heads/main/porn_city/userscript/easyAttack.js

// ==/UserScript==

(function() {
    "use strict";
    const $ = window.jQuery;
    // page href is "https://www.torn.com/loader.php?sid=attack&user2ID=1732212"
    // get userid from href
    const userid = window.location.href.match(/user2ID=(\d+)/)[1];
    const APIKey = window.localStorage.getItem("APIKey");
    let enemystats = getEnemyStats(userid);

    const interval = setInterval(updatePage, 200);
    const interval2 = setInterval(updateEnemyStats, 1000);
    const interval3 = setInterval(updateExtraStats, 1000);

    function updatePage() {
        const $weapon_list = $("#attacker").children("[class^='playerArea___']").children("[class^='weaponList___']");
        if ($weapon_list.length > 0 && $weapon_list.attr("detected") != "yes") {
            $weapon_list.attr("detected", "yes");
            //$weapon_list.css({ "padding-top": "100px", "display": "block" });
            $weapon_list.css({ "display": "block" });
            $weapon_list.children().css({ "float": "left", "width": "79px"});
            $weapon_list.children("#weapon_main,#weapon_second,#weapon_melee,#weapon_temp").css("height", "80px");
            $weapon_list.children().children("[class^='top___']").css("visibility", "hidden");
            $weapon_list.children("#weapon_main,#weapon_second").children("[class^='bottom___']").css({ "position": "relative", "top": "-60px" });
            $weapon_list.prepend(`<div id="enemy-stats-box" style="float: left; width: 158px; height: 102px; border: 2px solid var(--attack-weaponbox-border-color); background-color: var(--attack-weaponbox-background); box-sizing: border-box; box-shadow: var(--attack-weaponbox-shadow-mobile); text-align: center;"></div>`);
            $weapon_list.append(`<div id="extra-stats-box" style="float: left; width: 158px; height: 100px; border: 2px solid var(--attack-weaponbox-border-color); background-color: var(--attack-weaponbox-background); box-sizing: border-box; box-shadow: var(--attack-weaponbox-shadow-mobile); text-align: center;"></div>`);
            $weapon_list.children("#weapon_second").after(`<div id="button-box" style="float: left; width: 158px; height: 40px; border: 2px solid var(--attack-weaponbox-border-color); background-color: var(--attack-weaponbox-background); box-sizing: border-box; box-shadow: var(--attack-weaponbox-shadow-mobile); text-align: center;"></div>`);

            $("#enemy-stats-box").append(`<div class="top___z6P6Z"><div class="topMarker___OjRyU"><span>Enemy BS</span></div></div>
            <ul style="margin-top: 2px;">
            <li><span class="enemy-stats-type">STR:</span><span id="str" class="enemy-stats-value">unknown</span></li>
            <li><span class="enemy-stats-type">DEF:</span><span id="def" class="enemy-stats-value">unknown</span></li>
            <li><span class="enemy-stats-type">SPD:</span><span id="spd" class="enemy-stats-value">unknown</span></li>
            <li><span class="enemy-stats-type">DEX:</span><span id="dex" class="enemy-stats-value">unknown</span></li>
            <li><span class="enemy-stats-type">TTL:</span><span id="ttl" class="enemy-stats-value">unknown</span></li>
            </ul>`);
            $(".enemy-stats-type").css({ "line-height": "12px", "display": "inline-block", "width": "30px", "margin": "2px 0px 2px 4px", "text-align": "left"});
            $(".enemy-stats-value").css({ "line-height": "12px", "display": "inline-block", "width": "110px", "margin": "2px 0px 2px 4px", "text-align": "right"});

            $("#extra-stats-box").append(`<div class="top___z6P6Z"><div class="topMarker___OjRyU"><span>Extras</span></div></div>
            <ul style="margin-top: 2px;">
            <li><span class="extra-stats-type">我的命中:</span><span id="my-accuracy" class="extra-stats-value">unknown</span></li>
            <li><span class="extra-stats-type">我的破防:</span><span id="my-penatration" class="extra-stats-value">unknown</span></li>
            <li><span class="extra-stats-type">敌人命中:</span><span id="enemy-accuracy" class="extra-stats-value">unknown</span></li>
            <li><span class="extra-stats-type">敌人破防:</span><span id="enemy-penatration" class="extra-stats-value">unknown</span></li>
            </ul>`);
            $(".extra-stats-type").css({ "line-height": "12px", "display": "inline-block", "width": "70px", "margin": "2px 0px 2px 4px", "text-align": "left"});
            $(".extra-stats-value").css({ "line-height": "12px", "display": "inline-block", "width": "70px", "margin": "2px 0px 2px 4px", "text-align": "right"});
        }
        const $weapons = $weapon_list.children("#weapon_main,#weapon_second,#weapon_melee,#weapon_temp");
        $weapons.each(function() {
            if ($(this).length > 0 && $(this).attr("detected") != "yes") {
                $(this).attr("detected", "yes");
                $(this).css({ "float": "left", "width": "79px", "height": "80px" });
            }
        });
        const $dialog_buttons = $("[class^='dialogButtons___']").children();
        if ($dialog_buttons.length == 1 && $dialog_buttons.attr("detected") != "yes") {
            $dialog_buttons.attr("detected", "yes");
            $dialog_buttons.css({ "position": "absolute", "top": "177px", "left": "-150px" });
        }
        const $player_window = $("[class^='playerWindow___']");
        if ($player_window.length > 0 && $player_window.attr("detected") != "yes") {
            $player_window.attr("detected", "yes");
            $player_window.css("overflow", "visible");
        }
        const $model_wrap = $("[class^='modelWrap___']");
        if ($model_wrap.length > 0 && $model_wrap.attr("detected") != "yes") {
            $model_wrap.attr("detected", "yes");
            $model_wrap.css("width", "323px");
        }
    }

    function getEnemyStats(userid) {
        const bw_target_array = getLocalStorageRootNode("BINGWA_TARGET");
        if (bw_target_array === null || bw_target_array === undefined) {
            return undefined;
        }
        let stats = undefined;
        bw_target_array.forEach(function(item, index) {
            if (item.ID == userid) {
                stats = {
                    "STR": item.STR,
                    "DEF": item.DEF,
                    "SPD": item.SPD,
                    "DEX": item.DEX};
            }
        });
        return stats;
    }

    function getMyStats() {
        const API = `https://api.torn.com/user/?selections=battlestats&key=${APIKey}`;
        fetch(API).then((res) => { if (res.ok) { return res.json() } else { console.log("---攻击助手探测失败---") } }, networkError => { console.log("---攻击助手网络异常---") })
            .then((res) => {
                if (res != undefined) {
                    if ("error" in res) {
                        console.log(res.error);
                        return undefined;
                    } else {
                        window.localStorage.setItem("BINGWA_MYSTATS", JSON.stringify({
                            "STR": res.strength,
                            "DEF": res.defense,
                            "SPD": res.speed,
                            "DEX": res.dexterity}));
                    }
                }
            })
            .catch((e) => console.log("fetch error", e));
    }

    getMyStats();

    function getBonusFromNode($node) {
        const value_str = $node.children("span[class^='value___']").text();
        if (value_str.indexOf("+") >= 0) {
            return parseInt(value_str.match(/\d+/g)[0]);
        }
        else if (value_str.indexOf("-") >= 0) {
            return -parseInt(value_str.match(/\d+/g)[0]);
        }
        else {
            return undefined;
        }
    }

    function getMyBonus() {
        const attacker_strength_bonus = getBonusFromNode($("#attacker_strength"));
        const attacker_defense_bonus = getBonusFromNode($("#attacker_defense"));
        const attacker_speed_bonus = getBonusFromNode($("#attacker_speed"));
        const attacker_dexterity_bonus = getBonusFromNode($("#attacker_dexterity"));
        const attacker_damage_bonus = getBonusFromNode($("#attacker_damage"));
        if (attacker_strength_bonus !== undefined) {
            return { "STR": attacker_strength_bonus,
                "DEF": attacker_defense_bonus,
                "SPD": attacker_speed_bonus,
                "DEX": attacker_dexterity_bonus,
                "DAMAGE":attacker_damage_bonus };
        }
        else {
            return {"STR": 0, "DEF": 0, "SPD": 0, "DEX": 0, "DAMAGE": 0};
        }
    }

    function getEnemyBonus() {
        const defender_strength_bonus = getBonusFromNode($("#defender_strength"));
        const defender_defense_bonus = getBonusFromNode($("#defender_defense"));
        const defender_speed_bonus = getBonusFromNode($("#defender_speed"));
        const defender_dexterity_bonus = getBonusFromNode($("#defender_dexterity"));
        const defender_damage_bonus = getBonusFromNode($("#defender_damage"));
        if (defender_strength_bonus !== undefined) {
            return { "STR": defender_strength_bonus,
                "DEF": defender_defense_bonus,
                "SPD": defender_speed_bonus,
                "DEX": defender_dexterity_bonus,
                "DAMAGE": defender_damage_bonus }
        } else {
            return {"STR": 0, "DEF": 0, "SPD": 0, "DEX": 0, "DAMAGE": 0};
        }
    }

    function updateEnemyStats() {
        const enemybonus = getEnemyBonus();
        if (enemystats !== undefined && $("#str").length > 0) {
            const enemystats_new = {
                "STR": parseInt(enemystats["STR"] * (1 + enemybonus["STR"] / 100)),
                "DEF": parseInt(enemystats["DEF"] * (1 + enemybonus["DEF"] / 100)),
                "SPD": parseInt(enemystats["SPD"] * (1 + enemybonus["SPD"] / 100)),
                "DEX": parseInt(enemystats["DEX"] * (1 + enemybonus["DEX"] / 100))
            }
            $("#str").text(toThousands(enemystats_new["STR"])).css("color", "var(--default-" + getStatColor(enemybonus["STR"]) + "color)");
            $("#def").text(toThousands(enemystats_new["DEF"])).css("color", "var(--default-" + getStatColor(enemybonus["DEF"]) + "color)");
            $("#spd").text(toThousands(enemystats_new["SPD"])).css("color", "var(--default-" + getStatColor(enemybonus["SPD"]) + "color)");
            $("#dex").text(toThousands(enemystats_new["DEX"])).css("color", "var(--default-" + getStatColor(enemybonus["DEX"]) + "color)");
            $("#ttl").text(toThousands(enemystats_new["STR"] + enemystats_new["DEF"] + enemystats_new["SPD"] + enemystats_new["DEX"]));
        }
    }

    function getStatColor(stat) {
        if (stat > 0) {
            return "green-";
        }
        else if (stat < 0) {
            return "red-";
        }
        else {
            return "";
        }
    }

    function updateExtraStats() {
        const mystats = getLocalStorageRootNode("BINGWA_MYSTATS");
        const mybonus = getMyBonus();
        const enemybonus = getEnemyBonus();
        if (enemystats !== undefined && mystats !== undefined && $("#my-accuracy").length > 0) {
            const mystats_new = {
                "STR": parseInt(mystats["STR"] * (1 + mybonus["STR"] / 100)),
                "DEF": parseInt(mystats["DEF"] * (1 + mybonus["DEF"] / 100)),
                "SPD": parseInt(mystats["SPD"] * (1 + mybonus["SPD"] / 100)),
                "DEX": parseInt(mystats["DEX"] * (1 + mybonus["DEX"] / 100))
            }
            const enemystats_new = {
                "STR": parseInt(enemystats["STR"] * (1 + enemybonus["STR"] / 100)),
                "DEF": parseInt(enemystats["DEF"] * (1 + enemybonus["DEF"] / 100)),
                "SPD": parseInt(enemystats["SPD"] * (1 + enemybonus["SPD"] / 100)),
                "DEX": parseInt(enemystats["DEX"] * (1 + enemybonus["DEX"] / 100))
            }
            $("#my-accuracy").text(Math.round(hitChance(mystats_new["SPD"], enemystats_new["DEX"])) + "%");
            $("#my-penatration").text(Math.round(100 - damageMitigation(enemystats_new["DEF"], mystats_new["STR"])) + "%");
            $("#enemy-accuracy").text(Math.round(hitChance(enemystats_new["SPD"], mystats_new["DEX"])) + "%");
            $("#enemy-penatration").text(Math.round(100 - damageMitigation(mystats_new["DEF"], enemystats_new["STR"])) + "%");
        }
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

    function toThousands(num) {
        if (num.toString().indexOf(',') >= 0) {
            return Number(num.replace(/,/g, ''));
        } else if (!Number.isNaN(Number(num))) {
            //return (num || 0).toString().replace(/(\d)(?=(?:\d{3})+$)/g, '$1,');
            return num.toString().replace(/\d{1,3}(?=(\d{3})+$)/g, function(s) { return s + "," });
        } else {
            return 0;
        }
    }

    function hitChance(speed, dexterity) {
        let ratio = speed / dexterity
        let hitChance;
        if (ratio >= 64) {
            hitChance = 100
        } else if (ratio >= 1 && ratio < 64) {
            hitChance = 100 - 50 / 7 * (8 * Math.sqrt(1/ratio) - 1)
        } else if (ratio > 1/64 && ratio < 1) {
            hitChance = 50 / 7 * (8 * Math.sqrt(ratio) - 1)
        } else {
            hitChance = 0
        }
        return hitChance;
    }

    function damageMitigation(defense, strength) {
        const MATH_LOG_14_UNDER_50 = 50 / Math.log(14);
        const MATH_LOG_32_UNDER_50 = 50 / Math.log(32);
        let ratio = defense / strength
        let mitigation;
        if (ratio >= 14) {
            mitigation = 100
        } else if (ratio >= 1 && ratio < 14) {
            mitigation = 50 + MATH_LOG_14_UNDER_50 * Math.log(ratio)
        } else if (ratio > 1/32 && ratio < 1) {
            mitigation = 50 + MATH_LOG_32_UNDER_50 * Math.log(ratio)
        } else {
            mitigation = 0
        }
        return mitigation;
        // calculate and return damage mitigation percentage
    }
})();