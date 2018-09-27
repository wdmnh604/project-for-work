/**
 * 作品管理：已发布章节的管理
 * @namespace CS.page.bookManage.chapterManage
 * @author  langtao
 * @update 2015-10-10
 */
(function($) {
    //外部依赖
    var _util = CS.util,
        _mask = CS.mask,
        _dialog = CS.dialog;

    var _params = {}; //参数集合

    var _isLoading = 0, //是否正在加载章节
        _isSubmitting = 0, //是否正在提交章节
        _currentChapterData = {}, //当前章节的数据
        _currentVolumeData = {}, //当前分卷的数据
        _hasPortamento = 0, //是否设置过章节按钮一栏的滑动定位
        _blackColor = '#333'; //黑色文字的style

    var _ajaxUrls = {
        'getChapterInfo' : '/Content/Booknovels/ajaxGetchapter.html', //获取章节信息
        'getVolumeInfo': '/Content/Booknovels/ajaxGetVolume.html', //获取分卷信息
        'getWords': '/Content/Booknovels/ajaxGetwords.html', //统计字数
        'addGuidedLog': '/Content/Authors/addGuideBookLog.html', //添加完成新手引导的记录
        'addGuideVolumeLog': '/Content/Authors/addGuideVolumeLog.html', //添加完成章节引导的记录
        'submitVolume': '/Content/Booksubmit/volumeManageSubmit.html', //创建/更新分卷信息
        'deleteChapter': '/Content/Booksubmit/ajaxChapterDel.html' //删除正常章节
    };

    var _isTipByExitEdit = 0, //离开编辑模式时，是否需要提示
        _tipByExitEdit = "您编辑的章节内容尚未保存，确定要离开吗？"; //离开编辑模式时的提示

     /**
     * 初始化
     * @param {int} CBID 作品id
     * @param {int} isVipNovel 是否为vip作品(1:vip -1：普通)
     * @param {string} newVolumeName 新分卷的名称
     * @param {int} isGuide 是否需要新手引导
     * @param {int} isGuideVolume 是否需要章节的新手引导
     */
    function init(CBID, isVipNovel, newVolumeName, isGuide, isGuideVolume) {
        _params.CBID = CBID || 0;
        _params.isVipNovel = isVipNovel || -1;
        _params.newVolumeName = newVolumeName || '新建分卷';
        _params.isGuide = isGuide || 0;
        _params.isGuideVolume = isGuideVolume || 0;

        _setTipByRefreshPage();

        //避免页面未渲染完就显示，导致提示框错位
        setTimeout(_setGuide, 200);

        _bindEventByChapterList();
        _bindEventByEditChapter();
        _bindEventByEditVolume();

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
            var $chapterBox = $recentChapter.parent();

            $chapterBox.show();
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
     * 绑定章节列表的元素事件
     */
    function _bindEventByChapterList() {
        var $chapterList = $('#chapterList'), //左侧的章节列表
            $volumeItems = $chapterList.find('[data-node="volumeItem"]'), //分卷项目
            $chapterBox = $chapterList.find('[data-node="chapterBox"]'), //分卷下的章节容器
            $chapterItems = $chapterList.find('[data-node="chapterItem"]'); //章节项目

        //开启自定义滚动条
        $chapterList.slimScroll({
            height: '640px',
            railVisible: true,
            wheelStep: 5
        });

        //单个卷
        $chapterList.on('click', '[data-node="volumeItem"]', function(){
            var $el = $(this);

            //开着要关闭
            if($el.hasClass('act')){
                //收拢
                $el.next('[data-node="chapterBox"]').slideUp(300);
                $el.removeClass('act');
            }else{ //关着要展开
                _confirmExitEdit(function(){
                    var $currentChapterBox = $el.next('[data-node="chapterBox"]');

                    if($currentChapterBox.is(':hidden')){
                        $chapterBox.slideUp(300);
                        $el.next('[data-node="chapterBox"]').slideDown(300);
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
            $('.sectionList li').removeClass('act');

            _confirmExitEdit(_showEditVolume);
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
        $('#checkContentWordsBtn').on('click', function() {
            _getWords($chapterContentInput.val());
            return false;
        });

        //保存章节按钮
        $('#saveChapterBtn').on('click', function() {
            if(_checkChapterInfo()){
                _saveChapter();
            }
            return false;
        });

        //删除章节按钮
        $('#deleteChapterBtn').on('click', function() {
            _dialog.confirm("删除后不可恢复，你确定要删除此章吗？", function() {
                _deleteChapter(_currentChapterData.CCID);
            });
            return false;
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
                isvip = _params.isVipNovel,
                volumename = $volumeTitleInput.val(),
                volumedesc = $volumeDescInput.val(),
                CVID = 0;

            //修改分卷信息
            if(type === 'update'){
                isvip = _currentVolumeData.isvip;
                CVID = _currentVolumeData.CVID;
            }else if(type === 'add'){ //新建分卷
                //最新一卷的id
                CVID = $('#chapterList').find('[data-node="volumeItem"]:first').attr('data-volumeid') || 0;
            }

            _submitVolume(type, isvip, volumename, volumedesc, CVID);
            return false;
        });

        //删除分卷的按钮
        $('#deleteVolumeBtn').on('click', function() {
            
            _dialog.confirm('确定要删除该卷吗？', function(){
                var type = 'delete', //操作类型
                    isvip = _currentVolumeData.isvip,
                    volumename = '',
                    volumedesc = '',
                    CVID = _currentVolumeData.CVID;

                _submitVolume(type, isvip, volumename, volumedesc, CVID);
            });
            
            return false;
        });
    }

    /**
     * 显示编辑章节容器
     * @param  {object} data 章节数据
     */
    function _showEditChapter(data){
        if(!data){
            return;
        }

        _setTipByExitEdit();

        $('#chapterIdHidden').val(data.CCID); //章节id
    
        var $titleInput = $('#chapterTitleInput'), //标题
            $contentInput = $('#chapterContentInput'), //内容
            $speakInput = $('#authorSpeakInput'); //作者的话

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

        var chapterTypeName = ''; //章节类型名称

//        if(data.vipflag < 0){
//            chapterTypeName = '公众章节';
//        }else{
            if(data.chaptertype == 1){
                chapterTypeName = 'VIP章节';
            }else{
                chapterTypeName = '公众章节';
            }
//        }

        if(data.vipflag > 0 && !data.ismodifytitle){
            //不能修改标题
            $titleInput.attr('readonly', 'readonly').css('color', '');
        }else{
            $titleInput.removeAttr('readonly');
        }

        //章节类型
        $('#chapterTypeName').text(chapterTypeName);
        
        //编辑分卷容器
        $('#editVolumeBox').hide();
        //编辑章节容器
        $('#editChapterBox').show();

        if(!_hasPortamento){
            _hasPortamento = 1;

            //悬浮章节按钮一栏
            $('#chapterBtnBox').portamento({
                'wrapper': $('#editChapterBox'),
                'disableWorkaround': true,
                'gap': 0
            });
        }
    }

    /**
     * 显示编辑分卷的区域
     * @param {object} data 卷数据
     */
    function _showEditVolume(data){
        var $volumeOperationType = $('#volumeOperationType'), //操作类型
            $chapterCountBox = $('#chapterCountBox'), //章节数容器
            $chapterCount = $('#chapterCount'), //本卷章节数
            $volumeTitleInput = $('#volumeTitleInput'), //卷标题输入框
            $volumeDescInput = $('#volumeDescInput'), //卷介绍输入框
            $saveVolumeBtn = $('#saveVolumeBtn'), //保存按钮
            $deleteVolumeBtn = $('#deleteVolumeBtn'), //删除按钮
            $contentBox = $('#editVolumeContentBox'); //修改分卷的内容容器

        _cancelTipByExitEdit();

        //修改
        if(data){
            $volumeOperationType.text(data.volumeSortName);
            $chapterCount.text(data.volumechapters);
            $chapterCountBox.show();
            $volumeTitleInput.val(data.volumename);
            $volumeDescInput.val(data.volumedesc);

            $saveVolumeBtn.attr('data-type', 'update'); //修改
            $deleteVolumeBtn.show();

            //作品相关（系统默认卷，无需修改标题和说明）
            if(data.volumesort === '0'){
                $contentBox.hide();
            }else{
                $contentBox.show();
            }
        }else{ //新建
            //新卷名称
            $volumeOperationType.text(_params.newVolumeName);
            $chapterCountBox.hide();
            $volumeTitleInput.val('');
            $volumeDescInput.val('');

            $saveVolumeBtn.attr('data-type', 'add'); //新建
            $deleteVolumeBtn.hide();
            $contentBox.show();
        }

        //编辑章节容器
        $('#editChapterBox').hide();
        //编辑分卷容器
        $('#editVolumeBox').show();
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
                    //显示章节的编辑模式
                    _showEditChapter(_currentChapterData);
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
                'CBID': _params.CBID,
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
                    _showEditVolume(json.data);
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
     * 获取字数
     * @param  {string} content 内容
     */
    function _getWords(content){
        if(!content){
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
                    _dialog.alert('返回的数据格式异常，请稍候再试');
                    return;
                }

                if (json.status) {
                    if(json.data){
                        _dialog.alert('字数为：'+json.data);
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
     * 提交分卷信息
     * @param  {string} type        操作类型（add: 添加，update: 修改, delete: 删除）
     * @param  {int} isvip     是否vip卷(1:vip, -1: 普通)
     * @param  {string} volumename 卷标题
     * @param  {string} volumedesc  卷描述
     * @param  {string} CVID    卷id (可选: 添加分卷不用传)
     */
    function _submitVolume(type, isvip, volumename, volumedesc, CVID){
        //非删除操作
        if(type !== 'delete'){
            //检测用户输入的分卷信息
            var isPass = _checkVolumeInfo(volumename, volumedesc);
            if(!isPass){
                return;
            }
        }

        //避免同时多次请求
        if(_isSubmitting){
            return;
        }
        _isSubmitting = 1;

        _util.request({
            url: _ajaxUrls.submitVolume,
            data: {
                'CBID': _params.CBID,
                'type': type,
                'CVID': CVID,
                'isvip': isvip,
                'volumename': volumename,
                'volumedesc': volumedesc
            },
            type: 'post',
            dataType: "json",
            success: function(json) {
                if (!json) {
                    return;
                }

                if (json.status) {
                    _dialog.alert(json.info || '操作成功', function(){
                        //刷新当前页
                        location.href = location.href;
                    });
                    
                } else {
                    _dialog.alert(json.info || '操作失败，请稍候再试');
                }
            },
            error: function() {
                _dialog.alert('操作失败，请稍候再试');
            },
            complete : function(){
                _isSubmitting = 0;
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
                    _dialog.alert('返回的数据格式异常，请稍候再试');
                    return;
                }

                //成功
                if(json.status){
                    _dialog.alert(json.info || '保存成功', function(){
                        _cancelTipByExitEdit();
                        //刷新页面
                        location.href = location.href;
                    });
                }else{
                    _dialog.alert(json.info || '操作失败，请稍候再试');
                }
            },
            error : function(){
                _dialog.alert('操作失败，请稍候再试');
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
     * 检测分卷信息是否有效
     * @param  {string} volumename   卷标题
     * @param  {string} volumedesc   卷描述
     * @return {boolean}      卷信息是否符合条件
     */
    function _checkVolumeInfo(volumename, volumedesc) {
        volumename = $.trim(volumename);
        volumedesc = $.trim(volumedesc);
       
        // if (volumename.length === 0) {
        //     _dialog.alert('请输入卷名称!');
        //     return false;
        // }

        if (volumename.length > 20) {
            _dialog.alert('请输入最多20字作为卷名称!');
            return false;
        }

        // if (volumedesc.length === 0) {
        //     _dialog.alert('请输入分卷介绍!');
        //     return false;
        // }

        if (volumedesc.length > 140) {
            _dialog.alert('请输入最多140字介绍该分卷!');
            return false;
        }

        return true;
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
                'CBID': _params.CBID,
                'CCID' : CCID
            },
            success: function(json) {
                if (!json) {
                    _dialog.alert('返回数据格式异常，请稍后再试');
                    return;
                }

                if(json.status){
                    _dialog.alert(json.info || '删除成功', function(){
                        _cancelTipByExitEdit();
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