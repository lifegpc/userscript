// ==UserScript==
// @name         NGA优化摸鱼体验插件-移动端支持
// @namespace    https://github.com/lifegpc/userscript/tree/master/NGA_BBS_plugins/MobileSupport
// @version      1.0.5
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
        },
        {
            key: 'authorMark',
            title: '标记楼主',
            default: true
        },
        {
            key: "showRemark",
            title: "显示标签",
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
            if (typeof this.pluginSettings['authorMark'] === 'string') {
                this.pluginSettings['authorMark'] = true;
            }
            if (typeof this.pluginSettings['showRemark'] === 'string') {
                this.pluginSettings['showRemark'] = false;
            }
        },
        currentThread: {},
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
                        $el.find('.c2 > span[id^=t_pc]').append(`<span class="hld__new-reply-count-${postReadingRecord.pluginSettings['replyCountStyle']}">${currentCount - recordCount}</span>`)
                    }
                    this.currentThread[tid] = { currentCount }
                }
            }
        },
        async renderFormsFunc($el) {
            let e = $el.find(".c1");
            let es = window.getComputedStyle(e[0], null);
            if (es.display !== 'none') return;
            if (this.pluginSettings['showPostReadingRecord']) {
                const postReadingRecord = this.mainScript.getModule('PostReadingRecord');
                if (postReadingRecord) {
                    const tid = this.mainScript.getModule('AuthorMark').getQueryString('tid');
                    const currentLineNo = parseInt($el.find('.postinfot.postoptswb').text().split('#')[1]);
                    const currentLineAnchor = $el.find('.postinfot.postoptswb').attr('href').split('#')[1]
                    const maxReadCount = Math.max((this.currentThread?.[tid]?.currentCount || -1), currentLineNo)
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
            if (this.pluginSettings['authorMark']) {
                const $ = this.mainScript.libs.$;
                const authorMark = this.mainScript.getModule('AuthorMark');
                if (authorMark) {
                    const author = $('#postauthor0.userlink').text().replace('楼主', '');
                    const tid = authorMark.getQueryString('tid')
                    const authorStr = `${tid}:${author}`
                    if (author && !authorMark.postAuthor.includes(authorStr) && !window.location.href.includes('authorid')) {
                        authorMark.postAuthor.unshift(authorStr) > 10 && authorMark.postAuthor.pop()
                        this.mainScript.setValue('hld__NGA_post_author', authorMark.postAuthor.join(','))
                    }
                    $el.find('a.b').each(function () {
                        const name = $(this).attr('hld-mark-before-name') || $(this).text().replace('[', '').replace(']', '')
                        if (name && authorMark.postAuthor.includes(`${tid}:${name}`)) {
                            $(this).append('<span class="hld__post-author">楼主</span>')
                        }
                    })
                }
            }
            if (this.pluginSettings['showRemark']) {
                const $ = this.mainScript.libs.$;
                const markAndBan = this.mainScript.getModule('MarkAndBan');
                if (markAndBan) {
                    $el.find('a.b').each(function () {
                        const name = $(this).attr('hld-mark-before-name') || $(this).text().replace('[', '').replace(']', '')
                        const uid = ($(this).attr('href') && $(this).attr('href').indexOf('uid=') > -1) ? $(this).attr('href').split('uid=')[1] + '' : ''
                        console.log(uid, name);
                        const marks = markAndBan.getUserMarks({ name, uid })
                        if (marks) {
                            let marksDom = ''
                            marks.marks.forEach(item => marksDom += `<span ${item.desc ? 'class="hld__help" help="' + item.desc + '"' : 'class="hld__post-author"'} style="color: ${item.text_color};background-color: ${item.bg_color};">${item.mark}</span>`);
                            $(this).after(marksDom);
                        }
                    })
                }
            }
        },
        style: ``
    }
    registerPlugin(MobileSupport)

})(function (plugin) {
    plugin.meta = GM_info.script
    unsafeWindow.ngaScriptPlugins = unsafeWindow.ngaScriptPlugins || []
    unsafeWindow.ngaScriptPlugins.push(plugin)
});
