/**
 * 作家中心-vip作品管理：订阅查询
 * @namespace CS.page.vipBookManage.querySubscription
 * @author  langtao
 * @update 2014-3-18
 */
;
(function($) {
     //外部依赖
    var _util = CS.util,
        _dialog = CS.dialog,
        _uiBinder = CS.uiBinder;

    var _params = {}, //参数集合
        _pager = null; //翻页组件的实例对象

    /**
     * 初始化
     * @param  {int} CBID                    作品id
     * @param  {string} getSubscriptionListAjaxUrl 获取订阅列表的ajax地址
     */
    function init(CBID, getSubscriptionListAjaxUrl) {
        _params.CBID = CBID || 0;
        _params.getSubscriptionListAjaxUrl = getSubscriptionListAjaxUrl || 0;

        _getSubscriptionList(1);
        _bindEvent();
        _searchTakeList();
    }

    function _bindEvent(){
        //选择框
        $('select').comboSelect();

        //排序类型的选择器
        $('#sortFieldSelect').change(function() {
            _pager = null;
            _getSubscriptionList(1);
        });
    }

    /**
     * 获取订阅列表
     * @param  {int} pageIndex 页码 （从1开始）
     */
    function _getSubscriptionList(pageIndex) {
        var sortField = $('#sortFieldSelect').val(); //排序类型的选择器

        _util.request({
            url: _params.getSubscriptionListAjaxUrl,
            data: {
                'page': pageIndex,
                'CBID': _params.CBID,
                'sortField': sortField //排序类型
            },
            type: 'post',
            dataType: "json",
            success: function(json) {
                var $list = $('#subscriptionList'),
                    $pager = $('#pager');

                if (json && json.data && json.data.ListHTMl) {
                    $list.html(json.data.ListHTMl);
                    
                    if(!_pager){
                        // 创建分页
                        _pager = $pager.pagination(json.data.PageCount, {
                            'callback': _getSubscriptionList
                        });
                    }
                }else{
                    $list.empty();
                    $pager.empty();
                }
            }
        });
    }

    /**
     * 获取其他书籍订阅信息
     * @private
     */
    function _searchTakeList(){
        $('#searchTakeList').on('click',function(){
            var CBID = $('#CBID').val();//选中的cbid
            location.href= "/Home/Booknovelsvip/takeindex/CBID/"+CBID;
        })
    }


    _util.initNameSpace("CS.page");
    CS.page.querySubscription = {
        'init': init
    }

})(jQuery);