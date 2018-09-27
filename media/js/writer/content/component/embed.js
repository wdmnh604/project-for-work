/**
 * 被其他站点以iframe方式嵌入后的处理
 * @namespace CS.embed
 * @lastUpdate 2015-6-4
 */
;
(function($) {
    //外部依赖
    var _util = CS.util;

    var _params = {}; //参数集合

    /**
     * 初始化
     */
    function init() {
        _clearEmbedMode();
    }

    /**
     * 清除嵌入模式
     */
    function _clearEmbedMode(){
        //没有被其他站点嵌入，但是有被嵌入的cookie标记
        if(window.top === window && $.cookie('newidea') === '1'){
            $.removeCookie('newidea',{domain: '.book.qq.com'});
            location.href = location.href;
        }
    }

    _util.initNameSpace("CS");
    CS.embed = {
        'init': init
    };
})(jQuery);