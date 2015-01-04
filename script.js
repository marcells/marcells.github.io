$(function() {
	var links = {
		'Three.js': 'http://threejs.org',
		'WindowsPhone': 'https://dev.windowsphone.com/en-us/downloadsdk',
		'Caliburn.Micro': 'http://caliburnmicro.codeplex.com/',
		'Rx': 'http://msdn.microsoft.com/en-us/data/gg577609.aspx',
		'Node.js': 'http://nodejs.org/',
		'KnockoutJS': 'http://knockoutjs.com/'
	};

	var parseDate = function(value) {
		return new Date(value).toLocaleDateString();
	};

	var buildLinks = function(listAsText) {
		var list = listAsText.split(',');
		var item;
		
		for (var i = list.length - 1; i >= 0; i--) {
			item = list[i].trim();

			if(links.hasOwnProperty(item)) {
				list[i] = '<a href="' + links[item] + '" target="_blank">' + list[i] + '</a>';
			}
		};

		return list.join(', ');
	};

	$('.published').each(function() {
		$(this).text(parseDate($(this).text()));
	});

	$('.tech').each(function() {
		$(this).html(buildLinks($(this).text()));
	});
});