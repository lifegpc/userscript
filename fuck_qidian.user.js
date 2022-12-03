// ==UserScript==
// @name         Fuck qidian
// @namespace    https://github.com/lifegpc/userscript
// @version      0.1
// @description  Remove console.clear to help develop.
// @author       lifegpc
// @match        https://*.qidian.com/*
// @icon         http://qidian.com/favicon.ico
// @grant        none
// @run-at       document-start
// ==/UserScript==

(function() {
    'use strict';
    let a = document.createElement('script');
    a.innerHTML = 'console.clear = () => {}';
    document.head.append(a);
})();
