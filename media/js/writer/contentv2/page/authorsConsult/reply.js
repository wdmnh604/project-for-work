/**
 * 作家咨询: 回复页面
 * @namespace CS.page.consult.reply
 * @update 2015-12-16
 */
(function($) {
	//外部依赖
	var _util = CS.util,
		_uiBinder = CS.uiBinder,
		_dialog = CS.dialog,
		_layout = null; //主模版

	var _params = {}, //参数列表
		_nodes = {}, //页面元素的对象集合
		_isRequesting = 0, //是否正在请求
		_isGettingReplyList = 0,//是否正在获取回复列表
		_replyContentMinWords = 20, //回复内容允许最少的字数
		_replyContentMaxWords = 500, //回复内容允许最多的字数
		_msgListUrl = '/Authors/authorconsultlist.html'; //消息列表页地址

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

    //发件箱咨询列表的模板
    var _replyListTpl = [
		'<%each list as item index%>',
			'<li data-replyid="<%=item.IDX%>">',
				'<div class="sourceIcon"><img src="<%=item.logoUrl%>"></div>',
				'<div class="msgText">',
					'<p><em><%=item.createtime%></em><span><%=item.userName%>：</span></p>',
					'<p class="btn"><%=item.content%></p>',
				'</div>',
			'</li>',
		'<%/each%>'
    ].join('');

	var _ajaxUrls = {
		'getReplyList': '/Contentv2/Authors/getQuestionRepsById.html', //获取回复列表
		'sendReply' : '/Contentv2/Authors/sendQuestionReps.html', //发送回复
		'deleteReply': '/Contentv2/Authors/delPosQuestion.html', //删除回复
		'deleteMsg': '/Contentv2/Authors/delQuestion.html', //删除消息
		'markMsg': '/Contentv2/Authors/markThemeReadByIDX.html' //标记消息为已读
	};

	/**
	 * 初始化
	 * @param {string} msgId 消息id
	 * @param {string} year 消息的年份
	 * @param {int} siteType 站点类型
	 * @param {string} authorHead 作家头像地址
	 * @param {string} imgUrl 图片地址
	 */
	function init(msgId, year, siteType, authorHead, imgUrl){
		_params.msgId = msgId || '';
		_params.year = year || '';
		_params.siteType = siteType || 0;
		_params.imgUrl = imgUrl || '';
		_params.authorHead = authorHead || _params.imgUrl +'/contentv2/dafult_photo.png';

		_layout = CS.page.layout.main;

		_nodes.$replyList = $('#replyList'); //回复列表
		_nodes.$replyContentInput = $('#replyContentInput'); //回复内容的输入框

		_getReplyList();
		_markMsg();
		_bindEvent();
	}

	/**
	 * 绑定页面元素的事件
	 */
	function _bindEvent(){
		//发送回复的按钮
		$('#sendReplyBtn').on('click', function(event) {
			event.preventDefault();
			_sendReply(_nodes.$replyContentInput.val());
		});

		//删除消息的按钮
		$('#deleteMsgBtn').on('click', function(event) {
			event.preventDefault();
			_dialog.confirm('删除会话后将不可恢复，确认删除吗？', function() {
				_deleteMsg();
			});
		});
		
		//删除单条回复的按钮
		// _nodes.$replyList.on('click', '[data-node="deleteBtn"]', function() {
		// 	var $el = $(this);

		// 	_dialog.confirm('删除回复后将不可恢复，确认删除吗？', function(){
		// 		var replyId = $el.attr('data-replyid');
			
		// 		_deleteReply(replyId);
		// 	});
			
		// 	return false;
		// });
	}

	/**
	 * 标记消息为已读
	 */
	function _markMsg(){
        _util.request({
            url: _ajaxUrls.markMsg,
            type: 'post',
            dataType: 'json',
			data: {
				'IDX': _params.msgId,
				'year': _params.year
			},
            isShowLoading : false, //不显示加载提示效果
            success: function(json) {
                
            },
            error: function() {
                
            },
            complete : function(){
                //更新消息提示
				_layout.updateMsgNotice();
            }
        });
	}

	/**
	 * 获取回复列表
	 */
	function _getReplyList(){
		if(_isGettingReplyList){
            return;
        }
        _isGettingReplyList = 1;

        _util.request({
            url: _ajaxUrls.getReplyList,
            type: 'post',
            dataType: 'json',
            data: {
                'IDX': _params.msgId,
                'year': _params.year
            },
            success: function(json) {
                if (!json) {
                   _dialog.alert('返回数据格式异常，请稍后再试');
                   return;
                }

                if(json.status){
					if(json.data && json.data.list && json.data.list.length > 0){
						var siteLogo = _params.imgUrl +'/contentv2/'+ _siteLogo[_params.siteType] +'.png',
							siteName = _siteName[_params.siteType];

						$.each(json.data.list, function(index, item){
							//是否作家本人
							//rtype: 1：作家  2：编辑等内部人员（空也表示内部人员）
							var isAuthor = item.rtype == 1;
							
							json.data.list[index].logoUrl = isAuthor ? _params.authorHead : siteLogo;
							json.data.list[index].userName = isAuthor ? '我 对 '+ siteName+'说' : siteName;
						});

						var tpl = _uiBinder.bindData(_replyListTpl, {
							'list': json.data.list
						});

						_nodes.$replyList.html(tpl);
					}
                }else{
                    _dialog.alert(json.info || '操作失败，请稍后再试');
                }
            },
            error: function() {
                _dialog.alert('操作失败，请稍后再试');
            },
            complete : function(){
                _isGettingReplyList = 0;
            }
        });
	}

	/**
	 * 发送回复
	 * @param  {string} content 回复内容
	 */
	function _sendReply(content){
		content = $.trim(content);

		var contentLength = content.length;
		if (contentLength < _replyContentMinWords) {
			_dialog.alert('回复至少需要'+ _replyContentMinWords +'个字！');
			return;
		}
		if (contentLength > _replyContentMaxWords) {
			_dialog.alert('回复不能超过'+ _replyContentMaxWords +'字！');
			return;
		}
		if(_isRequesting){
            return;
        }
        _isRequesting = 1;

        _util.request({
            url: _ajaxUrls.sendReply,
            type: 'post',
            dataType: 'json',
            data: {
                'IDX': _params.msgId,
                'year': _params.year,
                'content' : content
            },
            success: function(json) {
                if (!json) {
                   _dialog.alert('返回数据格式异常，请稍后再试');
                   return;
                }

				if (json.status) {
					_dialog.alert(json.info || '发送成功');

					//清空回复内容输入框
					_nodes.$replyContentInput.val('');
					//重新获取回复列表
					_getReplyList();
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
	 * 删除回复
	 * @param  {string} replyId 回复id
	 */
	function _deleteReply(replyId){
		if(!replyId){
			return;
		}

		if(_isRequesting){
            return;
        }
        _isRequesting = 1;
        _util.request({
            url: _ajaxUrls.deleteReply,
            type: 'post',
            dataType: 'json',
            data: {
                'IDX': replyId,
                'year': _params.year
            },
            success: function(json) {
				if (!json) {
                   _dialog.alert('返回数据格式异常，请稍后再试');
                   return;
                }

                if(json.status){
                    _dialog.alert(json.info || '删除成功');
					//移除该条回复
					_nodes.$replyList.find('li[data-replyid="'+ replyId +'"]').remove();
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
	 * 删除咨询
	 */
	function _deleteMsg(){
		if(_isRequesting){
            return;
        }
		
        _isRequesting = 1;

        _util.request({
            url: _ajaxUrls.deleteMsg,
            type: 'post',
            dataType: 'json',
            data: {
                'IDX': _params.msgId,
                'year': _params.year
            },
            success: function(json) {
				if (!json) {
                   _dialog.alert('返回数据格式异常，请稍后再试');
                   return;
                }

                if(json.status){
					_dialog.alert(json.info || '删除成功', function() {
						//跳转到消息列表页
						location.href = _msgListUrl;
					});
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
	
	_util.initNameSpace("CS.page.consult");
    CS.page.consult.reply = {
        'init': init
    };
})(jQuery);