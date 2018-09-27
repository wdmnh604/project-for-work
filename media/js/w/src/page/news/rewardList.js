/**
 * 单个作品的打赏列表页
 * @namespace CS.page.news.rewardList
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
        // _pageIndex = 2, //页码
        _hasNextPage = true; //打赏列表是否还有下一页

    /**
     * 初始化
     * @param {int} bid 作品id
     * @param {string} getRewardListAjaxUrl 获取打赏列表的ajax地址
     * @param {string} getMsgListAjaxUrl 获取消息列表的ajax地址
     * @param  {string} sendMessageAjaxUrl 发送感谢/私信的ajax地址
     */
    function init(bid, getRewardListAjaxUrl, sendMessageAjaxUrl, endTime) {
        _params.bid = bid || 0;
        _params.getRewardListAjaxUrl = getRewardListAjaxUrl || '';
        _params.sendMessageAjaxUrl = sendMessageAjaxUrl || '';
        _params.endTime = endTime || '';
        _bindEvent();
    }

    /**
     * 绑定页面元素事件
     */
    function _bindEvent() {
        var $rewardList = $('#rewardList'), //打赏列表
            $loadingTipsBox = $('#loadingTipsBox'); //加载提示的容器

        //滚动加载组件
        $(window).scrollLoad({
            'scrollBottomCallback' : function(scrollLoadInstance){
                //没有下一页了
                if(!_hasNextPage && scrollLoadInstance){
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
                    _getRewardList();
                }, 500);
            }
        });
        $rewardList
            .on('click', '[nodetype="showThanks"]', function() {
                var userId = $(this).attr('uid');
                _sendThanks(userId);
                return false;
            });
    }

    /**
     * 获取打赏列表
     * @param {int} page 页面（从1开始）
     */
    function _getRewardList(page) {
        page = page || 1;

        _util.request({
            url: _params.getReportListAjaxUrl,
            data: {
                'BID': _params.bid,
                'page': page,
                'time': _params.endTime,
                'ajax': 1
            },
            type: 'get',
            dataType: "json",
            success: function(json) {
                if(!json){
                    _dialog.alert('数据返回格式不正确，请稍候再试');
                    return;
                }

                //成功
                if (json.code === '2000') {
                    if(json.result.html){
                        $('#rewardList').append(json.result.html);
                    }else{
                        _hasNextPage = false;
                    }

                    if('next' in json.result){
                        _hasNextPage = json.result.next;
                    }
                    // _pageIndex++;
                    _params.endTime = json.result.endTime;
                } else {
                    if (json.info) {
                        _dialog.alert(json.info);
                    }
                }
            },
            error: function() {
                _hasNextPage = false;
                _dialog.alert('获取打赏列表失败，请稍候再试');
            },
            complete : function(){
                _isLoading = 0;
                $('#loadingTipsBox').hide();
            }
        });
    }

    /**
     * 发送感谢
     * @param  {int} userId   月票的用户ID
     * @param  {int} rewardId 月票的记录ID
     */
    function _sendThanks(userId){
        if(!userId){
            _dialog.alert('用户id未获取到');
            return;
        }
        _util.request({
            url: _params.sendMessageAjaxUrl,
            data: {
                'userId': userId,
                'sendContent':"感谢支持！唯有发奋创作以表感谢！"
                //'rtype' : 2, // 1: 打赏  2:月票
                //'mtype' : 1 //1：感谢 2：私信
            },
            type: 'POST',
            dataType: "json",
            success: function(json) {
                if(!json){
                    _dialog.alert('数据返回格式不正确，请稍候再试');
                    return;
                }

                //成功
                if(json.status){

                }else{
                    if(json.info){
                        _dialog.alert(json.info);
                    }
                }
            },
            error: function() {
                _dialog.alert('操作失败，请稍候再试');
            }
        });
    }

    _util.initNameSpace("CS.page.news");
    CS.page.news.rewardList = {
        'init': init
    };
})(jQuery);