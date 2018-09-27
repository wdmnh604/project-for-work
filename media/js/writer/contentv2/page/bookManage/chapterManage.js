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
        _currentChapterData = {}, //当前章节的数据
        _currentVolumeData = {}, //当前分卷的数据
        _hasPortamento = 0, //是否设置过章节按钮一栏的滑动定位
        _blackColor = '#333'; //黑色文字的style

    //章节类型名称的对照表
    var _chapterTypeName = {
        '-1' : '公众章节',
        '1' : 'VIP章节',
        '2' : '章节感言'
    };

    var _ajaxUrls = {
        'getChapterInfo' : '/Contentv2/Booknovels/ajaxGetchapter.html', //获取章节信息
        'getVolumeInfo': '/Contentv2/Booknovels/ajaxGetVolume.html', //获取分卷信息
        'getWords': '/Contentv2/Booknovels/ajaxGetwords.html', //统计字数
        'addGuidedLog': '/Contentv2/Authors/addGuideBookLog.html', //添加完成新手引导的记录
        'addGuideVolumeLog': '/Contentv2/Authors/addGuideVolumeLog.html', //添加完成章节引导的记录
        'deleteChapter': '/Contentv2/Booksubmit/ajaxChapterDel.html' //删除正常章节
    };

    var _isTipByExitEdit = 0, //离开编辑模式时，是否需要提示
        _tipByExitEdit = "您编辑的章节内容尚未保存，确定要离开吗？"; //离开编辑模式时的提示

     /**
     * 初始化
     * @param {int} bookId 作品id
     * @param {int} isVipNovel 是否为vip作品(1:vip -1：普通)
     * @param {string} newVolumeName 新分卷的名称
     * @param {int} isGuide 是否需要新手引导
     * @param {int} isGuideVolume 是否需要章节的新手引导
     */
    function init(bookId, isVipNovel, newVolumeName, isGuide, isGuideVolume,isAddChapterUrl,allchapter) {
        _params.bookId = bookId || 0;
        _params.isVipNovel = isVipNovel || -1;
        _params.newVolumeName = newVolumeName || '新建分卷';
        _params.isGuide = isGuide || 0;
        _params.isGuideVolume = isGuideVolume || 0;
        _params.isAddChapterUrl =isAddChapterUrl || 0;
        _params.allchapter = allchapter || 0;

        _volume = CS.page.bookManage.volume; //分卷组件

        _setTipByRefreshPage();

        //避免页面未渲染完就显示，导致提示框错位
        setTimeout(_setGuide, 200);

        _bindEvent();
        _bindEventByChapterList();
        _bindEventByEditChapter();
        _bindEventByEditVolume();
        _bindEventBySlimScroll();
        _bindEventByBubble();

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

        if(_params.isGuideVolume){
            //关闭新建章节悬浮提示
            $('.minTipBox .close').click(function(){
                $(this).parent('.minTipBox').hide();
                //添加已经完成引导的记录
                _util.request({
                    url: _ajaxUrls.addGuideVolumeLog,
                    data: {},
                    type: 'post',
                    isShowLoading : false, //不显示加载提示效果
                    dataType: "json"
                });
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
     * 绑定元素事件
     */
    function _bindEvent(){
        //编辑章节按钮
        $('#editChapterBtn').on('click', function(event) {
            event.preventDefault();
            _editChapter(_currentChapterData);
        });

        //删除章节按钮
        $('#deleteChapterBtn').on('click', function(event) {
            event.preventDefault();
            if(_params.allchapter == 1)
            {
               _dialog.confirm("删除该章后作品将会被自动屏蔽，确认删除吗？", function() {
                    _deleteChapter(_currentChapterData.CCID);
               });
            }else
            {
                _deleteChapter(_currentChapterData.CCID);
            }
        });

        //编辑分卷按钮
        $('#editVolumeBtn').on('click', function(event) {
            event.preventDefault();
            _editVolume(_currentVolumeData);
        });
    }

    /**
     * 开启自定义滚动条
     */
    function _bindEventBySlimScroll(){
        $('#chapterList').slimScroll({
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
     * 绑定提示气泡的事件
     */
    function _bindEventByBubble(){
        //过长的标题显示气泡
        $('#chapterListWrap').append('<div id="sectionBubble" class="section-bubble"><p></p><span class="icon"></span></div>');

        var $sectionList = $('#chapterList'),
            $sectionBubble = $('#sectionBubble'),
            $bubbleText = $sectionBubble.find('p');

        $sectionList.on('mouseover', '.sub-volume, .sectionBox p em', function () {
            var $this = $(this),
                scrollWidth = $this.get(0).scrollWidth,
                offsetWidth = $this.width();

            if(offsetWidth === scrollWidth){
                return;
            }

            var txtPos = $this.position(),
                bubbleTop = txtPos.top,
                bubbleLeft = txtPos.left;

            $bubbleText.text($this.text());

            $sectionBubble.css({
                top: bubbleTop + 115 + 'px',
                left: bubbleLeft + 'px'
            }).show();
        });

        $sectionList.on('mouseout', '.sub-volume, .sectionBox p em', function () {
            $sectionBubble.hide();
        });
    }

    /**
     * 绑定章节列表的元素事件
     */
    function _bindEventByChapterList() {
        var $chapterList = $('#chapterList'), //左侧的章节列表
            $volumeItems = $chapterList.find('[data-node="volumeItem"]'), //分卷项目
            $chapterItemList = $chapterList.find('[data-node="chapterItemList"]'), //分卷下的章节列表
            $chapterItems = $chapterList.find('[data-node="chapterItem"]'); //章节项目

        //单个卷
        $chapterList.on('click', '[data-node="volumeItem"]', function(){
            var $el = $(this);

            //开着要关闭
            if($el.hasClass('act')){
                //收拢
                $el.next('[data-node="chapterItemList"]').slideUp(300);
                $el.removeClass('act');
            }else{ //关着要展开
                _confirmExitEdit(function(){
                    var $currentChapterBox = $el.next('[data-node="chapterItemList"]');

                    if($currentChapterBox.is(':hidden')){
                        $chapterItemList.slideUp(300);
                        $el.next('[data-node="chapterItemList"]').slideDown(300);
                    }

                    $volumeItems.removeClass('act');
                    $chapterItems.removeClass('act');
                    $el.addClass('act');

                    _getVolumeInfo($el.attr('data-volumeid'));
                });
            }
        });

        //单个章节
        $chapterList.on('click', '[data-node="chapterItem"]', function() {
            var $el = $(this);

            _confirmExitEdit(function(){
                $el.addClass('act').siblings().removeClass('act');
                $volumeItems.removeClass('act');
                _getChapterInfo($el.attr('data-chapterid'));
            });
        });
        
        //新建卷的按钮
        $('#createVolumeBtn, #createVolumeIconBtn').on('click', function() {
            //去掉章节列表高亮
            $chapterList.find('li').removeClass('act');

            _confirmExitEdit(_editVolume);
            return false;
        });
    }

    /**
     * 绑定编辑章节的元素事件
     */
    function _bindEventByEditChapter(){
        var $chapterContentInput = $('#chapterContentInput');

        //章节标题、内容、作者的话输入框
        $('#chapterTitleInput, #chapterContentInput, #authorSpeakInput')
            .on('focus', function(event) {
                event.preventDefault();
                _focusIn($(this));
            })
            .on('blur', function(event) {
                event.preventDefault();
                _focusOut($(this));
            });

        //统计字数
        $('#checkContentWordsBtn').on('click', function(event) {
            event.preventDefault();
            _getWords($chapterContentInput.val());
        });

        //保存章节按钮
        $('#saveChapterBtn').on('click', function(event) {
            event.preventDefault();
            if(_checkChapterInfo()){
                _saveChapter();
            }
        });
    }

    /**
     * 绑定编辑分卷的元素事件
     */
    function _bindEventByEditVolume(){
        var $volumeTitleInput = $('#volumeTitleInput'),
            $volumeDescInput = $('#volumeDescInput');

        //保存分卷的按钮
        $('#saveVolumeBtn').on('click', function() {
            var type = $(this).attr('data-type'), //操作类型(add: 添加, update: 修改)
                isVip = _params.isVipNovel,
                volumeName = $volumeTitleInput.val(),
                volumeDesc = $volumeDescInput.val(),
                volumeId = 0;

            //修改分卷信息
            if(type === 'update'){
                isVip = _currentVolumeData.isvip;
                volumeId = _currentVolumeData.CVID;
            }else if(type === 'add'){ //新建分卷
                //最新一卷的id
                volumeId = $('#chapterList').find('[data-node="volumeItem"]:first').attr('data-volumeid') || 0;
            }

            _volume.submitVolume({
                'bookId' : _params.bookId, //作品id
                'type': type, //操作类型（add: 添加，update: 修改, delete: 删除）
                'isVip': isVip, //是否vip卷(1:vip, -1: 普通)
                'volumeName': volumeName, //卷标题
                'volumeDesc': volumeDesc, //卷描述
                'volumeId': volumeId, //卷id (可选: 添加分卷不用传)
                'alertType': 'topTip', //提示方式(alert：居中浮层提示/topTip：顶部提示)
                'successCallback': _refreshCurrentPage //成功后的回调函数
            });

            return false;
        });

        //删除分卷的按钮
        $('#deleteVolumeBtn').on('click', function() {
            _dialog.confirm('确定要删除该卷吗？', function(){
                _volume.submitVolume({
                    'bookId' : _params.bookId, //作品id
                    'type': 'delete', //操作类型（add: 添加，update: 修改, delete: 删除）
                    'isVip': _currentVolumeData.isvip, //是否vip卷(1:vip, -1: 普通)
                    'volumeId': _currentVolumeData.CVID, //卷id (可选: 添加分卷不用传)
                    'alertType': 'topTip', //提示方式(alert：居中浮层提示/topTip：顶部提示)
                    'successCallback': _refreshCurrentPage //成功后的回调函数
                });
            });
            
            return false;
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
     * 编辑章节
     * @param  {object} data 章节数据
     */
    function _editChapter(data){
        if(!data){
            return;
        }

        _setTipByExitEdit();

        $('#chapterIdHidden').val(data.CCID); //章节id
    
        var $chapterContainer = $('#chapterContainer'),
            $editChapterBox = $('#editChapterBox'),
            $titleInput = $('#chapterTitleInput'), //标题
            $contentInput = $('#chapterContentInput'), //内容
            $speakInput = $('#authorSpeakInput'), //作者的话
            $editChapterBtnBox = $('#editChapterBtnBox'); //章节按钮容器

        $titleInput.val(data.chaptertitle || $titleInput.attr('data-default'));
        $contentInput.val(data.content || $contentInput.attr('data-default'));
        $speakInput.val(data.chapterextra || $speakInput.attr('data-default'));

        //初始化输入框的文字颜色
        $.each([$titleInput, $contentInput, $speakInput], function(index, $el){
            if($el.val() === $el.attr('data-default')){
                $el.css('color', '');
            }else{
                $el.css('color', _blackColor);
            }
        });

        if(data.vipflag > 0 && !data.ismodifytitle){
            //不能修改标题
            $titleInput.attr('readonly', 'readonly').css('color', '');
        }else{
            $titleInput.removeAttr('readonly');
        }

        //章节类型名称
        $editChapterBox.find('[data-node="chapterTypeName"]').text(_chapterTypeName[data.chaptertype]);
        
        //编辑分卷容器
        $('#volumeContainer').hide();
        //查看章节容器
        $('#viewChapterBox').hide();
        //编辑章节容器
        $editChapterBox.show();
        //章节容器
        $chapterContainer.show();

        //没有设置过悬浮
        if($editChapterBtnBox.attr('data-slide') !== '1'){
            $editChapterBtnBox.attr('data-slide', '1');

            //设置成悬浮
            $editChapterBtnBox.portamento({
                'wrapper': $chapterContainer,
                'disableWorkaround': true,
                'gap': 0
            });
        }
    }

    /**
     * 查看分卷
     * @param {object} data 卷数据
     */
    function _viewVolume(data){
        var $volumeContainer = $('#volumeContainer'),
            $viewVolumeBox = $('#viewVolumeBox'),
            $viewVolumeEditBox = $('#viewVolumeEdit'), //操作容器
            $btnBox = $('#viewVolumeBtnBox'), //按钮容器          
            $contentBox = $viewVolumeBox.find('[data-node="contentBox"]'), //查看分卷的内容容器
            $viewContentBox = $viewVolumeBox.find('[data-node="viewContentBox"]'); //查看分卷的内容容器

        //卷序号名称
        $viewVolumeBox.find('[data-node="volumeSortName"]').text(data.volumeSortName);
        //卷包含的章节数
        $viewVolumeBox.find('[data-node="chapterCount"]').text(data.volumechapters);
        //卷名称
        $('#volumeTitle').text(data.volumename);
        //卷描述
        $('#volumeDesc').text(data.volumedesc);

        //作品相关（系统默认卷，无需修改标题和说明）
        if(data.volumetype === '0'){
            $viewVolumeEditBox.hide();
            $contentBox.hide();
            $viewContentBox.hide();
        }else{
            $viewVolumeEditBox.show();
            $viewContentBox.show();
            $contentBox.show();

        }

        //章节容器
        $('#chapterContainer').hide();
        //编辑分卷容器
        $('#editVolumeBox').hide();
        //查看分卷容器
        $viewVolumeBox.show();
        //分卷容器
        $volumeContainer.show();

        //没有设置过悬浮
        if($btnBox.attr('data-slide') !== '1'){
            $btnBox.attr('data-slide', '1');

            //设置成悬浮
            $btnBox.portamento({
                'wrapper': $volumeContainer,
                'disableWorkaround': true,
                'gap': 0
            });
        }
    }

    /**
     * 编辑分卷
     * @param {object} data 卷数据
     */
    function _editVolume(data){
        var $volumeContainer = $('#volumeContainer'),
            $editVolumeBox = $('#editVolumeBox'),
            $volumeSortName = $editVolumeBox.find('[data-node="volumeSortName"]'), //分卷序号名称
            $chapterCountBox = $editVolumeBox.find('[data-node="chapterCountBox"]'), //章节数容器
            $chapterCount = $editVolumeBox.find('[data-node="chapterCount"]'), //本卷章节数
            $volumeTitleInput = $('#volumeTitleInput'), //卷标题输入框
            $volumeDescInput = $('#volumeDescInput'), //卷介绍输入框
            // $deleteVolumeBtn = $('#deleteVolumeBtn'); //删除按钮
            $saveVolumeBtn = $('#saveVolumeBtn'), //保存按钮
            $contentBox = $editVolumeBox.find('[data-node="contentBox"]'); //修改分卷的内容容器

        _cancelTipByExitEdit();

        //修改
        if(data){
            $volumeSortName.text(data.volumeSortName);
            $chapterCount.text(data.volumechapters);
            $chapterCountBox.show();
            $volumeTitleInput.val(data.volumename);
            $volumeDescInput.val(data.volumedesc);

            $saveVolumeBtn.attr('data-type', 'update'); //修改
            // $deleteVolumeBtn.show();

            //作品相关（系统默认卷，无需修改标题和说明）
            if(data.volumesort === '0'){
                $contentBox.hide();
            }else{
                $contentBox.show();
            }
        }else{ //新建
            //新卷名称
            $volumeSortName.text(_params.newVolumeName);
            $chapterCountBox.hide();
            $volumeTitleInput.val('');
            $volumeDescInput.val('');

            $saveVolumeBtn.attr('data-type', 'add'); //新建
            // $deleteVolumeBtn.hide();
            $('#chapterCountView').text('');
            $contentBox.show();
        }

        //编辑章节容器
        $('#chapterContainer').hide();
        //查看分卷容器
        $('#viewVolumeBox').hide();
        //编辑分卷容器
        $editVolumeBox.show();
        //编辑分卷容器
        $volumeContainer.show();
    }

    /**
     * 获取章节信息
     * @param {int} CCID 章节id
     */
    function _getChapterInfo(CCID) {
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
                'CBID': _params.bookId,
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
                    //查看章节
                    _viewChapter(_currentChapterData);
                } else {
                    _topTip.show(json.info || '操作失败，请稍候再试');
                }
            },
            error: function() {
                _topTip.show('操作失败，请稍候再试');
            },
            complete : function(){
                _isLoading = 0;
            }
        });
    }

    /**
     * 获取分卷信息
     * @param  {string} CVID 卷id
     */
    function _getVolumeInfo(CVID){
        if(!CVID){
            return;
        }

        if(_isLoading){
            return;
        }
        _isLoading = 1;

        _util.request({
            url: _ajaxUrls.getVolumeInfo,
            data: {
                'CBID': _params.bookId,
                'CVID': CVID
            },
            type: 'post',
            dataType: "json",
            success: function(json) {
                if (!json) {
                    return;
                }

                if (json.status) {
                    _currentVolumeData = json.data;
                    _viewVolume(json.data);
                } else {
                    _topTip.show(json.info || '操作失败，请稍候再试');
                }
            },
            error: function() {
                _topTip.show('操作失败，请稍候再试');
            },
            complete : function(){
                _isLoading = 0;
            }
        });
    }

    /**
     * 获取字数
     * @param  {string} content 内容
     */
    function _getWords(content){
        if(content){
            content = $.trim(content);
        }
        if(!content || content === $('#chapterContentInput').attr('data-default')){
            _dialog.alert('字数为：0');
            return;
        }

        if(_isLoading){
            return;
        }
        _isLoading = 1;

        _util.request({
            url: _ajaxUrls.getWords,
            data: {
                'content': content
            },
            type: 'post',
            dataType: "json",
            success: function(json) {
                if (!json) {
                    _topTip.show('返回的数据格式异常，请稍候再试');
                    return;
                }

                if (json.status) {
                    if('data' in json){
                        _dialog.alert('字数为：'+json.data);
                    }
                } else {
                    _topTip.show(json.info || '操作失败，请稍候再试');
                }
            },
            error: function() {
                _topTip.show('操作失败，请稍候再试');
            },
            complete : function(){
                _isLoading = 0;
            }
        });
    }

     /**
     * 保存章节
     */
    function _saveChapter(){
        if(_isSubmitting){
            return;
        }
        _isSubmitting = 1;

        //动态提交保存章节的表单
        _util.ajaxSubmitForm($('#formChapter'), {
            type : "POST",
            data : {
                '_token': $.cookie('pubtoken')
            },
            dataType : "json",
            success : function(json){
                if(!json){
                    _topTip.show('返回的数据格式异常，请稍候再试');
                    return;
                }

                //成功
                if(json.status){
                    _topTip.show(json.info || '保存成功', function(){
                        _cancelTipByExitEdit();
                        //刷新页面
                        _refreshCurrentPage();
                    });
                }else{
                    _topTip.show(json.info || '操作失败，请稍候再试');
                }
            },
            error : function(){
                _topTip.show('操作失败，请稍候再试');
            },
            complete : function(){
                _isSubmitting = 0;
            }
        });
    }

    /**
     * 检测章节信息是否有效
     * @return {boolean} 是否有效
     */
    function _checkChapterInfo() {
        var $chapterTitleInput = $('#chapterTitleInput'),
            $chapterContentInput = $('#chapterContentInput'),
            $authorSpeakInput = $('#authorSpeakInput');

        var chaptertitle = $.trim($chapterTitleInput.val()),
            content = $chapterContentInput.val(),
            authorSpeak = $authorSpeakInput.val();

        // 章节名称
        if (chaptertitle.length === 0 || chaptertitle === $chapterTitleInput.attr('data-default')) {
            _dialog.alert('请输入章节名称');
            $chapterTitleInput.focus();
            return false;
        }
        if (chaptertitle.length > 35) {
            _dialog.alert('请输入35字以内作为章节名称');
            $chapterTitleInput.focus();
            return false;
        }

        // 正文
        if (content.length === 0 || content === $chapterContentInput.attr('data-default')) {
            _dialog.alert('请输入正文');
            $chapterContentInput.focus();
            return false;
        }

        // 作者的话
        if (authorSpeak === $authorSpeakInput.attr('data-default')) {
            authorSpeak = '';
            $authorSpeakInput.val('');
        }
        if (authorSpeak.length > 500) {
            _dialog.alert('作者的话不可超过500字');
            $authorSpeakInput.focus();
            return false;
        }

        return true;
    }

    /**
     * 检测用户是否修改过章节内容
     * @return {bool} 是否修改过
     */
    function _checkChapterIsModified(){
        var isModified = false;

        var $chapterTitleInput = $('#chapterTitleInput'),
            $chapterContentInput = $('#chapterContentInput'),
            $authorSpeakInput = $('#authorSpeakInput');

        var list = [
            {
                'userInput' : $chapterTitleInput.val(), //用户输入
                'defaultInput': $chapterTitleInput.attr('data-default'), //默认输入
                'original': _currentChapterData.chaptertitle //原始内容
            },
            {
                'userInput' : $chapterContentInput.val(),
                'defaultInput': $chapterContentInput.attr('data-default'),
                'original': _currentChapterData.content
            },
            {
                'userInput' : $authorSpeakInput.val(),
                'defaultInput': $authorSpeakInput.attr('data-default'),
                'original': _currentChapterData.chapterextra
            }
        ];

        $.each(list, function(index, item){
            if(item.userInput !== item.original && item.userInput !== item.defaultInput){
                isModified = true;
                //跳出循环
                return false;
            }
        });

        return isModified;
    }

    /**
     * 删除章节
     * @param {string} CCID 章节id
     */
    function _deleteChapter(CCID){
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
                'CBID': _params.bookId,
                'CCID' : CCID
            },
            success: function(json) {
                if (!json) {
                    _topTip.show('返回数据格式异常，请稍后再试');
                    return;
                }

                if(json.status){
                    _topTip.show(json.info || '删除成功', function(){
                        _cancelTipByExitEdit();
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
     * 设置刷新或关闭页面时的提示
     */
    function _setTipByRefreshPage() {
        //刷新或关闭窗口
        window.onbeforeunload = function() {
            //不需要提示，或用户没有修改过章节内容
            if(!_isTipByExitEdit || !_checkChapterIsModified()){
                return;
            }

            var tips = _tipByExitEdit;

            if (document.all) { //ie
                //右上角关闭按钮 或 alt+F4 或 ctrl+w
                if (event.clientX > document.body.clientWidth || event.clientY < 0 || event.altKey || event.ctrlKey) {
                    return tips; //关闭窗口
                } else {
                    return tips; //刷新或跳转
                }
            } else {
                return tips; //刷新、跳转、关闭
            }
        };
    }

    /**
     * 确定是否离开编辑模式
     * @param {function} exitFn 离开编辑模式后的回调函数
     */
    function _confirmExitEdit(exitFn){
        if(typeof exitFn !== 'function'){
            exitFn = function(){};
        }
       
        //处于编辑模式中，且用户修改了章节内容
        if(_isTipByExitEdit && _checkChapterIsModified()){
            _dialog.confirm(_tipByExitEdit, exitFn);
        }else{
            exitFn();
        }
    }

    /**
     * 设置退出编辑模式时的提示
     */
    function _setTipByExitEdit(){
        _isTipByExitEdit = 1;
    }

    /**
     * 取消退出编辑模式时的提示
     */
    function _cancelTipByExitEdit(){
        _isTipByExitEdit = 0;
    }

    /**
     * 刷新当前页
     */
    function _refreshCurrentPage(){
        location.href = location.href;
    }

    /**
     * 输入框获得焦点
     * @param  {object} $el 输入框元素的jquery对象
     */
    function _focusIn($el) {
        if($el.attr('readonly')){
            return;
        }

        if ($el.val() === $el.attr('data-default')) {
            $el.val('');
        }

        $el.css('color', _blackColor);
    }

    /**
     * 输入框失去焦点
     * @param  {object} $el 输入框元素的jquery对象
     */
    function _focusOut($el) {
        if($el.attr('readonly')){
            return;
        }
        
        if ($el.val() === '') {
            $el.val($el.attr('data-default')).css('color', '');
        }
    }

    _util.initNameSpace("CS.page.bookManage");
    CS.page.bookManage.chapterManage = {
        'init': init
    };
})(jQuery);