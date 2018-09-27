
(function ($) {
    //外部依赖
    var _util = CS.util,
    _dialog = CS.dialog;

    /**
     * 初始化
     */
    function init() {
        //切换站点名
        tabSiteName();
        //检查是否选择站点
        checkSite();
    }

    //切换站点名
    function tabSiteName(){
        $(function(){
            if($('#nansheng').hasClass('on')){
                $('#sitename1').html('起点中文网');
                $('#sitename2').html('创世中文网');
            }
            if($('#nvsheng').hasClass('on')){
                $('#sitename1').html('起点女生网');
                $('#sitename2').html('云起书院');
            }
                
        });
        $('.radioclass').click(function(){
            var borg = $(this).attr('id');
            if(borg == 'boy'){//boy
                $('#sitename1').html('起点中文网');
                $('#sitename2').html('创世中文网');
            }
            if(borg == 'girl'){//girl
                $('#sitename1').html('起点女生网');
                $('#sitename2').html('云起书院');
            }
        });
    }
    function checkSite(){
        var fla = false;
        $('#submitCreatebook').click(function(){
            $("input[name='site']").each(function(){
                if($(this).parent().hasClass('on') && $(this).attr('checked') == 'checked')
                    fla = true;
            });
            if(!fla){
                _dialog.alert('请选择站点');
                return;
            }
            $('#createBookForm').submit();
        });
        
    }

    _util.initNameSpace("CS.page.bookNovels");
    CS.page.bookNovels.tabSiteName = {
        'init': init
    };
})(jQuery);