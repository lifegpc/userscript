// ==UserScript==
// @name         移除 BiliBili 播放页的死🐴参数
// @namespace    https://github.com/lifegpc/userscript
// @version      0.1
// @description  仅保留t和p的参数
// @author       lifegpc
// @match        https://www.bilibili.com/video/*
// @icon         https://www.bilibili.com/favicon.ico
// @grant        none
// ==/UserScript==

(function() {
    function check_get_param() {
        let ori = new URL(document.location.href);
        let need_replease = false;
        let params = new URLSearchParams();
        for (const [key, value] of ori.searchParams.entries()) {
            if (key != "t" && key != "p") {
                need_replease = true;
            } else {
                params.append(key, value);
            }
        }
        if (need_replease) {
            history.replaceState(null, null, '?' + params.toString())
        }
        setTimeout(check_get_param, 1000);
    }
    check_get_param();
    'use strict';
})();
