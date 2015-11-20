THREE = require('three');
var PassThrough = require('./PassThrough');
var TonemapGenerator = require('./TonemapGenerator');
var palette = require('./palette');

var textureWidth = textureHeight = 512;

var renderer = new THREE.WebGLRenderer();
renderer.setClearColor(0x000000, 1);
renderer.setSize(textureWidth, textureHeight);

// Generate palette
var size = textureWidth * textureHeight;
var dataColor = new Uint8Array( size * 3 );
for (var i = 0; i < size; i++) {
	dataColor[i*3]     = 0;
	dataColor[i*3 + 1] = 255;
	dataColor[i*3 + 2] = 0;
}

function generatePaletteRandom() {
	// fill 0..255 points with indices
	for (var i = 0; i < 256; i++) {
		var c = ~~(Math.random() * size);
		dataColor[c * 3]     = i;
		dataColor[c * 3 + 1] = i;
		dataColor[c * 3 + 2] = i;
	}	
}

function generatePaletteFromArray() {

	function mod(a, b) {
		return a - b * Math.floor(a / b);
	} 

	for (var i = 0, l = palette.length; i < l; i++) {
		var r = palette[i][2] / 255.0;
		var g = palette[i][3] / 255.0;
		var b = palette[i][4] / 255.0;

		var blueColor = Math.floor(b * 64.0);
		var y = Math.floor(blueColor / 8.0) / 8.0;
		var x = mod(blueColor, 8.0) / 8.0;

		var texu = x + r * (1.0 / 8.0 - 1.0 / 512.0);
		var texv = y + g * (1.0 / 8.0 - 1.0 / 512.0);

		var index = ~~(texv * 512.0) * 512 + ~~(texu * 512.0);
		
		dataColor[index * 3] = i;
		dataColor[index * 3 + 1] = i;
		dataColor[index * 3 + 2] = i;
	}
}

var generatePalette = generatePaletteFromArray;
generatePalette();

var map = new THREE.DataTexture(dataColor, textureWidth, textureHeight, THREE.RGBFormat);
map.needsUpdate = true;

var originalTonemap = THREE.ImageUtils.loadTexture(
	'original.png', 
	THREE.UVMapping, 
	function() {

		// Pass in map of 256 initial colours
		var passThrough = new PassThrough(renderer, map);
		passThrough.update();

		var tonemapGenerator = new TonemapGenerator(renderer, originalTonemap, passThrough.renderTarget);
		tonemapGenerator.update();

		var finalPassThrough = new PassThrough(renderer, tonemapGenerator.finalRenderTarget, true);
		finalPassThrough.update();

		document.body.appendChild(renderer.domElement);

		passThrough.dispose();
		tonemapGenerator.dispose();
		finalPassThrough.dispose();
		originalTonemap.dispose();
	},
	function(err) {}
);


