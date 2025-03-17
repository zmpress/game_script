// ==UserScript==
// @name         Remove Package Open Animation
// @namespace    TornExtensions
// @version      1.0
// @description
// @author       Luochen [2956255]
// @match        https://www.torn.com/item.php
// @updateURL    https://raw.githubusercontent.com/zmpress/game_script/refs/heads/main/porn_city/userscript/Remove_Package_Open_Animation.js
// @downloadURL    https://raw.githubusercontent.com/zmpress/game_script/refs/heads/main/porn_city/userscript/Remove_Package_Open_Animation.js

// ==/UserScript==

(function() {
    'use strict';

    AddStyle(`
  .pack-open-content .animated-fadeIn {
    opacity: 1 !important;
    animation-name: none !important;
    animation-duration: 0s !important;
    animation-delay: 0s !important;
  }
  `);

    AddStyle(`
  .pack-open-content.disabled-link a.open-another-cache {
    cursor: pointer !important;
    pointer-events: all !important;
    color: var(--default-blue-color) !important;
  }
  `);

    function AddStyle(t) {
        const e = document.getElementById("GLOBAL-STYLE") || function() {
            const t = document.createElement("style");
            return t.type = "text/css", t.id = "GLOBAL-STYLE", document.head.appendChild(t), t
        }();
        e.sheet.insertRule(t)
    }
})();
