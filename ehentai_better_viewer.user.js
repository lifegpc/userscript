// ==UserScript==
// @name         E-Hentai better viewer
// @namespace    https://github.com/lifegpc/userscript
// @version      0.1
// @description  Add a viewer to view original picture on website. Also support cache pictures to reduce Image Limit cost.
// @author       lifegpc
// @match        https://*.e-hentai.org/s/*/*
// @icon         https://e-hentai.org/favicon.ico
// @grant        GM_getResourceText
// @grant        GM_addElement
// @grant        GM_addStyle
// @grant        GM_xmlhttpRequest
// @require      https://github.com/lifegpc/viewerjs/raw/main/dist/viewer.min.js
// @resource     viewercss https://github.com/lifegpc/viewerjs/raw/main/dist/viewer.min.css
// @run-at       document-start
// @connect      hath.network
// @connect      e-hentai.org
// ==/UserScript==
GM_addStyle(GM_getResourceText("viewercss"));
GM_addElement('script', { textContent: GM_getResourceText('viewer') });
async function fetchData(url) {
    return new Promise((resolve, reject) => {
        GM_xmlhttpRequest({method: 'GET', url, cookie: document.cookie, responseType: 'blob', onabort: reject, onerror: reject, onload: /**@param {{responseHeaders: string}} res*/(res) => {
            console.log(res);
            let headers = new Headers();
            res.responseHeaders.split("\r\n").forEach((v) => {
                v = v.trim();
                if (!v.length) return;
                let s = v.split(":");
                headers.append(s[0], s.slice(1).join(":"));
            });
            resolve(new Response(res.response, {status: res.status, statusText: res.statusText, headers}));
        }})
    })
}
window.addEventListener("DOMContentLoaded", () => {
    let img = document.getElementById("img");
    let parent = img.parentElement;
    parent.replaceWith(img);
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
        let getData = async () => {
            let url = new URL(ourl);
            url.searchParams.delete("key");
            let curl = url.toString();
            let cache = await caches.open("original-image");
            let res = await cache.match(curl);
            if (res === undefined) {
                res = await fetchData(ourl, {mode: "no-cors", redirect: "follow"});
                console.log(res.status, res.statusText);
                if (!res.ok) throw new TypeError("Bad response status");
                await cache.put(curl, res);
                console.log("Added to cache:", curl);
                res = await cache.match(curl);
            } else console.log("Cache hited:", curl);
            return res;
        }
        options.url = async () => {
            let res = await getData();
            return URL.createObjectURL(await res.blob());
        }
        original.href = 'javascript:void(0)';
        let clickE = async () => {
            let res = await getData();
            original.href = URL.createObjectURL(await res.blob());
            function get_download_name() {
                if (res && res.headers.has("content-disposition")) {
                    let v = res.headers.get("content-disposition");
                    let s = v.split("filename=");
                    if (s.length > 1) return s[1].trim();
                }
                return '';
            }
            original.download = get_download_name();
            original.removeEventListener("click", clickE);
            original.click();
        };
        original.addEventListener('click', clickE);
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
})
