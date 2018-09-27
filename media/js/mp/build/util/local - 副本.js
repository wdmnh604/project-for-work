//与终端本地js调用相关的都放在这里
var Local = {};
//控制页面不重复监听加入书架事件
var isListenshelf = false;
//注册分享事件
Local.shareEventListen = function (title, intro, img, url) {
    document.addEventListener('ondataavailable', function (shareevent) {
        Local.syncShareInfo(title, intro, img, url);
    }, false);
    var shareevent = document.createEvent('HTMLEvents');
    shareevent.initEvent("ondataavailable", true, true);
    document.dispatchEvent(shareevent);
};
//注册一件加入书架事件
Local.addToShelfBooks = function (bids, needtoast) {
//    var bookinfo;

    //注册事件
//    if (!isListenshelf) {
//        document.addEventListener('addtoshelf', function (addshelfevent) {
//            Local.addToShelf(bookinfo);
//        }, false);
//        isListenshelf = true;
//    }
//    var addshelfevent = document.createEvent('HTMLEvents');
//    addshelfevent.initEvent('addtoshelf', true, true);

    while (bids.indexOf("\r\n") > 0) {
        bids = bids.replace("\r\n", "");
    }
    var booksinfo = obj(bids);
    for (var i = 0; i < booksinfo.length; i++) {
        var bookinfo = booksinfo[i];
        if (i == booksinfo.length - 1)
            Local.addToShelf(bookinfo,1);
        else
            Local.addToShelf(bookinfo,0);
    }
};

Local.reqaObj = function (url, callback, callbackSections, errcallback) {//common页面需要分享，所以请求都走ajax方式
    Local.dodefaultLoading(callbackSections); //加载提示
    url += url.indexOf('?') != -1 ? '&' : '?';
    url = url + getTransparentParam();
    //var reqfun = url.indexOf('version') != -1 && url.indexOf('loginType') != -1;
    //if (reqfun || param("tf") && param("tf") == 1) {//PC端请求走ajax请求’,校验请求参数，支持版本兼容
    reqa(url, function (txt) {
        if (nl(txt)) {
            callback(null);
        } else {
            var t = typeof txt;
            var tmp;
            if (t == 'string') {
                txt = txt.replace(/(\0|\b|\n|\f|\r|\t|\v)/g, "").toString();
                tmp = obj(txt);
            } else {
                tmp = txt;
            }
            callback(tmp);
        }
    }, errcallback);
    //}
    //else {
    //    //  调用客户端请求:url：协议地址 ；
    //    Local.reqClient(url, function (code, str) {
    //        if (code == 200) {//请求正常返回
    //            var s = decodeURIComponent(str);
    //            callback(JSON.parse(s));
    //        } else {//请求错误或者请求超时
    //            errcallback();
    //        }
    //    });
    //}
};

/**
 * 增加默认的加载提示
 * @param callbackSections
 */
Local.dodefaultLoading = function (callbackSections) {
	//统一做loading的样式处理
    if (callbackSections && callbackSections.length && callbackSections.length > 0) {
        for (var section in callbackSections) {
            ih(callbackSections[section], '<div class="loadingTop"><span class="loadtc"><span class="loads"><svg width="24" height="23" viewBox="0 0 48 46" xmlns="http://www.w3.org/2000/svg"><path d="M47.43 24C47.43 11.06 36.94.57 24 .57S.57 11.06.57 24c0 9.27 5.434 17.55 13.72 21.328 1.006.458 2.192.015 2.65-.99.46-1.005.015-2.192-.99-2.65C9.076 38.555 4.57 31.688 4.57 24c0-10.73 8.7-19.43 19.43-19.43S43.43 13.27 43.43 24c0 7.66-4.473 14.505-11.307 17.655-1.004.462-1.442 1.65-.98 2.653.463 1.004 1.65 1.442 2.654.98C42.037 41.49 47.43 33.234 47.43 24z" class="cls-default" /></svg></span>正在加载...</span></div>');
        }
    }
};

Local.postaObj = function (url, formvalue, callback) {
    // 需要添加必要的参数
    url += url.indexOf('?') != -1 ? '&' : '?';
    url = url + getTransparentParam();
    // pc上浏览测试
    posta(url, formvalue, function (txt) {
        if (nl(txt)) {
            callback(null);
        } else {
            var tmp = obj(txt);
            callback(tmp);
        }
    });
};

Local.showToast = function (msg) {
    C.callCocoa({
        "method": "toastMsg",
        "msg": msg
    });
};

Local.cancelProgress = function () {
};

