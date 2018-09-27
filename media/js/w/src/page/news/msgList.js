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
        _totalPageCount = 2, //私信列表的总页数
        _startLoadTop = 20; //开始动态加载私信列表的顶部距离

   /**
    * 初始化
    * @param {int} userId 用户id
    * @param {string} getMsgListAjaxUrl 获取消息列表的ajax地址
    * @param  {string} sendMessageAjaxUrl 发送感谢/私信的ajax地址
    */
    function init(userId, getMsgListAjaxUrl, sendMessageAjaxUrl) {
        _params.userId = userId || 0;
        _params.getMsgListAjaxUrl = getMsgListAjaxUrl || '';
        _params.sendMessageAjaxUrl = sendMessageAjaxUrl || '';

        setTimeout(function() {
            var scrollHeight = $(document).height(),
                clientHeight = $(window).height();

            if (clientHeight > _startLoadTop && scrollHeight > clientHeight) {
                $(window).scrollTop(scrollHeight);
            }
        }, 500);

        _bindEvent();
    }

    /**
     * 绑定页面元素事件
     */
    function _bindEvent() {
        var $loadingTipsBox = $('#loadingTipsBox'); //加载提示的容器

        $(window).on('scroll.load', function() {
            var scrollTop = $(this).scrollTop();
            if (scrollTop < _startLoadTop) {
                $(window).scrollTop(_startLoadTop + 5);
                //没有下一页了
                if (_pageIndex > _totalPageCount) {
                    //注销向下滑动事件
                    $(window).off('.load');
                    return;
                }
                if (_isLoading) {
                    return;
                }
                _isLoading = 1;
                $loadingTipsBox.show();
                window.setTimeout(function() {
                    _getMsgList(_pageIndex);
                }, 500);
            }
        });

        //发送私信按钮
        $('#sendMsg').on('click', function() {
            var userId = $(this).attr('uid'),
                content = $('#msgInput').val(); //私信输入框的内容
                alert(userId);
            _sendMsg(userId, content);
            return false;
        });
    }

    /**
     * 获取私信列表
     * @param  {int} page 页面
     */
    function _getMsgList(page) {
        page = page || 1;
        _util.request({
            url: _params.getMsgListAjaxUrl,
            data: {
                'rUID': _params.userId,
                'pageIndex': page,
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
                        $('#msgList').prepend(json.result.html);
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
                _dialog.alert('获取私信列表失败，请稍候再试');
            },
            complete: function() {
                _isLoading = 0;
                $('#loadingTipsBox').hide();
            }
        });
    }

    /**
     * 发送私信
     * @param  {int} userId  用户id
     * @param  {string} content 私信内容
     */
    function _sendMsg(userId, content) {
        if (!userId) {
            _dialog.alert('用户id未获取到');
            return;
        }

        content = content ? $.trim(content) : '';
        if (content.length === 0) {
            _dialog.alert('请输入私信内容');
            return;
        }

        _util.request({
            url: _params.sendMessageAjaxUrl,
            data: {
                'userId': userId,
                'sendContent': content
            },
            type: 'POST',
            dataType: "json",
            success: function(json) {
                if (!json) {
                    _dialog.alert('数据返回格式不正确，请稍候再试');
                    return;
                }
                //成功
                if (json.result) {
                    $('#msgInput').val('');
                    $('#msgList').append(json.result.html);
                    //滚动到底部，以便最新发出的私信不被回复框浮层遮挡
                    setTimeout(function(){
                        $(window).scrollTop($(document).height());
                    }, 200);
                } else {
                    if (json.info) {
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
    CS.page.news.msgList = {
        'init': init
    };
})(jQuery);