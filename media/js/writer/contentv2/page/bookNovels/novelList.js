/**
 * 作品管理: 作品列表
 * @namespace CS.page.bookNovels.novelList
 * @update 2015-10-10
 */
(function($) {
	//外部依赖
	var _util = CS.util,
		_uiBinder = CS.uiBinder,
        _topTip = CS.topTip, //顶部提示
		_dialog = CS.dialog;

	var _params = {}, //参数集合
		_nodes = {}, //元素的对象列表
		_isRequesting = 0, //是否正在请求
		_isChecking = 0, //是否正在检测
        _isSubmitting=0,//
        _isCheckrealname =0; //检查实名认证
		_pager = null; //翻页组件的实例对象

	var _ajaxUrls = {
		'checkNovelCreate': '/Contentv2/Booknovels/ajaxchecknovelcreate.html', //创建作品前的检测
		'getNovelList': '/Contentv2/Booknovels/ajaxnovels.html', //获取作品列表
        'updateNovelStatus': '/Contentv2/Booksubmit/updatestatus.html', //修改审核不通过的作品状态
        'checkRealname':'/Contentv2/Authorrealname/ajaxCheckRealname'   //检查实名认证的情况
	};

	//作品列表的模板
    var _novelListTpl = [
        '<%each list as item index%>',
        '<tr <%if index === 0%>class="active"<%/if%>>',
        '<td></td>',
        '<td class="tl">',
        '<div class="work-photo">',
        '<a href="<%=item.bookTitleUrl%>" target="_blank">' +
        '<img src="<%=item.coverurl || imgUrl+\"/contentv2/zwfm.png\"%>" width="83" height="108" alt="作品封面"/></a>',
        '</div>',
        '<p class="work-name"><a href="<%=item.bookTitleUrl%>" target="_blank"><%=item.title%></a></p>',
        '</td>',
        '<%if item.lastchaptertitle && item.newchapterid > 0 %>',
        '<td class="tl"><a href="<%=item.ChaterUrl%>" target="_blank"><%=item.lastchaptertitle%></a><br/><em class="time"><%=item.lastnewchaptertime%></em></td>',
        '<%else%>',
        '<td class="tl"><a href="javascript:">无最新章节</a></td>',
        '<%/if%>',
        '<%if item.isManNovel == true %>',
        '<td><em><%=item.categoryName%>编辑组</em></td>',
        '<%else%>',
        '<td><em>第<%=item.authorgroupv2%>编辑组</em></td>',
        '<%/if%>',
        '<td><em class="Num"><%=item.favNum%></em></td>',
        '<td><%=item.statusName%><%if item.auditstatus == 20 %><a data-cbid="<%=item.CBID%>" href="javascript:"><font color="#4ea8ff">重新审核</font></a><%/if%></td>',
        '<td>',
        '<div class="dib-wrap">',
        '<a class="button blue" url-chapter="<%=item.addChapterUrl%>" data-catid=<%=item.categoryid%> href="javascript:"><span class="icon"></span><i>写新章节</i></a>',
        '<a class="button white" url-chapter="<%=item.ManageChapterUrl%>" data-catid=<%=item.categoryid%> href="javascript:" ><span class="icon"></span><i>已发布章节</i></a>',
        '</div>',
        '</td>',
        '</tr>',
        '<%/each%>'
    ].join('');

	/**
	 * 初始化
	 */
	function init(imgUrl){
		_params.imgUrl = imgUrl || '';

		_nodes.$novelList = $('#novelList'); //作品列表
		_nodes.$pager = $('#pager'); //翻页组件

		_getNovelList(1);
		_bindEvent();
        _againCheckNovel();

        _filterManhuaNovel();
	}

	/**
	 * 绑定元素事件
	 */
	function _bindEvent(){
		//创建作品按钮
		$('#createNovelBtn').on('click', function() {
            _checkRealname('_checkNovelCreate','');
			// _checkNovelCreate();
			return false;
		});

        //单个作品条目
        $('#novelList').on('mouseenter', 'tr', function() {
            $(this).addClass('active').siblings('tr').removeClass('active');
        });
	}

	/**
	 * 获取作品列表
	 * @param  {int} page 页码（默认1）
	 */
	function _getNovelList(page){
		if(_isRequesting){
            return;
        }
        _isRequesting = 1;

        _nodes.$novelList.empty();
        _nodes.$pager.hide();

        _util.request({
            url: _ajaxUrls.getNovelList,
            type: 'post',
            dataType: 'json',
            data: {
                'p': page
            },
            success: function(json) {
				if(!json){
					return;
				}

				//成功
                if(json.status){
					//没有数据
					if(!json.data.list || json.data.list.length === 0){
						$('#bookManageNone').removeClass('hidden');
						$('#bookManageExist').addClass('hidden');
						return;
					}else{
						var tpl = _uiBinder.bindData(_novelListTpl, {
							'list': json.data.list,
							'imgUrl': _params.imgUrl
						});

						_nodes.$novelList.html(tpl);
						_nodes.$pager.show();
						
						if(!_pager){
							_pager = _nodes.$pager.pagination(json.data.pageCount, {
								'callback': _getNovelList
							});

							//作者的作品总数
							$('#bookCount').text(json.data.bookCount);
						}
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
    function _filterManhuaNovel()
    {
        $('#novelList').on('click','[url-chapter]',function(){
            var catid=$(this).attr('data-catid');
            var urlchapter=$(this).attr('url-chapter');
            if(catid == 40001)
            {
                _dialog.alert('功能开发中，敬请期待。');
                return;
            }
            _checkRealname('_filterManhuaNovelv2',urlchapter);
            
        });
        
    }
    function _filterManhuaNovelv2(urlchapter)
    {
         location.href = urlchapter;
    }
    function _againCheckNovel(){
        $('#novelList').on('click','[data-cbid]',function(){
            var CBID = $(this).attr('data-cbid');
            _dialog.confirm("请依据站内短信的审核意见修改章节内容，重新提<br>交后编辑将会在2个工作日内审核，确认提交吗", function() {

                if(!CBID){
                    return;
                }
                _checkRealname('_againCheckNovelv2',CBID);
            });
            return false;
        });
    }
    function _againCheckNovelv2(CBID)
    {
        if(_isSubmitting){
            return;
        }
        _isSubmitting = 1;
        _util.request({
                    url: _ajaxUrls.updateNovelStatus,
                    type: 'post',
                    dataType: 'json',
                    data: {
                        'CBID': CBID
                    },
                    success: function(json) {
                        if (!json) {
                            _dialog.alert('返回数据格式异常，请稍后再试');
                            return;
                        }

                        if(json.status){
                            _topTip.show(json.info || '操作成功', function(){
                                //刷新页面
                                location.href = location.href;
                            });
                        }else{
                            _dialog.alert(json.info || '操作失败，请稍后再试');
                        }
                    },
                    error: function() {
                        _dialog.alert('操作失败，请稍后再试');
                    },
                    complete : function(){
                        _isSubmitting = 0;
                    }
                });
    }

	/**
	 * 创建作品前的检测
	 */
	function _checkNovelCreate(){
		if(_isChecking){
            return;
        }
        _isChecking = 1;

        _util.request({
            url: _ajaxUrls.checkNovelCreate,
            type: 'post',
            dataType: 'json',
            data: {},
            success: function(json) {
				if(!json){
					_dialog.alert('返回数据异常，请稍候再试');
					return;
				}

				//成功
                if(json.status){
					var url = $('#createNovelBtn').attr('data-url');

					if(url){
						//跳转到创建作品页
						location.href = url;
					}
                }else{
                    _dialog.alert(json.info || '操作失败，请稍后再试');
                }
            },
            error: function() {
                _dialog.alert('操作失败，请稍后再试');
            },
            complete : function(){
                _isChecking = 0;
            }
        });
	}
    /**
     * [_checkRealname 检查实名认证]
     * @return {[type]} [description]
     */
    function _checkRealname(func,CBID)
    {
        if(_isCheckrealname){
            return;
        }
        _isCheckrealname = 1;

        _util.request({
            url: _ajaxUrls.checkRealname,
            type: 'post',
            dataType: 'json',
            data: {},
            success: function(json) {
                if(!json){
                    _dialog.alert('返回数据异常，请稍候再试');
                    return;
                }
                //成功
                if(json.status){
                    if(json.code==20001)
                    {
                        _dialog.alert(json.info);
                        return;
                    }
                    if(json.code==20002)
                    {
                        window.location.href=json.url;
                        return;
                    }                    
                }else
                {
                    if(func=='_checkNovelCreate')
                    {
                        _checkNovelCreate();
                        return;
                    }
                    if(func=='_againCheckNovelv2')
                    {
                        _againCheckNovelv2(CBID);
                        return;
                    }
                    if(func=='_filterManhuaNovelv2')
                    {
                        _filterManhuaNovelv2(CBID);
                        return;
                    }
                }
            },
            error: function() {
                _dialog.alert('操作失败，请稍后再试');
            },
            complete : function(){
                _isCheckrealname = 0;
            }
        });
    }
	
	_util.initNameSpace("CS.page.bookNovels");
    CS.page.bookNovels.novelList = {
        'init': init
    };
})(jQuery);