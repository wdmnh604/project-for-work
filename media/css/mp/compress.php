<?php

//css合并配置
$css_merge_config = require(dirname(__FILE__).'/css_config.php');
$css_merge_config = $css_merge_config['CSS_COMPRESS'];

//目录分隔符
define('DS', DIRECTORY_SEPARATOR);
//当前路径
define('CURRENT_DIR' , dirname(__FILE__));
//css路径
define('CSS_DIR' , CURRENT_DIR);
//存放压缩文件的文件夹名称
define('COMPRESS_DIR_NAME', 'merge');
//换行符
define('LINE', "\n");

require CSS_DIR. DS ."..". DS ."..". DS ."compress_code". DS ."compress_css.php";