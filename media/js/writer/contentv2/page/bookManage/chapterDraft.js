/**
 * 作品管理：草稿箱
 * @namespace CS.page.bookManage.chapterDraft
 * @author  langtao
 * @update 2016-1-20
 */
(function($) {
    //外部依赖
    var _util = CS.util,
        _uiBinder = CS.uiBinder,
        _mask = CS.mask,
        _topTip = CS.topTip, //顶部提示
        _dialog = CS.dialog,
        _volume = null; //分卷组件

    var _params = {}, //参数集合
        _nodes = {}, //元素的对象集合
        _maskByPublishPopup = null, //定时发布浮层的遮罩对象
        _isLoading = 0, //是否正在加载草稿
        _isSubmitting = 0, //是否正在提交草稿
        _isJumpingPage = 0, //是否正在跳转页面
        _isTipByExitEdit = 0, //离开编辑模式时，是否需要提示
        _tipByExitEdit = '您编辑的章节内容尚未保存，确定要离开吗？', //离开编辑模式时的提示
        _blackColor = '#333', //黑色文字的style
        _grayColor = '#BBB', //灰色文字的style
        _currentDraftData = {};//当前草稿的数据

    //章节类型对照表
    var _chapterType = {
        'public': '-1', //公众章节
        'vip' : '1', //VIP章节
        'speak': '2' //章节感言
    };

    var _ajaxUrls = {
        'getDraftInfo' : '/Contentv2/Booknovels/ajaxGetchapter.html', //获取草稿信息
        'getWords': '/Contentv2/Booknovels/ajaxGetwords.html', //统计字数
        'addGuidedLog': '/Contentv2/Authors/addGuideBookLog.html', //添加完成新手引导的记录
        'addGuideChapterLog': '/Contentv2/Authors/addGuideChapterLog.html', //添加完成章节引导的记录
        'deleteDraft': '/Contentv2/Booksubmit/ajaxChapterDel.html', //删除草稿
        'publishDraft' : '/Contentv2/Booksubmit/ajaxChapterPub.html' //发布草稿
    };

    //左侧草稿列表的单个草稿条目模板
    var _draftItemTpl = [
        '<li data-chapterid="<%=data.CCID%>" data-volumeid="<%=isPublishByTime ? data.CVID : 0%>">',
            '<div class="sectionBox">',
                '<p>',
                    '<em><%=data.chaptertitle || ""%></em>',
                '</p>',
                '<p class="f12">',
                    '<i>',
                        '<%if isPublishByTime%>',
                        '<span class="icon time"></span>',
                        '<%/if%>',
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
                    '<em>无标题</em>',
                '</p>',
                '<p class="f12">',
                    '<i>&nbsp;</i>',
                '</p>',
            '</div>',
        '</li>'
    ].join('');

     /**
     * 初始化
     * @param {int} bookId 作品id
     * @param {int} isGuide 是否需要新手引导
     * @param {string} isGuideChapter 是否需要章节的新手引导
     * @param {string} isCreateChapter 是否默认创建新章节
     * @param {string} chapterTmpUrl 处理过的章节草稿页的地址
     */
    function init(bookId, isGuide, isGuideChapter, isCreateChapter, chapterTmpUrl) {
        _params.bookId = bookId || 0;
        _params.isGuide = isGuide || 0;
        _params.isGuideChapter = isGuideChapter || '0';
        _params.isCreateChapter = isCreateChapter || '0';
        _params.chapterTmpUrl = chapterTmpUrl || '0';

        _volume = CS.page.bookManage.volume; //分卷组件

        _nodes.$volumeBox = $('#volumeBox'); //分卷的容器
        _nodes.$selectedVolume = $('#selectedVolume'); //分卷选中项
        _nodes.$chapterTypeBox = $('#chapterTypeBox'); //章节类型的容器
        _nodes.$selectedChapterType = $('#selectedChapterType'); //章节类型选中项
        

        _bindEvent();
        _bindEventByEditDraft();
        _bindEventBySelect();
        _bindEventByPublishPopup();
        _bindEventBySlimScroll();
        _bindEventByBubble();

        _renderFirstDraft();
        _setTipByRefreshPage();
        setTimeout(_setGuide, 200);
    }

    /**
     * 渲染第一个草稿的内容
     */
    function _renderFirstDraft() {
        //创建新章节
        if (_params.isCreateChapter == '1') {
            _editDraft();
            return;
        }

        var $firstDraft = $('#draftList li').eq(0),
            chapterId = $firstDraft.attr('data-chapterid');

        if (chapterId) {
            $firstDraft.addClass('act');
            _getSelectedDraftInfo(chapterId);
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

        // if(_params.isGuideChapter == '1'){
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
        //美化select
        $('select').comboSelect();

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
            _confirmExitEdit(function(){
                _currentDraftData = null;
                _editDraft();
            });
            return false;
        });
    }

    /**
     * 绑定草稿列表的title提示事件
     */
    function _bindEventByBubble(){
        //过长的标题显示气泡事件
        //冒泡提示
        $('#draftListWrap').append('<div id="sectionBubble" class="section-bubble"><p></p><span class="icon"></span></div>');

        var $sectionList = $('#sectionList'),
            $sectionBubble = $('#sectionBubble'),
            $bubbleText = $sectionBubble.find('p');

        $sectionList.on('mouseover', '.sub-volume, .sectionBox p em', function() {
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

        $sectionList.on('mouseout', '.sub-volume, .sectionBox p em', function() {
            $sectionBubble.hide();
        });
    }

    /**
     * 开启自定义滚动条
     * @private
     */
    function _bindEventBySlimScroll(){
        $('#sectionList, #apply-List').slimScroll({
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

        $('.say').slimScroll({
            height: '130px',
            disableFadeOut: true,
            railVisible: true,
            borderRadius: 0
        });

        /*
       $('#sectionText').slimScroll({
           height: '640px',
           railVisible: true,
           alwaysVisible:false,
           borderRadius: 0
       });

       $('.apply-wrap-content').slimScroll({
           height: '740px',
           railVisible: true,
           alwaysVisible:false,
           borderRadius: 0
       });*/
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
//            _dialog.confirm("删除后不可恢复，你确定要删除此章吗？", function() {
                _deleteDraft(_currentDraftData.CCID);
//            });
            return false;
        });
        
        //显示定时发布浮层的按钮
        $('#showPublishPopupBtn').on('click', function() {
            if(_checkDraftInfo()){
                _openPublishPopup();
            }

            return false;
        });
    }

    /**
     * 绑定发布浮层的元素事件
     */
    function _bindEventByPublishPopup(){
        var $publishPopup = $('#publishPopup'),
            $publishDateBox = $('#publishDateBox'),
            // $publishDateInput = $('#publishDateInput'), //发布时间输入框
            $publishTypeRadio = $publishPopup.find('[data-node="publishTypeRadio"]'); //发布类型单选框
         
        //发布时间输入框：添加日期选择器
        // $publishDateInput.appendDtpicker({
        //     'futureOnly' : true, //只显示未来日期
        //     'closeOnSelected': true, //选完日期后自动关闭
        //     'minuteInterval': 15, //右侧列表的分钟间隔
        //     'locale' : 'cn' //语言
        // });

        $publishTypeRadio.on('change', function() {
            var publishType = $(this).val();

            //立即发布
            if(publishType === '2'){
                $publishDateBox.hide();
                $('#timing-tips-error').hide();
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
            var timing='';
            if($('#datePickerTrigger-set') && $('#timePickerTrigger'))
            {
                timing= $('#datePickerTrigger-set').val()+''+$('#timePickerTrigger').val();
                timing=timing.replace(/(\d+)年(\d+)月(\d+)日(\d+)时(\d+)分/, "$1-$2-$3 $4:$5");
            }
            var options = {
                'CBID': _params.bookId, //作品id
                'CCID' : $('#chapterIdHidden').val(), //章节id
                'type' : $('#typeHidden').val(), //操作类型
                'CVID' : _nodes.$selectedVolume.attr('data-volumeid'), //选中的分卷id
                'vipflag' : _nodes.$selectedVolume.attr('data-vipflag'), //选中的分卷是否为vip章节
                'chapterType' : _nodes.$selectedChapterType.attr('data-chaptertype'), //章节类型
                'status' : $publishTypeRadio.filter(':checked').val(), //发布类型（2:立即发布 5：定时发布）
                'publishTime' : timing,//$publishDateInput.val(), //定时发布的时间
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
     * 绑定模拟选择器的事件
     */
    function _bindEventBySelect(){
        //显示/隐藏下拉列表
        var toggleListBox = function($el, $listBox){
            if($listBox.is(':hidden')){
                $el.addClass('combo-open');
                $listBox.show();
            }else{
                $el.removeClass('combo-open');
                $listBox.hide();
            }
        };

        //打开创建分卷浮层的按钮
        $('#openCreateVolumePopupBtn').on('click', function(event) {
            event.preventDefault();

            _volume.openCreateVolumePopup();
        });

        //分卷选择器、章节类型选择器
        $.each([_nodes.$volumeBox, _nodes.$chapterTypeBox], function(index, $box) {
            var $listBox = $box.find('[data-node="listBox"]'),
                $selectedItemBox = $box.find('[data-node="selectedItemBox"]'); //选中项的容器

            $selectedItemBox.on('click', function(){
                toggleListBox($(this), $listBox);
            });
        });

        var $volumeListBox = _nodes.$volumeBox.find('[data-node="listBox"]'), //分卷列表容器
            $chapterTypeListBox = _nodes.$chapterTypeBox.find('[data-node="listBox"]'); //章节类型列表容器

        //点击页面空白处，隐藏分卷和章节类型下拉列表
        $(document).on("click", function(e) {
            if($volumeListBox.is(':visible') || $chapterTypeListBox.is(':visible')){
                var $target = $(e.target);

                //select除外
                if($target.closest(_nodes.$volumeBox).length === 0){
                    $volumeListBox.hide();
                }
                if($target.closest(_nodes.$chapterTypeBox).length === 0){
                    $chapterTypeListBox.hide();
                }
            }
        });

        //分卷选择器
        var $selectedVolumeBox = _nodes.$volumeBox.find('[data-node="selectedItemBox"]');
            
        //点击分卷单项
        $volumeListBox.on('click', 'li', function() {
                var $item = $(this).find('a'),
                    volumeId = $item.attr('data-volumeid');
                    
                //排除新建分卷的按钮
                if(!volumeId){
                    return;
                }

                $selectedVolumeBox.removeClass('combo-open');
                $volumeListBox.hide();

                _setVolume(volumeId);
            });

        //章节类型选择器
        var $selectedChapterTypeBox = _nodes.$chapterTypeBox.find('[data-node="selectedItemBox"]');
            
        //点击章节类型单项
        $chapterTypeListBox.on('click', 'li', function() {
                var $item = $(this).find('a');

                $selectedChapterTypeBox.removeClass('combo-open');
                $chapterTypeListBox.hide();

                _setChapterType($item.attr('data-chaptertype'));
            });

        //第一个章节类型
        var firstChapterType = $chapterTypeListBox.find('a[data-chaptertype]').eq(0).attr('data-chaptertype');
        _setChapterType(firstChapterType);

        //第一个分卷
        var firstVolumeId = $volumeListBox.find('a[data-volumeid]').eq(0).attr('data-volumeid');
        _setVolume(firstVolumeId);
    }

    /**
     * 设置分卷
     * @param {string} volumeId 分卷id
     */
    function _setVolume(volumeId){
        if(!volumeId){
            return;
        }

        var $item = _nodes.$volumeBox.find('[data-node="listBox"] a[data-volumeid="'+ volumeId +'"]');
        if(!$item || $item.length === 0){
            return;
        }

        var vipFlag = $item.attr('data-vipflag');

        _nodes.$selectedVolume
            .text($item.text())
            .attr({
                'data-volumeid': volumeId,
                'data-vipflag': vipFlag
            });

        $('#volumeIdHidden').val(volumeId);

        //章节类型选择器联动
        //公共章节的选项
        var $chapterTypeItemByPublic = _nodes.$chapterTypeBox.find('[data-node="listBox"] a[data-chaptertype="'+ _chapterType.public +'"]').parent(),
            $chapterTypeItemByVip = $chapterTypeItemByPublic.siblings('li');

        //vip卷
        if(vipFlag === '1'){
            //VIP章节
            _setChapterType(_chapterType.vip);
            $chapterTypeItemByPublic.hide();
            $chapterTypeItemByVip.show();
        }else{ //非vip卷
            _setChapterType(_chapterType.public);
            $chapterTypeItemByPublic.show();
            $chapterTypeItemByVip.hide();
        }
    }

    /**
     * 设置章节类型
     * @param {string} chapterType 章节类型
     */
    function _setChapterType(chapterType){
        if(typeof chapterType === 'undefined'){
            return;
        }

        var $item = _nodes.$chapterTypeBox.find('[data-node="listBox"] a[data-chaptertype="'+ chapterType +'"]');
        if($item.length === 0){
            return;
        }

        _nodes.$selectedChapterType
            .text($item.text())
            .attr('data-chaptertype', chapterType);

        $('#chapterTypeHidden').val(chapterType);
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
                    _topTip.show('返回的数据格式异常，请稍候再试');
                    return;
                }

                if (json.status) {
                    if(json.data){
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
     * 保存草稿
     */
    function _saveDraft() {
        if (_isSubmitting || _isJumpingPage) {
            return;
        }
        _isSubmitting = 1;
        //动态提交保存草稿的表单
        _util.ajaxSubmitForm($('#formDraft'), {
            type: "POST",
            data: {
                '_token': $.cookie('pubtoken')
            },
            dataType: "json",
            success: function(json) {
                if (!json) {
                    _topTip.show('返回的数据格式异常，请稍候再试');
                    return;
                }

                //成功
                if (json.status) {
                    _isJumpingPage = 1;

                    _topTip.show(json.info || '保存成功', function() {
                        var type = _getEditDraftType(); //操作类型

                        _cancelTipByExitEdit();

                        //新建草稿
                        if (type === 'add') {
                            //刷新当前页
                            _jumpPage(_params.chapterTmpUrl);
                        } else if (type === 'update') { //更新草稿
                            if (json.data && json.data.CCID) {
                                //查看新建的草稿
                                _getSelectedDraftInfo(json.data.CCID, _updateDraftItem);
                            }
                        }
                    });
                } else {

                    _dialog.alert(json.info || '操作失败，请稍候再试');
                }
            },
            error: function() {

                _dialog.alert('操作失败，请稍候再试');
            },
            complete: function() {
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

        //重置保存按钮状态
        _isSubmitting = 0;
        _isJumpingPage = 0;

        //避免同时多次请求
        if(_isLoading){
            return;
        }
        _isLoading = 1;

        _util.request({
            url: _ajaxUrls.getDraftInfo,
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
                    _currentDraftData = json.data;
                    //显示草稿的编辑模式
                    _editDraft(_currentDraftData);

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
        var isconfirm=options.isconfirm?options.isconfirm:0;
        var requestData = {
            'CBID': options.CBID, //作品id
            'CVID': options.CVID, //卷id
            'CCID': options.CCID, //章节id
            'type': options.type, //操作类型
            'vipflag': options.vipflag, //是否vip章节
            'chaptertype' : options.chapterType,
            'status': options.status, //发布类型（2:立即发布 5：定时发布）
            'chaptertitle': options.chapterTitle,
            'content': options.chapterContent,
            'chapterextra': options.authorSpeak,
            'isconfirm':isconfirm
        };

        //定时发布
        if(options.status === '5'){
            //定时发布的时间
            if(!options.publishTime){
                _dialog.alert('请填写定时发布的时间');
                return;
            }
            var currentTimeNum=Date.parse(Date());
            var publishtimeNum=Date.parse(options.publishTime);
            if(currentTimeNum >= publishtimeNum)
            {
                $('#timing-tips-error').show();
                return;
            }
            else
            {
                $('#timing-tips-error').hide();
            }
            requestData.publishtime = options.publishTime;
        }

        //避免同时多次请求
        if(_isSubmitting || _isJumpingPage){
            return;
        }
        _isSubmitting = 1;

        var $closePopupBtn = $('#publishPopup').find('[data-node="close"]');

        _util.updateBtnText($btn, 'loading');
        $closePopupBtn.hide();

        _util.request({
            url: _ajaxUrls.publishDraft,
            data: requestData,
            type: 'post',
            dataType: "json",
            success: function(json) {
                if (!json) {
                    _dialog.alert('返回的数据格式异常，请稍候再试');
                    return;
                }

                if (json.status) {
                    _isJumpingPage = 1;
                    _closePublishPopup();

                    if(requestData.status === '5')
                    {
                        json.info="操作成功 该章节将于 "+requestData.publishtime+" 发布";
                    }
                    _topTip.show(json.info || '操作成功', function(){
                        _cancelTipByExitEdit();

                        //立即发布
                        if(requestData.status === '2'){
                            if(json.data && json.data.jumpUrl){
                                //根据返回的jumpUrl刷新页面，避免当前页面是新建章节的url
                                _jumpPage(json.data.jumpUrl);
                            }
                        }else{
                            //刷新页面
                            _jumpPage(_params.chapterTmpUrl);
                        }
                    });
                } else {
                    if(json.code==1001)
                    {
                        
                        _dialog.confirm(
                            json.info,
                            function(){
                                options.isconfirm=1;
                                _publishDraft($btn, options);
                            }
                        );
                        
                    }else
                    {
                        _dialog.alert(json.info || '操作失败，请稍候再试');
                    }
                    
                }
            },
            error: function() {
                _dialog.alert('操作失败，请稍候再试');
            },
            complete : function(){
                _isSubmitting = 0;
                _util.updateBtnText($btn, 'default');
                $closePopupBtn.show();
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

        if(_isSubmitting || _isJumpingPage){
            return;
        }
        _isSubmitting = 1;
       
        _util.request({
            url: _ajaxUrls.deleteDraft,
            type: 'post',
            dataType: 'json',
            data: {
                'CBID': _params.bookId,
                'CCID' : chapterId
            },
            success: function(json) {
                if (!json) {
                   _topTip.show('返回数据格式异常，请稍后再试');
                   return;
                }

                if(json.status){
                     _isJumpingPage = 1;

                    _topTip.show(json.info || '删除成功，回收站内可找回', function(){
                        _cancelTipByExitEdit();
                        //刷新页面
                        _jumpPage(_params.chapterTmpUrl);
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
    function _editDraft(data){
        _setTipByExitEdit();
        _removeNewDraftItem();

        var $chapterIdHidden = $('#chapterIdHidden'), //章节id
            $statusHidden = $('#statusHidden'), //章节状态
            $chapterVipFlagHidden = $('#chaptervipFlagHidden'); //是否为vip章节

        var $titleInput = $('#chapterTitleInput'), //标题
            $contentInput = $('#chapterContentInput'), //内容
            $speakInput = $('#authorSpeakInput'), //作者的话
            $deleteDraftBtn = $('#deleteDraftBtn'); //删除草稿的按钮

        var chaptertitle = $titleInput.attr('data-default'),
            content = $contentInput.attr('data-default'),
            chapterextra = $speakInput.attr('data-default'); //作者的话

        //新建草稿
        if(!data){
            _addNewDraftItem();
            _setEditDraftType('add');
            $deleteDraftBtn.hide();

            $chapterIdHidden.val('');
            $statusHidden.val('1');
        }else{ //更新草稿
            chaptertitle = data.chaptertitle;
            content = data.content;
            chapterextra = data.chapterextra;

            _setEditDraftType('update');
            $deleteDraftBtn.show();

            $chapterIdHidden.val(data.CCID);

            _setVolume(data.CVID);
            _setChapterType(data.chaptertype);

            $statusHidden.val(data.status);
            $chapterVipFlagHidden.val(data.vipflag);
        }

        $titleInput.val(chaptertitle);
        $contentInput.val(content);
        $speakInput.val(chapterextra);

        //初始化输入框的文字颜色
        $.each([$titleInput, $contentInput, $speakInput], function(index, $el){
            if($el.val() === $el.attr('data-default')){
                $el.css('color', _grayColor);
            }else{
                $el.css('color', _blackColor);
            }
        });
        
        var $draftBox = $('#editDraftBox'); //编辑草稿容器
        $draftBox.show();

        var $btnBox = $('#draftBtnBox');
        //没有设置过悬浮
        if($btnBox.attr('data-slide') !== '1'){
            $btnBox.attr('data-slide', '1');

            //设置成悬浮
            $btnBox.portamento({
                'wrapper': $draftBox,
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
            //章节名称
            $popup.find('[data-node="chapterName"]').text($('#chapterTitleInput').val());

            //章节类型名称
            $popup.find('[data-node="chapterTypeName"]').text(_nodes.$selectedChapterType.text());

            //发布类型（2:立即发布 5：定时发布）
            var $publishTypeRadio = $popup.find('[data-node="publishTypeRadio"]'),
                $publishDateBox = $('#publishDateBox');
            
            $publishTypeRadio.parent().removeClass('on');

            //定时发布
            if(_currentDraftData && _currentDraftData.status == 5){
                $publishTypeRadio.filter('[value="5"]').prop('checked', 'checked').parent().addClass('on');
            }else{ //立即发布
                $publishTypeRadio.filter('[value="2"]').prop('checked', 'checked').parent().addClass('on');
            }

            //定时发布时间
            if(_currentDraftData && _currentDraftData.status == 5 && _currentDraftData.newPublishTime){
                //去掉秒
                // $('#publishDateInput').val(_currentDraftData.newPublishTime.substr(0, 16));
                $('#datePickerTrigger-set').val(getPublishDate(_currentDraftData.newPublishTime));
                $('#timePickerTrigger').val(getPublishTime(_currentDraftData.newPublishTime));
                
                $publishDateBox.show();
            }else{
                // $('#publishDateInput').val('');
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
            $el.val($el.attr('data-default')).css('color', _grayColor);
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
            $authorSpeakInput = $('#authorSpeakInput'),
            hasCurrentDraftData = !!_currentDraftData;

        var list = [
            {
                'userInput' : $chapterTitleInput.val(), //用户输入
                'defaultInput': $chapterTitleInput.attr('data-default'), //默认输入
                'original': hasCurrentDraftData ? _currentDraftData.chaptertitle : '' //原始内容
            },
            {
                'userInput' : $chapterContentInput.val(),
                'defaultInput': $chapterContentInput.attr('data-default'),
                'original': hasCurrentDraftData ? _currentDraftData.content : ''
            },
            {
                'userInput' : $authorSpeakInput.val(),
                'defaultInput': $authorSpeakInput.attr('data-default'),
                'original': hasCurrentDraftData ? _currentDraftData.chapterextra : ''
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

    /**
     * 跳转页面
     * @param  {string} url 页面地址 (默认为当前页)
     */
    function _jumpPage(url){
        url = url || location.href;
        location.href = url;
    }
    /**
     * [getPublishDate 定时发布的日期]
     * @param  {[type]} publishtime [description]
     * @return {[type]}             [description]
     */
    function getPublishDate(publishtime)
    {
        var arrDate=publishtime.match(/\d+/g);
        return arrDate[0]+'年'+arrDate[1]+'月'+arrDate[2]+'日';
    }
    /**
     * [getPublishTime 定时发布的时间]
     * @param  {[type]} publishtime [description]
     * @return {[type]}             [description]
     */
    function getPublishTime(publishtime)
    {
        var arrDate=publishtime.match(/\d+/g);
        return arrDate[3]+'时'+arrDate[4]+'分';
    }

    _util.initNameSpace("CS.page.bookManage");
    CS.page.bookManage.chapterDraft = {
        'init': init
    };

})(jQuery);




LBF.use(['lib.jQuery','ui.widget.DatePicker.DatePicker','ui.widget.Dropdown.Dropdown','ui.widget.TimePicker.TimePicker', 'ui.Nodes.TextInput'], function($,DatePicker,Dropdown,TimePicker,TextInput) {
    
    var date = new DatePicker({
        trigger: '#datePickerTrigger-set',
        display: '#datePickerTrigger-set',
        format: 'Y年m月d日',
        monthFormat: 'Y年m',
        yearFormat: 'Y',
        date: new Date()
    });
    
    var initDate=new Date();
    new TimePicker({
    trigger: '#timePickerTrigger',
    display: '#timePickerTrigger',
    selectedHour: initDate.getHours(),        //初始小时
    selectedMinute: initDate.getMinutes(),      //初始分钟
    format: 'G时i分',
    events: {
        selectTime: function(e, time) {
            this.toggle();
        }
    }
    });
    
     new TextInput({
        selector: '#timePickerTrigger'
    });

});
    $('.minTipBox .close').click(function () {
        $(this).parent('.minTipBox').fadeOut();
    });


    $('.sectionList li').click(function () {
        $(this).addClass('act').siblings().removeClass('act');
    })

    //顶部居中提示
    function topTip() {
        var tipBoxCenter = ($(window).width() - $('.top-tipbox').width()) / 2;
        $('.top-tipbox').css('left', tipBoxCenter);
    }

    topTip();

    $(window).resize(function () {
        topTip();
    })
    //看效果用，不必写入开发环境
    $(function () {
        $('.sideBar li').on('click', function () {
            $(this).addClass('act').siblings().removeClass();
        });

        // $('#publishDateInput').datetimepicker({
        //     lang: 'ch',
        //     step: 5 //时间间隔
        // });

        //使用方法：
        /*$('#obj').datetimepicker({
         lang:"ch",           //语言选择中文
         format:"Y-m-d",      //格式化日期
         timepicker:false,    //关闭时间选项
         yearStart：2000,     //设置最小年份
         yearEnd:2050,        //设置最大年份
         todayButton:false    //关闭选择今天按钮
         });*/

        //新建分卷弹窗
        $('#create-sub').on('click', function () {
            $('#sub-popup').show();
            $('.mask').show();
        })

        // maskSub = new mask($('#sub-popup'));
        // $('#create-sub').on('click', function () {
        //     maskSub.open();
        // });

        // $('#sub-popup .closePopup').on('click', function () {
        //     maskSub.close();
        // });
        
        $("#J-button1").click(function(){
        $("#timePopupWrap").show();
        $("#timePopupWrap").css({
            'position': 'fixed',
            'z-index': 1000,
            'top': '50px',
            'left': '40%'
        })
            
        }); 
        
        $("#J-dialog1 .close-btn").click(function(){
         up_layer.close_layer('#J-dialog1');
        }); 
    });