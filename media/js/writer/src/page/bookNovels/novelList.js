/**
 * 作品管理: 作品列表
 * @namespace CS.page.bookNovels.novelList
 * @update 2015-11-23
 */
(function($) {
	//外部依赖
	var _util = CS.util,
		_uiBinder = CS.uiBinder,
		_dialog = CS.dialog;

	var _params = {}, //参数集合
		_nodes = {}, //元素的对象列表
		_isRequesting = 0, //是否正在请求
		_isChecking = 0, //是否正在检测
		_pager = null; //翻页组件的实例对象

	var _ajaxUrls = {
		'checkNovelCreate': '/Home/Booknovels/ajaxchecknovelcreate.html', //创建作品前的检测
		'getNovelList': '/Home/Booknovels/ajaxnovels.html' //获取作品列表
	};

	//作品列表的模板
    var _novelListTpl = [
        '<%each list as item index%>',
            '<tr <%if index === 0%>class="active"<%/if%>>',
                '<td></td>',
                '<td class="tl">',
                    '<div class="work-photo">',
                        '<img src="<%=item.coverurl || imgUrl+\"/src/zwfm.jpg\"%>" width="83" height="92" alt="作品封面"/>',
                    '</div>',
                    '<p><%=item.title%></p>',
                '</td>',
                '<%if item.LastUpdateChapterName && item.newchapterid > 0 %>',
                    '<td class="tl"><a href="javascript:"><%=item.LastUpdateChapterName%></a></td>',
                    '<td><em class="Num"><%=item.LastChapterUpdateTime%></em></td>',
                '<%else%>',
                    '<td class="tl"><a href="javascript:">无最新章节</a></td>',
                    '<td><em class="Num"></em></td>',
                '<%/if%>',
                '<td><em class="Num"><%=item.Collect%></em></td>',
                '<td><%=item.status%></td>',
                '<td>',
                    '<div class="dib-wrap">',
                        '<a class="button blue" href="<%=item.addChapterUrl%>"><span class="icon"></span><i>写新章节</i></a>',
                        '<a class="button white" href="<%=item.ManageChapterUrl%>"><span class="icon"></span><i>已发布章节</i></a>',
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
	}

	/**
	 * 绑定元素事件
	 */
	function _bindEvent(){
		//创建作品按钮
		$('#createNovelBtn').on('click', function() {
			_checkNovelCreate();
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
	
	_util.initNameSpace("CS.page.bookNovels");
    CS.page.bookNovels.novelList = {
        'init': init
    };
})(jQuery);