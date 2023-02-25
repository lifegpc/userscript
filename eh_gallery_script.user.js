// ==UserScript==
// @name         EH Gallery Script
// @namespace    https://github.com/lifegpc/userscript
// @version      0.1.0
// @description  :(
// @author       lifegpc
// @match        https://*.e-hentai.org/g/*/*
// @match        https://*.exhentai.org/g/*/*
// @icon         https://e-hentai.org/favicon.ico
// @grant        GM_getValue
// @grant        GM_setValue
// @grant        GM_registerMenuCommand
// @require      https://openuserjs.org/src/libs/sizzle/GM_config.js
// @run-at       document-start
// ==/UserScript==
GM_config.init({
    id: 'e-hentai',
    fields: {
        openImageInNewTab: {
            type: 'checkbox',
            label: 'Open image in new tab.',
            default: true
        }
    },
    events: {
        save: (values) => {
            let openImageInNewTab = GM_config.get("openImageInNewTab");
            let eles = document.getElementsByTagName("a");
            for (let ele of eles) {
                if (ele.href.match(REG)) {
                    ele.target = openImageInNewTab ? '_blank' : '_self';
                }
            }
        }
    }
});
const REG = /e[-x]hentai\.org\/s\/[^/]+\/\d+-\d+/;
GM_registerMenuCommand("Edit Settings", () => { GM_config.open() }, "e");
let observer = new MutationObserver((data) => {
    let openImageInNewTab = GM_config.get("openImageInNewTab");
    for (let i of data) {
        let ele = i.target;
        if (ele.tagName == 'A') {
            if (ele.href.match(REG)) {
                ele.target = openImageInNewTab ? '_blank' : '_self';
            }
        }
    }
});
observer.observe(document, { childList: true, subtree: true });
