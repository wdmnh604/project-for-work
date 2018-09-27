/**
 * 创建作品
 * @namespace CS.page.userMember.createBook
 * @author langtao
 * @update 2014-6-10
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
        _bindEvent();
    }

    /**
     * 绑定事件
     */
    function _bindEvent() {
        var $readerSex = $('input[name="choiceSex"]'), //作品的目标读者的性别
            $publishSite = $('input[name="sendSite"]'), //作品发布的站点
            $boySiteList = $('#boySiteList'), //男站列表
            $girlSiteList = $('#girlSiteList'); //女站列表

        $readerSex.change(function() {
            var readerSex = $(this).val();

            //男生
            if(readerSex === '1'){
                $girlSiteList.hide();
                $boySiteList.show();
                //创世男生站
                $publishSite.filter('[value="1"]').prop('checked', true);
            }else{ //女生
                $boySiteList.hide();
                $girlSiteList.show();
                $publishSite.prop('checked', false);
            }
        });

        //创建作品：下一步按钮
        $('#nextStepBtn').on('click', function () {
            var readerSex = $readerSex.filter(':checked').val(),
                publishSite = $publishSite.filter(':checked').val();

            if(typeof readerSex === 'undefined'){
                _dialog.alert('请选择作品目标读者');
                return false;
            }

            $('#createBookForm').submit();
            return false;
        });

        var $newsList = $("#newsList"); //新闻列表
        //标题和关闭按钮
        $newsList
            .on('click', 'h3', function() {
                var $item = $(this).siblings(".list-item");
                $item.slideUp(200);

                if ($item.is(":hidden")) {
                    $newsList.find(".list-item").slideUp(200);
                    $item.slideDown(200);
                } else {
                    $item.slideUp(200);
                }
            })
            .on('click', '.news_close', function() {
                $(this).parent().slideUp(200);
                return false;
            });
    }

    _util.initNameSpace("CS.page.userMember");
    CS.page.userMember.createBook = {
        "init": init
    };
})(jQuery);