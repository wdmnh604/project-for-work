/**
 * 作者登录页面
 * @namespace CS.page.authorLogin.main
 * @author zhuzhengguo
 * @update 2015-10-12
 */
;
(function($) {
    //外部依赖
    var _util = CS.util,
        _mask = CS.mask,
        _dialog = CS.dialog;

    var _params = {}, //参数集合
        _isSending = 0,
        _maskByPwdErrorPopup = null; //遮罩组件的实例对象: 密码错误提示浮层

    /**
     * 初始化
     */
    function init(submitAjaxUrl, successJumpUrl, clientType) {
        _params.submitAjaxUrl = submitAjaxUrl || '';
        _params.successJumpUrl = successJumpUrl || '';
        _params.clientType = clientType || 'android';
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
        var $pwdInput = $('#authorPass'), //密码输入框
            $pwdErrorPopup = $('#pwdErrorPopup'); //密码错误的提示浮层

        //创建遮罩层的实例
        _maskByPwdErrorPopup = new _mask($pwdErrorPopup);
        //取消按钮
        $pwdErrorPopup.on('click', '[nodetype="closeBtn"]', function() {
            if(_maskByPwdErrorPopup){
                _maskByPwdErrorPopup.close();
            }
            return false;
        });

        //申请提交的按钮
        $('#submitBtn').on('click', function() {
            _submitApply();
        });

        $('.sexType').on('touchend',function(){
            $(this).addClass('active').siblings('span').removeClass('active');
            $(this).next('input[name="sex"]').prop('checked',true).siblings('input[name="sex"]').prop('checked',false);
        });

    }

    /**
     * 提交登录 agree,authorName,vipPassword,vipRepassword,email,realName,sex,cardId,tel,area,address
     */
    function _submitApply() {
        if (_isSending == 1) return;
        _isSending = 1;
        _util.request({
            url: _params.submitAjaxUrl,
            data: $("#applyForm").serialize(),
            type: 'post',
            dataType: "json",
            success: function(json) {
                //成功
                if (json.code == '2000') {
                    //页面跳转
                    location.href = _params.successJumpUrl;
                } else {
                    _isSending = 0;
                    _alertMsg(json.info);
                }
            },
            error: function() {
                _isSending = 0;
                _alertMsg('操作失败，请稍候再试');
            }
        });
    }

    _util.initNameSpace("CS.page.authorLogin");
    CS.page.authorLogin.applyAuthor = {
        'init': init
    };
})(jQuery);