$(function () {
    //点击展开新闻
    $('.help-list-wrap li .link').on('click', function () {
        if ($(this).parent().hasClass('act')) {
            return false
        }
        $('.help-list-wrap li').removeClass('act');
        $(this).closest('li').addClass('act');
        $('.detail-text').hide();
        $(this).next('.detail-text').show();
    });

    //收起当前展开的新闻
    $('.detail-text .close').on('click', function () {
        $(this).closest('.detail-text').hide();
        $(this).closest('li').removeClass('act');
    });
	//选项切换
    $('.tabSwitch span').on('click', function () {
        $(this).addClass('act').siblings().removeClass('act');
        $('.tabWrap .tabBox').eq($('.tabSwitch span').index(this)).show().siblings().hide();
    });
});


