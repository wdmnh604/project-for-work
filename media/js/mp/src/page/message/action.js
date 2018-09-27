/**
 * 消息列表
 * @namespace CS.page.action
 * @update 2016-8-31
 */
(function($) {
    //外部依赖
    var _util = CS.util,
    _topTip = CS.topTip; //顶部提示
    _dialog = CS.dialog; //对话框组件

    var _params = {}, //参数集合
        _nodes = {}, //页面元素集合
        _isLoading = 0, //是否正在加载草稿
        _isSubmitting = 0, //表单是否正在提交中
        _maskByNovelTagPopup = null; //作品选择浮层的遮罩层组建的实例对象



    //ajax地址列表
    var _ajaxUrls = {
        'delMsg' : '/Message/delMsg.html', //删除回复消息
        'doSelected' : '/Message/doSelected.html', //加入精选
        'delReplyMsg' : '/Message/ajaxGetwords.html',
        'adReplydMsg' : '/Message/adReplydMsg.html'
    };


    /**
     * 初始化
     */
    function init( ) {
        _nodes.$selectedNovelTagList = $('#selectedNovelTagList'); //选中的作品标签列表
        _nodes.$siteRadio = $('input[name="siteFrom"]'); //首发站点选择器
        _nodes.$form = $('#formbooknovelsnew');

        _delMsgEvent();
        _replyMsg();
     }



    //删除消息
    function  _delMsgEvent(){
        $('.delMsg').on('click', function() {
            var mmId =  $(this).data("mid");
            showpopup("dialog-delete");
           //_util.request({
            //    url: _ajaxUrls.delMsg,
            //    data: {
            //        'mmId': mmId
            //    },
            //    type: 'post',
            //    dataType: "json",
            //    success: function(json) {
            //
            //    },
            //    error: function() {
            //        _topTip.show('操作失败，请稍候再试');
            //    },
            //    complete : function(){
            //        _isLoading = 0;
            //    }
            //});
            return false;
        });
    };
    //回复消息
    function  _replyMsg(){
        $('.answer-area div div p a.submitReply').on('click', function() {
            console.log($(this).parents(".emoji-wysiwyg-editor").html());
            console.log($(this).parents(".emoji-wysiwyg-editor").html());
           //_util.request({
            //    url: _ajaxUrls.delMsg,
            //    data: {
            //        'mmId': mmId
            //    },
            //    type: 'post',
            //    dataType: "json",
            //    success: function(json) {
            //
            //    },
            //    error: function() {
            //        _topTip.show('操作失败，请稍候再试');
            //    },
            //    complete : function(){
            //        _isLoading = 0;
            //    }
            //});
            return false;
        });
    };
    _util.initNameSpace("CS.page");
    CS.page.action = {
        'init': init
    };
})(jQuery);