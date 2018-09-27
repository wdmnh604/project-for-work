/**
 * 咨询的收件箱
 * @namespace CS.page.consult.receiveBox
 * @author langtao
 * @update 2014-12-11
 */
;
(function($) {
    //外部依赖
    var _util = CS.util;
    var report = {};
    var envType = '';
    var pageId = '';
    var cgi = 'http://path.book.qq.com/qreport';
    var data_platform,data_version, data_imei, data_cauthorid;
   /**
    * 初始化
    */
    function init(paramPageId, env, platform, version, imei, cauthoid) {  //pageId, env, platform, version, imei

        pageId = paramPageId || '';//pageId
        envType = env || '';//环境
        data_platform = platform || '';
        data_version = version || '';
        data_imei = imei || '';
        data_cauthorid = cauthoid || '';
		// local & dev & oa 上报到一个错误的地址，方便自测、测试
	    if(envType !== 'product'){
	        // cgi = 'http://'+ envType + 'path.book.qq.com/qreport';
	    }    	
        _bindEvent();
    }

    /**
     * 绑定页面元素事件
     */
    function _bindEvent() {

		// 页面加载后单独发请求统计PV
        $(document).ready(function() {

            var url = cgi + '?';
            var obj = {

                path: 'wstlog',

                logtime: getTimestr(),

                app_src: 'h5',

                platform : data_platform,

                version: data_version,

                qimei: $.cookie('data_qimei'),

                uid: $.cookie('data_uid'),

                imei : data_imei,
                // P 浏览行为
                p1: 'P',//event_type
                // 页面ID
                p2: pageId || '',//pageid
                p6: data_cauthorid,//
                // 当前页面url
                p9: encodeURI(window.location.href),//pageurl
                // 来源referrer
                p10: encodeURI(document.referrer) //referrer
            };

            $.each( obj, function( key, value ) {
                url = url + key + '=' + value + '&';
            });

            // 去除最后一个&
            url = url.substring(0, url.length-1);

            createSender(url);
        });

        // 点击链接
        $(document).on('click.report', function(e){

            var target = $(e.target);
            var url = cgi + '?';
            var obj = {
                // 类型
                path: 'wstlog',

                logtime: getTimestr(),

                app_src: 'h5',

                platform : data_platform,

                version: data_version,

                qimei: $.cookie('data_qimei'),

                uid: $.cookie('data_uid'),

                imei : data_imei,                
                // A 点击行为
                p1: 'A',//event_type
                // 页面ID，每个页面hardcode
                p2: pageId, //pageid

                p3: '', 

                p4: '', 

                p5: '', 
                p6: data_cauthorid,//
                // 页面模块标识
                p8: '', //eventid                
                // 当前页面url
                p9: encodeURI(window.location.href),//pageurl
                // 来源referrer
                p10: encodeURI(document.referrer),//referer
                
                // 横坐标
                x: e.clientX + $('body').scrollLeft() || '',
                // 纵坐标
                y: e.clientY + $('body').scrollTop() || '',
                // 分辨率横屏
                sw: screen.width,
                // 分辨率竖屏
                sh: screen.height
            };
            var currentElement = target;
            while(currentElement.get(0).tagName != 'BODY'){

                // 数据统计也采用冒泡层级来区分模块，会采用l1~l7来标识，l1代表最外层，html层级越往里，依次递增，l2, l3, l4……
                for(var i=0; i<3; i++){  // 目前APP 最多为3层
                    if(currentElement.data('l'+(i+1))){
                        
                        if(i == 0){
                            obj.p3 = currentElement.data('l'+(i+1));
                        }
                        if (i == 1){
                            obj.p4 = currentElement.data('l'+(i+1));
                        }
                        if (i == 2){
                            obj.p5 = currentElement.data('l'+(i+1));
                        }
                        break;
                    }
                }
                /**
                 * ==================================================
                 * 以下是最里层元素，在同一层
                 * ==================================================
                 */

                // 如果获取到模块ID
                if(currentElement.data('aid')){
                    obj.p8 = currentElement.data('aid');
                }
                currentElement = currentElement.parent();
            }

            if (!obj.p8) {
                return; 
            }

            //合并成 http://path.book.qq.com/qreport?path=wstlog
            $.each( obj, function( key, value ) {
                url = url + key + '=' + value + '&';
            });
            // 去除最后一个&
            url = url.substring(0, url.length-1);
            // 防刷
            obj.p3 = obj.p3 || '';
            if(obj.p3 == ''){
                // return;
            }

            createSender(url);
        });        
    }

	/**
     * 创建发送请求器
     * @method createSender
     * @param url 发送的请求
     */
    function createSender(url){
        var img = new Image();
        img.onload = img.onerror = function(){
            img = null;
        };
        img.src = url;
    }    


    function getTimestr(){
        var date = new Date();
        var seperator1 = "-";
        var seperator2 = ":";
        var month = date.getMonth() + 1;
        var strDate = date.getDate();
        if (month >= 1 && month <= 9) {
            month = "0" + month;
        }
        if (strDate >= 0 && strDate <= 9) {
            strDate = "0" + strDate;
        }
        var currentdate = date.getFullYear() + seperator1 + month + seperator1 + strDate
                + " " + date.getHours() + seperator2 + date.getMinutes()
                + seperator2 + date.getSeconds();
        return currentdate;
    }

    _util.initNameSpace("CS.page.report");
    CS.page.report.main = {
        'init': init
    };
})(jQuery);