Local.showProgress = function (msg) {
};

/**
 * a：仅微信登录页面；b：仅QQ登录页面；c：微信+qq登录页面；d：微信+qq+游客登录的页面；
 * 默认：qq和微信登录
 * @param reload_url
 * @param type
 */
Local.login = function (reload_url, type) {
    if (!reload_url)
        reload_url = window.location.href;
    C.callCocoa({
        "method": "login",
        "reload_url": reload_url,
        "type": type
    });
};
Local.invokeBookDetailPageNativeModule = function (data) {
    var pageinfo = {};
    pageinfo.url = data.url;
    var bookinfo = Local.makeBookInfo(data);
    _BOOKINFO = bookinfo;
    try {
        C.callCocoa(combineObj({
            "method": "bookinfo"
        }, bookinfo));
    } catch (e) {
    }
};


Local.makeBookInfo = function (data) {
    var bookinfo = {};
    var book = data.book;
    var bookfrom = Local.wrapBookFrom(book.from);
    bookinfo.id = (book.id || book.bid) + "";// bid使用String类型
    bookinfo.title = book.title;
    bookinfo.author = book.author;
    bookinfo.downloadURL = data.downloadurl;
    bookinfo.coverURL = book.cover;
    bookinfo.version = book.lastChapter;
    bookinfo.chapterId = -1;
    bookinfo.chapterTitle = "";
    bookinfo.drm = book.drm;
    bookinfo.finished = book.finished;
    bookinfo.bookfrom = bookfrom;
    bookinfo.fileFormat = data.format;
    bookinfo.payed = data.payed;
    bookinfo.lastcname = book.lastChapterName;
    bookinfo.lastuploadtime = book.lastChapterUploadTime;
    bookinfo.origin = nl(param("origin")) ? 0 : param("origin");
    bookinfo.downloadtype = data.downloadtype;
    bookinfo.bookprice = book.price;// 原价
    bookinfo.discount = data.discount;// 打折
    bookinfo.dismsg = data.discountdesc;// 打折说明
    bookinfo.applePid = param("client") == 3 ? book.appleIpadPid
        : book.appleIphonePid;
    bookinfo.publishOnIos = "1";
    bookinfo.dlfile = !nl(book.dlfile) ? book.dlfile : "";
    if (!nl(book.intro))
        bookinfo.intro = book.intro.replace(new RegExp('(["\"])', 'g'), "\\\"");
    else
        bookinfo.intro = "";
    return bookinfo;
};

Local.wrapBookFrom = function (bookfrom) {
    if (nl(bookfrom) || bookfrom == 0) {
        return "QQ阅读";
    } else if (bookfrom == 1) {
        return "云起书院";
    } else if (bookfrom == 2) {
        return "创世中文网";
    } else if (bookfrom == 3) {
        return "华夏";
    } else {
        return "QQ阅读";
    }
};

Local.openDetail = function (url) {
    url += url.indexOf('?') != -1 ? '&' : '?';
    url = url + getTransparentParam();
    C.callCocoa({
        "method": "open_detail",
        "url": url
    });
};

Local.nativeDetail = function (bid, origin, lm_f, frombid, data_type, alg) {
    lm_f = lm_f || "";
    frombid = frombid || "";
    data_type = data_type || "";
    alg = alg || "";
    C.callCocoa({
        "method": "native_detail",
        "bid": bid,
        "origin": "" + origin,
        "alg": "" + alg,
        "data_type": "" + data_type,
        "frombid": frombid,
        "lm_f": "" + lm_f
    });

};
//向客户端同步分享信息
Local.syncShareInfo = function (title, intro, img, url) {
    title = title || "专题分享";
    intro = intro || "专题分享";
    img = img || (host() + "img/logoicon.jpg");
    url = url || (host() + "/topicV2.html?tf=1&share=1&tid=" + param('tid'));
    C.callCocoa({
        "method": "web_share",
        "title": title,
        "intro": intro,
        "img": img,
        "url": url
    });
};
//唤起客户端分享控件
Local.shareControl = function () {
    C.callCocoa({
        "method": "sharecontrol"
    })
};
//加入书架
Local.addToShelf = function (bookinfo, needtoast) {
    if(needtoast == undefined)
        needtoast = 1;
    C.callCocoa({
        "method": "addToShelf",
        "id": bookinfo.bid,
        "title": bookinfo.title,
        "intro": bookinfo.intro,
        "author": bookinfo.author,
        "origin": bookinfo.origin || "",
        "finished": bookinfo.finished,
        "downloadURL": bookinfo.downloadURL || "",
        "fileFormat": bookinfo.fileFormat || "",
        "version": bookinfo.version || "",
        "chapterTitle": bookinfo.chapterTitle || "第一章",
        "updatetime": bookinfo.updatetime || 0,
        "type": bookinfo.type || 0,
        "isPreview": bookinfo.isPreview || 0,
        "downloadinfo": Local.getdownload(bookinfo.downloadinfo),
        "needtoast": needtoast
    });
};

