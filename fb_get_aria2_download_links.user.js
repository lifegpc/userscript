// ==UserScript==
// @name         filebrowser 获取aria2下载命令行
// @namespace    https://github.com/lifegpc/userscript
// @version      0.0.2
// @description  filebrowser 获取aria2下载命令行
// @author       lifegpc
// @match        https://lfiles.lifegpc.com/*
// @match        https://ptf.lifegpc.com/*
// @grant        GM_getValue
// @grant        GM_setValue
// @grant        GM_registerMenuCommand
// @grant        GM_setClipboard
// @require      https://openuserjs.org/src/libs/sizzle/GM_config.js
// ==/UserScript==
await GM_config.init({
    id: 'fb',
    fields: {
        cli: {
            label: 'aria2 命令行',
            type: 'text',
            default: ''
        },
        aria2: {
            label: '调用aria2的位置',
            type: 'text',
            default: 'aria2c'
        }
    }
})
function parse_cookies() {
    let cookies = document.cookie.split(';').map(c => c.trim().split('=')).reduce((acc, [k, v]) => {
        acc[k] = v;
        return acc;
    }, {});
    return cookies;
}
/**
 * @param {boolean?} selected
 */
function get_links(selected=null) {
    let selector = selected === true ? '#listing .item:not(.header, [data-dir="true"])[aria-selected="true"]' : selected === false ? '#listing .item:not(.header, [data-dir="true"], [aria-selected="true"])' : '#listing .item:not(.header, [data-dir="true"])';
    let eles = document.querySelectorAll(selector);
    let cookies = parse_cookies();
    let base = new URL(document.location.href.replace('/files/', '/api/raw/'));
    let links = Array.from(eles).map(ele => {
        let path = ele.getAttribute("aria-label");
        let search = new URLSearchParams();
        search.set("auth", cookies['auth']);
        let url = new URL(`${encodeURIComponent(path)}?${search}`, base);
        return url;
    });
    let z = links.length > 1 ? "-Z " : "";
    let data = GM_config.get("aria2") + " " + z + links.map(url => `"${url}"`).join(" ") + " " + GM_config.get("cli");
    GM.setClipboard(data, "text").then(() => {
        alert("已复制到剪贴板");
    }).catch((err) => {
        console.error(err);
        console.log(data);
        alert("复制到剪贴板失败，已将命令行打印到控制台");
    });
}
GM_registerMenuCommand("获取所有文件下载命令行", () => { get_links() }, "a");
GM_registerMenuCommand("获取选中文件下载命令行", () => { get_links(true) }, "s");
GM_registerMenuCommand("获取未选中文件下载命令行", () => { get_links(false) }, "d");
GM_registerMenuCommand("编辑设置", () => { GM_config.open() }, "e");
