/**
 * 作品管理-signonline
 * @namespace CS.page.bookManage.signonline
 * @update 2015-2-3
 */
(function($){
    //外部依赖
    var _util = CS.util,
        _mask = CS.mask,
        _dialog = CS.dialog,
        _localImg = CS.localImg; //本地预览图片组件

    var _nodes = {}, //页面元素的对象集合
        _params={},
        _isSubmitting=0,    
        _maskByNovelTagPopup = null; //作品选择浮层的遮罩层组建的实例对象 

    /**
     * 初始化
     */
    function init(firstfinshdate,arrArea,PCC,bankPCC,cardtype,birthday){
        _params.firstfinshdate=firstfinshdate || '';
        _params.arrArea=arrArea || {};
        _params.PCC=PCC || '';
        _params.bankPCC=bankPCC || '';
        _params.cardtype=cardtype || '';
        _params.birthday=birthday || '';

        _nodes.$form=$('#signonlineForm');

        _bindEvent();
    }

    /**
     * 绑定页面元素的事件
     */
    function _bindEvent(){

        placeholderFun(".placeholer");

         //开启自定义滚动条
        $('.publish-wrap').slimScroll({
            height: '740px',
            railVisible: true,
            size: '10px',
            wheelStep: 10,
            borderRadius: 0,
            railBorderRadius:0,
            allowPageScroll: true,
            alwaysVisible:false,
            distance:'-1px'
        });

        _bindFirstfinshdate();

        _bindPCC('areaSelectBox','province','city','county',_params.PCC);
        if($('#areaSelectBoxBank').length !==0)
        {
            _bindPCC('areaSelectBoxBank','bank_province','bank_city','bank_county',_params.bankPCC);
        }
        
        

        _bindFileImg('idcard_front_file','idcard_front_img');
        _bindFileImg('idcard_back_file','idcard_back_img');
        _bindFileImg('passport_file','passport_img');
        _bindFileImg('officer_file','officer_img');
        $('#saveBtn').on('click',function(){
            if(_checkForm())
            {
                _submitForm();
            }
        });

        $('#AuthorNote').on('focus',function(){
            if($(this).attr('value') == $(this).attr('def'))
            {
                $(this).val('');
                $(this).css('color','black');
            }
        });
        
        if(_params.cardtype !== '0')
        {
           _bindBirthday(); 
        }
        _showkeeper(_params.birthday);

        $("#year,#month,#day").on('change',function(){
            var birthday=$('#year').val()+'-'+$('#month').val()+'-'+$('#day').val();
            if($('#year').val() && $('#month').val() && $('#day').val())
            {
                _showkeeper(birthday);
            }
            
        });
        $('select').comboSelect();
    }
    function _showkeeper(birthday)
    {
        $('.publish-wrap').find('[data-node="keeper"]').hide();
        if(birthday && !_util.isAdult(birthday))
        {
            $('.publish-wrap').find('[data-node="keeper"]').show();
        }
    }
    function _checkForm()
    {
        var $finishwords_error=$('#finishwords-error');
        var finishwords_min=Number($('#finishwords_min').val());
        var finishwords_max=Number($('#finishwords_max').val());
        $finishwords_error.text("");
        if(finishwords_min>finishwords_max)
        {
             $finishwords_error.text('预计完本字数,后者字数必须大于前者字数');
        }

        return true;
    }
    function _submitForm()
    {
        if(_isSubmitting)
        {
            return ;
        }
        _isSubmitting=1;
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
    function _bindFileImg(fileid,imgid)
    {
        if($('#'+fileid).length !==0)
        {
            //选择作品封面按钮
            $('#'+fileid).on('change', function() {
                var isSelectedImg = _localImg.show($(this), $('#'+imgid), {
                    'imgMaxSize': 2048, //图片最大容器（单位KB）               
                    'imgMaxSizeTips': '检测到上传照片超过2MB，请重新上传。', //图片超过最大容量限制的提示
                    'supportFileTypes': 'jpg|png',
                    'fileTypeErrorTips': '图片格式一定要是JPG，PNG中的一种'
                }); 

            });
        }

    }
    function _bindFileDoc(fileid,filenameid)
    {
        $('#'+fileid).on('change',function(){

            reg = new RegExp('\\.(doc|docx|dot|dotx|wps|wpt)$', 'i'); //匹配文件名的图片类型后缀
            var filename=$('#'+fileid).val();
            if(!reg.test(filename))
            {
                _dialog.alert('请上传正确的word文件');
            }
            $('#'+filenameid).text(getFileName(filename));
        });
    }
    function getFileName(path){
        var pos1 = path.lastIndexOf('/');
        var pos2 = path.lastIndexOf('\\');
        var pos  = Math.max(pos1, pos2)
        if( pos<0 )
            return path;
        else
        return path.substring(pos+1);
    }
    function _bindPCC(selectBoxId,provinceId,cityId,countyId,defPCC)
    {
        var province='北京市',
            city='北京市',
            county='东城区';
            
        if(defPCC)
        {
            var arrPCC=defPCC.split('-');
            if(arrPCC.length===3)
            {
                province=$.trim(arrPCC[0]).length >0?arrPCC[0]:province;
                city=$.trim(arrPCC[1]).length >0?arrPCC[1]:city;
                county=$.trim(arrPCC[2]).length >0?arrPCC[2]:county;
            }
        }
        var $province=$('#'+provinceId);
        var $city=$('#'+cityId);
        var $county=$('#'+countyId);

        $('#'+selectBoxId).areaSelector({
            ctlProvinceId: $province.attr('id'),
            ctlCityId: $city.attr('id'),
            ctlCountyId: $county.attr('id'),
            defProvince: province,
            defCity: city,
            defCounty: county,
            oArea:_params.arrArea
        });

    }
    function _bindFirstfinshdate()
    {
        var min_year=new Date().getFullYear();
        _getDateSelector('dateSelectBox','ffyear','ffmonth','ffday',_params.firstfinshdate,min_year,2080);
    }

    function _bindBirthday()
    {
        var max_year=new Date().getFullYear();
        _getDateSelector('birthdaySelectBox','year','month','day',_params.birthday,1950,max_year);
    }

    /**
     * [_getDateSelector 时间控件]
     * @param  {[type]} selectBoxid [description]
     * @param  {[type]} yearid      [description]
     * @param  {[type]} monthid     [description]
     * @param  {[type]} dayid       [description]
     * @param  {[type]} defaultDate [description]
     * @param  {[type]} min_year    [description]
     * @param  {[type]} max_year    [description]
     * @return {[type]}             [description]
     */
    function _getDateSelector(selectBoxid,yearid,monthid,dayid,defaultDate,min_year,max_year)
    {
        //默认的年月日
        var year = '',
            month = '',
            day = '';

        if (defaultDate) {
            var arrDefaultDate = defaultDate.split('-');
            if (arrDefaultDate.length === 3) {
                year = arrDefaultDate[0];
                month = arrDefaultDate[1];
                day = arrDefaultDate[2];
            }
        }
        var $year = $('#'+yearid),
            $month = $('#'+monthid),
            $day = $('#'+dayid);

        //日期联动组件
        $("#"+selectBoxid).dateSelector({
            ctlYearId: $year.attr('id'), //年控件id
            ctlMonthId: $month.attr('id'), //月控件id
            ctlDayId: $day.attr('id'), //日控件id
            defYear: year, //默认年
            defMonth: month, //默认月
            defDay: day, //默认日
            minYear: min_year, //最小年|默认为1882年
            maxYear: max_year
        });
    }

    Placeholder = {
        // 判断浏览器是否支持placeholder属性
        isSupportPlaceholder: function() {
            var input = document.createElement('input');
            return 'placeholder' in input;
        },
        placeChangeClass: function(ele) {
            if ($(ele).val() == "") {
                $(ele).addClass("placeholder-text");
            } else {
                $(ele).removeClass("placeholder-text");
            }
            //输入框失去焦点
            $(ele).focus(function() {
                $(this).removeClass("placeholder-text");
            }).blur(function() {
                if ($(this).val() == "") {
                    $(this).addClass("placeholder-text");
                } else {
                    $(this).removeClass("placeholder-text");
                }
            });
        },
        //替换placeholder的处理
        inputOrTextarea: function(obj, val) {
            var $input = obj,
            val = val;
            $input.attr({
                value: val
            });
            $input.focus(function() {
                if ($input.val() == val) {
                    $(this).removeClass("placeholder-text");
                    $(this).attr({
                        value: ""
                    });
                }
            }).blur(function() {
                if ($input.val() == "") {
                    $(this).addClass("placeholder-text");
                    $(this).attr({
                        value: val
                    });
                }
            });
        },
        // 遍历所有除了密码框input或textarea对象 
        eleChange: function(ele) {
            $(ele).not("input[type='password']").each(function() {
                var self = $(this),
                val = self.attr("placeholder");
                Placeholder.inputOrTextarea(self, val);
            });
        }    

        
    }
    // 如果不支持placeholder，用jQuery来完成
    function placeholderFun(eleinput) {
        if (!Placeholder.isSupportPlaceholder()) { 
            $(eleinput).addClass("placeholder-text");    
            Placeholder.eleChange(eleinput);
        } else {
            Placeholder.placeChangeClass(eleinput);
            
        }
    }    
    

    function changeClass(){
        var pageTwoTop=$(".msgBoxTitle").offset().top;
        var pageTwoLeft=$(".sectionBtnBox").offset().left;
        var top=$(document).scrollTop();
        var leftA=$(document).scrollLeft();
        if(top>=pageTwoTop+105)
        {
            $("#JsectionBtnBox").addClass("fixedTop");
            $("#JsectionBtnBox").css({'left':pageTwoLeft-leftA});
        }
        else
        {
            $("#JsectionBtnBox").removeClass("fixedTop");
        }
    }
    $(window).scroll(function(){
        changeClass();
    })
    $(window).resize(function() {
        $(window).scroll(function(){
            changeClass();
        })
    });

    _util.initNameSpace("CS.page");
    CS.page.signonline = {
        'init' : init
    };
})(jQuery);
