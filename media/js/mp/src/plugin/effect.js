
/* 弹窗弹出位置计算 */
function showpopup(id) {
	$("#"+ id).show();
	var popheight = $("#"+ id).find(".dialog-body").height();
	if( popheight > $(window).height() )
	{
		$(".dialog-body").css("position","absolute");
		$(".dialog-body").css({top:$(window).scrollTop()});
	}else {
		$(".dialog-body").css("position","fixed");
		$(".dialog-body").css({ top: ($(window).height()-popheight)/2});
	}	
}

function closepopup(id) {
	$("#"+ id).hide();
}
	
$(document).ready(function(){
	
	//作家下拉效果
	$(".header .author").click(function(){
		$(".author-drop").toggle();
	});
	
	//点击其他区域作家下拉消失
	$(document).bind('click',function(){
		$('.author-drop').css('display','none');
	});

	$('.author-drop,.author').bind('click',function(e){
		stopPropagation(e);
	});

	//留言管理页面
	//加入，移除
	$(".message-box .state .add").click(function(){
		$(this).hide();
		$(this).siblings(".remove").show();
	});
	
	$(".message-box .state .remove").click(function(){
		$(this).hide();
		$(this).siblings(".add").show();
	})
	
	//页面切换
	$(".message-ttl li").eq(0).click(function(){
		$(".message-all").show();
		$(".message-article").hide();
		$(this).addClass("current");
		$(this).siblings().removeClass("current");
	})
	
	$(".message-ttl li").eq(1).click(function(){
		$(".message-all").hide();
		$(".message-article").show();
		$(this).addClass("current");
		$(this).siblings().removeClass("current");
	})
	
	$(".message-box .operator .reply").each(function(){
		$(this).click(function(){
			$(this).parents(".message-box").siblings(".answer-box").show();
		})
	})
	
	/*回复框自适应*/
	$(".answer-box textarea").on("input propertychange", function (e) {
	   var target = e.target;
	   // 保存初始高度，之后需要重新设置一下初始高度，避免只能增高不能减低。           
		var dh = $(target).attr('defaultHeight') || 0;
		if (!dh) {
			dh = target.clientHeight-12;
			$(target).attr('defaultHeight', dh);
		}

		target.style.height = dh +'px';
		var clientHeight = target.clientHeight;
		var scrollHeight = target.scrollHeight;
		if (clientHeight !== scrollHeight) { target.style.height = scrollHeight -12 + "px";}
	});
	
	//单篇文章留言详情
	$(".message-article .article-pic,.message-article .article .name,.message-article .view").click(function(){
		$(".message-detail").show();
		$(".message-conts").hide();
	});
	
	$(".message-detail .return").click(function(){
		$(".message-detail").hide();
		$(".message-conts").show();
	})
	
	

})

/* 阻止冒泡 */
function stopPropagation(e) {
	if (e.stopPropagation) 
		e.stopPropagation();
	else 
		e.cancelBubble = true;
}

