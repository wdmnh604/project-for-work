/**
 * 作品管理：修改作品信息
 * @namespace CS.page.bookManage.bookModify
 * @update 2015-11-27
 */
(function($) {
    //外部依赖
    var _util = CS.util,
        _uiBinder = CS.uiBinder,
        _mask = CS.mask,
        _dialog = CS.dialog,
        _localImg = CS.localImg;

    var _params = {}, //参数集合
        _nodes = {}, //页面元素的对象集合
        _maskByNovelTagPopup = null, //作品选择浮层的遮罩层组建的实例对象
        _isRequesting = 0, //是否正在发起请求
        _isSubmitting = 0, //表单是否正在提交中
        _searchBookTimeout = null, //搜书的触发时间间隔
        _maxSelectedTagCount = 3, //最多可选的标签数量
        _recommendBookMaxCount = 10; //最多可推荐的作品数量

    //ajax地址列表
    var _ajaxUrls = {
        'searchBook' : "/Home/Booknovels/ajaxSearchBook.html", //搜书
        'recommendBook' : "/Home/Booknovels/ajaxAddTuiJian.html", //推荐书
        'checkBookTitleExist' : "/Home/Booknovels/isMayEditBookname.html",  //书名验证
        'cancelRecommendBook' : "/Home/Booknovels/ajaxDelTuiJian.html" //取消推荐书
    };

    //作品标签的模板
    var _tagItemTpl = '<a data-tagid="$tagId$" title="$tagName$" href="javascript:;">$tagName$<i></i></a>';

    //搜索推荐的书列表的模板
    var _searchBookListTpl = [
        '<dl>',
            '<%each bookList as book index%>',
                '<dd>',
                    '<a data-bid="<%= book.CBID %>" href="javascript:;"><%= book.title %></a>',
                '</dd>',
            '<%/each%>',
        '</dl>'
    ].join('');

    //推荐的单本书的模板
    var _recommendBookItemTpl = '<a data-bid="$bid$" href="javascript:;">$title$<cite data-node="del" class="icon"></cite></a>';

    /**
     * 初始化
     * @param  {string} novelId  作品id
     * @param  {string} globalId 作品唯一id
     */
    function init(novelId, globalId) {
        _params.novelId = novelId || '';
        _params.globalId = globalId || '';

        _nodes.$form = $('#formModifyBook');
        _nodes.$selectedNovelTagList = $('#selectedNovelTagList'); //选中的作品标签列表

        _setFormValidate();

        _bindEvent();
        _bindEventByBookTag();
        _bindEventByRecommendBook();
    }

    /**
     * 绑定元素事件
     */
    function _bindEvent(){
        var $bookWrap = $('#bookWrap'); //作品信息容器

        //选择作品封面按钮
        $('#selectBookCoverBtn').on('change', function() {
            _localImg.show($(this), $('#previewImg'), {
                'imgMaxSize': 5120, //图片最大容器（单位5MB）
                'imgMaxSizeTips': '您上传的图片大于5MB' //图片超过最大容量限制的提示
            });
        });
    
        //切换到修改模式的按钮
        $('#switchModifyModeBtn').on('click', function () {
            $bookWrap.find('.modify').show();
            $bookWrap.find('.saved').hide();
            return false;
        });

        //取消作品设置的按钮
        $('#cancelBookSettingBtn').on('click', function () {
            $bookWrap.find('.modify').hide();
            $bookWrap.find('.saved').show();
        });

        //保存修改的按钮
        $('#saveBookSettingBtn').on('click', function() {
            _submitForm();
            return false;
        });
    }

    /**
     * 绑定作品标签的元素事件
     */
    function _bindEventByBookTag(){
        var $novelTagPopup = $('#novelTagPopup'), //作品标签浮层
            $tagList = $('#novelTagPopup_tagList'), //作品标签浮层: 标签列表
            tagBoxCount = $tagList.find('[data-node="tagBox"]').length, //标签种类容器的数量
            selectedTags = _getSelectedTags(); //用户已选标签

        //作品标签滚动条
        $tagList.slimScroll({
            height: '328px',
            railVisible: true
        });

        if(selectedTags && selectedTags.length > 0){
            $.each(selectedTags, function(index, tagid){
                //标签浮层：设置用户已选标签的选中效果
                $tagList.find('[data-tagid="'+ tagid +'"]').addClass('act');
            });
        }

        //已选中的作品标签的删除按钮
        _nodes.$selectedNovelTagList.on('click', 'a', function() {
            var val = $(this).attr('data-tagid');
            _deleteNovelTag(val);

            return false;
        });

        //打开作品标签选择浮层的按钮
        _nodes.$selectedNovelTagList.on('click', function(event) {
            event.preventDefault();

            if(!_maskByNovelTagPopup){
                _maskByNovelTagPopup = new _mask($novelTagPopup);
            }

            if(_maskByNovelTagPopup){
                _maskByNovelTagPopup.open();
            }
        });

        //作品标签选择浮层：关闭按钮
        $('#novelTagPopup_closeBtn').on('click', function(event) {
            event.preventDefault();
            _closeNovelTagPopup();
        });

        //作品标签按钮
        $('#novelTagPopup_tagList').on('click', 'a', function(event) {
            event.preventDefault();

            //有多种标签
            if(tagBoxCount > 1){
                //每种标签只能选一个
                $(this).addClass('act').siblings('a').removeClass('act');
            }else{ //总共一种标签
                if($(this).hasClass('act')){
                    $(this).removeClass('act');
                }else if($(this).siblings('a.act').length < _maxSelectedTagCount){ //不超过最大选取数量
                    $(this).addClass('act');
                }
            }
        });

        //作品标签选择浮层：确定按钮
        $('#novelTagPopup_confirmBtn').on('click', function(event) {
            event.preventDefault();
            _selectNovelTag();
        });
    }

    /**
     * 绑定推荐作品的元素事件
     */
    function _bindEventByRecommendBook(){
        var $searchBookInput = $("#searchBookInput"), //推荐作品输入框
            $searchBookResultList = $('#searchBookResultList'), //搜书结果列表
            $recommendBookList = $('#recommendBookList'); //已推荐作品列表

        //推荐作品输入框
        $searchBookInput.on('keyup', function() {
            if(_searchBookTimeout){
                clearTimeout(_searchBookTimeout);
            }
            //避免太频繁地触发搜索
            _searchBookTimeout = setTimeout(function(){
                _searchRecommendBook($searchBookInput.val());
            }, 200);
        });
        
        //已推荐的作品列表: 单个作品的删除按钮
        $recommendBookList.on("click", '[data-node="del"]', function() {
            var bid = $(this).parent().attr('data-bid');

            _cancelRecommendBook(bid);
            return false;
        });

        //搜书结果列表中的单个作品
        $searchBookResultList.on('click', 'a', function() {
            var bid = $(this).attr("data-bid"),
                title = $(this).text();

            $searchBookInput.val(title).attr('data-bid', bid);
            $searchBookResultList.hide().empty();
        });
        
        //推荐作品按钮
        $('#recommendBookBtn').on("click", function() {
            var bid = $searchBookInput.attr('data-bid'),
                bookTitle = $searchBookInput.val();

            _recommendBook(bid, bookTitle);
            return false;
        });

        //点击页面空白处，隐藏推荐作品的联想列表
        $(document).on("click", function(e) {
            var target = $(e.target);

            if (target.closest($searchBookInput).length === 0) {
                //推荐作品的联想列表
                $searchBookResultList.fadeOut(200);
            }
        });
    }

    /**
     * 设置表单验证
     */
    function _setFormValidate(){
        var $bookNameInput = $('#bookNameInput');

        //检测书名
        jQuery.validator.addMethod("bookNameCheck", function(value, element) {
            return this.optional(element) || /^[A-Za-z0-9\u4E00-\u9FFF：——“”.]{1,15}$/.test(value);
        }, "15个字内，请不要加书名号等特殊符号");
          
        _nodes.$form.validate({
            'rules' : {
                'bookname': {
                    bookNameCheck: true,
                    required: true,
                    remote: { //检测书名是否存在
                        url: _ajaxUrls.checkBookTitleExist,
                        type: "post",
                        data: {
                            bookTitle: function() {
                                return $bookNameInput.val();
                            },
                            CBID: function() {
                                return _params.novelId;
                            },
                            def: function() {
                                return $bookNameInput.attr('data-def');
                            }
                        }
                    }
                },
                'intro': { //作品介绍
                    required: true,
                    byteRangeLengthByOne: [20, 300]
                }
            },
            'messages': {
                'bookname' : {
                    required: "书名不能为空",
                    remote: "这本大作已经有人写过了，再想个名字吧！"
                },
                'intro': {
                    required: "请输入作品介绍",
                    byteRangeLengthByOne: "请输入20-300字介绍您的作品"
                }
            },
            errorElement : 'span', //label会触发css设置的float:left
            errorPlacement:function(error, element) {
                var $error = element.nextAll('[data-node="error"]');
                
                $error.html(error);
                element.nextAll('[data-node="ok"]').hide();
                element.nextAll('[data-node="tip"]').hide();

                 //检测的是书名输入框
                if(element.attr('id') === 'bookNameInput'){
                    $error.css('display', 'inline-block');
                }else{
                    $error.show();
                }
            },
            success : function(error){
                var $errorBox = error.parent(),
                    $ok = $errorBox.prevAll('[data-node="ok"]');

                //检测的是书名输入框
                if($errorBox.parent().has('#bookNameInput')){
                    $ok.find('[data-node="text"]').text('书名修改后需提交审核，2个工作日内完成');
                    //同一行显示
                    $ok.css('display', 'inline-block');
                }else{
                    $ok.show();
                }

                $errorBox.prevAll('[data-node="tip"]').show();
                $errorBox.hide();
                //移除后才能每次出错时触发errorPlacement
                error.remove();
            }
        });
    }

    /**
     * 动态提交表单
     */
    function _submitForm(){
        if(!_nodes.$form.valid()){
            return;
        }

        if(_isSubmitting){
            return;
        }
        _isSubmitting = 1;

        //修改作品的表单
        _util.ajaxSubmitForm(_nodes.$form, {
            type : "POST",
            data : {},
            dataType : "json",
            success : function(json){
                if(!json){
                    _dialog.alert('返回的数据格式异常，请稍候再试');
                    return;
                }

                //成功
                if(json.status){
                    _dialog.alert(json.info || '修改成功', function(){
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
     * 获取用户的已选标签id
     * @return {array} 标签id的数组
     */
    function _getSelectedTags(){
        var arrTag = [];

        _nodes.$selectedNovelTagList.find('[data-tagid]').each(function(index, el) {
            var tagid = $(el).attr('data-tagid');
            if(tagid){
                arrTag.push(tagid);
            }
        });

        return arrTag;
    }

    /**
     * 选中标签
     * @param {string} tagName     标签名称
     * @param {string} tagId     标签id
     * @param {element object} tagBtn 标签按钮的元素对象
     */
    function _selectNovelTag() {
        var $selectedTag = $('#novelTagPopup_tagList').find('a.act'),
            tpl = '',
            frag = document.createDocumentFragment();

        _nodes.$selectedNovelTagList.empty();

        $selectedTag.each(function(index, el) {
            var $el = $(el),
                tagId = $el.attr('data-tagid'),
                tagName = $el.text();

            tpl = _util.replaceTpl(_tagItemTpl, {
                'tagId': tagId,
                'tagName': tagName
            });
            
            frag.appendChild($(tpl).get(0));
        });

    
        _nodes.$selectedNovelTagList.append(frag);
        _saveNovelTag();
        _closeNovelTagPopup();
    }

    /**
     * 删除已选的作品标签
     * @param  {string} tagId 标签id
     */
    function _deleteNovelTag(tagId) {
        //已经选中的标签列表
        _nodes.$selectedNovelTagList.find('a').each(function() {
            var $this = $(this);
            if ($this.attr("data-tagid") == tagId) {
                $this.remove();
                return false;
            }
        });

        //作品标签浮层中的对应选中标签，去除选中效果
        $('#novelTagPopup_tagList').find('[data-tagid="'+ tagId +'"]').removeClass('act');

        _saveNovelTag();
    }

    /**
     * 保存选中的作品标签
     */
    function _saveNovelTag() {
        var arrTag = _getSelectedTags();

        $("#tagIdListHidden").val(arrTag.join(','));
    }

    /**
     * 关闭作品标签选择浮层
     */
    function _closeNovelTagPopup(){
        if(_maskByNovelTagPopup){
            _maskByNovelTagPopup.close();
        }
    }

   /**
    * 搜索相关的推荐作品
    * @param  {string} inputText 输入的文字
    */
    function _searchRecommendBook(inputText){
        var $list = $('#searchBookResultList'); //搜书的结果列表

        $list.hide().empty();

        //过滤输入
        if (/^[A-Za-z0-9\u4E00-\u9FFF：，]{1,15}$/.test(inputText)) {
            //根据输入查询相关作品
            _util.request({
                url: _ajaxUrls.searchBook,
                data: {
                    'Booktitle': inputText,
                    'globalId' : _params.globalId
                },
                type: 'post',
                dataType: "json",
                success: function(json) {
                    if (json && json.status) {
                        if (json.data && json.data.list && json.data.count > 0) {
                            var tpl = _uiBinder.bindData(_searchBookListTpl, {
                                'bookList' : json.data.list
                            });
                            
                            $list.html(tpl).show();
                        }
                    }
                }
            });
        }
    }

   /**
    * 推荐作品
    * @param  {int} bid      作品id
    * @param  {string} bookTitle 作品标题
    */
    function _recommendBook(bid, bookTitle){
        if(!bid || !bookTitle){
            _dialog.alert('作品不存在，请确认您输入的作品名拼写正确');
            return;
        }

        var hasRecommended = 0,
            $recommendBookList = $('#recommendBookList'), //已推荐的作品列表
            $recommendedBook = $recommendBookList.find('a'); //已经推荐过的作品

        if ($recommendedBook.length >= _recommendBookMaxCount) {
            _dialog.alert('最多可以推荐'+ _recommendBookMaxCount +'本作品');
            return;
        }

        //检测是否推荐过
        $recommendedBook.each(function() {
            if ($(this).attr('data-bid') === bid) {
                hasRecommended = 1;
                return false;
            }
        });

        //已经推荐过
        if(hasRecommended){
            _dialog.alert('该作品已在您的推荐作品列表中');
            return;
        }

        _util.request({
            url: _ajaxUrls.recommendBook,
            data: {
                'bid': bid,
                'globalId' : _params.globalId
            },
            type: 'POST',
            dataType: "json",
            success: function(json) {
                if(!json){
                    return;
                }
                if(json.info){
                    _dialog.alert(json.info);
                }
                //成功
                if (json.status) {
                    var tpl = _util.replaceTpl(_recommendBookItemTpl, {
                        'bid': bid,
                        'title': bookTitle
                    });

                    //添加到已推荐列表
                    $recommendBookList.append(tpl);
                }
            },
            error : function(){
                _dialog.alert('操作失败，请稍候再试');
            }
        });
    }

    /**
    * 取消推荐作品
    * @param  {int} bid      作品id
    */
    function _cancelRecommendBook(bid){
        if(!bid){
            _dialog.alert('作品id未获取到');
            return;
        }

        _util.request({
            url: _ajaxUrls.cancelRecommendBook,
            data: {
                'bid': bid,
                'globalId' : _params.globalId
            },
            type: 'POST',
            dataType: "json",
            success: function(json) {
                if(!json){
                    return;
                }
                if(json.info){
                    _dialog.alert(json.info);
                }
                //成功
                if (json.status) {
                    //移除已推荐作品列表的单个作品
                    $('#recommendBookList').find('a[data-bid="'+ bid +'"]').remove();
                }
            },
            error : function(){
                _dialog.alert('操作失败，请稍候再试');
            }
        });
    }

    _util.initNameSpace("CS.page.bookManage");
    CS.page.bookManage.bookModify = {
        'init': init
    };

})(jQuery);