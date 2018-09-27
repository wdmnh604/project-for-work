/**
 * 作家资料：基础信息
 * @namespace CS.page.personal.baseInfo
 * @date 2015-8-12
 */
(function($) {
    //外部依赖
    var _util = CS.util,
        _dialog = CS.dialog,
        _localImg = CS.localImg; //本地预览图片组件

    var _params = {}, //参数集合
        _nodes = {}, //页面元素的对象集合
        _isSubmitting = 0; //表单是否正在提交中

    var _ajaxUrls = {
        'checkAuthorName': '/Content/Authors/isMayEditAuthorname.html' //检测笔名是否通过验证
    };

    /**
     * 初始化
     */
    function init() {
        _nodes.$form = $('#formAuthorperson');

        _setFormValidate();
        _bindEvent();
    }

    /**
     * 绑定页面元素的事件
     */
    function _bindEvent() {
        var $saveBtn = $('#saveBtn'); //保存按钮

        // //选择图片按钮
        // $("#userHeadFile").on('change', function() {
        //     _localImg.show($(this), $('#previewImg'), {
        //         'supportFileTypes': 'jpg|gif|png',
        //         'fileTypeErrorTips': '图片格式一定要是JPG，GIF，PNG中的一种'
        //     });
        //     return false;
        // });

        //修改按钮
        $('#modifyBtn').on('click', function() {
            $('.saveBox').hide();
            $('.modifyBox').show();

            $(this).hide();
            $saveBtn.show();
            return false;
        });

        //保存按钮
        $saveBtn.on('click', function() {
            _submitForm();
            return false;
        });
    }

    /**
     * 动态提交表单
     */
    function _submitForm(){
        var $form = _nodes.$form;

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
                    _dialog.alert(json.info || '提交成功', function(){
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
     * 设置表单验证
     */
    function _setFormValidate() {
        jQuery.validator.addMethod("realNameCheck", function(value, element) {
            return this.optional(element) || /^[A-Za-z\u4E00-\u9FFF]{2,10}$/.test(value);
        }, "2-10个汉字、数字或英文字母组成");

        jQuery.validator.addMethod("stringCheck", function(value, element) {
            return this.optional(element) || /^[\u0391-\uFFE5\w]+$/.test(value);
        }, "只能包括中文字、英文字母、数字和下划线");

        //设置验证规则
        var rules = {
            realName: {
                required: true,
                realNameCheck: true
            },
            cardId: {
                required: true,
                isIDCardV2: true
            },
            mobile: {
                required: true,
                isMobile: true
            },
            email: {
                required: true,
                email: true
            },
            QQ: {
                required: true,
                isQQ: true
            },
            address: {
                required: true,
                stringCheck: true,
                byteRangeLength: [10, 128]
            }
        },
        //设置错误信息
        messages = {
            realName: {
                required: "真实姓名不能为空",
                realNameCheck: "真实姓名请使用2-10位汉字或英文"
            },
            cardId: {
                required: "请输入您的证件号码",
                isIDCardV2: "证件号码为8位以上并且不能超过18位。"
            },
            mobile: {
                required: '请输入手机号码',
                isMobile: "请输入一个格式正确的手机号码"
            },
            email: {
                required: '请输入电子邮件',
                email: "请输入一个格式正确的电子邮件"
            },
            QQ: {
                required: '请输入QQ号',
                isQQ: "请输入一个格式正确的QQ号"
            },
            address: {
                required: '请输入详细地址',
                stringCheck: "地址只能包括中文字、英文字母、数字和下划线",
                byteRangeLength: "地址必须在5-64个字之内"
            }
        };

        var $authorNameInput = $('#authorNameInput'); //笔名输入框
        if($authorNameInput.length > 0){
            //笔名
            jQuery.validator.addMethod("authorNameCheck", function(value, element) {
                return this.optional(element) || /^[A-Za-z0-9\u4E00-\u9FFF.]{2,6}$/.test(value);
            }, "2-6个汉字、数字或英文字母组成");
            
            //笔名
            rules.authorName = {
                required: true,
                authorNameCheck: true,
                remote: { //检测笔名是否存在
                    url: _ajaxUrls.checkAuthorName,
                    type: "post",
                    data: {
                        authorName: function() {
                            return $authorNameInput.val();
                        }
                    }
                }
            };

            messages.authorName = {
                required: "笔名不能为空",
                remote : '笔名已经存在，换个别的吧'
            };
        }

        _nodes.$form.validate({
            /* 设置验证规则 */
            'rules': rules,
            /* 设置错误信息 */
            'messages': messages,
            errorElement : 'span', //label会触发css设置的float:left
            errorPlacement:function(error, element) {
                element.nextAll('[data-node="error"]').html(error).show();
                element.nextAll('[data-node="ok"]').hide();
            },
            success : function(error){
                var $ok = error.parent().prevAll('[data-node="ok"]');

                //检测的是笔名输入框
                if(error.parent().parent().has('#authorNameInput')){
                    $ok.find('[data-node="text"]').text('笔名修改后需提交审核，2个工作日内完成');
                }

                $ok.show();
                
                //移除后才能每次出错时触发errorPlacement
                error.remove();
            }
        });
    }

    _util.initNameSpace("CS.page.personal");
    CS.page.personal.baseInfo = {
        'init': init
    };
})(jQuery);