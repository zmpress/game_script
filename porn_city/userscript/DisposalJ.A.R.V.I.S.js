// ==UserScript==
// @name        Disposal J.A.R.V.I.S.
// @namespace   http://tampermonkey.net/
// @version     0.8
// @description color disposal options based on safety
// @author      Terekhov
// @match       https://www.torn.com/loader.php?sid=crimes*
// @icon        https://www.google.com/s2/favicons?sz=64&domain=torn.com
// @grant       none
// @updateURL    https://raw.githubusercontent.com/zmpress/game_script/refs/heads/main/porn_city/userscript/DisposalJ.A.R.V.I.S.js
// @downloadURL    https://raw.githubusercontent.com/zmpress/game_script/refs/heads/main/porn_city/userscript/DisposalJ.A.R.V.I.S.js

// ==/UserScript==

(function () {
    'use strict';

    const colors = {
        safe: '#40Ab24',
        caution: '#D6BBA2',
        unsafe: '#B51B1B'
    };
    const JOB_METHOD_DIFFICULTIES_MAP = {
        'Biological Waste': {
            safe: ['Sink'],
            caution: ['Bury', 'Burn'],
            unsafe: []
        },
        'Body Part': {
            safe: [],
            caution: [],
            unsafe: []
        },
        'Broken Appliance': {
            safe: ['Sink'],
            caution: ['Abandon', 'Bury'],
            unsafe: ['Dissolve']
        },
        'Building Debris': {
            safe: ['Sink'],
            caution: ['Abandon', 'Bury'],
            unsafe: []
        },
        'Dead Body': {
            safe: [],
            caution: [],
            unsafe: []
        },
        Documents: {
            safe: ['Burn'],
            caution: ['Abandon', 'Bury'],
            unsafe: ['Dissolve']
        },
        Firearm: {
            safe: ['Bury', 'Sink'],
            caution: [],
            unsafe: ['Dissolve']
        },
        'General Waste': {
            safe: ['Bury', 'Burn'],
            caution: ['Abandon', 'Sink'],
            unsafe: ['Dissolve']
        },
        'Industrial Waste': {
            safe: ['Sink'],
            caution: ['Abandon', 'Bury'],
            unsafe: []
        },
        'Murder Weapon': {
            safe: ['Sink'],
            caution: [],
            unsafe: ['Dissolve']
        },
        'Old Furniture': {
            safe: ['Burn'],
            caution: ['Abandon', 'Bury', 'Sink'],
            unsafe: ['Dissolve']
        },
        Vehicle: {
            safe: ['Burn', 'Sink'],
            caution: ['Abandon'],
            unsafe: []
        }
    };
    const NERVE_COST_BY_METHOD = {
        Abandon: 6,
        Bury: 8,
        Burn: 10,
        Sink: 12,
        Dissolve: 14
    };

//
// Based on guide here https://www.torn.com/forums.php#/p=threads&f=61&t=16367936&b=0&a=0
// Thanks Emforus [2535044]!
//
// The script start is triggered by formatPageOnce and/or startCheckingPageToFormat
//
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// This section of the script listens for page load and calls the main crime script
// Note -- these functions are different depending on the crime; Pickpocketing, for example, is much more
//         complex to check for than Disposal.
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    setTimeout(formatPageOnce, 650);
    const pageLandingInterval = setInterval(startCheckingPageToFormat, 650);

//
// GreaseMonkey can't listen for disposal page directly, so we run this on all crimes pages.
// however if we navigate away from disposal, we stop listening with our observer
//
    let pagePopInterval;
    window.addEventListener('popstate', function () {
        setTimeout(formatPageOnce, 650);
        pagePopInterval = setInterval(startCheckingPageToFormat, 650);
    });
    function formatPageOnce() {
        if (!window.location.href.includes('#/disposal')) {
            return;
        }
        executeCrimeScript();
    }

    /**
     * This function clears intervals checking the page, as the page has already been formatted
     */
    function clearPageCheckingIntervals(reason) {
        if (pageLandingInterval) {
            console.warn('clearing pageLandingInterval: ' + reason);
            clearInterval(pageLandingInterval);
        }
        if (pagePopInterval) {
            console.warn('clearing pagePopInterval: ' + reason);
            clearInterval(pagePopInterval);
        }
    }
    let alreadyListening = false;

    /**
     * This function is called on an interval to see if the page needs formatting.
     * If it does, it calls {@link #formatPageOnce} and stops checking after that; otherwise, it keeps going.
     */
    function startCheckingPageToFormat() {
        if (!window.location.href.includes('#/disposal')) {
            alreadyListening = false;
            clearPageCheckingIntervals('not disposal page');
            return;
        }
        if (alreadyListening) {
            clearPageCheckingIntervals('already listening');
            return;
        }
        formatPageOnce();
        alreadyListening = true;
    }

///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// Global variables - functions and variables that can be re-used across all crimes
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    /**
     * @return the div containing the list of crime targets (for pickpocketing and disposal, at least)
     */
    function getCrimesContainer() {
        const crimesContainerName = document.querySelectorAll('[class^="crimeOptionGroup"]')[0].classList[0];
        return document.getElementsByClassName(crimesContainerName)[0];
    }

    /**
     * Utility for inspecting children of an element
     *
     * @return child which has a class starting with {@param name}
     */
    function findChildByClassStartingWith(name, parentEle) {
        for (const child of parentEle.children) {
            for (const childClass of child.classList) {
                if (!!childClass && childClass.startsWith(name)) {
                    return child;
                }
            }
        }
        return null;
    }

    /**
     * Utility for inspecting children of an element
     *
     * @return child which has a class starting with {@param name}
     */
    function findChildByClassContaining(name, parentEle) {
        for (const child of parentEle.children) {
            for (const childClass of child.classList) {
                if (!!childClass && childClass.indexOf(name) !== -1) {
                    return child;
                }
            }
        }
        return null;
    }

///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// MAIN SCRIPT - The code below is specific to this crime
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    let totalNerveHasBeenCalculated = false;

    /**
     * One purpose - execute the main crime script
     */
    function executeCrimeScript() {
        let totalNerveNeeded = 0;
        for (const jobNode of getCrimesContainer().children) {
            totalNerveNeeded += getNerveNeededForJob(jobNode);

            // Format each cell
            formatJob(jobNode);
        }
        if (totalNerveHasBeenCalculated) {
            return;
        } else {
            totalNerveHasBeenCalculated = true;
        }
        // Set total nerve at top
        const titleDiv = document.querySelectorAll('[class^="crimeHeading"]')[1].children[0];
        titleDiv.textContent = `${titleDiv.textContent} (Max Nerve needed: ${totalNerveNeeded})`;
    }
    function getNerveNeededForJob(jobNode) {
        const jobSections = findChildByClassStartingWith('sections', jobNode);

        // TODO not sure if jobName works for all views
        const jobName = jobSections.children[1].textContent;
        const methodDifficulties = JOB_METHOD_DIFFICULTIES_MAP[jobName];
        if (methodDifficulties && methodDifficulties.safe.length) {
            const highestNerveMethod = methodDifficulties.safe[methodDifficulties.safe.length - 1];
            return NERVE_COST_BY_METHOD[highestNerveMethod];
        } else {
            return 0;
        }
    }
    function formatJob(jobNode) {
        const jobSections = findChildByClassStartingWith('sections', jobNode);

        // TODO not sure if jobName works for all views
        const jobName = jobSections.children[1].textContent;
        let disposalMethodsContainer = findChildByClassContaining('desktopMethodsSection', jobSections);
        if (!disposalMethodsContainer) {
            disposalMethodsContainer = findChildByClassContaining('tabletMethodsSection', jobSections);

            // Have to go one deeper to get the methods container
            // However they remain the same options
            disposalMethodsContainer = findChildByClassStartingWith('methodPicker', disposalMethodsContainer);
        }
        const methodDifficulties = JOB_METHOD_DIFFICULTIES_MAP[jobName];
        if (methodDifficulties) {
            for (const safeMethod of methodDifficulties.safe) {
                const node = findChildByClassStartingWith(safeMethod.toLowerCase(), disposalMethodsContainer);
                if (node) {
                    node.style.border = '3px solid ' + colors.safe;
                }
            }
            for (const cautionMethod of methodDifficulties.caution) {
                const node = findChildByClassStartingWith(cautionMethod.toLowerCase(), disposalMethodsContainer);
                if (node) {
                    node.style.border = '2px solid ' + colors.caution;
                }
            }
            for (const unsafeMethod of methodDifficulties.unsafe) {
                const node = findChildByClassStartingWith(unsafeMethod.toLowerCase(), disposalMethodsContainer);
                if (node) {
                    node.style.border = '3px solid ' + colors.unsafe;
                }
            }
        }
    }

})();