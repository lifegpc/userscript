// ==UserScript==
// @name         E-Hentai better viewer
// @namespace    https://github.com/lifegpc/userscript
// @version      0.2.2
// @description  Add a viewer to view original picture on website.
// @author       lifegpc
// @match        https://*.e-hentai.org/s/*/*
// @match        https://*.exhentai.org/s/*/*
// @icon         https://e-hentai.org/favicon.ico
// @grant        GM_getResourceText
// @grant        GM_addElement
// @grant        GM_addStyle
// @require      https://github.com/lifegpc/viewerjs/raw/main/dist/viewer.min.js
// @resource     viewercss https://github.com/lifegpc/viewerjs/raw/main/dist/viewer.min.css
// @run-at       document-start
// ==/UserScript==
GM_addStyle(GM_getResourceText("viewercss"));
function indirectEval(script) {
    return eval(`"use strict";${script}`);
}
function find_script() {
    let cols = document.getElementsByTagName("script");
    for (let col of cols) {
        if (col.innerHTML.startsWith("var ")) {
            return col.innerHTML;
        }
    }
}
let base_url = undefined;
let cur_img = null;
let cur_viewer = null;
let script_text = undefined;
let api_url = undefined;
let gid = undefined;
let showkey = undefined;
let img_keys = {};
let cur_page = null;
let total_page = null;
function get_api_url() {
    if (api_url !== undefined) return api_url;
    if (script_text === undefined) {
        script_text = find_script();
    }
    if (script_text === undefined) return undefined;
    api_url = indirectEval(`${script_text};api_url`);
    return api_url;
}
function get_base_url() {
    if (base_url !== undefined) return base_url;
    base_url = new URL(document.location.href)
    return base_url;
}
function get_gid() {
    if (gid !== undefined) return gid;
    if (script_text === undefined) {
        script_text = find_script();
    }
    if (script_text === undefined) return undefined;
    gid = indirectEval(`${script_text};gid`);
    return gid;
}
function get_showkey() {
    if (showkey !== undefined) return showkey;
    if (script_text === undefined) {
        script_text = find_script();
    }
    if (script_text === undefined) return undefined;
    showkey = indirectEval(`${script_text};showkey`);
    return showkey;
}
function api_call(data) {
    return new Promise((resolve, reject) => {
        let api_url = get_api_url();
        if (!api_url) {
            reject("api_url not found.");
            return;
        }
        let xhr = new XMLHttpRequest();
        xhr.open("POST", api_url);
        xhr.withCredentials = true;
        xhr.onload = (ev) => {
            resolve(xhr);
        };
        xhr.onerror = (ev) => {
            reject(ev);
        }
        xhr.onabort = (ev) => {
            reject(ev);
        }
        xhr.send(JSON.stringify(data));
    })
}
function genUrl(gid, imgkey, page) {
    return new URL(`/s/${imgkey}/${gid}-${page}`, get_base_url())
}
async function loadPage(page) {
    let gid = get_gid();
    if (!gid) throw Error("gid not found.");
    let showkey = get_showkey();
    if (!showkey) throw Error("showkey not found.");
    let imgkey = img_keys[page];
    if (!imgkey) return;
    history.pushState({ page, imgkey }, document.title, genUrl(gid, imgkey, page).toString());
    let xhr = await api_call({ method: "showpage", gid, page, imgkey, showkey });
    let a = JSON.parse(xhr.responseText);
    if (cur_viewer) cur_viewer.destroy();
    document.getElementById("i1").style.width = a.x + "px";
    document.getElementById("i2").innerHTML = a.n + a.i;
    document.getElementById("i3").innerHTML = a.i3;
    document.getElementById("i4").innerHTML = a.i + a.n;
    document.getElementById("i5").innerHTML = a.i5;
    document.getElementById("i6").innerHTML = a.i6;
    document.getElementById("i7").innerHTML = a.i7;
    update_window_extents(parseInt(a.x), parseInt(a.y));
    load();
}
function replaceLink(a) {
    let ohtml = a.innerHTML;
    let na = document.createElement('a');
    let matched = a.href.match(/e[x-]hentai\.org\/s\/([^\/]+)\/\d+-(\d+)/);
    if (!matched) return;
    let num = parseInt(matched[2]);
    let img_key = matched[1];
    img_keys[num] = img_key;
    na.innerHTML = ohtml;
    na.addEventListener("click", () => { loadPage(num); });
    a.replaceWith(na);
}
let load = () => {
    let img = document.getElementById("img");
    if (img == null) {
        setTimeout(load, 100);
        return;
    }
    cur_page = parseInt(document.querySelector('#i2 span').innerText);
    total_page = parseInt(document.querySelector('#i2 span:last-child').innerText);
    cur_img = img;
    let parent = img.parentElement;
    parent.replaceWith(img);
    let options = {
        title: () => {
            return document.getElementsByTagName("h1")[0].innerText
        },
        keyboard: false,
        navbar: false,
        loop: false,
        toolbar: { prev: { show: true, click: prevImage }, zoomIn: { show: true }, zoomOut: { show: true }, oneToOne: { show: true }, next: { show: true, click: nextImage } }
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
    cur_viewer = viewer;
    img.addEventListener("click", click);
    let links = document.querySelectorAll(".sn a");
    for (let i of links) {
        replaceLink(i);
    }
    console.log(img_keys);
};
window.addEventListener("DOMContentLoaded", load);
window.addEventListener("DOMContentLoaded", () => {
    // Remove default keyboard binding.
    // Add custom event listener.
    let scr = document.createElement("script");
    scr.innerHTML = 'document.onkeydown = () => {};document.addEventListener("update_window_extents", (ev) => {xres=ev.xres;yres=ev.yres;update_window_extents();});';
    document.head.append(scr);
});
function zoomIn() {
    if (cur_viewer) cur_viewer.zoom(-0.1);
}
function zoomOut() {
    if (cur_viewer) cur_viewer.zoom(0.1);
}
function moveDown() {
    if (cur_viewer) cur_viewer.move(0, -10);
}
function moveUp() {
    if (cur_viewer) cur_viewer.move(0, 10);
}
function moveLeft() {
    if (cur_viewer) cur_viewer.move(10, 0);
}
function moveRight() {
    if (cur_viewer) cur_viewer.move(-10, 0);
}
function prevImage() {
    if (cur_page === null) return;
    loadPage(cur_page - 1)
}
function nextImage() {
    if (cur_page === null) return;
    loadPage(cur_page + 1)
}
function update_window_extents(xres, yres) {
    let ev = new Event("update_window_extents");
    ev.xres = xres;
    ev.yres = yres;
    document.dispatchEvent(ev);
}
window.addEventListener("keydown", (e) => {
    if (!e.ctrlKey && !e.shiftKey) {
        if (e.key == "ArrowDown") {
            zoomIn();
        } else if (e.key == "ArrowUp") {
            zoomOut();
        } else if (e.key == "ArrowLeft") {
            prevImage();
        } else if (e.key == "ArrowRight") {
            nextImage();
        }
    } else if (e.ctrlKey && !e.shiftKey) {
        if (e.key == "ArrowDown") {
            moveDown();
        } else if (e.key == "ArrowUp") {
            moveUp();
        } else if (e.key == "ArrowLeft") {
            moveLeft();
        } else if (e.key == "ArrowRight") {
            moveRight();
        }
    }
})
