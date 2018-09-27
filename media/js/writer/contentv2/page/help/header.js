headHover = $(function(){
	var timer, timer2 = null;
	/*$('.bell').hover(
		function(){
			clearTimeout(timer);
			$(this).find('dl').fadeIn();
		},
		function(){
			timer = setTimeout(function (){	
			   $('.msgBox').stop().fadeOut(200);
			 },200);
		}
	);*/
	
	$('.headPhoto').hover(
		function(){
			clearTimeout(timer2);
			$(this).find('dl').fadeIn();
		},
		function(){
			timer2 = setTimeout(function (){	
			   $('.userBox').stop().fadeOut(200);
			 },200);
		}
	);
});