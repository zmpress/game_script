// ==UserScript==
// @name         犯罪disposal去除错误的选择
// @namespace    http://tampermonkey.net/
// @version      2024-05-15
// @description  123
// @author       You
// @match        https://www.torn.com/loader.php?sid=crimes*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=torn.com
// @grant        none
// @updateURL    https://raw.githubusercontent.com/zmpress/game_script/refs/heads/main/porn_city/userscript/disposal_remove_error.js
// @downloadURL    https://raw.githubusercontent.com/zmpress/game_script/refs/heads/main/porn_city/userscript/disposal_remove_error.js

// ==/UserScript==

(function() {
    'use strict';

    setInterval(function(){

        if(location.hash.indexOf("disposal") == -1){
            return
        }

        var arr = [{"name":"Biological Waste","index":3},{"name":"Body Part","index":4},{"name":"Building Debris","index":3},{"name":"Dead Body","index":4},{"name":"Old Furniture","index":2},{"name":"Broken Appliance","index":3},{"name":"Documents","index":2},{"name":"Vehicle","index":2},{"name":"Firearm","index":3},{"name":"General Waste","index":1},{"name":"Industrial Waste","index":3},{"name":"Murder Weapon","index":2}]

        $(".crimeOptionGroup___gQ6rI .crimeOptionWrapper___IOnLO").each(function(){

            var name = $(this).find(".crimeOptionSection___hslpu.flexGrow___S5IUQ").text()
            for(var i = 0 ; i < arr.length ; i++){
                if(name === arr[i].name){
                    var lengh = $(this).find(".crimeOptionSection___hslpu.desktopMethodsSection___fPHAD button").length
                    if(lengh != 5){
                        break;
                    }
                    for(var n = 0 ; n < 5 ; n++){
                        if(n != arr[i].index){
                            $(this).find(".crimeOptionSection___hslpu.desktopMethodsSection___fPHAD button:eq(" + n + ")").hide();
                        }
                    }

                    break;
                }
            }

        })

    } , 1000)


    // Your code here...
})();