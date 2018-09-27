/**
 * 翻页组件
 *
 * @author langtao
 * @param {int} pageCount 总页数
 * @param {Object} opts 可选配置
 * @return {Object} jQuery Object
 */
(function($) {
	$.fn.pagination = function(pageCount, opts) {
		opts = $.extend({
			showPageInput: true, //是否显示页面输入框和go按钮
			jumpBtnText : '跳转', //跳转按钮的文字
			callback: function() {
				return false;
			}
		}, opts || {});

		return this.each(function() {
			var currentPage = 1,
				parentNode = this,
				linkTo = 'javascript:;';

			/**
			 * 分页链接事件处理函数
			 * @param {int} pageIndex 页码
			 * @param {object} evt 事件对象
			 */
			function pageLinkHandler(pageIndex, evt) {
				currentPage = pageIndex;
				render();

				var continuePropagation = opts.callback(pageIndex, parentNode);

				if (!continuePropagation && evt) {
					if (evt.stopPropagation) {
						evt.stopPropagation();
					} else {
						evt.cancelBubble = true;
					}
				}

				return continuePropagation;
			}

			/**
			 * 点击处理
			 * @param  {int} pageIndex 页码
			 * @return {function}         点击事件处理函数
			 */
			function getClickHandler(pageIndex) {
				return function(evt) {
					return pageLinkHandler(pageIndex, evt);
				};
			}

			/**
			 * 获取链接元素
			 * @param  {int} pageIndex 页码
			 * @param  {object} config    可选配置
			 * @return {object}           链接元素的jquery对象
			 */
			function getLinkItem(pageIndex, config) {
				pageIndex = pageIndex < 1 ? 1 : pageIndex;
				pageIndex = pageIndex < pageCount ? pageIndex : pageCount;

				config = $.extend({
						'text': pageIndex,
						'css': ''
					},
					config || {}
				);

				var $link = $('<a href="'+ linkTo +'"><cite class="icon"></cite></a>');

				$link.on('click', getClickHandler(pageIndex));
				
				if (config.css) {
					$link.addClass(config.css);
				}

				return $link;
			}

			/**
			 * 渲染
			 */
			function render() {
				if(!pageCount || pageCount === 1){
					$(parentNode).empty();
					return;
				}
				
				var frag = document.createDocumentFragment(),
					$frag = $(frag);
					
				//上一页
				if(currentPage - 1 > 0){
					var $prevPageLink = getLinkItem(currentPage - 1, {
						'css': 'prevBtn'
					});
					$frag.append($prevPageLink);
				}
				
				//当前页/总页数
				$frag.append('<span>'+ currentPage +'/'+ pageCount +'</span>');
				
				//下一页
				if(currentPage + 1 <= pageCount){
					var $nextPageLink = getLinkItem(currentPage + 1, {
						'css': 'nextBtn'
					});
					$frag.append($nextPageLink);
				}
				
				//生成页码输入框和go按钮
				if (opts.showPageInput) {
					var $pageInput = $('<input type="text" />');
					$frag.append($pageInput);

					var $pageBtn = $('<a class="jump" href="'+ linkTo +'">'+ opts.jumpBtnText +'</a>');
					$pageBtn.on('click', function(evt) {
						var pageIndex = $pageInput.val();

						//是正整数
						if (/^[1-9]+.?[0-9]*$/.test(pageIndex)) {
							pageIndex = parseInt(pageIndex, 10);

							if (pageIndex > pageCount) {
								pageIndex = pageCount;
							}

							pageLinkHandler(pageIndex, evt);
						}

						return false;
					});

					$pageInput.on('keyup', function(event) {
						//回车
						if (event.keyCode === 13) {
							$pageBtn.trigger('click');
						}
					});

					$frag.append($pageBtn);
				}

				var $container = $('<p></p>');
				$container.append($frag);
				$(parentNode).empty().append($container);
			}

			render();
		});
	};
})(jQuery);