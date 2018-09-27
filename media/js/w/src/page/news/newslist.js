/**
 * 单个作品的私信列表
 * @namespace CS.page.news.msgList
 * @author langtao
 * @update 2014-12-30
 */
;
(function($) {

    var _util = CS.util,
        _mask = CS.mask,
        _dialog = CS.dialog;

    var _params = {}, //参数集合
        _isLoading = 0, //是否正在加载内容
        _pageIndex = 2, //页码
        _totalPageCount = 2; //私信列表的总页数
   /**
    * 初始化
    */
    function init(getNewsListAjaxUrl) {
        _params.getNewsListAjaxUrl = getNewsListAjaxUrl || '';

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
                if((_pageIndex > _totalPageCount) && scrollLoadInstance){
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
                    _getMsgList(_pageIndex);
                }, 500);
            }
        });        
    }

    /**
     * 获取私信列表
     * @param  {int} page 页面
     */
    function _getMsgList(page) {
        page = page || 1;
        _util.request({
            url: _params.getNewsListAjaxUrl,
            data: {
                'page': page,
                'ajax': 1
            },
            type: 'get',
            dataType: "json",
            success: function(json) {
                if (!json) {
                    _dialog.alert('数据返回格式不正确，请稍候再试');
                    return;
                }
                if (json.code === '2000') {
                    if (json.result.html) {
                        //添加到私信列表的最前面  
                        $('.history-list').append(json.result.html);
                    }
                    if ('pageCount' in json.result) {
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
                _dialog.alert('获取列表失败，请稍候再试');
            },
            complete: function() {
                _isLoading = 0;
                $('#loadingTipsBox').hide();
            }
        });
    }
     

    _util.initNameSpace("CS.page.news");
    CS.page.news.newsList = {
        'init': init
    };
})(jQuery);