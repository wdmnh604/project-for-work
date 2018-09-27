/*
 * jQuery Date Selector Plugin
 * 日期联动选择插件
 * update: 2015-12-21 langtao 默认日期不传，就默认选中“请选择”
 * Demo:
		var myDate = new Date();
			$("#calendar").dateSelector({
			ctlYearId: 'idYear', //年控件id
			ctlMonthId: 'idMonth', //月控件id
			ctlDayId: 'idDay', //日控件id
			defYear: myDate.getFullYear(), //默认年(不传就默认选中“请选择”)
			defMonth: (myDate.getMonth()+1), //默认月(不传就默认选中“请选择”)
			defDay: myDate.getDate(), //默认日(不传就默认选中“请选择”)
			minYear: 1800, //最小年|默认为1882年
			maxYear: (myDate.getFullYear()+1) //最大年|默认为本年
		});
 
	HTML:
		<div id="calendar">
			<SELECT id=idYear></SELECT>年 <SELECT id=idMonth></SELECT>月 <SELECT id=idDay></SELECT>日
		</div>
 */
;
(function($) {
	/**
	 * SELECT控件设置函数
	 * @param {object} oSelect 日期选择器
	 * @param {[type]} iStart  开始索引
	 * @param {int} iLength 日期长度
	 * @param {int} iIndex  选中的索引 (0: 选中请选择项)
	 */
	function setSelectControl(oSelect, iStart, iLength, iIndex) {
		oSelect.empty();
		//请选择的选项
		var $emptyOption = $('<option value="">请选择</option>');
		if(iIndex === 0){
			$emptyOption.prop('selected', 'selected');
		}
		oSelect.append($emptyOption);

		for (var i = 0; i < iLength; i++) {
			if (iIndex !== 0 && (parseInt(iStart, 10) + i) === iIndex) {
				oSelect.append("<option selected='selected' value='" + (parseInt(iStart, 10) + i) + "'>" + (parseInt(iStart, 10) + i) + "</option>");
			} else {
				oSelect.append("<option value='" + (parseInt(iStart, 10) + i) + "'>" + (parseInt(iStart, 10) + i) + "</option>");
			}
		}
	}

	$.fn.dateSelector = function(options) {
		options = options || {};

		//初始化
		this._options = {
			ctlYearId: null,
			ctlMonthId: null,
			ctlDayId: null,
			defYear: 0,
			defMonth: 0,
			defDay: 0,
			minYear: 1882,
			maxYear: new Date().getFullYear()
		};

		for (var property in options) {
			this._options[property] = options[property];
		}

		this.yearValueId = $("#" + this._options.ctlYearId);
		this.monthValueId = $("#" + this._options.ctlMonthId);
		this.dayValueId = $("#" + this._options.ctlDayId);

		var dt = new Date(),
			iMonth = parseInt(this.monthValueId.attr("data") || this._options.defMonth, 10),
			iDay = parseInt(this.dayValueId.attr("data") || this._options.defDay, 10),
			iMinYear = parseInt(this._options.minYear, 10),
			iMaxYear = parseInt(this._options.maxYear, 10);

		this.Year = parseInt(this.yearValueId.attr("data") || this._options.defYear, 10) || dt.getFullYear();
		this.Month = 1 <= iMonth && iMonth <= 12 ? iMonth : dt.getMonth() + 1;
		this.Day = iDay > 0 ? iDay : dt.getDate();
		this.minYear = iMinYear && iMinYear < this.Year ? iMinYear : this.Year;
		this.maxYear = iMaxYear && iMaxYear > this.Year ? iMaxYear : this.Year;

		//默认选中的日期索引(没有指定日期，就默认选取"请选择")
		var defYearIndex = parseInt(this.yearValueId.attr("data") || this._options.defYear, 10) || 0,
			defMonthIndex = 1 <= iMonth && iMonth <= 12 ? iMonth : 0,
			defDayIndex = iDay > 0 ? iDay : 0;

		//初始化控件
		//设置年
		setSelectControl(this.yearValueId, this.minYear, this.maxYear - this.minYear + 1, defYearIndex);
		//设置月
		setSelectControl(this.monthValueId, 1, 12, defMonthIndex);
		//设置日
		var daysInMonth = new Date(this.Year, this.Month, 0).getDate(); //获取指定年月的当月天数[new Date(year, month, 0).getDate()]
		if (this.Day > daysInMonth) {
			this.Day = daysInMonth;
		}
		setSelectControl(this.dayValueId, 1, daysInMonth, defDayIndex);

		var oThis = this;
		//绑定控件事件
		this.yearValueId.change(function() {
			var year = $(this).val();
			if(!year){
				return;
			}

			oThis.Year = parseInt(year, 10);
			setSelectControl(oThis.monthValueId, 1, 12, oThis.Month);
			oThis.monthValueId.change();
		});
		this.monthValueId.change(function() {
			var month = $(this).val();
			if(!month){
				return;
			}

			oThis.Month = parseInt(month, 10);
			var daysInMonth = new Date(oThis.Year, oThis.Month, 0).getDate();
			if (oThis.Day > daysInMonth) {
				oThis.Day = daysInMonth;
			}
			setSelectControl(oThis.dayValueId, 1, daysInMonth, oThis.Day);
		});
		this.dayValueId.change(function() {
			var day = $(this).val();
			if(!day){
				return;
			}

			oThis.Day = parseInt(day, 10);
		});
	};
})(jQuery);