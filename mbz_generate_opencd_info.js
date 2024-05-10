// ==UserScript==
// @name         MusicBrainZ 生成 OpenCD 信息
// @namespace    https://github.com/lifegpc/userscript
// @version      0.0.4
// @description  MusicBrainZ 生成 OpenCD 所需信息
// @author       lifegpc
// @match        https://musicbrainz.org/release/*
// @grant        GM_registerMenuCommand
// @grant        GM_setClipboard
// ==/UserScript==
const typeI18n = {
    album: '专辑',
    single: '单曲',
    soundtrack: '原声带',
}
const areaI18n = {
    japan: '日本',
}
const languageI18n = {
    japanese: '日语',
    '[multiple languages]': '[多种语言]',
}
/**@param {string} type */
function getTypeI18n(type) {
    const li = [];
    const tmp = type.split(" + ");
    for (const t of tmp) {
        const i = typeI18n[t.toLowerCase()];
        li.push(i ?? t);
    }
    return li.join(" + ")
}
function getAreaI18n(area) {
    const a = area.toLowerCase();
    const i = areaI18n[a];
    return i ?? area;
}
function getLanguageI18n(language) {
    const l = language.toLowerCase();
    const i = languageI18n[l];
    return i ?? language;
}
const BOM = new Uint8Array([0xEF, 0xBB, 0xBF]);
function replaceAll(s, pattern, replacement) {
    return s.split(pattern).join(replacement);
}
/**
 * @param {string} text
 * @param {string} filename
 */
function saveText(text, filename) {
    const data = (new TextEncoder).encode(replaceAll(text, "\n", "\r\n"));
    const blob = new Blob([BOM, data], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
}
function parseTime(time) {
    const re = time.match(/(\d+)\:(\d+)/)
    const min = parseInt(re[1]);
    const sec = parseInt(re[2]);
    return min * 60 + sec;
}
function dumpTime(time) {
    const min = Math.floor(time / 60).toString();
    const sec = (time % 60).toString();
    return `${min.padStart(2, '0')}:${sec.padStart(2, '0')}`
}
GM_registerMenuCommand("生成 Info.txt", () => {
    const title = document.querySelector("h1 bdi").innerText;
    const albumArtist = document.querySelector("p.subheader").innerText.match(/Release by (.+) (\(see all versions of this release, \d+ available\))?$/)[1];
    const albumType = document.querySelector('#sidebar dd.type').innerText;
    const publisher = document.querySelector('#sidebar a[href^="/label/"] bdi').innerText;
    const area = document.querySelector('#sidebar a[href^="/area/"] bdi').innerText;
    const releaseDate = new Date(document.querySelector('#sidebar .release-date').innerText);
    const language = document.querySelector('#sidebar dd.language').innerText;
    const discList = document.querySelectorAll(".tbl.medium");
    let trackInfo = '';
    for (const disc of discList) {
        let discInfo = '';
        let discLength = 0;
        const trackList = disc.querySelectorAll('tbody tr:not(.subh)');
        for (const track of trackList) {
            const trackNo = parseInt(track.querySelector(".pos.t").innerText);
            const trackTitle = track.querySelector(".title bdi").innerText;
            const trackArtist = track.children[2].classList.contains("rating") ? albumArtist : track.children[2].innerText;
            const trackLength = parseTime(track.querySelector(".treleases").innerText);
            discLength += trackLength;
            const tTrackLength = dumpTime(trackLength);
            const tTrackNo = trackNo.toString().padStart(2, '0')
            if (trackArtist == albumArtist) {
                discInfo += `${tTrackNo}. ${trackTitle} (${tTrackLength})\n`;
            } else {
                discInfo += `${tTrackNo}. ${trackArtist} - ${trackTitle} (${tTrackLength})\n`;
            }
        }
        if (discList.length > 1) {
            discInfo += "\n";
            const discId = disc.querySelector("thead th a").id.replace("disc", "Disc ");
            trackInfo += `${discId} ${dumpTime(discLength)}\n`;
        }
        trackInfo += discInfo;
    }
    const text = `专辑歌手：${albumArtist}
专辑名称：${title}
专辑类型：${getTypeI18n(albumType)}
发行公司：${publisher}
发行地区：${getAreaI18n(area)}
发行年份：${releaseDate.getFullYear()}
语言：${getLanguageI18n(language)}
专辑介绍：
专辑曲目：
${trackInfo}`
    saveText(text, "Info.txt")
})
GM_registerMenuCommand("复制 BBCode", () => {
    const title = document.querySelector("h1 bdi").innerText;
    const albumArtist = document.querySelector("p.subheader bdi").innerText;
    const albumFormat = document.querySelector('#sidebar dd.format').innerText;
    const albumType = document.querySelector('#sidebar dd.type').innerText;
    const area = document.querySelector('#sidebar a[href^="/area/"] bdi').innerText;
    const releaseDate = document.querySelector('#sidebar .release-date').innerText;
    const links = document.querySelectorAll("#sidebar h2.labels + ul.links > li");
    const labelIds = [];
    for (const link of links) {
        const comp = link.querySelector("a bdi").innerText;
        const num = link.querySelector(".catalog-number").innerText;
        labelIds.push(`${comp}(${num})`)
    }
    const text = `[b]Album title:[/b] ${title}
[b]Album artist:[/b] ${albumArtist}
[b]Music format:[/b] ${albumFormat}, ${albumType}
[b]Music release:[/b] ${area}-${releaseDate}
[b]Music labelIds:[/b] ${labelIds.join(", ")}

More information: ${document.location.href}`
    GM_setClipboard(text, "text")
})
