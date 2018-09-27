/**
 * 顶部提示
 * @namespace CS.topTip
 * @update 2015-12-10
 * @example
 * 显示提示（默认3秒后自动关闭提示）:
 *     CS.topTip.show('提示的具体内容', closeCallback);
 * 隐藏提示:
 *     CS.topTip.hide(closeCallback);
 */
(function($) {
    //外部依赖
    var _util = CS.util;

    var _nodes = {}, //元素的对象集合
        _autoHideTime = 1000, //触发自动隐藏的时间(单位：毫秒)
        _autoHideTimeout = null; //自动隐藏的timeout对象

    //提示的模板
    var _boxTpl = [
        '<div id="topTipBox" class="top-tipbox hidden">',
            '<p data-node="content"></p>',
        '</div>'
    ].join('');

    /**
     * 显示提示
     * @param  {string} content 提示内容
     * @param {function} closeCallback 关闭时的回调函数
     */
    function show(content, closeCallback) {
        if (!content) {
            return;
        }

        if (_autoHideTimeout) {
            clearTimeout(_autoHideTimeout);
        }

        _nodes.$box = $('#topTipBox');

        //没有创建过提示容器
        if (!_nodes.$box || _nodes.$box.length === 0) {
            $(document.body).append(_boxTpl);

            $(window).on('resize', function() {
                //以函数节流方式，重新定位，以免过于频繁得触发
                _util.throttle(setPosition);
            });

            _nodes.$box = $('#topTipBox');
        }

        _nodes.$content = _nodes.$box.find('[data-node="content"]');

        _nodes.$content.text(content);
        setPosition();
        _nodes.$box.fadeIn('fast');

        //在指定的时间后，自动隐藏
        _autoHideTimeout = setTimeout(function() {
            hide(closeCallback);
        }, _autoHideTime);
    }

    /**
     * 隐藏提示
     * @param {function} closeCallback 关闭时的回调函数
     */
    function hide(closeCallback) {
        if (_autoHideTimeout) {
            clearTimeout(_autoHideTimeout);
        }

        _nodes.$box.fadeOut('slow', function() {
            if (typeof closeCallback === 'function') {
                closeCallback();
            }
        });
    }

    /**
     * 设置定位
     */
    function setPosition() {
        var left = ($(window).width() - _nodes.$box.width()) / 2;
        //水平居中
        _nodes.$box.css('left', left + 'px');
    }

    _util.initNameSpace("CS");
    CS.topTip = {
        'show': show,
        'hide': hide,
        'setPosition': setPosition
    };
})(jQuery);