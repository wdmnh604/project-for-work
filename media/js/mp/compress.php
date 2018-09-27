<?php
//js合并配置
$js_merge_config = include(dirname(__FILE__).'/js_config.php');
$js_merge_config = $js_merge_config['JS_COMPRESS'];

//目录分隔符
define('DS', DIRECTORY_SEPARATOR);
//当前路径
define('CURRENT_DIR' , dirname(__FILE__));
//js路径
define('JS_DIR' , CURRENT_DIR);
//存放压缩文件的文件夹名称
define('COMPRESS_DIR_NAME', 'merge');
//换行符
define('LINE', "\n");

require JS_DIR. DS ."..". DS ."..". DS ."compress_code". DS ."compress_js.php";
