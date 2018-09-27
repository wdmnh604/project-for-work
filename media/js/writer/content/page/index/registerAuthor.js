/**
 * 申请作家
 * @namespace CS.page.index.registerAuthor
 * @update 2015-12-1
 */
(function($) {
    //外部依赖
    var _util = CS.util,
        _dialog = CS.dialog;

    var _nodes = {}, //页面元素的对象集合
        _isSubmitting = 0; //是否正在提交表单

    var _ajaxUrls = {
        'checkAuthorName': '/Content/Public/ajaxCheckAuthorNameExist.html' //检测笔名是否存在
    };

    /**
     * 初始化
     */
    function init() {
        _nodes.$registerAuthorForm = $('#formRegisterAuthor');
        _nodes.$baseInfoForm = $('#baseInfoForm');
        _nodes.$stepTabBox = $('#stepTabBox');

        _setBaseInfoFormValidate();
        _setRegisterAuthorFormValidate();

        _bindEvent();
    }

    /**
     * 绑定页面元素的事件
     */
    function _bindEvent(){
        var $baseInfoBox = $('#baseInfoBox'),
            $registerAuthorBox = $('#registerAuthorBox'),
            $baseInfoHiddenBox = $('#baseInfoHiddenBox');

        //同意协议的容器
        $('#agreenBox').on('click', function(){
            var $checkbox = $(this).find('input');
            
            if($(this).hasClass('on_check')){
                $(this).removeClass('on_check');
                $checkbox.removeAttr('checked');
            }else{
                $(this).addClass('on_check');
                $checkbox.prop('checked', 'checked');
            }
        });

        //下一步按钮
        $("#nextStepBtn").on('click', function(){
            if (_nodes.$baseInfoForm.valid()) {
                //将基础信息的用户输入，更新到注册作家表单中，以便一起提交
                _nodes.$baseInfoForm.find('input').each(function(index, el){
                    var dataName = $(el).attr('name'),
                        dataValue = $(el).val();

                    $baseInfoHiddenBox.find('input[name="'+ dataName +'"]').val(dataValue);
                });

                _switchStepTab(1);
                $baseInfoBox.hide();
                $registerAuthorBox.show();
            }

            return false;
        });

        //返回上一步按钮
        $('#preStepBtn').on('click', function() {
            _switchStepTab(0);
            $registerAuthorBox.hide();
            $baseInfoBox.show();

            return false;
        });

        //提交申请的按钮
        $("#submitBtn").on('click', function(){
            if (_nodes.$registerAuthorForm.valid()) {
                _submitRegister();
            }
            
            return false;
        });
    }

    /**
     * 提交注册
     */
    function _submitRegister(){
        //避免同时多次请求
        if(_isSubmitting){
            return;
        }
        _isSubmitting = 1;

        _util.ajaxSubmitForm(_nodes.$registerAuthorForm, {
            type : "POST",
            data : {
                't': new Date().getTime() //测评机器上360游览器，提交后竟然302跳转，带个时间戳看下是否会变正常
            },
            dataType : "json",
            success : function(json){
                if(!json){
                    _dialog.alert('返回的数据格式异常，请稍候再试');
                    return;
                }
                //成功
                if(json.status){
                    _switchStepTab(2);
                    $('#registerAuthorBox').hide();
                    //显示成功提示信息
                    $('#successBox').show();
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
     * 获取基础信息的验证规则
     * @return {object} 验证规则
     */
    function _getBaseInfoRule(){
        return {
            'rules':{
                authorName: {
                    required: true,
                    authorNameCheck: true,
                    remote: { //检测笔名是否存在
                        url: _ajaxUrls.checkAuthorName,
                        type: "post",
                        data: {
                            authorName: function() {
                                return $("#authorNameInput").val();
                            }
                        }
                    }
                },
                newPassword: {
                    required: true,
                    passwordCheck: true
                },
                repeatPassword: {
                    required: true,
                    passwordCheck: true,
                    equalTo: "#newPasswordInput"
                },
                email: {
                    required: true,
                    isEmail: true
                },
                QQ: {
                    required: true,
                    isQQ: true
                }
            },
            'messages':{
                authorName: {
                    required: "笔名不能为空",
                    remote : '笔名已经存在，换个别的吧'
                },
                newPassword: {
                    required: "密码不能为空",
                    passwordCheck: "6-16位英文、数字或特殊字符组成，当您发布VIP章节时需要输入"
                },
                repeatPassword: {
                    required: "请再次输入VIP管理密码",
                    passwordCheck: "6-16位英文、数字或特殊字符组成，当您发布VIP章节时需要输入",
                    equalTo: "两次密码输入不相同"
                },
                email: {
                    required: "电子邮箱不能为空",
                    isEmail: "请输入正确的电子邮箱信息"
                },
                QQ: {
                    required: "QQ号码可以帮助我们的编辑快速联系到您，请真实填写",
                    isQQ: "请输入正确的QQ号码"
                }
            }
        };
    }

    /**
     * 设置基础信息的表单验证
     */
    function _setBaseInfoFormValidate(){
        //笔名
        jQuery.validator.addMethod("authorNameCheck", function(value, element) {
            return this.optional(element) || /^[A-Za-z0-9\u4E00-\u9FFF.]{2,6}$/.test(value);
        }, "2-6个汉字、数字或英文字母组成");

        var config = _getBaseInfoRule();

        _nodes.$baseInfoForm.validate({
            /* 设置验证规则 */
            rules: config.rules,
            /* 设置错误信息 */
            messages: config.messages,
            errorElement : 'span', //label会触发css设置的float:left
            errorPlacement: function(error, element) {
                element.nextAll('[data-node="error"]').html(error).show();
                element.nextAll('[data-node="ok"]').hide();
                element.nextAll('[data-node="tip"]').hide();
            },
            success: function(error) {
                var $errorBox = error.parent();

                $errorBox.prevAll('[data-node="ok"]').show();
                $errorBox.prevAll('[data-node="tip"]').show();

                $errorBox.hide();
                //移除后才能每次出错时触发errorPlacement
                error.remove();
            }
        });
    }

    /**
     * 设置注册作家的表单的验证
     */
    function _setRegisterAuthorFormValidate(){
        //实名
        jQuery.validator.addMethod("RealnameCheck", function(value, element) {
            return this.optional(element) || /^[A-Za-z\u4E00-\u9FFF]{2,10}$/.test(value);
        }, "2-10个汉字、数字或英文字母组成");

        jQuery.validator.addMethod("stringCheck", function(value, element) {
            return this.optional(element) || /^[\u0391-\uFFE5\w]+$/.test(value);
        }, "只能包括中文字、英文字母、数字和下划线");

        var registerRules = {
                realName: {
                    required: true,
                    RealnameCheck: true
                },
                cardId: {
                    required: true,
                    isIDCardV2: true
                },
                tel: {
                    required: true,
                    isMobile: true
                },
                address: {
                    required: true,
                    stringCheck: true,
                    byteRangeLength: [10, 128]
                },
                agree: {
                    required: true
                }
            },
            registerMessages = {
                realName: {
                    required: "真实姓名不能为空",
                    RealnameCheck: "真实姓名请使用2-10位汉字或英文"
                },
                cardId: {
                    required: "请输入您的证件号码",
                    isIDCardV2: "证件号码为8位以上并且不能超过18位。"
                },
                tel: {
                    required: "请输入手机号码",
                    isMobile: "请输入正确的手机号码"
                },
                address: {
                    required: '请输入联系地址',
                    stringCheck: "地址只能包括中文字、英文字母、数字和下划线",
                    byteRangeLength: "地址必须在5-64个字之内"
                },
                agree: {
                    required: "必选"
                }
            };

        // var baseInfoConfig = _getBaseInfoRule();

        // //合并两个表单的验证设置
        // registerRules = $.extend(registerRules, baseInfoConfig.rules);
        // registerMessages = $.extend(registerMessages, baseInfoConfig.messages);

        _nodes.$registerAuthorForm.validate({
            /* 设置验证规则 */
            rules: registerRules,
            /* 设置错误信息 */
            messages: registerMessages,
            errorElement : 'span', //label会触发css设置的float:left
            errorPlacement: function(error, element) {
                var $target = element;
                //同意协议
                if($target.attr('name') === 'agree'){
                    $target = element.parent();
                }

                $target.nextAll('[data-node="error"]').html(error).show();
                $target.nextAll('[data-node="ok"]').hide();
                $target.nextAll('[data-node="tip"]').hide();
            },
            success: function(error) {
                var $errorBox = error.parent();

                $errorBox.prevAll('[data-node="ok"]').show();
                $errorBox.prevAll('[data-node="tip"]').show();

                $errorBox.hide();
                //移除后才能每次出错时触发errorPlacement
                error.remove();
            }
        });
    }

    /**
     * 切换步骤的页签
     * @param  {int} index 页签索引
     */
    function _switchStepTab(index){
        var $span = _nodes.$stepTabBox.find('span'),
            $em = _nodes.$stepTabBox.find('em');

        $span.removeClass('act');
        $em.removeClass('actText');

        $span.eq(index).addClass('act');
        $em.eq(index).addClass('actText');
    }

    _util.initNameSpace("CS.page.index");
    CS.page.index.registerAuthor = {
        'init': init
    };
})(jQuery);