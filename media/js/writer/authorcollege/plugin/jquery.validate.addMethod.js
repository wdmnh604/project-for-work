//验证电话号码
jQuery.validator.addMethod("isPhone", function(value, element) {
        var length = value.length;
        var mobile = /^(((13[0-9]{1})|(15[0-9]{1}))+\d{8})$/;
        var tel = /^\d{3,4}-?\d{7,9}$/;
        return this.optional(element) || (tel.test(value) || mobile.test(value));
}, "请正确填写您的联系电话");

//验证手机号码
jQuery.validator.addMethod("isMobile", function(value, element) {
    var length = value.length;
    var mobile = /^((13[0-9])|(14[0-35-9])|(15[0-35-9])|(17[0-35-9])|(18[0-9]))[0-9]{8}$/;
    return this.optional(element) || mobile.test(value);
}, "请正确填写您的手机号码");

//验证QQ号码
jQuery.validator.addMethod("isQQ", function(value, element) {
    return this.optional(element) || /^[1-9][0-9]{4,9}$/.test(value);
}, "qq号码格式错误");

//验证邮箱地址
jQuery.validator.addMethod("isEmail", function(value, element) {
    return this.optional(element) || /^[a-zA-Z0-9_+.-]+\@([a-zA-Z0-9-]+\.)+[a-zA-Z0-9]{2,4}$/.test(value);
}, "邮箱地址不合法");

//验证邮政编码   
jQuery.validator.addMethod("isZipCode", function(value, element) {
    var tel = /^[0-9]{6}$/;
    return this.optional(element) || (tel.test(value));
}, "请正确填写您的邮政编码");

//验证姓名
jQuery.validator.addMethod("isRealName", function(value, element) {
        return this.optional(element) || /^[\u4E00-\u9FFF·\u4dae]{2,4}$/.test(value);
}, "由2-4个汉字组成");

//验证证件号  身份证，军官证，护照
jQuery.validator.addMethod("isIDCardV2", function(value, element) {
    return this.optional(element) || /^([A-Za-z0-9\u4E00-\u9FFF]{8,18})$/.test(value);
}, "证证件号不合法");
//验证身份证
jQuery.validator.addMethod("isIDCard", function(value, element) {
    return this.optional(element) || /^(\d{17}[xX\d])$/.test(value);
}, "身份证不合法");
//验证身份证
jQuery.validator.addMethod("isIDCardV3", function(value, element,param) {
   if('0'==$(param).val())
    {
        return this.optional(element) || /^(\d{17}[xX\d])$/.test(value);
    }
    else
    {
        return true;
    }
    
}, "身份证不合法");

//验证两次输入是否相同
jQuery.validator.addMethod("notEqualTo", function(value, element, param) {
    return value != $(param).val();
}, "新密码不能和原始密码相同");

//验证密码输入
jQuery.validator.addMethod("passwordCheck", function(value, element) {
    return this.optional(element) || /^[A-Za-z0-9~!@#$%^&*()_+]{6,16}$/.test(value);
}, "6-16位英文、数字或特殊字符组成");

//验证字节长度(中文字两个字节)
jQuery.validator.addMethod("byteRangeLength", function(value, element, param) {
    var length = value.length;
    for(var i = 0; i < value.length; i++){
        if(value.charCodeAt(i) > 127){
            length++;
        }
    }
  return this.optional(element) || ( length >= param[0] && length <= param[1] );
}, $.validator.format("请确保输入的值在{0}-{1}个字节之间(一个中文字算2个字节)"));

//验证字节长度(中文字1个字节)
jQuery.validator.addMethod("byteRangeLengthByOne", function(value, element, param) {
    value = value.replace(/\r\n/ig, "");
    value = value.replace(/\s+/g, '');

    var length = value.length;
    return this.optional(element) || (length >= param[0] && length <= param[1]);
}, "请确保输入的值在20-500个字节之间(一个中文字算1个字节)");
//手机验证
jQuery.validator.addMethod("phoneCheck", function(value, element,param) {
    var length = value.length;
    if('+86'==$(param).val())
    {
        var mobile = /^((13[0-9])|(14[0-35-9])|(15[0-35-9])|(17[0-35-9])|(18[0-9]))[0-9]{8}$/;
    }
    else
    {
        var mobile = /^[0-9]{1,20}$/;    
    }
    return this.optional(element) || mobile.test(value);

}, "请输入正确的手机号码");