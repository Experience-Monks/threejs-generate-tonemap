function TonemapGenerator(renderer, originalTonemap, initialRenderTarget) {
   
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
			data: {type: 't', value: initialRenderTarget},
			originalTonemap: {type: 't', value: originalTonemap}
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
		'uniform sampler2D originalTonemap;',
		'uniform vec2 pixelSize; ',

		'varying vec2 vUv; ',

		'#define LUT_FLIP_Y',

		'vec4 lookup(in vec4 textureColor, in sampler2D lookupTable1) {',
        '	textureColor = clamp(textureColor, 0.0, 1.0);',  
      
        '	textureColor.b = textureColor.b - 0.5;',
        '	textureColor.b = textureColor.b * 63.0 / 64.0;',
        '	textureColor.b = textureColor.b + 0.5;',

        '	float blueColor = floor(textureColor.b * 64.0);',
    
        '	vec2 quad1;',
        '	quad1.y = floor(blueColor / 8.0) / 8.0;',
        '	quad1.x = mod(blueColor, 8.0) / 8.0;',

        '	textureColor.g = textureColor.g - 0.5;',
        '	textureColor.g = textureColor.g * 63.0 / 64.0;',
        '	textureColor.g = textureColor.g + 0.5 + 1.01 / 128.0;',
                
        '	vec2 texPos1;',
        '	texPos1.x = quad1.x + textureColor.r * (1.0 / 8.0 - 1.0 / 512.0) ;',
        '	texPos1.y = quad1.y + textureColor.g * (1.0 / 8.0 - 1.0 / 512.0) ;',
    
        '	#ifdef LUT_FLIP_Y',
        '		texPos1.y = 1.0-texPos1.y;',
        '	#endif',
                    
        '	lowp vec4 newColor1 = texture2D(lookupTable1, texPos1);',
        '	return newColor1;',
        '}',

		'void main() {',
		'	vec4 vacant = vec4(0.0, 1.0, 0.0, 1.0); ',
		
		'	float voxelSize = 1.0 / 128.0;',
		'	vec4 pos = texture2D(originalTonemap, vUv);',
		'	vec4 posUp = vec4(pos.x + 0.5 * voxelSize, pos.y + voxelSize * 2.0, pos.z, pos.w);',
		'	vec4 posDown = vec4(pos.x + 0.5 * voxelSize, pos.y - voxelSize * 2.0, pos.z, pos.w);',
		'	vec4 posRight = vec4(pos.x - voxelSize, pos.y, pos.z, pos.w);',
		'	vec4 posLeft = vec4(pos.x + voxelSize * 2.4, pos.y, pos.z, pos.w);',
		'	vec4 posFront = vec4(pos.x + voxelSize * 0.5, pos.y, pos.z + voxelSize * 2.4, pos.w);',
		'	vec4 posBack = vec4(pos.x + voxelSize * 0.5, pos.y, pos.z - voxelSize * 2.0, pos.w);',
		
		'	if (texture2D(data, vUv) == vacant) {',
		'		vec4 sample = lookup(posUp, data);',
		'		if (sample != vacant) {',
		'			gl_FragColor = sample;',
		'		} else {',
		'			sample = lookup(posDown, data);',
		'			if (sample != vacant) {',
		'				gl_FragColor = sample;',
		'			} else {',
		'				sample = lookup(posLeft, data);',
		'				if (sample != vacant) {',
		'					gl_FragColor = sample;',
		'				} else {',
		'					sample = lookup(posRight, data);',
		'					if (sample != vacant) {',
		'						gl_FragColor = sample;',
		'					} else {',
		'						sample = lookup(posFront, data);',
		'						if (sample != vacant) {',
		'							gl_FragColor = sample;',
		'						} else {',
		'							sample = lookup(posBack, data);',
		'							if (sample != vacant) {',
		'								gl_FragColor = sample;',
		'							} else {',
		'								gl_FragColor = texture2D(data, vUv);',	
		'							}',
		'						}',
		'					}',
		'				}',
		'			}',
		'		}',

		'	} else {',
		'		gl_FragColor = texture2D(data, vUv);',
		'	}',

		'}'
		].join('\n')
	});

	var quad = new THREE.Mesh(
		new THREE.PlaneBufferGeometry( 2, 2 ),
		this.material
	);
	scene.add(quad);	
}

TonemapGenerator.prototype.update = function() {

	var renderTargets = this.renderTargets;

	for (var i = 0, iterations = 62; i < iterations; i++) {
		renderTargets.push(renderTargets.shift());

		this.material.uniforms.data.value = renderTargets[1];
		this.renderer.render(this.scene, this.camera, renderTargets[0]);
	}
	this.finalRenderTarget = renderTargets[0];
};

TonemapGenerator.prototype.dispose = function() {

	for (var i = 0, l = this.renderTargets.length; i < l; i++) {
		this.renderTargets[i].dispose();
		delete this.renderTargets[i];
	}

	if (this.material.uniforms.data) {
		this.material.uniforms.data.value.dispose();
		delete this.material.uniforms.data.value;		
	}

	if (this.material.uniforms.originalTonemap) {
		this.material.uniforms.originalTonemap.value.dispose();
		delete this.material.uniforms.originalTonemap.value;		
	}

	delete this.scene;
	delete this.camera;
	delete this.material;
};
module.exports = TonemapGenerator;
