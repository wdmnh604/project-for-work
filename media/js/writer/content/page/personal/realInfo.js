/**
 * 作家资料：真实信息
 * @namespace CS.page.personal.realInfo
 * @date 2015-8-12
 */
(function($) {
    //外部依赖
    var _util = CS.util,
        _dialog = CS.dialog,
        _localImg = CS.localImg;

    var _params = {}, //参数集合
        _isSubmitting = 0; //表单是否正在提交中 

    /**
     * 初始化
     * @param {object} cityList 城市列表
     * @param {string} userBirthday 用户的生日（例如：1989#12#24，用#分隔）
     */
    function init(cityList, userBirthday) {
        _params.cityList = cityList || {};
        _params.userBirthday = userBirthday || '';

        _bindEvent();
        _bindEventBySelector();
        _bindEventByExtendInfo();
    }

    /**
     * 绑定元素事件
     */
    function _bindEvent() {
        var $saveBtn = $('#saveBtn'); //保存按钮     
        
        //选择作品封面按钮
        $('#coverFileBtn').on('change', function() {
            var isSelectedImg = _localImg.show($(this), $('#previewImg'), {
                'imgMaxSize': 5120, //图片最大容器（单位KB）               
                'imgMaxSizeTips': '您上传的图片大于5M', //图片超过最大容量限制的提示
                'supportFileTypes': 'jpg|gif|png',
                'fileTypeErrorTips': '图片格式一定要是JPG，GIF，PNG中的一种'
            });
           
        });           
        
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
     * 绑定下拉选择器的元素事件
     */
    function _bindEventBySelector(){
        //默认的年月日
        var year = '',
            month = '',
            day = '';

        if(_params.userBirthday){
            var arrBirthday = _params.userBirthday.split('#');
            if(arrBirthday.length === 3){
                year = arrBirthday[0];
                month = arrBirthday[1];
                day = arrBirthday[2];
            }
        }else{
            var now = new Date();
            year = now.getFullYear();
            month = now.getMonth() + 1;
            day = now.getDate();
        }
        
        //日期联动组件
        $("#dateSelectBox").dateSelector({
            ctlYearId: 'birthYear', //年控件id
            ctlMonthId: 'birthMonth', //月控件id
            ctlDayId: 'birthDay', //日控件id
            defYear: year, //默认年
            defMonth: month, //默认月
            defDay: day, //默认日
            minYear: 1900 //最小年|默认为1882年
        });

        var $citySelect = $('#citySelect'); //城市选择器
        //省选择器
        $('#provinceSelect').on('click', function() {
            var provinceName = $(this).val(),
                cityNameList = _params.cityList[provinceName];

            if(cityNameList){
                var arrCityTpl = [];
                $.each(cityNameList, function(index, item){
                    arrCityTpl.push('<option value="'+ item +'">'+ item +'</option>');
                });
                //更新省份对应的城市列表
                $citySelect.html(arrCityTpl.join(''));
            }
        });
    }

    /**
     * 绑定扩展信息的元素事件
     */
    function _bindEventByExtendInfo(){
        var $publishInfoBox = $('#publishInfoBox'),
            $memberInfoBox = $('#memberInfoBox');

        //是否出版/改编的开关
        $(':radio[name="novelAdapt"]').on('click', function() {
            if($(this).val() === '1'){
                $publishInfoBox.show();
            }else{
                $publishInfoBox.hide();
            }
        });

        //是否作协会员的选择器
        $(':radio[name="association"]').on('change', function() {
            if($(this).val() === '1'){
                $memberInfoBox.show();
            }else{
                $memberInfoBox.hide();
            }
        });

        //出版信息: checkbox容器
        $publishInfoBox.on('click', '.checkBox', function() {
            var $el = $(this),
                $checkbox = $el.find('input');

            if($el.hasClass('on_check')){
                $el.removeClass('on_check');
                $checkbox.removeAttr('checked');
            }else{
                $el.addClass('on_check');
                $checkbox.attr('checked','checked');
            }
        });  
    }

    /**
     * 动态提交表单
     */
    function _submitForm(){
        var $form = $('#realInfoForm'); //修改信息的表单

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

    _util.initNameSpace("CS.page.personal");
    CS.page.personal.realInfo = {
        'init': init
    };
})(jQuery);