Local.getdownload = function (downloadinfo) {
    for (var key in downloadinfo) {
        if (downloadinfo[key]) {
            return downloadinfo[key];
        }
    }
};


Local.goBookDetail = function (bid, origin) {
    var url = "book_share.html?bid=" + bid;
    Local.openPage(url, origin);
};

//客户端内页面跳转
//客户端去除了uri编码，务必保证url中编码的合法性
Local.openInside = function (url) {
    url += url.indexOf('?') != -1 ? '&' : '?';
    url = url + getTransparentParam();
    C.callCocoa({
        "method": "open_inside",
        "url": url
    });
};

Local.readOnline = function (bookinfo, chapterId, chapterTitle) {
    _BOOKINFO = bookinfo ? bookinfo : _BOOKINFO;
    if (_BOOKINFO) {
        chapterId = chapterId || -1;
        chapterTitle = chapterTitle || "";
        C.callCocoa({
            "method": "readonline",
            "id": "" + _BOOKINFO.id,
            "title": _BOOKINFO.title,
            "author": _BOOKINFO.author,
            "downloadURL": _BOOKINFO.downloadURL,
            "coverURL": _BOOKINFO.coverURL,
            "version": "" + _BOOKINFO.version,
            "chapterId": chapterId,
            "chapterTitle": chapterTitle,
            "drm": "" + _BOOKINFO.drm,
            "finished": _BOOKINFO.finished,
            "fileFormat": "" + _BOOKINFO.fileFormat,
            "publishOnIos": "1",
            "applePid": "" + _BOOKINFO.applePid,
            "downloadinfo":""+_BOOKINFO.dlfile
        });
    }
};

Local.nativeRead = function (bookinfo) {
    if (bookinfo) {
        chapterId = chapterId || -1;
        chapterTitle = chapterTitle || "";
        C.callCocoa({
            "method": "readonline",
            "id": "" + bookinfo.id,
            "title": bookinfo.title,
            "author": bookinfo.author,
            "downloadURL": bookinfo.downloadURL,
            "coverURL": bookinfo.coverURL,
            "version": "" + bookinfo.version,
            "chapterId": chapterId,
            "chapterTitle": chapterTitle,
            "drm": "" + bookinfo.drm,
            "finished": bookinfo.finished,
            "fileFormat": "" + bookinfo.fileFormat,
            "publishOnIos": "1",
            "applePid": "" + bookinfo.applePid
        });
    }
};


/**
 * android app唤起逻辑
 *
 * @param schema
 * @param url
 * @param e
 */
Local.goAppReader = function (schema, url, e) {
    var rUrl = "qqreader://" + schema + "/" + url;
    // 通过iframe的方式试图打开APP，如果能正常打开，会直接切换到APP，并自动阻止a标签的默认行为
    // 否则打开a标签的href链接
    var ifr = document.createElement('iframe');
    ifr.src = rUrl;
    ifr.style.display = 'none';
    document.body.appendChild(ifr);
    window.setTimeout(function () {
        window.location = e;
        document.body.removeChild(ifr);
    }, 3000);
};

/**
 * android app唤起逻辑打开URL
 *
 * @param schema
 * @param url
 * @param e
 */
Local.goAppReaderForWeibo = function (url,e) {
    var rUrl = "qqreader://com.tencent.reader?action=openUrl&parameter=" + url;
    // 通过iframe的方式试图打开APP，如果能正常打开，会直接切换到APP，并自动阻止a标签的默认行为
    // 否则打开a标签的href链接
    var ifr = document.createElement('iframe');
    ifr.src = rUrl;
    ifr.style.display = 'none';
    document.body.appendChild(ifr);
    window.setTimeout(function () {
        window.location = e;
        document.body.removeChild(ifr);
    }, 3000);
};

