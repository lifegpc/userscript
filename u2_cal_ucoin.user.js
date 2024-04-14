// ==UserScript==
// @name         计算 UCoin 获取量
// @namespace    https://github.com/lifegpc/userscript
// @version      0.0.6
// @description  仅支持计算 体积(B)、数量(D)
// @author       lifegpc
// @match        https://u2.dmhy.org/userdetails.php?*
// @match        https://u2.dmhy.org/mpseed.php?*
// @icon         https://u2.dmhy.org/favicon.ico
// ==/UserScript==
const u = new URL(document.location.href);
const S0_KEY = "__lifegpc_u2_cal_ucoin_S0";
const LAST_UPDATED_KEY = "__lifegpc_u2_cal_ucoin_last_updated";
if (u.pathname == "/userdetails.php") {(async function(){
const ONE_CAT = [15, 16, 30];
const b = 14.5;
const S0 = 35.041;
const d = 0.3;
const MAX_CACHE_TIME = 1000 * 60 * 60 * 24;
let parse_size = (await import("https://esm.sh/filesize-parser@1.5.0?pin=v135")).default;
let handled = false;
let default_is_used = false;
function get_S0() {
    default_is_used = false;
    const cache = localStorage.getItem(S0_KEY);
    if (!cache) {
        default_is_used = true;
        return S0;
    }
    const re = parseFloat(cache);
    if (isNaN(re)) {
        default_is_used = true;
        return S0;
    }
    return re;
}
function get_last_updated() {
    const cache = localStorage.getItem(LAST_UPDATED_KEY);
    if (!cache) return 0;
    return parseInt(cache);
}
let observer = new MutationObserver((records) => {
    if (handled) return;
    for (let i of records) {
        let e = i.target;
        console.log(e);
        if (e.id == 'ka1') {
            handled = true;
            const S0n = get_S0();
            let bsum = 0;
            let warn = 0;
            let br = e.querySelector("br");
            let rows = e.querySelectorAll('table:not([class~="torrentname"]) > tbody > tr:not(:first-child)');
            const ids = new Set();
            for (let row of rows) {
                let cells = row.children;
                let size = parse_size(cells[2].innerText);
                const B = b * size / 1_000_000_000 / S0n;
                const cat = parseInt(new URL(cells[0].querySelector('a').href).searchParams.get("cat"));
                let Pmin = ONE_CAT.includes(cat) ? 1 : 0.5;
                const ov = cells[1].querySelector("td.overflow-control");
                const id = (new URL(cells[1].querySelector("td > a").href)).searchParams.get("id");
                if (id) {
                    ids.add(id);
                }
                const ft = ov.childNodes[1];
                let up = 1;
                let down = 1;
                if (ft.nodeType == ft.ELEMENT_NODE && ft.tagName == "IMG") {
                    switch (ft.className) {
                    case "pro_2up":
                        up = 2;
                        break;
                    case "pro_free2up":
                        up = 2;
                        down = 0;
                        break;
                    case "pro_50pctdown":
                        down = 0.5;
                        break;
                    case "pro_30pctdown":
                        down = 0.7;
                        break;
                    case "pro_50pctdown2up":
                        up = 2;
                        down = 0.5;
                        break;
                    case "pro_free":
                        down = 0;
                        break;
                    case "pro_custom":
                        if (ov.querySelector('img[class="arrowup"]'))
                            up = parseFloat(ov.querySelector('img[class="arrowup"]').nextElementSibling.innerText);
                        if (ov.querySelector('img[class="arrowdown"]'))
                            down = parseFloat(ov.querySelector('img[class="arrowdown"]').nextElementSibling.innerText);
                        break;
                    default:
                        console.warn("Unknown class:", ft.className);
                        warn += 1;
                    }
                }
                const P = Math.max(Pmin, Math.max(2 - up, 0) * Math.min(down, 1));
                bsum += P * B;
            }
            let dsum = ids.size * d;
            let sum = bsum + dsum;
            let result = `共计 ${sum.toFixed(3)}/h (${(sum * 24).toFixed(3)}/d)：体积 ${bsum.toFixed(3)}/h (${(bsum * 24).toFixed(3)}/d)，数量 ${dsum.toFixed(1)}/h (${(dsum * 24).toFixed(1)}/d)`;
            if (warn > 0) {
                result += `（警告：${warn} 个种子计算可能不准确）`;
            }
            let span = document.createElement("span");
            span.innerText = result;
            let nbr = document.createElement('br');
            e.insertBefore(nbr, br);
            e.insertBefore(span, br);
            const id = u.searchParams.get("id");
            const all_warn = `，做种计算可能不准确，访问<a href="/mpseed.php?id=${id}">这里</a>获取新的S<sub>0</sub>值`;
            const last_updated = get_last_updated();
            if (default_is_used) {
                let span2 = document.createElement("span");
                span2.innerHTML = "默认的S<sub>0</sub>被使用了" + all_warn;
                e.insertBefore(document.createElement('br'), br);
                e.insertBefore(span2, br);
            } else if (Date.now() - last_updated > MAX_CACHE_TIME) {
                let span2 = document.createElement("span");
                span2.innerHTML = `S<sub>0</sub>值上次更新于${(new Date(last_updated)).toLocaleString()}，${all_warn}`;
                e.insertBefore(document.createElement('br'), br);
                e.insertBefore(span2, br);
            }
        }
    }
})
observer.observe(document.body, { childList: true, subtree: true });
})();}
else if (u.pathname == "/mpseed.php") {
    const S0 = parseFloat(document.querySelector(".mainouter tr:nth-child(2) ul > li:nth-child(2)").innerText.match(/(?<=S0\=)[0-9.]+/)[0]);
    localStorage.setItem(S0_KEY, S0);
    localStorage.setItem(LAST_UPDATED_KEY, Date.now());
}
