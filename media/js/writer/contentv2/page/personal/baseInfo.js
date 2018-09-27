/**
 * 作家资料：基础信息
 * @namespace CS.page.personal.baseInfo
 * @date 2015-8-12
 */
(function($) {
    //外部依赖
    var _util = CS.util,
        _dialog = CS.dialog,
        _localImg = CS.localImg, //本地预览图片组件
        _areaLinkage = CS.citySelection;

    var _params = {}, //参数集合
        _nodes = {}, //页面元素的对象集合
        _isSubmitting = 0; //表单是否正在提交中

    var _ajaxUrls = {
        'checkAuthorName': '/Contentv2/Authors/isMayEditAuthorname.html' //检测笔名是否通过验证
    };
    var str = "请填写街道名称，门牌号码，楼层和房间号",
    _grayColor = 'color:rgb(192,192,192)',
    _blackColor = "color:rgb(51,51,51)",
    $address = $("input[name='address']");

    /**
     * 初始化
     */
    function init(ajaxGetProvince,ajaxGetCity,ajaxGetArea) {
        //置灰显示缺省文案
        showDefaultCopy();
//    	 _params.cityList = cityList || {};
    	 _params.ajaxGetProvince = ajaxGetProvince;
    	 _params.ajaxGetCity = ajaxGetCity;
    	 _params.ajaxGetArea = ajaxGetArea;
        _nodes.$form = $('#formAuthorperson');
        
        _setFormValidate();
        _bindEvent();
        //_bindEventBySelector();
        _areaLinkage.regionalLinkage(_params.ajaxGetProvince);
        getProvince();
        
        
    }
    
    function showDefaultCopy(){
        $('#saveBtn').click(function(){
            if($address.val() == str){
                $address.attr('style',_blackColor).val('');
                return false;
            }
        });
        $address.blur(function(){
            if($address.val() == '')
                $address.val(str).attr('style',_grayColor);
            else
                $address.attr('style',_blackColor);
        });
        $address.click(function(){
            if($address.val() == str){
                $address.val('').attr('style',_blackColor);
            }
        });
    }
    /**
     * 绑定下拉选择器的元素事件
     */
    function _bindEventBySelector(){         
        var $citySelect = $('#citySelect'); //城市选择器
        var $areaSelect = $('#areaSelect');//区选择器
        //省选择器
        $('#provinceSelect').on('change', function() {
            var provinceName = $(this).val(),
                cityNameList = _params.ajaxGetProvince[provinceName];

            if(cityNameList){
                var arrCityTpl = [];
                $.each(cityNameList, function(index, item){
                    arrCityTpl.push('<option value="'+ index +'">'+ index +'</option>');
                });
                //更新省份对应的城市列表
                $citySelect.html(arrCityTpl.join(''));
                var arrCityTpl = [];
                $.each(cityNameList[$('#citySelect').val()], function(index, item){
                    arrCityTpl.push('<option value="'+ item +'">'+ item +'</option>');
                });
                //更新市对应的城市列表
                $areaSelect.html(arrCityTpl.join(''));
            }
        });
        //当市select发生改变时  区域变化
        $('#citySelect').change(function(){
            //市名
            var cityName = $(this).val(),
            provinceName = $('#provinceSelect').val(),//省名
            //市列表
            cityNameList = _params.ajaxGetProvince[provinceName];
            if(cityNameList){
                var arrCityTpl = [];
                $.each(cityNameList[$('#citySelect').val()], function(index, item){
                    arrCityTpl.push('<option value="'+ item +'">'+ item +'</option>');
                });
                //更新市对应的区列表
                $areaSelect.html(arrCityTpl.join(''));
            }
        });
    }

    function getProvince() {
        $("#provinceSelect1").empty();
        $.getJSON(_params.ajaxGetProvince, function (data) {
            $.each(data, function (i, item) {
                $("<option></option>").val(item.name).text(item.name).appendTo($("#provinceSelect1"));
            });
            getCity();
        });
    }

    function getCity() {
        $("#citySelect1").empty();
        $.getJSON(_params.ajaxGetCity,  {province: $("#provinceSelect1").val()},function (data) {
            $.each(data, function (i, item) {
                $("<option></option>").val(item.name).text(item.name).appendTo($("#citySelect1"));
            });
            getArea();
        });
    }

    function getArea() {
        $("#areaSelect1").empty();
        $.getJSON(_params.ajaxGetArea, {province: $("#provinceSelect1").val(),city: $("#citySelect1").val()}, function (data) {
            $.each(data, function (i, item) {
                $("<option></option>").val(item).text(item).appendTo($("#areaSelect1"));
            });
        });
    }

    /**
     * 绑定页面元素的事件
     */
    function _bindEvent() {
        var $saveBtn = $('#saveBtn'); //保存按钮

        //选择作家头像
        $('#coverFileBtn').on('change', function() {
            var isSelectedImg = _localImg.show($(this), $('#previewImg'), {
                'imgMaxSize': 5120, //图片最大容器（单位KB）               
                'imgMaxSizeTips': '您上传的图片大于5M', //图片超过最大容量限制的提示
                'supportFileTypes': 'jpg|png',
                'fileTypeErrorTips': '图片格式一定要是JPG，GIF，PNG中的一种'
            });

        });

        //修改按钮
        $('#modifyBtn').on('click', function() {
            $('.saveBox').hide();
            $('.modifyBox').show();

            $(this).hide();
            $saveBtn.show();
            //如果没有详细地址 默认置灰显示
            if($address.val() == '')
                $address.attr('style',_grayColor).val(str);
            //selelct显示作家默认地址
            $("#provinceSelect").val($("input[data-node='province-name']").val());
            $("#citySelect").val($("input[data-node='city-name']").val());
            $("#areaSelect").val($("input[data-node='area-name']").val());
            return false;
        });

        //保存按钮
        $saveBtn.on('click', function() {
            _submitForm();
            return false;
        });
        _tipAuthornameSuffix();

        $("#provinceSelect1").change(function () {
            getCity();
        });

        $("#citySelect1").change(function () {
            getArea();
        });
    }
    function _tipAuthornameSuffix()
    {
        if(!$("#authorizeTypeBtn"))
        {
            return;
        }
        //授权类型说明，显示/隐藏提示
        $("#authorizeTypeBtn").hover(
            function() {
                $("#authorizeTypeTips").show();
            },
            function() {
                $("#authorizeTypeTips").hide();
            }
        );
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
            return this.optional(element) || /^[A-Za-z\u4E00-\u9FFF·\u4dae]{2,10}$/.test(value);
        }, "2-10个汉字、数字或英文字母组成");

        jQuery.validator.addMethod("stringCheck", function(value, element) {
            return this.optional(element) || /^[\u0391-\uFFE5·\u4dae\w]+$/.test(value);
        }, "只能包括中文字、英文字母、数字和下划线");

        //设置验证规则
        var rules = {
            realName: {
                required: true,
                realNameCheck: true
            },
            cardId: {
                required: true,
                isIDCardV2: true,
                isIDCardV3: "#cardType"
            },
            mobile: {
                required: true,
                phoneCheck: "#tel_pre"
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
                isIDCardV2: "证件号码为8位以上并且不能超过18位。",
                isIDCardV3: "身份证号只支持18位"
            },
            mobile: {
                required: '请输入手机号码',
                phoneCheck: "请输入一个格式正确的手机号码"
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
                return this.optional(element) || /^[A-Za-z0-9\u4E00-\u9FFF.·\u4dae]{2,6}$/.test(value);
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