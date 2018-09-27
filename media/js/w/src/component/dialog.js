/**
 * 书评的会话模块
 * @namespace CS.dialog
 * @author langtao
 * @date 2014-11-5
 */
;
(function($){
	//外部依赖
	var _util = CS.util,
		_uiBinder = CS.uiBinder,
		_mask = CS.mask;

	//对话框模板
	var _dialogTpl = [
		'<div attr="inner:popup;" class="popup" style="display:none;">',
			'<h3>提示</h3>',
			'<div class="popupTip">',
			'<p><%==content%></p>',
			'</div>',
			'<p attr="inner:buttonBox;" class="btn" style="display:none;"></p>',
		'</div>'
	].join('');

	//对话框组件的默认配置
	var _dialogDefaultConfig = {
		"title": '消息提示',
		"content": '',
		"leftMsg": '', //左侧文本
		"closeTime": 0, //自动关闭窗口的时间(单位：秒，默认0不关闭)
		"button": null, // 自定义按钮  [{"value": "确定", "focus": true, "callback" : function(){this.***; return false;}}, ...]
		"beforeClose": null //对话框关闭前执行的函数
	};

	var _contentIcon = {
		"error" : "alert_error",
		"success" : "alert_right",
		"info" : "alert_info"
	};

	var _remainCloseTimeTips = "$time$秒后窗口关闭", //剩余关闭时间的提示
		_remainLocationTimeTips = "$time$秒后页面跳转"; //剩余页面跳转时间的提示

	/**
	 * 对话框组件
	 * @param  {object} config 配置
	 * @return {object}        对话框组件的实例对象
	 */
	var _dialog = function(config){
		this.config = $.extend({}, _dialogDefaultConfig, config);

		this.nodes = null;
		this.mask = null; //遮罩组件的实例对象
		this._closeTimer = null;
		this._objInterval = null;
		this._remainTime = 0;

		if(!this.config.button){
			this.config.button = [];
		}

		this._create();
		return this;
	};

	_dialog.prototype = {
		/**
		 * 创建对话框
		 */
		_create : function(){
			var me = this;
				
			this.nodes = _uiBinder.appendHTML(document.body, _dialogTpl, {
				"content": this.config.content
			});

			this.addLeftMsg(this.config.leftMsg);
			this.addButton();

			this.mask = new _mask(this.nodes.popup);
			this.mask.open();
			this.closeByTime();
		},

		/**
		 * 关闭对话框
		 * @return {[type]} [description]
		 */
		close : function(){
			if(this.nodes && this.nodes.popup){
				if(this._closeTimer){
					clearTimeout(this._closeTimer);
				}
				if(this._objInterval){
					clearInterval(this._objInterval);
				}

				if(typeof this.config.beforeClose === "function"){
					this.config.beforeClose.call(this);
				}

				this.mask.close();
				$(this.nodes.popup).remove();
			}
		},

		/**
		 * 定时自动关闭窗口
		 */
		closeByTime : function(){
			if(this._closeTimer){
				clearTimeout(this._closeTimer);
			}
			if(this._objInterval){
				clearInterval(this._objInterval);
			}

			if(this.config.closeTime > 0){
				var me = this;

				this._remainTime = this.config.closeTime;

				//更新剩余秒数的提示
				this.updateLeftMsg(_remainCloseTimeTips, this._remainTime);
				this._objInterval = setInterval(function(){
					me._remainTime--;
					me.updateLeftMsg(_remainCloseTimeTips, me._remainTime);
				}, 1000);

				this._closeTimer = setTimeout(function(){
					me.close();
				}, this.config.closeTime * 1000);
			}
		},

		/**
		 * 更新左侧文本的内容
		 * @param  {string} msg        内容
		 * @param  {int} remainTime 剩余时间
		 */
		updateLeftMsg : function(msg, remainTime){
			msg = msg.replace("$time$", remainTime);

			if(this.nodes && this.nodes.buttonBox){
				var $leftMsg = $(this.nodes.buttonBox).find("span");

				//左侧文本容器已存在
				if($leftMsg.length > 0){
					$leftMsg.html(msg);
				}else{
					this.addLeftMsg(msg);
				}
			}
		},

		/**
		 * 添加左侧文本
		 */
		addLeftMsg : function(msg){
			if(msg){
				$(this.nodes.buttonBox).prepend('<span>'+ msg +'</span>').show();
			}
		},

		/**
		 * 添加按钮
		 */
		addButton : function(){
			if(this.nodes && this.nodes.buttonBox && this.config.button && this.config.button.length > 0){
				var me = this,
					lastIndex = this.config.button.length - 1;

				$.each(this.config.button, function(index, item){
					//创建按钮对象
					var $btn = $('<a href="javascript:;"></a>');

					$btn.text(item.value);
					if(item.focus){
						//选中效果
						$btn.addClass('blueBtn');
						if(index === lastIndex){
							$btn.css('marginRight', 0);
						}
					}

					$btn.click(function() {
						if (typeof item.callback !== 'function' || item.callback.call(me) !== false) {
							me.close();
						}
						return false;
					});

					$(me.nodes.buttonBox).append($btn);
				});

				$(this.nodes.buttonBox).show();
			}
		}
	};

	_util.initNameSpace("CS");
	CS.dialog = {
		/**
		 * 警告
		 * @param  {string} content 消息内容
		 */

		/**
		 * 弹出提示浮层
		 * @param  {string}   content  消息内容
		 * @param  {Function} callback 对话框关闭时的回调函数 (可选)
		 * @param  {string}   noticeType 消息类型(error/success/info) (可选, 默认:info)
		 * @return {object}            对话框组件的实例对象
		 */
		"alert": function(content, callback, noticeType) {
			if (!noticeType) {
				noticeType = "info";
			}

			return new _dialog({
				"title": '系统提示',
				"content": content,
				"button": [{
					"value": "确定",
					"focus": true
				}],
				"beforeClose": callback
			});
		},

		/**
		 * 弹出确认浮层
		 * @param  {string} content 消息内容
		 * @param  {Function} ok      确定按钮的回调函数 (可选)
		 * @param  {Function} cancel  取消按钮的回调函数 (可选)
		 */
		"confirm": function(content, ok, cancel) {
			return new _dialog({
				"title": '系统提示',
				"content": content,
				"button": [{
					"value": "确定",
					"focus": true,
					"callback": ok
				}, {
					"value": "取消",
					"callback": cancel
				}]
			});
		},

		/**
		 * 打开对话框
		 * @param  {[type]} config [description]
		 * @return {object}        对话框组件的实例对象
		 */
		"open": function(config) {
			return new _dialog(config);
		},

		/**
		 * 关闭对话框
		 * @param  {object} dialog 对话框组件的实例对象
		 */
		"close": function(dialog) {
			if (dialog && typeof dialog.close === "function") {
				dialog.close();
			}
		}
	};
})(jQuery);