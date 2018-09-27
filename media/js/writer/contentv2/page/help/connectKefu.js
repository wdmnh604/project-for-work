$(function () {
    //页脚联系我们小气泡
    var contactObj = $('#contact');
    var conBubble = $('#contact-bubble');
    var footer = $('.footer');
    var cTimer, cTimer2 = null;
    $(contactObj, conBubble).mouseover(function () {
        clearTimeout(cTimer);
        cTimer2 = setTimeout(function () {
            conBubble.fadeIn();
        }, 200);
    })
    $(footer, conBubble).mouseleave(function () {
        clearTimeout(cTimer2);
        cTimer = setTimeout(function () {
            conBubble.stop().fadeOut();
        }, 300);
    })
});

