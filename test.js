THREE = require('three');
var PassThrough = require('./PassThrough');
var TonemapGenerator = require('./index');

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

// fill 0..255 points with indices
for (var i = 0, c = 0; i < 256 && c < dataColor.length * 3; i++) {
	c += ~~(Math.random() * 0x790);
	var cc = ~~(Math.random() * size);
	dataColor[cc*3]     = i;
	dataColor[cc*3 + 1] = 0;
	dataColor[cc*3 + 2] = 0;
}
var map = new THREE.DataTexture(dataColor, textureWidth, textureHeight, THREE.RGBFormat);
map.needsUpdate = true;

// Pass in map of 256 initial colours
var passThrough = new PassThrough(renderer, map);
passThrough.update();

var tonemapGenerator = new TonemapGenerator(renderer, passThrough.renderTarget);
tonemapGenerator.update();

var finalPassThrough = new PassThrough(renderer, tonemapGenerator.finalRenderTarget, true);
finalPassThrough.update();

document.body.appendChild(renderer.domElement);

passThrough.dispose();
tonemapGenerator.dispose();
finalPassThrough.dispose();
