// ==UserScript==
// @name         E-Hentai better viewer
// @namespace    https://github.com/lifegpc/userscript
// @version      0.2.0
// @description  Add a viewer to view original picture on website.
// @author       lifegpc
// @match        https://*.e-hentai.org/s/*/*
// @icon         https://e-hentai.org/favicon.ico
// @grant        GM_getResourceText
// @grant        GM_addElement
// @grant        GM_addStyle
// @require      https://github.com/lifegpc/viewerjs/raw/main/dist/viewer.min.js
// @resource     viewercss https://github.com/lifegpc/viewerjs/raw/main/dist/viewer.min.css
// @run-at       document-start
// ==/UserScript==
GM_addStyle(GM_getResourceText("viewercss"));
let cur_img = null;
let obs = new MutationObserver((list) => {
    for (const m of list) {
        if (m.type == 'childList') {
            m.removedNodes.forEach(v => {
                if (cur_img != null && v == cur_img) {
                    load();
                    cur_img = null;
                }
            })
        }
    }
})
let load = () => {
    let img = document.getElementById("img");
    if (img == null) {
        setTimeout(load, 100);
        return;
    }
    cur_img = img;
    let parent = img.parentElement;
    parent.replaceWith(img);
    obs.observe(img.parentElement, {'childList': true, 'subtree': true});
    let options = {
        title: () => {
            return document.getElementsByTagName("h1")[0].innerText
        },
        navbar: false
    };
    /**@type {HTMLAnchorElement}*/
    let original = document.querySelector("#i7>a");
    if (original != null) {
        let ourl = original.href;
        console.log(ourl);
        options.url = ourl;
    }
    console.log(options);
    let viewer = new Viewer(img, options);
    let click = async () => {
        img.removeEventListener("click", click);
        await viewer.init();
        console.log("Inited complete");
        await viewer.show();
    };
    img.addEventListener("click", click);
};
window.addEventListener("DOMContentLoaded", load);
