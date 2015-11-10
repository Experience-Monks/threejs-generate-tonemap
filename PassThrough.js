function TonemapGenerator(renderer) {
   
	this.renderer = renderer;

	var textureWidth = textureHeight = 512;
	var size = textureWidth * textureHeight;
	var dataColor = new Uint8Array( size * 3 );
	for (var i = 0; i < size; i++) {
		dataColor[i*3]     = 0;
		dataColor[i*3 + 1] = 255;
		dataColor[i*3 + 2] = 0;
	}

	// fill 0..255 points with indices
	for (var i = 0; i < 256; i++) {
		dataColor[i*3]     = i;
		dataColor[i*3 + 1] = 0;
		dataColor[i*3 + 2] = 0;
	}
	var map = new THREE.DataTexture(dataColor, textureWidth, textureHeight, THREE.RGBFormat);
	map.needsUpdate = true;

	var renderTarget = new THREE.WebGLRenderTarget(textureWidth, textureHeight);
    renderTarget.flipY = false;
    renderTarget.generateMipMaps = false;
    renderTarget.minFilter = THREE.NearestFilter;
    renderTarget.magFilter = THREE.NearestFilter;

    this.renderTarget = renderTarget;

    var scene = new THREE.Scene();
    var camera = new THREE.OrthographicCamera( -1, 1, -1, 1, -1, 1 );

    this.scene = scene;
    this.camera = camera;

	this.material = new THREE.ShaderMaterial({
    	side: THREE.DoubleSide,
		uniforms: {
			pixelSize: { type: 'v2', value: new THREE.Vector2(1.0 / textureWidth, 1.0 / textureHeight) },
			data: {type: 't', value: map}
			//texture1: {type: 't', value: this.renderTarget1},
			//texture2: {type: 't', value: this.renderTarget2}
		},
		vertexShader: 
		[
		'varying vec2 vUv;',
		'void main() {',
		'	vUv = uv;',
		'	gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); ',
		'}'
		].join('\n'),
		fragmentShader: 
		[
		'uniform sampler2D data;',
		'uniform vec2 pixelSize; ',

		'varying vec2 vUv; ',
		'  void main() {',
		'    gl_FragColor = texture2D(data, vUv);',
		'  }'
		].join('\n')
	});

	var quad = new THREE.Mesh(
		new THREE.PlaneBufferGeometry( 2, 2 ),
		this.material
	);
	scene.add(quad);	
}

TonemapGenerator.prototype.update = function() {

	//this.renderer.render(this.scene, this.camera, this.renderTarget);
	this.renderer.render(this.scene, this.camera, this.renderTarget);
};

TonemapGenerator.prototype.dispose = function() {

	// this.renderTarget.dispose();
	// delete this.renderTarget;
};
module.exports = TonemapGenerator;
