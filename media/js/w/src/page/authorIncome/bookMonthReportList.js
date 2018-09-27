/**
 * 单个作品的收入月报列表页
 * @namespace CS.page.authorIncome.bookMonthReportList
 * @author langtao
 * @update 2014-11-6
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
        _totalPageCount = 2; //总页数

   /**
    * 初始化
    * @param {int} bid 作品id
    * @param  {string} getReportListAjaxUrl 获取收入月报列表的ajax地址
    */
    function init(bid, getReportListAjaxUrl, clientType) {
        _params.bid = bid || 0;
        _params.getReportListAjaxUrl = getReportListAjaxUrl || '';
        _params.clientType = clientType || '';
        _bindEvent();
    }

    //弹窗 区分ios 和安卓
    function _alertMsg(message){
        if (_params.clientType == 'ios'){
            alert(message);
        }else{
            _dialog.alert(message);
        }
    }     

    /**
     * 绑定页面元素事件
     */
    function _bindEvent() {
        var $loadingTipsBox = $('#loadingTipsBox'); //加载提示的容器

        //滚动加载组件
        $(window).scrollLoad({
            'scrollBottomCallback' : function(scrollLoadInstance){
                //当前页 >= 总页数
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
                    _getReportList(_pageIndex);
                }, 500);
            }
        });
    }

    /**
     * 提交登录
     */
    function _getReportList(page) {
        page = page || 1;

        _util.request({
            url: _params.getReportListAjaxUrl,
            data: {
                'BID': _params.bid,
                'page': page,
                'ajax' : 1
            },
            type: 'get',
            dataType: "json",
            success: function(json) {
                //成功
                if (json.code === '2000') {
                    if(json.result.html){
                        $('#reportList').append(json.result.html);
                    }

                    if(json.result.pageCount){
                        _totalPageCount = json.result.pageCount;
                    }
                    _pageIndex++;
                } else {
                    if (json.info) {
                        _alertMsg(json.info);
                    }
                }
            },
            error: function() {
                _alertMsg('网络异常，请稍候再试');
            },
            complete : function(){
                _isLoading = 0;
                $('#loadingTipsBox').hide();
            }
        });
    }

    _util.initNameSpace("CS.page.authorIncome");
    CS.page.authorIncome.bookMonthReportList = {
        'init': init
    };
})(jQuery);