/*
 * @author  chenbaixiang
 *
 */

var survey=function(event){
	$('.J-surveySubmite').on('click',function(){
		$('.survey .icheckbox_square-blue').hide();
		$('.survey .iradio_square-blue ').hide();
		$('.survey .result').show();
	})
	
}

var zan=function(){
	$('.J-zan').on('click',function(){
		$(this).addClass('active');
	})
}



var is_mobile=function () {
    var regex_match = /(nokia|iphone|android|motorola|^mot-|softbank|foma|docomo|kddi|up.browser|up.link|htc|dopod|blazer|netfront|helio|hosin|huawei|novarra|CoolPad|webos|techfaith|palmsource|blackberry|alcatel|amoi|ktouch|nexian|samsung|^sam-|s[cg]h|^lge|ericsson|philips|sagem|wellcom|bunjalloo|maui|symbian|smartphone|midp|wap|phone|windows ce|iemobile|^spice|^bird|^zte-|longcos|pantech|gionee|^sie-|portalmmm|jigs browser|hiptop|^benq|haier|^lct|operas*mobi|opera*mini|320x320|240x320|176x220)/i;
    var u = navigator.userAgent;
    if (null == u) {
        return true;
    }
    var result = regex_match.exec(u);
    if (null == result) {
        return false
    } else {
        return true
    }
}
if (is_mobile()) {
   $('wrap').css({'min-width':'320px'})
}
else{
   $('wrap').css({'max-width':'670px'})
}



$(function(){


	if (is_mobile()) {
	   $('.wrap').css({'min-width':'320px'})
	}
	else{
	   $('.wrap').css({'width':'670px'})
	}

	survey();
	zan();
});
