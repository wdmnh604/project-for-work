/**
 * 咨询的收件箱
 * @namespace CS.page.consult.receiveBox
 * @author langtao
 * @update 2014-12-11
 */
;
(function($) {
    //外部依赖
    var _util = CS.util,
        _mask = CS.mask,
        _dialog = CS.dialog;

    var _params = {}, //参数集合
        _isLoading = 0, //是否正在加载内容
        _pageIndex = 2, //页码
        _totalPageCount = 2; //书评列表的总页数

   /**
    * 初始化
    * @param {int} bid 作品id
    * @param {string} getConsultListAjaxUrl 获取咨询列表的ajax地址
    */
    function init(getConsultListAjaxUrl) {
        _params.getConsultListAjaxUrl = getConsultListAjaxUrl || '';
        _bindEvent();
    }

    /**
     * 绑定页面元素事件
     */
    function _bindEvent() {
        var $loadingTipsBox = $('#loadingTipsBox'); //加载提示的容器

        //滚动加载组件
        $(window).scrollLoad({
            'scrollBottomCallback' : function(scrollLoadInstance){
                //没有下一页了
                if(_pageIndex > _totalPageCount && scrollLoadInstance){
                    //注销滚动事件
                    scrollLoadInstance.cancelScrollEvent();
                    return;
                }

                if(_isLoading){
                    return;
                }
                _isLoading = 1;
                $loadingTipsBox.show();
                window.setTimeout(function(){
                    _getConsultList(_pageIndex);
                }, 500);
            }
        });
    }

    /**
     * 获取咨询列表
     * @param {int} page 页面（从1开始）
     */
    function _getConsultList(page) {
        page = page || 1;

        _util.request({
            url: _params.getConsultListAjaxUrl,
            data: {
                'tab' : 'receiv', //收件箱
                'page': page,
                'ajax' : 1
            },
            type: 'GET',
            dataType: "json",
            success: function(json) {
                if(!json){
                    _dialog.alert('数据返回格式不正确，请稍候再试');
                    return;
                }
                
                //成功
                if (json.code === '2000') {
                    if(json.result.html){
                        $('#messList').append(json.result.html);
                    }

                    if('pageCount' in json.result){
                        _totalPageCount = json.result.pageCount;
                    }
                    _pageIndex++;
                } else {
                    if (json.info) {
                        _dialog.alert(json.info);
                    }
                }
            },
            error: function() {
                _dialog.alert('获取咨询列表失败，请稍候再试');
            },
            complete : function(){
                _isLoading = 0;
                $('#loadingTipsBox').hide();
            }
        });
    }

    _util.initNameSpace("CS.page.consult");
    CS.page.consult.receiveBox = {
        'init': init
    };
})(jQuery);