/**
 * 模板页
 * @namespace CS.page.layout.main
 * @update 2016-1-4
 */
(function(){
	//外部依赖
	var _util = CS.util,
		_uiBinder = CS.uiBinder,
		_mask = CS.mask,
		_dialog = CS.dialog;

	var _params = {}, //参数集合
		_nodes = {}, //页面元素的对象列表
		_maskByModifyPwd = null, //修改密码浮层的遮罩实例对象
		_isRequesting = 0; //是否正在发起请求

	var _ie6Tip = '您当前的浏览器版本过低，部分功能无法正常使用，请及时升级'; //ie6或以下游览器的提示

	var _ajaxUrls = {
		'modifyPwd' : '/Contentv2/Authors/authorPassUpdate.html', //更改vip管理密码
		'getMsgNotice': '/Contentv2/Authors/getNewMessageNote.html' //获取消息提示信息
	};

	//新消息列表的模板
	var _newMsgListTpl = [
		'<cite class="icon"></cite>',
		'<%each list as item index%>',
			'<%if item.readstate == 0%>',
				'<dd data-questionid="<%=item.IDX%>">',
					'<span class="icon"></span><%=item.content%><a class="blue" href="<%=item.url%>">详情&gt;</a>',
				'</dd>',
			'<%/if%>',
		'<%/each%>',
		'<%if newMsgCount > 3%>',
			'<dd data-node="more" class="more"><a href="/Authors/authorconsultlist.html">查看更多 &gt;</a></dd>',
		'<%/if%>'
	].join('');

	/**
	 * 初始化
	 * @param {string} systemTip 系统警告提示
	 */
	function init(systemTip){
		_params.systemTip = systemTip || '';
		
		_nodes.$modifyPwdPopup = $('#modifyPwdPopup'); //修改vip管理密码的浮层

		updateMsgNotice();
		_setWarnTip();
		_setLoadingTip();
		_bindEvent();
        _leftMenuEffect();

		_adaptWindowSize();
		$(window).on('resize', function(){
			_util.throttle(_adaptWindowSize);
		});
	}

	/**
	 * 自适应窗口大小
	 */
	function _adaptWindowSize(){
		var windowWidth = $(window).width(),
            $leftNav = $('#leftNav');

		if(windowWidth < 1000){ //调试小屏 1850

            $('html').addClass('w1000');

		}else{
            $('html').removeClass('w1000');
		}

		if($leftNav.css('visibility') === 'hidden'){
			//使用visibility而不是display，来减少左侧导航栏宽度变化导致的右侧内容抖动
			$leftNav.css('visibility', 'visible');
		}
	}

    /**
     * 小窗口目录效果
     * @private
     */
    function _leftMenuEffect(){
        //左侧导航栏缩小后的展开效果
        $('#min-bar li').hover(function() {
            $(this).addClass('hover').find('.expand').fadeIn(100).css('right',-96);
        }, function() {
            $(this).removeClass('hover').find('.expand').css('right',0).hide();
        });
    }

	/**
	 * 更新消息提示
	 */
	function updateMsgNotice(){
		if(_isRequesting){
			return;
		}
		_isRequesting = 1;

		_util.request({
            url: _ajaxUrls.getMsgNotice,
            type: 'get',
            dataType: 'json',
            data: {},
            isShowLoading : false, //不显示加载提示效果
            success: function(json) {
                if(json && json.status && json.data){
					var $msgCount = $('#msgCount'), //新消息数量
						$msgList = $('#msgList'); //新消息列表

					$msgCount.hide();
					$msgList.hide();

					//新消息数
					if(json.data.newMessageNum > 0){
						if(json.data.newMessageNum > 99){
							$msgCount.text('99+').addClass('full');
						}else{
							$msgCount.text(json.data.newMessageNum).removeClass('full');
						}

						$msgCount.show();
						
						if(json.data.list && json.data.list.length > 0){
							var tpl = _uiBinder.bindData(_newMsgListTpl, {
								'list': json.data.list,
								'newMsgCount': json.data.newMessageNum
							});
							
							//新消息列表
							$('#msgList').html(tpl).show();
						}
					}
                }
            },
            complete : function(){
				_isRequesting = 0;
            }
        });
	}

	/**
	 * 设置警告提示(小黄条)
	 */
	function _setWarnTip(){
		//用户主动关闭了提示
		if($.cookie('warntip') === '1'){
			return;
		}

		var $box = $('#warnTipBox'),
			$tip = $('#warnTip');

		//关闭按钮
		$('#warnTipCloseBtn').on('click', function() {
			$box.hide();
			$.cookie('warntip', 1);
			return false;
		});

		//有系统提示
		if(_params.systemTip){
			//有可能是超链接html
			$tip.html(_params.systemTip);
			$box.show();
		}else if(_util.isIE6()){ //ie6或以下游览器
			$tip.text(_ie6Tip);
			$box.show();
		}
	}

	/**
	 * 设置加载提示
	 */
	function _setLoadingTip(){
		var $tip = $('#requestLoadingTip');

		if($tip.length > 0){
			//将加载提示容器添加到右侧内容中
			$('.mainRight').eq(0).append($tip);
		}
	}

	/**
	 * 绑定页面元素的事件
	 */
	function _bindEvent(){
		//悬停li列表时显示按钮，当前li改变底色
		$('.hoverLi li').on('mouseover',  function(){
			$(this).addClass('hover').siblings().removeClass('hover');
		});
		
		//单选框选中效果
		$(document.body).on('click', 'span.radio', function(){
			$(this).addClass('on').siblings('.radio').removeClass('on');
			$(this).find('input').attr('checked','checked').parent().siblings().find('input').removeAttr('checked');
		});
		
		//用户头像容器
		$('#headPhotoBox').hover(
			function(){
				if(this.timer){
					clearTimeout(this.timer);
				}
				
				$(this).find('dl').fadeIn();
			},
			function(){
				this.timer = setTimeout(function(){
					$('.userBox').stop().fadeOut(200);
				},200);
			}
		);
		//打开更改密码浮层的按钮
		$('#openModifyPwdPopupBtn').on('click', function() {
			_openModifyPwdPopup();
			return false;
		});

		//更改密码浮层：关闭按钮
		_nodes.$modifyPwdPopup.find('[data-node="closeBtn"]').on('click', function() {
			_closeModifyPwdPopup();
			return false;
		});

		//更改密码浮层：提交按钮
		_nodes.$modifyPwdPopup.find('[data-node="submitBtn"]').on('click', function() {
			//正在提交状态中
            if(_util.checkBtnIsLoading($(this))){
                return false;
            }

			var originalPwd = _nodes.$modifyPwdPopup.find('[data-node="originalPwdInput"]').val(),
				newPwd = _nodes.$modifyPwdPopup.find('[data-node="newPwdInput"]').val(),
				repeatNewPwd = _nodes.$modifyPwdPopup.find('[data-node="repeatNewPwdInput"]').val();

			_modifyPwd($(this), originalPwd, newPwd, repeatNewPwd);
			return false;
		});

		//再次输入新密码的输入框
		_nodes.$modifyPwdPopup.find('[data-node="repeatNewPwdInput"]').on('keyup', function(event) {
			//回车
			if (event.keyCode === 13) {
				_nodes.$modifyPwdPopup.find('[data-node="submitBtn"]').trigger('click');
			}
		});
	}

	/**
	 * 修改vip管理密码
	 * @param {object} $btn 提交按钮的jquery对象
	 * @param  {string} originalPwd  原始密码
     * @param  {string} newPwd       新密码
     * @param  {string} repeatNewPwd 重复输入的新密码
	 */
	function _modifyPwd($btn, originalPwd, newPwd, repeatNewPwd){
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

        _util.updateBtnText($btn, 'loading');

        _util.request({
            url: _ajaxUrls.modifyPwd,
            type: 'post',
            dataType: 'json',
            data: {
                'old_password' : originalPwd,
				'new_password' : newPwd,
				'repeat_password': repeatNewPwd
            },
            success: function(json) {
                if (!json) {
                   _dialog.alert('返回数据格式异常，请稍后再试');
                   return;
                }

                if(json.status){
					_closeModifyPwdPopup();
                    _dialog.alert(json.info || '更改成功');
                }else{
                    _dialog.alert(json.info || '操作失败，请稍后再试');
                }
            },
            error: function() {
                _dialog.alert('操作失败，请稍后再试');
            },
            complete : function(){
				_util.updateBtnText($btn, 'default');
                _isRequesting = 0;
            }
        });
	}

	/**
	 * 打开修改密码浮层
	 */
	function _openModifyPwdPopup(){
		if(!_maskByModifyPwd){
			_maskByModifyPwd = new _mask(_nodes.$modifyPwdPopup);
		}

		if(_maskByModifyPwd){
			//清空密码输入框
			_nodes.$modifyPwdPopup.find('input[type="password"]').val('');
			_maskByModifyPwd.open();
		}
	}

	/**
	 * 关闭修改密码浮层
	 */
	function _closeModifyPwdPopup(){
		if(_maskByModifyPwd){
			_maskByModifyPwd.close();
		}
	}
	_util.initNameSpace("CS.page.layout");
    CS.page.layout.main = {
        'init': init,
        'updateMsgNotice': updateMsgNotice
    };
})(jQuery);