// ==UserScript==
// @name         喷漆
// @namespace    SMTH
// @version      0.1
// @description  显示喷漆颜色，$代表钱，*代表声望
// @icon         https://www.google.com/s2/favicons?sz=64&domain=torn.com
// @author       Houzi[2866914]
// @match        https://www.torn.com/loader.php?sid=crimes*
// @grant        none
// @supportURL   https://x0aa8sptlkn.feishu.cn/wiki/D1UEwEEwKiu02BkPkpkcHM7Hnpg
// @updateURL    https://raw.githubusercontent.com/zmpress/game_script/refs/heads/main/porn_city/userscript/penqi.js
// @downloadURL    https://raw.githubusercontent.com/zmpress/game_script/refs/heads/main/porn_city/userscript/penqi.js

// ==/UserScript==

(function () {
    'use strict';

    // 定义要显示的文本
    const texts = [
        '紫色$，红色*',
        '绿色$，蓝色*',
        '绿色$，橙色*',
        '白色$，蓝色*',
        '绿色$，粉红*',
        '黑色$，红色*',
        '绿色$，蓝色*'
    ];

    // 监听 DOM 变化
    const observer = new MutationObserver((mutationsList, observer) => {
        // 获取所有符合条件的元素
        const reputationIcons = document.querySelectorAll('.reputationIconWrapper___CM05s');

        // 如果找到目标元素
        if (reputationIcons.length > 0) {
            // 停止观察，避免重复执行
            observer.disconnect();

            // 遍历每个元素并添加文本
            reputationIcons.forEach((icon, index) => {
                if (index < texts.length) {
                    // 创建一个新的 div 来显示文本
                    const textDiv = document.createElement('div');
                    textDiv.textContent = texts[index];
                    textDiv.style.position = 'absolute'; // 绝对定位
                    textDiv.style.top = '50%'; // 放置在图标垂直居中位置
                    textDiv.style.left = '-100px'; // 向左移动50px
                    textDiv.style.transform = 'translateY(-50%)'; // 垂直居中
                    textDiv.style.color = '#D4AF37'; // 文本颜色为金色
                    textDiv.style.backgroundColor = '#F2F2F2'; // 背景颜色
                    textDiv.style.padding = '2px 5px'; // 内边距
                    textDiv.style.borderRadius = '3px'; // 圆角
                    textDiv.style.fontSize = '16px'; // 字体大小
                    textDiv.style.zIndex = '1000'; // 确保文本在最上层
                    textDiv.style.whiteSpace = 'nowrap'; // 确保文本在一行显示

                    // 将文本 div 添加到图标容器中
                    icon.style.position = 'relative'; // 设置图标容器为相对定位
                    icon.appendChild(textDiv);
                }
            });
        }
    });

    // 开始观察 DOM 变化
    observer.observe(document.body, {
        childList: true, // 观察子节点的变化
        subtree: true // 观察所有后代节点
    });
})();