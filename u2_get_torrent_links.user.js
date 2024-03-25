// ==UserScript==
// @name         批量获取 U2 种子链接
// @namespace    https://github.com/lifegpc/userscript
// @version      0.0.1
// @description  批量获取 U2 种子链接
// @author       lifegpc
// @match        https://u2.dmhy.org/details.php*
// @match        https://u2.dmhy.org/torrents.php*
// @grant        GM_getValue
// @grant        GM_setValue
// @grant        GM_registerMenuCommand
// @grant        GM_setClipboard
// @require      https://openuserjs.org/src/libs/sizzle/GM_config.js
// ==/UserScript==
await GM_config.init({
    id: 'u2',
    title: 'U2 种子链接设置',
    fields: {
        'passkey': {
            label: 'Passkey (会自动从种子详情页面获取)',
            type: 'text',
            default: ''
        },
        'exclude_seed': {
            label: '排除正在做种种子',
            type: 'checkbox',
            default: true
        },
        'exclude_complete': {
            label: '排除已完成种子',
            type: 'checkbox',
            default: true
        },
        'exclude_download': {
            label: '排除已下载种子',
            type: 'checkbox',
            default: true
        }
    }
})
let url = new URL(document.location.href);
GM_registerMenuCommand("编辑设置", () => { GM_config.open() }, "e");
if (url.pathname == "/details.php") {
    let durl = new URL(document.querySelector('a[href^="download.php"][href$="https=1"]').href);
    GM_config.set("passkey", durl.searchParams.get("passkey"));
    GM_config.save();
} else if (url.pathname == "/torrents.php") {
    GM_registerMenuCommand("获取链接", () => {
        let ids = new Set(Array.from(document.querySelectorAll('a[href^="details.php?id="]')).map(a => parseInt(new URL(a.href).searchParams.get("id"))));
        let exclude_seed = GM_config.get("exclude_seed");
        let exclude_complete = GM_config.get("exclude_complete");
        let exclude_download = GM_config.get("exclude_download");
        if (exclude_seed) {
            let seeds = Array.from(document.querySelectorAll("td.seedhlc_current a")).map(a => parseInt(new URL(a.href).searchParams.get("id")));
            for (const seed of seeds) {
                ids.delete(seed);
            }
        }
        if (exclude_complete) {
            let completed = Array.from(document.querySelectorAll("td.snatched_current a")).map(a => parseInt(new URL(a.href).searchParams.get("id")));
            for (const complete of completed) {
                ids.delete(complete);
            }
        }
        if (exclude_download) {
            let downloads = Array.from(document.querySelectorAll("td.leechhlc_current a")).map(a => parseInt(new URL(a.href).searchParams.get("id")));
            for (const download of downloads) {
                ids.delete(download);
            }
        }
        console.log(ids)
        let links = Array.from(ids).map(id => `https://u2.dmhy.org/download.php?id=${id}&passkey=${GM_config.get("passkey")}&https=1`);
        GM.setClipboard(links.join("\n"), "text").then(() => {
            alert("已复制到剪贴板");
        }).catch((err) => {
            console.error(err);
            console.log(links.join("\n"));
            alert("复制到剪贴板失败，已将链接打印到控制台");
        });
    }, "g");
}
