// ==UserScript==
// @name         EH Gallery Script
// @namespace    https://github.com/lifegpc/userscript
// @version      0.1.3
// @description  :(
// @author       lifegpc
// @match        https://*.e-hentai.org/g/*/*
// @match        https://*.e-hentai.org/
// @match        https://*.e-hentai.org/?*
// @match        https://*.e-hentai.org/watched
// @match        https://*.e-hentai.org/watched?*
// @match        https://*.e-hentai.org/popular
// @match        https://*.e-hentai.org/popular?*
// @match        https://*.e-hentai.org/favorites.php
// @match        https://*.e-hentai.org/favorites.php?*
// @match        https://*.e-hentai.org/tag/*
// @match        https://*.exhentai.org/g/*/*
// @match        https://*.exhentai.org/
// @match        https://*.exhentai.org/?*
// @match        https://*.exhentai.org/watched
// @match        https://*.exhentai.org/watched?*
// @match        https://*.exhentai.org/popular
// @match        https://*.exhentai.org/popular?*
// @match        https://*.exhentai.org/favorites.php
// @match        https://*.exhentai.org/favorites.php?*
// @match        https://*.exhentai.org/tag/*
// @icon         https://e-hentai.org/favicon.ico
// @grant        GM_getValue
// @grant        GM_setValue
// @grant        GM_registerMenuCommand
// @require      https://openuserjs.org/src/libs/sizzle/GM_config.js
// @run-at       document-start
// ==/UserScript==
const GALLERY_REG = /e[-x]hentai\.org\/g\/\d+\/[^/]+/;
const IMG_REG = /e[-x]hentai\.org\/s\/[^/]+\/\d+-\d+/;
const MPV_REG = /e[-x]hentai\.org\/mpv\/\d+\/[^/]+/;
GM_config.init({
    id: 'e-hentai',
    fields: {
        openImageInNewTab: {
            type: 'checkbox',
            label: 'Open image in new tab.',
            default: true
        },
        openGalleryInNewTab: {
            type: 'checkbox',
            label: 'Open gallery in new tab.',
            default: true
        },
        openMPVInNewTab: {
            type: 'checkbox',
            label: 'Open Multi-Page Viewer in new tab.',
            default: true
        }
    },
    events: {
        save: (values) => {
            let openImageInNewTab = GM_config.get("openImageInNewTab");
            let openGalleryInNewTab = GM_config.get("openGalleryInNewTab");
            let openMPVInNewTab = GM_config.get("openMPVInNewTab");
            let eles = document.getElementsByTagName("a");
            for (let ele of eles) {
                if (ele.href.match(IMG_REG)) {
                    ele.target = openImageInNewTab ? '_blank' : '_self';
                } else if (ele.href.match(GALLERY_REG)) {
                    ele.target = openGalleryInNewTab ? '_blank' : '_self';
                } else if (ele.href.match(MPV_REG)) {
                    ele.target = openMPVInNewTab ? '_blank' : '_self';
                }
            }
        }
    }
});
GM_registerMenuCommand("Edit Settings", () => { GM_config.open() }, "e");
let observer = new MutationObserver((data) => {
    let openImageInNewTab = GM_config.get("openImageInNewTab");
    let openGalleryInNewTab = GM_config.get("openGalleryInNewTab");
    let openMPVInNewTab = GM_config.get("openMPVInNewTab");
    for (let i of data) {
        let ele = i.target;
        if (ele.tagName == 'A') {
            if (ele.href.match(IMG_REG)) {
                ele.target = openImageInNewTab ? '_blank' : '_self';
            } else if (ele.href.match(GALLERY_REG)) {
                ele.target = openGalleryInNewTab ? '_blank' : '_self';
            } else if (ele.href.match(MPV_REG)) {
                ele.target = openMPVInNewTab ? '_blank' : '_self';
            }
        }
    }
});
observer.observe(document, { childList: true, subtree: true });
