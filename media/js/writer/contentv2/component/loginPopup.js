/**
 * 登录浮层
 * @namespace CS.loginPopup
 * @author langtao
 * @update 2015-12-16
 */
(function($) {
	//外部依赖
	var _util = CS.util,
		_mask = CS.mask; //遮罩组件

	var _params = {}, //参数集合
		_nodes = {}, //元素对象集合
		_maskObj = null; //遮罩组件的实例集合

	//登录iframe地址
	var _loginIframeUrls = {
		'qd': '', //起点
		'cs': '' //创世
	};

	/**
	 * 初始化
	 * @param {string} qdLoginUrl 起点登录地址
	 * @param {string} csLoginUrl 创世登录地址
	 */
	function init(qdLoginUrl, csLoginUrl) {
		_loginIframeUrls.qd = qdLoginUrl || '';
		_loginIframeUrls.cs = csLoginUrl || '';

		_nodes.$loginPopup = $('#loginPopup');
		_nodes.$loginIframe = $('#loginIframe');

		_listenMsgFromLoginIframe();
	}

	/**
	 * 打开登录浮层
	 * @param {string} type 登录地址类型(qd:起点， cs：创世)
	 * @param {object} options 可选配置 {width: 690, height:300}
	 */
	function open(type, options) {
		if (!_maskObj) {
			_maskObj = new _mask(_nodes.$loginPopup);
		}

		if (_maskObj) {
			var url = _loginIframeUrls[type];
			if (!url) {
				return;
			}

			_nodes.$loginIframe.attr('src', url);

			if(options){
				if(options.width){
					_nodes.$loginPopup.add(_nodes.$loginIframe).css('width', options.width +'px');
				}
				if(options.height){
					_nodes.$loginPopup.add(_nodes.$loginIframe).css('height', options.height +'px');
				}
			}
			
			_maskObj.open();
		}
	}

	/**
	 * 关闭登录浮层
	 */
	function close() {
		if (_maskObj) {
			_maskObj.close();
		}
	}

	/**
	 * 调整大小
	 * @param  {int} width  宽度
	 * @param  {int} height 高度
	 */
	function resize(width, height) {
		if (_nodes.$loginPopup.length) {
			_nodes.$loginPopup.css({
				'visibility': 'hidden',
				'width': width + 'px',
				'height': height + 'px'
			});

			//先隐藏，再显示，这样可以避免滚动条的出现
			_nodes.$loginPopup.css('visibility', 'visible');
		}

		if (_nodes.$loginIframe.length) {
			_nodes.$loginIframe.css({
				'width': width + 'px',
				'height': height + 'px'
			});
		}

		if (_maskObj) {
			_maskObj.center();
		}
	}

	/**
	 * 监听动作处理器
	 * @param  {string} data 数据
	 */
	function _actionHandler(data) {
		if (!data) {
			return;
		}

		//将数据转成json格式
		var json = $.parseJSON(data);

		//动作类型
		switch (json.action) {
			case 'close': //关闭
				close();
				break;
			case 'resize': //调整大小
				resize(json.width, json.height);
				break;
			default:
				break;
		}
	}

	/**
	 * 从qq登录iframe页面，监听消息
	 */
	function _listenMsgFromLoginIframe() {
		//html5跨域
		if (typeof window.postMessage !== 'undefined') {
			window.onmessage = function(event) {
				var msg = event || window.event;

				_actionHandler(msg.data);
			};
		} else {
			//不支持postMessage的IE6，7 hack方法
			window.navigator.ptlogin_callback = function(msg) {
				_actionHandler(msg);
			};
		}
	}

	_util.initNameSpace("CS");
	CS.loginPopup = {
		'init': init,
		'open': open,
		'close': close,
		'resize': resize
	};
})(jQuery);