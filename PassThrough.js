function PassThrough(renderer, map, renderToScreen, flipY) {
   
	this.renderer = renderer;

	var textureWidth = (map instanceof THREE.WebGLRenderTarget) ? map.width : map.image.width;
	var textureHeight = (map instanceof THREE.WebGLRenderTarget) ? map.height : map.image.height;

	var renderTarget = new THREE.WebGLRenderTarget(textureWidth, textureHeight);
    renderTarget.flipY = false;
    renderTarget.generateMipMaps = false;
    renderTarget.minFilter = THREE.NearestFilter;
    renderTarget.magFilter = THREE.NearestFilter;

    this.renderTarget = renderTarget;
    this.map = map;
    this.renderToScreen = renderToScreen;

    var scene = new THREE.Scene();
    var camera = new THREE.OrthographicCamera( -1, 1, 1, -1, -1, 1 );

    this.scene = scene;
    this.camera = camera;

	this.material = new THREE.ShaderMaterial({
    	side: THREE.DoubleSide,
		uniforms: {
			pixelSize: { type: 'v2', value: new THREE.Vector2(1.0 / textureWidth, 1.0 / textureHeight) },
			data: {type: 't', value: map}
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

		map instanceof THREE.WebGLRenderTarget ? 			
			'    gl_FragColor = texture2D(data, vUv);' : 
			'    gl_FragColor = texture2D(data, vec2(vUv.x, 1.0 - vUv.y));',

		// only for flipping render targets
		flipY ? 'gl_FragColor = texture2D(data, vec2(vUv.x, 1.0 - vUv.y));' : '',
		'  }'
		].join('\n')
	});

	var quad = new THREE.Mesh(
		new THREE.PlaneBufferGeometry( 2, 2 ),
		this.material
	);
	scene.add(quad);	
}

PassThrough.prototype.update = function() {

	this.renderer.render(this.scene, this.camera, this.renderToScreen ? undefined : this.renderTarget);
};

PassThrough.prototype.dispose = function() {

	this.renderTarget.dispose();
	delete this.renderTarget;

	this.map.dispose();
	delete this.map;
};
module.exports = PassThrough;
