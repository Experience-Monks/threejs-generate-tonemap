function TonemapGenerator(renderer, initialRenderTarget) {
   
	this.renderer = renderer;

	var textureWidth = initialRenderTarget.width;
	var textureHeight = initialRenderTarget.height;
	var size = textureWidth * textureHeight;

	var renderTarget2 = new THREE.WebGLRenderTarget(textureWidth, textureHeight);
    renderTarget2.flipY = false;
    renderTarget2.generateMipMaps = false;
    renderTarget2.minFilter = THREE.NearestFilter;
    renderTarget2.magFilter = THREE.NearestFilter;

    var renderTargets = [initialRenderTarget, renderTarget2];
    this.renderTargets = renderTargets;

    var scene = new THREE.Scene();
    var camera = new THREE.OrthographicCamera( -1, 1, 1, -1, -1, 1 );

    this.scene = scene;
    this.camera = camera;

	this.material = new THREE.ShaderMaterial({
    	side: THREE.DoubleSide,
		uniforms: {
			pixelSize: { type: 'v2', value: new THREE.Vector2(1.0 / textureWidth, 1.0 / textureHeight) },
			data: {type: 't', value: initialRenderTarget}
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

	var iterations = 32;

	for (var i = 0; i < iterations; i++) {
		var first = this.renderTargets.shift();
		this.renderTargets.push(first);

		var currentRenderTarget = this.renderTargets[0];

		this.material.uniforms.data.value = first;
		this.renderer.render(this.scene, this.camera, currentRenderTarget);
		this.finalRenderTarget = currentRenderTarget;
	}
};

TonemapGenerator.prototype.dispose = function() {

	for (var i = 0, l = this.renderTargets.length; i < l; i++) {
		this.renderTargets[i].dispose();
		delete this.renderTargets[i];
	}
};
module.exports = TonemapGenerator;
