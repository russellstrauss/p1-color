module.exports = function() {
	
	var renderer, scene, camera, controls;
	var stats = new Stats();
	var wireframeMaterial = new THREE.MeshBasicMaterial({ wireframe: true, color: 0x08CDFA });
	var shadeMaterial = new THREE.MeshPhongMaterial({
		//color: 0x08CDFA,
		side: THREE.DoubleSide,
		//opacity: .5,
		//transparent: true
	});
	var distinctColors = [new THREE.Color('#FFFF00'), new THREE.Color('#00FF00'), new THREE.Color('#FF0000'), new THREE.Color('#000000'), new THREE.Color('#00FFFF'), new THREE.Color('#FFFFFF'), new THREE.Color('#0000FF'), new THREE.Color('#FF00FF'), new THREE.Color('#bcf60c'), new THREE.Color('#fabebe'), new THREE.Color('#008080'), new THREE.Color('#e6beff'), new THREE.Color('#9a6324'), new THREE.Color('#fffac8'), new THREE.Color('#800000'), new THREE.Color('#aaffc3'), new THREE.Color('#808000'), new THREE.Color('#ffd8b1'), new THREE.Color('#000075'), new THREE.Color('#808080'), new THREE.Color('#ffffff'), new THREE.Color('#000000')];
	
	var RGB_MODE = 0;
	var HSL_MODE = 1;
	var visualizeMode = RGB_MODE;
	var sphere1, sphere2, sphere3;
	var cube1, cube2, cube3;
	var color1 = new THREE.Color();
	var color2 = new THREE.Color();
	var color3 = new THREE.Color();
	var RGBCubeSize = 20;

	return {
		
		settings: {
			activateLightHelpers: false,
			axesHelper: {
				activateAxesHelper: false,
				axisLength: 10
			},
			activateColorPickers: true,
			activateStatsFPS: false,
			font: {
				enable: true,
				fontStyle: {
					font: null,
					size: 1,
					height: 0,
					curveSegments: 1
				}
			},
			messageDuration: 2000
		},
		
		init: function() {

			let self = this;
			self.loadFont();
			self.setUpButtons();
		},
		
		begin: function() {
			
			let self = this;
			
			self.setUpScene();
			self.addFloor();
			self.enableControls();
			self.resizeRendererOnWindowResize();
			self.setUpLights();
			self.addGeometries();
			self.addColorPickers();
			
			camera.position.x = -20;
			camera.position.y = 40;
			camera.position.z = 30;
			
			if (self.settings.activateStatsFPS) {
				self.enableStats();
			}
			
			var animate = function() {
				requestAnimationFrame(animate);
				renderer.render(scene, camera);
				controls.update();
				stats.update();
			};
			
			animate();
		},
		
		setColor1: function(color) {
			
			let color1Element = document.querySelector('#color1');
			color1Element.style.backgroundColor = color;
			color1.set(color);

			if (visualizeMode == RGB_MODE)
			{
				sphere1.material.color = color1;
				sphere1.position.setX((color1.r-0.5)*RGBCubeSize);
				sphere1.position.setY((color1.g-0.5)*RGBCubeSize);
				sphere1.position.setZ((color1.b-0.5)*RGBCubeSize);
			}
			this.updateOutputColor();
		},
		
		setColor2: function(color) {
			
			let color2Element = document.querySelector('#color2');
			color2Element.style.backgroundColor = color;
			color2.set(color);

			if (visualizeMode == RGB_MODE)
			{
				sphere2.material.color = color2;
				sphere2.position.setX((color2.r-0.5)*RGBCubeSize);
				sphere2.position.setY((color2.g-0.5)*RGBCubeSize);
				sphere2.position.setZ((color2.b-0.5)*RGBCubeSize);
			}
			this.updateOutputColor();
		},
		
		setColor3: function(color) {
			let color3Element = document.querySelector('#color3');
			color3Element.style.backgroundColor = color;
			color3.set(color);

			if (visualizeMode == RGB_MODE)
			{
				sphere3.material.color = color3;
				sphere3.position.setX((color3.r-0.5)*RGBCubeSize);
				sphere3.position.setY((color3.g-0.5)*RGBCubeSize);
				sphere3.position.setZ((color3.b-0.5)*RGBCubeSize);
			}
		},
		
		setColors: function(color1, color2, color3) {
			
			this.setColor1(color1);
			this.setColor2(color2);
			this.setColor3(color3);
		},

		setPosByRGB: function(mesh, color)
		{
			mesh.position.setX((color.r-0.5)*RGBCubeSize);
			mesh.position.setY((color.g-0.5)*RGBCubeSize);
			mesh.position.setZ((color.b-0.5)*RGBCubeSize);
		},

		setExposure: function(ex) {
			let change = ex / 100.0; // just a small change
			
			// set cube colors
			let scale = Math.pow(2.0, change);
			console.log(color1.r * scale);
			let c1 = cube1.material.color;
			c1.r = Math.min(color1.r * scale, 1.0);
			c1.g = Math.min(color1.g * scale, 1.0);
			c1.b = Math.min(color1.b * scale, 1.0);
			
			let c2 = cube2.material.color;
			c2.r = Math.min(color2.r * scale, 1.0);
			c2.g = Math.min(color2.g * scale, 1.0);
			c2.b = Math.min(color2.b * scale, 1.0);
			
			let c3 = cube3.material.color;
			c3.r = Math.min(color3.r * scale, 1.0);
			c3.g = Math.min(color3.g * scale, 1.0);
			c3.b = Math.min(color3.b * scale, 1.0);
			
			this.setPosByRGB(cube1, c1);
			this.setPosByRGB(cube2, c2);
			this.setPosByRGB(cube3, c3);
		},
		
		updateOutputColor: function() {
			let xyz1 = this.RGB2XYZ(color1);
			let xyz2 = this.RGB2XYZ(color2);
			xyz1.add(xyz2)
			xyz1.multiplyScalar(0.5);
			let c = this.XYZ2RGB(xyz1);
			this.setColor3("#"+c.getHexString());
		},
		
		addColorPickers: function() {
			
			let self = this;
			
			if (self.settings.activateColorPickers) {
				
				let params = {
					ColorInput1: '#FFFFFF',
					ColorInput2: '#FFFFFF',
					Exposure: 0.0
				};
				let gui = new dat.GUI();
				
				gui.domElement.parentElement.classList.add('color-1-picker');
	
				gui.addColor(params, 'ColorInput1').onChange(function(event) {
					
					if (params.ColorInput1) {
						
						let colorObj = new THREE.Color(params.ColorInput1);
						let hex = colorObj.getHexString();
						self.setColor1(params.ColorInput1);
					}
				});
				
				gui.addColor(params, 'ColorInput2').onChange(function(event) {
					
					if (params.ColorInput2) {
						
						let colorObj = new THREE.Color(params.ColorInput2);
						let hex = colorObj.getHexString();
						self.setColor2(params.ColorInput2);
					}
				});

				gui.add(params, 'Exposure', -100, 100).onChange(function(event) {

					if (params.Exposure) {
						self.setExposure(params.Exposure);
					}
				});
			}
		},
		
		addGeometries: function() {
			
			let self = this;
			
			let geometry = new THREE.BoxGeometry(RGBCubeSize, RGBCubeSize, RGBCubeSize);
			geometry.translate(0, RGBCubeSize/2, 0);
			let cube = new THREE.Mesh(geometry, wireframeMaterial);
			scene.add(cube);
			self.showPoints(geometry, distinctColors);
			
			for (let i = 0; i < geometry.vertices.length; i++) {
				self.labelPoint(geometry.vertices[i], i.toString(), new THREE.Color('black'));
			}
			
			
			let radius = 2;
			geometry = new THREE.SphereGeometry(radius, 64, 64);
			geometry.translate(0, RGBCubeSize/2, 0);
			let m1 = shadeMaterial.clone();
			sphere1 = new THREE.Mesh(geometry, m1);
			scene.add(sphere1);

			let m2 = shadeMaterial.clone()
			sphere2 = new THREE.Mesh(geometry, m2);
			scene.add(sphere2);

			let m3 = shadeMaterial.clone()
			sphere3 = new THREE.Mesh(geometry, m3);
			scene.add(sphere3);

			geometry = new THREE.BoxGeometry(radius, radius, radius);
			geometry.translate(0, RGBCubeSize/2, 0);
			let m4 = shadeMaterial.clone();
			cube1 = new THREE.Mesh(geometry, m4);
			scene.add(cube1);
			
			geometry = new THREE.BoxGeometry(radius, radius, radius);
			geometry.translate(0, RGBCubeSize/2, 0);
			let m5 = shadeMaterial.clone();
			cube2 = new THREE.Mesh(geometry, m5);
			scene.add(cube2);
			
			geometry = new THREE.BoxGeometry(radius, radius, radius);
			geometry.translate(0, RGBCubeSize/2, 0);
			let m6 = shadeMaterial.clone();
			cube3 = new THREE.Mesh(geometry, m6);
			scene.add(cube3);
		},

		enableControls: function() {
			controls = new THREE.OrbitControls(camera, renderer.domElement);
			controls.target.set(0, 0, 0);
			controls.enableDamping = true; // an animation loop is required when either damping or auto-rotation are enabled
			controls.dampingFactor = 0.05;
			controls.zoomSpeed = 6;
			controls.enablePan = !utils.mobile();
			controls.minDistance = 18;
			controls.maxDistance = 100;
			controls.maxPolarAngle = Math.PI / 2;
		},

		enableStats: function() {
			document.body.appendChild(stats.dom);
		},

		setUpLights: function() {

			let self = this;
			let lights = [];
			const color = 0xFFFFFF;
			const intensity = 1;
			const light = new THREE.DirectionalLight(color, intensity);
			light.position.set(-1, 2, 4);
			scene.add(light);
			lights.push(light);

			const light2 = new THREE.DirectionalLight(color, intensity);
			light2.position.set(0, 2, -8);
			scene.add(light2);
			lights.push(light2)
			
			if (self.settings.activateLightHelpers) {
				self.activateLightHelpers(lights);
			}
		},

		activateLightHelpers: function(lights) {

			for (let i = 0; i < lights.length; i++) {
				let helper = new THREE.DirectionalLightHelper(lights[i], 5, 0x00000);
				scene.add(helper);
			}
		},

		addFloor: function() {
			var planeGeometry = new THREE.PlaneBufferGeometry(100, 100);
			planeGeometry.rotateX(-Math.PI / 2);
			var planeMaterial = new THREE.ShadowMaterial({ opacity: 0.2 });

			var plane = new THREE.Mesh(planeGeometry, planeMaterial);
			plane.position.y = -1;
			plane.receiveShadow = true;
			scene.add(plane);

			var helper = new THREE.GridHelper(1000, 100);
			helper.material.opacity = .25;
			helper.material.transparent = true;
			scene.add(helper);
		},

		setUpScene: function() {

			let self = this;
			scene = new THREE.Scene();
			scene.background = new THREE.Color(0xf0f0f0);
			camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 1, 1000);
			renderer = new THREE.WebGLRenderer();
			renderer.setSize(window.innerWidth, window.innerHeight);
			document.body.appendChild(renderer.domElement);

			if (self.settings.axesHelper.activateAxesHelper) {

				self.activateAxesHelper();
			}
		},
		
		showPoints: function(geometry, color, opacity) {
			
			let self = this;
			
			for (let i = 0; i < geometry.vertices.length; i++) {
				if (Array.isArray(color)) {
					self.showPoint(geometry.vertices[i], color[i], opacity);
				}
				else {
					self.showPoint(geometry.vertices[i], color, opacity);
				}
			}
		},
		
		showPoint: function(pt, color, opacity) {
			color = color || 0xff0000;
			opacity = opacity || 1;
			let dotGeometry = new THREE.Geometry();
			dotGeometry.vertices.push(new THREE.Vector3(pt.x, pt.y, pt.z));
			let dotMaterial = new THREE.PointsMaterial({ 
				size: 10,
				sizeAttenuation: false,
				color: color,
				opacity: opacity,
				transparent: true
			});
			let dot = new THREE.Points(dotGeometry, dotMaterial);
			scene.add(dot);
		},
		
		showVector: function(vector, origin, color) {
			
			color = color || 0xff0000;
			let arrowHelper = new THREE.ArrowHelper(vector, origin, vector.length(), color);
			scene.add(arrowHelper);
		},
		
		drawLine: function(pt1, pt2) {
			
			let material = new THREE.LineBasicMaterial({ color: 0x0000ff });
			let geometry = new THREE.Geometry();
			geometry.vertices.push(new THREE.Vector3(pt1.x, pt1.y, pt1.z));
			geometry.vertices.push(new THREE.Vector3(pt2.x, pt2.y, pt2.z));
			
			let line = new THREE.Line(geometry, material);
			scene.add(line);
		},
		
		getDistance: function(pt1, pt2) { // create point class?
			
			let squirt = Math.pow((pt2.x - pt1.x), 2) + Math.pow((pt2.y - pt1.y), 2) + Math.pow((pt2.z - pt1.z), 2);
			return Math.sqrt(squirt);
		},
		
		createVector: function(pt1, pt2) {
			return new THREE.Vector3(pt2.x - pt1.x, pt2.y - pt2.y, pt2.z - pt1.z);
		},
		
		getMidpoint: function(pt1, pt2) {
			
			let midpoint = {};
			
			midpoint.x = (pt1.x + pt2.x) / 2;
			midpoint.y = (pt1.y + pt2.y) / 2;
			midpoint.z = (pt1.z + pt2.z) / 2;
			
			return midpoint;
		},
		
		createTriangle: function(pt1, pt2, pt3) { // return geometry
			let triangleGeometry = new THREE.Geometry();
			triangleGeometry.vertices.push(new THREE.Vector3(pt1.x, pt1.y, pt1.z));
			triangleGeometry.vertices.push(new THREE.Vector3(pt2.x, pt2.y, pt2.z));
			triangleGeometry.vertices.push(new THREE.Vector3(pt3.x, pt3.y, pt3.z));
			triangleGeometry.faces.push(new THREE.Face3(0, 1, 2));
			triangleGeometry.computeFaceNormals();
			return triangleGeometry;
		},
		
		activateAxesHelper: function() {
			
			let self = this;
			let axesHelper = new THREE.AxesHelper(self.settings.axesHelper.axisLength);
			scene.add(axesHelper);
		},
		
		labelAxes: function() {
			
			let self = this;
			if (self.settings.font.enable) {
				let textGeometry = new THREE.TextGeometry('Y', self.settings.font.fontStyle);
				let textMaterial = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
				let mesh = new THREE.Mesh(textGeometry, textMaterial);
				textGeometry.translate(0, self.settings.axesHelper.axisLength, 0);
				scene.add(mesh);
				
				textGeometry = new THREE.TextGeometry('X', self.settings.font.fontStyle);
				textMaterial = new THREE.MeshBasicMaterial({ color: 0xff0000 });
				mesh = new THREE.Mesh(textGeometry, textMaterial);
				textGeometry.translate(self.settings.axesHelper.axisLength, 0, 0);
				scene.add(mesh);
				
				textGeometry = new THREE.TextGeometry('Z', self.settings.font.fontStyle);
				textMaterial = new THREE.MeshBasicMaterial({ color: 0x0000ff });
				mesh = new THREE.Mesh(textGeometry, textMaterial);
				textGeometry.translate(0, 0, self.settings.axesHelper.axisLength);
				scene.add(mesh);
			}
		},
		
		loadFont: function() {
			
			let self = this;
			let loader = new THREE.FontLoader();
			let fontPath = '';
			fontPath = 'assets/vendors/js/three.js/examples/fonts/helvetiker_regular.typeface.json';

			loader.load(fontPath, function(font) { // success event
				
				console.log('Fonts loaded successfully.');
				self.settings.font.fontStyle.font = font;
				
				self.begin();
				if (self.settings.axesHelper.activateAxesHelper) self.labelAxes();
			}, function(event) { // in progress event.
				console.log('Attempting to load fonts.')
			}, function(event) { // error event
				
				console.log('Error loading fonts. Webserver required due to CORS policy.');
				self.settings.font.enable = false;
				self.begin();
			});
		},
		
		/* 	Inputs: pt - point in space to label, in the form of object with x, y, and z properties; label - text content for label; color - optional */
		labelPoint: function(pt, label, color) {
			
			let self = this;
			if (self.settings.font.enable) {
				color = color || 0xff0000;
				let textGeometry = new THREE.TextGeometry(label, self.settings.font.fontStyle);
				let textMaterial = new THREE.MeshBasicMaterial({ color: color });
				let mesh = new THREE.Mesh(textGeometry, textMaterial);
				textGeometry.translate(pt.x, pt.y, pt.z);
				scene.add(mesh);
			}
		},
		
		setUpButtons: function() {
			
			let self = this;
			let message = document.getElementById('message');
			
			document.addEventListener('keyup', function(event) {
				
				let L = 76;
				
				if (event.keyCode === L) {
					
					// do stuff when pressing key
				}
			});
		},
		
		resizeRendererOnWindowResize: function() {

			window.addEventListener('resize', utils.debounce(function() {
				
				if (renderer) {
	
					camera.aspect = window.innerWidth / window.innerHeight;
					camera.updateProjectionMatrix();
					renderer.setSize(window.innerWidth, window.innerHeight);
				}
			}, 250));
		},

		RGB2XYZ: function(color)
		{
			let r = color.r;
			let g = color.g;
			let b = color.b;
			let x = (   0.49*r +    0.31*g + 0.2*b) / 0.17697;
			let y = (0.17697*r + 0.81240*g + 0.01063*b) / 0.17697;
			let z = (               0.01*g + 0.99*b) / 0.17697;
			return new THREE.Vector3(x, y, z);
		},

		XYZ2RGB: function(c) // c is Vector3
		{
			let r = (0.41847*c.x-0.15866*c.y-0.082835*c.z);
			let g = (-0.091169*c.x+0.25243*c.y+0.015708*c.z);
			let b = (0.00092090*c.x-0.0025498*c.y+0.1786*c.z);
			return new THREE.Color(r, g, b);
		}
	}
}