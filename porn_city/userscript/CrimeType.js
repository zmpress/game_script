// ==UserScript==
// @name         Crime分类
// @namespace    SMTH
// @version      0.3
// @description  显示crime分类。查询crime次数需共用冰蛙的api，请配合冰蛙使用。
// @icon         https://www.google.com/s2/favicons?sz=64&domain=torn.com
// @author       Houzi[2866914]
// @match        https://www.torn.com/loader.php?sid=crimes*
// @grant        GM_xmlhttpRequest
// @supportURL   https://x0aa8sptlkn.feishu.cn/wiki/PMHOwQad6i69tTkVrPycTpGZnjb
// @updateURL    https://raw.githubusercontent.com/zmpress/game_script/refs/heads/main/porn_city/userscript/CrimeType.js
// @downloadURL    https://raw.githubusercontent.com/zmpress/game_script/refs/heads/main/porn_city/userscript/CrimeType.js

// ==/UserScript==

(function () {
    'use strict';

    // 定义要显示的文本和对应的颜色
    const crimeLabels = [
        { text: "THEFT", color: "green" },
        { text: "COUNTERFEITING", color: "blue" },
        { text: "VANDALISM", color: "cyan" },
        { text: "THEFT", color: "green" },
        { text: "THEFT", color: "green" },
        { text: "FRAUD", color: "orange" },
        { text: "THEFT", color: "green" },
        { text: "FRAUD", color: "orange" },
        { text: "ILLICIT_SERVICES", color: "brown" },
        { text: "CYBERCRIME", color: "purple" },
        { text: "COUNTERFEITING", color: "blue" },
        { text: "FRAUD", color: "orange" }
    ];

    // 在crimeImage___GywgY上添加文本
    function addCrimeLabels() {
        const crimeImages = document.querySelectorAll('.crimeImage___GywgY');
        crimeImages.forEach((image, index) => {
            if (index < crimeLabels.length) {
                // 检查是否已经添加过标签
                if (image.querySelector('.crime-label')) return;

                const label = document.createElement('div');
                label.textContent = crimeLabels[index].text;
                label.style.position = 'absolute';
                label.style.top = '72%';
                label.style.left = '50%';
                label.style.transform = 'translate(-50%, -50%)';
                label.style.color = crimeLabels[index].color;
                label.style.fontWeight = 'bold';
                label.style.zIndex = '1000';
                label.style.pointerEvents = 'none'; // 防止点击事件被拦截
                label.style.fontSize = '23px'; // 固定字体大小为25px
                label.classList.add('crime-label'); // 添加标记类

                // 添加白色描边效果
                label.style.textShadow = `
                    -1px -1px 0 white,
                    1px -1px 0 white,
                    -1px 1px 0 white,
                    1px 1px 0 white
                `;

                image.appendChild(label);
            }
        });
    }

    // 添加按钮和段落
    function addButtonAndParagraph() {
        // 检查当前 URL 的哈希部分是否为 #/
        if (window.location.hash !== '#/') {
            // 如果不在 #/ 页面，移除已添加的按钮和段落
            const existingButton = document.querySelector('#crime-record-button');
            const existingParagraph = document.querySelector('#crime-data-content');
            if (existingButton) existingButton.remove();
            if (existingParagraph) existingParagraph.remove();
            return; // 如果不是 #/，直接退出
        }

        const contentWrapper = document.querySelector('.content-wrapper.winter');
        if (contentWrapper) {
            // 检查是否已经添加过按钮
            if (contentWrapper.querySelector('#crime-record-button')) return;

            const button = document.createElement('button');
            button.textContent = 'CriminalRecord';
            button.id = 'crime-record-button'; // 添加唯一ID
            button.title = '0时更新，非实时数据';
            button.style.margin = '10px';
            button.style.padding = '5px 10px';
            button.style.backgroundColor = '#4CAF50';
            button.style.color = 'white';
            button.style.border = 'none';
            button.style.borderRadius = '5px';
            button.style.cursor = 'pointer';

            const paragraph = document.createElement('p');
            paragraph.id = 'crime-data-content';
            paragraph.title = '100 / 200 / 300 / 500 / 750 / 1000 / 1500 / 2000 / 2500 / 3000 / 4000 / 5000 / 6000 / 7500 / 10000次有章';
            paragraph.style.margin = '10px';
            paragraph.style.padding = '10px';
            paragraph.style.backgroundColor = '#f9f9f9';
            paragraph.style.border = '1px solid #ddd';
            paragraph.style.borderRadius = '5px';

            contentWrapper.appendChild(button);
            contentWrapper.appendChild(paragraph);

            // 绑定点击事件
            button.addEventListener('click', () => {
                const apiKey = localStorage.getItem('APIKey');
                if (!apiKey) {
                    paragraph.innerText = '未找到APIKey，请先设置APIKey。';
                    return;
                }

                const apiUrl = `https://api.torn.com/user/?selections=crimes&key=${apiKey}`;

                GM_xmlhttpRequest({
                    method: 'GET',
                    url: apiUrl,
                    onload: function (response) {
                        const data = JSON.parse(response.responseText);
                        if (data.error) {
                            paragraph.innerText = '错误: ' + data.error.error;
                        } else if (!data.criminalrecord) {
                            paragraph.innerText = '未找到犯罪记录数据';
                        } else {
                            const criminalRecord = data.criminalrecord;
                            let content = '<ul>';
                            for (const crime in criminalRecord) {
                                content += `<li><strong>${crime}:</strong> ${criminalRecord[crime]}</li>`;
                            }
                            content += '</ul>';
                            paragraph.innerHTML = content;
                        }
                    },
                    onerror: function (error) {
                        paragraph.innerText = '请求失败: ' + error.statusText;
                    }
                });
            });
        }
    }

    // 监听 DOM 变化
    function observeCrimeImages() {
        const observer = new MutationObserver(() => {
            // 每次 DOM 变化时，检查当前 URL 的哈希部分
            if (window.location.hash === '#/') {
                addCrimeLabels(); // 添加文本
                addButtonAndParagraph(); // 添加按钮和段落
            } else {
                // 如果不在 #/ 页面，移除已添加的按钮和段落
                const existingButton = document.querySelector('#crime-record-button');
                const existingParagraph = document.querySelector('#crime-data-content');
                if (existingButton) existingButton.remove();
                if (existingParagraph) existingParagraph.remove();
            }
        });

        // 监听整个文档的变化
        observer.observe(document.body, { childList: true, subtree: true });
    }

    // 初始化
    function init() {
        // 只有在哈希部分为 #/ 时才初始化
        if (window.location.hash === '#/') {
            observeCrimeImages();
            addCrimeLabels();
            addButtonAndParagraph();
        } else {
            // 如果不在 #/ 页面，移除已添加的按钮和段落
            const existingButton = document.querySelector('#crime-record-button');
            const existingParagraph = document.querySelector('#crime-data-content');
            if (existingButton) existingButton.remove();
            if (existingParagraph) existingParagraph.remove();
        }
    }

    // 监听 hashchange 事件
    window.addEventListener('hashchange', function () {
        // 当哈希部分变化时，重新检查是否需要初始化
        init();
    });

    // 首次加载时初始化
    init();
})();