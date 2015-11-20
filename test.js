THREE = require('three');
var palette = require('./palette');

var ToneMapGeneratorHelper = require('./');
var PassThrough = require('./PassThrough');

var renderer = new THREE.WebGLRenderer();
renderer.setClearColor(0x000000, 1);
renderer.setSize(512, 512);

var originalTonemap = THREE.ImageUtils.loadTexture(
	'original.png', 
	THREE.UVMapping, 
	function() {

		var tonemapGeneratorHelper = new ToneMapGeneratorHelper(renderer, originalTonemap, palette);

		var finalPassThrough = new PassThrough(renderer, tonemapGeneratorHelper.finalRenderTarget, true);
		finalPassThrough.update();

		document.body.appendChild(renderer.domElement);
		finalPassThrough.dispose();

		tonemapGeneratorHelper.dispose();
	}
);


