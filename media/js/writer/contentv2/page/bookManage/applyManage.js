/**
 * 作品管理-申请管理
 * @namespace CS.page.bookManage.applySign
 * @update 2015-12-23
 */
(function($) {
    //外部依赖
    var _util = CS.util,
        _topTip = CS.topTip, //顶部提示
        _dialog = CS.dialog;

    var _isSubmitting = 0; //是否正在提交申请

    /**
     * 初始化
     */
    function init() {
        _bindEvent();
        _bindEventCheck();
    }

    /**
     * 绑定页面元素的事件
     */
    function _bindEvent() {
        //保存草稿按钮
        $('#signBtn').on('click', function() {
            if($(this).hasClass('btn-disabled'))
                return;
            
            _saveDraft();
            return false;
        });

        $('#apply-List').slimScroll({
            height: '740px',
            disableFadeOut: true,
            railVisible: true,
            size: '10px',
            wheelStep: 10,
            borderRadius: 0,
            railBorderRadius: 0,
            allowPageScroll: true,
            alwaysVisible: false,
            distance: '-1px'
        });

        $('#applycontent').slimScroll({
            height: '740px',
            disableFadeOut: true,
            railVisible: true,
            alwaysVisible: false,
            borderRadius: 0
        });
    }

    /**
     * 点击后清空文本框内的文字
     * @private
     */
    function _bindEventCheck() {
        var clearInput = $('.clearInput');

        clearInput.focus(function() {
            if ($(this).val() == $(this).attr("def")) {
                $(this).val("");
                $(this).css('color', '#333');
            }
        });

        clearInput.blur(function() {
            if ($(this).val() === "") {
                $(this).val($(this).attr("def"));
                $(this).css('color', '#BBB');
            }
            if ($(this).val() !== $(this).attr("def")) {
                $(this).css('color', '#333');
            }
        });
    }

    /**
     * 保存草稿
     */
    function _saveDraft() {

        if(_isSubmitting){
            return;
        }

        _isSubmitting = 1;

        //动态提交保存草稿的表单
        _util.ajaxSubmitForm($('#formSign'), {
            type: "POST",
            dataType: "json",
            success: function(json) {
                if (!json) {
                    _topTip.show('返回的数据格式异常，请稍候再试');
                    return;
                }

                //成功
                if (json.status) {
                    _topTip.show(json.info || '保存成功', function() {
                        //刷新当前页
                        location.href = location.href;
                    });
                } else {
                    _dialog.alert(json.info || '操作失败，请稍候再试');
                }
            },
            error: function() {
                _dialog.alert('操作失败，请稍候再试');
            },
            complete : function(){
                _isSubmitting = 0;
            }
        });
    }

    _util.initNameSpace("CS.page");
    CS.page.applyManage = {
        'init': init
    };
})(jQuery);