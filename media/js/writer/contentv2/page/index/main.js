/**
 * 首页：新闻列表
 * @namespace CS.page.index.main
 * @update 2015-8-12
 */
(function($) {
	//外部依赖
	var _util = CS.util,
		_mask = CS.mask;
		_uiBinder = CS.uiBinder,
		_dialog = CS.dialog;

	var _params = {}, //参数集合
		_isRequesting = 0, //是否正在请求
		_pager = null //翻页组件的实例对象
		_maskByRelateRulePopup = null; //关联规则浮层的遮罩层组件的实例对象

	var _ajaxUrls = {
		'getNews': '/Contentv2/Index/news.html', //获取新闻列表
		'markNews': '/Contentv2/Index/addReadnewsMark.html', //标记查看过新闻
		'addGuidedLog': '/Contentv2/Authors/addGuideLog.html' //添加完成新手引导的记录
	};

	//新闻列表的模板
    var _newsListTpl = [
		'<%each list as item index%>',
			'<li>',
				'<a data-node="link" data-newsid="<%=item.IDX%>" class="link<%if item.mark !== 0%> visited<%/if%>" <%if item.Url == ""%>href="javascript:;"<%else%>href="<%=item.Url%>" target="_blank"<%/if%>>',
					'<em><%=item.Showtime%></em>',
					'<span <%if item.mark === 0%>class="on"<%/if%> ></span><%=item.Title%>',
					'<%if item.tag === "1"%>',
						'<img src="<%=imgUrl%>/contentv2/new.png" width="16" height="16">',
					'<%else if item.tag === "2"%>',
						'<img src="<%=imgUrl%>/contentv2/hot.png" width="16" height="16">',
					'<%else if item.tag === "3"%>',
						'<img src="<%=imgUrl%>/contentv2/new.png" width="16" height="16"><img src="<%=imgUrl%>/contentv2/hot.png" width="16" height="16">',
					'<%/if%>',
				'</a>',
				'<%if item.content != ""%>',
				'<div data-node="detail" class="detailNews">',
					'<span data-node="closeBtn" class="icon close" title="关闭"></span><%==item.content%>',
				'</div>',
				'<%/if%>',
			'</li>',
		'<%/each%>'
    ].join('');

	/**
	 * 初始化
	 * @param {string} imgUrl 图片地址
	 * @param {int} isGuide 是否需要新手引导
	 */
	function init(imgUrl, isGuide,is_new_editgroup_tip,newsid_default_open){
		_params.imgUrl = imgUrl || '';
		_params.isGuide = isGuide || 0;
		_params.is_new_editgroup_tip = is_new_editgroup_tip || '';
		_params.newsid_default_open = newsid_default_open || '';

		_getNews(1);

		_setGuide();
		_bindEvent();
		

	}

	function _setTip()
	{
		if(_params.is_new_editgroup_tip == '1')
		{
			if(!_maskByRelateRulePopup){
	            _maskByRelateRulePopup = new _mask($('#relateRulePopup'));
    	        _bindEventByRelateRulePopup();
        	}
        	if(_maskByRelateRulePopup){
            	_maskByRelateRulePopup.open();
        	}
			if(_params.newsid_default_open != '')
			{
				var $newsList = $('#newsList'); //新闻列表
				console.log($newsList.find('[data-newsid="'+ _params.newsid_default_open +'"]'));
				$newsList.find('[data-newsid="'+ _params.newsid_default_open +'"]').click();
			}
			_params.is_new_editgroup_tip='0';
		}
        
	}
	/**
     * 绑定关联规则浮层的元素事件
     */
    function _bindEventByRelateRulePopup(){
        $('#relateRulePopup').find('[data-node="close"]').on('click', function(event) {
            event.preventDefault();
            if(_maskByRelateRulePopup){
                _maskByRelateRulePopup.close();
            }
        });
    }
	/**
     * 设置新手引导
     */
    function _setGuide(){
        if(_params.isGuide){
            var $mask = $('#mask');

            //挡住右侧边栏官方推荐
            $mask.appendTo(document.body).show();

            $mask.on('click', _guideCallback);

            $(window).joyride({
                //引导完成后的回调函数
                'postRideCallback': _guideCallback
            });
        }
    }

    /**
     * 引导完成后的回调函数
     */
    function _guideCallback(){
		$('#mask').hide();

		//引导提示框
		$('.joyride-close-tip').parent().hide();

        //添加已经完成引导的记录
        _util.request({
            url: _ajaxUrls.addGuidedLog,
            data: {},
            type: 'post',
            isShowLoading : false, //不显示加载提示效果
            dataType: "json"
        });
    }

	/**
	 * 绑定页面元素的事件
	 */
	function _bindEvent(){
		var $newsList = $('#newsList'); //新闻列表

		//点击展开新闻
		$newsList.on('click', '[data-node="link"]', function() {
			var $detail = $(this).next('[data-node="detail"]');

			//开着需要关
			if($detail.is(':visible')){
				$(this).parent().removeClass('act');
				$detail.slideUp(300);
			}else{ //关着需要开
				$(this).parent().addClass('act').siblings('li').removeClass('act');
				$newsList.find('[data-node="detail"]').slideUp(300);
				$detail.slideDown(300);
				
				var $redpoint = $(this).find('span.on'); //小红点，未读提示
				if($redpoint.length > 0){
					$redpoint.removeClass('on');
					$(this).addClass('visited');
					_markNews($(this).attr('data-newsid'));
				}
			}

			//return false;
		});

		//收起当前展开的新闻
		$newsList.on('click', '[data-node="closeBtn"]', function() {
			$(this).parent().slideUp(300).parent().removeClass('act');
			return false;
		});
	}

	/**
	 * 获取新闻列表
	 * @param  {int} page 页码（默认1）
	 */
	function _getNews(page){
		if(_isRequesting){
            return;
        }
        _isRequesting = 1;

        _util.request({
            url: _ajaxUrls.getNews,
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
					var tpl = '';

					//没有数据
					if(!json.data.list || json.data.list.length === 0){
						tpl = '<li>暂无消息</li>';
					}else{
						tpl = _uiBinder.bindData(_newsListTpl, {
							'list': json.data.list,
							'imgUrl': _params.imgUrl
						});
					}
					
					$('#newsList').html(tpl);

					//强制编辑分组弹框
					_setTip();
					if(!_pager){
						_pager = $('#pagerBox').pagination(json.data.pageCount, {
							'callback': _getNews
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
                _isRequesting = 0;
            }
        });
	}

	/**
	 * 标记查看过新闻
	 * @param  {string} newsId 新闻id
	 */
	function _markNews(newsId){
		if(!newsId){
			return;
		}

		if(_isRequesting){
            return;
        }
        _isRequesting = 1;

        _util.request({
            url: _ajaxUrls.markNews,
            type: 'post',
            dataType: 'json',
            data: {
                'newsId': newsId
            },
            isShowLoading : false, //不显示加载提示效果
            success: function(json) {
                
            },
            error: function() {
                
            },
            complete : function(){
                _isRequesting = 0;
            }
        });
	}
	
	_util.initNameSpace("CS.page.index");
    CS.page.index.main = {
        'init': init
    };
})(jQuery);