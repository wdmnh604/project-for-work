/**
 * 地区联动
 * @namespace CS.citySelection
 * @update 2016-9-29
 * @author
 */
(function($) {
    //外部依赖
    var _util = CS.util;

    function regionalLinkage(areaarr){
        var $citySelect = $('#citySelect'); //城市选择器
        var $areaSelect = $('#areaSelect');//区选择器
        //省选择器
        $('#provinceSelect').on('change', function() {
            var provinceName = $(this).val(),
                cityNameList = areaarr[provinceName];

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
            cityNameList = areaarr[provinceName];
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

    _util.initNameSpace("CS");
    CS.citySelection = {
        'regionalLinkage':regionalLinkage
    };
})(jQuery);