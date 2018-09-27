/**
 * 验证邮件页面：修改VIP管理密码
 * @namespace CS.page.vipLogin.modifyPwd
 * @update 2015-8-12
 */
(function($) {
	//外部依赖
	var _util = CS.util,
		_dialog = CS.dialog;

	var _isRequesting = 0; //是否正在请求

	var _ajaxUrls = {
		'submitNewPwd': '/Home/VIP/getPWDBackSubmit.html' //提交新密码
	};

	/**
	 * 初始化
	 */
	function init(){
		_bindEvent();
	}

	/**
	 * 绑定页面元素的事件
	 */
	function _bindEvent(){
		var $pwdInput = $('#pwdInput'),
			$pwdRepeatInput = $('#pwdRepeatInput');

		//提交按钮
		$('#submit').on('click', function() {
			var pwd = $pwdInput.val(),
				repeatPwd = $pwdRepeatInput.val();

			_submitNewPwd(pwd, repeatPwd);
			return false;
		});
	}

	/**
	 * 检查密码格式
	 * @param  {string} pwd 密码
	 * @return {bool}     是否通过检测
	 */
	function _checkPwd(pwd){
		//由6-16位英文、数字或特殊字符组成
		var reg = /^[A-Za-z0-9~!@#$%^&*()_+]{6,16}$/;
		return reg.test(pwd);
	}

    /**
     * 提交新密码
     * @param  {string} pwd 新密码
     * @param  {string} repeatPwd 再次输入的新密码
     */
    function _submitNewPwd(pwd, repeatPwd){
		if(!pwd || $.trim(pwd).length === 0){
			_dialog.alert('请输入新密码');
			return;
		}
		if(!_checkPwd(pwd)){
			_dialog.alert('新密码必须由6-16位英文、数字或特殊字符组成');
			return;
		}
		if(!repeatPwd || $.trim(repeatPwd).length === 0){
			_dialog.alert('请再次输入新密码');
			return;
		}
		if(pwd !== repeatPwd){
			_dialog.alert('两次输入的密码必须一致');
			return;
		}

		if(_isRequesting){
            return;
        }
        _isRequesting = 1;

        _util.request({
            url: _ajaxUrls.submitNewPwd,
            type: 'post',
            dataType: 'json',
            data: {
                'password': pwd,
                'repassword': repeatPwd,
                'token': $('#tokenHidden').val()
            },
            success: function(json) {
				if(!json){
					_dialog.alert('返回的数据格式异常，请稍候再试');
					return;
				}
				//成功
				if(json.status){
					$('#modifyPwdBox').hide();
					$('#successTipBox').show();
				}else{
					_dialog.alert(json.info || '操作失败，请稍候再试');
                }
            },
            error: function() {
                _dialog.alert('操作失败，请稍候再试');
            },
            complete : function(){
                _isRequesting = 0;
            }
        });
    }
	
	_util.initNameSpace("CS.page.vipLogin");
    CS.page.vipLogin.modifyPwd = {
        'init': init
    };
})(jQuery);