/**
 * 操作本地图片
 * @namespace CS.localImg
 * @author langtao
 * @update 2015-8-12
 */
(function($) {
    //外部依赖
    var _util = CS.util,
        _dialog = CS.dialog;

    /**
     * 显示本地图片
     * @param  {object} $fileBtn         选择文件按钮的jquery对象
     * @param  {object} $previewImg      预览图片的jquery对象
     * @return {bool}            是否成功选择了图片
     */
    function show($fileBtn, $previewImg, configs) {
        if (!$fileBtn || $fileBtn.length === 0 || !$previewImg || $previewImg.length === 0) {
            return false;
        }

        var defaults = {
                'supportFileTypes': 'jpg', //支持的文件类型，多个的情况下用|隔开，比如jpeg|jpg|gif|bmp|png
                'fileTypeErrorTips': '这个图片的格式一定要是JPG', //文件类型错误时的提示语
                'imgMaxSize': 5120, //图片最大容器（单位KB, 默认5MB）
                'imgMaxSizeTips': '您上传的图片大于5MB' //图片超过最大容量限制的提示
            },
            options = $.extend(true, {}, defaults, configs);

        var fileBtn = $fileBtn.get(0), //选择文件的按钮
            reg = new RegExp('\\.(' + options.supportFileTypes + ')$', 'i'); //匹配文件名的图片类型后缀

        if (!reg.test($fileBtn.val())) {
            _dialog.alert(options.fileTypeErrorTips);
            $fileBtn.focus();
            return false;
        }

        if (fileBtn.files && fileBtn.files.length > 0) { //html5
            var file = fileBtn.files[0];

            if(file.size >= options.imgMaxSize * 1024){
                _dialog.alert(options.imgMaxSizeTips);
                $fileBtn.focus();
                return false;
            }

            var fileReader = new FileReader();
            fileReader.onload = function(e) {
                $previewImg.attr('src', e.target.result).show();
            };
            fileReader.readAsDataURL(file);
        }

        return true;
    }

    _util.initNameSpace("CS");
    CS.localImg = {
        'show': show
    };
})(jQuery);