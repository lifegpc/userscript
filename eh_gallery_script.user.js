// ==UserScript==
// @name         EH Gallery Script
// @namespace    https://github.com/lifegpc/userscript
// @version      0.1.16
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
// @match        https://*.e-hentai.org/uploader/*
// @match        https://*.e-hentai.org/mytags
// @match        https://*.e-hentai.org/toplist.php?*
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
// @match        https://*.exhentai.org/uploader/*
// @match        https://*.exhentai.org/mytags
// @icon         https://e-hentai.org/favicon.ico
// @grant        GM_addStyle
// @grant        GM_getResourceText
// @grant        GM_getValue
// @grant        GM_setValue
// @grant        GM_registerMenuCommand
// @grant        GM_xmlhttpRequest
// @require      https://openuserjs.org/src/libs/sizzle/GM_config.js
// @require      https://cdn.jsdelivr.net/npm/marked
// @require      https://cdn.jsdelivr.net/npm/jquery
// @require      https://unpkg.com/@popperjs/core@2
// @require      https://unpkg.com/tippy.js@6
// @resource s   https://unpkg.com/tippy.js@6/themes/light-border.css
// @run-at       document-end
// @connect      raw.githubusercontent.com
// @connect      tva1.sinaimg.cn
// ==/UserScript==
/**
 * @template T,V
 * @param {ArrayLike<T>} arr
 * @param {(this: V | undefined, element: T, index: number, array: ArrayLike<T>) => Promise<void>} callback
 * @param {V | undefined} thisArg
 * @returns {Promise<void>}
 */
async function asyncForEach(arr, callback, thisArg = undefined) {
    for (let i = 0; i < arr.length; i++) {
        await callback.apply(thisArg, [arr[i], i, arr]);
    }
}
function replaceAll(s, pattern, replacement) {
    return s.split(pattern).join(replacement);
}
const SVG_ICON_MSG = "data:image/svg+xml,%3Csvg t='1595842925125' class='icon' viewBox='0 0 1024 1024' version='1.1' xmlns='http://www.w3.org/2000/svg' p-id='2280' width='200' height='200'%3E%3Cpath d='M89.216226 575.029277c-6.501587-7.223986-10.47478-15.892769-12.641975-26.367549-1.805996-10.47478-0.722399-20.22716 3.973192-29.257143l4.695591-10.47478c5.05679-8.307584 11.558377-13.725573 19.865961-15.892769 7.946384-2.167196 15.892769-0.361199 23.477954 5.417989L323.995767 639.322751c8.307584 5.779189 17.698765 8.668783 27.812346 8.307584 10.11358-0.361199 18.782363-3.611993 26.006349-10.11358L898.302646 208.411993c7.585185-5.779189 16.253968-8.307584 26.006349-7.585185 9.752381 0.722399 18.059965 4.334392 24.922751 10.47478l-12.641975-12.641975c6.501587 7.223986 9.752381 15.17037 9.752381 24.561552 0 9.391182-3.250794 17.337566-9.752381 24.561552L376.008466 816.310406c-7.223986 7.223986-15.17037 10.47478-24.200353 10.47478-9.029982 0-16.976367-3.250794-24.200353-9.752381L89.216226 575.029277z' p-id='2281' fill='%23ffffff'%3E%3C/path%3E%3C/svg%3E";
const GALLERY_REG = /e[-x]hentai\.org\/g\/\d+\/[^/]+/;
const IMG_REG = /e[-x]hentai\.org\/s\/[^/]+\/\d+-\d+/;
const MPV_REG = /e[-x]hentai\.org\/mpv\/\d+\/[^/]+/;
/**@type {IDBDatabase} */
let db = undefined;
let need_reinit = false;
let storage = navigator.storage || globalThis['WorkerNavigator']['storage'];
const BLACK_LIST_HOST = [
    "gss2.bdstatic.com",
    "8.blog.xuite.net",
    "s16.picimge.com",
];
const REFERER_NEED_HOST = {
    "tva1.sinaimg.cn": "https://www.weibo.com",
};
/**@type {Cache?} */
let cache = null;
async function get_cache() {
    if (cache) return cache;
    cache = await caches.open('eh_tag_img');
    return cache;
}
/**
 * @param {string} headers
 */
