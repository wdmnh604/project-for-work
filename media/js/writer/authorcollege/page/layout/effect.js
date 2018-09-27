$(document).ready(function(){
	
	//头部搜索
	$(".btn-search").toggle(function(){
		$(".search").animate({"width": "160px"},300);
		$(".input-search").focus();
	},function(){
		$(".search").animate({"width": "0"},300);
		$(".input-search").blur();
	});
	
	//点击其他区域输入框
	$(document).bind('click',function(){
		$(".search").animate({"width": "0"},300);
	});

	$('.input-search').bind('click',function(e){
		stopPropagation(e);
	});
	
	//作家下拉效果
	$(".header .login-box .author-pic").hover(function(){
		$(".author-drop").show();
	})
	
	//点击其他区域作家下拉消失
	$(document).bind('mouseover',function(){
		$('.author-drop').css('display','none');
	});

	$('.author-drop,.author-pic').bind('mouseover',function(e){
		stopPropagation(e);
	});

	//返回顶部
	$(window).scroll(function(){
		if( $(document).scrollTop() > 90 ){
			$(".page-top").fadeIn();
		} else {
			$(".page-top").fadeOut();
		}
	})
	$(".page-top").click(function () {
        var speed =300;//滑动的速度
        $('body,html').animate({ scrollTop: 0 }, speed);
        return false;
	});
	
	//收藏
	$(".bookmark").on("click","#colltag",function(){
		if( $(".bookmark .mark").hasClass("checked") )
		{
			$(".bookmark .mark").text("收藏");
		} else {
			$(".bookmark .mark").text("已收藏");
		}
		$(".bookmark .mark").toggleClass("checked");
	});
	
	//评价
	$(".attitude .star").hover(function(){
		/* 当前hover的五角星及之前五角星加class="on" */
		$(this).prevAll(".star").addClass("on");
		
		/* 当前hover的后面五角星加class="out" */
		$(this).nextAll(".star").addClass("out");
		
		/* 当前hover的前面五角星删除class="out" */
		$(this).prevAll(".star").removeClass("out");
		
		/* 当前hover的五角星加class="on" */
		$(this).addClass("on");
		
		/* 当前hover的五角星删除class="out" */
		$(this).removeClass("out");
	},function(){
		$(this).prevAll(".star").removeClass("on");
		$(".star").removeClass("out");
		$(this).removeClass("on");
	});
	
	/* 五角星点击选中 */
	$(".attitude .star").click(function(){
		$(this).prevAll(".star").addClass("checked");
		$(this).nextAll(".star").removeClass("checked");
		$(this).addClass("checked");
	});
	
	//意见反馈
    $('.fixed-feedback').on('mouseover', function () {
        $('.btn-feedback').stop().animate({right: -31});
        $(this).stop().animate({width: 210}, 400);
        $(this).css({zIndex:10});
    });

    $('.fixed-feedback').on('mouseout', function () {
        $('.btn-feedback').stop().animate({right: 0});
        $(this).stop().animate({width: 31}, 400);
        $(this).css({zIndex:2});
    });
	
	//页脚联系我们小气泡
    var footBubble = function () {
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
    }();

	//0921官方微信公众号弹出
	var footBubble = function () {
		var weixinObj = $('#ftWeixin');
		var weixinBubble = $('#weixin-bubble');
		var footer = $('.footer');
		var cTimer, cTimer2 = null;
		$(weixinObj, weixinBubble).mouseover(function () {
			clearTimeout(cTimer);
			cTimer2 = setTimeout(function () {
				weixinBubble.fadeIn();
			}, 200);
		})
		$(footer, weixinBubble).mouseleave(function () {
			clearTimeout(cTimer2);
			cTimer = setTimeout(function () {
				weixinBubble.stop().fadeOut();
			}, 300);
		})
	}();

})

/* 弹窗弹出位置计算 */
function showpopup(id) {
	$("#"+ id).show();
}

function closepopup(id) {
	$("#"+ id).hide();
}
/* 阻止冒泡 */
function stopPropagation(e) {
	if (e.stopPropagation) 
		e.stopPropagation();
	else 
		e.cancelBubble = true;
}

