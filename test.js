THREE = require('three');
var PassThrough = require('./PassThrough');

var width = height = 512;

var renderer = new THREE.WebGLRenderer();
renderer.setClearColor(0x000000, 1);
renderer.setSize(width, height);

var passThrough = new PassThrough(renderer);
passThrough.update();

console.log(passThrough.renderTarget);

document.body.appendChild(renderer.domElement);
