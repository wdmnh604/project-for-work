/**
 * @Select.js
 * @author xunxuzhang
 * @version
 * Created: 15-06-18
 *
**/

define('Select',function(require, exports, module) {
    //require('plugin/jquery');
	
	/**
     * 模拟下拉框效果
	 * 只针对all浏览器进行处理
	 * 基于原生的<select>元素生成
	 *
     */
	
	/*
	 * 支持jQuery API调用和模块化调用两种
	 * @example
	 * $('select').selectMatch();
	 * or
	 * Select($('select'))
	*/
	
	$.fn.selectMatch = function(options) {
		// 常量变量
		var SELECT = 'select', SELECTED = 'selected', DISABLED = 'disabled',  ACTIVE = 'active', REVERSE = 'reverse';

		// 默认参数
		var defaults = {
			prefix: 'ui_',    // 一些UI样式类名的前缀
			trigger: ['change']     // 触发原始下拉框的事件，默认只触发change事件
		};
		// 参数合并
		var params = $.extend({}, defaults, options || {});
		
		// 通用前缀
		var PREFIX = params.prefix + SELECT, joiner = params.prefix.replace(/[a-z]/gi, '');
		
		// 根据下拉框获得相关数据的私有方法
		var _get = function(el) {
			var selectedIndex = 0, htmlOptions = '';
			
			// 遍历下拉框的options选项
			el.find('option').each(function(index) {
				var arrCl = [PREFIX + joiner + 'datalist'+ joiner +'li', this.className];
				
				if (this[SELECTED]) {
					selectedIndex = index;
					arrCl.push(SELECTED); 
				}
				if (this[DISABLED]) {
					arrCl.push(DISABLED); 
				}
				
				htmlOptions = htmlOptions + '<li class="'+ arrCl.join(' ') +'" data-index='+ index +'>'+ this.innerHTML +'</li>';
			});
			
			return {
				index: selectedIndex,
				html: htmlOptions
			}
		}

		return $(this).each(function(index, element) {
            var sel = $(this).hide().data(SELECT);
			if (!sel) {
				// 如果没有关联的模拟下拉元素生成
				// 创建新的模拟下拉元素
				sel = $('<div></div>').on('click', 'a', function() {
					if ($(element).prop(DISABLED)) return false;
					// 显示与隐藏
					sel.toggleClass(ACTIVE);
					// 边界判断
					if (sel.hasClass(ACTIVE)) {
						var ul = sel.find('ul'), 
						overflow = ul.offset().top + ul.outerHeight() > Math.max($(document.body).height(), $(window).height());
						sel[overflow? 'addClass': 'removeClass'](REVERSE);

						// 滚动与定位
						var arrData = sel.data('scrollTop'), selected = ul.find('.' + SELECTED);
						// 严格验证
						if (arrData && arrData[1] == selected.attr('data-index') && arrData[2] == selected.text()) {
							ul.scrollTop(arrData[0]);
							// 重置
							sel.removeData('scrollTop');
						}						
					} else {
						sel.removeClass(REVERSE);
					}
				}).on('click', 'li', function(event, istrigger) {
					var indexOption = $(this).attr('data-index'),
						scrollTop = $(this).parent().scrollTop();	
					// 下拉收起
					sel.removeClass(ACTIVE);
					// 存储可能的滚动定位需要的数据
					sel.data('scrollTop', [scrollTop, indexOption, $(this).text()]);
					// 修改下拉选中项
					$(element).find('option').eq(indexOption).get(0)[SELECTED] = true;
					// 更新下拉框
					$(element).selectMatch(params);
					// 回调处理
                    $.each(params.trigger, function(i, eventType) {
						$(element).trigger(eventType, [istrigger]);	
					});
				});
				// 存储对象
				$(this).data(SELECT, sel);
				// 载入元素
				$(this).after(sel);
				
				// 点击页面空白要隐藏
				$(document).mouseup(function(event) {
					var target = event.target;
					if (target && sel.hasClass(ACTIVE) && sel.get(0) !== target && sel.get(0).contains(target) == false) {
						sel.removeClass(ACTIVE).removeClass(REVERSE);
					}
				});
			}
			
			// 根据当前下拉元素，重新刷新
			// 0. 获得我们需要的一些数据
			var data = _get($(this)), option = $(this).find('option').eq(data.index);
			// 1. 与select元素匹配的类名, 以及宽度
			sel.attr('class', element.className + ' ' + PREFIX).width($(this).outerWidth());
			// 2. 全新的按钮元素
			var button = '<a href="javascript:" class="'+ PREFIX + joiner + 'button">'+ 
				'<span class="'+ PREFIX + joiner + 'text">' + option.html() + '</span>'+
				'<i class="'+ PREFIX + joiner + 'icon"></i></a>';
			// 3. 全新的列表
			var datalist = '<ul class="'+ PREFIX + joiner + 'datalist">'+ data.html +'</ul>';
			
			// 4. 刷新
			sel.html(button + datalist);
        });
	};
	
	
	
    module.exports = {
		init: function(el, options) {
			el = el || $('select');
			el.selectMatch(options);
		}
	};
});

