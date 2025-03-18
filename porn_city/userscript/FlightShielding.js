// ==UserScript==
// @name         飞行屏蔽
// @namespace    http://tampermonkey.net/
// @version      0.5
// @description  屏蔽网页中所有带有 cloud 和 planeImage 字样的元素
// @author       Deepseek
// @match        https://www.torn.com/page.php?sid=travel
// @grant        none
// @updateURL    https://raw.githubusercontent.com/zmpress/game_script/refs/heads/main/porn_city/userscript/FlightShielding.js
// @downloadURL    https://raw.githubusercontent.com/zmpress/game_script/refs/heads/main/porn_city/userscript/FlightShielding.js

// ==/UserScript==

(function() {
    'use strict';

    // 定义一个函数来屏蔽带有指定关键词的元素
    function hideElementsByKeywords() {
        // 选择所有元素
        const allElements = document.querySelectorAll('*');

        // 遍历所有元素
        allElements.forEach(element => {
            // 检查元素的 class 是否包含 cloud 或 planeImage
            if (element.classList && element.classList.toString().includes('cloud')) {
                element.style.display = 'none'; // 屏蔽元素
                console.log('屏蔽了带有 cloud 字样的元素（class）:', element);
            }
            if (element.classList && element.classList.toString().includes('planeImage')) {
                element.style.display = 'none'; // 屏蔽元素
                console.log('屏蔽了带有 planeImage 字样的元素（class）:', element);
            }
            // 检查元素的 id 是否包含 cloud 或 planeImage
            if (element.id && element.id.includes('cloud')) {
                element.style.display = 'none'; // 屏蔽元素
                console.log('屏蔽了带有 cloud 字样的元素（id）:', element);
            }
            if (element.id && element.id.includes('planeImage')) {
                element.style.display = 'none'; // 屏蔽元素
                console.log('屏蔽了带有 planeImage 字样的元素（id）:', element);
            }
        });
    }

    // 延迟执行，确保页面加载完成
    setTimeout(hideElementsByKeywords, 1000);
})();