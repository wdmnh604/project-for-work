/**
 * 作品管理：已发布章节的管理
 * @namespace CS.page.bookManage.chapterManage
 * @author  langtao
 * @update 2015-12-17
 */
(function($) {
    //外部依赖
    var _util = CS.util,
        _mask = CS.mask,
        _dialog = CS.dialog,
        _topTip = CS.topTip, //顶部提示
        _volume = null; //分卷组件

    var _params = {}; //参数集合

    var _isLoading = 0, //是否正在加载章节
        _isSubmitting = 0, //是否正在提交章节
        _currentChapterData = {}; //当前章节的数据

    //章节类型名称的对照表
    var _chapterTypeName = {
        '-1' : '公众章节',
        '1' : 'VIP章节',
        '2' : '章节感言'
    };

    var _ajaxUrls = {
        'getChapterInfo' : '/Contentv2/Booknovels/ajaxGetchapter.html', //获取章节信息
        'getWords': '/Contentv2/Booknovels/ajaxGetwords.html', //统计字数
        'deleteChapter': '/Contentv2/Booksubmit/ajaxChapterDelte.html', //删除回收站章节
        'recycleChapter': '/Contentv2/Booksubmit/ajaxChapterRecovery.html' //恢复回收站章节
    };

    //左侧草稿列表的单个草稿条目模板
    var _draftItemTpl = [
        '<li data-chapterid="<%=data.CCID%>" data-volumeid="<%=isPublishByTime ? data.CVID : 0%>">',
        '<div class="sectionBox">',
        '<p>',
        '<%if isPublishByTime%>',
        '<span class="icon time"></span>',
        '<%/if%>',
        '<em><%=data.chaptertitle || ""%></em>',
        '</p>',
        '<p class="f12">',
        '<i>',
        '<%if isPublishByTime%>',
        '<%=data.publishtime%>',
        '<%else%>',
        '<%=data.updatetime%>',
        '<%/if%>',
        '</i>',
        '共<%=data.actualwords || 0%>字',
        '</p>',
        '</div>',
        '</li>'
    ].join('');

     /**
     * 初始化
     * @param {int} CBID 作品id
     * @param {int} isVipNovel 是否为vip作品(1:vip -1：普通)
     * @param {int} chapterTmpUrl 草稿链接
     */
    function init(CBID, isVipNovel, chapterTmpUrl) {
        _params.CBID = CBID || 0;
        _params.isVipNovel = isVipNovel || -1;

        _bindEvent();
        _bindEventBySlimScroll();

        _renderFirstDraft();
        _renderRecentChapter();
    }

    /**
     * 渲染最新章节的内容
     */
    function _renderRecentChapter(){
        var $chapterList = $('#chapterList'),
            $recentChapter = $chapterList.find('[data-node="chapterItem"]').eq(0), //取最新章节
            chapterId = $recentChapter.attr('data-chapterid');

        if(chapterId){
             //包含该章节的章节列表容器
            var $chapterItemList = $recentChapter.parent();

            $chapterItemList.show();
            $recentChapter.addClass('act');
            _getChapterInfo(chapterId);
        }
    }

    /**
     * 绑定元素事件
     */
    function _bindEvent(){
        //草稿列表: 单条草稿
        $('#draftList').on('click', 'li', function() {
            var $el = $(this);

                var CCID = $el.attr('data-chapterid');
                //选中效果
                $el.addClass('act').siblings().removeClass('act');
                _getSelectedDraftInfo(CCID);

            return false;
        });

        //删除章节按钮
        $('#deleteChapterBtn').on('click', function(event) {
            event.preventDefault();
            _dialog.confirm("确定彻底删除该章节？", function() {
                _deleteChapter(_currentChapterData.CCID);
            });
        });

        //删除章节按钮
        $('#recoverChapterBtn').on('click', function(event) {
            event.preventDefault();
            _recycleChapter(_currentChapterData.CCID);
        });
    }

    /**
     * 开启自定义滚动条
     */
    function _bindEventBySlimScroll(){
        $('#draftList').slimScroll({
            height: '740px',
            disableFadeOut: true,
            railVisible: true,
            size: '10px',
            wheelStep: 10,
            borderRadius: 0,
            railBorderRadius:0,
            allowPageScroll: true,
            alwaysVisible:false,
            distance:'-1px'
        });

        $('#sectionText').slimScroll({
            height: '640px',
            disableFadeOut: true,
            railVisible: true,
            alwaysVisible:false,
            borderRadius: 0
        });

        $('#authorSpeak').slimScroll({
            height: '81px',
            disableFadeOut: true,
            railVisible: true,
            borderRadius: 0
        });
    }

    /**
     * 渲染第一个草稿的内容
     */
    function _renderFirstDraft(){
        //创建新章节
        var $firstDraft = $('#draftList li').eq(0),
            chapterId = $firstDraft.attr('data-chapterid');

        if(chapterId){
            $firstDraft.addClass('act');
            _getSelectedDraftInfo(chapterId);
        }
    }

    /**
     * 获取选中的草稿信息
     * @param {int} CCID 章节id
     * @param {function} successCallback 成功后的回调函数
     */
    function _getSelectedDraftInfo(CCID, successCallback) {
        if(!CCID){
            return;
        }

        //避免同时多次请求
        if(_isLoading){
            return;
        }
        _isLoading = 1;

        _util.request({
            url: _ajaxUrls.getChapterInfo,
            data: {
                'CBID': _params.CBID,
                'CCID': CCID
            },
            type: 'post',
            dataType: "json",
            success: function(json) {
                if (!json) {
                    return;
                }

                if (json.status && json.data) {
                    _currentChapterData = json.data;
                    //显示草稿的编辑模式
                    _viewChapter(_currentChapterData);

                    if(typeof successCallback === 'function'){
                        successCallback();
                    }
                } else {
                    _dialog.alert(json.info || '操作失败，请稍候再试');
                }
            },
            error: function() {
                _dialog.alert('操作失败，请稍候再试');
            },
            complete : function(){
                _isLoading = 0;
            }
        });
    }

    /**
     * 查看章节
     * @param  {object} data 章节数据
     */
    function _viewChapter(data){
        if(!data){
            return;
        }

        var $chapterContainer = $('#chapterContainer'),
            $viewChapterBox = $('#viewChapterBox'),
            $btnBox = $('#viewChapterBtnBox'); //按钮容器

        //章节类型名称
        $viewChapterBox.find('[data-node="chapterTypeName"]').text(_chapterTypeName[data.chaptertype]);
        //章节标题
        $('#chapterTitle').text(data.chaptertitle || '');
        //章节内容
        $('#chapterContent').html(data.chapterContentFormat || '' );
        //作者的话
        $('#authorSpeak').html(data.chapterExtraFormat || '');

        //编辑分卷容器
        $('#volumeContainer').hide();
        //编辑章节容器
        $('#editChapterBox').hide();
        //查看章节容器
        $viewChapterBox.show();
        //章节容器
        $chapterContainer.show();

        //没有设置过悬浮
        if($btnBox.attr('data-slide') !== '1'){
            $btnBox.attr('data-slide', '1');

            //设置成悬浮
            $btnBox.portamento({
                'wrapper': $chapterContainer,
                'disableWorkaround': true,
                'gap': 0
            });
        }
    }

    /**
     * 删除章节
     * @param {string} CCID 章节id
     */
    function _deleteChapter(CCID){
        console.log(CCID);
        if(!CCID){
            return;
        }
                           
        if(_isSubmitting){
            return;
        }
        _isSubmitting = 1;

        _util.request({
            url: _ajaxUrls.deleteChapter,
            type: 'post',
            dataType: 'json',
            data: {
                'CBID': _params.CBID,
                'CCID' : CCID
            },
            success: function(json) {
                if (!json) {
                    _topTip.show('返回数据格式异常，请稍后再试');
                    return;
                }

                if(json.status){
                    _topTip.show(json.info || '删除成功', function(){
                        //刷新页面
                        _refreshCurrentPage();
                    });
                }else{
                    _topTip.show(json.info || '操作失败，请稍后再试');
                }
            },
            error: function() {
                _topTip.show('操作失败，请稍后再试');
            },
            complete : function(){
                _isSubmitting = 0;
            }
        });
    }

    function _recycleChapter(CCID){
        if(!CCID){
            return;
        }

        if(_isSubmitting){
            return;
        }
        _isSubmitting = 1;

        _util.request({
            url: _ajaxUrls.recycleChapter,
            type: 'post',
            dataType: 'json',
            data: {
                'CBID': _params.CBID,
                'CCID' : CCID
            },
            success: function(json) {
                if (!json) {
                    _topTip.show('返回数据格式异常，请稍后再试');
                    return;
                }

                if(json.status){
                    _topTip.show(json.info || '删除成功', function(){
                        //刷新页面
                        _refreshCurrentPage();
                    });
                }else{
                    _topTip.show(json.info || '操作失败，请稍后再试');
                }
            },
            error: function() {
                _topTip.show('操作失败，请稍后再试');
            },
            complete : function(){
                _isSubmitting = 0;
            }
        });
    }

    /**
     * 刷新当前页
     */
    function _refreshCurrentPage(){
        location.href = location.href;
    }

    _util.initNameSpace("CS.page.bookManage");
    CS.page.bookManage.chapterRecycle = {
        'init': init
    };
})(jQuery);