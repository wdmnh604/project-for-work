/**
 * 作品管理：修改作品信息
 * @namespace CS.page.bookManage.bookModify
 * @update 2015-12-10
 */
(function($) {
    //外部依赖
    var _util = CS.util,
        _uiBinder = CS.uiBinder,
        _mask = CS.mask,
        _dialog = CS.dialog,
        _topTip = CS.topTip, //顶部提示
        _localImg = CS.localImg;

    var _params = {}, //参数集合
        _nodes = {}, //页面元素的对象集合
        _maskByNovelTagPopup = null, //作品选择浮层的遮罩层组建的实例对象
        _isRequesting = 0, //是否正在发起请求
        _isSubmitting = 0, //表单是否正在提交中
        _searchBookTimeout = null, //搜书的触发时间间隔
        _maskuploadfile =null,//遮罩层实例对象
        _recommendBookMaxCount = 10, //最多可推荐的作品数量
        _boyHtml = "",//男生标签模版
        _girlHtml = ""; // 女生标签模版

    //ajax地址列表
    var _ajaxUrls = {
        'searchBook' : "/Contentv2/Booknovels/ajaxsearchbook.html", //搜书
        'recommendBook' : "/Contentv2/Booknovels/ajaxAddTuiJian.html", //推荐书
        'checkBookTitleExist' : "/Contentv2/Booknovels/isMayEditBookname.html",  //书名验证
        'cancelRecommendBook' : "/Contentv2/Booknovels/ajaxDelTuiJian.html", //取消推荐书
        'recommendList' : "/Contentv2/Booknovels/ajaxGetRecList" //推荐书列表
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
     */
    function init(CBID,novelssortsman,novelssortslady,site,authorization,isshow,salesleads,categoryid,subcategoryid,taglist) {
        _params.novelssortsman = novelssortsman || '';
        _params.novelssortslady = novelssortslady || '';
        _params.CBID = CBID || '';
        _params.site = site || '';
        _params.authorization = authorization || '';
        _params.isshow = isshow || '';
        _params.saletype = salesleads || '';
        _params.categoryid = categoryid || '';
        _params.subcategoryid = subcategoryid || '';
        _params.taglist = taglist || '';
        
        _nodes.$form = $('#formModifyBook');
        _nodes.$selectedNovelTagList = $('#selectedNovelTagList'); //选中的作品标签列表
        //保存原有的标签属性
        oldTagList = $('#selectedNovelTagList').html();
        //input[name] 标签值
        oriTagList = $('#tagIdListHidden').val();
        
        
        //根据站点匹配对应的作品标签模版
        _tagListPlate();

        _setFormValidate();

        _bindEvent();
        _bindEventByBookTag();
        _bindEventByRecommendBook();
    }
    
    /*
     * ajax获取推荐书
     */
    function _gettuijianBook(site){
        _util.request({
            url: _ajaxUrls.recommendList,
            data: {
                'CBID' : _params.CBID,
                'site' : site
            },
            type: 'POST',
            dataType: "json",
            success: function(json) {
                if(!json){
                    return;
                }
                //成功
                if (json.status) {
                    
                    var html = '';
                    $.each(json.list,function(key,val){
                        
                        html += "<a data-bid=\""+val['BID']+"\" href=\"javascript:\">"+val['title']+"";
                        html += "<cite data-node=\"del\" class=\"icon\"></cite></a>";
                    });
                    $('#recommendBookList').html(html);
                }
            },
            error : function(){
                return;
            }
        });
    }
    
    function _tagListPlate(){
        var boyLength = _params.taglist['boy'].length;
        var girlLength = _params.taglist['girl'].length;
        $.each(_params.taglist['boy'],function(key,val){
            _boyHtml += "<li> <span>"+val['tagName']+"</span>";
            _boyHtml += "<div class=\"tagFilter\">";      
            $.each(val['sonSet'],function(key1,val1){
                _boyHtml += "<a data-tagid=\""+val1['id']+"\" title=\""+val1['tagName']+"\" href=\"javascript:\">"+val1['tagName']+"</a>";
            });
            _boyHtml += "</div>";
            _boyHtml += "</li>";
        });
        
        $.each(_params.taglist['girl'],function(key,val){
            _girlHtml += "<li> <span>"+val['tagName']+"</span>";
            _girlHtml += "<div class=\"tagFilter\">";      
            $.each(val['sonSet'],function(key1,val1){
                _girlHtml += "<a data-tagid=\""+val1['id']+"\" title=\""+val1['tagName']+"\" href=\"javascript:\">"+val1['tagName']+"</a>";
            });
            _girlHtml += "</div>";
            _girlHtml += "</li>";
        });
        //男生站标签
        var $cur_site = $("input[name='site']").val();
        if($cur_site == 1 || $cur_site == 5){
            $('#tagCount').html(boyLength);
            $('#novelTagPopup_tagList').html(_boyHtml);
        }else{
            $('#novelTagPopup_tagList').html(_girlHtml);
            $('#tagCount').html(girlLength);
        }
    }
    
    function _siteChangeTagList(site){
        var boyLength = _params.taglist['boy'].length;
        var girlLength = _params.taglist['girl'].length;
        if(site == 1 || site == 5){
            $('#novelTagPopup_tagList').html(_boyHtml);
            $('#tagCount').html(boyLength);
        }else{
            $('#novelTagPopup_tagList').html(_girlHtml);
            $('#tagCount').html(girlLength);
        }
            
        
    }

    /**
     * 绑定元素事件
     */
    function _bindEvent(){
        var $bookWrap = $('#bookWrap'); //作品信息容器

        //上传封面弹出框
        $('#selectBookCoverBtn').on('click', function() {
            _maskuploadfile = new _mask($('#J-dialog1'));
            if(_maskuploadfile)
            {
                _maskuploadfile.open();
            }
        });
        //上传封面的按钮
        $('#img_file_btn_1,#img_file_btn_2').on('click',function(){
            $('#bookpic').click();
            $('.close-btn').click();

        });
        //上传封面
        $('#bookpic').on('change',function(){
            _localImg.show($(this), $('#previewImg'), {
                'imgMaxSize': 5120, //图片最大容器（单位5M）
                'imgMaxSizeTips': '您上传的图片大于5M' //图片超过最大容量限制的提示
            });

        });
        $('.close-btn').on('click',function(){
            if(_maskuploadfile)
            {
                _maskuploadfile.close();
            }
        });

        //切换到修改模式的按钮
        $('#switchModifyModeBtn').on('click', function () {
            $bookWrap.find('.modify').show();
            $bookWrap.find('.saved').hide();
            //设置默显示项
            if(_params.isshow == 'yes'){
                $("select[name='sites']").val(_params.site);
                $("select[name='authorization']").val(_params.authorization);
                
                //添加销售意向select 云起独有
                _addsalesLeadsAndRecommendwords(_params.site);
                //添加分类
                _NovelSubCategorySelector(_params.site);
            }
            return false;
        });
        
        if(_params.isshow == 'yes'){
            //站点切换
            $("select[name='sites']").on('change' ,function(){
                if($(this).val() != _params.site){
                    $("#selectedNovelTagList").html('');
                    $('#tagIdListHidden').val('');
                }else{
                    $("#selectedNovelTagList").html(oldTagList);
                    $('#tagIdListHidden').val(oriTagList);
                }
                //当站点发生变化时 更换不同的模版标签
                _siteChangeTagList($(this).val());
                _NovelSubCategorySelector($(this).val());
                _addsalesLeadsAndRecommendwords($(this).val());
                //获取推荐书的列表
                _gettuijianBook($(this).val());
            });
        }
        //取消作品设置的按钮
        $('#cancelBookSettingBtn').on('click', function () {
            //恢复原有的标签值
            $('#selectedNovelTagList').html(oldTagList);
            $('#tagIdListHidden').val(oriTagList);
            if(_params.isshow == 'yes'){
                $(".novelssort").remove();
            }
            $bookWrap.find('.modify').hide();
            $bookWrap.find('.saved').show();
        });

        //保存修改的按钮
        $('#saveBookSettingBtn').on('click', function() {
            _submitForm();
            return false;
        });
    }
    
    //添加销售意向select和推荐语
    function _addsalesLeadsAndRecommendwords(siteType){
        if(siteType == 2){
            var html = '';
            html += "<em>销售意向：</em>";
            html += "<p class='select-level'><select name='salesleads'><option value=\"2\">包月</option>";
            html += "<option value=\"1\">单订</option></select></p>";
            $('#salesLeads').html(html).show(); 
            html = '';
            html += "<em>推荐语：</em>";
            html += "<input class='midInput recTagInput valid' tupe='text' name='recommendwords' value='"+$('#rec').val()+"'>";
            html += "<p data-node=\"ok\" style=\"display:none;\">"
            html += "<cite class=\"icon ok\"></cite><span class=\"f12 c999\" data-node=\"text\" style=\"padding-left:5px;\"></span></p>"
            html += "<p data-node=\"error\" class=\"error\" style=\"display:none;\"></p>";
            $('#recommendwords').html(html).show();
            $("select[name='salesleads']").css('visibility','visible').show();
        }else{
            $('#salesLeads').html('').hide();
            $('#recommendwords').html('').hide();
        }
        if(_params.site == 2){
            $("select[name='salesleads']").val(_params.saletype);
        }
    }
    
    //主类切换
    function _ParentNovelChange(){
        
        var changeSite = $("select[name='sites']").val();
        //主类切换
        $('#parentClass').on('change',function(){
            //重置子类
            $('#subcategory').html('');
            var cateId = $(this).val();
            //循环分类
            var novelParentCate,//父类
                novelSubCate;//子类
            if(changeSite == 5 || changeSite == 1)
                novelParentCate = _params.novelssortsman;
            else
                novelParentCate = _params.novelssortslady;
            
            for(var i = 0,count = novelParentCate.length; i < count; i++){
                if(novelParentCate[i]['id'] == cateId){
                    novelSubCate = novelParentCate[i];
                    break;
                }
            }
            var arrnovels = [];
            $.each(novelSubCate['SubSort'], function(index, item){
                
                arrnovels.push('<option value="'+ item.id +'">'+ item.categoryName +'</option>');
            });
            $('#subcategory').html(arrnovels);
        });
    }
    
    //添加分类信息
    function _NovelSubCategorySelector($site){
        var subcate;

        $(".novelssort").remove();
        var arrnovels = "";
        arrnovels += "<select id='parentClass' name='parentClass' class='modify hidden showselect novelssort'>";
        if($site == 5 || $site == 1){
            
            $.each(_params.novelssortsman, function(index, item){
                if(item.id == _params.categoryid)
                    subcate = item['SubSort'];
                arrnovels += '<option value="'+ item.id +'">'+ item.categoryName +'</option>';
            });
            arrnovels += "</select>";
            arrnovels += "<select style=\"visibility: visible\" id='subcategory' name= 'subcategory' class='modify hidden showselect novelssort'>";
            if(subcate == undefined)
                subcate = _params.novelssortsman[0]['SubSort'];
            $.each(subcate, function(index, item){
                arrnovels += '<option value="'+ item.id +'">'+ item.categoryName +'</option>';
            });
        //console.log(_params.novelssortsman);
        }else{
            $.each(_params.novelssortslady, function(index, item){
                if(item.id == _params.categoryid)
                    subcate = item['SubSort'];
                arrnovels += '<option value="'+ item.id +'">'+ item.categoryName +'</option>';
            });
            arrnovels += "</select>";
            arrnovels += "<select style=\"visibility: visible\" id='subcategory' name='subcategory' class='modify hidden showselect novelssort'>";
            if(subcate == undefined)
                subcate = _params.novelssortslady[0]['SubSort'];
            $.each(subcate, function(index, item){
                arrnovels += '<option value="'+ item.id +'">'+ item.categoryName +'</option>';
            });
        }
        
        arrnovels += "</select>";
        $('#classificationWorks').append(arrnovels);
        //首发站点——起点中文网、起点女生网、创世中文网、云起书院（select框）
        $('.showselect').css('visibility','visible').show();
        //添加事件
        _ParentNovelChange();
        //默认选中
        $("select[name='parentClass']").val(_params.categoryid);
        $("select[name='subcategory']").val(_params.subcategoryid);
    }
    /**
     * 绑定作品标签的元素事件
     */
    function _bindEventByBookTag(){
        var $novelTagPopup = $('#novelTagPopup'), //作品标签浮层
            $tagList = $('#novelTagPopup_tagList'), //作品标签浮层: 标签列表
            selectedTags = _getSelectedTags(); //用户已选标签

        //作品标签滚动条
        $tagList.slimScroll({
            height: '328px',
            disableFadeOut: true,
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
            //用户切换会原本站点 默认选中标签
        selectedTags = _getSelectedTags(); //用户已选标签
        if(selectedTags && selectedTags.length > 0){
            $.each(selectedTags, function(index, tagid){
                //标签浮层：设置用户已选标签的选中效果
                $tagList.find('[data-tagid="'+ tagid +'"]').addClass('act');
            });
        }
        
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
     * 设置表单验证
     */
    function _setFormValidate(){
        var $bookNameInput = $('#bookNameInput');

        //检测书名
        jQuery.validator.addMethod("bookNameCheck", function(value, element) {
            return this.optional(element) || /^[A-Za-z0-9\u4E00-\u9FFF：——“”.，！]{1,15}$/.test(value);
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
                                return _params.CBID;
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
                },
                'recommendwords' :{
                    required: true,
                    byteRangeLengthByOne: [1, 16]
                },
                //作品类型
                'parentClass' : {
                    required: true,
                },
            },
            'messages': {
                'bookname' : {
                    required: "书名不能为空",
                    remote: "这本大作已经有人写过了，再想个名字吧！"
                },
                'intro': {
                    required: "请输入作品介绍",
                    byteRangeLengthByOne: "请输入20-300字介绍您的作品"
                },
                'recommendwords' :{
                    required: "推荐语不能为空",
                    byteRangeLengthByOne: "推荐语必须在16个字内"
                },
                //作品类型
                'parentClass' : {
                    required : '请选择作品类型',
                },
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
                if($errorBox.parent().hasClass('cf')){
                    
                    $ok.find('[data-node="text"]').text('书名修改后需提交审核，2个工作日内完成');
                    //同一行显示
                    
                }else{
                    $ok.show();
                }
                $ok.css('display', 'inline-block');

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
                    _topTip.show('返回的数据格式异常，请稍候再试');
                    return;
                }

                //成功
                if(json.status){
                    _topTip.show(json.info || '修改成功', function(){
                        //刷新当前页
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
                    'CBID' : _params.CBID,
                    'site' : $("select[name='sites']").val()
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
                'CBID' : _params.CBID,
                'site' : $("select[name='sites']").val()
            },
            type: 'POST',
            dataType: "json",
            success: function(json) {
                if(!json){
                    return;
                }
                if(json.info){
                    _topTip.show(json.info);
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
                _topTip.show('操作失败，请稍候再试');
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
                'CBID' : _params.CBID,
                'site' : $("select[name='sites']").val()
            },
            type: 'POST',
            dataType: "json",
            success: function(json) {
                if(!json){
                    return;
                }
                if(json.info){
                    _topTip.show(json.info);
                }
                //成功
                if (json.status) {
                    //移除已推荐作品列表的单个作品
                    $('#recommendBookList').find('a[data-bid="'+ bid +'"]').remove();
                }
            },
            error : function(){
                _topTip.show('操作失败，请稍候再试');
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
    CS.page.bookManage.bookModify = {
        'init': init
    };

})(jQuery);