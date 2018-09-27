/**
 * 创建作品站点
 */
;
(function($) {
    //外部依赖
    var _util = CS.util,
        _mask = CS.mask,
        _localImg = CS.localImg,
        _dialog = CS.dialog;

    var _params = {}, //参数集合
        _nodes = {},//页面元素集合
        _isSubmitting = 0; //表单是否正在提交中


    /**
     * 初始化
     */
    function init(urlHandauth,urlIndex,urlNovel) {
         _params.urlHandauth=urlHandauth || '';
         _params.urlIndex=urlIndex || '';
         _params.urlNovel=urlNovel || '';
         _nodes.$realname=$('#autoauth_realname');
         _nodes.$cardid=$('#autoauth_cardid');
         _nodes.$previewImg=$('#previewImg');
         _nodes.$selectImgBtn=$('#selectImgBtn');
         _nodes.$imgFile=$('#imgFile');
         _nodes.$handauthForm=$('#handauthForm');
         _nodes.$cfmbtn=$('#handauth_cfmbtn');
         _nodes.$prebtn=$('#handauth_prebtn');

        _bindEvent();
        _setFormValidate();
       
    }

    /**
     * 绑定事件
     */
    function _bindEvent() {
       //上传封面的按钮
        _nodes.$selectImgBtn.on('click',function(){
            _nodes.$imgFile.click();
        });
        //上传封面
        _nodes.$imgFile.on('change',function(){
            _localImg.show($(this), _nodes.$previewImg, {
                'supportFileTypes':'jpeg|jpg|png',
                'fileTypeErrorTips':'这个图片的格式一定要是JPG、PNG',
                'imgMaxSize': 5120, //图片最大容器（单位5M）
                'imgMaxSizeTips': '您上传的图片大于5M' //图片超过最大容量限制的提示
            });
        });
        _nodes.$cfmbtn.on('click',function(){
            if (_nodes.$handauthForm.valid()) {
                _handauth();
            }
        })
        _nodes.$prebtn.on('click',function(){
            window.location.href=_params.urlIndex;
        }) 
    }
    function _handauth()
    {
        if(_isSubmitting){
            return;
        }
        _isSubmitting = 1;

        //修改作品的表单
        _util.ajaxSubmitForm(_nodes.$handauthForm, {
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
                    _dialog.alert(json.info || '操作成功',function(){
                        window.location.href=_params.urlNovel;
                    });
                }else{
                    if(json.code==10003 || json.code==10004)
                    {
                        _dialog.alert(json.info,function(){
                            window.location.href=_params.urlNovel;
                        });
                    }
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
     * 设置注册作家的表单的验证
     */
    function _setFormValidate(){
        //实名
        jQuery.validator.addMethod("RealnameCheck", function(value, element) {
            return this.optional(element) || /^[A-Za-z\u4E00-\u9FFF·\u4dae]{2,10}$/.test(value);
        }, "2-10个汉字、数字或英文字母组成");
        jQuery.validator.addMethod("isIDCardV5", function(value, element,param) {
   if('0'==$(param).val())
    {
        return this.optional(element) || /^(\w{8,18})$/.test(value);
    }
    else
    {
        return true;
    }
    
}, "身份证不合法");
        var registerRules = {
                realname: {
                    required: true,
                    RealnameCheck: true
                },
                cardid: {
                    required: true,
                    isIDCardV2: true
                }
            },
            registerMessages = {
                realname: {
                    required: "真实姓名不能为空",
                    RealnameCheck: "真实姓名请使用2-10位汉字或英文"
                },
                cardid: {
                    required: "请输入您的证件号码",
                    isIDCardV2:"请输入的证件号码格式有误"
                }
            };
        _nodes.$handauthForm.validate({
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
    CS.page.authorRealname.handauth = {
        "init": init
    };
})(jQuery);