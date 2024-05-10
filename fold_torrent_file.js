// ==UserScript==
// @name         支持折叠种子文件
// @namespace    https://github.com/lifegpc/userscript
// @version      0.0.1
// @description  支持折叠种子文件
// @author       lifegpc
// @match        https://dmhy.org/topics/view/*
// @match        https://share.dmhy.org/topics/view/*
// @icon         https://dmhy.org/favicon.ico
// @grant        GM_addStyle
// ==/UserScript==
GM_addStyle(`.ftf_file_list td, th { border: #00aa00 1px solid; }
.ftf_file_list {border-collapse: collapse;}`)
const parse_size = (await import("https://esm.sh/filesize-parser@1.5.0?pin=v135")).default;
/**
 * 折叠种子文件
 * @typedef {{name: string, size: number, children: TFile[], folded: true}} TFile
 * @typedef {{path: string, size: number}} OFile
 * @param {OFile[]} list
 * @returns {TFile[]}
 */
function fold(list) {
    /**@type {TFile[]} */
    const re = [];
    for (const f of list) {
        const parts = f.path.split("/");
        let cu = re;
        parts.slice(0, -1).reduce((acc, cur) => {
            acc.push(cur);
            for (const p of acc) {
                const file = cu.find((v) => v.name == p);
                if (file) {
                    file.size += f.size;
                    cu = file.children;
                } else {
                    const newFile = { name: p, size: f.size, children: [], folded: true };
                    cu.push(newFile);
                    cu.sort((a, b) => a.name.localeCompare(b.name))
                    cu = newFile.children;
                }
            }
            return acc;
        }, [])
        const file = { name: parts[parts.length - 1], size: f.size, children: [], folded: true };
        cu.push(file);
        cu.sort((a, b) => a.name.localeCompare(b.name))
    }
    return re;
}
function try_parse_dmhy_bt() {
    try {
        const files = document.querySelectorAll("div.file_list li");
        /**@type {OFile[]}*/
        const re = [];
        for (const f of files) {
            const size = parse_size(f.querySelector("span.bt_file_size").innerText);
            const path = f.querySelector("span.bt_file_size").previousSibling.textContent.trim();
            re.push({ path, size });
        }
        return re;
    } catch (e) {
        return null;
    }
}
function to_size(size) {
    const units = ["B", "KiB", "MiB", "GiB"];
    let i = 0;
    while (size >= 1024 && i < units.length) {
        size /= 1024;
        i++;
    }
    return size.toFixed(2) + units[i];
}
function render() {
    const table = document.createElement("table");
    table.classList.add("ftf_file_list");
    const tr = document.createElement("tr");
    const name = document.createElement("th");
    name.innerText = "文件名";
    name.style.textAlign = "left";
    tr.appendChild(name);
    const size = document.createElement("th");
    size.innerText = "大小";
    tr.appendChild(size);
    table.append(tr);
    function renderv(list, indent=0) {
        for (const f of list) {
            const tr = document.createElement("tr");
            const td = document.createElement("td");
            let indent_d = "";
            for (let i = 0; i < indent; i++) {
                indent_d += "&nbsp;";
            }
            if (f.children.length) {
                const a = document.createElement("a");
                a.addEventListener('click', () => {
                    f.folded = !f.folded;
                    table.replaceWith(render());
                })
                a.href = "javascript:void(0)";
                td.innerHTML = indent_d;
                a.innerText = f.name;
                td.append(a);
            } else {
                td.innerHTML = indent_d;
                td.innerText += f.name;
            }
            tr.appendChild(td);
            const td2 = document.createElement("td");
            td2.innerText = to_size(f.size);
            tr.appendChild(td2);
            table.appendChild(tr);
            if (f.children.length && !f.folded) {
                renderv(f.children, indent + 4);
            }
        }   
    }
    renderv(folded);
    return table;
}
function render_dmhy_bt() {
    const file_list = document.querySelector("div.file_list");
    if (!file_list) return;
    file_list.replaceChildren(render());
}
let files = try_parse_dmhy_bt();
let is_dmhy = false;
if (files) {
    is_dmhy = true;
}
if (!files) {
    return;
}
console.log(files);
const folded = fold(files);
console.log(folded);
if (is_dmhy) {
    render_dmhy_bt();
}
