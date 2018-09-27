/**
 * UI绑定组件
 * @namespace CS.uiBinder
 * @author  langtao
 * @version 2.0
 * @update 2014-4-22
 */
;
(function($){
	var _left_separator = '<%',
		_right_separator = '%>';

	/**
	 * 编译模板
	 * @param  {string} tpl  模板
	 * @param  {object} data 数据
	 * @return {[type]}      [description]
	 */
	function _compileTpl(tpl, data){
		if(typeof tpl !== 'string' || tpl.length === 0 || typeof data === 'undefined'){
			return '';
		}
		
		//取<%左，<%中间%>， %>右的内容，分割成数组
		tpl = tpl.replace(/\s*<!\[CDATA\[\s*|\s*\]\]>\s*|[\r\n\t]/g, '');

		var lineTag = '\n',
			logic_tag = '\x1b', //逻辑语句标志 16进制的<
			isNewEngine = ''.trim,
			arrOut = isNewEngine ? ["$out='';", "$out+=", ";", "$out;"] : ["$out=[];", "$out.push(", ");", "$out.join('');"],
			arrTpl = tpl.split(_left_separator).join(_right_separator + logic_tag).split(_right_separator),
			strCode = 'var ',
			fn = null;
		
		//定义helper函数
		$.each(_helper, function(fnName, fn){
			strCode += fnName +'=$helper.'+ fnName + ','+ lineTag;
		});
		
		strCode += arrOut[0] + lineTag;
		strCode += 'with($data){'+ lineTag;

		for(var i = 0, len = arrTpl.length; i < len; i++){
            var item = arrTpl[i],
				char0 = item.charAt(0);
			
            //纯html
            if(char0 !== logic_tag){
				if(char0.length){
					strCode += arrOut[1] +'"'+ item.replace(/(\\|["'])/g, '\\$1') +'"'+ arrOut[2] + lineTag;
				}
            }else{ //逻辑语句
				if (item.charAt(1) === '=') { //赋值语句
					if (item.charAt(2) === '=') { //无需转义 <%== param %>
						strCode += arrOut[1] + item.substr(3) + arrOut[2] + lineTag;
					} else { //需要转义 <%= param %>
						strCode += arrOut[1] + '$escapeHTML(' + item.substr(2) + ')' + arrOut[2] + lineTag;
					}
				} else { //js语句
					strCode += _parseSyntax(item.substr(1)) + lineTag;
				}
            }
        }

        strCode += '}'+ lineTag +'return '+ arrOut[3];
		
		fn = new Function('$data', '$helper', strCode);

		return fn(data, _helper);
	}
	
	/**
	 * 语法转换
	 * @param  {string} tpl  code 逻辑语句，即<% **, =**, ==** %>
	 * @return {string}      经过语法转换后的逻辑语句
	 */
	function _parseSyntax(code, arrOut){
		//去除开始部分的空格
        code = code.replace(/^\s+/, '');

        var splitCode = code.split(' '),
			operator = splitCode.shift(),
			args = splitCode.join(' ');
			
        switch (operator) {
            case 'if':
                code = 'if(' + args + '){';
                break;
            case 'else':
				var str_if = '';
				
				//else if
                if (splitCode.shift() === 'if') {
                    str_if = ' if(' + splitCode.join(' ') + ')';
                }

                code = '}else' + str_if + '{';
                break;
            case '/if':
                code = '}';
                break;
            case 'each':
                var list = splitCode[0] || '$list',
					as     = splitCode[1] || 'as',
					val    = splitCode[2] || '$value',
					index  = splitCode[3] || '$index';
                
                var param   = val + ',' + index;
                
				//处理用户输入有误的情况
                if (as !== 'as') {
                    list = '[]';
                }
                
                code =  '$each(' + list + ',function(' + param + '){';
                break;
            case '/each':
                code = '});';
                break;
            default:
                break;
        }
		
        return code;
	}
	
	var _helper = {
		$each : function (data, callback) {
			//是数组
			if (Object.prototype.toString.call(data) === "[object Array]") {
				for (var i = 0, len = data.length; i < len; i++) {
					callback.call(data, data[i], i, data);
				}
			} else {
				for (var j in data) {
					callback.call(data, data[j], j);
				}
			}
		},
		
		/**
		 * 对html进行编码
		 * @param  {string} str 字符串
		 * @return {string}     编码后的字符串
		 */
		$escapeHTML : function(str){
			if(typeof str !== 'string'){
				return str;
			}

			var escapeHTMLRules = {
					"&": "&#38;",
					"<": "&#60;",
					">": "&#62;",
					'"': '&#34;',
					"'": '&#39;',
					"/": '&#47;'
				},
				matchHTML = /&(?!#?\w+;)|<|>|"|'|\//g;

			return str.replace(matchHTML, function(m) {
				return escapeHTMLRules[m] || m;
			});
		}
	};
	
	/**
	 * 绑定标准事件
	 * @param  {object} el     元素对象
	 * @param  {string} event_name    事件名称
	 * @param  {string} action_name 事件绑定的函数名称
	 * @param  {object} events 事件绑定的函数名称和函数对应列表
	 * @param  {object} nodes  元素集合
	 * @param  {object} scope 事件函数中的作用域对象 (可选，默认：window)
	 */
	function _bindEvents(el, event_name, action_name, events, nodes, scope) {
		event_name = event_name.toLowerCase();
		scope = scope || window;

		//支持的事件列表
		var arr_event = [
			'blur', 'focus', 'focusin', 'focusout', 'load', 'resize', 'scroll',
			'unload', 'click','dblclick', 'mousedown', 'mouseup', 'mousemove',
			'mouseover', 'mouseout', 'mouseenter', 'mouseleave', 'change', 'select',
			'submit', 'keydown', 'keypress', 'keyup', 'error', 'contextmenu'
		];

		//不在事件列表中
		if ($.inArray(event_name, arr_event) == -1) {
			return;
		}
		
		if (events && typeof events[action_name] === "function") {
			//绑定事件
			$(el).on(event_name, function(e) {
				return !!events[action_name].call(scope, e, el, nodes);
			});
		}
	}

	/**
	 * 获取元素对象
	 * @param {string/element object} root_id 页面元素id或对象
	 * @return {object}         元素对象
	 */
	function _getRoot(root_id){
		if(!root_id){
			return null;
		}

		return typeof root_id === 'string' ? document.getElementById(root_id) : root_id;
	}

	/**
	 * 绑定数据
	 * @param  {string} tpl  模板
	 * @param  {object} data 数据集合
	 * @return {string}      绑定了数据的模板
	 */
	function bindData(tpl, data){

		return _compileTpl(tpl, data);
	}

	/**
	 * 绑定事件
	 * @param {string/element object} root_id 页面元素id或对象
	 * @param  {object} events 要绑定的事件列表
	 * @param  {object} scope 事件函数中的作用域对象 (可选，默认：window)
	 * @return {object}       根元素及旗下的dom元素集合
	 */
	function bindEvent(root_id, events, scope){
		var root = _getRoot(root_id);
		if(!root){
			return null;
		}

		var node = {'root': root},
			attr_nodes = $(root).find("[attr]").toArray(), //找到attr属性的元素集合
			el = null,
			str_attr = '',
			arr_attr = null,
			t = null,
			arr_bind = [];
		
		//处理具有attr属性的元素
		for(var i=0, len = attr_nodes.length; i < len; i++){
			el = attr_nodes[i];
			str_attr = $(el).attr("attr");
			if (typeof str_attr != "string" || !str_attr) {
				continue;
			}

			arr_attr = str_attr.split(';');

			for (var j = 0, count = arr_attr.length; j < count; j++) {
				t = arr_attr[j].split(":");
				if (1 == t.length && t[0]) {
					node[t[0]] = el; //存放元素对象
				}
				if (2 == t.length) {
					if ("inner" == t[0]) {
						node[t[1]] = el; //存放元素对象
					} else {
						//处理events和customizedEvents
						arr_bind.push({
							'el': el,
							'event': t[0], //事件名称
							'action': t[1] //事件对应的处理函数名称
						});
					}
				}
			}
		}

		if(events){
			for (var k = 0, length = arr_bind.length; k < length; k++) {
				//绑定事件
				_bindEvents(arr_bind[k].el, arr_bind[k]['event'], arr_bind[k]['action'], events, node, scope);
			}
		}

		return node;
	}

	/**
	 * 添加模板到页面的元素对象
	 * @param {string/element object} root_id 页面元素id或对象
	 * @param  {string} tpl   html模板
	 * @param  {object} data  要绑定的数据
	 * @param  {object} events 要绑定的事件
	 * @param  {object} scope 事件函数中的作用域对象 (可选，默认：window)
	 * @return {object}       根元素及旗下的dom元素集合
	 */
	function appendHTML(root_id, tpl, data, events, scope){
		var root = _getRoot(root_id);
		if(!root){
			return null;
		}

		data = data || {};

		var node = null;

		if(typeof tpl === 'string' && tpl.length){
			//绑定数据
			tpl = bindData(tpl, data);
            //添加
			$(root).append(tpl);
			//绑定事件，抓取元素对象
			node = bindEvent(root, events, scope);
		}

		return node;
	}

	CS.util.initNameSpace("CS");
	CS.uiBinder = {
		'bindData' : bindData,
		'bindEvent' : bindEvent,
		'appendHTML' : appendHTML
	};
})(jQuery);