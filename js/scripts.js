(function() {
	var doc = document;
	var editor = doc.getElementById('editor');
	var quote = doc.getElementById('quote');
	var editorIMG = doc.createElement('IMG');
	var imgurDiv = doc.getElementById('imgur_links');
	var screenshotButton = doc.getElementById('screenshot_button');
	var imgurButton = doc.getElementById('imgur_button');
	var edgeview = false;
	var outputIMG;

	function checkEdgeview() {
		var below = (editor.offsetTop + editor.clientHeight) < (doc.body.scrollTop || doc.documentElement.scrollTop);
		if (!edgeview && below) {
			doc.body.style.paddingTop = editor.clientHeight + 'px';
			doc.body.className = 'edgeview';
			edgeview = true;
		} else if (edgeview && !below) {
			doc.body.className = '';
			doc.body.style.paddingTop = '0';
			edgeview = false;
		}
	}

	doc.addEventListener('scroll', checkEdgeview);

	// flash editor in fullsize fixed mode (negative z-index) to make html2canvas work 
	function flashEditor() {
		var scrollTop = doc.body.scrollTop || doc.documentElement.scrollTop;
		var bodyClass = doc.body.className;
		var editorOpacity = editor.style.opacity;
		var editorTransform = editor.style.transform;
		doc.body.className = 'edgeview';
		editor.style.transform = 'none';
		editor.style.opacity = '1';
		editor.style.zIndex = '-1';
			setTimeout(function() {
				doc.body.className = bodyClass;
				editor.style.transform = editorTransform;
				editor.style.opacity = editorOpacity;
				editor.style.zIndex = '5';
				window.scrollTo(0, scrollTop);
			}, 30);
	}

	function generateImage() {
		screenshotButton.disabled = true;
		flashEditor();
		html2canvas(editor).then(function(canvas) {
			if (!outputIMG) {
				outputIMG = doc.createElement('IMG');
				doc.getElementById('output_wrapper').appendChild(outputIMG);
			}
			outputIMG.src = canvas.toDataURL('image/jpeg');
			screenshotButton.disabled = false;
		});
	}

	// set up initial editor image
	(function() {
		editorIMG.addEventListener('load', function() {
			var width = editorIMG.naturalWidth;
			var height = editorIMG.naturalHeight;
			var windowWidth = doc.querySelector('main').clientWidth;
			var aspectRatio = (width > height ? width : height) / (windowWidth < 768 ? windowWidth : 768);
			var style = 'height:' + height / aspectRatio + 'px;width:' + width / aspectRatio + 'px;background-image:url("' + editorIMG.src + '")';
			// console.log(style);
			editor.style.cssText += style;
			if (edgeview) doc.body.style.paddingTop = editor.clientHeight + 'px';
			checkEdgeview();
		})
		editorIMG.src = 'img/harbaugh1.jpg';
	})();

	// screenshot button
	screenshotButton.addEventListener('click', generateImage);

	// position slider
	['x_axis', 'y_axis'].forEach(function(id) {
		doc.getElementById(id).addEventListener('input', function(e) {
			var thisID = e.target.id;
			var size = this.value;
			quote.style[thisID === 'x_axis' ? 'left' : 'top'] = size + '%';
		})
	});

	// font-size slider
	doc.getElementById('fsize_slider').addEventListener('input', function() {
		var size = this.value;
		editor.style.cssText += ';font-size:' + size + 'px';
	});

	// width slider
	doc.getElementById('width_slider').addEventListener('input', function() {
		var width = this.value;
		quote.style.maxWidth = width + '%';
	});

	// color boxes
	function colorClick() {
		var color = this.id.split('_')[0];
		var shadowColor = color === 'fff' ? '000' : 'ccc';
		editor.style.cssText += 'color:#' + color + ';text-shadow:0px 1px .2em #' + shadowColor + ';'
	}

	['fff_color', '1a1a1a_color'].forEach(function(id) {
		doc.getElementById(id).addEventListener('click', colorClick);
	});

	// mask
	function maskClick() {
		var curClass = editor.className;
		var newClass = 'editor mask ' + this.id
		if (curClass === newClass) {
			editor.className = 'editor';
		} else {
			editor.className = newClass;
		}
	}

	['dark-mask', 'light-mask'].forEach(function(id) {
		doc.getElementById(id).addEventListener('click', maskClick);
	});
	
	// fonts
	(function() {
		var fontArr = doc.getElementById('gfonts').href.substr(40).replace(/\+/g, ' ').replace(/:|,|\d/g, '').split('|');
		var fontDiv = doc.createElement('DIV');
		fontDiv.className = 'fonts';
		fontArr.forEach(function(fontFamily) {
			var font = doc.createElement('DIV');
			font.style.fontFamily = fontFamily;
			font.setAttribute('data-font', fontFamily);
			font.innerHTML = fontFamily
			font.addEventListener('click', function() {
				editor.style.fontFamily = this.getAttribute('data-font')
			})
			fontDiv.appendChild(font)
		})
		doc.getElementById('font-root').appendChild(fontDiv);
	})();

	// harbaugh pictures
	(function() {
		// var fontArr = doc.getElementById('gfonts').href.substr(40).replace(/\+/g, ' ').replace(/:|\d/g, '').split('|');
		var backgroundDiv = doc.createElement('DIV');
		var pic;
		backgroundDiv.className = 'fonts pics';
		for (var i = 1; i < 13; i++) {
			pic = doc.createElement('DIV');
			pic.style.backgroundImage = 'url("img/harbaugh' + i + '.jpg")';
			(function(i) {
				pic.addEventListener('click', function() {
					editorIMG.src = 'img/harbaugh' + i + '.jpg'
				})
			})(i);
			backgroundDiv.appendChild(pic)
		}
		doc.getElementById('background-root').appendChild(backgroundDiv);
	})();

	// imgur upload
	(function() {
		var uploadImage = function() {
			imgurButton.disabled = true;
			imgurDiv.innerHTML = '';
			flashEditor();
			html2canvas(editor).then(function(canvas) {
				var img64 = encodeURIComponent(canvas.toDataURL('image/jpeg').substr(23));

				// console.log('sending to imgur....');

				var http = new XMLHttpRequest();
				var url = "https://api.imgur.com/3/image";
				var params = "image=" + img64 + "&type=base64"

				http.open("POST", url, true);

				//Send the proper header information along with the request
				http.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
				http.setRequestHeader("Authorization", "Client-ID dcea6db630ff81a");
				http.setRequestHeader("Accept", "application/json");

				http.onreadystatechange = function() {//Call a function when the state changes.
					if(http.readyState == 4 && http.status == 200) {
						var data = JSON.parse(http.responseText).data;
						// console.log(data);
						imgurDiv.innerHTML = '<a href="' + data.link + '">imgur link</a>' +
							'<a href="http://imgur.com/delete/' + data.deletehash + '">deletion link</a>';
						imgurButton.disabled = false;
					}
				}
				http.send(params);
				// doc.body.scrollTop = outputIMG.offsetTop;
			});
		};
		imgurButton.addEventListener('click', uploadImage);
	})(); 

})();