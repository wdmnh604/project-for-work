/**
 * 工具类
 * @namespace CS.util
 * @author  langtao
 * @update 2014-11-5
 */
;
(function(global, $) {
	var _util = {
		/**
		 * 初始化命名空间
		 * @param  {String} router 命名空间的名称
		 * @param  {Object} root   命名空间的基准，默认是window
		 */
		initNameSpace: function(router, root) {
			if (!router || router === '') {
				return;
			}
			var p = root || window,
				arrNS = router.split('.');
			for (var i = 0, len = arrNS.length; i < len; i++) {
				if (!p[arrNS[i]]) {
					p[arrNS[i]] = {};
				}
				p = p[arrNS[i]];
			}
		},

		/**
		 * 判断是否登录
		 * @return {Boolean} 是否登录
		 */
		isLogin: function() {
			return typeof isUserlogin === 'undefined' || isUserlogin === 0 ? false : true; //!!$.cookie('skey') && !! $.cookie('uin');
		},

		/**
		 * 替换模板，$str$
		 * @param  {string} str  模板字符串
		 * @param  {object} conf 模板替换配置
		 * @return {string}      字符串
		 */
		replaceTpl: function(str, conf) {
			return ("" + str).replace(/\$(\w+)\$/g, function(a, b) {
				return typeof conf[b] != "undefined" ? conf[b] : "$" + b + "$";
			});
		},

		/**
		 * 根据QueryString参数名称获取值
		 * @param  {string} name 需要获取的参数
		 * @param  {string} str QueryString
		 * @return {string}      参数的值
		 */
		getQueryByName: function(name, str) {
			str = str || window.location.href;

			var qIndex = str.indexOf('?');
			if (qIndex === -1) {
				return null;
			}

			var query = str.substr(qIndex),
				result = query.match(new RegExp("[\?\&]" + name + "=([^\&]+)", "i"));

			if (result === null || result.length < 1) {
				return '';
			}

			return result[1];
		},

		/**
		 * 是否为正整数
		 * @param  {int/string}  number 数字或字符串
		 * @return {Boolean}     是/否
		 */
		isPositiveInteger: function(number) {
			return /^[0-9]*[1-9][0-9]*$/.test(number);
		},

		/**
		 * 获取字符串长度（支持中文）
		 * @param  {string} str 字符串
		 * @return {int}     字符串长度
		 */
		mb_strlen: function(str) {
			var len = 0;

			if (str) {
				for (var i = 0; i < str.length; i++) {
					len += str.charCodeAt(i) < 0 || str.charCodeAt(i) > 255 ? 3 : 1;
				}
			}

			return len;
		},

		/**
		 * 截取字符串（支持中文）
		 * @param  {string} str    [description]
		 * @param  {int} maxlen [description]
		 * @param  {string} dot    [description]
		 * @return {string}        截取后的字符串
		 */
		mb_cutstr: function(str, maxlen, dot) {
			if (!str) {
				return '';
			}

			dot = !dot ? '...' : dot;
			maxlen = maxlen - dot.length;

			var len = 0;
			var ret = '';

			for (var i = 0; i < str.length; i++) {
				len += str.charCodeAt(i) < 0 || str.charCodeAt(i) > 255 ? 3 : 1;
				if (len > maxlen) {
					ret += dot;
					break;
				}
				ret += str.substr(i, 1);
			}
			return ret;
		},

		/**
		 * ajax请求
		 * @return {jquery object} jquery的ajax对象
		 */
		request: function(option) {
			var me = this;

			//未设置过超时时间
			if (!('timeout' in option)) {
				option.timeout = 10000; //超时时间：默认为3秒
			}

			//有session信息
			if(sessionInfo){
				if(!('data' in option)){
					option.data = {};
				}
				
				$.each(sessionInfo, function(key, value){
					option.data[key] = value;
				});
			}

			return $.ajax(option);
		},

		/**
		 * 验证是否合法的email地址
		 * @param  string  emailAddress email地址
		 * @return bool           是否合法
		 */
		isValidEmailAddress: function(emailAddress) {
			var pattern = new RegExp(/^[+a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,4}$/i);

			return pattern.test(emailAddress);
		},

		/**
		 * 验证手机号码
		 * @param  {string}  value 输入值
		 * @return {Boolean}            是否手机号码
		 */
		isPhone: function(value) {
			var mobile = /^(((13[0-9]{1})|(15[0-9]{1}))+\d{8})$/;
			var tel = /^\d{3,4}-?\d{7,9}$/;

			return (tel.test(value) || mobile.test(value));
		},

		/**
		 * 验证QQ号码
		 * @param  {string}  value 输入值
		 * @return {Boolean}            是否QQ号码
		 */
		isQQ: function(value) {
			var pattern = /^[1-9]\d{4,9}$/;

			return pattern.test(value);
		},

		/**
		 * 验证邮政编码
		 * @param  {string}  value 输入值
		 * @return {Boolean}            是否邮政编码
		 */
		isZipCode: function(value) {
			var pattern = /^[0-9]{6}$/;

			return pattern.test(value);
		},

		/**
		 * 获取窗口滚动条的上边距
		 * @return {int} 上边距
		 */
		getScrollTop: function() {

			return window.pageYOffset || document.documentElement.scrollTop || document.body.scrollTop;
		},

		/**
		 * 获取窗口滚动条的左边距
		 * @return {int} 左边距
		 */
		getScrollLeft: function() {

			return window.pageXOffset || document.documentElement.scrollLeft || document.body.scrollLeft;
		},

		/**
		 * 获取窗口可见宽度
		 * @return {int} 宽度
		 */
		getClientWidth: function() {

			return (document.compatMode == "CSS1Compat") ? document.documentElement.clientWidth : document.body.clientWidth;
		},

		/**
		 * 获取窗口可见高度
		 * @return {int} 高度
		 */
		getClientHeight: function() {

			return (document.compatMode == "CSS1Compat") ? document.documentElement.clientHeight : document.body.clientHeight;
		},

		/**
		 * 获取窗口实际宽度
		 * @return {int} 宽度
		 */
		getScrollWidth: function() {

			return (document.compatMode == "CSS1Compat") ? document.documentElement.scrollWidth : document.body.scrollWidth;
		},

		/**
		 * 获取窗口实际高度
		 * @return {int} 高度
		 */
		getScrollHeight: function() {

			return (document.compatMode == "CSS1Compat") ? document.documentElement.scrollHeight : document.body.scrollHeight;
		},

		/**
		 * 是否为移动端游览器
		 * @return {Boolean} true/false
		 */
		isMobile: function() {
			var u = navigator.userAgent;

			//是否为移动终端
			return /AppleWebKit.*Mobile/i.test(u) || /MIDP|SymbianOS|NOKIA|SAMSUNG|LG|NEC|TCL|Alcatel|BIRD|DBTEL|Dopod|PHILIPS|HAIER|LENOVO|MOT-|Nokia|SonyEricsson|SIE-|Amoi|ZTE/.test(u);
		},

		/**
		 * html编码
		 * @param  {string} str 要编码的字符串
		 * @return {string}     编码后的字符串
		 */
		encodeHTML: function(str) {
			return str.replace(/ /g, "&nbsp;")
				.replace(/&/g, "&amp;")
				.replace(/>/g, "&gt;")
				.replace(/</g, "&lt;")
				.replace(/\"/g, "&quot;")
				.replace(/\'/g, "&#039;");
		},

		/**
		 * html解码
		 * @param  {string} str 要解码的字符串
		 * @return {string}     解码后的字符串
		 */
		decodeHTML: function(str) {
			return str.replace(/&nbsp;/g, " ")
				.replace(/&amp;/g, "&")
				.replace(/&gt;/g, ">")
				.replace(/&lt;/g, "<")
				.replace(/&quot;/g, '"')
				.replace(/&#039;/g, "'");
		}
	};

	_util.initNameSpace("CS", global);
	CS.util = _util;
})(window, jQuery);