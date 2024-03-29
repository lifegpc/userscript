// ==UserScript==
// @name         E-Hentai better viewer
// @namespace    https://github.com/lifegpc/userscript
// @version      0.3.0
// @description  Add a viewer to view original picture on website.
// @author       lifegpc
// @match        https://*.e-hentai.org/s/*/*
// @match        https://*.exhentai.org/s/*/*
// @icon         https://e-hentai.org/favicon.ico
// @grant        GM_getResourceText
// @grant        GM_addElement
// @grant        GM_addStyle
// @grant        GM_getValue
// @grant        GM_setValue
// @grant        GM_registerMenuCommand
// @require      https://github.com/lifegpc/viewerjs/raw/main/dist/viewer.min.js
// @require      https://github.com/emn178/js-sha512/raw/v0.8.0/build/sha512.min.js
// @require      https://openuserjs.org/src/libs/sizzle/GM_config.js
// @resource     viewercss https://github.com/lifegpc/viewerjs/raw/main/dist/viewer.min.css
// @run-at       document-start
// ==/UserScript==
GM_config.init({
    id: 'e-hentai',
    fields: {
        enableRedirectAPI: {
            type: 'checkbox',
            label: 'Enable redirect api. This need a thirdparty server.',
            default: false
        },
        APIEndpoint: {
            type: 'hidden'
        },
        tempAPIEndpoint: {
            label: 'The endpoint of the API:',
            type: 'text',
            save: false
        },
        APISecret: {
            label: 'The API secret:',
            type: 'text'
        },
        LoadOriginalWhenOpen: {
            type: 'checkbox',
            label: 'Load original pictures when opening the viewer modal.',
            default: false
        },
    },
    events: {
        init: () => {
            GM_config.set("tempAPIEndpoint", GM_config.get("APIEndpoint"))
        },
        open: () => {
            GM_config.set("tempAPIEndpoint", GM_config.get("APIEndpoint"))
        },
        save: (values) => {
            console.log(values);
            if (GM_config.get('enableRedirectAPI')) {
                if (values.tempAPIEndpoint !== null) {
                    try {
                        GM_config.set("APIEndpoint", new URL(values.tempAPIEndpoint).toString());
                    } catch (e) {
                        GM_config.set("enableRedirectAPI", false);
                        console.log(e);
                    }
                }
                if (!GM_config.get("APISecret")) {
                    GM_config.set("enableRedirectAPI", false);
                }
            }
        }
    }
})
GM_registerMenuCommand("Edit Settings", () => { GM_config.open() }, "e");
GM_addStyle(GM_getResourceText("viewercss"));
function indirectEval(script) {
    return eval(`"use strict";${script}`);
}
function parse_cookies() {
    let cookies = document.cookie.split(";");
    let o = {};
    for (let c of cookies) {
        c = c.trim().split("=");
        let k = c[0];
        let v = c.slice(1).join("=");
        o[k] = v;
    }
    return o;
}
function find_script() {
    let cols = document.getElementsByTagName("script");
    for (let col of cols) {
        if (col.innerHTML.startsWith("var ")) {
            return col.innerHTML;
        }
    }
}
/**
 * encodeURIComponent as python's quote_plus behavoir
 * @param {string} str
 * @returns
 */
function py_quote(str) {
    let s = encodeURIComponent(str);
    while (s.includes('%20')) {
        s = s.replace('%20', '+');
    }
    while (s.includes('!')) {
        s = s.replace('!', '%21');
    }
    while (s.includes("'")) {
        s = s.replace("'", '%27');
    }
    while (s.includes('(')) {
        s = s.replace('(', '%28');
    }
    while (s.includes(')')) {
        s = s.replace(')', '%29');
    }
    while (s.includes('*')) {
        s = s.replace('*', '%2A');
    }
    return s;
}
class URLParams extends URLSearchParams {
    toString() {
        let r = "";
        for (let p of this.entries()) {
            if (r.length) r += "&";
            r += py_quote(p[0]) + "=" + py_quote(p[1]);
        }
        return r;
    }
}
/**
 * 发送GET请求
 * @param {string} url 网站
 * @param {Object<string, string>|Array<Array<string>|string>} data 字典
 * @param {(content: string)=>void} callback 回调函数
 * @param {()=>void} failedCallback 失败回调函数
 * @param {Object<string, string>} headers HTTP头部
 */
