$(document).ready(function(){
	$('.index-slider ul').carouFredSel({
		scroll: {
			items: 1,
			pauseOnHover: 'immediate'
		},
		items: {
			visible: 1
		},
		auto: {
		 	timeoutDuration: 5000
		},
		prev: '.prev',
		next: '.next',
		pauseOnHover: 'immediate',
		pagination: ".pager"		
	});
	$(".index-slider").hover(function(){
		$(this).toggleClass("hover");
	})

})
