// ==UserScript==
// @name         NGA优化摸鱼体验插件-移动端支持
// @namespace    https://github.com/lifegpc/userscript
// @version      1.0.1
// @author       lifegpc
// @description  支持移动端页面
// @license      MIT
// @match        *://bbs.nga.cn/*
// @match        *://ngabbs.com/*
// @match        *://nga.178.com/*
// @match        *://g.nga.cn/*
// @grant        unsafeWindow
// @run-at       document-start
// @inject-into  content
// ==/UserScript==

(function (registerPlugin) {
    'use strict';
    const MobileSupport = {
        name: 'MobileSupport',
        title: '移动端支持',
        desc: '支持移动端页面',
        settings: [{
            key: 'showPostReadingRecord',
            title: '显示帖子浏览记录标记',
            default: false
        }],
        buttons: [],
        beforeSaveSettingFunc(settings) {
            const postReadingRecord = this.mainScript.getModule('PostReadingRecord');
            if (!postReadingRecord && settings['showPostReadingRecord']) {
                return '请先安装帖子浏览记录插件';
            }
        },
        initFunc() {
            if (typeof this.pluginSettings['showPostReadingRecord'] === 'string') {
                this.pluginSettings['showPostReadingRecord'] = false;
            }
        },
        async renderThreadsFunc($el) {
            if (this.pluginSettings['showPostReadingRecord']) {
                const postReadingRecord = this.mainScript.getModule('PostReadingRecord');
                if (postReadingRecord) {
                    const markStyle = `color: ${postReadingRecord.pluginSettings['markColor']}; opacity: ${parseInt(postReadingRecord.pluginSettings['markOpacity']) / 100};`
                    const $a = $el.find('.c2 .replies');
                    const tid = this.mainScript.getModule('AuthorMark').getQueryString('tid', $a.attr('href'))
                    const currentCount = parseInt($a.text())
                    const record = await postReadingRecord.store.getItem(tid)
                    const recordCount = record?.lastReadCount || -1
                    if (record) {
                        $el.find('.c2 > a').attr('style', markStyle)
                    }
                    if (postReadingRecord.pluginSettings['replyCountEnable'] && recordCount > -1 && currentCount > recordCount) {
                        $el.find('.c2 > span[id^=t_pc]').append(`<span class="hld__new-reply-count-${postReadingRecord.pluginSettings['replyCountStyle']}">${currentCount-recordCount}</span>`)
                    }
                    postReadingRecord.currentThread[tid] = {currentCount}
                }
            }
        },
        async renderFormsFunc($el) {
            if (this.pluginSettings['showPostReadingRecord']) {
                const postReadingRecord = this.mainScript.getModule('PostReadingRecord');
                if (postReadingRecord) {
                    const tid = this.mainScript.getModule('AuthorMark').getQueryString('tid');
                    const currentLineNo = parseInt($el.find('.postinfot').text().split('#')[1]);
                    const currentLineAnchor = $el.find('.postinfot').attr('href').split('#')[1]
                    const maxReadCount = Math.max((postReadingRecord.currentThread?.[tid]?.currentCount || -1), currentLineNo)
                    const record = await postReadingRecord.store.getItem(tid)
                    if (!record || maxReadCount > record.lastReadCount) {
                        await postReadingRecord.store.setItem(tid, {
                            lastReadCount: maxReadCount,
                            lastReadLineNo: currentLineNo,
                            lastReadLineAnchor: currentLineAnchor,
                            lastReadTime: Math.ceil(new Date().getTime() / 1000)
                        })
                    }
                }
            }
        },
        style: ``
    }
    registerPlugin(MobileSupport)

})(function(plugin) {
    plugin.meta = GM_info.script
    unsafeWindow.ngaScriptPlugins = unsafeWindow.ngaScriptPlugins || []
    unsafeWindow.ngaScriptPlugins.push(plugin)
});
