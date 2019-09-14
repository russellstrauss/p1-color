module.exports = function() {
	
	var renderer, scene, camera, controls;
	var grid = new THREE.GridHelper(1000, 100);
	var stats = new Stats();
	var wireframeMaterial = new THREE.MeshBasicMaterial({ wireframe: true, color: 0x08CDFA });
	var translucentMaterial = new THREE.MeshBasicMaterial({transparent: true, opacity: .3, color: 0x08CDFA });
	var backgroundBase = new THREE.Mesh();
	var backgroundSwatch1 = new THREE.Mesh();
	var backgroundSwatch2 = new THREE.Mesh();
	var shadeMaterial = new THREE.MeshPhongMaterial({
		side: THREE.DoubleSide
	});
	
	var distinctColors = [new THREE.Color('#FFFFFF'), 
						new THREE.Color('#FFFF00'), 
						new THREE.Color('#FF00FF'), 
						new THREE.Color('#FF0000'), 
						new THREE.Color('#00FF00'), 
						new THREE.Color('#00FFFF'), 
						new THREE.Color('#000000'), 
						new THREE.Color('#0000FF'), new THREE.Color('#bcf60c'), new THREE.Color('#fabebe'), new THREE.Color('#008080'), new THREE.Color('#e6beff'), new THREE.Color('#9a6324'), new THREE.Color('#fffac8'), new THREE.Color('#800000'), new THREE.Color('#aaffc3'), new THREE.Color('#808000'), new THREE.Color('#ffd8b1'), new THREE.Color('#000075'), new THREE.Color('#808080'), new THREE.Color('#ffffff'), new THREE.Color('#000000')];
	
	var RGB_MODE = 0;
	var HSL_MODE = 1;
	var visualizeMode = RGB_MODE;
	var sphere1, sphere2, sphere3;
	var cube1, cube2, cube3;
	var color1 = new THREE.Color();
	var color2 = new THREE.Color();
	var color3 = new THREE.Color();
	var color1Mesh = new THREE.MeshPhongMaterial({side: THREE.DoubleSide, color: color1});
	var color2Mesh = new THREE.MeshPhongMaterial({side: THREE.DoubleSide, color: color2});
	var color3Mesh = new THREE.MeshPhongMaterial({side: THREE.DoubleSide, color: color3});
	var blendColor = new THREE.Color(), blendColorMesh = new THREE.MeshPhongMaterial({side: THREE.DoubleSide, color: blendColor});
	var RGBCubeSize = 20;
	var HSLConeRadius = 15;
	var HSLConeHeight = 15;
	var RGBCube, HSLCone;
	var zBufferOffset = .05;

	return {
		
		settings: {
			activateLightHelpers: false,
			axesHelper: {
				activateAxesHelper: false,
				axisLength: 10
			},
			showFloor: true,
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
			messageDuration: 2000,
			errorLogging: false,
			defaultCameraLocation: {
				x: 0,
				y: 40,
				z: 40
			},
			UI: {
				ColorInput1: '#FFFFFF',
				ColorInput2: '#FFFFFF',
				ColorSpace: 'RGB',
				Exposure: 0.0,
				ColorOutputMode: 'Blend'
			}
		},
		
		init: function() {

			let self = this;
			self.loadFont();
			self.setUpButtons();
		},
		
		begin: function() {
			
			let self = this;
			
			self.setUpScene();
			self.enableControls();
			self.resizeRendererOnWindowResize();
			self.setUpLights();
			self.addGeometries();
			self.addInputUI();
			self.renderTitle();
			self.addBackgroundGeometries();
			self.updateModeEvents();
			if (self.settings.showFloor) {
				self.addFloor();
			}
			
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
			color1Mesh.color = color1;
			
			
			sphere1.material = color1Mesh;
			this.setColorPositions(sphere1, color1);
			
			let outputColor = this.getOutputColor(color1, color2);
			this.setOutputColor(outputColor);
		},
		
		setColor2: function(color) {
			
			let color2Element = document.querySelector('#color2');
			color2Element.style.backgroundColor = color;
			color2.set(color);
			color2Mesh.color = color2;
			
			sphere2.material = color2Mesh;
			this.setColorPositions(sphere2, color2);

			let outputColor = this.getOutputColor(color1, color2);
			this.setOutputColor(outputColor);
		},
		
		getOutputColor: function(colorInput1, colorInput2) {
			
			let outputColor = new THREE.Color();
			let blendedColor = this.getBlendedColor(colorInput1, colorInput2);
			let complementaryColor = this.getComplementaryColor(blendedColor);
			if (this.settings.UI.ColorOutputMode === 'Blend') {
				outputColor = blendedColor;
			}
			if (this.settings.UI.ColorOutputMode === 'Background') {
				outputColor = complementaryColor;
			}
			
			return outputColor;
		},
		
		setColorPositions: function(colorMesh, color) {
			
			if (visualizeMode == RGB_MODE)
			{
				this.setPosByRGB(colorMesh, color);
			}
			else
			{
				this.setPosByHSL(colorMesh, color);
			}
		},
		
		logColor: function(color, message) {
			message = message || '';
			let hex = color.getHexString();
			console.log('%c' + message + '                                                                                                                                 ', 'background: #' + hex + ';');
		},
		
		setOutputColor: function(color) {
			
			let color3Element = document.querySelector('#color3');
			color3Element.style.backgroundColor = '#' + color.getHexString();
			
			color3.set(color);
			color3Mesh.color = color3;
			
			sphere3.material = color3Mesh;

			if (visualizeMode == RGB_MODE)
			{
				this.setPosByRGB(sphere3, color3);
			}
			else
			{
				this.setPosByHSL(sphere3, color3);
			}
		},
		
		getBlendedColor: function(color1, color2) {
			let lab1 = this.RGB2Lab(color1);
			let lab2 = this.RGB2Lab(color2);
			let mid = this.getMidpoint(lab1, lab2);
			let c = this.Lab2RGB(mid);
			return new THREE.Color('#' + c.getHexString());
		},

		setPosByRGB: function(mesh, color)
		{
			mesh.position.setX((color.r-0.5)*RGBCubeSize);
			mesh.position.setY((color.g-0.5)*RGBCubeSize);
			mesh.position.setZ((color.b-0.5)*RGBCubeSize);
		},

		setPosByHSL: function(mesh, color)
		{
			let hsl = color.getHSL(color);
			let r = HSLConeRadius * (1 - 2*Math.abs(hsl.l - 0.5));
			let x = r * Math.sin(-hsl.h * Math.PI * 2);
			let z = r * Math.cos(hsl.h * Math.PI * 2);
			let y = hsl.l * HSLConeHeight * 2 - 0.5 * HSLConeHeight;

			mesh.position.setX(x);
			mesh.position.setY(y);
			mesh.position.setZ(z);
		},

		setExposure: function(ex) {
			let change = ex / 100.0; // just a small change
			
			// set cube colors
			let scale = Math.pow(2.0, change);
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
			
			if (visualizeMode == RGB_MODE)
			{
				this.setPosByRGB(cube1, c1);
				this.setPosByRGB(cube2, c2);
				this.setPosByRGB(cube3, c3);
			}
			else
			{
				this.setPosByHSL(cube1, c1);
				this.setPosByHSL(cube2, c2);
				this.setPosByHSL(cube3, c3);
			}
		},

		setColorSpace: function(mode) {
			visualizeMode = mode
			HSLCone.traverse ( function (child) {
				if (child instanceof THREE.Mesh || child instanceof THREE.Points) {
					child.visible = (mode == HSL_MODE);
				}
			});
			RGBCube.traverse ( function (child) {
				if (child instanceof THREE.Mesh || child instanceof THREE.Points) {
					child.visible = (mode == RGB_MODE);
				}
			});

			if (mode == HSL_MODE)
			{
				this.setPosByHSL(sphere1, color1);
				this.setPosByHSL(sphere2, color2);
				this.setPosByHSL(sphere3, color3);
			}
			else
			{
				this.setPosByRGB(sphere1, color1);
				this.setPosByRGB(sphere2, color2);
				this.setPosByRGB(sphere3, color3);
			}
		},
		
		hideMesh: function(object) {
			
			object.traverse(function(child) {
				if (child instanceof THREE.Mesh) {
					child.visible = false;
				}
			});
		},
		
		showMesh: function(object) {
			
			object.traverse(function(child) {
				if (child instanceof THREE.Mesh) {
					child.visible = true;
				}
			});
		},
		
		addInputUI: function() {
			
			let self = this;
			
			let gui = new dat.GUI();
			gui.domElement.parentElement.classList.add('color-1-picker');

			gui.addColor(self.settings.UI, 'ColorInput1').onChange(function(event) {

				let colorObj = new THREE.Color(self.settings.UI.ColorInput1);
				let hex = colorObj.getHexString();
				self.setColor1(self.settings.UI.ColorInput1);
			});
			
			gui.addColor(self.settings.UI, 'ColorInput2').onChange(function(event) {

				let colorObj = new THREE.Color(self.settings.UI.ColorInput2);
				let hex = colorObj.getHexString();
				self.setColor2(self.settings.UI.ColorInput2);
			});

			gui.add(self.settings.UI, 'Exposure', -100, 100).onChange(function(event) {

				self.setExposure(self.settings.UI.Exposure);
				self.showMesh(cube1);
				self.showMesh(cube2);
				self.showMesh(cube3);
			});

			gui.add(self.settings.UI, 'ColorSpace', ['RGB', 'HSL']).onChange(function(event) {
				
				self.setColorSpace(self.settings.UI.ColorSpace === 'RGB' ? RGB_MODE : HSL_MODE);
				self.updateModeEvents();
			});
			
			gui.add(self.settings.UI, 'ColorOutputMode', ['Blend', 'Background', 'Accent', 'Triad']).onChange(function(event) {
				self.settings.UI.ColorOutputMode = event;
				self.updateModeEvents();
			});
		},
		
		updateModeEvents: function() {
			
			if (this.settings.UI.ColorOutputMode === 'Blend') {
				this.showMesh(sphere3);
			}
			else {
				this.hideMesh(sphere3);
			}
			if (this.settings.UI.ColorOutputMode === 'Background') {
				backgroundSwatch1.material.color = color1Mesh.color;
				backgroundSwatch2.material.color = color2Mesh.color;
				backgroundBase.material.color = color3Mesh.color;
				
				this.showMesh(backgroundSwatch1);
				this.showMesh(backgroundSwatch2);
				this.showMesh(backgroundBase);
				translucentMaterial.color = color3;
				
				HSLCone.children.forEach(function(child) {
					if (child instanceof THREE.Mesh) {
						let seeThrough = child.clone();
						seeThrough.material = translucentMaterial;
						HSLCone.children.push(seeThrough);
					}
				});
			}
			else { // Not background mode
				this.hideMesh(backgroundBase);
				this.hideMesh(backgroundSwatch1);
				this.hideMesh(backgroundSwatch2);
				
				HSLCone.children = HSLCone.children.filter(function(child) {
					if (child.material !== translucentMaterial) return true;
				});
			}
			
			if (this.settings.UI.ColorSpace === 'HSL') { // If switching to background mode while in HSL, don't show
				this.hideMesh(backgroundBase);
				this.hideMesh(backgroundSwatch1);
				this.hideMesh(backgroundSwatch2);
			}
		},
		
		addBackgroundGeometries: function() {
			
			let planeGeometry = new THREE.PlaneGeometry(RGBCubeSize, RGBCubeSize, 1);
			planeGeometry.translate(0, RGBCubeSize/2, -(RGBCubeSize/2) + zBufferOffset);
			
			backgroundBase = new THREE.Mesh(planeGeometry, color3Mesh);
			scene.add(backgroundBase);
			
			let inputSwatchSize = RGBCubeSize/3;
			planeGeometry = new THREE.PlaneGeometry(inputSwatchSize, inputSwatchSize, 1);
			planeGeometry.translate(-2 * inputSwatchSize / 3, RGBCubeSize - (5 * inputSwatchSize / 6), -(RGBCubeSize/2) + 5 * zBufferOffset);
			backgroundSwatch1 = new THREE.Mesh(planeGeometry, color1Mesh);
			scene.add(backgroundSwatch1);
			
			planeGeometry = new THREE.PlaneGeometry(inputSwatchSize, inputSwatchSize, 1);
			planeGeometry.translate(inputSwatchSize - inputSwatchSize / 3, inputSwatchSize / 2 + inputSwatchSize / 3, -(RGBCubeSize/2) +  3 * zBufferOffset);
			
			backgroundSwatch2 = new THREE.Mesh(planeGeometry, color2Mesh);
			scene.add(backgroundSwatch2);
			this.hideMesh(backgroundSwatch1);
			this.hideMesh(backgroundSwatch2);
		},
		
		getComplementaryColor: function(color) {
			let result = new THREE.Color(color).clone();
			result = result.offsetHSL(.5, 0, 0); // Hue shift by 180 degrees
			return result;
		},
		
		addGeometries: function() {
			
			let self = this;

			RGBCube = new THREE.Object3D();
			scene.add(RGBCube);
			let geometry = new THREE.BoxGeometry(RGBCubeSize, RGBCubeSize, RGBCubeSize);
			geometry.translate(0, RGBCubeSize/2, 0);
			geometry.translate(0, zBufferOffset, 0);
			let cube = new THREE.Mesh(geometry, wireframeMaterial);
			RGBCube.add(cube);
			self.showPoints(geometry, distinctColors, 1.0, RGBCube);
			
			self.labelRGBCubeVertices(geometry);

			HSLCone = new THREE.Object3D();
			scene.add(HSLCone);
			geometry = new THREE.ConeGeometry(HSLConeRadius, HSLConeHeight, 6);
			geometry.translate(0, 3*HSLConeHeight/2, 0);
			let cone = new THREE.Mesh(geometry, wireframeMaterial);
			self.labelPoint({x: geometry.vertices[0].x + 3, y: geometry.vertices[0].y, z: geometry.vertices[0].z}, 'Luminance 100%', new THREE.Color('black'), HSLCone);
			HSLCone.add(cone);
			let HSLColors = [new THREE.Color("hsl(0, 100%, 100%)"),
							new THREE.Color("hsl(0, 100%, 50%)"),
							new THREE.Color("hsl(300, 100%, 50%)"),
							new THREE.Color("hsl(240, 100%, 50%)"),
							new THREE.Color("hsl(180, 100%, 50%)"),
							new THREE.Color("hsl(120, 100%, 50%)"),
							new THREE.Color("hsl(60, 100%, 50%)"),
							new THREE.Color("hsl(0, 0%, 50%)")];
			self.showPoints(geometry, HSLColors, 1.0, HSLCone);

			geometry = new THREE.ConeGeometry(HSLConeRadius, HSLConeHeight, 6);
			geometry.rotateX(Math.PI);
			geometry.translate(0, HSLConeHeight/2, 0);
			cone = new THREE.Mesh(geometry, wireframeMaterial);
			HSLCone.add(cone);
			self.showPoint(geometry.vertices[0], new THREE.Color("hsl(0, 0%, 0%)"), 1.0, HSLCone);
			self.labelPoint({x: geometry.vertices[0].x + 3, y: geometry.vertices[0].y, z: geometry.vertices[0].z}, 'Luminance 0%', new THREE.Color('black'), HSLCone);
			
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
			
			// Hide exposure cubes until user changes exposure value
			this.hideMesh(cube1);
			this.hideMesh(cube2);
			this.hideMesh(cube3);
			
			// hide one of color space reference frames
			this.setColorSpace(visualizeMode);
		},
		
		labelRGBCubeVertices: function(geometry) {
			
			// Label Cube Vertices
			for (let i = 0; i < geometry.vertices.length; i++) {
				let label = 'RGB(' + (distinctColors[i].r * 255).toString() + ', ' + (distinctColors[i].g * 255).toString() + ', ' + (distinctColors[i].b * 255).toString() + ')';
				let location = geometry.vertices[i].clone();
				
				if (i > 3) {
					location.x -= 13;
				}
				else {
					location.x += 3;
				}
				this.labelPoint(location, label, new THREE.Color('black'), RGBCube);
			}
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
			
			grid.material.color = new THREE.Color('#ccc');
			scene.background = new THREE.Color(0xf0f0f0);
			grid.material.opacity = .2;
			grid.material.transparent = true;
			scene.add(grid);
		},

		setUpScene: function() {

			let self = this;
			scene = new THREE.Scene();
			scene.background = new THREE.Color(0xf0f0f0);
			camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 1, 1000);
			renderer = new THREE.WebGLRenderer();
			renderer.setSize(window.innerWidth, window.innerHeight);
			document.body.appendChild(renderer.domElement);
			this.setCameraLocation(self.settings.defaultCameraLocation);

			if (self.settings.axesHelper.activateAxesHelper) {

				self.activateAxesHelper();
			}
		},
		
		showPoints: function(geometry, color, opacity, parent=scene) {
			
			let self = this;
			
			for (let i = 0; i < geometry.vertices.length; i++) {
				if (Array.isArray(color)) {
					self.showPoint(geometry.vertices[i], color[i], opacity, parent);
				}
				else {
					self.showPoint(geometry.vertices[i], color, opacity, parent);
				}
			}
		},
		
		showPoint: function(pt, color, opacity, parent=scene) {
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
			parent.add(dot);
		},
		
		showVector: function(vector, origin, color, parent=scene) {
			
			color = color || 0xff0000;
			let arrowHelper = new THREE.ArrowHelper(vector, origin, vector.length(), color);
			parent.add(arrowHelper);
		},
		
		drawLine: function(pt1, pt2, parent=scene) {
			
			let material = new THREE.LineBasicMaterial({ color: 0x0000ff });
			let geometry = new THREE.Geometry();
			geometry.vertices.push(new THREE.Vector3(pt1.x, pt1.y, pt1.z));
			geometry.vertices.push(new THREE.Vector3(pt2.x, pt2.y, pt2.z));
			
			let line = new THREE.Line(geometry, material);
			parent.add(line);
		},
		
		getDistance: function(pt1, pt2) {
			
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
		
		activateAxesHelper: function(parent=scene) {
			
			let self = this;
			let axesHelper = new THREE.AxesHelper(self.settings.axesHelper.axisLength);
			parent.add(axesHelper);
		},
		
		labelAxes: function(parent=scene) {
			
			let self = this;
			if (self.settings.font.enable) {
				let textGeometry = new THREE.TextGeometry('Y', self.settings.font.fontStyle);
				let textMaterial = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
				let mesh = new THREE.Mesh(textGeometry, textMaterial);
				textGeometry.translate(0, self.settings.axesHelper.axisLength, 0);
				parent.add(mesh);
				
				textGeometry = new THREE.TextGeometry('X', self.settings.font.fontStyle);
				textMaterial = new THREE.MeshBasicMaterial({ color: 0xff0000 });
				mesh = new THREE.Mesh(textGeometry, textMaterial);
				textGeometry.translate(self.settings.axesHelper.axisLength, 0, 0);
				parent.add(mesh);
				
				textGeometry = new THREE.TextGeometry('Z', self.settings.font.fontStyle);
				textMaterial = new THREE.MeshBasicMaterial({ color: 0x0000ff });
				mesh = new THREE.Mesh(textGeometry, textMaterial);
				textGeometry.translate(0, 0, self.settings.axesHelper.axisLength);
				parent.add(mesh);
			}
		},
		
		loadFont: function() {
			
			let self = this;
			let loader = new THREE.FontLoader();
			let fontPath = '';
			fontPath = 'assets/vendors/js/three.js/examples/fonts/helvetiker_regular.typeface.json';

			loader.load(fontPath, function(font) { // success event
				
				if (self.settings.errorLogging) console.log('Fonts loaded successfully.');
				self.settings.font.fontStyle.font = font;
				
				self.begin();
				if (self.settings.axesHelper.activateAxesHelper) self.labelAxes();
			},
			function(event) { // in progress event.
				if (self.settings.errorLogging) console.log('Attempting to load fonts.')
			},
			function(event) { // error event
				
				if (self.settings.errorLogging) console.log('Error loading fonts. Webserver required due to CORS policy.');
				self.settings.font.enable = false;
				self.begin();
			});
		},
		
		/* 	Inputs: pt - point in space to label, in the form of object with x, y, and z properties; label - text content for label; color - optional */
		labelPoint: function(pt, label, color, parent=scene) {
			
			let self = this;
			if (self.settings.font.enable) {
				color = color || 0xff0000;
				let textGeometry = new THREE.TextGeometry(label, self.settings.font.fontStyle);
				let textMaterial = new THREE.MeshBasicMaterial({ color: color });
				let mesh = new THREE.Mesh(textGeometry, textMaterial);
				textGeometry.translate(pt.x, pt.y, pt.z);
				parent.add(mesh);
			}
		},
		
		setUpButtons: function() {
			
			let self = this;
			let message = document.getElementById('message');
			
			document.addEventListener('keyup', function(event) {
				
				let esc = 27;
				
				if (event.keyCode === esc) {
					
					self.resetScene();
					
					message.textContent = 'Reset scene';
					setTimeout(function() {
						message.textContent = '';
					}, self.settings.messageDuration);
				}
			});
		},
		
		resetScene: function() {
			
			let self = this;
			
			for (let i = scene.children.length - 1; i >= 0; i--) {
				let obj = scene.children[i];
				scene.remove(obj);
			}
			
			color1 = new THREE.Color();
			color2 = new THREE.Color();
			color3 = new THREE.Color();
			
			self.addFloor();
			self.addGeometries();
			self.setUpLights();
			self.setCameraLocation(self.settings.defaultCameraLocation);
		},
		
		setCameraLocation: function(pt) {
			camera.position.x = pt.x;
			camera.position.y = pt.y;
			camera.position.z = pt.z;
		},
		
		getCentroid: function(geometry) {
			
			let result = {};
			let x = 0, y = 0, z = 0;
			
			for (let i = 0; i < geometry.vertices.length; i++) {
				
				x += geometry.vertices[i].x;
				y += geometry.vertices[i].y;
				z += geometry.vertices[i].z;
			}
			
			x = x / geometry.vertices.length;
			y = y / geometry.vertices.length;
			z = z / geometry.vertices.length;
			result = { x: x, y: y, z: z};
			return result;
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
			let r = Math.min(color.r, 0.99);
			let g = Math.min(color.g, 0.99);
			let b = Math.min(color.b, 0.99);
			let x = (   0.49*r +    0.31*g + 0.2*b) / 0.17697;
			let y = (0.17697*r + 0.81240*g + 0.01063*b) / 0.17697;
			let z = (               0.01*g + 0.99*b) / 0.17697;
			return new THREE.Vector3(x, y, z);
		},

		XYZ2RGB: function(c) // c is Vector3
		{
			let r = Math.min((0.41847*c.x-0.15866*c.y-0.082835*c.z), 0.99);
			let g = Math.min((-0.091169*c.x+0.25243*c.y+0.015708*c.z), 0.99);
			let b = Math.min((0.00092090*c.x-0.0025498*c.y+0.1786*c.z), 0.99);
			return new THREE.Color(r, g, b);
		},

		RGB2Lab: function(color)
		{
			let xyz = this.RGB2XYZ(color);
			let xn=95.05;
			let yn=100;
			let zn=108.88;
			let f = function(t) {
				let d=6.0/29.0;
				if (t > d*d*d)
					return Math.pow(t, 1.0/3.0);
				else
					return t / (3 * d * d) + 4.0/29.0;
			};
			let fx = f(xyz.x / xn);
			let fy = f(xyz.y / yn);
			let fz = f(xyz.z / zn);
			let L = 116*fy - 16;
			let a = 500*(fx - fy);
			let b = 200*(fy - fz);
			return new THREE.Vector3(L, a, b);
		},

		Lab2RGB: function(c) {
			let f = function(t) {
				let d=6.0/29.0;
				if (t > d)
					return t*t*t;
				else
					return 3*d*d*(t-4.0/29.0);
			};
			let xn=95.05;
			let yn=100;
			let zn=108.88;
			let x = xn * f((c.x+16.0)/116 + c.y/500.0);
			let y = yn * f((c.x+16.0)/116);
			let z = zn * f((c.x+16.0)/116 - c.z/200.0);
			return this.XYZ2RGB(new THREE.Vector3(x, y, z));
		},
		
		renderTitle: function() {
			
			if (this.settings.font.enable) {
				let textGeometry = new THREE.TextGeometry('Exploring 3D Color Space', this.settings.font.fontStyle);
				let textMaterial = new THREE.MeshBasicMaterial({ color: new THREE.Color('black') });
				let mesh = new THREE.Mesh(textGeometry, textMaterial);
				textGeometry.translate(-RGBCubeSize/2.5, 0, RGBCubeSize * 2);
				scene.add(mesh);
			}
		}
	}
}