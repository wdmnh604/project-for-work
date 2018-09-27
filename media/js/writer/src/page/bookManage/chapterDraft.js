/**
 * 作品管理：草稿箱
 * @namespace CS.page.bookManage.chapterDraft
 * @author  langtao
 * @update 2015-12-1
 */
(function($) {
    //外部依赖
    var _util = CS.util,
        _uiBinder = CS.uiBinder,
        _mask = CS.mask,
        _dialog = CS.dialog;

    var _params = {}; //参数集合

    var _maskByPublishPopup = null, //定时发布浮层的遮罩对象
        _isLoading = 0, //是否正在加载草稿
        _isSubmitting = 0, //是否正在提交草稿
        _isTipByExitEdit = 0, //离开编辑模式时，是否需要提示
        _tipByExitEdit = '您编辑的章节内容尚未保存，确定要离开吗？', //离开编辑模式时的提示
        _blackColor = '#333', //黑色文字的style
        _hasPortamento = 0, //是否设置过草稿按钮一栏的滑动定位
        _currentDraftData = {}; //当前草稿的数据

    var _ajaxUrls = {
        'getDraftInfo' : '/Home/Booknovels/ajaxGetchapter.html', //获取草稿信息
        'getWords': '/Home/Booknovels/ajaxGetwords.html', //统计字数
        'addGuidedLog': '/Home/authors/addGuideBookLog.html', //添加完成新手引导的记录
        'addGuideChapterLog': '/Home/Authors/addGuideChapterLog.html', //添加完成章节引导的记录
        'deleteDraft': '/Home/Booksubmit/ajaxChapterDel.html', //删除草稿
        'publishDraft' : '/Home/Booksubmit/ajaxChapterPub.html' //发布草稿
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
                            '<%=data.pd%>',
                        '<%else%>',
                            '<%=data.ut%>',
                        '<%/if%>',
                    '</i>',
                    '共<%=data.actualwords || 0%>字',
                '</p>',
            '</div>',
        '</li>'
    ].join('');

    //新建草稿时，左侧的单个草稿条目模板
    var _newDraftItemTpl = [
        '<li data-node="newDraftItem" class="act">',
            '<div class="sectionBox">',
                '<p>',
                    '<em>新章节</em>',
                '</p>',
                '<p class="f12">',
                    '<i>&nbsp;</i>',
                '</p>',
            '</div>',
        '</li>'
    ].join('');

     /**
     * 初始化
     * @param {int} CBID 作品id
     * @param {string} isVipNovel  是否vip作品(1:vip 0：普通)
     * @param {int} isGuide 是否需要新手引导
     * @param {string} isGuideChapter 是否需要章节的新手引导
     * @param {string} isCreateChapter 是否默认创建新章节
     //* @param {string} cType 章节类型 (-1 公众  1 vip  4 公众草稿 5 vip待发布)
     */
    function init(CBID, isVipNovel, isGuide, isGuideChapter, isCreateChapter) {
        _params.CBID = CBID || 0;
        _params.isVipNovel = isVipNovel === '1';
        _params.isGuide = isGuide || 0;
        _params.isGuideChapter = isGuideChapter || '0';
        _params.isCreateChapter = isCreateChapter || '0';

        _setTipByRefreshPage();
        _bindEvent();
        _renderFirstDraft();
        setTimeout(_setGuide, 200);
    }

    /**
     * 渲染第一个草稿的内容
     */
    function _renderFirstDraft(){
        //创建新章节
        if(_params.isCreateChapter === '1'){
            _showEditDraft();
            return;
        }

        var $firstDraft = $('#draftList li').eq(0),
            chapterId = $firstDraft.attr('data-chapterid'),
            chaptertype = $firstDraft.attr('data-chaptertype');

        if(chapterId){
            $firstDraft.addClass('act');
            _getSelectedDraftInfo(chapterId,chaptertype);
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

        // if(_params.isGuideChapter === '1'){
        //     //关闭新建章节悬浮提示
        //     $('.minTipBox .close').click(function(){
        //         $(this).parent('.minTipBox').hide();

        //         //添加已经完成引导的记录
        //         _util.request({
        //             url: _ajaxUrls.addGuideChapterLog,
        //             data: {},
        //             type: 'post',
        //             isShowLoading : false, //不显示加载提示效果
        //             dataType: "json"
        //         });
        //     });
        // }
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
    function _bindEvent() {
        _bindEventByEditDraft();
        _bindEventByPublishPopup();

        //开启自定义滚动条
        $('#draftListBox').slimScroll({
             height: '640px',
             railVisible: true,
             wheelStep: 5
        });

        //悬浮章节类型一栏
        $('.sectionBtnBoxShow').portamento({
            wrapper:$('.editWrap'),
            disableWorkaround:true,
            gap:0
        });

        //草稿列表: 单条草稿
        $('#draftList').on('click', 'li', function() {
            var $el = $(this);

            _confirmExitEdit(function(){
                var chapterId = $el.attr('data-chapterid'),
                    chaptertype = $el.attr('data-chaptertype');

                //选中效果
                $el.addClass('act').siblings().removeClass('act');

                _getSelectedDraftInfo(chapterId,chaptertype);
            });
            
            return false;
        });

        //新建草稿按钮
        $('#createDraftIconBtn').on('click', function() {
            _confirmExitEdit(_showEditDraft);
            return false;
        });
    }

    /**
     * 绑定编辑草稿的元素事件
     */
    function _bindEventByEditDraft(){
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

        //保存草稿按钮
        $('#saveDraftBtn').on('click', function() {
            if(_checkDraftInfo()){
               _saveDraft();
            }
            return false;
        });

        //删除章节按钮
        $('#deleteDraftBtn').on('click', function() {
            _dialog.confirm("删除后不可恢复，你确定要删除此章吗？", function() {
                _deleteDraft(_currentDraftData.CCID);
            });
            return false;
        });
        
        //显示定时发布浮层的按钮
        $('#showPublishPopupBtn').on('click', function() {
            _openPublishPopup();
            
            return false;
        });
    }

    /**
     * 绑定发布浮层的元素事件
     */
    function _bindEventByPublishPopup(){
        var $publishPopup = $('#publishPopup'),
            $publishDateInputBox = $('#publishDateInputBox'), //时间输入框的容器
            $publishDateInput = $('#publishDateInput'), //发布时间输入框
            $publishTypeRadio = $publishPopup.find('[data-node="publishTypeRadio"]'), //发布类型单选框
            $publishContent = $('#chapterContentInput'),//发布内容
            $publishAuthorExt = $('#authorSpeakInput');//作者的话
         
        //发布时间输入框：添加日期选择器
        $publishDateInput.datetimepicker({
            'format' :"Y-m-d H:i",  //格式化日期
            'lang': 'ch', //语言
            'step': 15 //时间间隔（单位：分钟）
        });

        $publishTypeRadio.on('change', function() {
            //定时发布
            if($(this).val() === '1'){
                $publishDateInputBox.show();
            }else{
                $publishDateInputBox.hide();
            }
        });

        //发布浮层中的关闭按钮
        $publishPopup.find('[data-node="close"]').click(function() {
            _closePublishPopup();
            return false;
        });

        //发布按钮
        $("#publishBtn").on("click", function() {
            //正在提交状态中
            if(_util.checkBtnIsLoading($(this))){
                return false;
            }

            var optype = $publishTypeRadio.filter(':checked').val(),
                publishTime = $publishDateInput.val(),
                volumeId = $('#volumeSelect').val(), //分卷选择器的当前选项
                publishContent = $publishContent.val(),//内容
                publishAuthorExt = $publishAuthorExt.val();//作家的话

            _publishDraft($(this), volumeId, _currentDraftData.CCID, _currentDraftData.chaptertype, optype, publishTime,publishContent,publishAuthorExt);
            return false;
        });
    }

    /**
     * 获取字数
     * @param  {string} content 内容
     */
    function _getWords(content){
        if(!content || content === '请输入正文'){
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
     * 保存草稿
     */
    function _saveDraft(){
        if(_isSubmitting){
            return;
        }
        _isSubmitting = 1;

        //动态提交保存草稿的表单
        _util.ajaxSubmitForm($('#formDraft'), {
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
                        var type = _getEditDraftType(); //操作类型

                        _cancelTipByExitEdit();

                        //新建草稿
                        if(type === 'add'){
                            //刷新页面
                            location.href = location.href;
                        }else if(type === 'update'){ //更新草稿
                            if(json.data && json.data.CCID){
                                //查看新建的草稿
                                _getSelectedDraftInfo(json.data.CCID,json.data.chaptertype, _updateDraftItem);
                            }
                        }
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
     * 检测草稿信息是否有效
     * @return {boolean} 是否有效
     */
    function _checkDraftInfo() {
        var $chapterTitleInput = $('#chapterTitleInput'),
            $chapterContentInput = $('#chapterContentInput'),
            $authorSpeakInput = $('#authorSpeakInput');

        var chapterTitle = $.trim($chapterTitleInput.val()),
            chapterContent = $chapterContentInput.val(),
            authorSpeak = $authorSpeakInput.val();

        // 章节名称
        if (chapterTitle.length === 0 || chapterTitle === $chapterTitleInput.attr('data-default')) {
            _dialog.alert('请输入章节名称');
            return false;
        }
        if (chapterTitle.length > 35) {
            _dialog.alert('请输入35字以内作为章节名称');
            return false;
        }

        // 正文
        if (chapterContent.length === 0 || chapterContent === $chapterContentInput.attr('data-default')) {
            _dialog.alert('请输入正文');
            return false;
        }

        // 作者的话
        if (authorSpeak === $authorSpeakInput.attr('data-default')) {
            authorSpeak = '';
            $authorSpeakInput.val('');
        }
        if (authorSpeak.length > 500) {
            _dialog.alert('作者的话不可超过500字');
            return false;
        }

        return true;
    }

    /**
     * 获取选中的草稿信息
     * @param {int} chapterid 章节id
     * @param {function} successCallback 成功后的回调函数
     */
    function _getSelectedDraftInfo(chapterId,chaptertype,successCallback) {
        if(!chapterId){
            return;
        }

        //避免同时多次请求
        if(_isLoading){
            return;
        }
        _isLoading = 1;

        _util.request({
            url: _ajaxUrls.getDraftInfo,
            data: {
                'CBID': _params.CBID,
                'CCID': chapterId,
                'type': chaptertype
            },
            type: 'post',
            dataType: "json",
            success: function(json) {
                if (!json) {
                    return;
                }

                if (json.status && json.data) {
                    _currentDraftData = json.data;
                    //查看草稿
                    _showEditDraft(_currentDraftData);

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
     * 发布草稿
     * @param {object} $btn 提交按钮的jquery对象
     * @param  {string} volumeId    卷id
     * @param  {string} chapterId   章节id
     * @param  {int} chaptertype     -1普通 1vip  4公众草稿 5vip待发布
     * @param  {string} optype      发布类型（1：定时发布, 2:立即发布 ）
     * @param  {string} publishTime 定时发布的时间
     * @param  {string} publishContent 内容
     * @param  {string} publishAuthorExt 作者的话
     */
    function _publishDraft($btn, volumeId, chapterId, chaptertype, optype, publishTime,publishContent,publishAuthorExt) {
        if(!chapterId){
            return;
        }

        var requestData = {
            'CBID': _params.CBID,
            'CVID': volumeId,
            'CCID': chapterId,
            'chaptertype': chaptertype,
            'optype': optype,
            'chapterextra': publishAuthorExt,
            'content': publishContent
        };

        //定时发布
        if(optype === '1'){
            if(!publishTime){
                _dialog.alert('请填写定时发布的时间');
                return;
            }

            requestData.publishTime = publishTime;
        }

        //避免同时多次请求
        if(_isSubmitting){
            return;
        }
        _isSubmitting = 1;

        _util.updateBtnText($btn, 'loading');

        _util.request({
            url: _ajaxUrls.publishDraft,
            data: requestData,
            type: 'post',
            dataType: "json",
            success: function(json) {
                if (!json) {
                    return;
                }

                if (json.status) {
                    _closePublishPopup();

                    _dialog.alert(json.info || '操作成功', function(){
                        _cancelTipByExitEdit();

                        //立即发布
                        if(optype === '2'){
                            if(json.data && json.data.jumpUrl){
                                //根据返回的jumpUrl刷新页面，避免当前页面是新建章节的url
                                location.href = json.data.jumpUrl;
                            }else{
                                location.href = location.href;
                            }
                        }else{
                            //刷新页面
                            location.href = location.href;
                        }
                    });
                } else {
                    _dialog.alert(json.info || '操作失败，请稍候再试');
                }
            },
            error: function() {
                _dialog.alert('操作失败，请稍候再试');
            },
            complete : function(){
                _util.updateBtnText($btn, 'default');
                _isSubmitting = 0;
            }
        });
    }

    /**
     * 删除草稿
     * @param {string} chapterId 章节id
     */
    function _deleteDraft(chapterId){
        if(!chapterId){
            return;
        }

        if(_isSubmitting){
            return;
        }
        _isSubmitting = 1;
       
        _util.request({
            url: _ajaxUrls.deleteDraft,
            type: 'post',
            dataType: 'json',
            data: {
                'CBID': _params.CBID,
                'CCID' : chapterId,
                'flag':0
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
     * 设置编辑草稿的操作类型
     * @param {string} type 操作类型（add:新建 update:更新）
     */
    function _setEditDraftType(type){
        if(!type){
            return;
        }

        $('#typeHidden').val(type);
    }

    /**
     * 获取编辑草稿的操作类型
     * @return {string} 操作类型（add:新建 update:更新）
     */
    function _getEditDraftType(){
        return $('#typeHidden').val();
    }

    /**
     * 显示编辑草稿容器
     * @param  {object} data 草稿数据
     */
    function _showEditDraft(data){
        _setTipByExitEdit();
        _removeNewDraftItem();

        var $chapterIdHidden = $('#chapterIdHidden'), //章节id
            $volumeIdHidden = $('#volumeIdHidden'); //卷id

        var $titleInput = $('#chapterTitleInput'), //标题
            $contentInput = $('#chapterContentInput'), //内容
            $speakInput = $('#authorSpeakInput'), //作者的话
            $chapterTypeSelector = $('#chapterTypeSelector'), //章节类型选择器
            $showPublishPopupBtn =  $('#showPublishPopupBtn'), //显示发布草稿浮层的按钮
            $deleteDraftBtn = $('#deleteDraftBtn'), //删除草稿的按钮
            $chaptertypeHidden = $('#chapterTypeHidden'); //章节类型 -1 公众  1 vip  4 公众草稿 5 vip待发布

        var chapterTitle = $titleInput.attr('data-default'),
            chapterContent = $contentInput.attr('data-default'),
            chapterExtra = $speakInput.attr('data-default'); //作者的话

        //新建草稿
        if(!data){
            _addNewDraftItem();
            _setEditDraftType('add');
            $deleteDraftBtn.hide();
            $showPublishPopupBtn.hide();

            $chaptertypeHidden.val('');
            $chapterIdHidden.val('');
            $volumeIdHidden.val('');
        }else{ //更新草稿
            chapterTitle = data.chaptertitle;
            chapterContent = data.content;
            chapterExtra = data.chapterExtra;

            _setEditDraftType('update');
            $deleteDraftBtn.show();
            $showPublishPopupBtn.show();

            $chaptertypeHidden.val(data.chaptertype);
            $chapterIdHidden.val(data.CCID);
            $volumeIdHidden.val(data.CVID);

            //跟新草稿箱时，选中且不让修改  chaptertype== 4 chapterTypeSelector应对-1 ，chaptertype== 5 且 chapterTypeSelector应对1
            //$chapterT.
        }
       
        $titleInput.val(chapterTitle);
        $contentInput.val(chapterContent);
        $speakInput.val(chapterExtra);
       
        //初始化输入框的文字颜色
        $.each([$titleInput, $contentInput, $speakInput], function(index, $el){
            if($el.val() === $el.attr('data-default')){
                $el.css('color', '');
            }else{
                $el.css('color', _blackColor);
            }
        });

        //公共章节
        $chapterTypeSelector.val('-1');
        
        //vip作品
        if(_params.isVipNovel){
            var chapterType = data ? data.chaptertype : 5; //默认为vip章节

            if(chapterType === 5){
                //vip章节
                $chapterTypeSelector.val('1');
            }
        }

        $chapterTypeSelector.comboSelect();

        //编辑草稿容器
        $('#editDraftBox').show();

        if(!_hasPortamento){
            _hasPortamento = 1;

            //悬浮草稿按钮一栏
            $('#draftBtnBox').portamento({
                'wrapper': $('#editDraftBox'),
                'disableWorkaround': true,
                'gap': 0
            });
        }
    }

    /**
     * 左侧草稿列表中，添加新草稿条目
     */
    function _addNewDraftItem(){
        var $draftListBox = $('#draftListBox'),
            $draftList = $('#draftList'); //左侧草稿列表

        //去掉章节列表高亮
        $draftList.find('li').removeClass('act');
        //添加新草稿条目
        $draftList.append(_newDraftItemTpl);
        //滚动到最后
        $draftListBox.slimScroll({scrollTo : $draftListBox.get(0).scrollHeight + 'px'});
    }

    /**
     * 左侧草稿列表中，移除新草稿条目
     */
    function _removeNewDraftItem(){
        $('#draftList').find('[data-node="newDraftItem"]').remove();
    }

    /**
     * 打开发布浮层
     */
    function _openPublishPopup(){
        var $popup = $('#publishPopup');

        if(!_maskByPublishPopup){
            _maskByPublishPopup = new _mask($popup);
        }

        if(_maskByPublishPopup){
            var $publishTypeRadio = $popup.find('[data-node="publishTypeRadio"]'), //发布类型选择器
                $publishDateInputBox = $('#publishDateInputBox'); //时间输入框的容器

            //根据草稿数据，更新发布设置
            //所在卷
            $('#volumeSelect').val(_currentDraftData.CVID).comboSelect();
            
            $publishTypeRadio.parent().removeClass('on');
            //定时发布
            if(_currentDraftData.status === 5){
                $publishTypeRadio.filter('[value="5"]').prop('checked', 'checked').parent().addClass('on');
                $publishDateInputBox.show();
            }else{
                $publishTypeRadio.filter('[value="2"]').prop('checked', 'checked').parent().addClass('on');
                $publishDateInputBox.hide();
            }

            //定时发布时间
            if(_currentDraftData.status === 5 && _currentDraftData.newPublishTime){
                //去掉秒
                $('#publishDateInput').val(_currentDraftData.newPublishTime.substr(0, 16));
            }else{
                $('#publishDateInput').val('');
            }

            _maskByPublishPopup.open();
        }
    }

    /**
     * 关闭发布浮层
     */
    function _closePublishPopup(){
        if(_maskByPublishPopup){
            _maskByPublishPopup.close();
        }
    }

    /**
     * 输入框获得焦点
     * @param  {object} $el 输入框元素的jquery对象
     */
    function _focusIn($el) {
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
        if ($el.val() === '') {
            $el.val($el.attr('data-default')).css('color', '');
        }
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
                'original': _currentDraftData.chaptertitle //原始内容
            },
            {
                'userInput' : $chapterContentInput.val(),
                'defaultInput': $chapterContentInput.attr('data-default'),
                'original': _currentDraftData.content
            },
            {
                'userInput' : $authorSpeakInput.val(),
                'defaultInput': $authorSpeakInput.attr('data-default'),
                'original': _currentDraftData.chapterExtra
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
     * 更新左侧草稿列表中的单个草稿项
     */
    function _updateDraftItem(){
        if(!_currentDraftData || !_currentDraftData.CCID){
            return;
        }
        
        var $draftList = $('#draftList'),
            $chapterItem = $draftList.find('li[data-chapterid="'+ _currentDraftData.CCID +'"]');

        var tpl = _uiBinder.bindData(_draftItemTpl, {
                'data': _currentDraftData,
                'isPublishByTime': _currentDraftData.status === 5 //状态是否为定时发布
            });
        
        //更新单个草稿项目
        if($chapterItem && $chapterItem.length > 0){
            $chapterItem.replaceWith(tpl);
        }else{
            $draftList.append(tpl);
        }

        $chapterItem = $draftList.find('li[data-chapterid="'+ _currentDraftData.CCID +'"]');
        $chapterItem.addClass('act').siblings().removeClass('act');
    }

    /**
     * 设置关闭或刷新页面时的提示
     */
    function _setTipByRefreshPage() {
        //关闭或刷新页面
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

    _util.initNameSpace("CS.page.bookManage");
    CS.page.bookManage.chapterDraft = {
        'init': init
    };

})(jQuery);