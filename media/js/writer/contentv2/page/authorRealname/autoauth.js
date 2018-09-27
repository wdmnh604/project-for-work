/**
 * 创建作品站点
 */
;
(function($) {
    //外部依赖
    var _util = CS.util,
        _dialog = CS.dialog;

    var _params = {}, //参数集合
        _nodes = {},//页面元素集合
        _isSubmitting = 0; //表单是否正在提交中


    /**
     * 初始化
     */
    function init(urlAutoauth,urlNovel,urlHandauth,urlSendcode) {
         _params.urlAutoauth=urlAutoauth || '';
         _params.urlNovel=urlNovel || '';
         _params.urlHandauth=urlHandauth || '';
         _params.urlSendcode=urlSendcode || '';
         _nodes.$realname=$('#autoauth_realname');
         _nodes.$cardid=$('#autoauth_cardid');
         _nodes.$btn=$('#autoauth_btn');
         _nodes.$prebtn=$('#autoauth_prebtn');
         _nodes.$autoauthForm=$('#autoauthForm');
         _nodes.$phone=$('#autoauth_phone');
         _nodes.$code=$('#autoauth_code');
        
        _bindEvent();
        _setFormValidate();
       
    }

    /**
     * 绑定事件
     */
    function _bindEvent() {
        _nodes.$btn.on('click',function(){
            if (_nodes.$autoauthForm.valid()) {
                _autoauth();
            }
        });
        _nodes.$prebtn.on('click',function(){
            window.location.href=_params.urlSendcode;
        });

    }
    function _autoauth()
    {
        //避免同时多次请求
        if(_isSubmitting){
            return;
        }
        _isSubmitting = 1;
        _util.request({
            url: _params.urlAutoauth,
            type: 'post',
            dataType: 'json',
            data: {
                'phone':_nodes.$phone.val(),
                'code' :_nodes.$code.val(),
                'realname':_nodes.$realname.val(),
                'cardid':_nodes.$cardid.val(),
                '_token': $.cookie('pubtoken')
            },
            success: function(json) {
                if (!json) {
                   _dialog.alert('返回数据格式异常，请稍后再试');
                   return;
                }
                if(json.status){
                    _dialog.alert('认证成功',function(){
                        window.location.href=_params.urlNovel;
                    });

                }else{
                    if(json.code==10002)
                    {
                        _dialog.alertv2(json.info,function(){
                            window.location.href=_params.urlHandauth;
                        },null,'去人工审核');
                        return;
                    }
                    _dialog.alert(json.info);
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
     * 设置注册作家的表单的验证
     */
    function _setFormValidate(){
        //实名
        jQuery.validator.addMethod("RealnameCheck", function(value, element) {
            return this.optional(element) || /^[A-Za-z\u4E00-\u9FFF·\u4dae]{2,10}$/.test(value);
        }, "2-10个汉字、数字或英文字母组成");
        //验证证件号  身份证，军官证，护照
        jQuery.validator.addMethod("isIDCardV4", function(value, element) {
            return this.optional(element) || /^([A-Za-z0-9]{18})$/.test(value);
        }, "身份证不合法");

        var registerRules = {
                realname: {
                    required: true,
                    RealnameCheck: true
                },
                cardid: {
                    required: true,
                    isIDCard: true
                },
                 
            },
            registerMessages = {
                realname: {
                    required: "真实姓名不能为空",
                    RealnameCheck: "真实姓名请使用2-10位汉字或英文"
                },
                cardid: {
                    required: "请输入您的证件号码",
                    isIDCard: "请输入格式正确的身份证号"
                },
            };
        _nodes.$autoauthForm.validate({
            /* 设置验证规则 */
            rules: registerRules,
            /* 设置错误信息 */
            messages: registerMessages,
            errorElement : 'span', //label会触发css设置的float:left
            errorPlacement: function(error, element) {
                var $target = element;
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
     
    _util.initNameSpace("CS.page.authorRealname");
    CS.page.authorRealname.autoauth = {
        "init": init
    };
})(jQuery);