function parse_headers(headers) {
    const l = headers.split('\r\n');
    const re = {};
    for (const i of l) {
        if (!i) continue;
        const [k, v] = i.split(': ');
        re[k] = v;
    }
    return re;
}
async function fetch_image(url, referer) {
    let cache = await get_cache();
    let re = await cache.match(url);
    if (re) {
        return re;
    }
    let re2 = await GM_fetch(url, { headers: { referer }, responseType: 'arraybuffer' })
    const res = new Response(re2.response, { status: re2.status, statusText: re2.statusText, headers: parse_headers(re2.responseHeaders) });
    if (re2.status == 200) {
        cache.put(url, res.clone());
    }
    return res;
}
async function filter_html(html, tag) {
    let doc = (new DOMParser).parseFromString(html, "text/html");
    doc.querySelectorAll('a').forEach((a) => {
        a.target = "_blank";
        a.referrerPolicy = "no-referrer";
    });
    doc.querySelectorAll('img[src="#"]').forEach((img) => {
        let title = img.title;
        try {
            new URL(title);
            img.src = title;
            img.title = "";
        } catch (_) {
            img.remove();
        }
    })
    await asyncForEach(doc.querySelectorAll('img'), async (img) => {
        try {
            let u = new URL(img.src);
            if (REFERER_NEED_HOST[u.host]) {
                const loadRefererImages = GM_config.get("loadRefererImages");
                if (loadRefererImages == "remove") {
                    console.log(tag);
                    console.log("Remove referer needed URL: ", u.toString());
                    img.remove();
                    return;
                } else {
                    const re = await fetch_image(img.src, REFERER_NEED_HOST[u.host]);
                    if (re.status == 200) {
                        if (!img.title) img.title = img.src;
                        img.setAttribute('origin_src', img.src);
                        img.src = URL.createObjectURL(await re.blob());
                    } else {
                        console.log(tag);
                        console.error("Failed to fetch image: ", re.status, re.statusText);
                        img.remove()
                        return;
                    }
                }
            }
            if (BLACK_LIST_HOST.includes(u.host)) {
                console.log(tag);
                console.log("Remove blacklist URL: ", u.toString());
                img.remove();
                return;
            }
            img.referrerPolicy = "no-referrer";
            img.style.maxWidth = "380px";
        } catch (_) { }
    })
    return doc.body.innerHTML;
}
async function filter_html2(html, tag) {
    let doc = (new DOMParser).parseFromString(html, "text/html");
    doc.querySelectorAll('img[src="#"]').forEach((img) => {
        let title = img.title;
        try {
            new URL(title);
            img.src = title;
            img.title = "";
        } catch (_) {
            img.remove();
        }
    })
    await asyncForEach(doc.querySelectorAll('img'), async (img) => {
        try {
            let u = new URL(img.src);
            if (REFERER_NEED_HOST[u.host]) {
                const loadRefererImages = GM_config.get("loadRefererImages");
                if (loadRefererImages == "remove") {
                    console.log(tag);
                    console.log("Remove referer needed URL: ", u.toString());
                    img.remove();
                    return;
                } else {
                    const re = await fetch_image(img.src, REFERER_NEED_HOST[u.host]);
                    if (re.status == 200) {
                        if (!img.title) img.title = img.src;
                        img.setAttribute('origin_src', img.src);
                        img.src = URL.createObjectURL(await re.blob());
                    } else {
                        console.log(tag);
                        console.error("Failed to fetch image: ", re.status, re.statusText);
                        img.remove()
                        return;
                    }
                }
            }
            if (BLACK_LIST_HOST.includes(u.host)) {
                console.log(tag);
                console.log("Remove blacklist URL: ", u.toString());
                img.remove();
                return;
            }
        } catch (_) { }
        img.style.height = "12px";
        img.referrerPolicy = "no-referrer";
    })
    return doc.body.innerHTML;
}
async function make_storage_persist() {
    let persisted = await storage.persisted();
    if (!persisted) {
        persisted = await storage.persist();
    }
    return persisted;
}
function init() {
    return new Promise((resolve, reject) => {
        make_storage_persist();
        if (db !== undefined && !need_reinit) {
            resolve();
            return;
        }
        let indexedReq = indexedDB.open('eh_tags', 1);
        /**@param {IDBVersionChangeEvent} event*/
        indexedReq.onupgradeneeded = function (event) {
            let db = this.result;
            console.log(`upgrade eh_tags from ${event.oldVersion} to ${event.newVersion}`);
            /*No version or version < 1 -> v1 */
            if (isNaN(event.oldVersion) || event.oldVersion < 1) {
                db.createObjectStore('meta', { keyPath: 'key' })
                db.createObjectStore('tags', { keyPath: 'tag' });
            }
        }
        indexedReq.onsuccess = () => {
            db = indexedReq.result;
            resolve();
        }
        indexedReq.onerror = () => {
            need_reinit = true;
            reject(indexedReq.error);
        }
    })
}
/**@param {string} key*/
function get_value(key) {
    return new Promise((resolve, reject) => {
        init().then(() => {
            let tx = db.transaction(['meta'], 'readonly');
            let store = tx.objectStore('meta');
            let req = store.get(key);
            req.onsuccess = () => {
                let re = req.result;
                resolve(re ? re.value : undefined);
            }
            req.onerror = () => {
                need_reinit = true;
                reject(req.error);
            }
        }).catch(reject);
    })
}
/**@param {string} key*/
function set_value(key, value) {
    return new Promise((resolve, reject) => {
        init().then(() => {
            let tx = db.transaction(['meta'], 'readwrite');
            let store = tx.objectStore('meta');
            let req = store.put({ key, value });
            req.onsuccess = () => {
                resolve();
            }
            req.onerror = () => {
                need_reinit = true;
                reject(req.error);
            }
        }).catch(reject);
    })
}
/**
 * @typedef {{intro: string, links: string, name: string}} TagData
 * @param {string} tag
 * @param {TagData} value
*/
function set_tag(tag, value) {
    return new Promise((resolve, reject) => {
        init().then(() => {
            let tx = db.transaction(['tags'], 'readwrite');
            let store = tx.objectStore('tags');
            let req = store.put({ tag, value });
            req.onsuccess = () => {
                resolve();
            }
            req.onerror = () => {
                need_reinit = true;
                reject(req.error);
            }
        }).catch(reject);
    })
}
/**
 * @param {string} tag
 * @returns {Promise<TagData | undefined>}
*/
function get_tag(tag) {
    return new Promise((resolve, reject) => {
        init().then(() => {
            let tx = db.transaction(['tags'], 'readonly');
            let store = tx.objectStore('tags');
            let req = store.get(tag);
            req.onsuccess = () => {
                let re = req.result;
                resolve(re ? re.value : undefined);
            }
            req.onerror = () => {
                need_reinit = true;
                reject(req.error);
            }
        }).catch(reject);
    })
}
/**
 * @typedef {{method?: string, headers?: Record<string, string>, data?: string|Blob|File|FormData|URLSearchParams, redirect?: RequestRedirect, responseType: XMLHttpRequestResponseType}} FetchOptions
 * @typedef {{finalUrl: string, readyState: number, status: number, statusText: string, responseHeaders: string, response: any, responseText: string}} FetchResponse
 * @param {string|URL} url
 * @param {FetchOptions | undefined} options
 * @returns {Promise<FetchResponse>}
 */
