/*
 * @author  chenbaixiang
 *
 */

/*
* 剩余字数统计
* 注意 最大字数只需要在放数字的节点哪里直接写好即可 如：<var class="word">200</var>
*/
function statInputNum(msgInput,maxNums) {
	var max = maxNums,
	    curLength;
		msgInput[0].setAttribute("maxlength", max);
		curLength = msgInput.val().length;

		//numItem.text(max - curLength);
		var words=max - curLength;
		if (curLength==0) {
			$('.msg-btn-box .btn').removeClass('btn-submit');
			$('.msg-btn-box .btn').addClass('btn-disabled');
		}
	msgInput.on('input propertychange', function () {
		var _value = $(this).val().replace(/\n/gi,"");
		//numItem.text(max - _value.length);
		words=max - _value.length;
		if(words>0)
		{
			$('.msg-btn-box .btn').removeClass('btn-disabled');
			$('.msg-btn-box .btn').addClass('btn-submit');
		}
		if(_value.length==0){
			$('.msg-btn-box .btn').removeClass('btn-submit');
			$('.msg-btn-box .btn').addClass('btn-disabled');
		}
	});
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
	   $('.wrap').css({'width':'670px','margin':'0 auto'})
	}

	//先选出 textarea 和 统计字数 dom 节点
	var msgInput =$("#msgInput input");
	//调用
	statInputNum(msgInput,500);


	$('.btn-submit').live('touchstart',function(){
		$('#J-successTips').show();
		var mtipsW=$('#J-successTips').width()/2;
		$('#J-successTips').css({'margin-left':-mtipsW+'px'})
	})
});


