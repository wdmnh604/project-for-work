/**
 * VIP管理密码登录
 * @namespace CS.page.vipLogin.login
 * @update 2015-8-12
 */
(function($) {
	//外部依赖
	var _util = CS.util,
		_mask = CS.mask,
		_dialog = CS.dialog;

	var _isRequesting = 0, //是否正在请求
		_maskByPopup = null; //遮罩层组件的实例对象

	var _ajaxUrls = {
		'submitLogin': '/Content/VIP/authorLoginSubmit.html', //提交登录
		'submitEmail': '/Content/VIP/findPWDSubmit.html', //提交电子邮箱
		'submitNewPwd': '/Content/VIP/getPWDBackSubmit.html' //提交新密码
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
		var $loginPwdInput = $('#loginPwdInput'), //登录密码输入框
			$submitLoginBtn = $('#submitLoginBtn'); //提交登录按钮

		$submitLoginBtn.on('click', function() {

			_submitLogin($loginPwdInput.val());
			return false;
		});

		$loginPwdInput.on('keydown', function(event) {
			//回车
			if (event.keyCode === 13) {
				$submitLoginBtn.trigger('click');
                                return false;
			}
                        
		});

		//忘记密码按钮
		$('#forgetPwdBtn').on('click', function() {
			_openInputEmailPopup();
			return false;
		});

		//浮层中的关闭按钮
		$('[data-node="closeBtn"]').on('click', function() {
            _closePopup();
            return false;
        });

        var $emailInput = $('#inputEmailPopup_emailInput'); //填写email的输入框

		//填写电子邮箱浮层：提交按钮
		$('#inputEmailPopup_submitBtn').on('click', function() {
			_submitEmail($emailInput.val());
			return false;
		});

		//验证邮件已经发送的提示浮层：下一步按钮
		$('#validateEmailPopup_nextStepBtn').on('click', function() {
			_closePopup();
			// _openModifyPwdPopup();
			return false;
		});

		var $modifyPwdPopup = $('#modifyPwdPopup'); //修改密码浮层
		//提交按钮
		$modifyPwdPopup.find('[data-node="submitBtn"]').on('click', function() {
			var originalPwd = $modifyPwdPopup.find('[data-node="originalPwdInput"]').val(),
				newPwd = $modifyPwdPopup.find('[data-node="newPwdInput"]').val(),
				repeatNewPwd = $modifyPwdPopup.find('[data-node="newPwdRepeatInput"]').val();

			_submitNewPwd(originalPwd, newPwd, repeatNewPwd);
			return false;
		});
	}

	/**
	 * 打开填写填写电子邮箱的浮层
	 */
	function _openInputEmailPopup(){
		//清空输入框
		$('#inputEmailPopup_emailInput').val('');

		_openPopup($('#inputEmailPopup'));
	}

	/**
	 * 打开验证邮件已经发送的提示浮层
	 * @param {string} email 电子邮箱地址
	 */
	function _openValidateEmailPopup(email){
		//更新用户注册作者时预留的电子邮箱
		$('#validateEmailPopup_email').text(email);

		_openPopup($('#validateEmailPopup'));
	}

	/**
	 * 打开修改密码浮层
	 */
	function _openModifyPwdPopup(){
		var $modifyPwdPopup = $('#modifyPwdPopup'); //修改密码浮层
		
		$modifyPwdPopup.find('[data-node="originalPwdInput"]').val('');
		$modifyPwdPopup.find('[data-node="newPwdInput"]').val('');
		$modifyPwdPopup.find('[data-node="newPwdRepeatInput"]').val('');

		_openPopup($('#modifyPwdPopup'));
	}

	/**
     * 打开浮层
     * @param  {object} $popup 浮层元素的jquery对象
     */
    function _openPopup($popup){
        if(!$popup || $popup.length === 0){
            return;
        }

        //清理下内存
        _maskByPopup = null;
        _maskByPopup = new _mask($popup);

        if(_maskByPopup){
            _maskByPopup.open();
        }
    }

    /**
     * 关闭浮层
     */
    function _closePopup(){
        if(_maskByPopup){
            _maskByPopup.close();
        }
    }

    /**
     * 提交电子邮箱地址
     * @param  {string} email 电子邮箱地址
     */
    function _submitEmail(email){
		if(!email || $.trim(email).length === 0){
			_dialog.alert('请填写电子邮箱');
			return;
		}

		if(!_util.isValidEmailAddress(email)){
			_dialog.alert('电子邮箱的格式不正确');
			return;
		}

		if(_isRequesting){
            return;
        }
        _isRequesting = 1;

        _util.request({
            url: _ajaxUrls.submitEmail,
            type: 'post',
            dataType: 'json',
            data: {
                'email': email
            },
            success: function(json) {

				if(!json){
					_dialog.alert('返回的数据格式异常，请稍候再试');
					return;
				}
				//成功
				if(json.status && json.data){
					_closePopup();
					//打开验证邮件已经发送的提示浮层
					_openValidateEmailPopup(json.data);
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

    /**
     * 提交新密码
     * @param  {string} originalPwd  原始密码
     * @param  {string} newPwd       新密码
     * @param  {string} repeatNewPwd 重复输入的新密码
     */
    function _submitNewPwd(originalPwd, newPwd, repeatNewPwd){
		if(!originalPwd || $.trim(originalPwd).length === 0){
			_dialog.alert('请填写原始密码');
			return;
		}
		if(!newPwd || $.trim(newPwd).length === 0){
			_dialog.alert('请填写新密码');
			return;
		}
		if(!repeatNewPwd || $.trim(repeatNewPwd).length === 0){
			_dialog.alert('请再次输入新密码');
			return;
		}
		if(newPwd !== repeatNewPwd){
			_dialog.alert('两次输入的新密码必须一致');
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
               
            },
            success: function(json) {                             
				if(!json){
					_dialog.alert('返回的数据格式异常，请稍候再试');
					return;
				}
				//成功
				if(json.status){
					_closePopup();
					_dialog.alert(json.info || '修改密码成功');
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

	/**
	 * 提交登录
	 * @param  {string} pwd 登录密码
	 */
	function _submitLogin(pwd){
		if($.trim(pwd).length === 0){
			_dialog.alert('请输入密码');
			return;
		}

		if(_isRequesting){
            return;
        }
        _isRequesting = 1;

        _util.request({
            url: _ajaxUrls.submitLogin,
            type: 'post',
            dataType: 'json',
            data: {
                'Authorpass': pwd,
                'http_referer': $('#refererHidden').val()
            },
            success: function(json) {
				if(!json){
					_dialog.alert('返回的数据格式异常，请稍候再试');
					return;
				}
				//成功
				if(json.status && json.data && json.data.url){
					//跳转到目的页

					window.location.href = json.data.url;
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
    CS.page.vipLogin.login = {
        'init': init
    };
})(jQuery);