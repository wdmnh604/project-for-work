/**
 * plugin.js
 *
 * Released under LGPL License.
 * Copyright (c) 1999-2015 Ephox Corp. All rights reserved
 *
 * License: http://www.tinymce.com/license
 * Contributing: http://www.tinymce.com/contributing
 */

/*global tinymce:true */

tinymce.PluginManager.add('hr', function(editor) {
	editor.addCommand('InsertHorizontalRule', function() {
		editor.execCommand('mceInsertContent', false, '<hr />');
	});

	editor.addButton('hr', {
		icon: 'hr',
		tooltip: '分割线',
		cmd: 'InsertHorizontalRule'
	});

	editor.addMenuItem('hr', {
		icon: 'hr',
		text: 'Horizontal line',
		cmd: 'InsertHorizontalRule',
		context: 'insert'
	});
});