function GM_fetch(url, options = undefined) {
    XMLHttpRequest
    return new Promise((resolve, reject) => {
        GM_xmlhttpRequest({
            url,
            method: options?.method ?? "GET",
            headers: options?.headers,
            data: options?.data,
            redirect: options?.redirect,
            responseType: options?.responseType,
            onabort: () => {
                reject("aborted.");
            },
            onerror: (err) => {
                reject(err);
            },
            onload: (re) => {
                resolve(re);
            }
        })
    })
}
async function fetch_tags() {
    const uri = "https://raw.githubusercontent.com/EhTagTranslation/DatabaseReleases/master/db.raw.json";
    const re = await GM_fetch(uri, { headers: { "Cache-Control": "no-cache" } });
    if (re.status != 200) {
        throw new Error(`Failed to fetch tags: ${re.status} ${re.statusText}`);
    }
    let data = JSON.parse(re.responseText);
    await set_value("last_updated", Date.now());
    const head = await get_value("tags_head");
    if (head?.sha == data.head.sha) {
        console.log("Same sha, skip update tags.");
        return;
    }
    await set_value("tags_head", data.head);
    for (const namespace of data.data) {
        const ns = namespace.namespace;
        for (const tag in namespace.data) {
            const value = namespace.data[tag];
            await set_tag(`${ns}:${tag}`, value);
        }
    }
}
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
        },
        enableTagTranslation: {
            type: 'checkbox',
            label: 'Enable tag translation.',
            default: true
        },
        loadRefererImages: {
            type: 'radio',
            label: 'How to load referer needed images:',
            options: ['GM_xmlhttpRequest', 'remove'],
            default: 'remove'
        }
    },
    events: {
        save: (values) => {
            handle_doc();
        }
    }
});
async function handle_doc() {
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
    await handle_tags();
}
/**@param {MsgType} level */
function err_handle(e, basic = "", level = "err") {
    console.error(e);
    let msg = "";
    if (typeof e === "string") msg = e;
    if (e instanceof Error) msg = e.message;
    popMsg(`${basic}${msg}`, level);
}
GM_registerMenuCommand("Edit Settings", () => { GM_config.open() }, "e");
GM_registerMenuCommand("Update translation data", () => {
    fetch_tags().then(() => {
        popMsg("Update translation data successful.");
    }).catch((e) => {
        err_handle(e, "Update translation data failed: ");
    })
}, "u");
GM_addStyle(`
.egs__msg{display:none;position:fixed;top:10px;left:50%;transform:translateX(-50%);color:#fff;text-align:center;z-index:99996;padding:10px 30px 10px 45px;font-size:16px;border-radius:10px;background-image:url("${SVG_ICON_MSG}");background-size:25px;background-repeat:no-repeat;background-position:15px}
.egs__msg a{color:#fff;text-decoration: underline;}
.egs__msg-ok{background:#4bcc4b}
.egs__msg-err{background:#c33}
.egs__msg-warn{background:#FF9900}
td.tc{text-wrap:nowrap}
.tippy-content p{white-space:break-spaces;color:black!important}
div[id^="tippy-"]{opacity:initial!important}
`)
GM_addStyle(GM_getResourceText("s"));
/**
 * @param {string} msg
 * @typedef {'ok'|'err'|'warn'} MsgType
 * @param {MsgType} type
 */
