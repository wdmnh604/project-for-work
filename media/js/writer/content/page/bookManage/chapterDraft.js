/**
 * 作品管理：草稿箱
 * @namespace CS.page.bookManage.chapterDraft
 * @author  langtao
 * @update 2015-11-23
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
        'getDraftInfo' : '/Content/Booknovels/ajaxGetchapter.html', //获取草稿信息
        'getWords': '/Content/Booknovels/ajaxGetwords.html', //统计字数
        'addGuidedLog': '/Content/Authors/addGuideBookLog.html', //添加完成新手引导的记录
        'addGuideChapterLog': '/Content/Authors/addGuideChapterLog.html', //添加完成章节引导的记录
        'deleteDraft': '/Content/Booksubmit/ajaxChapterDel.html', //删除草稿
        'publishDraft' : '/Content/Booksubmit/ajaxChapterPub.html' //发布草稿
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
     */
    function init(CBID, isVipNovel, isGuide, isGuideChapter, isCreateChapter) {
        _params.CBID = CBID || 0;
        _params.isVipNovel = isVipNovel == '1';
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
        if(_params.isCreateChapter == '1'){
            _showEditDraft();
            return;
        }

        var $firstDraft = $('#draftList li').eq(0),
            CCID = $firstDraft.attr('data-chapterid');

        if(CCID){
            $firstDraft.addClass('act');
            _getSelectedDraftInfo(CCID);
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

        if(_params.isGuideChapter == '1'){
            //关闭新建章节悬浮提示
            $('.minTipBox .close').click(function(){
                $(this).parent('.minTipBox').hide();

                //添加已经完成引导的记录
                _util.request({
                    url: _ajaxUrls.addGuideChapterLog,
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
    function _bindEvent() {
        //美化select
        $('select').comboSelect();

        _bindEventByEditDraft();
        _bindEventByPublishPopup();

        //开启自定义滚动条
        $('#draftListBox').slimScroll({
             height: '640px',
             railVisible: true,
             wheelStep: 5
        });

        //草稿列表: 单条草稿
        $('#draftList').on('click', 'li', function() {
            var $el = $(this);

            _confirmExitEdit(function(){
                var CCID = $el.attr('data-chapterid');
                   
                //选中效果
                $el.addClass('act').siblings().removeClass('act');

                _getSelectedDraftInfo(CCID);
            });
            
            return false;
        });

        //新建草稿按钮
        $('#createDraftBtn, #createDraftIconBtn').on('click', function() {
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
            $publishDateBox = $('#publishDateBox'),
            $publishDateInput = $('#publishDateInput'), //发布时间输入框
            $publishTypeRadio = $publishPopup.find('[data-node="publishTypeRadio"]'); //发布类型单选框
         
        //发布时间输入框：添加日期选择器
        $publishDateInput.appendDtpicker({
            'futureOnly' : true, //只显示未来日期
            'closeOnSelected': true, //选完日期后自动关闭
            'minuteInterval': 15, //右侧列表的分钟间隔
            'locale' : 'cn' //语言
        });

        $publishTypeRadio.on('change', function() {
            var publishType = $(this).val();
            
            //立即发布
            if(publishType == '2'){
                $publishDateBox.hide();
            }else{
                $publishDateBox.show();
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

            var options = {
                'CBID': _params.CBID, //作品id
                'CCID' : _currentDraftData.CCID, //章节id
                'CVID' : $('#volumeSelect').val(), //分卷选择器的当前选项
                'vipflag' : _currentDraftData.vipflag, //是否vip章节
                'chapterType' : _currentDraftData.chaptertype, //章节类型
                'status' : $publishTypeRadio.filter(':checked').val(), //发布类型（2:立即发布 5：定时发布）
                'publishTime' : $publishDateInput.val(), //定时发布的时间
                'chapterTitle' : $('#chapterTitleInput').val(),
                'chapterContent' : $('#chapterContentInput').val(),
                'authorSpeak' : $('#authorSpeakInput').val()
            };

            if(_checkDraftInfo()){
                _publishDraft($(this), options);
            }
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
                            if(json.data && json.data.CCID){
                                //查看新建的草稿
                                _getSelectedDraftInfo(json.data.CCID, _updateDraftItem);
                            }
                        }else if(type === 'update'){ //更新草稿
                            //刷新页面
                            location.href = location.href;
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

        var chaptertitle = $.trim($chapterTitleInput.val()),
            content = $chapterContentInput.val(),
            authorSpeak = $authorSpeakInput.val();

        // 章节名称
        if (chaptertitle.length === 0 || chaptertitle === $chapterTitleInput.attr('data-default')) {
            _dialog.alert('请输入章节名称');
            return false;
        }
        if (chaptertitle.length > 35) {
            _dialog.alert('请输入35字以内作为章节名称');
            return false;
        }

        // 正文
        if (content.length === 0 || content === $chapterContentInput.attr('data-default')) {
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
            url: _ajaxUrls.getDraftInfo,
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
                    _currentDraftData = json.data;
                    //显示草稿的编辑模式
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
     * @param  {object} options 参数配置
     */
    function _publishDraft($btn, options) {
        //章节id
        if(!options.CCID){
            return;
        }

        var requestData = {
            'CBID': options.CBID, //作品id
            'CVID': options.CVID, //卷id
            'CCID': options.CCID, //章节id
            'vipflag': options.vipflag, //是否vip章节
            'chaptertype' : options.chapterType,
            'status': options.status, //发布类型（2:立即发布 5：定时发布）
            'chaptertitle': options.chapterTitle,
            'content': options.chapterContent,
            'chapterextra': options.authorSpeak
        };

        //定时发布
        if(options.status === '5'){
            //定时发布的时间
            if(!options.publishTime){
                _dialog.alert('请填写定时发布的时间');
                return;
            }
            requestData.publishtime = options.publishTime;
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
                        if(requestData.status === '2'){
                            if(json.data && json.data.jumpUrl){
                                //根据返回的jumpUrl刷新页面，避免当前页面是新建章节的url
                                location.href = json.data.jumpUrl;
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
     * @param {string} CCID 章节id
     */
    function _deleteDraft(CCID){
        if(!CCID){
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
            $chapterTypeHidden = $('#chapterTypeHidden'), //章节类型
            $volumeIdHidden = $('#volumeIdHidden'), //卷id
            $statusHidden = $('#statusHidden'), //章节状态
            $chapterVipFlagHidden = $('#chaptervipFlagHidden'); //是否为vip章节

        var $titleInput = $('#chapterTitleInput'), //标题
            $contentInput = $('#chapterContentInput'), //内容
            $speakInput = $('#authorSpeakInput'), //作者的话
            $chapterTypeName = $('#chapterTypeName'), //章节类型名称
            $chapterTypeSelectBox = $('#chapterTypeSelectBox'), //章节类型选择容器
            $showPublishPopupBtn =  $('#showPublishPopupBtn'), //显示发布草稿浮层的按钮
            $deleteDraftBtn = $('#deleteDraftBtn'); //删除草稿的按钮

        var chaptertitle = $titleInput.attr('data-default'),
            content = $contentInput.attr('data-default'),
            chapterextra = $speakInput.attr('data-default'); //作者的话

        //新建草稿
        if(!data){
            _addNewDraftItem();
            _setEditDraftType('add');
            $deleteDraftBtn.hide();
            $showPublishPopupBtn.hide();

            $chapterIdHidden.val('');
            $chapterTypeHidden.val('-1');
            $volumeIdHidden.val('');
            $statusHidden.val('1');
            $chapterVipFlagHidden.val('-1');  //0都换成-1
        }else{ //更新草稿
            chaptertitle = data.chaptertitle;
            content = data.content;
            chapterextra = data.chapterextra;

            _setEditDraftType('update');
            $deleteDraftBtn.show();
            $showPublishPopupBtn.show();

            $chapterIdHidden.val(data.CCID);
            $chapterTypeHidden.val(data.chaptertype);
            $volumeIdHidden.val(data.CVID);
            $statusHidden.val(data.status);
            $chapterVipFlagHidden.val(data.vipflag);
        }
       
        $titleInput.val(chaptertitle);
        $contentInput.val(content);
        $speakInput.val(chapterextra);

        //初始化输入框的文字颜色
        $.each([$titleInput, $contentInput, $speakInput], function(index, $el){
            if($el.val() === $el.attr('data-default')){
                $el.css('color', '');
            }else{
                $el.css('color', _blackColor);
            }
        });
        
        //vip作品
        if(_params.isVipNovel){
            $chapterTypeName.hide();

            var chaptertype = data ? data.chaptertype : -1, //默认为vip章节
                $radio = $chapterTypeSelectBox.find(':radio[name="chapterTypeRadio"][value="'+ chaptertype +'"]'); //对应的章节类型选项

            //章节类型选中
            $radio.prop('checked', 'checked').parent().addClass('on').siblings('.radio').removeClass('on');
            $chapterTypeSelectBox.show();
        }else{ //普通作品
            $chapterTypeSelectBox.hide();
            $chapterTypeName.show();
        }
        
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
        $draftList.prepend(_newDraftItemTpl);
        //滚动到最后
        // $draftListBox.slimScroll({scrollTo : $draftListBox.get(0).scrollHeight + 'px'});
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

            //根据草稿数据，更新发布设置
            //所在卷
            $('#volumeSelect').val(_currentDraftData.CVID).comboSelect();

            //发布类型（2:立即发布 5：定时发布）
            var $publishTypeRadio = $popup.find('[data-node="publishTypeRadio"]'),
                $publishDateBox = $('#publishDateBox');
            
            $publishTypeRadio.parent().removeClass('on');
            //定时发布
            if(_currentDraftData.status == 5){
                $publishTypeRadio.filter('[value="5"]').prop('checked', 'checked').parent().addClass('on');
            }else{
                $publishTypeRadio.filter('[value="2"]').prop('checked', 'checked').parent().addClass('on');
            }

            //定时发布时间
            if(_currentDraftData.status == 5 && _currentDraftData.newPublishTime){
                //去掉秒
                $('#publishDateInput').val(_currentDraftData.newPublishTime.substr(0, 16));
                $publishDateBox.show();
            }else{
                $('#publishDateInput').val('');
                $publishDateBox.hide();
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
                'original': _currentDraftData.chapterextra
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
                'isPublishByTime': _currentDraftData.status == 5 //状态是否为定时发布
            });

        //更新单个草稿项目
        if($chapterItem && $chapterItem.length > 0){
            $chapterItem.replaceWith(tpl);
        }else{
            $draftList.prepend(tpl);
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