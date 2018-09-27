$(function(){
	//悬浮二维码开关
	$('.qrSwitch').on('click', function(){
		$(this).animate({right: -31});
		$('.rightQrWrap').animate({right: 0});
	});
	
	$('.rightQrWrap h3 a').on('click', function(){
		$('.rightQrWrap').animate({right: -209});
		$('.qrSwitch').animate({right: 0});
	});
	
	//选项切换
	$('.tabSwitch span').on('click',  function(){
		$(this).addClass('act').siblings().removeClass('act');
		$('.tabWrap .tabBox').eq($('.tabSwitch span').index(this)).show().siblings().hide();
	});
	
	//悬停li列表时显示按钮，当前li改变底色
	$('.hoverLi li').on('mouseover',  function(){
		$(this).addClass('hover').siblings().removeClass('hover')
	});
	
	$('.hoverLi li').on('mouseout',  function(){
		$(this).removeClass('hover')
	});
	
	//关闭弹窗
	$('.closePopup').on('click',  function(){
		$(this).closest('.popupWrap').fadeOut(200);
		$('.mask').fadeOut();
	});
	
	//单选框选中效果
	$('span.radio').click(function(){
		$(this).addClass('on').siblings('.radio').removeClass('on');
		$(this).find('input').attr('checked','checked').parent().siblings().find('input').removeAttr('checked');
	});
	
	//点击后清空文本框内的文字
	$(".clearText").focus(function(){
		if ($(this).val() == $(this).attr("def"))
		{
			$(this).val("");
			};
	});
	
	$(".clearText").blur(function(){
		if ($(this).val() == "")
		{
			$(this).val($(this).attr("def"));
			$(this).css('color', '#bbb');
		};
		if ($(this).val() != $(this).attr("def"))
		{
			$(this).css('color', '#000');
		}
	});
	
	//点击后清空文本框内的文字
	$(".clearInput").focus(function(){
		if ($(this).val() == $(this).attr("def"))
		{
			$(this).val("");
		}
	});
	
	$(".clearInput").blur(function(){
		if ($(this).val() == "")
		{
			$(this).val($(this).attr("def"));
			$(this).css('color', '#999');
		};
		if ($(this).val() != $(this).attr("def"))
		{
			$(this).css('color', '#000');
		}
	});
	
	
});


