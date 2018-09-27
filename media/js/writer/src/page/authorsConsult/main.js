/**
 * 作家咨询
 * @namespace CS.page.consult.main
 * @update 2015-8-10
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
		_maskByCreateConsultPopup = null, //遮罩层实例对象
		_isRequesting = 0, //是否正在请求
		_isGettingConsult = 0;//是否正在获取咨询列表

	//分页组件的实例对象列表
    var _pager = {
        'send': null,
        'receive': null
    };
	//提示文字集合
	var _tips = {
		'moreQuestionContent' : "请把问题描述的更详细一点, 至少20个字！",
		'lessQuestionContent' : "请把问题描述的简要一点, 不能超过500字！",
		'submitQuestionSuccess' : "问题提交成功， 请等待处理。"
	};
    //网站logo列表
    var _siteLogo = {
		0: 'cs', //创世
		1 : 'cs', //创世
		2 : 'yq', //云起
		3 :	'qd',  //起点
		5 :	'qd'  //起点
    };

    //站点名称
    var _siteName = {
		0: '创世中文网',
		1 : '创世中文网',
		2 : '云起书院',
		3 : '起点中文网',
		5 : '起点中文网'
    };

    //收件箱咨询列表的模板
    var _receiveListTpl = [
		'<%each list as item index%>',
			'<li data-questionid="<%=item.MsgId%>">',
				'<a data-node="lookBtn" data-questionid="<%=item.MsgId%>" class="link<%if item.ReadStatus !== 0%> visited<%/if%>" href="javascript:;">',
					'<span <%if item.ReadStatus === 0%>class="on"<%/if%> ></span>',
					'<cite class="time"><%=item.UpdateTime%></cite>',
					'<em class="minLogo <%=item.siteLogo%>"></em>',
					'<b><%=item.siteName%><i class="line">|</i><%=item.MsgContent%></b>',
				'</a>',
				'<div class="detailMsgBox">',
					'<a data-node="deleteBtn" data-type="receive" data-questionid="<%=item.MsgId%>" class="icon del" href="javascript:;"></a>',
					'<p><%=item.MsgContent%></p>',
				'</div>',
			'</li>',
		'<%/each%>'
    ].join('');

    //发件箱咨询列表的模板
    var _sendListTpl = [
		'<%each list as item index%>',
			'<li data-questionid="<%=item.MesgId%>">',
				'<a data-node="lookBtn" class="link" data-questionid="<%=item.MesgId%>" href="javascript:;">',
					'<span></span>',
					'<cite class="time"><%=item.CreateTime%></cite>',
					'<em class="minLogo <%=item.siteLogo%>"></em>',
					'<b><%=item.siteName%><i class="line">|</i><%=item.MesgContent%></b>',
				'</a>',
				'<div class="detailMsgBox">',
					'<a data-node="deleteBtn" data-type="send" data-questionid="<%=item.MesgId%>" class="icon del" href="javascript:;"></a>',
					'<p><%=item.MesgContent%></p>',
				'</div>',
			'</li>',
		'<%/each%>'
    ].join('');

	var _ajaxUrls = {
		'getReceiveList': '/Home/Authors/receiveList.html', //获取收件箱的咨询列表
		'getSendList': '/Home/Authors/sendList.html', //获取发件箱的咨询列表
		'sendConsult' : '/Home/Authors/sendMessage.html', //发送新咨询
		'markConsult': '/Home/Authors/markMessage.html', //标记查看过收件箱咨询
		'deleteConsult': '/Home/Authors/delMessage.html', //删除咨询
		'clearSendBox' : '/Home/Authors/clearSendBox.html', //清空发件箱
		'clearReceiveBox': '/Home/Authors/clearReceiveBox.html' //清空收件箱
	};

	/**
	 * 初始化
	 * @param {string} currentReceiveQuestionId 当前要查看的收件箱消息id
	 */
	function init(currentReceiveQuestionId){
		_params.currentReceiveQuestionId = currentReceiveQuestionId || '';

		_layout = CS.page.layout.main;

		_nodes.$createConsultPopup = $('#createConsultPopup'); //创建咨询浮层

		_getConsultList('receive', 1, _viewReceiveMsg);
		_bindEvent();
	}

	/**
	 * 查看单条收件箱消息
	 */
	function _viewReceiveMsg(){
		if(!_params.currentReceiveQuestionId){
			return;
		}

		//对应的单条收件箱消息容器
		var $item = $('#receiveList [data-node="lookBtn"][data-questionid="'+ _params.currentReceiveQuestionId +'"]');

		_toggleMsgItem($item);
		_viewReceiveMsgItem($item);
	}

	/**
	 * 绑定页面元素的事件
	 */
	function _bindEvent(){
		//美化select
        $('select').comboSelect();

         //页签切换
        $('#tabBox span').on('click', function() {
			var tabType = $(this).attr('data-type');

			_switchMsgTab(tabType);

			return false;
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

			_sendConsult(from, type, content);
			return false;
		});

		//查看单条咨询
		$('#receiveList, #sendList').on('click', '[data-node="lookBtn"]', function() {
			_toggleMsgItem($(this));
			return false;
		});

		//收件箱：查看单条咨询
		$('#receiveList').on('click', '[data-node="lookBtn"]', function() {
			_viewReceiveMsgItem($(this));
			return false;
		});

		//收件箱：全部标记为已读
		$('#markAllReadBtn').on('click', function() {
			var arrQuestionId = [];

			//未读标记
			$('#receiveList [data-node="lookBtn"]').each(function(index, el){
				var $el = $(el);

				arrQuestionId.push($el.attr('data-questionid'));
				//移除未读标记
				$el.find('span.on').removeClass('on');
				$el.addClass('visited');
			});

			if(arrQuestionId.length === 0){
				_dialog.alert('没有未读的咨询');
				return false;
			}

			//标记已经读过该咨询
			_markConsult(arrQuestionId.join(','));
			return false;
		});

		//删除单条咨询的按钮
		$('#receiveList, #sendList').on('click', '[data-node="deleteBtn"]', function() {
			var $el = $(this);

			_dialog.confirm('删除咨询后将不可恢复，确认删除吗？', function(){
				var questionId = $el.attr('data-questionid');
					type = $el.attr('data-type'); //咨询类型（send/receive）

				_deleteConsult(type, questionId);
			});
			
			return false;
		});

		//清空咨询的按钮
		$('#clearReceiveBoxBtn, #clearSendBoxBtn').on('click', function() {
			var $el = $(this);

			_dialog.confirm('清空咨询后将不可恢复，确认清空吗？', function(){
				var type = $el.attr('data-type'), //咨询类型（send/receive）
					$list = type === 'receive' ? $('#receiveList ') : $('#sendList'),
					arrQuestionId = [];

				$list.find('li').each(function(index, el) {
					var questionId = $(el).attr('data-questionid');
					if(questionId){
						arrQuestionId.push(questionId);
					}
				});
				
				_clearConsult(type, arrQuestionId.join(','));
			});
			return false;
		});
	}

	/**
	 * 切换消息类型的页签
	 * @param  {string} tabType 页签类型(receive/send)
	 */
	function _switchMsgTab(tabType){
		var $tabBox = $('#tabBox'),
			$tab = $tabBox.find('[data-type="'+ tabType +'"]');

		if(!$tab || $tab.length === 0){
			return;
		}

		var $contentList = $('#contentBox [data-node="content"]'), //内容列表
			$receiveBtnBox = $('#receiveBtnBox'), //收件箱的按钮容器
			$sendBtnBox = $('#sendBtnBox'); //发件箱的按钮容器

		$tab.addClass('act').siblings().removeClass('act');
		$contentList.eq($tabBox.find('span').index($tab)).show().siblings().hide();

		//发件箱页签
		if(tabType === 'send'){
			$receiveBtnBox.hide();
		}else if(tabType === 'receive'){ //收件箱页签
			$sendBtnBox.hide();
		}

		_pager[tabType] = null;
		_getConsultList(tabType, 1);
	}

	/**
	 * 展开/关闭单条消息
	 * @param {object} $el 开关按钮的jquery对象
	 */
	function _toggleMsgItem($el){
		if(!$el || $el.length === 0){
			return;
		}

		var $li = $el.parent('li');

		//开着需要关
		if($li.hasClass('act')){
			$li.removeClass('act');
			$li.find('.detailMsgBox').slideUp(300);
		}else{ //关着需要开
			$li.siblings('li').removeClass('act').find('.detailMsgBox').slideUp(300);
			$li.addClass('act').find('.detailMsgBox').slideDown(300);
		}
	}

	/**
	 * 查看收件箱的单条消息
	 * @param  {object} $msgItem 消息元素的jquery对象
	 */
	function _viewReceiveMsgItem($msgItem){
		if(!$msgItem || $msgItem.length === 0){
			return;
		}

		var $redpoint = $msgItem.find('span.on');

		if($redpoint.length === 0){
			return;
		}

		var questionId = $msgItem.attr('data-questionid');

		//移除未读标记
		$redpoint.removeClass('on');
		$msgItem.addClass('visited');
		//标记已经读过该咨询
		_markConsult(questionId);
	}

	/**
	 * 获取咨询列表
	 * @param  {string} type        咨询类型
	 * @param  {int} page 页码（默认1）
	 * @param {function} successCallback 成功后的回调函数
	 */
	function _getConsultList(type, page, successCallback){
		if(_isGettingConsult){
            return;
        }
        _isGettingConsult = 1;

        var $list = null, //咨询列表
			$btnBox = null, //按钮容器
			$contentBox = $('#contentBox'),
			$noMsgBox = $('#noMsgBox'), //暂无消息的提示容器
			requestUrl = ''; //请求地址

		if(type === 'send'){ //发件箱
			$list = $('#sendList');
			$btnBox = $('#sendBtnBox');
			requestUrl = _ajaxUrls.getSendList;
		}else if(type === 'receive'){ //收件箱
			$list = $('#receiveList');
			$btnBox = $('#receiveBtnBox');
			requestUrl = _ajaxUrls.getReceiveList;
		}

		$contentBox.hide();
		$list.empty();
		$btnBox.hide();
		$noMsgBox.hide();

        _util.request({
            url: requestUrl,
            type: 'get',
            dataType: 'json',
            data: {
                'page': page
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
						var tpl = type === 'send' ? _sendListTpl : _receiveListTpl;

						$.each(json.data.list, function(index, item){
							//网站logo
							json.data.list[index].siteLogo = _siteLogo[item.site] || '';
							json.data.list[index].siteName = _siteName[item.site] || '';
						});

						tpl = _uiBinder.bindData(tpl, {'list': json.data.list});
						$btnBox.show();
						$list.html(tpl);
						$contentBox.show();
					}

					if(typeof successCallback === 'function'){
						successCallback();
					}

					if(!_pager[type]){
						var $pager = type === 'send' ? $('#sendPager') : $('#receivePager');

						_pager[type] = $pager.pagination(json.data.pageCount, {
							'callback': function(pageNo){
								_getConsultList(type, pageNo);
							}
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
	function _sendConsult(questionFrom, questionType, questionContent){
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
            url: _ajaxUrls.sendConsult,
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

                if(json.status){
					_closeCreateConsultPopup();
					//切换到发件箱
					_switchMsgTab('send');
                    _dialog.alert(json.info || '发送成功');
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
	 * 标记收件箱中读过的咨询
	 * @param  {string} questionIds 咨询id列表（用,分隔）
	 */
	function _markConsult(questionIds){
		if(!questionIds){
			return;
		}

		if(_isRequesting){
            return;
        }
        _isRequesting = 1;

        _util.request({
            url: _ajaxUrls.markConsult,
            type: 'post',
            dataType: 'json',
            data: {
                'questionId': questionIds
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
	 * @param  {string} type        咨询类型
	 * @param  {string} questionIds 咨询id列表（用,分隔）
	 */
	function _deleteConsult(tyep, questionIds){
		if(!questionIds){
			return;
		}

		if(_isRequesting){
            return;
        }
        _isRequesting = 1;

        _util.request({
            url: _ajaxUrls.deleteConsult,
            type: 'post',
            dataType: 'json',
            data: {
                'questionId': questionIds
            },
            success: function(json) {
				if (!json) {
                   _dialog.alert('返回数据格式异常，请稍后再试');
                   return;
                }

                if(json.status){
                    _dialog.alert(json.info || '删除成功');
                    //单条
                    if(questionIds.indexOf(',') === -1){
						var $list = type === 'send' ? $('#sendList') : $('#receiveList');
						//移除该条咨询
						$list.find('li[data-questionid="'+ questionIds +'"]').remove();
                    }else{
						_pager[type] = null;
						_getConsultList(type, 1);
                    }
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
	 * 清空咨询
	 * @param  {string} type        咨询类型
	 * @param {string} questionIds 咨询id列表（用逗号隔开）
	 */
	function _clearConsult(type, questionIds){
		if(!questionIds || questionIds.length === 0){
			_dialog.alert('咨询id未获取到');
			return;
		}

		if(_isRequesting){
            return;
        }
        _isRequesting = 1;

        var requestUrl = type === 'send' ? _ajaxUrls.clearSendBox : _ajaxUrls.clearReceiveBox;

        _util.request({
            url: requestUrl,
            type: 'post',
            dataType: 'json',
            data: {
                'questionId': questionIds
            },
            success: function(json) {
				if (!json) {
                   _dialog.alert('返回数据格式异常，请稍后再试');
                   return;
                }

                if(json.status){
                    _dialog.alert(json.info || '清空成功');
                    _pager[type] = null;
                    _getConsultList(type, 1);
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
	
	_util.initNameSpace("CS.page.consult");
    CS.page.consult.main = {
        'init': init
    };
})(jQuery);