/**
 * @Tab.js
 * @author xunxuzhang
 * @version
 * Created: 15-06-12
 */
define('Tab',function(require, exports, module) {
    //require('plugin/jquery');
	
	/**
     * 定制级极简的选项卡
	 * 选项卡效果本质上就是单选框切换效果
	 * 因此，状态类名使用.checked
     * @使用示例
     *  new Tab($('#container > a'), {
	 *	   callback: function() {}
	 *	});

	 * 或者包装器用法
	 * $('#container > a').tab({
	 *   callback: function() {}
	 * });
     */
	 
	var STATE = 'checked';
	
	// 根据属性获得对应的元素
	$.fn.extend({
		eqAttr: function(key) {
			key = key || "data-rel";
			// 获得属性对应的值
			var value = $(this).attr(key);
			if (!value) return $();
			// 当作id来处理
			var target = $("#" + value);
			if (target.length) return target;
			// 否则当作className处理
			return $("." + value);
		},
		tab: function(options) {
			if (!$(this).data('tab')) {
				$(this).data('tab', new Tab(options));
			}
		}
	});

	$.queryString = function(key, value, str) {
		// 有则替换，无则加勉
		var href = (str || location.href).split('#')[0], root = '', hash = location.hash;
		// 查询数组
		var arr_query = href.split('?'), arr_map = [];
		if (arr_query.length > 1) {		
			if (arr_query[1] != '') {
				arr_map = $.grep(arr_query[1].split('&'), function(query) {
					return query.split('=')[0] != key;
				});
			}
			root = arr_query[0] + '?' + arr_map.join('&') + '&';
			root = root.replace('?&', '?');
		} else {
			root = href + '?';
		}
		return root + key + '=' + value + hash;
	};
	
	
    var Tab = function(el, options) {
		// 选项卡元素，点击主体
		el = $(el);
		// 如果元素没有，打道回府
		if (el.length == 0) return;
		
		// 下面3语句参数获取
		options = options || {};
		var defaults = {
			eventType: 'click',
			index: 'auto',   // 'auto' 表示根据选项卡上的状态类名，如.checked获取index值
			history: true,   // 是否使用HTML5 history在URL上标记当前选项卡位置，for IE10+
			callback: $.noop
		};
		var params = $.extend({}, defaults, options);
		
		// 很重要的索引
		var indexTab = params.index;
		// 首先，获得索引值
		el.each(function(index) {
			if (typeof indexTab != 'number' && $(this).hasClass(STATE)) {
				indexTab = index;
			}
			$(this).data('index', index);
		});
		
		if (typeof indexTab != 'number') {
			indexTab = 0;
		}
		
		
		// 获得选项卡对应的面板元素
		// 两种情况
		// 1. 直接切换
		// 2. ajax并载入
		
		// 目前先第一种
		// 则直接就是页面元素
		// 事件gogogo
		el.on(params.eventType, function(event) {			
			if ($(this).hasClass(STATE)) {
				if (event.isTrigger) {
					// 让可能不匹配的content面板的checked状态同步
					// 一般出现在选项卡查询关键字变化后
					// 因为项目原因，内部面板默认display跟nav不匹配
					// 后注释是因为发现体验比较差
					/*el.each(function() {
						$(this).eqAttr().removeClass(STATE);
					});
					$(this).eqAttr().addClass(STATE);*/

					params.callback.call(this, this, $(), $(), $());
				}
				return;	
			}
			
			// 选项卡样式变变变
			// 类名变化
			var targetTab = $(this).addClass(STATE),
			// 要移除类名的选项卡
			resetTab = el.eq(indexTab).removeClass(STATE);
			
			// 面板的变化
			var targetPanel = targetTab.eqAttr().addClass(STATE),
			resetPanel = resetTab.eqAttr().removeClass(STATE);
			
			// 索引参数变化
			indexTab = targetTab.data('index');
			
			// 回调方法
			params.callback.call(this, targetTab, resetTab, targetPanel, resetPanel);
			
			if (/^(:?javas|#)/.test(this.getAttribute('href'))) {
				var rel = targetTab.attr('data-rel');
				if (params.history && history.replaceState) {
					history.replaceState(null, document.title, $.queryString('targetTab', rel));
				} else if (params.history) {
					location.hash = '#targetTab=' + rel;
				}
				event.preventDefault();
			}
		});
		
		// 默认就来一发
		$(function() {
			el.eq(indexTab).trigger(params.eventType);
		});
				
		// 暴露的属性或方法，供外部调用
		this.el = {
			tab: el	
		};
		this.params = params;
	};
	
	return Tab;
});

/*!art-template - Template Engine | http://aui.github.com/artTemplate/*/
!function(){function a(a){return a.replace(t,"").replace(u,",").replace(v,"").replace(w,"").replace(x,"").split(y)}function b(a){return"'"+a.replace(/('|\\)/g,"\\$1").replace(/\r/g,"\\r").replace(/\n/g,"\\n")+"'"}function c(c,d){function e(a){return m+=a.split(/\n/).length-1,k&&(a=a.replace(/\s+/g," ").replace(/<!--[\w\W]*?-->/g,"")),a&&(a=s[1]+b(a)+s[2]+"\n"),a}function f(b){var c=m;if(j?b=j(b,d):g&&(b=b.replace(/\n/g,function(){return m++,"$line="+m+";"})),0===b.indexOf("=")){var e=l&&!/^=[=#]/.test(b);if(b=b.replace(/^=[=#]?|[\s;]*$/g,""),e){var f=b.replace(/\s*\([^\)]+\)/,"");n[f]||/^(include|print)$/.test(f)||(b="$escape("+b+")")}else b="$string("+b+")";b=s[1]+b+s[2]}return g&&(b="$line="+c+";"+b),r(a(b),function(a){if(a&&!p[a]){var b;b="print"===a?u:"include"===a?v:n[a]?"$utils."+a:o[a]?"$helpers."+a:"$data."+a,w+=a+"="+b+",",p[a]=!0}}),b+"\n"}var g=d.debug,h=d.openTag,i=d.closeTag,j=d.parser,k=d.compress,l=d.escape,m=1,p={$data:1,$filename:1,$utils:1,$helpers:1,$out:1,$line:1},q="".trim,s=q?["$out='';","$out+=",";","$out"]:["$out=[];","$out.push(",");","$out.join('')"],t=q?"$out+=text;return $out;":"$out.push(text);",u="function(){var text=''.concat.apply('',arguments);"+t+"}",v="function(filename,data){data=data||$data;var text=$utils.$include(filename,data,$filename);"+t+"}",w="'use strict';var $utils=this,$helpers=$utils.$helpers,"+(g?"$line=0,":""),x=s[0],y="return new String("+s[3]+");";r(c.split(h),function(a){a=a.split(i);var b=a[0],c=a[1];1===a.length?x+=e(b):(x+=f(b),c&&(x+=e(c)))});var z=w+x+y;g&&(z="try{"+z+"}catch(e){throw {filename:$filename,name:'Render Error',message:e.message,line:$line,source:"+b(c)+".split(/\\n/)[$line-1].replace(/^\\s+/,'')};}");try{var A=new Function("$data","$filename",z);return A.prototype=n,A}catch(B){throw B.temp="function anonymous($data,$filename) {"+z+"}",B}}var d=function(a,b){return"string"==typeof b?q(b,{filename:a}):g(a,b)};d.version="3.0.0",d.config=function(a,b){e[a]=b};var e=d.defaults={openTag:"<%",closeTag:"%>",escape:!0,cache:!0,compress:!1,parser:null},f=d.cache={};d.render=function(a,b){return q(a,b)};var g=d.renderFile=function(a,b){var c=d.get(a)||p({filename:a,name:"Render Error",message:"Template not found"});return b?c(b):c};d.get=function(a){var b;if(f[a])b=f[a];else if("object"==typeof document){var c=document.getElementById(a);if(c){var d=(c.value||c.innerHTML).replace(/^\s*|\s*$/g,"");b=q(d,{filename:a})}}return b};var h=function(a,b){return"string"!=typeof a&&(b=typeof a,"number"===b?a+="":a="function"===b?h(a.call(a)):""),a},i={"<":"&#60;",">":"&#62;",'"':"&#34;","'":"&#39;","&":"&#38;"},j=function(a){return i[a]},k=function(a){return h(a).replace(/&(?![\w#]+;)|[<>"']/g,j)},l=Array.isArray||function(a){return"[object Array]"==={}.toString.call(a)},m=function(a,b){var c,d;if(l(a))for(c=0,d=a.length;d>c;c++)b.call(a,a[c],c,a);else for(c in a)b.call(a,a[c],c)},n=d.utils={$helpers:{},$include:g,$string:h,$escape:k,$each:m};d.helper=function(a,b){o[a]=b};var o=d.helpers=n.$helpers;d.onerror=function(a){var b="Template Error\n\n";for(var c in a)b+="<"+c+">\n"+a[c]+"\n\n";"object"==typeof console&&console.error(b)};var p=function(a){return d.onerror(a),function(){return"{Template Error}"}},q=d.compile=function(a,b){function d(c){try{return new i(c,h)+""}catch(d){return b.debug?p(d)():(b.debug=!0,q(a,b)(c))}}b=b||{};for(var g in e)void 0===b[g]&&(b[g]=e[g]);var h=b.filename;try{var i=c(a,b)}catch(j){return j.filename=h||"anonymous",j.name="Syntax Error",p(j)}return d.prototype=i.prototype,d.toString=function(){return i.toString()},h&&b.cache&&(f[h]=d),d},r=n.$each,s="break,case,catch,continue,debugger,default,delete,do,else,false,finally,for,function,if,in,instanceof,new,null,return,switch,this,throw,true,try,typeof,var,void,while,with,abstract,boolean,byte,char,class,const,double,enum,export,extends,final,float,goto,implements,import,int,interface,long,native,package,private,protected,public,short,static,super,synchronized,throws,transient,volatile,arguments,let,yield,undefined",t=/\/\*[\w\W]*?\*\/|\/\/[^\n]*\n|\/\/[^\n]*$|"(?:[^"\\]|\\[\w\W])*"|'(?:[^'\\]|\\[\w\W])*'|\s*\.\s*[$\w\.]+/g,u=/[^\w$]+/g,v=new RegExp(["\\b"+s.replace(/,/g,"\\b|\\b")+"\\b"].join("|"),"g"),w=/^\d[^,]*|,\d[^,]*/g,x=/^,+|,+$/g,y=/^$|,+/;e.openTag="{{",e.closeTag="}}";var z=function(a,b){var c=b.split(":"),d=c.shift(),e=c.join(":")||"";return e&&(e=", "+e),"$helpers."+d+"("+a+e+")"};e.parser=function(a){a=a.replace(/^\s/,"");var b=a.split(" "),c=b.shift(),e=b.join(" ");switch(c){case"if":a="if("+e+"){";break;case"else":b="if"===b.shift()?" if("+b.join(" ")+")":"",a="}else"+b+"{";break;case"/if":a="}";break;case"each":var f=b[0]||"$data",g=b[1]||"as",h=b[2]||"$value",i=b[3]||"$index",j=h+","+i;"as"!==g&&(f="[]"),a="$each("+f+",function("+j+"){";break;case"/each":a="});";break;case"echo":a="print("+e+");";break;case"print":case"include":a=c+"("+b.join(",")+");";break;default:if(/^\s*\|\s*[\w\$]/.test(e)){var k=!0;0===a.indexOf("#")&&(a=a.substr(1),k=!1);for(var l=0,m=a.split("|"),n=m.length,o=m[l++];n>l;l++)o=z(o,m[l]);a=(k?"=":"=#")+o}else a=d.helpers[c]?"=#"+c+"("+b.join(",")+");":"="+a}return a},"function"==typeof define?define('template',function(){return d}):"undefined"!=typeof exports?module.exports=d:this.template=d}();
/**
 * @fileOverview
 * @author zhangxinxu
 * @version 1
 * Created: 16-07-20 下午6:12
 * @description 继承和约束书写，与UI组件本身并无多大关系，而且是仿照LBF之前的命名和结构，
 */

define('Node',function(require, exports, module) {
    //require('plugin/jquery');

    if (!Object.create) {
        Object.create = function(o) {
            function F() {}
            F.prototype = o;
            return new F();
        };
    }

    var Node = function(obj) {
        if (obj && typeof obj == 'object') {
            for (var key in obj) {
                this[key] = obj[key];
            }
        }
        this.render();
    };

    Node.inherit = function(obj) {
        if (obj && typeof obj == 'object') {
            Node.prototype = Object.create(Node.prototype);

            for (var key in obj) {
                Node.prototype[key] = obj[key];
            }
        }
        return Node;
    },

    Node.prototype = {
        /**
         * Default UI proxy Element
         * @example
            container: 'body'
         */
        container: 'body',

        /**
         * Default UI events
         * @property events
         * @type Object
         * @protected
         * @example
            events: {
                'click #load-more': 'moreRankList',
                'click #btn-filter-search': 'btnFilterSearch',
                '#survey-btn"click': 'openSurvey',
                '#close-survey:click': function() {}
            }
         */
        events: {},

        /**
         * Nodes default UI element，this.$element
         * @property elements
         * @type Object
         * @protected
         * @example 
            elements: {
                'btnRankMore': '#btn-more',
                'rankListRow': '#rank-list-row'
            }
            elements: {
                btn: {
                    btn1: '#ccc',
                    btns: '.xxx'
                }
            }
         */
        elements: {},

        /**
         * Render node
         * Most node needs overwritten this method for own logic
         * @method render
         * @chainable
         */
        render: function () {
            // 事件处理以及元素暴露
            this.setElement();

            // 页面逻辑入口
            this.init();

            // 返回组件
            return this;
        },

        /**
         * 事件处理以及元素暴露
         * @method setElement
         * @chainable
         */
        setElement: function() {
            // 使用self压缩体积小
            var self = this;

            // 1. 全局委托元素
            var el = self.container;
            if (typeof self.container == 'string') {
                el = $(self.container)
            }

            // 1. 获取元素
            var elements = self.elements;
            // 深度递归
            var _set = function(host, obj) {
                $.each(obj, function(key, value) {
                    if (typeof value == 'string') {
                        // 字符串认为是选择器
                        host[key] = $(value);
                    } else if ($.isPlainObject(value)) {
                        // 如果是对象，则使用更深一层层级
                        if (!host[key] || typeof host[key] != 'object') {
                            host[key] = {};
                        }
                        _set(host[key], value);
                    }
                });
            };
            _set(self, elements);


            // 2. 事件委托处理
            var events = self.events;

            if (el.length) {
                $.each(events, function(eventType_selector, funName) {
                    var arr = [], eventType = '', selector = '';
                    // 支持
                    // "a.btn:click": fun1 这种书写
                    // 推荐第一种
                    var reg = /:[a-zA-Z]+$/;
                    if (reg.test(eventType_selector)) {
                        arr = eventType_selector.split(reg);
                        selector = $.trim(arr[0]);
                        eventType = eventType_selector.split(':').slice(-1).join('');
                    } else {
                        // 也支持
                        // 'click a.btn': fun1 这种书写
                        // 此方法为了兼容LBF中的习惯
                        arr = eventType_selector.split(/\s+?/);
                        eventType = arr[0],
                        selector = $.trim(eventType_selector.replace(eventType, '')) || '';
                    }

                    // 事件委托走起
                    el.delegate(selector, eventType, {
                        el: el,
                        selector: selector
                    }, function(events) {
                        if ($.isFunction(funName)) {
                            // 作为普通的jQuery事件处理
                            funName.call(this, events);
                        } else if ($.isFunction(self[funName])) {
                            events.el = $(this);
                            // 修改上下文
                            // 点击元素放在events对象中
                            self[funName].call(self, events);
                        }
                    });
                });
            }

            return this;
        },
        init: function() {}
    };

    module.exports = Node;
});

define('article_ana',['Node','template','common','Tab','Select'],function(require, exports, module) {
	var Node = require('Node'),
		template = require('template');

	var common = require('common');
	Tab = require('Tab');
	var Select = require('Select');
	// 由于每个下拉框元素本身就是独立的实例，因此，我们无需new构造
	Select.init();
	

	new Tab($('#articleTab a.ui_tab_tab').filter(function () {
		return /^(:?javas|#)/.test(this.getAttribute('href'));
	}), {
		callback: function () {
			var line;
			// IE10+
			if ($.isFunction(history.pushState)) {
				line = $(this).parent().find('i');
				if (!line.length) {
					line = $('<i></i>').addClass('ui_tab_line').prependTo($(this).parent());
				}
				line.css({
					display: 'block',
					width: $(this).width(),
					left: $(this).position().left
				});
			}
		}
	});
	
	new Tab($('#tabViewList > a.ui_tab_tab').filter(function () {
		return /^(:?javas|#)/.test(this.getAttribute('href'));
	}), {
		callback: function () {
			var line;
			// IE10+
			if ($.isFunction(history.pushState)) {
				line = $(this).parent().find('i');
				if (!line.length) {
					line = $('<i></i>').addClass('ui_tab_line').prependTo($(this).parent());
				}
				line.css({
					display: 'block',
					width: $(this).width(),
					left: $(this).position().left
				});
			}
		}
	});
	
	
	new Tab($('#dayQidian > a.ui_tab_tab').filter(function () {
		return /^(:?javas|#)/.test(this.getAttribute('href'));
	}), {
		callback: function () {
			var line;
			// IE10+
			if ($.isFunction(history.pushState)) {
				line = $(this).parent().find('i');
				if (!line.length) {
					line = $('<i></i>').addClass('ui_tab_line').prependTo($(this).parent());
				}
				line.css({
					display: 'block',
					width: $(this).width(),
					left: $(this).position().left
				});
			}
		}
	});
	new Tab($('#dayQQ > a.ui_tab_tab').filter(function () {
		return /^(:?javas|#)/.test(this.getAttribute('href'));
	}), {
		callback: function () {
			var line;
			// IE10+
			if ($.isFunction(history.pushState)) {
				line = $(this).parent().find('i');
				if (!line.length) {
					line = $('<i></i>').addClass('ui_tab_line').prependTo($(this).parent());
				}
				line.css({
					display: 'block',
					width: $(this).width(),
					left: $(this).position().left
				});
			}
		}
	});
	new Tab($('#dayAll > a.ui_tab_tab').filter(function () {
		return /^(:?javas|#)/.test(this.getAttribute('href'));
	}), {
		callback: function () {
			var line;
			// IE10+
			if ($.isFunction(history.pushState)) {
				line = $(this).parent().find('i');
				if (!line.length) {
					line = $('<i></i>').addClass('ui_tab_line').prependTo($(this).parent());
				}
				line.css({
					display: 'block',
					width: $(this).width(),
					left: $(this).position().left
				});
			}
		}
	}); 	
	module.exports = new Node({
	    // 一些全局委托的事件处理，默认在'body'上
	    events: {
		
	    },
		
		calHeight: function(){
			var column = $(".column");
			column.each(function(){
				number = $(this).text();
				if( number > 170 ) {
					number = 170;
					columnHeight = (number/150)*210;
					$(this).css("height",columnHeight);
				} else {
					
					columnHeight = (number/150)*210;
					$(this).css("height",columnHeight);
				}
			})
		},
		
	    init: function() {
	    	setTimeout(function() {
	    		common.tab();
				
	    	}, 17);
			this.calHeight();
			$(".day30 .data_v:odd").addClass("nonumber");
		}
		
	});

});


var ARTICLE = (function(doc) {
    // 显示错误提示信息的方法
    var fnTips = function(content) {
        if (typeof content != 'string') {
            return;
        }
        var div = doc.createElement('div');
        div.className = 'article-tips';
        div.innerHTML = content;
        div.addEventListener('touchend', function() {
            doc.body.removeChild(div);
        });
        doc.body.appendChild(div);

        setTimeout(function() {
            if (div && doc.body.contains(div)) {
                doc.body.removeChild(div);
            }
        }, 2000);
    };

    var localMclient = function() {
        // 走客户端请求
        if (!window.mclient) {
            // 此处用来本地模拟测试
            mclient = {
                req: function(url, callbackName) {
                    var xhr = new XMLHttpRequest();         
                    xhr.open('get', url);
                    xhr.onload = function() {
                        window[callbackName] && window[callbackName](JSON.parse(xhr.response));
                    }
                    xhr.send();
                },
                post: function(url, callbackName, forceReload, content) {
                    // ajax request
                    var xhr = new XMLHttpRequest();     
                    xhr.open('post', url);            
                    xhr.onload = function() {
                        window[callbackName] && window[callbackName](JSON.parse(xhr.response));                  
                    }            
                    xhr.send(content);
                }
            };
        }
        if (!window.getTransparentParam) {
            getTransparentParam = function() {
                return '';
            }
        }
    };

    var u = navigator.userAgent;
    var isAndroid = u.indexOf('Android') > -1 || u.indexOf('Adr') > -1; //android终端
    var isiOS = !!u.match(/\(i[^;]+;( U;)? CPU.+Mac OS X/); //ios终端


    // 极简模板
    String.prototype.miniTemp = function(obj) {
        return this.replace(/{{(\w+)}}/gi, function(matchs, $1) {    
            return typeof obj[$1] != 'undefined'? obj[$1]: '';
        });
    };

    var DISABLED = 'disabled';

    return {
        el: {},
        tips: function(content) {
            fnTips(content);
        },
        queryForm: function(form) {
            if (!form) {
                return '';
            }
            // 发送数据使用字符串
            var arrFormData = [], objFormData = {};

            [].slice.call(form.elements).forEach(function(ele) {
                // 元素类型和状态
                var type = ele.type, disabled = ele.disabled;

                // 元素的键值
                var name = ele.name, value = encodeURIComponent(ele.value || 'on');

                // name参数必须，元素非disabled态，一些类型忽略
                if (!name || disabled || !type || (/^reset|submit|image$/i.test(type)) || (/^checkbox|radio$/i.test(type) && !ele.checked)) {
                    return;
                }

                type = type.toLowerCase();

                if (type != 'select-multiple') {
                    if (objFormData[name]) {
                        objFormData[name].push(value);
                    } else {
                        objFormData[name] = [value];
                    }
                } else {
                    [].slice.call(ele.querySelectorAll('option')).forEach(function(option) {
                        var optionValue = encodeURIComponent(option.value || 'on');
                        if (option.selected) {
                            if (objFormData[name]) {
                                objFormData[name].push(optionValue);
                            } else {
                                objFormData[name] = [optionValue];
                            }
                        }
                    });
                }                
            });

            for (var key in objFormData) {
                arrFormData.push(key + '=' + objFormData[key].join());
            }

            return arrFormData.join('&');
        },
        format: function() {
            var container = document.getElementById('artCont'), 
                eleTempName = document.getElementById('artNameTemp'),
                eleTempCover = document.getElementById('artCoverTemp');
            if ([].forEach && container && eleTempName && eleTempCover) {
                var htmlTempName = eleTempName.innerHTML, htmlTempCover = eleTempCover.innerHTML;

                // 书名处理
                [].slice.call(container.querySelectorAll('.base64Name')).forEach(function(ele) {
                    var title = ele.getAttribute('data-title'), id = ele.getAttribute('data-id');
                    if (title && id) {
                        // 插入转换的HTML代码
                        ele.insertAdjacentHTML('beforebegin', htmlTempName.miniTemp({
                            id: id,
                            title: title
                        }));
                        ele.parentNode.removeChild(ele);
                    }
                });
                // 封面处理
                [].slice.call(container.querySelectorAll('.base64Cover')).forEach(function(ele) {
                    var title = ele.getAttribute('data-title'), author = ele.getAttribute('data-author'), id = ele.getAttribute('data-id'), url = ele.style.backgroundImage;
                    if (title && author && id) {
                        // 获取图片地址
                        url = url.replace(/url\(['"]?|['"]?\)/g, '');

                        // 插入转换的HTML代码
                        ele.insertAdjacentHTML('beforebegin', htmlTempCover.miniTemp({
                            id: id,
                            url: url,
                            title: title,
                            author: author
                        }));
                        ele.parentNode.removeChild(ele);
                    }
                });
            }
            container.style.visibility = 'visible';
        },
        likeOrNot: function() {
            var eleCheck = doc.getElementById('checkZan'), eleLikeForm = doc.getElementById('likeForm');
            if (eleCheck && eleLikeForm) {
                eleCheck.addEventListener('click', function() {
                    submit();
                });

                var self = this;

                var submit = function() {
                    if (!window.callbackLike) {
                        callbackLike = function() {};
                    }

                    var url = eleLikeForm.action, query = self.queryForm(eleLikeForm);
                    if (/\?/.test(url)) {
                        url = url + '&' + query;
                    } else {
                        url = url + '?' + query;
                    }

                    // if (!window.mclient) {
                    //     localMclient();
                    // }

                    // 调用客户端请求方法
                    if (isAndroid) {
                        mclient[eleLikeForm.method || 'get'](url, 'callbackLike', 1, query);
                    } else if (isiOS && Local)  {
                        Local.reqaObj(url, callbackLike);
                    }                       
                };

                eleLikeForm.addEventListener('submit', function(event) {
                    event.preventDefault();

                    submit();
                });
            }
        },
        submit: function(success) {
            var self = this;
            var eleForm = self.el.form, eleLabel = self.el.label, eleSubmit = self.el.submit;

            // 表单原生验证去除
            eleForm.setAttribute('novalidate', 'novalidate');
            // 表单提交
            eleForm.addEventListener('submit', function(event) {
                event.preventDefault();

                var eleInput = self.el.input;

                if (eleInput) {
                    var value = eleInput.value, trimValue = value.trim();
                    if (value != trimValue) {
                        eleArea.value = trimValue;
                    }
                }                

                // 请求开始
                eleSubmit.setAttribute(DISABLED, DISABLED);
                if (eleLabel) {
                    eleLabel.innerHTML = '提交中...';
                }

                if (!window.callbackSubmit) {
                    callbackSubmit = function(json) {
                        eleSubmit.removeAttribute(DISABLED);
                        if (eleLabel) {
                            eleLabel.innerHTML = '提交';
                        }
                        if (json.status == true) {
                            fnTips('提交成功');

                            // 一些重置
                            eleForm.reset();
                            eleSubmit.setAttribute(DISABLED, DISABLED);

                            if (typeof success == 'function') {
                                success(json);
                            }
                        } else {
                            fnTips('提交失败，请重试');
                        }
                    };
                }

                // 调用客户端请求方法
                var url = eleForm.action, query = self.queryForm(eleForm);
                if (/\?/.test(url)) {
                    url = url + '&' + query;
                } else {
                    url = url + '?' + query;
                }

                // if (!window.mclient) {
                //     localMclient();
                // }

                if (isAndroid) {
                    mclient[eleForm.method || 'get'](url, 'callbackSubmit', 1, query);
                } else if (isiOS && Local)  {
                    Local.reqaObj(url, window.callbackSubmit);
                } 
            });
        },

        disabled: function(inputid) {
            var self = this;

            var input = doc.getElementById(inputid);
            // 文本域和按钮禁用态交互
            if (input) {
                var isRequired = typeof input.getAttribute('required') == 'string', maxlength = input.getAttribute('maxlength');
                input.addEventListener('input', function() {
                    var value = this.value.trim(), eleSubmit = self.el.submit;

                    if ((isRequired && value == '') || (maxlength && value.length > maxlength)) {
                        eleSubmit.setAttribute(DISABLED, DISABLED);
                    } else {
                        eleSubmit.removeAttribute(DISABLED);
                    }
                });
                self.el.input = input;
            }
        },

        mclient: localMclient,
        init: function(formid, callback) {
            // 元素们
            var self = this;

            var form = doc.getElementById(formid);
            if (!form) {
                return;
            }
            var submit = form.querySelector('input[type="submit"]'), label = form.querySelector('label[for="'+ submit.id +'"]');
            if (submit && label) {
                self.el.form = form;
                self.el.submit = submit;
                self.el.label = label;
                self.submit(callback);
            }
        }
    };
})(document);
