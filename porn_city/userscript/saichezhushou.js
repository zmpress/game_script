// ==UserScript==
// @name         赛车助手2.1.2
// @namespace    帅哥黑猫警长
// @version      2.1.2
// @description  改装助手+赛车助手
// @author       SherrifCat[2893458]
// @match        https://www.torn.com/loader.php?sid=racing*
// @grant        none
// @updateURL    https://raw.githubusercontent.com/zmpress/game_script/refs/heads/main/porn_city/userscript/saichezhushou.js
// @downloadURL    https://raw.githubusercontent.com/zmpress/game_script/refs/heads/main/porn_city/userscript/saichezhushou.js

// ==/UserScript==


(function() {
    'use strict';

    //改车列表 option添加名称 car_type 则为对应的型号
    var options = ['Edomondo Nsx [T,SR,T3]',
        'Edomondo Nsx [D,SR,T3]',
        'Veloria LFA [T,LR,T3]',
        'Edomondo Nsx [T,SR,T2]',
        'Volt GT [T,SR,T3]',
        'Mercia SLR [T,LR,T3]',
        'Colina Tanprice [D,SR,T3]',
    ];

    var car_type = [['T','SR','T3'],
        ['D','SR','T3'],
        ['T','LR','T3'],
        ['T','SR','T2'],
        ['T','SR','T3'],
        ['T','LR','T3'],
        ['D','SR','T3'],
    ];
    //通用改件列表
    var default_list=['Air Forced Engine Cooling',
        'Air Cooling Ducts for Brakes',
        'Rear Diffuser',
        'Front Diffuser',
        'Adjustable Rear Spoiler',
        'Fast Road Brake Fluid',
        'Braided Brake Hoses',
        'Grooved and Drilled Brake Discs',
        'Competition Racing Brake Pads',
        'Brake Balance Bias Control',
        'Brake Balance Bias Control',
        '6 Pot Uprated Brakes',
        'Ported and Polished Head',
        'Competition Racing Fuel Pump',
        'Competition Polished Throttle Body',
        'Bored Out Engine + Forged Pistons',
        'Front Mounted Intercooler',
        'Stage Three Remap',
        'Competition Racing Camshaft',
        'Full Exhaust System',
        'Stainless Steel 4-1 Manifold',
        'Custom Forced Induction Kit',
        'Super Octane Fuel Plus Nitrous',
        'Polyurethane Bushings Front',
        'Polyurethane Bushings Rear',
        'Upper Front Strut Brace',
        'Lower Front Strut Brace',
        'Rear Strut Brace',
        'Front Adjustable Tie Rods',
        'Adjustable Rear Control arms',
        'Quick Shift',
        '4 Pin Differential',
        'Competition Racing Clutch',
        'Ultra-Light Flywheel',
        'Strip Out',,
        'Racing Steering Wheel',
        'Lightweight Flocked Dash',
        'Polycarbonate Windows',
        'Carbon Fiber Roof',
        'Carbon Fiber Trunk',
        'Carbon Fiber Hood',
        'Ultra-Lightweight Alloys'];
    //各型号改建列表
    var T2_list = ['Stage Two Turbo kit'];
    var T3_list = ['Stage Three Turbo Kit'];
    var T_list = ['Adjustable Coilover Suspension','Track Tires'];
    var D_list = ['Group N Rally Suspension','Rally Tires'];
    var LRT_list = ['Paddle Shift Gearbox (Long Ratio)'];
    var SRT_list = ['Paddle Shift Gearbox (Short Ratio)'];
    var LRD_list = ['Rally Gearbox (Long Ratio)'];
    var SRD_list = ['Rally Gearbox (Short Ratio)'];
    //地图列表
    var D_MAPS = ['Parkland', 'Two Islands', 'Hammerhead', 'Stone Park', 'Mudpit'];
    var T_MAPS = ['Industrial', 'Vector','Meltdown', 'Uptown','Withdrawal', 'Speedway', 'Underdog', 'Commerce', 'Sewage','Docks', 'Convict'];

    //界面
    //改装确定
    var selectElement = document.createElement("select");
    var outputButton = document.createElement("button");
    outputButton.textContent = "确定";
    outputButton.style.marginLeft = "10px"
    outputButton.className = "torn-btn black";
    //改装刷新
    var refreshButton = document.createElement("button");
    refreshButton.textContent = "刷新";
    refreshButton.className = "torn-btn black";
    refreshButton.style.marginLeft = "10px";
    //自动比赛配置
    var configButton = document.createElement("div");
    configButton.textContent = "配置";
    configButton.className = "torn-btn car-set";
    //自动开始比赛
    var startRaceButton = document.createElement('li');
    startRaceButton.textContent = '开始比赛';
    startRaceButton.className = "torn-btn car-start";
    //改车
    var changeCarButton = document.createElement('li');
    changeCarButton.textContent = '点我！';
    changeCarButton.className = "torn-btn car-change";

    var table;

    var resultArray = [];

    var combinedMaps = D_MAPS.concat(T_MAPS);

    function waitForElementToAppear(className, callback) {
        var interval = setInterval(function() {
            var element = document.querySelector('.' + className);
            if (element) {
                clearInterval(interval);
                callback();
            }
        }, 100);
    }

    //创建改装选项
    function createOptions() {
        for (var i = 0; i < options.length; i++) {
            var option = document.createElement("option");
            option.text = options[i];
            selectElement.add(option);
        }
    }

    //应用元素改色
    function applyColorToSelectedElements(outputLists) {
        const elements = document.querySelectorAll('div.title.t-overflow');
        elements.forEach(element => {
            const trimmedText = element.textContent.trim();

            if (outputLists.includes(trimmedText)) {
                const parentBoxWrap = element.closest('.box-wrap');
                if (parentBoxWrap) {
                    const hiddenDesc = parentBoxWrap.querySelector('.desc.hide');
                    if (hiddenDesc) {
                        parentBoxWrap.style.backgroundColor = 'green';
                    } else {
                        parentBoxWrap.style.backgroundColor = 'orange';
                    }
                }
            }
        });
    }

    //改装确认点击事件
    function handleButtonClick() {
        var selectedOption = selectElement.options[selectElement.selectedIndex].text;
        var selectedIndex = options.indexOf(selectedOption);
        if (selectedIndex !== -1) {
            var selectedCarType = car_type[selectedIndex];
            var outputLists = [];
            outputLists.push(...default_list);
            if (selectedCarType.includes('T')) {
                outputLists.push(...T_list);
            }
            if (selectedCarType.includes('T2')) {
                outputLists.push(...T2_list);
            }
            if (selectedCarType.includes('T3')) {
                outputLists.push(...T3_list);
            }
            if (selectedCarType.includes('D')) {
                outputLists.push(...D_list);
            }

            if (selectedCarType.includes('SR') && selectedCarType.includes('T')) {
                outputLists.push(...SRT_list);
            } else if (selectedCarType.includes('LR') && selectedCarType.includes('T')) {
                outputLists.push(...LRT_list);
            } else if (selectedCarType.includes('LR') && selectedCarType.includes('D')) {
                outputLists.push(...LRD_list);
            } else if (selectedCarType.includes('SR') && selectedCarType.includes('D')) {
                outputLists.push(...SRD_list);
            }
            resetBackgroundColors();
            applyColorToSelectedElements(outputLists);
        }
    }

    //重置改装背景
    function resetBackgroundColors() {
        var boxWrapElements = document.querySelectorAll('div.box-wrap');
        for (var i = 0; i < boxWrapElements.length; i++) {
            boxWrapElements[i].style.background = ""; // Reset background color
        }
    }

    //插入改装选单
    function insertSelectBox() {
        var elements = document.querySelectorAll('.title-black.top-round.m-top10');

        for (var i = 0; i < elements.length; i++) {
            if (elements[i].textContent === "Available Categories") {
                elements[i].appendChild(selectElement);
                elements[i].appendChild(outputButton);
                elements[i].appendChild(refreshButton);
                clearInterval(intervalId); // Stop the continuous checking
                break;
            }
        }
    }



    //配置按钮点击事件
    function handleConfigButtonClick() {
        var carsIcon = document.querySelector('.icon.cars');
        if (carsIcon) {
            carsIconClick();
        }else{
            throw new Error('can not find page.')
        }

        var existingTable = document.querySelector('table.carmap-table');
        if (existingTable) {
            existingTable.remove();
        }
        var existingSaveButton = document.querySelector('.car-save');
        if (existingSaveButton) {
            existingSaveButton.remove();
        }
        var existingLoadButton = document.querySelector('.car-load');
        if (existingLoadButton) {
            existingLoadButton.remove();
        }
        waitForElementToAppear('enlist-wrap', function() {
            resultArray = []
            checkcarname();
            createTable()
        });

    }


    //移动cars Icon
    function carsIconClick() {
        var carsIcon = document.querySelector('li a.link.btn-action-tab[tab-value="cars"]').parentNode;
        var setButton = document.querySelector('.car-set');
        setButton.parentNode.insertBefore(carsIcon, setButton);

        carsIcon.classList.add('torn-btn');

        var titleElement = carsIcon.querySelector('.title');
        if (titleElement) {
            titleElement.textContent = '点我!';
        }
        carsIcon.addEventListener("click", carsIconback);
    }

    //归还cars Icon
    function carsIconback(){

        var carsIcon = document.querySelector('li a.link.btn-action-tab[tab-value="cars"]').parentNode;
        var beforeCarsIcon = document.querySelector('li a.link.btn-action-tab[tab-value="parts"]').parentNode;
        beforeCarsIcon.parentNode.insertBefore(carsIcon, beforeCarsIcon);

        carsIcon.classList.remove('torn-btn');

        var titleElement = carsIcon.querySelector('.title');
        if (titleElement) {
            titleElement.textContent = 'Your Cars';
        }
    }

    //获取已有车名
    function checkcarname() {
        var infoContents = document.querySelectorAll('.info-content');
        infoContents.forEach(function(infoContent) {
            var modelElement = infoContent.querySelector('.model');
            var modelInfo = modelElement ? modelElement.textContent.trim() : '';

            var nameDashlElement= infoContent.querySelector('.car-name-dash')
            var nameDashInfo = nameDashlElement ? nameDashlElement.textContent : '';

            var carNameElement = infoContent.querySelectorAll('span')[4].querySelectorAll('span')[1];
            var carNameInfo = carNameElement ? carNameElement.textContent.trim() : '';

            if (!nameDashInfo){
                carNameInfo=''
            }
            var combinedInfo = modelInfo + nameDashInfo + carNameInfo;
            resultArray.push(combinedInfo);
        });
        console.log(resultArray)

    }

    //创建表格
    function createTable() {
        table = document.createElement('table');
        table.className = 'carmap-table';
        table.style.backgroundColor = '#FFF5F7';

        var headRow = document.createElement('tr');
        headRow.className = 'head';
        var th1 = createTableCell('地图');
        var th2 = createTableCell('选车');

        headRow.appendChild(th1);
        headRow.appendChild(th2);

        table.appendChild(headRow);

        var options = resultArray;
        combinedMaps.forEach(function(map) {
            var row = document.createElement('tr');

            var td1 = createTableCell(map);

            var td2 = document.createElement('td');
            var select = document.createElement('select');

            options.forEach(function(optionText) {
                var option = document.createElement('option');
                option.text = optionText;
                select.add(option);
            });

            td2.appendChild(select);

            row.appendChild(td1);
            row.appendChild(td2);
            if (D_MAPS.includes(map)) {
                row.style.backgroundColor = '#D2B48C'; // 浅棕色
            } else if (T_MAPS.includes(map)) {
                row.style.backgroundColor = '#D3D3D3'; // 浅灰色
            }
            table.appendChild(row);
        });
        var tornBtn = document.querySelector('.torn-btn.car-set');
        tornBtn.parentNode.insertBefore(table, tornBtn.nextSibling);
        createSaveButton();
        createLoadButton();

    }

    //保存按钮
    function createSaveButton() {
        var tornBtnCarSet = document.querySelector('.torn-btn.car-set');
        var saveButton = document.createElement('div');
        saveButton.textContent = '保存';
        saveButton.className = "torn-btn car-save";
        saveButton.addEventListener('click', saveTableData);

        tornBtnCarSet.parentNode.insertBefore(saveButton, tornBtnCarSet.nextSibling);
    }

    //读取按钮
    function createLoadButton() {
        var tornBtnCarSet = document.querySelector('.torn-btn.car-set');
        var loadButton = document.createElement('div');
        loadButton.textContent = '读取';
        loadButton.className = "torn-btn car-load";
        loadButton.addEventListener('click', loadTableData);

        tornBtnCarSet.parentNode.insertBefore(loadButton, tornBtnCarSet.nextSibling.nextSibling);
    }

    //保存逻辑
    function saveTableData() {
        var tableData = getTableData();
        var json = JSON.stringify(tableData);
        localStorage.setItem('raceCarTableData', json);
    }

    //读取逻辑
    function loadTableData() {
        var json = localStorage.getItem('raceCarTableData');
        if (json) {
            var tableData = JSON.parse(json);
            setTableData(tableData);
        }
    }

    //获取表数据
    function getTableData() {
        var data = [];
        var rows = table.querySelectorAll('tr');
        for (var i = 1; i < rows.length; i++) {
            var cols = rows[i].querySelectorAll('td');
            var rowData = {
                position: cols[0].textContent,
                option: cols[1].querySelector('select').value
            };
            data.push(rowData);
        }
        return data;
    }

    //设置表数据
    function setTableData(data) {
        var rows = table.querySelectorAll('tr');
        for (var i = 1; i < rows.length; i++) {
            var cols = rows[i].querySelectorAll('td');
            cols[1].querySelector('select').value = data[i-1].option;
        }
    }

    //创建表
    function createTableCell(text) {
        var cell = document.createElement('td');
        cell.textContent = text;
        cell.style.border = '1px solid darkgray';
        cell.style.padding = '5px';
        cell.style.textAlign = 'center';
        return cell;
    }

    //开始比赛按钮
    function insertRaceButton() {
        var element = document.querySelector('.content-title.m-bottom10');

        var buttonContainer = document.createElement('div');
        buttonContainer.classList.add('button-container');

        buttonContainer.appendChild(startRaceButton);
        buttonContainer.appendChild(document.createElement('br'));
        buttonContainer.appendChild(configButton);


        element.appendChild(buttonContainer);

        configButton.addEventListener("click", handleConfigButtonClick);
        startRaceButton.addEventListener("click", handleStartButtonClick);
    }


    //开始比赛逻辑
    function handleStartButtonClick() {
        var carsIcon = document.querySelector('li a.link.btn-action-tab[tab-value="race"]');
        if (carsIcon) {
            raceIconClick();


        }
    }

    //转移race Icon
    function raceIconClick() {
        var raceIcon = document.querySelector('li a.link.btn-action-tab[tab-value="race"]').parentNode;
        var startButton = document.querySelector('.car-start');
        startButton.parentNode.insertBefore(raceIcon, startButton);

        startButton.style.visibility = 'hidden';

        raceIcon.classList.add('torn-btn');
        raceIcon.style.visibility = 'hidden'

        var titleElement = raceIcon.querySelector('.title');
        if (titleElement) {
            titleElement.textContent = '点我!';
        }
        raceIcon.addEventListener("click", raceIconback);
        setTimeout(function() {
            raceIcon.style.visibility = 'visible';
        }, 300);

    }

    //归还race Icon
    function raceIconback(){
        var raceIcon = document.querySelector('li a.link.btn-action-tab[tab-value="race"]').parentNode;
        var infrontRaceIcon = document.querySelector('li a.link.btn-action-tab[tab-value="parts"]').parentNode;
        infrontRaceIcon.parentNode.insertBefore(raceIcon, infrontRaceIcon.nextSibling);

        raceIcon.classList.remove('torn-btn');

        var titleElement = raceIcon.querySelector('.title');
        if (titleElement) {
            titleElement.textContent = 'Official Events';
        }
        JoinButton();
    }
    //开始比赛
    function JoinButton() {
        var interval = setInterval(function() {

            var joinButton = document.querySelector('a.btn.torn-btn.btn-action-tab.btn-dark-bg[tab-value="race"][section-value="changeRacingCar"][step-value="getInRace"]');
            if (joinButton && joinButton.textContent === "JOIN A RACING EVENT") {
                clearInterval(interval);
                joinIconClick();
            }
        }, 100);
    }

    //转移join
    function joinIconClick() {
        var joinIcon = document.querySelector('a.btn.torn-btn.btn-action-tab.btn-dark-bg[tab-value="race"]').parentNode;
        var startButton = document.querySelector('.car-start');
        startButton.parentNode.insertBefore(joinIcon, startButton);

        startButton.style.visibility = 'hidden';

        joinIcon.style.visibility = 'hidden';
        joinIcon.classList.add("torn-btn");

        joinIcon.addEventListener("click",checkClassAndExecute);

        setTimeout(function() {
            joinIcon.style.visibility = 'visible';
        }, 100);

    }
    function checkClassAndExecute() {
        var checkInterval = setInterval(function() {

            var element = document.getElementsByClassName("enlisted-btn-wrap");
            if (element) {
                clearInterval(checkInterval);
                chooseCar();
            }
        }, 100);
    }




    function chooseCar(){
        var joinIcon = document.querySelector('a.btn.torn-btn.btn-action-tab.btn-dark-bg[tab-value="race"]');
        document.getElementsByClassName("btn-wrap silver c-pointer torn-btn")[0].remove()

        joinIcon.remove();
        var optionRaceCar='';
        var interval2 = setInterval(function() {
                var mapname = document.getElementsByClassName("enlisted-btn-wrap")[0].textContent.trim().split('-')[0].trim()
                if (mapname) {
                    clearInterval(interval2);

                    var cachedTableData = JSON.parse(localStorage.getItem('raceCarTableData'));
                    if (cachedTableData && cachedTableData.length > 0) {
                        var matchedRow = cachedTableData.find(function(row) {
                            return row.position === mapname;
                        });
                        if (matchedRow) {
                            console.log('找到匹配项');
                            console.log('对应的 option:', matchedRow.option);
                            optionRaceCar=matchedRow.option
                            var infoContents = document.querySelectorAll('.info-content');

                            infoContents.forEach(function(infoContent) {
                                var modelElement = infoContent.querySelector('.model');
                                var modelInfo = modelElement ? modelElement.textContent.trim() : '';

                                var nameDashlElement= infoContent.querySelector('.car-name-dash')
                                var nameDashInfo = nameDashlElement ? nameDashlElement.textContent : '';

                                var carNameElement = infoContent.querySelectorAll('span')[3].querySelectorAll('span')[1];
                                var carNameInfo = carNameElement ? carNameElement.textContent.trim() : '';

                                if (!nameDashInfo){
                                    carNameInfo=''
                                }

                                var listCarName = modelInfo + nameDashInfo + carNameInfo;

                                var useThisCarLink = infoContent.querySelector('a.enlist-link.remove.btn-action-tab');
                                console.log(listCarName+" 对比 " + optionRaceCar)
                                if (listCarName === optionRaceCar) {
                                    console.log(listCarName)
                                    console.log(useThisCarLink)
                                    console.log("对比成功")

                                    //转移cars Icon
                                    var startButton = document.querySelector('.car-start');
                                    startButton.parentNode.insertBefore(changeCarButton, startButton);
                                    changeCarButton.addEventListener("click", function() {
                                        window.location.href="https://www.torn.com"+useThisCarLink.getAttribute('href')
                                    });


                                    last()
                                }
                            });
                        } else {
                            console.log('未找到匹配项');
                        }
                    } else {
                        console.log('缓存中没有表格数据');
                    }

                    if (matchedRow) {
                        console.log('找到匹配项');
                        console.log('对应的 option:', matchedRow.option);
                        // 这里可以进行相应的操作
                    } else {
                        console.log('未找到匹配项');
                    }
                } else {
                    console.log('缓存中没有表格数据');
                }
            }
            , 500);}

    function last(){
        console.log("开始比赛")
        lastIcon.remove();
        var startButton = document.querySelector('.car-start');
        startButton.style.visibility = 'visible';
    }

    var lastIcon=''
    var intervalId = setInterval(insertSelectBox, 1000);

    var observer = new MutationObserver(function(mutations) {
        mutations.forEach(function(mutation) {
            checkAndOutput();
        });
    });
    var config = { childList: true, subtree: true };

    observer.observe(document, config);

    var matchingLinks = new Set();
    function handleButtonClick2(link) {
        link.addEventListener('click', function() {
            handleButtonClick();

        });
    }

    function checkAndOutput() {
        var newMatchingLinks = document.querySelectorAll('[data-ng-click="buyConfirmed($event)"]');
        newMatchingLinks.forEach(function(link) {
            if (!matchingLinks.has(link)) {
                matchingLinks.add(link);
                handleButtonClick2(link);
            }
        });

        setTimeout(checkAndOutput, 1000);
    }

    checkAndOutput();
    insertRaceButton()
    createOptions();
    outputButton.addEventListener("click", handleButtonClick);
    refreshButton.addEventListener("click", resetBackgroundColors);

})();