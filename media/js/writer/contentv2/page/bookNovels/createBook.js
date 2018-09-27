/**
 * 创建作品站点
 */
;
(function($) {
    //外部依赖
    var _util = CS.util,
        _dialog = CS.dialog;

    var _params = {}; //参数集合

    /**
     * 初始化
     */
    function init() {
        var $siteRadio = $('#siteRadio'),
            $qdSiteRaido = $('#qd'),
            $csSiteRaido = $('#cs');
        _params.$siteRadioValue = $siteRadio.find('[data-node="siteRadioValue"]');//主站类型选择
        _params.$QDsiteRadioValue = $qdSiteRaido.find('[data-node="qdSiteRadioValue"]');//主站类型选择
        _params.$CSsiteRadioValue = $csSiteRaido.find('[data-node="csSiteRadioValue"]');//主站类型选择

        _bindEvent();
        _checkedRadioQD();
        _checkedRadioCS();
        _submitEvent();
    }

    /**
     * 绑定事件
     */
    function _bindEvent() {
        var cs = $('#cs'),
            qd = $('#qd'),
            target = $('#siteHidden').val();

        if(target == 0){
//            if($siteRadioValue.filter(':checked').val() > 0){
            _params.$siteRadioValue.on('change', function() {
                    var siteType = $(this).val();
                    //起点
                    if(siteType == 10){
                        cs.hide();
                        qd.show();
                    }else if(siteType == 9){
                        //创世
                        qd.hide();
                        cs.show();
                    }
                });
        }else if(target == 9){
            cs.show();
            qd.hide();
        }else if(target == 10){
            cs.hide();
            qd.show();
        }
    }

    function _checkedRadioQD(){
        _params.$CSsiteRadioValue.on('change', function() {
            var siteValue = $(this).val();
            $('#siteHidden').val(siteValue);
        });
    }

    function _checkedRadioCS(){
        _params.$QDsiteRadioValue.on('change', function() {
            var siteValue = $(this).val();
            $('#siteHidden').val(siteValue);
        });
    }

    function _submitEvent(){
        $('#submitCreatebook').on('click', function () {
            var siteHidden = $('#siteHidden'),
                $siteValue = _params.$siteRadioValue.filter(':checked').val(),  //主站类型选择
                $qdSiteValue = _params.$QDsiteRadioValue.filter(':checked').val(),
                $csSiteValue = _params.$CSsiteRadioValue.filter(':checked').val();

            if(siteHidden.val() ==0){
                if($siteValue == undefined){
                    _dialog.alert('请选择作品首发站点');
                }else{
                    if($siteValue == 9){
                        if($csSiteValue == undefined){
                            _dialog.alert('请选择作品目标读者');
                        }else{
                            $('#createBookForm').submit();
                        }
                    }else if($siteValue == 10){
                        if($qdSiteValue == undefined){
                            _dialog.alert('请选择作品目标读者');
                        }else{
                            $('#createBookForm').submit();
                        }
                    }
                }
            }else{
                if(siteHidden.val() == 1 || siteHidden.val() == 2 || siteHidden.val() == 9){
                    if($csSiteValue == undefined){
                        _dialog.alert('请选择作品目标读者');
                    }else{
                        $('#createBookForm').submit();
                    }
                }else if(siteHidden.val() == 3 || siteHidden.val() == 4 || siteHidden.val() == 5 || siteHidden.val() == 10){
                    if($qdSiteValue == undefined){
                        _dialog.alert('请选择作品目标读者');
                    }else{
                        $('#createBookForm').submit();
                    }
                }
            }

//            if($siteRadioValue.filter(':checked').val() > 1){
//                _dialog.alert('请选择作品目标读者');
//            }else{
//                $('#createBookForm').submit();
//            }
        });
    }

    _util.initNameSpace("CS.page");
    CS.page.createSite = {
        "init": init
    };
})(jQuery);