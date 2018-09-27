/**
 * 作家资料：真实信息
 * @namespace CS.page.personal.realInfo
 * @date 2015-12-21
 */
(function($) {
    //外部依赖
    var _util = CS.util,
        _dialog = CS.dialog,
        _localImg = CS.localImg,
        _areaLinkage = CS.citySelection;

    var _params = {}, //参数集合
        _nodes = {}, //元素的对象集合
        _isSubmitting = 0; //表单是否正在提交中 

    /**
     * 初始化
     * @param {object} cityList 城市列表
     * @param {string} userBirthday 用户的生日（例如：1989-12-24，用-分隔）
     */
    function init(cityList, userBirthday,card_type,isrealnamecert) {
        _params.ajaxGetProvince = cityList || {};
        _params.userBirthday = userBirthday || '';
        _params.card_type = card_type || '';
        _params.isrealnamecert = isrealnamecert || '';

        _nodes.$form = $('#realInfoForm');

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
                'supportFileTypes': 'jpg|png',
                'fileTypeErrorTips': '图片格式一定要是JPG，PNG中的一种'
            });

        });

        //修改按钮
        $('#modifyBtn').on('click', function() {
            if(_params.card_type=='0' && _params.isrealnamecert=='1')
            {
                $('.saveBox[data-node!="birthday"]').hide();
                $('.modifyBox[data-node!="birthday"]').show();
            }else
            {
                $('.saveBox').hide();
                $('.modifyBox').show();
            }
            //selelct显示作家默认地址
            $("#provinceSelect").val($("input[data-node='province-name']").val());
            $("#citySelect").val($("input[data-node='city-name']").val());
            $("#areaSelect").val($("input[data-node='area-name']").val());
            $(this).hide();
            $saveBtn.show();
            return false;
        });

        //保存按钮
        $saveBtn.on('click', function() {
            if(_checkForm()){
                _submitForm();
            }
            
            return false;
        });
    }

    /**
     * 绑定下拉选择器的元素事件
     */
    function _bindEventBySelector() {
        //默认的年月日
        var year = '',
            month = '',
            day = '';

        if (_params.userBirthday) {
            var arrBirthday = _params.userBirthday.split('-');
            if (arrBirthday.length === 3) {
                year = arrBirthday[0];
                month = arrBirthday[1];
                day = arrBirthday[2];
            }
        }

        _updateAge(year, month, day);

        var $birthYear = $('#birthYear'),
            $birthMonth = $('#birthMonth'),
            $birthDay = $('#birthDay');

        //日期联动组件
        $("#dateSelectBox").dateSelector({
            ctlYearId: $birthYear.attr('id'), //年控件id
            ctlMonthId: $birthMonth.attr('id'), //月控件id
            ctlDayId: $birthDay.attr('id'), //日控件id
            defYear: year, //默认年
            defMonth: month, //默认月
            defDay: day, //默认日
            minYear: 1900 //最小年|默认为1882年
        });

        //生日选择器，动态更新用户年龄
        $birthYear.add($birthMonth).add($birthDay).on('change', function() {
            _updateAge($birthYear.val(), $birthMonth.val(), $birthDay.val());
        });

        _areaLinkage.regionalLinkage(_params.ajaxGetProvince);
    }

    /**
     * 绑定扩展信息的元素事件
     */
    function _bindEventByExtendInfo() {
        var $publishInfoBox = $('#publishInfoBox'),
            $memberInfoBox = $('#memberInfoBox');

        //是否出版/改编的开关
        $(':radio[name="novelAdapt"]').on('click', function() {
            if ($(this).val() === '1') {
                $publishInfoBox.show();
            } else {
                $publishInfoBox.hide();
            }
        });

        //是否作协会员的选择器
        $(':radio[name="association"]').on('change', function() {
            if ($(this).val() === '1') {
                $memberInfoBox.show();
            } else {
                $memberInfoBox.hide();
            }
        });

        //出版信息: checkbox容器
        $publishInfoBox.on('click', '.checkBox', function() {
            var $el = $(this),
                $checkbox = $el.find('input');

            if ($el.hasClass('on_check')) {
                $el.removeClass('on_check');
                $checkbox.removeAttr('checked');
            } else {
                $el.addClass('on_check');
                $checkbox.attr('checked', 'checked');
            }
        });
    }

    /**
     * 检测表单
     * @return {bool} 是否通过检测
     */
    function _checkForm(){
        var birthYear = $('#birthYear').val(),
            birthMonth = $('#birthMonth').val(),
            birthDay = $('#birthDay').val(),
            emptyCount = 0;

        if(!birthYear){
            emptyCount++;
        }
        if(!birthMonth){
            emptyCount++;
        }
        if(!birthDay){
            emptyCount++;
        }

        //有1到2个是请选择项
        if(emptyCount > 0 && emptyCount < 3){
            _dialog.alert('请选择出生日期');
            return false;
        }

        return true;
    }

    /**
     * 动态提交表单
     */
    function _submitForm() {
        if (_isSubmitting) {
            return;
        }
        _isSubmitting = 1;

        //动态提交表单
        _util.ajaxSubmitForm(_nodes.$form, {
            type: "POST",
            data: {},
            dataType: "json",
            success: function(json) {
                if (!json) {
                    _dialog.alert('返回的数据格式异常，请稍候再试');
                    return;
                }

                //成功
                if (json.status) {
                    _dialog.alert(json.info || '提交成功', function() {
                        //刷新页面
                        location.href = location.href;
                    });
                } else {
                    _dialog.alert(json.info || '操作失败，请稍候再试');
                }
            },
            error: function() {
                _dialog.alert('操作失败，请稍候再试');
            },
            complete: function() {
                _isSubmitting = 0;
            }
        });
    }

    /**
     * 更新年龄
     * @param  {string} year  年
     * @param  {string} month 月
     * @param  {string} day   日
     */
    function _updateAge(year, month, day){
        if(!year || !month || !day){
            return;
        }

        var birthDay = new Date(year, month, day),
            now = new Date(),
            thisYear = now.getFullYear(),
            birthDayThisYear = new Date(thisYear, month, day),
            age = thisYear - birthDay.getFullYear();

        //今年生日还未到
        if(birthDayThisYear.getTime() > now.getTime()){
            --age;
        }

        if(age < 0){
            age = 0;
        }

        _nodes.$form.find('[data-node="age"]').text(age);
    }

    _util.initNameSpace("CS.page.personal");
    CS.page.personal.realInfo = {
        'init': init
    };
})(jQuery);