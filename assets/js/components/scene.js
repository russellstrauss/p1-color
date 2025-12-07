const THREE = require('three');
const { OrbitControls } = require('three/examples/jsm/controls/OrbitControls.js');
const { FontLoader } = require('three/examples/jsm/loaders/FontLoader.js');
const { TextGeometry } = require('three/examples/jsm/geometries/TextGeometry.js');

module.exports = function() {
	
	var renderer, scene, camera, controls;
	var grid = new THREE.GridHelper(1000, 100);
	var stats = null;
	var wireframeMaterial = new THREE.MeshBasicMaterial({ wireframe: true, color: 0x08CDFA });
	var translucentMaterial = new THREE.MeshBasicMaterial({transparent: true, opacity: .3, color: 0x08CDFA });
	var backgroundBase = new THREE.Mesh();
	var backgroundSwatch1 = new THREE.Mesh();
	var backgroundSwatch2 = new THREE.Mesh();
	var shadeMaterial = new THREE.MeshPhongMaterial({
		side: THREE.DoubleSide
	});
	var backgroundColor = new THREE.Color('#F0F0F0');
	var white = new THREE.Color('#FFFFFF');
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
	var dot1, dot2, dot3;
	var color1 = new THREE.Color();
	var color2 = new THREE.Color();
	var color3 = new THREE.Color();
	var color1Mesh = new THREE.MeshPhongMaterial({side: THREE.DoubleSide, color: new THREE.Color(color1)});
	var color2Mesh = new THREE.MeshPhongMaterial({side: THREE.DoubleSide, color: new THREE.Color(color2)});
	var color3Mesh = new THREE.MeshPhongMaterial({side: THREE.DoubleSide, color: new THREE.Color(color3)});
	var blendColor = new THREE.Color(), blendColorMesh = new THREE.MeshPhongMaterial({side: THREE.DoubleSide, color: blendColor});
	var RGBCubeSize = 20;
	var HSLConeRadius = 15;
	var HSLConeHeight = 15;
	var RGBCube, HSLCone;
	var zBufferOffset = .05;

	// Helper function to get vertices from BufferGeometry
	function getVerticesFromBufferGeometry(geometry) {
		const positionAttribute = geometry.getAttribute('position');
		const vertices = [];
		for (let i = 0; i < positionAttribute.count; i++) {
			vertices.push(new THREE.Vector3(
				positionAttribute.getX(i),
				positionAttribute.getY(i),
				positionAttribute.getZ(i)
			));
		}
		return vertices;
	}

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
					depth: 0,
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
				LuminanceScale: 50.0,
				scaleLuminance: false,
				ColorOutputMode: 'Blend'
			},
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
			
			if (self.settings.activateStatsFPS && stats) {
				self.enableStats();
			}
			
			var animate = function() {
				requestAnimationFrame(animate);
				renderer.render(scene, camera);
				controls.update();
				if (stats) stats.update();
			};
			
			animate();
		},
		
		scaleColorLuminance: function(color) {
			
			let colorObj = new THREE.Color(color);
			let hsl = {};
			colorObj.getHSL(hsl);
			colorObj.setHSL(hsl.h, hsl.s, (this.settings.UI.LuminanceScale/100));
			
			return colorObj;
		},
		
		setColor1: function(color) {
			
			let color1Element = document.querySelector('#color1');
			let result = new THREE.Color(color);
			if (this.settings.UI.scaleLuminance) result = this.scaleColorLuminance(color);
			color1Element.style.backgroundColor = '#' + result.getHexString();
			color1.set(result);
			color1Mesh.color.set(color1);
			
			if (dot1) {
				this.setColorPositions(dot1, color1);
				dot1.material.color = color1;
			}
			
			let outputColor = this.getOutputColor(color1, color2);
			this.setOutputColor(outputColor);
		},
		
		setColor2: function(color) {
			
			let color2Element = document.querySelector('#color2');
			let result = new THREE.Color(color);
			if (this.settings.UI.scaleLuminance) result = this.scaleColorLuminance(color);
			color2Element.style.backgroundColor = '#' + result.getHexString();
			color2.set(result);
			color2Mesh.color.set(color2);
			
			if (dot2) {
				this.setColorPositions(dot2, color2);
				dot2.material.color = color2;
			}

			let outputColor = this.getOutputColor(color1, color2);
			this.setOutputColor(outputColor);
		},
		
		getOutputColor: function(colorInput1, colorInput2) {
			
			let outputColor = new THREE.Color();
			let blendedColor = this.getBlendedColor(colorInput1, colorInput2);
			let complementaryColor = this.getComplementaryColor(blendedColor);
			let triadColor = this.getTriadColor(colorInput1, colorInput2);
			if (this.settings.UI.ColorOutputMode === 'Blend') {
				outputColor = blendedColor;
			}
			else if (this.settings.UI.ColorOutputMode === 'Background') {
				outputColor = complementaryColor;
			}
			else if (this.settings.UI.ColorOutputMode === 'Accent') {
				outputColor = this.getAccentColor(colorInput1, colorInput2);
			}
			else if (this.settings.UI.ColorOutputMode === 'Triad') {
				outputColor = this.getTriadColor(colorInput1, colorInput2);
			}
			
			return outputColor;
		},
		
		setOutputColor: function(color) {
			
			if (color) {
				
				let color3Element = document.querySelector('#color3');
				color3Element.style.backgroundColor = '#' + color.getHexString();
				color3.set(color);
				color3Mesh.color.set(color3);
				
				if (dot3) {
					this.setColorPositions(dot3, color3);
					dot3.material.color = color3;
				}
			}
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
		
		repeat: function(x, a) {
			return x - Math.floor(x / a) * a;
		},
		
		deltaAngle: function(x, y, range) {
			var num = this.repeat(y - x, range);
			if (num > range * 0.5)
				num -= range;
			return num;
		},
		
		getBlendedColor: function(color1, color2) {
			let lab1 = this.RGB2Lab(color1);
			let lab2 = this.RGB2Lab(color2);
			let mid = this.getMidpoint(lab1, lab2);
			let c = this.Lab2RGB(mid);
			return new THREE.Color('#' + c.getHexString());
		},
		
		getComplementaryColor: function(color) {
			let result = new THREE.Color(color).clone();
			result = result.offsetHSL(.5, 0, 0); // Hue shift by 180 degrees
			return result;
		},

		getAccentColor: function(color1, color2) {
			let output = new THREE.Color();
			let hsl1 = {};
			let hsl2 = {};
			color1.getHSL(hsl1);
			color2.getHSL(hsl2);

			// 1. luminance
			let threshold_delta_luminance = 0.2;
			var h, s, l;
			let ave_l = (hsl1.l + hsl2.l) / 2;
			if (Math.abs(hsl1.l - hsl2.l) < threshold_delta_luminance) {
				// input colors are close in luminance
				let delta_l = 0.3;
				if (ave_l > 1 - threshold_delta_luminance*0.5 - delta_l) {
					// inputs are very bright
					l = ave_l - delta_l;
				}
				else {
					l = ave_l + delta_l;
				}

			}
			else {
				l = ave_l;
			}

			let ave_h = (hsl1.h + hsl2.h) * 0.5;
			h = ave_h;
			if (Math.abs(this.deltaAngle(ave_h, hsl1.h, 1.0)) < 0.25)
				h = ave_h + 0.5;
			h = this.repeat(h, 1.0);

			// 3. saturation
			let ave_s = (hsl1.s + hsl2.s) * 0.5;
			s = ave_s;
			let threshold_saturation = 0.3;
			if (ave_s < threshold_saturation)
				s += 0.5;

			output.setHSL(h, s, l);
			console.log(h,s,l);
			return output;
		},
		
		getTriadColor: function(color1, color2) {
			let hsl1 = {};
			let hsl2 = {};
			color1.getHSL(hsl1);
			color2.getHSL(hsl2);
			
			let angle = this.deltaAngle(hsl1.h, hsl2.h, 1.0);
			let triad = new THREE.Color(color1);
			triad.offsetHSL(hsl2.h + angle, 0, 0); // Hue shift by the difference in angle on color wheel between 2 color inputs
			return triad;
		},

		setPosByRGB: function(mesh, color) {
			mesh.position.setX((color.r-0.5)*RGBCubeSize);
			mesh.position.setY((color.g-0.5)*RGBCubeSize);
			mesh.position.setZ((color.b-0.5)*RGBCubeSize);
		},

		setPosByHSL: function(mesh, color)
		{
			let hsl = {};
			color.getHSL(hsl);
			let r = HSLConeRadius * (1 - 2*Math.abs(hsl.l - 0.5)) * hsl.s;
			let x = r * Math.sin(-hsl.h * Math.PI * 2);
			let z = r * Math.cos(hsl.h * Math.PI * 2);
			let y = hsl.l * HSLConeHeight * 2 - 0.5 * HSLConeHeight;

			mesh.position.setX(x);
			mesh.position.setY(y);
			mesh.position.setZ(z);
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
				this.setPosByHSL(dot1, color1);
				this.setPosByHSL(dot2, color2);
				this.setPosByHSL(dot3, color3);
			}
			else {
				this.setPosByRGB(dot1, color1);
				this.setPosByRGB(dot2, color2);
				this.setPosByRGB(dot3, color3);
			}
		},
		
		hideMesh: function(object) {
			
			if (object) object.traverse(function(child) {
				if (child instanceof THREE.Mesh) {
					child.visible = false;
				}
			});
		},
		
		showMesh: function(object) {
			
			if (object) object.traverse(function(child) {
				if (child instanceof THREE.Mesh) {
					child.visible = true;
				}
			});
		},
		
		updateColors: function() {
			
			this.setColor1(this.settings.UI.ColorInput1);
			this.setColor2(this.settings.UI.ColorInput2);
			this.setColorPositions(dot1, color1);
			this.setColorPositions(dot2, color2);
			this.setColorPositions(dot3, color3);
		},
		
		setGUIValue: function(gui, input, value) {
			
			gui.__controllers.forEach(function(controller) {
				if (controller.property === input) {
					controller.setValue(value);
				}
			});
		},
		
		addInputUI: function() {
			
			let self = this;
			
			let gui = new dat.GUI();
			gui.domElement.parentElement.classList.add('color-1-picker');
			
			let setReadonly = function(input) { // set input field to read only so clicking a colorpicker does not open keyboard
				input.setAttribute('readonly', 'true');
			};

			gui.addColor(self.settings.UI, 'ColorInput1').onChange(function(event) {
				
				self.setGUIValue(gui, 'LuminanceScale', 50);
				self.settings.UI.scaleLuminance = false;
				self.updateColors();
			});
			
			gui.addColor(self.settings.UI, 'ColorInput2').onChange(function(event) {
				
				self.setGUIValue(gui, 'LuminanceScale', 50);
				self.settings.UI.scaleLuminance = false;
				self.updateColors();
			});
			
			gui.add(self.settings.UI, 'LuminanceScale', 0.0, 100.0).onChange(function(event) {
				
				self.settings.UI.scaleLuminance = true;
				self.settings.UI.LuminanceScale = parseFloat(event);
				self.updateColors();
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
			
			if (this.settings.UI.ColorOutputMode === 'Blend' || this.settings.UI.ColorOutputMode === 'Accent' || this.settings.UI.ColorOutputMode === 'Triad') {
				this.showMesh(dot3);
			}
			else {
				this.hideMesh(dot3);
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
				
				HSLCone.children = HSLCone.children.filter(function(child) { // get rid of translucent material used for BG on HSLCone
					if (child.material !== translucentMaterial) return true;
				});
			}
			
			if (this.settings.UI.ColorSpace === 'HSL') { // If switching to background mode while in HSL, don't show the cube BG's
				this.hideMesh(backgroundBase);
				this.hideMesh(backgroundSwatch1);
				this.hideMesh(backgroundSwatch2);
			}

			this.setColor1(color1);
			this.setColor2(color2);
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
		
		addGeometries: function() {
			
			let self = this;

			RGBCube = new THREE.Object3D();
			scene.add(RGBCube);
			let geometry = new THREE.BoxGeometry(RGBCubeSize, RGBCubeSize, RGBCubeSize);
			geometry.translate(0, RGBCubeSize/2, 0);
			geometry.translate(0, zBufferOffset, 0);
			let cube = new THREE.Mesh(geometry, wireframeMaterial);
			RGBCube.add(cube);
			
			// Get vertices for BoxGeometry (8 corners)
			let cubeVertices = self.getBoxVertices(RGBCubeSize, RGBCubeSize/2 + zBufferOffset);
			self.showPointsFromArray(cubeVertices, distinctColors, 1.0, 10, RGBCube);
			self.labelRGBCubeVertices(cubeVertices);

			HSLCone = new THREE.Object3D();
			scene.add(HSLCone);
			geometry = new THREE.ConeGeometry(HSLConeRadius, HSLConeHeight, 6);
			geometry.translate(0, 3*HSLConeHeight/2, 0);
			let cone = new THREE.Mesh(geometry, wireframeMaterial);
			
			// Get cone apex position (top of translated cone)
			let coneApexTop = { x: 3, y: 2*HSLConeHeight, z: 0 };
			self.labelPoint(coneApexTop, 'Luminance 100%', new THREE.Color('black'), HSLCone);
			HSLCone.add(cone);
			
			let HSLColors = [new THREE.Color("hsl(0, 100%, 100%)"),
							new THREE.Color("hsl(0, 100%, 50%)"),
							new THREE.Color("hsl(300, 100%, 50%)"),
							new THREE.Color("hsl(240, 100%, 50%)"),
							new THREE.Color("hsl(180, 100%, 50%)"),
							new THREE.Color("hsl(120, 100%, 50%)"),
							new THREE.Color("hsl(60, 100%, 50%)"),
							new THREE.Color("hsl(0, 0%, 50%)")];
			
			// Get cone vertices
			let coneVertices = self.getConeVertices(HSLConeRadius, HSLConeHeight, 6, 3*HSLConeHeight/2);
			self.showPointsFromArray(coneVertices, HSLColors, 1.0, 10, HSLCone);

			geometry = new THREE.ConeGeometry(HSLConeRadius, HSLConeHeight, 6);
			geometry.rotateX(Math.PI);
			geometry.translate(0, HSLConeHeight/2, 0);
			cone = new THREE.Mesh(geometry, wireframeMaterial);
			HSLCone.add(cone);
			
			// Bottom cone apex
			let bottomApex = { x: 0, y: 0, z: 0 };
			self.showPoint(bottomApex, new THREE.Color("hsl(0, 0%, 0%)"), 1.0, 10, HSLCone);
			self.labelPoint({x: bottomApex.x + 3, y: bottomApex.y, z: bottomApex.z}, 'Luminance 0%', new THREE.Color('black'), HSLCone);
			
			let position = new THREE.Vector3(0, RGBCubeSize/2, 0);
			dot1 = self.showPoint(position, white, 1.0, 40);
			dot2 = self.showPoint(position, white, 1.0, 40);
			dot3 = self.showPoint(position, white, 1.0, 40);
			
			// hide one of color space reference frames
			this.setColorSpace(visualizeMode);
		},
		
		// Helper to get box corner vertices
		getBoxVertices: function(size, yOffset) {
			let half = size / 2;
			return [
				{ x: half, y: half + yOffset, z: half },
				{ x: half, y: half + yOffset, z: -half },
				{ x: half, y: -half + yOffset, z: half },
				{ x: half, y: -half + yOffset, z: -half },
				{ x: -half, y: half + yOffset, z: -half },
				{ x: -half, y: half + yOffset, z: half },
				{ x: -half, y: -half + yOffset, z: -half },
				{ x: -half, y: -half + yOffset, z: half }
			];
		},
		
		// Helper to get cone vertices
		getConeVertices: function(radius, height, segments, yOffset) {
			let vertices = [];
			// Apex
			vertices.push({ x: 0, y: height/2 + yOffset, z: 0 });
			// Base vertices
			for (let i = 0; i < segments; i++) {
				let angle = (i / segments) * Math.PI * 2;
				vertices.push({
					x: radius * Math.cos(angle),
					y: -height/2 + yOffset,
					z: radius * Math.sin(angle)
				});
			}
			// Center of base (for the extra color)
			vertices.push({ x: 0, y: -height/2 + yOffset, z: 0 });
			return vertices;
		},
		
		labelRGBCubeVertices: function(vertices) {
			
			// Label Cube Vertices
			for (let i = 0; i < vertices.length; i++) {
				let label = 'RGB(' + (distinctColors[i].r * 255).toString() + ', ' + (distinctColors[i].g * 255).toString() + ', ' + (distinctColors[i].b * 255).toString() + ')';
				let location = { x: vertices[i].x, y: vertices[i].y, z: vertices[i].z };
				
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
			controls = new OrbitControls(camera, renderer.domElement);
			controls.target.set(0, 0, 0);
			controls.enableDamping = true; // an animation loop is required when either damping or auto-rotation are enabled
			controls.dampingFactor = 0.05;
			controls.zoomSpeed = 6;
			controls.enablePan = !utils.mobile();
			controls.minDistance = 18;
			controls.maxDistance = 200;
			controls.maxPolarAngle = Math.PI / 2;
		},

		enableStats: function() {
			if (stats) document.body.appendChild(stats.dom);
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
			grid.material.opacity = .2;
			grid.material.transparent = true;
			scene.add(grid);
		},

		setUpScene: function() {

			let self = this;
			scene = new THREE.Scene();
			scene.background = new THREE.Color();
			scene.background.set(backgroundColor);
			camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 1, 1000);
			renderer = new THREE.WebGLRenderer();
			renderer.setSize(window.innerWidth, window.innerHeight);
			document.body.appendChild(renderer.domElement);
			this.setCameraLocation(self.settings.defaultCameraLocation);

			if (self.settings.axesHelper.activateAxesHelper) {

				self.activateAxesHelper();
			}
		},
		
		showPointsFromArray: function(vertices, color, opacity, size, parent) {
			let self = this;
			parent = parent || scene;
			
			for (let i = 0; i < vertices.length; i++) {
				if (Array.isArray(color)) {
					self.showPoint(vertices[i], color[i], opacity, size, parent);
				}
				else {
					self.showPoint(vertices[i], color, opacity, size, parent);
				}
			}
		},
		
		showPoint: function(pt, color, opacity, size, parent) {
			color = color || 0xff0000;
			opacity = opacity || 1;
			parent = parent || scene;
			
			// Use BufferGeometry instead of deprecated Geometry
			let dotGeometry = new THREE.BufferGeometry();
			let vertices = new Float32Array([pt.x, pt.y, pt.z]);
			dotGeometry.setAttribute('position', new THREE.BufferAttribute(vertices, 3));
			
			let dotMaterial = new THREE.PointsMaterial({ 
				size: size,
				sizeAttenuation: false,
				color: color,
				opacity: opacity,
				transparent: true
			});
			let dot = new THREE.Points(dotGeometry, dotMaterial);
			parent.add(dot);
			return dot;
		},
		
		showVector: function(vector, origin, color, parent) {
			
			color = color || 0xff0000;
			parent = parent || scene;
			let arrowHelper = new THREE.ArrowHelper(vector, origin, vector.length(), color);
			parent.add(arrowHelper);
		},
		
		drawLine: function(pt1, pt2, parent) {
			
			parent = parent || scene;
			let material = new THREE.LineBasicMaterial({ color: 0x0000ff });
			
			// Use BufferGeometry instead of deprecated Geometry
			let geometry = new THREE.BufferGeometry();
			let vertices = new Float32Array([
				pt1.x, pt1.y, pt1.z,
				pt2.x, pt2.y, pt2.z
			]);
			geometry.setAttribute('position', new THREE.BufferAttribute(vertices, 3));
			
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
			// Use BufferGeometry instead of deprecated Geometry
			let triangleGeometry = new THREE.BufferGeometry();
			let vertices = new Float32Array([
				pt1.x, pt1.y, pt1.z,
				pt2.x, pt2.y, pt2.z,
				pt3.x, pt3.y, pt3.z
			]);
			triangleGeometry.setAttribute('position', new THREE.BufferAttribute(vertices, 3));
			triangleGeometry.setIndex([0, 1, 2]);
			triangleGeometry.computeVertexNormals();
			return triangleGeometry;
		},
		
		activateAxesHelper: function(parent) {
			
			let self = this;
			parent = parent || scene;
			let axesHelper = new THREE.AxesHelper(self.settings.axesHelper.axisLength);
			parent.add(axesHelper);
		},
		
		labelAxes: function(parent) {
			
			let self = this;
			parent = parent || scene;
			if (self.settings.font.enable && self.settings.font.fontStyle.font) {
				let textGeometry = new TextGeometry('Y', self.settings.font.fontStyle);
				let textMaterial = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
				let mesh = new THREE.Mesh(textGeometry, textMaterial);
				textGeometry.translate(0, self.settings.axesHelper.axisLength, 0);
				parent.add(mesh);
				
				textGeometry = new TextGeometry('X', self.settings.font.fontStyle);
				textMaterial = new THREE.MeshBasicMaterial({ color: 0xff0000 });
				mesh = new THREE.Mesh(textGeometry, textMaterial);
				textGeometry.translate(self.settings.axesHelper.axisLength, 0, 0);
				parent.add(mesh);
				
				textGeometry = new TextGeometry('Z', self.settings.font.fontStyle);
				textMaterial = new THREE.MeshBasicMaterial({ color: 0x0000ff });
				mesh = new THREE.Mesh(textGeometry, textMaterial);
				textGeometry.translate(0, 0, self.settings.axesHelper.axisLength);
				parent.add(mesh);
			}
		},
		
		loadFont: function() {
			
			let self = this;
			let loader = new FontLoader();
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
		labelPoint: function(pt, label, color, parent) {
			
			let self = this;
			parent = parent || scene;
			if (self.settings.font.enable && self.settings.font.fontStyle.font) {
				color = color || 0xff0000;
				let textGeometry = new TextGeometry(label, self.settings.font.fontStyle);
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
		
		getCentroid: function(vertices) {
			
			let result = {};
			let x = 0, y = 0, z = 0;
			
			for (let i = 0; i < vertices.length; i++) {
				
				x += vertices[i].x;
				y += vertices[i].y;
				z += vertices[i].z;
			}
			
			x = x / vertices.length;
			y = y / vertices.length;
			z = z / vertices.length;
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
			
			if (this.settings.font.enable && this.settings.font.fontStyle.font) {
				let textGeometry = new TextGeometry('Exploring 3D Color Space', this.settings.font.fontStyle);
				let textMaterial = new THREE.MeshBasicMaterial({ color: new THREE.Color('black') });
				let mesh = new THREE.Mesh(textGeometry, textMaterial);
				textGeometry.translate(-RGBCubeSize/2.5, 0, RGBCubeSize * 2);
				scene.add(mesh);
			}
		}
	}
}
