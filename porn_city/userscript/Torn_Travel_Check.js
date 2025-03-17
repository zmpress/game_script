// ==UserScript==
// @name         Torn Travel Check
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  在国外点击Travel Home，若花偶未买齐，则提示“花偶数量未装满！！”。
// @author       Kingdee[3133172]
// @match        https://www.torn.com/index.php
// @grant        none
// @updateURL    https://raw.githubusercontent.com/zmpress/game_script/refs/heads/main/porn_city/userscript/Torn_Travel_Check.js
// @downloadURL    https://raw.githubusercontent.com/zmpress/game_script/refs/heads/main/porn_city/userscript/Torn_Travel_Check.js

// ==/UserScript==

(function() {
    'use strict';

    // 获取Travel Home按钮
    var travelHomeButton = document.querySelector('#travel-home');
    // 确保元素存在
    if (travelHomeButton) {
        travelHomeButton.addEventListener('click', function(event) {
            // 查找包含信息的div和所有bold标签
            var msgDiv = document.querySelector('.info-msg-cont.user-info');
            if (msgDiv) {
                var boldElements = msgDiv.querySelectorAll('.bold');
                if (boldElements.length >= 4) {
                    var BoldText_2 = boldElements[2].textContent.trim();
                    var BoldText_3 = boldElements[3].textContent.trim();
                    if (BoldText_2 < BoldText_3) {
                        alert('花偶数量未装满！！');
                    }
                }
            }
        });
    }
})();
