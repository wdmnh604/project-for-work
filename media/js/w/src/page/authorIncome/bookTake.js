/**
 * 单个作品的 订阅
 * @namespace CS.page.authorIncome.bookTake
 * @author zhuzhengguo
 * @update 2015-09-25
 */
;
(function($) {
    //外部依赖
    var _util = CS.util,
        _mask = CS.mask,
        _dialog = CS.dialog;

    var _params = {}, //参数集合
        _isLoading = 0, //是否正在加载内容
        _pageIndex = 1, //页码
        _totalPageCount = 2, //总页数
        _hasNextPage = true;
   /**
    * 初始化
    * @param {int} bid 作品id
    * @param  {string} getBooktakeAjaxUrl 获取订阅列表的ajax地址
    */
    function init(cbid, getBooktakeAjaxUrl, clientType) {
        _params.cbid = cbid || 0;
        _params.sortfeild = 'uuid'; //默认排序
        _params.getBooktakeAjaxUrl = getBooktakeAjaxUrl || '';
        _params.clientType = clientType || '';
        _bindEvent();
        _getTakeList(1);
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
                if(!_hasNextPage || (_pageIndex > _totalPageCount) && scrollLoadInstance){
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
                    _getTakeList(_pageIndex);
                }, 500);
            }
        });            

        $('.detailList .ch_sort a').click(function () {
            _params.sortfeild = $(this).attr('sort');
            $(this).addClass('act').siblings().removeClass('act');
            if (_params.sortfeild == 'uuid'){
                $("#list_wrapByTime").show().html('').siblings('ul').hide();
            }else{
                $("#list_wrapByNums").show().html('').siblings('ul').hide();
            }
            $loadingTipsBox.show();
            _getTakeList(1);
        });    

        $(".incomeTit .topTab a").click(function(){
            $(this).addClass('act'); 
            $(this).parent('li').siblings('li').find('a').removeClass('act');
            $.cookie("cur_tab", $(this).attr('node'));  
            if ($(this).attr('node') == 'take'){
                $("#takeSection").show();
                $("#incomeSection").hide();
            }else{
                $("#incomeSection").show();
                $("#takeSection").hide();                
            }
        });

    }

    /**
     * 获取订阅
     */
    function _getTakeList(page) {
        if (!_params.cbid || !_params.getBooktakeAjaxUrl || !_params.sortfeild){
            return;
        }
        page = page || 1;
        _util.request({
            url: _params.getBooktakeAjaxUrl,
            data: {
                'CBID': _params.cbid,
                'page': page,
                'sortField' : _params.sortfeild,
                'ajax' : 1
            },
            type: 'get',
            dataType: "json",
            success: function(json) {
                //成功
                if (json.code === '2000') {
                    if(json.result.html){
                        $('.noListInfo').hide();
                        if (_params.sortfeild == 'uuid'){
                            $('#list_wrapByTime').append(json.result.html);
                        }else{
                            $('#list_wrapByNums').append(json.result.html);
                        }
                    }
                    if(json.result.pageCount >= 0){
                        _totalPageCount = json.result.pageCount;
                    } 
                    _pageIndex++;
                    if (json.result.pageCount == 0){
                        _hasNextPage = false;
                    }
                } else {
                    _hasNextPage = false;
                    return;
                }
            },
            error: function() {
                // _alertMsg('网络异常，请稍候再试');
            },
            complete : function(){
                _isLoading = 0;
                $('#loadingTipsBox').hide();
            }
        });
    }

    _util.initNameSpace("CS.page.authorIncome");
    CS.page.authorIncome.bookTake = {
        'init': init
    };
})(jQuery);