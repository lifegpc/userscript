// ==UserScript==
// @name         天使动漫打工
// @namespace    https://github.com/lifegpc/userscript
// @version      0.0.1
// @description  天使动漫打工替换广告链接
// @author       lifegpc
// @match        https://tsdm39.com/plugin.php?id=np_cliworkdz:work
// ==/UserScript==
function auto_work() {
    const datas = document.querySelectorAll(".npadv > a");
    if (datas.length !== 6) {
        setTimeout(auto_work, 1000);
    } else {
        for (const d of datas) {
            d.href = "about:blank";
        }
    }
}
auto_work()
