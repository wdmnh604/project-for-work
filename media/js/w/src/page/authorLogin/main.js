/**
 * 作者登录页面
 * @namespace CS.page.authorLogin.main
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
        _isSending = 0,
        _maskByPwdErrorPopup = null; //遮罩组件的实例对象: 密码错误提示浮层

    /**
     * 初始化
     */
    function init(submitLoginAjaxUrl, loginSuccessJumpUrl, clientType) {
        _params.submitLoginAjaxUrl = submitLoginAjaxUrl || '';
        _params.loginSuccessJumpUrl = loginSuccessJumpUrl || '';
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

        //提交登录的按钮
        $('#submitBtn').on('click', function() {
            var pwd = $pwdInput.val();
            _submitLogin(pwd);
        });
    }

    /**
     * 提交登录
     */
    function _submitLogin(pwd) {
        pwd = pwd ? $.trim(pwd) : '';

        if (pwd.length === 0) {
            _alertMsg('请输入VIP管理密码');
            return;
        }
        if (_isSending == 1) return;
        _isSending = 1;     
        $("#submitBtn").val('提交中..');   
        _util.request({
            url: _params.submitLoginAjaxUrl,
            data: {
                'authorPass': pwd
            },
            type: 'post',
            dataType: "json",
            success: function(json) {
                //成功
                if (json.result) {
                    //页面跳转
                    location.href = _params.loginSuccessJumpUrl;
                } else {
                    $("#submitBtn").val('确定');  
                    _isSending = 0;
                    _alertMsg(json.info);
                }
            },
            error: function() {
                _isSending = 0;
                $("#submitBtn").val('确定');   
                _alertMsg('操作失败，请稍候再试');
            }
        });
    }

    _util.initNameSpace("CS.page.authorLogin");
    CS.page.authorLogin.main = {
        'init': init
    };
})(jQuery);