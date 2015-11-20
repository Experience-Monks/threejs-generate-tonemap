var PassThrough = require('./PassThrough');
var TonemapGenerator = require('./TonemapGenerator');

function TonemapGeneratorHelper(renderer, originalTonemap, palette) {
   
	var textureWidth = textureHeight = originalTonemap.image.height;

	// Generate palette
	var size = textureWidth * textureHeight;
	var dataColor = new Uint8Array( size * 3 );
	for (var i = 0; i < size; i++) {
		dataColor[i*3]     = 0;
		dataColor[i*3 + 1] = 255;
		dataColor[i*3 + 2] = 0;
	}

	function mod(a, b) {
		return a - b * Math.floor(a / b);
	} 

	// Fill data texture with 256 points of palette
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

	var map = new THREE.DataTexture(dataColor, textureWidth, textureHeight, THREE.RGBFormat);
	map.needsUpdate = true;
	
	// Pass in map of 256 initial colours
	var passThrough = new PassThrough(renderer, map);
	passThrough.update();

	var tonemapGenerator = new TonemapGenerator(renderer, originalTonemap, passThrough.renderTarget);
	tonemapGenerator.update();

	var renderTarget = tonemapGenerator.finalRenderTarget;

	var finalPassThrough = new PassThrough(renderer, tonemapGenerator.finalRenderTarget, false, true);
	finalPassThrough.update();

	// clean up finalPassThrough
	
	this.finalRenderTarget = renderTarget;
	this.finalRenderTargetFlipped = finalPassThrough.renderTarget;

	originalTonemap.dispose();

	this.passThrough = passThrough;
	this.tonemapGenerator = tonemapGenerator;
}

TonemapGeneratorHelper.prototype.dispose = function() {
	this.passThrough.dispose();
	this.tonemapGenerator.dispose();

	delete this.passThrough;
	delete this.tonemapGenerator;
}

module.exports = TonemapGeneratorHelper;