function get(url, data, callback, failedCallback, headers) {
    var xhr = new XMLHttpRequest();
    var uri = new URL(url, window.location.href);
    if (data == undefined);
    else if (Array.isArray(data)) {
        for (let i = 0; i < data.length; i++) {
            var pair = data[i];
            if (Array.isArray(pair)) {
                uri.searchParams.append(pair[0], pair.length > 1 ? pair[1] : "");
            } else if (typeof pair == "string") {
                uri.searchParams.append(pair, "");
            }
        }
    } else {
        Object.getOwnPropertyNames(data).forEach((key) => {
            if (typeof data[key] == "string")
                uri.searchParams.append(key, data[key]);
        })
    }
    xhr.open("GET", uri.href);
    if (callback != undefined) xhr.onload = () => {
        callback(xhr.responseText);
    };
    if (failedCallback != undefined) xhr.onerror = failedCallback;
    if (headers != undefined) {
        Object.getOwnPropertyNames(headers).forEach((key) => {
            if (typeof headers[key] == "string")
                xhr.setRequestHeader(key, headers[key])
        })
    }
    try {
        xhr.send();
    } catch (e) {
        if (failedCallback != undefined) failedCallback();
    }
}
/**
 * Generate sign for data
 * @param {Object<string, string | Array<string>>|FormData} data Data
 * @param {string} secret Secret
 * @param {(data: string) => string|undefined} hash The hash function
 * @returns {string}
 */
function genGetSign(data, secret, hash) {
    if (!hash) hash = sha512;
    /**@type {Array<{k: string, v: string}>} */
    let arr = [];
    if (data.constructor.name == "FormData") {
        for (let pair of data.entries()) {
            if (typeof pair[1] != "string") continue;
            arr.push({ k: pair[0], v: pair[1] });
        }
    } else {
        Object.getOwnPropertyNames(data).forEach((key) => {
            let v = data[key];
            if (typeof v == "string") arr.push({ k: key, v: v });
            else if (Array.isArray(v)) {
                v.forEach((v) => {
                    if (typeof v == "string") arr.push({ k: key, v: v });
                })
            }
        })
    }
    arr.sort((a, b) => {
        return a.k == b.k ? a.v == b.v ? 0 : a.v > b.v ? 1 : -1 : a.k > b.k ? 1 : -1;
    })
    let par = new URLParams();
    arr.forEach((v) => {
        par.append(v.k, v.v);
    })
    return hash(secret + par.toString());
}
function redirect_url(url) {
    return new Promise((resolve, reject) => {
        let api = GM_config.get("APIEndpoint");
        let screct = GM_config.get("APISecret");
        if (!api || !screct) {
            reject("Endpoint or screct not found.");
            return;
        }
        let data = {'t': url, 'ar': '0', 'rraj': '1', 'c': JSON.stringify(parse_cookies()), 'r': 'https://e-hentai.org/' };
        data['sign'] = genGetSign(data, screct);
        get(api, data, (c) => {
            resolve(JSON.parse(c)['location']);
        }, () => {
            reject("Error");
        })
    })
}
let base_url = undefined;
let cur_img = null;
let cur_viewer = null;
let script_text = undefined;
let api_url = undefined;
let gid = undefined;
let showkey = undefined;
let img_keys = {};
let original_url = null;
let redirected_url = null;
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
    cur_img = null;
    cur_viewer = null;
    original_url = null;
    redirected_url = null;
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
async function loadOriginalImage() {
    let url = original_url;
    if (!url) return false;
    if (GM_config.get("enableRedirectAPI")) {
        if (redirected_url) {
            url = redirected_url;
        } else {
            redirected_url = await redirect_url(url);
            url = redirected_url;
        }
    }
    cur_img.src = url;
    return true;
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
        original_url = ourl;
    }
    console.log(options);
    let viewer = new Viewer(img, options);
    let click = async () => {
        img.removeEventListener("click", click);
        if (GM_config.get("LoadOriginalWhenOpen")) {
            await loadOriginalImage();
        }
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
