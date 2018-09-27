/**
 * 单个作品的书评列表页
 * @namespace CS.page.news.commentList
 * @author langtao
 * @update 2014-12-15
 */
;
(function($) {
    //外部依赖
    var _util = CS.util,
        _mask = CS.mask,
        _dialog = CS.dialog;

    var _params = {}, //参数集合
        _isLoading = 0, //是否正在加载内容
        _hasNextPage = true; //列表是否还有下一页
   
   /**
    * 初始化
    * @param {int} bid 作品id
    * @param {string} getCommentListAjaxUrl 获取书评列表的ajax地址
    */
    function init(bid, getCommentListAjaxUrl, endTime, getCommentRepUrl) {
        _params.bid = bid || 0;
        _params.getCommentListAjaxUrl = getCommentListAjaxUrl || '';
        _params.getCommentRepUrl = getCommentRepUrl || '';
        _params.endTime = endTime || '';
        _bindEvent();
    }

    /**
     * 绑定页面元素事件
     */
    function _bindEvent() {
        var $commentList = $('#commentList'), //书评列表
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
                    _getCommentList();
                }, 500);
            }
        });

        $commentList
            .on('click', '.commentText', function() { //点击查看书评详情
                var cid = $(this).attr("cid");
                if (!cid) return;
                window.location.href = _params.getCommentRepUrl+"?BID="+_params.bid+"&cid="+cid; 
                return;               
        });
        
    }

    /**
     * 获取书评列表
     * @param {int} page 页面（从1开始）
     */
    function _getCommentList() {

        _util.request({
            url: _params.getCommentListAjaxUrl,
            data: {
                'BID': _params.bid,
                'time': _params.endTime,
                'ajax' : 1
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
                        $('#commentList').append(json.result.html);
                    }else{
                        _hasNextPage = false;
                    }
                    _params.endTime = json.result.endTime;
                } else {
                    if (json.info) {
                        _dialog.alert(json.info);
                    }
                }
            },
            error: function() {
                _hasNextPage = false;
                _dialog.alert('获取书评列表失败，请稍候再试');
            },
            complete : function(){
                _isLoading = 0;
                $('#loadingTipsBox').hide();
            }
        });
    }

    _util.initNameSpace("CS.page.news");
    CS.page.news.commentList = {
        'init': init
    };
})(jQuery);