Local.openPage = function (srcurl, origin, pagecode) { //打开链接
    //判断是不是微博浏览器
    if(param('weibo')==1){
        var ua = navigator.userAgent;
        if(ua.indexOf('weibo')>0){
            ss('weibo_mask','display','block');
            return;
        }
    }
    var testFlag = param("tf");
    var detailobj = {};
    var url = srcurl
    if (url.indexOf('?') < 0) {
        url += '?';
    }

    url += Local.getExParamStr(detailobj, 1, 0, 1);
    url = url + Local.getExparamWithoutClient();
    url = url.replace('?&', '?');
    //替换掉undifined
    url = url.replace('undifined','');
    if (testFlag == 1) {
        detailobj.url = url;
        detailobj.origin = param('origin');
        detailobj.alg = param('alg');
        detailobj.datatype = param('datatype');
        detailobj.fromBid = param('fromBid');
        window.location.href = url;
    } else {
        if (url.indexOf('book_share.html') >= 0) {
            if (!origin) {
                origin = getParam(url, 'origin');
            }
            Local.nativeDetail(getParam(url, 'bid'), origin);
        } else {
            Local.openInside(srcurl);
        }
    }
};

Local.openPage57 = function (srcurl, origin, pagecode) { //打开链接
    //判断是不是微博浏览器
    if(param('weibo')==1){
        var ua = navigator.userAgent;
        if(ua.indexOf('weibo')>0){
            ss('weibo_mask','display','block');
            return;
        }
    }
    var testFlag = param("tf");
    var detailobj = {};
    var url = srcurl
    if (url.indexOf('?') < 0) {
        url += '?';
    }

    url += Local.getExParamStr(detailobj, 1, 0, 1);
    url = url + Local.getExparamWithoutClient();
    url = url.replace('?&', '?');
        detailobj.url = url;
        detailobj.origin = param('origin');
        detailobj.alg = param('alg');
        detailobj.datatype = param('datatype');
        detailobj.fromBid = param('fromBid');
        window.location.href = url;

};


Local.openPageEx = function (pageobj, replaceorigin) { //打开链接
    //判断是不是微博浏览器
    if(param('weibo')==1){
        var ua = navigator.userAgent;
        if(ua.indexOf('weibo')>0){
            ss('weibo_mask','display','block');
            return;
        }
    }
    pageobj.extraurl = Local.getExParamStr(pageobj, 1, replaceorigin, 1);
    var testFlag = param("tf");
    if (testFlag == 1) {
        var url = '';
        if (pageobj.url.indexOf('?') >= 0) {
            url = pageobj.url + Local.getExparamWithoutClient();
        } else {
            url = pageobj.url + '?' + Local.getExparamWithoutClient();
        }
        if (pageobj.extraurl) {
            url += pageobj.extraurl;
        }
        url.replace('?&', '?');
        window.location.href = url;
    } else {
        Local.nativeDetail(pageobj.bid, pageobj.origin);
    }
};

/**
 * 获取额外的链接参数
 * @returns {*}
 * @param detailobj
 * @param replace_lmf
 * @param replaceorigin
 * @param addlmfh
 */
Local.getExParamStr = function (detailobj, replace_lmf, replaceorigin, addlmfh) {
    var url = detailobj.url;
    var origin = detailobj.origin;
    var alg = detailobj.alg;
    var datatype = detailobj.datatype;
    var fromBid = detailobj.fromBid;

    var params = "";
    var lm_f;
    if (replace_lmf == 1) {
        lm_f = param(pageName);//lm_f
    } else {
        lm_f = nl(param('lm_f')) ? param(pageName) : param('lm_f'); //lm_f
    }
    params += '&lm_f=' + lm_f;
    var lmfh = param('lmh_f');
    if (nl(lmfh)) {
        lmfh = lm_f;
    } else {
        // 历史最长的只能增加到5级，再高不予记录了
        var reg = new RegExp("_", "g");
        if ((!lmfh.match(reg) || lmfh.match(reg).length < 5) && addlmfh) {
            lmfh += ("_" + lm_f);
        }
    }


    params += '&lmh_f=' + lmfh;//访问历史

    params += nl(alg) ? '' : '&alg=' + alg;
    params += nl(datatype) ? '' : '&data_type=' + datatype;
    params += nl(fromBid) ? '' : '&fromBid=' + fromBid;

    if ((url && url.indexOf('origin=') < 0) || (url && url.indexOf('bookDetail') >= 0)) {
        if (!nl(param("origin")) && !replaceorigin) {
            params += '&origin=' + param("origin"); //统计用的区分号
        } else if (!nl(origin)) {
            params += '&origin=' + origin; //统计用的区分号
        }
    }
    return params;
};

