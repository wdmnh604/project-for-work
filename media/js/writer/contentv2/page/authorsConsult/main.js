/**
 * 作家咨询: 咨询列表页
 * @namespace CS.page.consult.main
 * @update 2015-12-16
 */
(function($) {
	//外部依赖
	var _util = CS.util,
		_uiBinder = CS.uiBinder,
		_mask = CS.mask,
		_dialog = CS.dialog,
		_layout = null; //主模版

	var _params = {}, //参数列表
		_nodes = {}, //页面元素的对象集合
		_selectedYear = '', //当前选中的年份
		_maskByCreateConsultPopup = null, //遮罩层实例对象
		_pager = null, //分页组件的实例对象列表
		_isRequesting = 0, //是否正在请求
		_isGettingConsult = 0;//是否正在获取咨询列表

	//提示文字集合
	var _tips = {
		'moreQuestionContent' : "请把问题描述的更详细一点, 至少20个字！",
		'lessQuestionContent' : "请把问题描述的简要一点, 不能超过500字！",
		'submitQuestionSuccess' : "问题提交成功， 请等待处理。"
	};

    //网站logo列表
    var _siteLogo = {
		0: 'system', //系统
		1 : 'cs', //创世
		2 : 'yq', //云起
		3 : 'qd', //起点女生
		4 : 'qd', //其他
		5 : 'qd' //起点男生
    };

    //站点名称
    var _siteName = {
		0: '系统通知',
		1 : '创世中文网',
		2 : '云起书院',
		3 : '起点女生',
		4 : '其他',
		5 : '起点男生'
    };

    //咨询列表的模板
    var _msgListTpl = [
		'<%each list as item index%>',
			'<li data-msgid="<%=item.IDX%>">',
				'<div class="sourceIcon">',
					'<img src="<%=item.siteLogo%>">',
					'<%if item.type != 1 && item.unReadCount > 0%><cite data-node="unReadCountBox" class="icon"><%=item.unReadCount%></cite><%/if%>',
				'</div>',
				'<div class="msgText">',
					'<p><em><%=item.createtime%></em><span><%=item.siteName%></span>',
					'<%if item.type != 1 && item.className %><i>|</i><cite><%=item.className%></cite><%/if%>',
					'</p>',
					'<div class="reply-content">',
						'<p class="btn fr">',
							'<a data-node="deleteBtn" data-msgid="<%=item.IDX%>" href="javascript:">删除</a>',
							//非系统消息
							'<%if item.type != 1%>',
								'<span>|</span><a class="reply" href="<%=item.url%>">回复</a>',
							'<%/if%>',
						'</p>',
						'<p class="<%=item.type == 1 ? \'system\' : \'default\'%>"><%==item.content%></p>',
					'</div>',
				'</div>',
			'</li>',
		'<%/each%>'
    ].join('');

	var _ajaxUrls = {
		'getMsgList': '/Contentv2/Authors/getQuestionList.html', //获取咨询列表
		'sendMsg' : '/Contentv2/Authors/sendMessage.html', //发送新咨询
		'deleteMsg': '/Contentv2/Authors/delQuestion.html', //删除咨询
		'clearMsg': '/Contentv2/Authors/delAllQuestions.html', //清空咨询
		'markMsg': '/Contentv2/Authors/markAllThemeRead.html' //标记查看过的咨询
	};

	/**
	 * 初始化
	 * @param {string} imgUrl 图片地址
	 */
	function init(imgUrl){
		_params.imgUrl = imgUrl || '';

		_layout = CS.page.layout.main;

		_nodes.$msgList = $('#consultList'); //消息列表
		_nodes.$yearSelect = $('#yearSelect'); //年份选择器
		_nodes.$createConsultPopup = $('#createConsultPopup'); //创建咨询浮层

		_setSelectedYear();
		_getMsgList(1);
		_bindEvent();
	}

	/**
	 * 绑定页面元素的事件
	 */
	function _bindEvent(){
		//美化select
        $('select').comboSelect();

        //查看咨询的按钮
		$('#queryMsgBtn').on('click', function(event) {
			event.preventDefault();

			_setSelectedYear();
			_pager = null;
			_getMsgList(1);
		});

		//打开创建咨询浮层的按钮
		$('#openCreateConsultPopupBtn').on('click', function(){
			_openCreateConsultPopup();
			return false;
		});

		//创建咨询浮层: 关闭按钮
		_nodes.$createConsultPopup.find('[data-node="closeBtn"]').on('click', function() {
			_closeCreateConsultPopup();
			return false;
		});

		//创建咨询浮层: 提交按钮
		_nodes.$createConsultPopup.find('[data-node="submitBtn"]').on('click', function() {
			var from = _nodes.$createConsultPopup.find('[data-node="siteSelect"]').val(),
				type = _nodes.$createConsultPopup.find('[data-node="questionTypeSelect"]').val(),
				content = _nodes.$createConsultPopup.find('[data-node="questionContent"]').val();

			_sendMsg(from, type, content);
			return false;
		});

		//删除单条咨询的按钮
		_nodes.$msgList.on('click', '[data-node="deleteBtn"]', function() {
			var $el = $(this);

			_dialog.confirm('删除咨询后将不可恢复，确认删除吗？', function(){
				var msgid = $el.attr('data-msgid');
					
				_deleteMsg(msgid);
			});
			
			return false;
		});

		//标记全部为已读的按钮
		$('#markMsgBtn').on('click', function() {
			//隐藏未读数的标记容器
			_nodes.$msgList.find('[data-node="unReadCountBox"]').hide();

			//标记已经读过该咨询
			_markMsg();
			return false;
		});

		//清空咨询的按钮
		$('#clearMsgBtn').on('click', function() {
			_dialog.confirm('清空咨询后将不可恢复，确认清空吗？', function() {
				_clearMsg();
			});
			return false;
		});
	}

	/**
	 * 获取咨询列表
	 * @param  {int} page 页码（默认1）
	 */
	function _getMsgList(page){
		if(_isGettingConsult){
            return;
        }
        _isGettingConsult = 1;

        var $btnBox = $('#msgBtnBox'), //按钮容器
			$noMsgBox = $('#noMsgBox'); //暂无消息的提示容器

		_nodes.$msgList.empty();
		$btnBox.hide();
		$noMsgBox.hide();

        _util.request({
            url: _ajaxUrls.getMsgList,
            type: 'post',
            dataType: 'json',
            data: {
                'page': page,
                'year': _getSelectedYear()
            },
            success: function(json) {
                if (!json) {
                   _dialog.alert('返回数据格式异常，请稍后再试');
                   return;
                }

                if(json.status && json.data){
					if(!json.data.list || json.data.list.length === 0){
						//暂无消息
						$noMsgBox.show();
					}else{
						$.each(json.data.list, function(index, item){
							var siteType = item.type == 1 ? 0 : item.site,
								siteLogo = _siteLogo[siteType];

							//网站logo
							json.data.list[index].siteLogo = siteLogo ? (_params.imgUrl +'/contentv2/'+ siteLogo +'.png') : '';
							json.data.list[index].siteName = _siteName[siteType] || '';
						});

						var tpl = _uiBinder.bindData(_msgListTpl, {
							'list': json.data.list
						});

						$btnBox.show();
						_nodes.$msgList.html(tpl);
					}

					if(!_pager){
						_pager = $('#pager').pagination(json.data.pageCount, {
							'callback': _getMsgList
						});
					}
                }else{
                    _dialog.alert(json.info || '操作失败，请稍后再试');
                }
            },
            error: function() {
                _dialog.alert('操作失败，请稍后再试');
            },
            complete : function(){
                _isGettingConsult = 0;
            }
        });
	}

	/**
	 * 发送新咨询
	 * @param  {string} questionFrom            问题出处
	 * @param  {string} questionType    问题分类
	 * @param  {string} questionContent 问题描述
	 */
	function _sendMsg(questionFrom, questionType, questionContent){
		questionContent = $.trim(questionContent);

		var contentLength = questionContent.length;
		if (contentLength < 20) {
			_dialog.alert(_tips.moreQuestionContent);
			return;
		}
		if (contentLength > 500) {
			_dialog.alert(_tips.lessQuestionContent);
			return;
		}
		if(_isRequesting){
            return;
        }
        _isRequesting = 1;

        _util.request({
            url: _ajaxUrls.sendMsg,
            type: 'post',
            dataType: 'json',
            data: {
                'siteSelect': questionFrom,
                'questionTypeSelect' : questionType,
                'questionContentInput' : questionContent
            },
            success: function(json) {
                if (!json) {
                   _dialog.alert('返回数据格式异常，请稍后再试');
                   return;
                }

				if (json.status) {
					_closeCreateConsultPopup();

					_dialog.alert(json.info || '发送成功', function() {
						//刷新当前页
						location.href = location.href;
					});
				} else {
					_dialog.alert(json.info || '操作失败，请稍后再试');
				}
            },
            error: function() {
                _dialog.alert('操作失败，请稍后再试');
            },
            complete : function(){
                _isRequesting = 0;
            }
        });
	}

	/**
	 * 标记收件箱中读过的咨询
	 */
	function _markMsg(){
		if(_isRequesting){
            return;
        }
        _isRequesting = 1;

        _util.request({
            url: _ajaxUrls.markMsg,
            type: 'post',
            dataType: 'json',
            data: {
                'year': _getSelectedYear()
            },
            isShowLoading : false, //不显示加载提示效果
            success: function(json) {
                
            },
            error: function() {
                
            },
            complete : function(){
                _isRequesting = 0;
                //更新消息提示
				_layout.updateMsgNotice();
            }
        });
	}

	/**
	 * 删除咨询
	 * @param  {string} msgId 咨询id
	 */
	function _deleteMsg(msgId){
		if(!msgId){
			return;
		}

		if(_isRequesting){
            return;
        }
        _isRequesting = 1;
        _util.request({
            url: _ajaxUrls.deleteMsg,
            type: 'post',
            dataType: 'json',
            data: {
                'IDX': msgId,
                'year': _getSelectedYear()
            },
            success: function(json) {
				if (!json) {
                   _dialog.alert('返回数据格式异常，请稍后再试');
                   return;
                }

                if(json.status){
                    _dialog.alert(json.info || '删除成功');
                    
					//移除该条咨询
					_nodes.$msgList.find('li[data-msgid="'+ msgId +'"]').remove();
                }else{
                    _dialog.alert(json.info || '操作失败，请稍后再试');
                }
            },
            error: function() {
                _dialog.alert('操作失败，请稍后再试');
            },
            complete : function(){
                _isRequesting = 0;
                //更新消息提示
				_layout.updateMsgNotice();
            }
        });
	}

	/**
	 * 清空咨询
	 */
	function _clearMsg(){
		if(_isRequesting){
            return;
        }
        _isRequesting = 1;

        _util.request({
            url: _ajaxUrls.clearMsg,
            type: 'post',
            dataType: 'json',
            data: {
                'year' : _getSelectedYear()
            },
            success: function(json) {
				if (!json) {
                   _dialog.alert('返回数据格式异常，请稍后再试');
                   return;
                }

                if(json.status){
                    _dialog.alert(json.info || '清空成功');
                    _pager = null;
                    _getMsgList(1);
                }else{
                    _dialog.alert(json.info || '操作失败，请稍后再试');
                }
            },
            error: function() {
                _dialog.alert('操作失败，请稍后再试');
            },
            complete : function(){
                _isRequesting = 0;
            }
        });
	}

	/**
	 * 打开创建咨询浮层
	 */
	function _openCreateConsultPopup(){
		if(!_maskByCreateConsultPopup){
			_maskByCreateConsultPopup = new _mask(_nodes.$createConsultPopup);
		}
		if(_maskByCreateConsultPopup){
			var $siteSelect = _nodes.$createConsultPopup.find('[data-node="siteSelect"]'),
				$questionTypeSelect = _nodes.$createConsultPopup.find('[data-node="questionTypeSelect"]');

			//选中第一个选项
			$siteSelect.val($siteSelect.find('option').eq(0).val());
			$questionTypeSelect.val($questionTypeSelect.find('option').eq(0).val());
			$siteSelect.comboSelect();
			$questionTypeSelect.comboSelect();

			_nodes.$createConsultPopup.find('[data-node="questionContent"]').val('');

			_maskByCreateConsultPopup.open();
		}
	}

	/**
	 * 关闭创建咨询浮层
	 */
	function _closeCreateConsultPopup(){
		if(_maskByCreateConsultPopup){
			_maskByCreateConsultPopup.close();
		}
	}

	/**
	 * 获取选中的年份
	 * @return {string} 年份（比如：2015）
	 */
	function _getSelectedYear(){
		return _selectedYear ? _selectedYear : _nodes.$yearSelect.val();
	}

	/**
	 * 设置选中的年份
	 */
	function _setSelectedYear(){
		_selectedYear = _nodes.$yearSelect.val();
	}
	
	_util.initNameSpace("CS.page.consult");
    CS.page.consult.main = {
        'init': init
    };
})(jQuery);