/**
 * 作品管理-签约申请
 * @namespace CS.page.bookManage.applySign
 * @update 2015-2-3
 */
(function($){
    //外部依赖
    var _util = CS.util,
        _mask = CS.mask,
        _dialog = CS.dialog;

    var _nodes = {}, //页面元素的对象集合
        _maskByNovelTagPopup = null; //作品选择浮层的遮罩层组建的实例对象

    //单个作品标签的模板
    var _tagItemTpl = '<a data-tagid="$tagId$" href="javascript:">$tagName$<i></i></a>';

    /**
     * 初始化
     */
    function init(){
        _nodes.$selectedNovelTagList = $('#selectedNovelTagList'); //选中的作品标签列表

        _bindEvent();
        _bindEventByBookTag();
    }

    /**
     * 绑定页面元素的事件
     */
    function _bindEvent(){
        var checkbox = $('.recForm.grade .checkBox'),  //作品状态复选框
            clearText = $(".clearText"), //textarea框默认内容
            scoreInput = $(".scoreInput");//评分效果控制

        checkbox.click(function(){
            if($(this).hasClass('on_check')){
                $(this).removeClass('on_check');
                $(this).find('input').removeAttr('checked');
            }else{
                $(this).addClass('on_check');
                $(this).find('input').attr('checked','checked');
            }
        });

        //点击后清空文本框内的文字
        clearText
            .focus(function () {
                if ($(this).val() == $(this).attr("def")) {
                    $(this).val("");
                }
            })
            .blur(function () {
                if ($(this).val() === "") {
                    $(this).val($(this).attr("def"));
                    $(this).css('color', '#BBB');
                }
                
                if ($(this).val() !== $(this).attr("def")) {
                    $(this).css('color', '#333');
                }
            });

        scoreInput
            .focus(function(){
                if ($(this).val() === "")
                {
                    $(this).removeClass('on').addClass('off');
                }
            })
            .blur(function(){
                if ($(this).val() === "")
                {
                    $(this).addClass('on').removeClass('off');
                }
            });

        //出版自荐选题申请的输入框
        $('#authorIntroduce, #bookDesc, #bookOutline, #roleIntroduce, #publishSuggest')
            .on('focus', _focusIn)
            .on('blur', _focusOut);

        //出版自荐选题申请按钮
        $('#applyPublishBtn').on('click',function(){
            var $form = $('#formPublish'),
                isPass = _checkPublishForm();

            if(isPass){
                $form.submit();
                $(this).off('click');
            }
            
            return false;
        });
    }

    /**
     * 绑定作品标签的元素事件
     */
    function _bindEventByBookTag(){
        var $novelTagPopup = $('#novelTagPopup'); //作品标签浮层
            
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
        $('#novelTagPopup_closeBtn').on('click', function() {
            _closeNovelTagPopup();
            return false;
        });

        //作品标签按钮
        $('#novelTagPopup_tagList').on('click', 'a', function() {
            var $el = $(this);
            //已选中
            if($el.hasClass('act')){
                $el.removeClass('act');
            }else if($el.parent().find('a.act').length < 5){ //每类标签选中不满5个
                $el.addClass('act');
            }
            
            return false;
        });

        //作品标签选择浮层：确定按钮
        $('#novelTagPopup_confirmBtn').on('click', function() {
            _selectNovelTag();
            return false;
        });
    }

    /**
     * 验证出版自荐选题申请的表单
     * @return {bool} 是否通过验证
     */
    function _checkPublishForm(){
        var arrError = [],
            $bookWordCount = $('#bookWordCount'), //作品字数
            bookWordCount = $.trim($bookWordCount.val());

        if(bookWordCount.length > 0 && !_util.isPositiveInteger(bookWordCount)){
            arrError.push('作品字数必须是正整数');
        }
        
        //必填项的配置列表
        var requiredItemList = [
            {'id': 'authorIntroduce', 'name': '作者介绍'},
            {'id': 'bookDesc', 'name': '内容简介'},
            {'id': 'bookOutline', 'name': '全文大纲'},
            {'id': 'roleIntroduce', 'name': '人物介绍'},
            {'id': 'publishSuggest', 'name': '出版建议'}
        ];

        var item = null,
            $item = null,
            val = '';

        for(var i=0, len=requiredItemList.length; i<len; i++){
            item = requiredItemList[i];
            $item = $('#'+ item['id']);
            val = $.trim($item.val());

            if(val.length === 0 || val === $item.attr('def')){
                arrError.push('请填写'+ item['name']);
            }
        }

        if(arrError.length > 0){
            _dialog.alert(arrError.join('<br>'));
            return false;
        }
        
        return true;
    }

    /**
     * 选中标签
     * @param {string} tagName     标签名称
     * @param {string} tagId     标签id
     * @param {element object} tagBtn 标签按钮的元素对象
     */
    function _selectNovelTag() {
        var $selectedTag = $('#novelTagPopup_tagList').find('a.act');

        _nodes.$selectedNovelTagList.empty();

        if($selectedTag.length > 0){
            var tpl = '',
                frag = document.createDocumentFragment();

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
        }

        _saveNovelTag();
        _closeNovelTagPopup();
    }

    /**
     * 删除已选的作品标签
     * @param  {string} tagId 标签id
     */
    function _deleteNovelTag(tagId) {
        _nodes.$selectedNovelTagList.find('a').each(function() {
            var $this = $(this);
            
            if ($this.attr("data-tagid") === tagId) {
                $this.remove();
                return false;
            }
        });

        _saveNovelTag();
    }

    /**
     * 保存选中的作品标签
     */
    function _saveNovelTag() {
        var arrTag = [];

        _nodes.$selectedNovelTagList.find('a').each(function() {
            var tagid = $(this).attr("data-tagid");
            if(tagid){
                arrTag.push(tagid);
            }
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

    /**
     * 焦点移入
     */
    function _focusIn() {
        var $this = $(this);

        if ($this.val() === $this.attr('def')) {
            $this.val('');
            $this.css('color', '');
        }
    }

    /**
     * 焦点移出
     */
    function _focusOut() {
        var $this = $(this);

        if ($this.val() === '') {
            $this.val($this.attr('def'));
            $this.css('color', '');
        } else {
            $this.css('color', '#000');
        }
    }

    _util.initNameSpace("CS.page");
    CS.page.applySign = {
        'init' : init
    };
})(jQuery);