Local.getExparamWithoutClient = function () {
    var params = '';
    if (!nl(param("tf"))) {
        params += '&tf=' + param("tf"); //是否走pc测试条件
    }

    if (!nl(param("sid"))) {
        params += '&sid=' + param("sid");
    }

    // loginType尝试从cookie中获取
    if (!nl(ckg("loginType"))) {
        params += '&loginType=' + ckg("loginType");
    } else {
        if (!nl(param("loginType"))) {
            params += '&loginType=' + param("loginType");
        }
    }

    // uid尝试从cookie中获取
    if (!nl(ckg("uid"))) {
        params += '&uid=' + ckg("uid");
    } else {
        if (!nl(param("uid"))) {
            params += '&uid=' + param("uid");
        }
    }

    //需要预先从cookie中获取
    params = getparamfcookieandurl(params, "usid");
    params = getparamfcookieandurl(params, "timi");
    params = getparamfcookieandurl(params, "skey");


    if (!nl(param("platform"))) {
        params += '&platform=' + param("platform");
    }else if(!nl(param("c_platform"))){
        params += '&platform=' + param("c_platform");
    }
    if (!nl(param("version"))) {
        params += '&version=' + param("version");
    }
    if (!nl(param("qimei"))) {
        params += '&qimei=' + param("qimei");
    }

    if (!nl(param("itemid"))) {
        params += '&itemid=' + param("itemid");
    }

    params += nl(param('share')) ? '' : '&share=' + param('share');

    if (!nl(param("channel"))) {
        params += '&channel=' + param("channel"); //渠道号
    }

    params += '&fp=1';//这个参数用于判断是否是页面间跳转

    return params;
};

function getparamfcookieandurl(params, key) {
    //尝试从cookie中获取
    if (!nl(ckg(key))) {
        params += '&' + key + '=' + ckg(key);
    } else {
        if (!nl(param(key))) {
            params += '&' + key + '=' + param(key);
        }
    }
    return params;
}

//打开包月开通页面
Local.openVip = function (isLogin) {
    if (!isLogin) {
        Local.login();
    }
    C.callCocoa({
        "method": "subscribe"
    });
};
//进入特权页
Local.monthprivilege = function () {
    C.callCocoa({
        "method": "subscribeintro"
    });
};
//去充值页
Local.openrecharge = function () {
    C.callCocoa({
        "method": "recharge"
    });
};
//账户信息:1我的账户,2包月特权,3收藏,4充值,5基因
Local.usercenter = function (accountid) {
    C.callCocoa({
        "method": "usercenter",
        "account":accountid
    });
};
//关闭弹窗
Local.closepopup = function () {
    C.callCocoa({
        "method": "close_web"
    });
};
//tab跳转，默认跳精选
Local.gotab = function (id) {
    C.callCocoa({
        "method": "go_tab",
        "id": id||2
    });
};
//跳转皮肤列表
Local.themelist = function () {
    C.callCocoa({
        "method": "go_theme"
    });
}

/**
 * 上报页面事件
 * @param eventname
 * @param eventtype
 */
function reportPageEvent(eventname, eventtype) {
    try {
        if (!eventtype) {
            eventtype = "TOPIC_EVENT";
        }
        var server = "http://ios.reader.qq.com/";
        if (window.location.host.indexOf("117") >= 0)
            server = "http://bookcs.ios.reader.qq.com/";
        Local.reqaObj(server + 'common/reportPageEvent?eventtype=' + eventtype + '&eventname=' + eventname, function (data) {
        }, [], function () {
        }, 1);
    } catch (e) {
    }
};

/**
* 打开评论详情
*/
Local.opencommentdetail = function(cid,bid){
    C.callCocoa({
        "method":"opencommentdetail",
        "commentId":cid,
        "bookId":bid
    });
}

//去充值页-带档位
Local.openrechargeV2 = function (tier) {
    C.callCocoa({
        "method": "recharge",
        "tier":tier
    });
};

//互动专题页，加入话题讨论
Local.openTopicDiscuss = function (tid, ctype) {
    try {
        C.callCocoa({
            "method": "openTopicDiscuss",
            "tid": tid,
            "ctype": ctype
        });
    } catch (err) {
        Local.showToast("callCocoa Failed:" + err.message);
    }
};

//添加回复
Local.openTopicComment = function (tid, ctype) {
    try {
        C.callCocoa({
            "method": "openTopicComment",
            "tid": tid,
            "ctype": ctype
        });
    } catch (err) {
        Local.showToast("callCocoa Failed:" + err.message);
    }
};

//QURL跳转,用户跳转客户端native页面
Local.gotoQUrl = function (url) {
    C.callCocoa({
        "method": "gotoQUrl",
        "url": url
    });
};