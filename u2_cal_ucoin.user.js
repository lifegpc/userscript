// ==UserScript==
// @name         计算 UCoin 获取量
// @namespace    https://github.com/lifegpc/userscript
// @version      0.0.1
// @description  仅支持计算 体积(B)、数量(D)
// @author       lifegpc
// @match        https://u2.dmhy.org/userdetails.php?*
// ==/UserScript==
const ONE_CAT = [15, 16, 30];
const b = 14.5;
const S0 = 35.082;
const d = 0.3;
let parse_size = (await import("https://esm.sh/filesize-parser@1.5.0?pin=v135")).default;
let handled = false;
let observer = new MutationObserver((records) => {
    if (handled) return;
    for (let i of records) {
        let e = i.target;
        console.log(e);
        if (e.id == 'ka1') {
            handled = true;
            let bsum = 0;
            let warn = 0;
            let br = e.querySelector("br");
            let rows = e.querySelectorAll('table:not([class~="torrentname"]) > tbody > tr:not(:first-child)');
            for (let row of rows) {
                let cells = row.children;
                let size = parse_size(cells[2].innerText);
                const B = b * size / 1_000_000_000 / S0;
                const cat = parseInt(new URL(cells[0].querySelector('a').href).searchParams.get("cat"));
                let Pmin = ONE_CAT.includes(cat) ? 1 : 0.5;
                const ov = cells[1].querySelector("td.overflow-control");
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
                        up = parseFloat(ov.querySelector('img[class="arrowup"]').nextElementSibling.innerText);
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
            let dsum = rows.length * d;
            let sum = bsum + dsum;
            let result = `共计 ${sum.toFixed(3)}/h：体积 ${bsum.toFixed(3)}/h，数量 ${dsum.toFixed(1)}/h`;
            if (warn > 0) {
                result += `（警告：${warn} 个种子计算可能不准确）`;
            }
            let span = document.createElement("span");
            span.innerText = result;
            let nbr = document.createElement('br');
            e.insertBefore(nbr, br);
            e.insertBefore(span, br);
        }
    }
})
observer.observe(document.body, { childList: true, subtree: true });
