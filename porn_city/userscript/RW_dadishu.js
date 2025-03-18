// ==UserScript==
// @name         RW 打地鼠
// @namespace    SMTH
// @version      1.1
// @description  调整rw界面ui，高亮显示刚出院的敌人
// @author       htys[1545351]
// @match        https://www.torn.com/factions.php*
// @updateURL    https://raw.githubusercontent.com/zmpress/game_script/refs/heads/main/porn_city/userscript/RW_dadishu.js
// @downloadURL    https://raw.githubusercontent.com/zmpress/game_script/refs/heads/main/porn_city/userscript/RW_dadishu.js

// @grant        none

// ==/UserScript==

(function() {
    'use strict';
    const $ = window.jQuery;
    console.log("RW 打地鼠")
    const interval = setInterval(updatePage, 500);

    function updatePage() {
        const target_node = $("li.descriptions").find(".enemy-faction");
        if (target_node.length > 0 && target_node.attr("whackamole") != "yes") {
            target_node.attr("whackamole", "yes");
            const members_list_nodes = target_node.children().children(".members-list").children("li.enemy");
            members_list_nodes.children(".level").hide();
            members_list_nodes.children(".points").hide();
            members_list_nodes.children(".status").hide();
            members_list_nodes.attr("style", "width: 190px; float: left; border: 2px solid darkgray; margin: 1px;");
            members_list_nodes.children(".member").attr("style", "width: 129px;");
            //members_list_nodes.children(".attack").children().attr("target", "_blank");
        }
        const attacking_nodes = target_node.children().children(".members-list").children("li.enemy").children("div.attack");
        if (attacking_nodes.length > 0 && target_node.attr("whackamole") == "yes") {
            //attacking_nodes.each(function(index, value){
            //    if ($(this).children().attr("class") == "t-blue h c-pointer") {
            //        $(this).parent().css("border-color", "var(--default-red-color)");
            //        $(this).children().attr("target", "_blank");
            //        if ($(this).parent().css("border-style") == "solid") {
            //            $(this).parent().css("border-style", "dashed");
            //        }
            //        else {
            //            $(this).parent().css("border-style", "solid");
            //        }
            //    }
            //    else {
            //        $(this).parent().css("border", "2px solid darkgray");
            //    }
            //
            //});
            //attacking_nodes.each(function(index, value) {
            //    if ($(this).children().attr("detected") != "1") {
            //        console.log("new")
            //        $(this).parent().css("background-color", "var(--default-red-color)");
            //    } else {
            //        $(this).parent().css("background-color", "transparent");
            //    }
            //});
            attacking_nodes.children("[detected!='1']").parent().parent().css("background-color", "var(--default-red-color)");
            attacking_nodes.children("[detected='1']").parent().parent().css("background-color", "transparent");
            attacking_nodes.children(".t-blue.h.c-pointer").parent().parent().css("border", "2px solid var(--default-red-color)");
            attacking_nodes.children(".t-blue.h.c-pointer").attr("target", "_blank");
            attacking_nodes.children(".t-gray-9").parent().parent().css("border", "2px solid darkgray");
        }
    }
})();