/*
 * jQuery Date Selector Plugin
 * address 3 ji联动选择插件
 * update:   默认dizhi不传，就默认选中“请选择”
 * Demo:
			$("#area").areaSelector({
			ctlProvinceId: null,//sheng
			ctlCityId: null,//shi
			ctlCountyId: null,//qu
			defProvince: '',//moren sheng
			defCity: '',//moren  shi
			defCounty: '',//moren qu
			oArea:null    //shengshiqu liebiao
		});
 
	HTML:
		<div id="area">
			<SELECT id=diprovince></SELECT>sheng <SELECT id=idshi></SELECT>shi <SELECT id=idqu></SELECT>qu
		</div>
 */
;
(function($) {

	function  setAreaSelectControl(oSelect,aValue,defValue)
	{
		oSelect.empty();
		var $emptyOption=$('<option value="">请选择</option>');
		if(defValue == '')
		{
			$emptyOption.prop('selected','selected');
		}
		oSelect.append($emptyOption);

		for(var x in aValue)
		{
			if(aValue[x]==defValue)
			{
				oSelect.append("<option selected='selected' value='" + aValue[x] + "'>" + aValue[x] + "</option>");
			}else
			{
				oSelect.append("<option value='" + aValue[x] + "'>" + aValue[x] + "</option>");
			}
		}
	}

	$.fn.areaSelector = function(options) {
		options = options || {};

		//初始化
		this._options = {
			ctlProvinceId: null,
			ctlCityId: null,
			ctlCountyId: null,
			defProvince: '',
			defCity: '',
			defCounty: '',
			oArea:null
		};

		for (var property in options) {
			this._options[property] = options[property];
		}

		this.ProvinceValueId = $("#" + this._options.ctlProvinceId);
		this.CityValueId = $("#" + this._options.ctlCityId);
		this.CountyValueId = $("#" + this._options.ctlCountyId);

		var aProvince = getProvincelist(this._options.oArea);
		var aCity = getCitylist(this._options.oArea,this._options.defProvince);

		var aCounty = getCountylist(this._options.oArea,this._options.defProvince,this._options.defCity);

		setAreaSelectControl(this.ProvinceValueId,aProvince,this._options.defProvince);
		setAreaSelectControl(this.CityValueId,aCity,this._options.defCity);
		setAreaSelectControl(this.CountyValueId,aCounty,this._options.defCounty);

		var oThis=this;
		this.ProvinceValueId.change(function(){
			oThis.CityValueId.empty();
			oThis.CountyValueId.empty();
			var province=$(this).val();
			if(!province)
			{
				return ;
			}
			var citylist=getCitylist(oThis._options.oArea,province);
			setAreaSelectControl(oThis.CityValueId,citylist,'');

			oThis.CityValueId.change();	
			oThis._options.defProvince=province;
			$('select').comboSelect();
		});
		this.CityValueId.change(function(){
			oThis.CountyValueId.empty();
			var city=$(this).val();
			if(!city)
			{
				return ;
			}
			var countylist=getCountylist(oThis._options.oArea,oThis._options.defProvince,city);
			setAreaSelectControl(oThis.CountyValueId,countylist,'');

			oThis.CountyValueId.change();
			oThis._options.defCity=city;
			$('select').comboSelect();
		});
		this.CountyValueId.change(function(){
			var county=$(this).val();
			if(!county)
			{
				return ;
			}
			oThis._options.defCounty=county;
			$('select').comboSelect();
		});

		function getProvincelist(oArea)
		{
			var aProvince= new Array();
			for(var x in oArea)
			{
				aProvince.push(x);
			}
			return aProvince;
		}
		function getCitylist(oArea,province)
		{
			var aCity=new Array();
			var citylist=oArea[province];
			if(citylist==undefined)
			{
				for(var x in oArea)
				{
					citylist=oArea[x];
					break;
				}
			}
			for(var x in citylist.city)
			{ 
				aCity.push(x);
			}
			return aCity;
		}
		function getCountylist(oArea,province,city)
		{
			var aCounty=new Array();
			var citylist=oArea[province];
			if(citylist==undefined)
			{
				for(var x in oArea)
				{
					citylist=oArea[x];
					break;
				}
			}
			var arrCity=citylist.city;
			var countylist=arrCity[city];
			if(countylist==undefined)
			{
				for(y in citylist)
				{
					countylist=citylist[y];
					break;
				}
			}
			return countylist.area;
		}

	};
})(jQuery);
