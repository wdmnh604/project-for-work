/**
 * 公共模块
 * @author langtao
 * @date 2014-11-20
 */
;
$(function(){
	
	$('a').on('click',  function() {
		var url = $(this).attr('href');
		//有session信息，有超链接地址
		
		if(sessionInfo && url && url.indexOf('javascript') === -1 && url.indexOf('#') === -1){
			var arrSessionInfo = [],
				urlTag = url.indexOf('?') === -1 ? '?' : '&'; //url参数连接符

			$.each(sessionInfo, function(key, value){
				arrSessionInfo.push(key +'='+ value);
			});

			strSessionInfo = arrSessionInfo.join('&');

			window.location.href = url + urlTag + strSessionInfo;
			return false;
		}
	});
});