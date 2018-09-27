/**
 * 作品管理：修改作品信息
 * @namespace CS.page.bookManage.bookModify
 * @update 2015-11-17
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
        _recommendBookMaxCount = 10; //最多可推荐的作品数量

    //ajax地址列表
    var _ajaxUrls = {
        'modifyBookName' : '/Content/Booksubmit/updatetitle.html', //修改作品名称
        'modifyIntro' : "/Content/Booksubmit/novelintrosubmit.html", //修改作品简介
        'modifyTag': '/Content/Booksubmit/updatetag.html', //修改作品标签
        'updateBookStatus' : '/Content/Booksubmit/updatestatus.html', //更新作品状态
        'uploadBookCover' : '/Content/Booksubmit/updatecoverurl.html', //上传作品封面
        'searchBook' : "/Content/Booknovels/ajaxsearchbook.html", //搜书
        'recommendBook' : "/Content/Booknovels/ajaxAddTuiJian.html", //推荐书
        'checkBookTitleExist' : "/Content/Booknovels/isMayEditBookname.html",  //书名验证
        'cancelRecommendBook' : "/Content/Booknovels/ajaxDelTuiJian.html" //取消推荐书
    };

    //作品标签的模板
    var _tagItemTpl = '<a data-tagid="$tagId$" title="$tagName$" href="javascript:;">$tagName$<i></i></a>';

    //搜索推荐的书列表的模板
    var _searchBookListTpl = [
        '<dl>',
            '<%each bookList as book index%>',
                '<dd>',
                    '<a data-bid="<%= book.BID %>" href="javascript:;"><%= book.title %></a>',
                '</dd>',
            '<%/each%>',
        '</dl>'
    ].join('');

    //推荐的单本书的模板
    var _recommendBookItemTpl = '<a data-bid="$bid$" href="javascript:;">$title$<cite data-node="del" class="icon"></cite></a>';

    /**
     * 初始化
     * @param  {string} CBID  作品id
     * @param  {string} globalId 作品唯一id
     */
    function init(CBID, globalId) {
        _params.CBID = CBID || '';
        _params.globalId = globalId || '';

        _nodes.$selectedNovelTagList = $('#selectedNovelTagList'); //选中的作品标签列表

        _bindEvent();
        _bindEventByBookTag();
        _bindEventByRecommendBook();
    }

    /**
     * 绑定元素事件
     */
    function _bindEvent(){
        var $selecCoverBtn = $('#selectCoverBtn'), //选择作品封面按钮
            $submitCoverBtn = $('#submitCoverBtn'), //提交封面的按钮
            $cancelSubmitCoverBtn = $('#cancelSubmitCoverBtn'); //取消提交封面的按钮

        //选择作品封面按钮
        $('#coverFileBtn').on('change', function() {
            var isSelectedImg = _localImg.show($(this), $('#previewImg'), {
                'supportFileTypes': 'jpg|png', //支持的文件类型
                'fileTypeErrorTips': '图片格式只能是JPG、PNG',
                'imgMaxSize': 5120, //图片最大容器（单位KB）
                'imgMaxSizeTips': '您上传的图片大于5MB' //图片超过最大容量限制的提示
            });

            //成功选择了图片
            if(isSelectedImg){
                $selecCoverBtn.hide();
                $('#coverFileBtn').hide();
                $submitCoverBtn.show();
                $cancelSubmitCoverBtn.show();
            }
        });

        //提交封面的按钮
        $submitCoverBtn.on('click', function() {
            _uploadBookCover();
            return false;
        });

        //取消提交封面的按钮
        $cancelSubmitCoverBtn.on('click', function() {
            $selecCoverBtn.show();
            $('#coverFileBtn').show();
            $submitCoverBtn.hide();
            $cancelSubmitCoverBtn.hide();
            return false;
        });

        //修改作品名称的按钮
        $('#modifyTitleBtn').on('click', function() {
            var bookName = $('#bookNameInput').val();

            _modifyBookName(bookName);
            return false;
        });

        //修改作品简介的按钮
        $('#modifyIntroBtn').on('click', function() {
            var intro = $('#introInput').val();
            _modifyIntro(intro);
            return false;
        });

        //保存作品状态的按钮
        $('#modifyStatusBtn').on('click', function(event) {
            event.preventDefault();

            var status = $('input[name="Updatestatus"]:checked').val();
            _modifyBookStatus(status);
        });

        //作品标签滚动条
        $('#novelTagPopup_tagList').slimScroll({
            height: '328px',
            railVisible: true
        });
    }

    /**
     * 绑定作品标签的元素事件
     */
    function _bindEventByBookTag(){
        var $novelTagPopup = $('#novelTagPopup'), //作品标签浮层
            $tagList = $('#novelTagPopup_tagList'); //作品标签浮层: 标签列表
        
        //用户已选标签
        _nodes.$selectedNovelTagList.find('[data-tagid]').each(function(index, el) {
            var tagid = $(el).attr('data-tagid');
            if(tagid){
                //标签浮层：设置标签的选中效果
                $tagList.find('[data-tagid="'+ tagid +'"]').addClass('act');
            }
        });

        //修改作品标签的按钮
        $('#modifyTagBtn').on('click', function() {
            //用户已选标签
            var tags = _getSelectedTags();

            _modifyTag(tags.join(','));
            return false;
        });

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
            $(this).addClass('act').siblings('a').removeClass('act');
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
     * 修改作品名称
     * @param {string} bookName 作品名称
     */
    function _modifyBookName(bookName){
        if(!bookName || $.trim(bookName).length === 0){
            _dialog.alert('请输入作品名称');
            return;
        }

        if(_isRequesting){
            return;
        }
        _isRequesting = 1;

        _util.request({
            url: _ajaxUrls.modifyBookName,
            data: {
                'CBID': _params.CBID,
                'title' : bookName
            },
            type: 'post',
            dataType: "json",
            success: function(json) {
                if(!json){
                    _dialog.alert('返回的数据格式异常，请稍候再试');
                    return;
                }
       
                //成功
                if (json.status) {
                    _dialog.alert(json.info || '保存成功');
                }else{
                    _dialog.alert(json.info || '保存失败，请稍候再试');
                }
            },
            error : function(){
                _dialog.alert('网络异常，请稍候再试');
            },
            complete : function(){
                _isRequesting = 0;
            }
        });
    }

    /**
     * 修改作品简介
     * @param  {string} intro 简介内容
     */
    function _modifyIntro(intro){
        if(!intro){
            intro = '';
        }

        if(_isRequesting){
            return;
        }
        _isRequesting = 1;

        _util.request({
            url: _ajaxUrls.modifyIntro,
            data: {
                'CBID': _params.CBID,
                'info' : intro
            },
            type: 'post',
            dataType: "json",
            success: function(json) {
                if(!json){
                    _dialog.alert('返回的数据格式异常，请稍候再试');
                    return;
                }
                if(json.info){
                    _dialog.alert(json.info);
                }
                //成功
                if (json.status) {
                    $('#introInput').attr({
                        'readonly' : true,
                        'disabled' : true
                    });
                    $('#modifyIntroBtn').hide();
                }
            },
            error : function(){
                _dialog.alert('网络异常，请稍候再试');
            },
            complete : function(){
                _isRequesting = 0;
            }
        });
    }

    /**
     * 修改作品状态
     * @param  {string} status 作品状态
     */
    function _modifyBookStatus(status){
        if(!status){
            return;
        }

        if(_isRequesting){
            return;
        }
        _isRequesting = 1;

        _util.request({
            url: _ajaxUrls.updateBookStatus,
            data: {
                'CBID': _params.CBID,
                'status' : status
            },
            type: 'post',
            dataType: "json",
            success: function(json) {
                if(!json){
                    _dialog.alert('返回的数据格式异常，请稍候再试');
                    return;
                }
       
                //成功
                if (json.status) {
                    _dialog.alert(json.info || '保存成功');
                }else{
                    _dialog.alert(json.info || '保存失败，请稍候再试');
                }
            },
            error : function(){
                _dialog.alert('网络异常，请稍候再试');
            },
            complete : function(){
                _isRequesting = 0;
            }
        });
    }

     /**
     * 修改作品标签
     * @param {string} tags 逗号分隔的作品标签名称
     */
    function _modifyTag(tags){
        if(!tags){
            _dialog.alert('请选择作品标签');
            return;
        }

        if(_isRequesting){
            return;
        }
        _isRequesting = 1;

        _util.request({
            url: _ajaxUrls.modifyTag,
            data: {
                'CBID': _params.CBID,
                'tag' : tags
            },
            type: 'post',
            dataType: "json",
            success: function(json) {
                if(!json){
                    _dialog.alert('返回的数据格式异常，请稍候再试');
                    return;
                }
       
                //成功
                if (json.status) {
                    _dialog.alert(json.info || '保存成功');
                }else{
                    _dialog.alert(json.info || '保存失败，请稍候再试');
                }
            },
            error : function(){
                _dialog.alert('网络异常，请稍候再试');
            },
            complete : function(){
                _isRequesting = 0;
            }
        });
    }

    /**
     * 上传作品封面
     */
    function _uploadBookCover(){
        //动态上传图片
        $.ajaxFileUpload({
            url: _ajaxUrls.uploadBookCover,
            type: 'post',
            secureuri: false,
            fileElementId: 'coverFileBtn', //input type=file的id
            dataType: 'json',
            data: {
                'CBID': _params.CBID
            },
            success: function(data) {
                if (!data) {
                    return;
                }
                if (data.status) {
                    _dialog.alert(data.info || '上传成功');
                } else if (data.info) {
                    _dialog.alert(data.info || '上传失败，请稍候再试');
                }
            },
            error: function(data, status, e) {
                _dialog.alert("网络异常，请稍候再试");
            }
        });
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
     * 刷新当前页
     */
    function _refreshCurrentPage(){
        location.href = location.href;
    }

    _util.initNameSpace("CS.page.bookManage");
    CS.page.bookManage.bookModify = {
        'init': init
    };

})(jQuery);