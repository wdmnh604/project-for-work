//开启自定义滚动条
$('#sectionList, #apply-List').slimScroll({
    height: '740px',
    railVisible: true,
    size: '10px',
    wheelStep: 10,
    borderRadius: 0,
    railBorderRadius:0,
    allowPageScroll: true,
    alwaysVisible:1,
    distance:'-1px'
});

$('#sectionText, .apply-wrap-content').slimScroll({
    height: '740px',
    railVisible: true,
    borderRadius: 0
});

$('.say').slimScroll({
    height: '130px',
    railVisible: true,
    borderRadius: 0
});


//点击分卷后呈现当前样式，清除章节列表的当前样式
$('.volume').click(function () {
    if ($(this).hasClass('act')) {
        $(this).removeClass('act').next('.sectionWrap').slideUp(300);
    }
    else{
        $('.volume, .sectionWrap li').removeClass('act');
        $(this).siblings('.sectionWrap').find('li:first').addClass('act');
        $(this).addClass('act');
        $('.sectionWrap').slideUp(300);
        $(this).next('.sectionWrap').slideDown(300)
    }
});

//点击章节后呈现当前样式，清除分卷和相邻章节的当前样式
$('.sectionWrap li').click(function () {
    $(this).addClass('act').siblings().removeClass('act');
    $(this).stopPropagation();
    $('.volume').removeClass('act');
});