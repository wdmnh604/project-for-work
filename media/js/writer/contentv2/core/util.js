/**
 * 工具类
 * @namespace CS.util
 * @author  langtao
 * @update 2015-9-7
 */
;
(function(global, $) {
	//用户的语言环境
	var _lang = {
		'zhs': 'zhs', //简体中文
		'zht': 'zht' //繁体中文
	};

	/**
	 * 根据用户语言转换一个对象中的字符串(深度遍历)
	 * @param  {object} obj 需要转换的对象
	 * @param  {string} lang 需要转换成什么语言
	 * @return {object}     转换后的对象
	 */
	function _convertObjectByLang(obj, lang) {
		if (!obj || typeof obj !== 'object') {
			return obj;
		}

		lang = lang || _lang.zhs; //默认：简体中文

		var ret = $.isArray(obj) ? [] : {},
			item = null;

		for (var prop in obj) {
			item = obj[prop];

			if (obj.hasOwnProperty(prop)) {
				if (typeof item === 'string') {
					//简体转繁体
					if (lang === _lang.zht) {
						ret[prop] = _util.sim2tra(item);
					} else if (lang === _lang.zhs) { //繁体转简体
						ret[prop] = cnConvert.tra2sim(item);
					}
				} else if (typeof item === "object") {
					ret[prop] = _convertObjectByLang(item, lang);
				} else {
					ret[prop] = item;
				}
			}
		}

		return ret;
	}

	/**
	 * 打开加载提示
	 * @param {bool} isShowLoading 是否显示加载提示
	 */
	function _openLoadingTip(isShowLoading){
		if(isShowLoading){
			$('#requestLoadingTip').show();
		}
	}

	/**
	 * 关闭加载提示
	 * @param {bool} isShowLoading 是否显示加载提示
	 */
	function _closeLoadingTip(isShowLoading){
		if(isShowLoading){
			$('#requestLoadingTip').hide();
		}
	}

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
			return !!$.cookie('skey') && !! $.cookie('uin');
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
		 * 节流阀函数
		 * @param  {Function} fn      执行的函数
		 * @param  {object}   context 对象上下文this
		 */
		throttle: function(fn, context) {
			if (typeof fn !== 'function') {
				return;
			}

			if (fn.timeoutId) {
				clearTimeout(fn.timeoutId);
			}

			fn.timeoutId = setTimeout(function() {
				fn.call(context);
			}, 100);
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
		 * 获取字符串长度
		 * @param  {string} str 字符串
		 * @return {int}     字符串长度
		 */
		strlen: function(str) {
			return (_util.isIE() && str.indexOf('\n') != -1) ? str.replace(/\r?\n/g, '_').length : str.length;
		},

		/**
		 * 获取字符串长度（支持中文）
		 * @param  {string} str 字符串
		 * @return {int}     字符串长度
		 */
		mb_strlen: function(str) {
			var len = 0;
			for (var i = 0; i < str.length; i++) {
				len += str.charCodeAt(i) < 0 || str.charCodeAt(i) > 255 ? 3 : 1;
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
		 * 获取用户的语言环境
		 * @return {string} zhs (简体) or zht (繁体)
		 */
		getUserLang: function() {
			return typeof userLang === 'undefined' ? _lang.zhs : userLang;
		},

		/**
		 * 简体转繁体
		 * @param  {string/array/json} obj 字符串/数组/json
		 * @return {string}     转换后的字符串
		 */
		sim2tra: function(obj) {
			//繁体中文环境 
			if (typeof cnConvert !== 'undefined' && this.getUserLang() === _lang.zht) {
				//简体转繁体
				if (typeof obj === 'string') {
					return cnConvert.sim2tra(obj);
				} else if (typeof obj === 'object') {
					return _convertObjectByLang(obj, _lang.zht);
				}
			}

			return obj;
		},

		/**
		 * 繁体转简体
		 * @param  {string/array/json} obj 字符串/数组/json
		 * @return {string}     转换后的字符串
		 */
		tra2sim: function(obj) {
			//繁体中文环境
			if (typeof cnConvert !== 'undefined' && this.getUserLang() === _lang.zht) {
				//繁体转简体
				if (typeof obj === 'string') {
					return cnConvert.tra2sim(obj);
				} else if (typeof obj === 'object') {
					return _convertObjectByLang(obj, _lang.zhs);
				}
			}

			return obj;
		},

		/**
		 * ajax请求
		 * @return {jquery object} jquery的ajax对象
		 */
		request: function(option) {
			//未设置过超时时间
			if (!('timeout' in option)) {
				option.timeout = 30000; //超时时间：默认为30秒
			}

			if(!('isShowLoading' in option)){
				option.isShowLoading = true; //是否显示加载效果，默认显示
			}

			//post请求，统一添加token参数，以防CSRF
			if('type' in option && option.type.toLowerCase() === 'post'){
				var dataValue = $.cookie('pubtoken');

				if(dataValue){
					var dataKey = '_token';
					
					//传参配置
					if(!option.data){
						option.data = {};
					}
					if(!option.data[dataKey]){
						option.data[dataKey] = dataValue;
					}
				}
			}

			_openLoadingTip(option.isShowLoading);

			var me = this,
				successFn = option.success,
				errorFn = option.error;
			
			//请求成功
			option.success = function(data, textStatus, jqXHR) {
				_closeLoadingTip(option.isShowLoading);

				if (typeof successFn === 'function') {
					//繁体中文环境，需要简体转繁体
					if (me.getUserLang() === _lang.zht) {
						if (typeof data === 'string') {
							data = me.sim2tra(data);
						} else if (typeof data === "object") {
							data = _convertObjectByLang(data, _lang.zht);
						}
					}

					successFn(data, textStatus, jqXHR);
				}
			};

			//请求失败
			option.error = function(objXMLHttpRequest, textStatus, errorThrown){
				_closeLoadingTip(option.isShowLoading);

				if (typeof errorFn === 'function') {
					errorFn(objXMLHttpRequest, textStatus, errorThrown);
				}
			};

			return $.ajax(option);
		},

		/**
		 * 动态提交表单
		 * @param  {object} $form  表单元素的jquery对象
		 * @param  {object} option 配置
		 */
		ajaxSubmitForm : function($form, option){
			if(!$form || $form.length === 0){
				return;
			}
			option = $.extend({
				'type': "POST",
				'data' : {},
				'dataType': 'json',
				'forceSync' : false,
				'timeout': 30000, //过期时间：30秒
				'isShowLoading': true, //是否显示加载效果
				'success': function(){},
				'error': function(){},
				'complete': function(){}
			}, option);

			_openLoadingTip(option.isShowLoading);

			var successFn = option.success,
				errorFn = option.error;

			//请求成功
			option.success = function(data, textStatus, jqXHR) {
				_closeLoadingTip(option.isShowLoading);

				if (typeof successFn === 'function') {
					successFn(data, textStatus, jqXHR);
				}
			};

			//请求失败
			option.error = function(objXMLHttpRequest, textStatus, errorThrown){
				_closeLoadingTip(option.isShowLoading);

				if (typeof errorFn === 'function') {
					errorFn(objXMLHttpRequest, textStatus, errorThrown);
				}
			};
			
			$form.ajaxSubmit(option);
		},

		/**
		 * 更新按钮文字
		 * @param  {object} $btn 按钮元素的jquery对象
		 * @param  {string} type 类型（default/loading）
		 */
		updateBtnText : function($btn, type){
			if(!$btn || $btn.length === 0){
				return;
			}

			//默认
			if(type === 'default'){
				$btn.removeAttr('data-isloading');
				$btn.html($btn.attr('data-default-text') || '确定');
			}else if(type === 'loading'){ //ajax提交中
				//标记正在提交中
				$btn.attr('data-isloading', '1');
				//保存默认按钮文字
				$btn.attr('data-default-text', $btn.text());
				$btn.html('<img src="'+ CS.config.env.imgUrl +'btn_load.gif" width="24" height="24">');
			}
		},

		/**
		 * 检测按钮是否在提交状态
		 * @param  {object} $btn 按钮元素的jquery对象
		 * @return {bool} 是否在提交状态
		 */
		checkBtnIsLoading : function($btn){
			return $btn && $btn.length > 0 && $btn.attr('data-isloading') === '1';
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
			var pattern = /^[1-9][0-9]{4,9}$/;
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
		 * 验证是否为链接地址
		 * @param  {[type]}  value 输入值
		 * @return {Boolean}            是否为链接地址
		 */
		isUrl: function(value) {
			var strRegex = "^((https|http|ftp|rtsp|mms)?://)"
				+ "?(([0-9a-z_!~*'().&=+$%-]+: )?[0-9a-z_!~*'().&=+$%-]+@)?" //ftp的user@
				+ "(([0-9]{1,3}\.){3}[0-9]{1,3}" // IP形式的URL- 199.194.52.184
				+ "|" // 允许IP和DOMAIN（域名）
				+ "([0-9a-z_!~*'()-]+\.)*" // 域名- www.
				+ "([0-9a-z][0-9a-z-]{0,61})?[0-9a-z]\." // 二级域名
				+ "[a-z]{2,6})" // first level domain- .com or .museum
				+ "(:[0-9]{1,4})?" // 端口- :80
				+ "((/?)|" // a slash isn't required if there is no file name
				+ "(/[0-9a-z_!~*'().;?:@&=+$,%#-]+)+/?)$";

			var re = new RegExp(strRegex);
			if (re.test(value)) {
				return (true);
			} else {
				return (false);
			}
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
         * 是否为ie游览器
         * @return {Boolean} 判断结果
         */
        isIE: function(){
             return /msie/.test(navigator.userAgent.toLowerCase());
        },

		/**
		 * 游览器是否为ie6
		 */
		isIE6: function() {
			return !!window.ActiveXObject && !window.XMLHttpRequest;
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
		},
		/**
		 * [isAdult 是否成年]
		 * @param  {[type]}  birthday [description]
		 * @return {Boolean}          [description]
		 */
		isAdult: function(birthday)
		{
		    if(!birthday)
		    {
		        return false;
		    }
		    var arrBirthday=birthday.split('-');
		    var year=arrBirthday[0];
		    var month=arrBirthday[1];
		    var day=arrBirthday[2];
		    if(!year || !month || !day)
		    {
		    	return false;
		    }
		    var d=new Date();

		    var cyear=d.getFullYear();
		    var cmonth=d.getMonth()+1;
		    var cday=d.getDate();
	
		    if(parseInt(cday)<parseInt(day))
		    {
		        cmonth-=1;
		    }
		    if(parseInt(cmonth)<parseInt(month))
		    {
		        cyear-=1;
		    }
		    if(parseInt(cyear)-parseInt(year) < 18)
		    {
		        return false;
		    }
		    return true;
		}
	};

	_util.initNameSpace("CS", global);
	CS.util = _util;
})(window, jQuery);