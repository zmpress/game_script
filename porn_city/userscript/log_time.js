// ==UserScript==
// @name         Log精确时间
// @namespace    http://tampermonkey.net/
// @version      0.2
// @description  log页面同时显示精确时间
// @author       htys[1545351]
// @match        https://www.torn.com/page.php?sid=log*
// @grant        none
// @run-at       document-end
// @updateURL    https://raw.githubusercontent.com/zmpress/game_script/refs/heads/main/porn_city/userscript/log_time.js
// @downloadURL    https://raw.githubusercontent.com/zmpress/game_script/refs/heads/main/porn_city/userscript/log_time.js

// ==/UserScript==

(function() {
    'use strict';

    function updateTimeMarks() {

        const timeValues = document.querySelectorAll('[class^="timeValue___"]:not([data-updated="true"])');

        timeValues.forEach(function(timeValue) {
            const detailedTimeSpan = timeValue.querySelector('span');
            if (detailedTimeSpan) {
                const detailedTime = detailedTimeSpan.textContent.trim();
                const targetSpan = timeValue.parentNode.parentNode
                    .nextElementSibling
                    .querySelector('.log-text');

                if (targetSpan) {
                    const newSpan = document.createElement('span');
                    newSpan.className = targetSpan.className;
                    newSpan.textContent = detailedTime;
                    newSpan.style.width = '15%';
                    targetSpan.style.width = '80%';
                    targetSpan.parentNode.insertBefore(newSpan, targetSpan);

                    // 设置已更新标记
                    timeValue.setAttribute('data-updated', 'true');
                }
            }
        });
    }

    updateTimeMarks();

    // 对可能的动态内容加载使用MutationObserver
    const observer = new MutationObserver(function(mutations) {
        mutations.forEach(function(mutation) {
            if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
                updateTimeMarks();
            }
        });
    });

    observer.observe(document.body, { childList: true, subtree: true });
})();
