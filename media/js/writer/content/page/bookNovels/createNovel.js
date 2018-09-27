/**
 * 新建作品页
 * @namespace CS.page.createNovel
 * @update 2015-8-6
 */
(function($) {
    //外部依赖
    var _util = CS.util,
        _uiBinder = CS.uiBinder, //ui绑定组件
        _mask = CS.mask,
        _dialog = CS.dialog; //对话框组件

    var _params = {}, //参数集合
        _nodes = {}, //页面元素集合
        _isSubmitting = 0, //表单是否正在提交中
        _maskByNovelTagPopup = null; //作品选择浮层的遮罩层组建的实例对象

    //ajax地址列表
    var _ajaxUrls = {
        'checkBookTitle' : '/Content/Booknovels/ajaxCheckBooktitleExist.html' //检测书名是否存在
    };

    //作品类型选择器子项的模板
    var _categorySelectItemTpl = '<option value="$id$">$name$</option>';

    //作品标签的模板
    var _tagItemTpl = '<a data-tagid="$tagId$" title="$tagName$" href="javascript:;">$tagName$<i></i></a>';

    //活动条目的模板
    var _activityTpl = [
        '<% each list as item i%>',
            '<span class="radio">',
                '<input id="<%=item["IDX"]%>" name="Articleid" class="radioclass" type="radio" value="<%=item["IDX"]%>" />',
            '</span>',
            '<label for="<%=item["IDX"]%>"><%=item["authorcontent"]%></label>',
            '<a class="readme blue" href="<%=item["notice"]%>" target="_blank">《参赛须知》</a><br>',
        '<% /each %>'
    ].join('');

    /**
     * 初始化
     * @param  {array} arrNovelsSorts   作品分类列表
     * @param  {array} arrActivityInfo  活动列表
     */
    function init(arrNovelsSorts, arrActivityInfo) {
        _params.arrNovelsSorts = arrNovelsSorts || [];
        _params.arrActivityInfo = arrActivityInfo || [];

        _nodes.$selectedNovelTagList = $('#selectedNovelTagList'); //选中的作品标签列表
        _nodes.$form = $('#formbooknovelsnew');

        _setFormValidate();
        _bindEvent();
        // _updateNovelSubCategorySelector();
        _renderActivityList();
    }

    /**
     * 绑定页面元素的事件
     */
    function _bindEvent() {
        //作品的主分类、子分类选择器
        $("#novelMainCategorySelect, #novelSubCategorySelect").on('change', _renderActivityList);

        //作品类型：主分类选择器
        $("#novelMainCategorySelect").on('change', _updateNovelSubCategorySelector);

         //授权类型说明，显示/隐藏提示
        $("#authorizeTypeBtn").hover(
            function() {
                $("#authorizeTypeTips").show();
            },
            function() {
                $("#authorizeTypeTips").hide();
            }
        );

        //授权类型说明，显示/隐藏提示
        $("#novelSaleShowBtn").hover(
            function() {
                $("#novelSaleShow").show();
            },
            function() {
                $("#novelSaleShow").hide();
            }
        );

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
                _maskByNovelTagPopup = new _mask($('#novelTagPopup'));
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

        var $novelTagPopup_tagList = $('#novelTagPopup_tagList'); //作品标签浮层中的标签列表

        //作品标签滚动条
        $novelTagPopup_tagList.slimScroll({
            height: '328px',
            railVisible: true
        });

        //作品标签按钮
        $novelTagPopup_tagList.on('click', 'a', function(event) {
             event.preventDefault();
            $(this).addClass('act').siblings('a').removeClass('act');
        });

        //作品标签选择浮层：确定按钮
        $('#novelTagPopup_confirmBtn').on('click', function(event) {
            event.preventDefault();
            _selectNovelTag();
        });

        //新建作品按钮
        $("#createNovelBtn").on('click', function() {
            _submitForm();
            return false;
        });
    }

    /**
     * 获取发布站点的类型(1:创世 2:云起)
     */
    function _getSiteType(){
        return $('#siteTypeHidden').val();
    }

    /**
     * 动态提交表单
     */
    function _submitForm(){
        var $form = _nodes.$form; //新建作品的表单

        if (!$form.valid()) {
            return;
        }

        if(_isSubmitting){
            return;
        }
        _isSubmitting = 1;

        //动态提交表单
        _util.ajaxSubmitForm($form, {
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
                    _dialog.alert(json.info || '创建成功', function(){
                        if(json.data && json.data.jumpUrl){
                            //页面跳转到目的页
                            location.href = json.data.jumpUrl;
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
     * 设置表单的验证
     */
    function _setFormValidate() {
        //检测书名
        jQuery.validator.addMethod("bookNameCheck", function(value, element) {
            return this.optional(element) || /^[A-Za-z0-9\u4E00-\u9FFF：——“”.，]{1,15}$/.test(value);
        }, "15字内，请勿添加书名号等特殊符号");

        var config = {
            /* 设置验证规则 */
            rules: {
                title: { //书名
                    bookNameCheck: true,
                    required: true,
                    remote: { //检测书名是否存在
                        url: _ajaxUrls.checkBookTitle,
                        type: "post",
                        data: {
                            bookTitle: function() {
                                return $("#bookName").val();
                            }
                        }
                    }
                },
                intro: { //作品介绍
                    required: true,
                    byteRangeLengthByOne: [20, 300]
                }
            },
            /* 设置错误信息 */
            messages: {
                title: {
                    required: "书名不能为空",
                    remote: "这本大作已经有人写过了，再想个名字吧！"
                },
                intro: {
                    required: "请输入作品介绍",
                    byteRangeLengthByOne: "请输入20-300字介绍您的作品"
                }
            }
        };

        //云起站点
        if(_getSiteType() === '2'){
            //推荐语
            config.rules.recommendwords = {
                required: true,
                byteRangeLengthByOne: [1, 16]
            };

            config.messages.recommendwords = {
                required: "推荐语不能为空",
                byteRangeLengthByOne: "推荐语必须在16个字内"
            };
        }

        //验证表单
        _nodes.$form.validate({
            /* 设置验证规则 */
            rules: config.rules,
            /* 设置错误信息 */
            messages: config.messages,
            errorElement : 'span', //label会触发css设置的float:left
            errorPlacement:function(error, element) {
                element.nextAll('[data-node="error"]').html(error).show();
                element.nextAll('[data-node="ok"]').hide();
                element.nextAll('[data-node="tip"]').hide();
            },
            success : function(error){
                var $errorBox = error.parent();
                
                $errorBox.prevAll('[data-node="tip"]').show();
                $errorBox.prevAll('[data-node="ok"]').show();

                $errorBox.hide();
                //移除后才能每次出错时触发errorPlacement
                error.remove();
            }
        });
    }

    /**
     * 更新作品子分类的选择器内容
     */
    function _updateNovelSubCategorySelector() {
        var novelMainCategoryId = $("#novelMainCategorySelect").val(), //作品主分类id
            novelCategoryList = _params.arrNovelsSorts, //作品的分类列表
            selectedMainCategoryInfo = null; //选中的作品主分类的信息

        for (var i = 0, len = novelCategoryList.length; i < len; i++) {
            var mainCategory = novelCategoryList[i];
            //对应的主分类
            if (mainCategory.id == novelMainCategoryId) {
                selectedMainCategoryInfo = mainCategory;
                break;
            }
        }

        var frag = document.createDocumentFragment(),
            $novelSubCategorySelect = $("#novelSubCategorySelect"); //作品子分类的选择器

        $novelSubCategorySelect.empty();

        if (selectedMainCategoryInfo && selectedMainCategoryInfo.SubSort) {
            for (var j = 0, count = selectedMainCategoryInfo.SubSort.length; j < count; j++) {
                var subCategory = selectedMainCategoryInfo.SubSort[j],
                    tpl = _util.replaceTpl(_categorySelectItemTpl, {
                        'id': subCategory.id,
                        'name': subCategory.categoryName
                    });

                $(frag).append(tpl);
            }
        }

        $novelSubCategorySelect.append(frag);
    }

    /**
     * 渲染活动列表
     */
    function _renderActivityList() {
        var list = _getActivityList(),
            activityList = $('#activityList');

        activityList.empty();

        if (!list || list.length === 0) {
            return;
        }

        var tpl = _uiBinder.bindData(_activityTpl, {
            'list': list
        });

        activityList.html(tpl);
    }

    /**
     * 获取活动列表数据
     */
    function _getActivityList() {
        if (_params.arrActivityInfo.length === 0) {
            return null;
        }

        var websiteType = _getSiteType(), //选中的发布站点类型id
            novelMainCategoryId = $("#novelMainCategorySelect").val(), //选中的主分类id
            novelSubCategoryId = $("#novelSubCategorySelect").val(); //选中的子分类id

        var list = [],
            item = null,
            arrActivityInfo = _params.arrActivityInfo;

        for (var i = 0, len = arrActivityInfo.length; i < len; i++) {
            item = arrActivityInfo[i];

            //站点不匹配
            if ((',' + item['website'] + ',').indexOf(',' + websiteType + ',') === -1) {
                continue;
            }

            //子分类匹配
            if ((',' + item['contentid'] + ',').indexOf(',' + novelSubCategoryId + ',') !== -1) {
                list.push(item);
                continue;
            }
            //主分类匹配
            if ((',' + item['subjectid'] + ',').indexOf(',' + novelMainCategoryId + ',') !== -1) {
                list.push(item);
                continue;
            }

            //整个站点都适用
            if(item['contentid'] === '' && item['subjectid'] === ''){
                list.push(item);
            }
        }

        return list;
    }

    /**
     * 选中作品标签
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
     * 删除某个作品标签
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
        var arrTag = [];

        _nodes.$selectedNovelTagList.find('a').each(function() {
            arrTag.push($(this).attr("data-tagid"));
        });

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

    _util.initNameSpace("CS.page");
    CS.page.createNovel = {
        'init': init
    };
})(jQuery);