/**
 * 作家资料：个人银行管理
 * @namespace CS.page.personal.bankInfo
 * @date 2015-8-28
 */
(function($) {
    //外部依赖
    var _util = CS.util,
        _dialog = CS.dialog;

    var _isSubmitting = 0; //表单是否正在提交中

    /**
     * 初始化
     */
    function init() {
        _setFormValidate();
        _bindEvent();
    }

    /**
     * 绑定元素事件
     */
    function _bindEvent() {
        var $saveBtn = $('#saveBtn'); //保存按钮

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
        var $form = $('#formAuthorBank'); //作家的银行信息表单

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
        $('#formAuthorBank').validate({
            /* 设置验证规则 */
            rules: {
                bankName: {
                    required: true,
                    byteRangeLength: [2, 60]
                },
                cardId: {
                    required: true,
                    isIDCardV2: true
                },
                bank: {
                    required: true,
                    byteRangeLength: [2, 60]
                },
                bankProvince: {
                    required: true,
                    byteRangeLength: [2, 30]
                },
                bankCity: {
                    required: true,
                    byteRangeLength: [2, 30]
                },
                bankInfo: {
                    required: true,
                    byteRangeLength: [2, 60]
                },
                bankAccount: {
                    required: true,
                    digits : true //正整数
                },
                tel: {
                    required: true,
                    isPhone: true
                }
            },
            /* 设置错误信息 */
            messages: {
                bankName: {
                    required: "请输入姓名",
                    byteRangeLength: " 姓名输入错误。 "
                },
                cardId: {
                    required: "请输入证件号",
                    isIDCardV2: " 证件号输入错误。 "
                },
                bank: {
                    required: "请输入银行名称",
                    byteRangeLength: " 银行名称输入错误。 "
                },
                bankProvince: {
                    required: "请输入银行所在省",
                    byteRangeLength: " 银行所在省输入错误。 "
                },
                bankCity: {
                    required: "请输入银行所在市",
                    byteRangeLength: " 银行所在市输入错误。 "
                },
                bankInfo: {
                    required: "请输入开户行全称",
                    byteRangeLength: " 开户行全称输入错误。 "
                },
                bankAccount: {
                    required: "请输入银行账号",
                    digits: " 银行账号输入错误。 "
                },
                tel: {
                    required: "请输入联系电话",
                    isPhone: "联系电话输入错误。 "
                }
            },
            errorElement : 'span', //label会触发css设置的float:left
            errorPlacement:function(error, element) {
                element.nextAll('[data-node="error"]').html(error).show();
                element.nextAll('[data-node="ok"]').hide();
            },
            success : function(error){
                error.parent().prevAll('[data-node="ok"]').show();
                //移除后才能每次出错时触发errorPlacement
                error.remove();
            }
        });
    }

    _util.initNameSpace("CS.page.personal");
    CS.page.personal.bankInfo = {
        'init': init
    };
})(jQuery);