function popMsg(msg, type = "ok") {
    $('.egs__msg').length > 0 && $('.egs__msg').remove()
    let $msg = $(`<div class="egs__msg egs__msg-${type}">${msg}</div>`)
    $('body').append($msg)
    $msg.slideDown(200)
    setTimeout(() => { $msg.fadeOut(500) }, type == 'ok' ? 2000 : 5000)
    setTimeout(() => { $msg.remove() }, type == 'ok' ? 2500 : 5500)
}
const instances = {};
let insid = 1;
function set_instance(ins) {
    instances[insid] = ins;
    return insid++;
}
let observer = new MutationObserver(async (data) => {
    let openImageInNewTab = GM_config.get("openImageInNewTab");
    let openGalleryInNewTab = GM_config.get("openGalleryInNewTab");
    let openMPVInNewTab = GM_config.get("openMPVInNewTab");
    let enableTagTranslation = GM_config.get("enableTagTranslation");
    if (enableTagTranslation) {
        await check_update();
    }
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
        if (ele.tagName == 'TD') {
            /**@type {HTMLTableCellElement} */
            const e = ele;
            if (e.classList.contains("tc")) {
                if (enableTagTranslation) {
                    let tag = e.getAttribute('otag');
                    if (tag) continue;
                    const t = e.textContent.split(":")[0];
                    const value = await get_tag(`rows:${t}`);
                    e.setAttribute('otag', t);
                    if (value) {
                        e.textContent = `${value.name}：`;
                        let html = "";
                        if (value.intro) {
                            html += marked.parse(value.intro);
                        }
                        if (value.links) {
                            html += marked.parse(value.links);
                        }
                        if (html) {
                            e.setAttribute("tippy-id", set_instance(tippy(e, {
                                content: await filter_html(html, { t, value }),
                                allowHTML: true,
                                interactive: true,
                                theme: 'light-border',
                                placement: 'right-start',
                                maxWidth: 400,
                                delay: [500, 0]
                            })));
                        }
                    }
                } else {
                    let tag = e.getAttribute('otag');
                    if (tag) {
                        e.textContent = `${tag}:`;
                        e.removeAttribute('otag');
                        let id = e.getAttribute("tippy-id");
                        if (id) {
                            instances[id].destroy();
                            delete instances[id];
                            e.removeAttribute("tippy-id");
                        }
                    }
                }
            }
        }
        if (ele.tagName == 'DIV') {
            /**@type {HTMLDivElement} */
            const e = ele;
            const is_tag = Array.from(e.classList.entries()).findIndex((v) => v[1].startsWith("gt")) != -1;
            if (is_tag) {
                if (enableTagTranslation) {
                    let otag = e.getAttribute('otag');
                    if (otag) continue;
                    const t = e.id.startsWith("td_") ? replaceAll(e.id.split("td_")[1], '_', ' ') : e.title;
                    if (!t) continue;
                    const value = await get_tag(t);
                    e.setAttribute('otag', t);
                    if (value) {
                        const name = await filter_html2(replaceAll(marked.parse(value.name), /<\/?p>/, ''), {t, value});
                        if (e.id.startsWith("td_")) {
                            e.children[0].innerHTML = name;
                        } else {
                            e.innerHTML = name;
                            e.title = '';
                        }
                        let html = "";
                        if (value.intro) {
                            html += marked.parse(value.intro);
                        }
                        if (value.links) {
                            html += marked.parse(value.links);
                        }
                        if (html) {
                            e.setAttribute("tippy-id", set_instance(tippy(e, {
                                content: await filter_html(html, { t, value }),
                                allowHTML: true,
                                interactive: true,
                                theme: 'light-border',
                                placement: 'right-start',
                                maxWidth: 400,
                                delay: [500, 0]
                            })));
                        }
                    }
                } else {
                    let tag = e.getAttribute('otag');
                    if (tag) {
                        let otag = tag.split(":")[1];
                        if (e.id.startsWith("td_")) {
                            e.children[0].innerText = otag;
                        } else {
                            e.textContent = otag;
                            e.title = otag;
                        }
                        e.removeAttribute('otag');
                        let id = e.getAttribute("tippy-id");
                        if (id) {
                            instances[id].destroy();
                            delete instances[id];
                            e.removeAttribute("tippy-id");
                        }
                    }
                }
            } else if (e.id == "tagname_newtagcomplete-list") {
                await asyncForEach(e.children, async (e) => {
                    if (enableTagTranslation) {
                        let otag = e.getAttribute('otag');
                        if (otag) return;
                        const t = replaceAll(e.getAttribute("data-value"), "_", " ");
                        if (!t) return;
                        const value = await get_tag(t);
                        e.setAttribute('otag', e.innerHTML);
                        if (value) {
                            const name = await filter_html2(replaceAll(marked.parse(value.name), /<\/?p>/, ''), {t, value});
                            e.innerHTML = name;
                            let html = "";
                            if (value.intro) {
                                html += marked.parse(value.intro);
                            }
                            if (value.links) {
                                html += marked.parse(value.links);
                            }
                            if (html) {
                                e.setAttribute("tippy-id", set_instance(tippy(e, {
                                    content: await filter_html(html, { t, value }),
                                    allowHTML: true,
                                    interactive: true,
                                    theme: 'light-border',
                                    placement: 'right-start',
                                    maxWidth: 400,
                                    delay: [500, 0]
                                })));
                            }
                        }
                    } else {
                        let tag = e.getAttribute('otag');
                        if (tag) {
                            e.innerHTML = tag;
                            e.removeAttribute('otag');
                            let id = e.getAttribute("tippy-id");
                            if (id) {
                                instances[id].destroy();
                                delete instances[id];
                                e.removeAttribute("tippy-id");
                            }
                        }
                    }
                })
            }
        }
    }
});
let checked_update = false;
let is_checking_update = false;
async function check_tags_update() {
    let last_updated = await get_value("last_updated");
    console.log("Last updated: ", new Date(last_updated))
    if (!last_updated || Date.now() - last_updated > 1000 * 60 * 60 * 24) {
        await fetch_tags();
    }
    checked_update = true;
}
function check_update() {
    return new Promise((resolve, reject) => {
        if (checked_update || is_checking_update) {
            resolve();
            return;
        }
        is_checking_update = true;
        check_tags_update().then(resolve).catch((e) => {
            err_handle(e, "Failed to check update: ", "warn");
            resolve();
        }).finally(() => {
            is_checking_update = false;
        });
    })
}
async function handle_tags() {
    let enableTagTranslation = GM_config.get("enableTagTranslation");
    if (enableTagTranslation) {
        await check_update();
    }
    let groups = document.querySelectorAll("td.tc");
    for (let group of groups) {
        if (enableTagTranslation) {
            let tag = group.getAttribute('otag');
            if (tag) continue;
            const t = group.textContent.split(":")[0];
            const value = await get_tag(`rows:${t}`);
            group.setAttribute('otag', t);
            if (value) {
                group.textContent = `${value.name}：`;
                let html = "";
                if (value.intro) {
                    html += marked.parse(value.intro);
                }
                if (value.links) {
                    html += marked.parse(value.links);
                }
                if (html) {
                    group.setAttribute("tippy-id", set_instance(tippy(group, {
                        content: await filter_html(html, { t, value }),
                        allowHTML: true,
                        interactive: true,
                        theme: 'light-border',
                        placement: 'right-start',
                        maxWidth: 400,
                        delay: [500, 0]
                    })));
                }
            }
        } else {
            let tag = group.getAttribute('otag');
            if (tag) {
                group.textContent = `${tag}:`;
                group.removeAttribute('otag');
                let id = group.getAttribute("tippy-id");
                if (id) {
                    instances[id].destroy();
                    delete instances[id];
                    group.removeAttribute("tippy-id");
                }
            }
        }
    }
    let tags = document.querySelectorAll("div[class^=gt]");
    for (const i of tags) {
        if (enableTagTranslation) {
            let otag = i.getAttribute('otag');
            if (otag) continue;
            const t = i.id.startsWith("td_") ? replaceAll(i.id.split("td_")[1], '_', ' ') : i.title;
            if (!t) continue;
            const value = await get_tag(t);
            i.setAttribute('otag', t);
            if (value) {
                const name = await filter_html2(replaceAll(marked.parse(value.name), /<\/?p>/, ''), {t, value});
                if (i.id.startsWith("td_")) {
                    i.children[0].innerHTML = name;
                } else {
                    i.innerHTML = name;
                    i.title = '';
                }
                let html = "";
                if (value.intro) {
                    html += marked.parse(value.intro);
                }
                if (value.links) {
                    html += marked.parse(value.links);
                }
                if (html) {
                    i.setAttribute("tippy-id", set_instance(tippy(i, {
                        content: await filter_html(html, { t, value }),
                        allowHTML: true,
                        interactive: true,
                        theme: 'light-border',
                        placement: 'right-start',
                        maxWidth: 400,
                        delay: [500, 0]
                    })));
                }
            }
        } else {
            let tag = i.getAttribute('otag');
            if (tag) {
                let otag = tag.split(":")[1];
                if (i.id.startsWith("td_")) {
                    i.children[0].innerText = otag;
                } else {
                    i.textContent = otag;
                    i.title = otag;
                }
                i.removeAttribute('otag');
                let id = i.getAttribute("tippy-id");
                if (id) {
                    instances[id].destroy();
                    delete instances[id];
                    i.removeAttribute("tippy-id");
                }
            }
        }
    }
}
window.addEventListener('DOMContentLoaded', async () => {
    await handle_doc();
    observer.observe(document.body, { childList: true, subtree: true,  });
})
