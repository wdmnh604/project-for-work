/**
 * 右侧工具条
 * @namespace CS.rightBar
 * @author langtao
 * @update 2016-1-4
 */
(function($) {
    //外部依赖
    var _util = CS.util;

    var _hasAddLog = 0; //是否添加过记录

    /**
     * 初始化
     */
    function init(){

        _bindEvent();
        _hbPositon();
        $(window).resize(function () {
            _hbPositon()
        });
    }

    /**
     * 绑定元素事件
     */
    function _bindEvent(){
    	  //悬浮二维码开关
        $('.qrSwitch-wrap').on('mouseover', function () {
            $('.qrSwitch').stop().animate({right: -31});
            $(this).stop().animate({width: 241}, 400);
            $(this).css({zIndex:10});
        });

        $('.qrSwitch-wrap').on('mouseout', function () {
            $('.qrSwitch').stop().animate({right: 0});
            $(this).stop().animate({width: 31}, 400);
            $(this).css({zIndex:2});
        });


        //意见反馈
        $('.feedback-btn-wrap').on('mouseover', function () {
            $('.feedback-btn').stop().animate({right: -31});
            $(this).stop().animate({width: 210}, 400);
            $(this).css({zIndex:10});
        });

        $('.feedback-btn-wrap').on('mouseout', function () {
            $('.feedback-btn').stop().animate({right: 0});
            $(this).stop().animate({width: 31}, 400);
            $(this).css({zIndex:2});
        });
    }
     /* 红包入口*/
     function _hbPositon() {
        var mainRight = $('.mainRight');
        var rOffset = mainRight.offset();
        if (!(mainRight.length)) {
            $('.hb-wrap').css('right', 20);
        } else {
            var hbPos = rOffset.left + mainRight.width();
            $('.hb-wrap').css('left', hbPos + 20);
        }
    }

    _util.initNameSpace("CS");
    CS.rightBar = {
        'init': init
    };
})(jQuery);