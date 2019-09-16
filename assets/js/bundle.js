(function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
"use strict";

module.exports = function () {
  var renderer, scene, camera, controls;
  var grid = new THREE.GridHelper(1000, 100);
  var stats = new Stats();
  var wireframeMaterial = new THREE.MeshBasicMaterial({
    wireframe: true,
    color: 0x08CDFA
  });
  var translucentMaterial = new THREE.MeshBasicMaterial({
    transparent: true,
    opacity: .3,
    color: 0x08CDFA
  });
  var backgroundBase = new THREE.Mesh();
  var backgroundSwatch1 = new THREE.Mesh();
  var backgroundSwatch2 = new THREE.Mesh();
  var shadeMaterial = new THREE.MeshPhongMaterial({
    side: THREE.DoubleSide
  });
  var backgroundColor = new THREE.Color('#F0F0F0');
  var distinctColors = [new THREE.Color('#FFFFFF'), new THREE.Color('#FFFF00'), new THREE.Color('#FF00FF'), new THREE.Color('#FF0000'), new THREE.Color('#00FF00'), new THREE.Color('#00FFFF'), new THREE.Color('#000000'), new THREE.Color('#0000FF'), new THREE.Color('#bcf60c'), new THREE.Color('#fabebe'), new THREE.Color('#008080'), new THREE.Color('#e6beff'), new THREE.Color('#9a6324'), new THREE.Color('#fffac8'), new THREE.Color('#800000'), new THREE.Color('#aaffc3'), new THREE.Color('#808000'), new THREE.Color('#ffd8b1'), new THREE.Color('#000075'), new THREE.Color('#808080'), new THREE.Color('#ffffff'), new THREE.Color('#000000')];
  var RGB_MODE = 0;
  var HSL_MODE = 1;
  var visualizeMode = RGB_MODE;
  var isBrightnessChangeMode = false;
  var exposure = 0.0;
  var increaseExposure = true;
  var sphere1, sphere2, sphere3;
  var color1 = new THREE.Color();
  var color2 = new THREE.Color();
  var color3 = new THREE.Color();
  var color1Mesh = new THREE.MeshPhongMaterial({
    side: THREE.DoubleSide,
    color: new THREE.Color(color1)
  });
  var color2Mesh = new THREE.MeshPhongMaterial({
    side: THREE.DoubleSide,
    color: new THREE.Color(color2)
  });
  var color3Mesh = new THREE.MeshPhongMaterial({
    side: THREE.DoubleSide,
    color: new THREE.Color(color3)
  });
  var blendColor = new THREE.Color(),
      blendColorMesh = new THREE.MeshPhongMaterial({
    side: THREE.DoubleSide,
    color: blendColor
  });
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
        LuminanceScale: 50.0,
        scaleLuminance: false,
        ColorOutputMode: 'Blend'
      }
    },
    init: function init() {
      var self = this;
      self.loadFont();
      self.setUpButtons();
    },
    begin: function begin() {
      var self = this;
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

      var animate = function animate() {
        requestAnimationFrame(animate);
        renderer.render(scene, camera);
        controls.update();
        stats.update();

        if (self.isBrightnessChangeMode) {
          self.setExposure(exposure);
          var delta = increaseExposure ? 0.5 : -0.5;
          if (exposure > 50) increaseExposure = false;
          if (exposure < -50) increaseExposure = true;
          exposure += delta;
          console.log(color1);
        }
      };

      animate();
    },
    scaleColorLuminance: function scaleColorLuminance(color) {
      var colorObj = new THREE.Color(color);
      var hsl = colorObj.getHSL(colorObj);
      hsl = hsl.setHSL(hsl.h, hsl.s, this.settings.UI.LuminanceScale / 100);
      return new THREE.Color(hsl);
    },
    setColor1: function setColor1(color) {
      var color1Element = document.querySelector('#color1');
      var result = new THREE.Color(color);
      if (this.settings.UI.scaleLuminance) result = this.scaleColorLuminance(color);
      color1Element.style.backgroundColor = '#' + result.getHexString();
      color1.set(result);
      color1Mesh.color.set(color1);
      sphere1.material = color1Mesh;
      this.setColorPositions(sphere1, color1);
      var outputColor = this.getOutputColor(color1, color2);
      this.setOutputColor(outputColor);
    },
    setColor2: function setColor2(color) {
      var color2Element = document.querySelector('#color2');
      var result = new THREE.Color(color);
      if (this.settings.UI.scaleLuminance) result = this.scaleColorLuminance(color);
      color2Element.style.backgroundColor = '#' + result.getHexString();
      color2.set(result);
      color2Mesh.color.set(color2);
      sphere2.material = color2Mesh;
      this.setColorPositions(sphere2, color2);
      var outputColor = this.getOutputColor(color1, color2);
      this.setOutputColor(outputColor);
    },
    getOutputColor: function getOutputColor(colorInput1, colorInput2) {
      var outputColor = new THREE.Color();
      var blendedColor = this.getBlendedColor(colorInput1, colorInput2);
      var complementaryColor = this.getComplementaryColor(blendedColor);

      if (this.settings.UI.ColorOutputMode === 'Blend') {
        outputColor = blendedColor;
      } else if (this.settings.UI.ColorOutputMode === 'Background') {
        outputColor = complementaryColor;
      } else if (this.settings.UI.ColorOutputMode === 'Accent') {
        outputColor = this.getAccentColor(colorInput1, colorInput2);
      }

      return outputColor;
    },
    setOutputColor: function setOutputColor(color) {
      var color3Element = document.querySelector('#color3');
      color3Element.style.backgroundColor = '#' + color.getHexString();
      color3.set(color);
      color3Mesh.color.set(color3);
      sphere3.material = color3Mesh;
      this.setColorPositions(sphere3, color3);
    },
    setColorPositions: function setColorPositions(colorMesh, color) {
      if (visualizeMode == RGB_MODE) {
        this.setPosByRGB(colorMesh, color);
      } else {
        this.setPosByHSL(colorMesh, color);
      }
    },
    logColor: function logColor(color, message) {
      message = message || '';
      var hex = color.getHexString();
      console.log('%c' + message + '                                                                                                                                 ', 'background: #' + hex + ';');
    },
    getBlendedColor: function getBlendedColor(color1, color2) {
      var lab1 = this.RGB2Lab(color1);
      var lab2 = this.RGB2Lab(color2);
      var mid = this.getMidpoint(lab1, lab2);
      var c = this.Lab2RGB(mid);
      return new THREE.Color('#' + c.getHexString());
    },
    getComplementaryColor: function getComplementaryColor(color) {
      var result = new THREE.Color(color).clone();
      result = result.offsetHSL(.5, 0, 0); // Hue shift by 180 degrees

      return result;
    },
    getAccentColor: function getAccentColor(color1, color2) {
      var output = new THREE.Color();
      var hsl1 = color1.getHSL(color1);
      var hsl2 = color2.getHSL(color2); // 1. luminance

      var threshold_delta_luminance = 0.2;
      var h, s, l;
      var ave_l = (hsl1.l + hsl2.l) / 2;

      if (Math.abs(hsl1.l - hsl2.l) < threshold_delta_luminance) {
        // input colors are close in luminance
        var delta_l = 0.3;

        if (ave_l > 1 - threshold_delta_luminance * 0.5 - delta_l) {
          // inputs are very bright
          l = ave_l - delta_l;
        } else {
          l = ave_l + delta_l;
        }
      } else {
        l = ave_l;
      } // 2. hue


      var repeat = function repeat(x, a) {
        return x - Math.floor(x / a) * a;
      };

      var deltaAngle = function deltaAngle(x, y, range) {
        var num = repeat(y - x, range);
        if (num > range * 0.5) num -= range;
        return num;
      };

      var ave_h = (hsl1.h + hsl2.h) * 0.5;
      h = ave_h;
      if (Math.abs(deltaAngle(ave_h, hsl1.h, 1.0)) < 0.25) h = ave_h + 0.5;
      h = repeat(h, 1.0); // 3. saturation

      var ave_s = (hsl1.s + hsl2.s) * 0.5;
      s = ave_s;
      var threshold_saturation = 0.3;
      if (ave_s < threshold_saturation) s += 0.5;
      output.setHSL(h, s, l);
      console.log(h, s, l);
      return output;
    },
    setPosByRGB: function setPosByRGB(mesh, color) {
      mesh.position.setX((color.r - 0.5) * RGBCubeSize);
      mesh.position.setY((color.g - 0.5) * RGBCubeSize);
      mesh.position.setZ((color.b - 0.5) * RGBCubeSize);
    },
    setPosByHSL: function setPosByHSL(mesh, color) {
      var hsl = color.getHSL(color);
      var r = HSLConeRadius * (1 - 2 * Math.abs(hsl.l - 0.5)) * hsl.s;
      var x = r * Math.sin(-hsl.h * Math.PI * 2);
      var z = r * Math.cos(hsl.h * Math.PI * 2);
      var y = hsl.l * HSLConeHeight * 2 - 0.5 * HSLConeHeight;
      mesh.position.setX(x);
      mesh.position.setY(y);
      mesh.position.setZ(z);
    },
    setExposure: function setExposure(ex) {
      var change = ex / 100.0; // just a small change

      var scale = Math.pow(2.0, change);
      var c1 = sphere1.material.color;
      c1.r = Math.min(color1.r * scale, 1.0);
      c1.g = Math.min(color1.g * scale, 1.0);
      c1.b = Math.min(color1.b * scale, 1.0);
      var c2 = sphere2.material.color;
      c2.r = Math.min(color2.r * scale, 1.0);
      c2.g = Math.min(color2.g * scale, 1.0);
      c2.b = Math.min(color2.b * scale, 1.0);
      var c3 = sphere3.material.color;
      c3.r = Math.min(color3.r * scale, 1.0);
      c3.g = Math.min(color3.g * scale, 1.0);
      c3.b = Math.min(color3.b * scale, 1.0);

      if (visualizeMode == RGB_MODE) {
        this.setPosByRGB(sphere1, c1);
        this.setPosByRGB(sphere2, c2);
        this.setPosByRGB(sphere3, c3);
      } else {
        this.setPosByHSL(sphere1, c1);
        this.setPosByHSL(sphere2, c2);
        this.setPosByHSL(sphere3, c3);
      }

      scene.background.setHSL(0, 0, 0.938 * scale);
    },
    setColorSpace: function setColorSpace(mode) {
      visualizeMode = mode;
      HSLCone.traverse(function (child) {
        if (child instanceof THREE.Mesh || child instanceof THREE.Points) {
          child.visible = mode == HSL_MODE;
        }
      });
      RGBCube.traverse(function (child) {
        if (child instanceof THREE.Mesh || child instanceof THREE.Points) {
          child.visible = mode == RGB_MODE;
        }
      });

      if (mode == HSL_MODE) {
        this.setPosByHSL(sphere1, color1);
        this.setPosByHSL(sphere2, color2);
        this.setPosByHSL(sphere3, color3);
      } else {
        this.setPosByRGB(sphere1, color1);
        this.setPosByRGB(sphere2, color2);
        this.setPosByRGB(sphere3, color3);
      }
    },
    hideMesh: function hideMesh(object) {
      object.traverse(function (child) {
        if (child instanceof THREE.Mesh) {
          child.visible = false;
        }
      });
    },
    showMesh: function showMesh(object) {
      object.traverse(function (child) {
        if (child instanceof THREE.Mesh) {
          child.visible = true;
        }
      });
    },
    updateColors: function updateColors() {
      this.setColor1(this.settings.UI.ColorInput1);
      this.setColor2(this.settings.UI.ColorInput2);
      this.setColorPositions(sphere1, color1);
      this.setColorPositions(sphere2, color2);
      this.setColorPositions(sphere3, color3);
    },
    setGUIValue: function setGUIValue(gui, input, value) {
      gui.__controllers.forEach(function (controller) {
        if (controller.property === input) {
          controller.setValue(value);
        }
      });
    },
    addInputUI: function addInputUI() {
      var self = this;
      var gui = new dat.GUI({
        width: 300
      });
      gui.domElement.parentElement.classList.add('color-1-picker');
      gui.addColor(self.settings.UI, 'ColorInput1').onChange(function (event) {
        self.setGUIValue(gui, 'LuminanceScale', 50);
        self.settings.UI.scaleLuminance = false;
        self.updateColors();
      });
      gui.addColor(self.settings.UI, 'ColorInput2').onChange(function (event) {
        self.setGUIValue(gui, 'LuminanceScale', 50);
        self.settings.UI.scaleLuminance = false;
        self.updateColors();
      });
      gui.add(self.settings.UI, 'LuminanceScale', 0.0, 100.0).onChange(function (event) {
        self.settings.UI.scaleLuminance = true;
        self.settings.UI.LuminanceScale = parseFloat(event);
        self.updateColors();
      });
      gui.add(self.settings.UI, 'ColorSpace', ['RGB', 'HSL']).onChange(function (event) {
        self.setColorSpace(self.settings.UI.ColorSpace === 'RGB' ? RGB_MODE : HSL_MODE);
        self.updateModeEvents();
      });
      gui.add(self.settings.UI, 'ColorOutputMode', ['Blend', 'Background', 'Accent', 'Triad']).onChange(function (event) {
        self.settings.UI.ColorOutputMode = event;
        self.updateModeEvents();
      });
    },
    updateModeEvents: function updateModeEvents() {
      if (this.settings.UI.ColorOutputMode === 'Blend' || this.settings.UI.ColorOutputMode === 'Accent') {
        this.showMesh(sphere3);
      } else {
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
        HSLCone.children.forEach(function (child) {
          if (child instanceof THREE.Mesh) {
            var seeThrough = child.clone();
            seeThrough.material = translucentMaterial;
            HSLCone.children.push(seeThrough);
          }
        });
      } else {
        // Not background mode
        this.hideMesh(backgroundBase);
        this.hideMesh(backgroundSwatch1);
        this.hideMesh(backgroundSwatch2);
        HSLCone.children = HSLCone.children.filter(function (child) {
          if (child.material !== translucentMaterial) return true;
        });
      }

      if (this.settings.UI.ColorSpace === 'HSL') {
        // If switching to background mode while in HSL, don't show
        this.hideMesh(backgroundBase);
        this.hideMesh(backgroundSwatch1);
        this.hideMesh(backgroundSwatch2);
      }

      this.setColor1(color1);
      this.setColor2(color2);
    },
    addBackgroundGeometries: function addBackgroundGeometries() {
      var planeGeometry = new THREE.PlaneGeometry(RGBCubeSize, RGBCubeSize, 1);
      planeGeometry.translate(0, RGBCubeSize / 2, -(RGBCubeSize / 2) + zBufferOffset);
      backgroundBase = new THREE.Mesh(planeGeometry, color3Mesh);
      scene.add(backgroundBase);
      var inputSwatchSize = RGBCubeSize / 3;
      planeGeometry = new THREE.PlaneGeometry(inputSwatchSize, inputSwatchSize, 1);
      planeGeometry.translate(-2 * inputSwatchSize / 3, RGBCubeSize - 5 * inputSwatchSize / 6, -(RGBCubeSize / 2) + 5 * zBufferOffset);
      backgroundSwatch1 = new THREE.Mesh(planeGeometry, color1Mesh);
      scene.add(backgroundSwatch1);
      planeGeometry = new THREE.PlaneGeometry(inputSwatchSize, inputSwatchSize, 1);
      planeGeometry.translate(inputSwatchSize - inputSwatchSize / 3, inputSwatchSize / 2 + inputSwatchSize / 3, -(RGBCubeSize / 2) + 3 * zBufferOffset);
      backgroundSwatch2 = new THREE.Mesh(planeGeometry, color2Mesh);
      scene.add(backgroundSwatch2);
      this.hideMesh(backgroundSwatch1);
      this.hideMesh(backgroundSwatch2);
    },
    addGeometries: function addGeometries() {
      var self = this;
      RGBCube = new THREE.Object3D();
      scene.add(RGBCube);
      var geometry = new THREE.BoxGeometry(RGBCubeSize, RGBCubeSize, RGBCubeSize);
      geometry.translate(0, RGBCubeSize / 2, 0);
      geometry.translate(0, zBufferOffset, 0);
      var cube = new THREE.Mesh(geometry, wireframeMaterial);
      RGBCube.add(cube);
      self.showPoints(geometry, distinctColors, 1.0, RGBCube);
      self.labelRGBCubeVertices(geometry);
      HSLCone = new THREE.Object3D();
      scene.add(HSLCone);
      geometry = new THREE.ConeGeometry(HSLConeRadius, HSLConeHeight, 6);
      geometry.translate(0, 3 * HSLConeHeight / 2, 0);
      var cone = new THREE.Mesh(geometry, wireframeMaterial);
      self.labelPoint({
        x: geometry.vertices[0].x + 3,
        y: geometry.vertices[0].y,
        z: geometry.vertices[0].z
      }, 'Luminance 100%', new THREE.Color('black'), HSLCone);
      HSLCone.add(cone);
      var HSLColors = [new THREE.Color("hsl(0, 100%, 100%)"), new THREE.Color("hsl(0, 100%, 50%)"), new THREE.Color("hsl(300, 100%, 50%)"), new THREE.Color("hsl(240, 100%, 50%)"), new THREE.Color("hsl(180, 100%, 50%)"), new THREE.Color("hsl(120, 100%, 50%)"), new THREE.Color("hsl(60, 100%, 50%)"), new THREE.Color("hsl(0, 0%, 50%)")];
      self.showPoints(geometry, HSLColors, 1.0, HSLCone);
      geometry = new THREE.ConeGeometry(HSLConeRadius, HSLConeHeight, 6);
      geometry.rotateX(Math.PI);
      geometry.translate(0, HSLConeHeight / 2, 0);
      cone = new THREE.Mesh(geometry, wireframeMaterial);
      HSLCone.add(cone);
      self.showPoint(geometry.vertices[0], new THREE.Color("hsl(0, 0%, 0%)"), 1.0, HSLCone);
      self.labelPoint({
        x: geometry.vertices[0].x + 3,
        y: geometry.vertices[0].y,
        z: geometry.vertices[0].z
      }, 'Luminance 0%', new THREE.Color('black'), HSLCone);
      var radius = 2;
      geometry = new THREE.SphereGeometry(radius, 64, 64);
      geometry.translate(0, RGBCubeSize / 2, 0);
      var m1 = shadeMaterial.clone();
      sphere1 = new THREE.Mesh(geometry, m1);
      scene.add(sphere1);
      var m2 = shadeMaterial.clone();
      sphere2 = new THREE.Mesh(geometry, m2);
      scene.add(sphere2);
      var m3 = shadeMaterial.clone();
      sphere3 = new THREE.Mesh(geometry, m3);
      scene.add(sphere3); // hide one of color space reference frames

      this.setColorSpace(visualizeMode);
    },
    labelRGBCubeVertices: function labelRGBCubeVertices(geometry) {
      // Label Cube Vertices
      for (var i = 0; i < geometry.vertices.length; i++) {
        var label = 'RGB(' + (distinctColors[i].r * 255).toString() + ', ' + (distinctColors[i].g * 255).toString() + ', ' + (distinctColors[i].b * 255).toString() + ')';
        var location = geometry.vertices[i].clone();

        if (i > 3) {
          location.x -= 13;
        } else {
          location.x += 3;
        }

        this.labelPoint(location, label, new THREE.Color('black'), RGBCube);
      }
    },
    enableControls: function enableControls() {
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
    enableStats: function enableStats() {
      document.body.appendChild(stats.dom);
    },
    setUpLights: function setUpLights() {
      var self = this;
      var lights = [];
      var color = 0xFFFFFF;
      var intensity = 1;
      var light = new THREE.DirectionalLight(color, intensity);
      light.position.set(-1, 2, 4);
      scene.add(light);
      lights.push(light);
      var light2 = new THREE.DirectionalLight(color, intensity);
      light2.position.set(0, 2, -8);
      scene.add(light2);
      lights.push(light2);

      if (self.settings.activateLightHelpers) {
        self.activateLightHelpers(lights);
      }
    },
    activateLightHelpers: function activateLightHelpers(lights) {
      for (var i = 0; i < lights.length; i++) {
        var helper = new THREE.DirectionalLightHelper(lights[i], 5, 0x00000);
        scene.add(helper);
      }
    },
    addFloor: function addFloor() {
      grid.material.color = new THREE.Color('#ccc');
      grid.material.opacity = .2;
      grid.material.transparent = true;
      scene.add(grid);
    },
    setUpScene: function setUpScene() {
      var self = this;
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
    showPoints: function showPoints(geometry, color, opacity) {
      var parent = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : scene;
      var self = this;

      for (var i = 0; i < geometry.vertices.length; i++) {
        if (Array.isArray(color)) {
          self.showPoint(geometry.vertices[i], color[i], opacity, parent);
        } else {
          self.showPoint(geometry.vertices[i], color, opacity, parent);
        }
      }
    },
    showPoint: function showPoint(pt, color, opacity) {
      var parent = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : scene;
      color = color || 0xff0000;
      opacity = opacity || 1;
      var dotGeometry = new THREE.Geometry();
      dotGeometry.vertices.push(new THREE.Vector3(pt.x, pt.y, pt.z));
      var dotMaterial = new THREE.PointsMaterial({
        size: 10,
        sizeAttenuation: false,
        color: color,
        opacity: opacity,
        transparent: true
      });
      var dot = new THREE.Points(dotGeometry, dotMaterial);
      parent.add(dot);
    },
    showVector: function showVector(vector, origin, color) {
      var parent = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : scene;
      color = color || 0xff0000;
      var arrowHelper = new THREE.ArrowHelper(vector, origin, vector.length(), color);
      parent.add(arrowHelper);
    },
    drawLine: function drawLine(pt1, pt2) {
      var parent = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : scene;
      var material = new THREE.LineBasicMaterial({
        color: 0x0000ff
      });
      var geometry = new THREE.Geometry();
      geometry.vertices.push(new THREE.Vector3(pt1.x, pt1.y, pt1.z));
      geometry.vertices.push(new THREE.Vector3(pt2.x, pt2.y, pt2.z));
      var line = new THREE.Line(geometry, material);
      parent.add(line);
    },
    getDistance: function getDistance(pt1, pt2) {
      var squirt = Math.pow(pt2.x - pt1.x, 2) + Math.pow(pt2.y - pt1.y, 2) + Math.pow(pt2.z - pt1.z, 2);
      return Math.sqrt(squirt);
    },
    createVector: function createVector(pt1, pt2) {
      return new THREE.Vector3(pt2.x - pt1.x, pt2.y - pt2.y, pt2.z - pt1.z);
    },
    getMidpoint: function getMidpoint(pt1, pt2) {
      var midpoint = {};
      midpoint.x = (pt1.x + pt2.x) / 2;
      midpoint.y = (pt1.y + pt2.y) / 2;
      midpoint.z = (pt1.z + pt2.z) / 2;
      return midpoint;
    },
    createTriangle: function createTriangle(pt1, pt2, pt3) {
      // return geometry
      var triangleGeometry = new THREE.Geometry();
      triangleGeometry.vertices.push(new THREE.Vector3(pt1.x, pt1.y, pt1.z));
      triangleGeometry.vertices.push(new THREE.Vector3(pt2.x, pt2.y, pt2.z));
      triangleGeometry.vertices.push(new THREE.Vector3(pt3.x, pt3.y, pt3.z));
      triangleGeometry.faces.push(new THREE.Face3(0, 1, 2));
      triangleGeometry.computeFaceNormals();
      return triangleGeometry;
    },
    activateAxesHelper: function activateAxesHelper() {
      var parent = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : scene;
      var self = this;
      var axesHelper = new THREE.AxesHelper(self.settings.axesHelper.axisLength);
      parent.add(axesHelper);
    },
    labelAxes: function labelAxes() {
      var parent = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : scene;
      var self = this;

      if (self.settings.font.enable) {
        var textGeometry = new THREE.TextGeometry('Y', self.settings.font.fontStyle);
        var textMaterial = new THREE.MeshBasicMaterial({
          color: 0x00ff00
        });
        var mesh = new THREE.Mesh(textGeometry, textMaterial);
        textGeometry.translate(0, self.settings.axesHelper.axisLength, 0);
        parent.add(mesh);
        textGeometry = new THREE.TextGeometry('X', self.settings.font.fontStyle);
        textMaterial = new THREE.MeshBasicMaterial({
          color: 0xff0000
        });
        mesh = new THREE.Mesh(textGeometry, textMaterial);
        textGeometry.translate(self.settings.axesHelper.axisLength, 0, 0);
        parent.add(mesh);
        textGeometry = new THREE.TextGeometry('Z', self.settings.font.fontStyle);
        textMaterial = new THREE.MeshBasicMaterial({
          color: 0x0000ff
        });
        mesh = new THREE.Mesh(textGeometry, textMaterial);
        textGeometry.translate(0, 0, self.settings.axesHelper.axisLength);
        parent.add(mesh);
      }
    },
    loadFont: function loadFont() {
      var self = this;
      var loader = new THREE.FontLoader();
      var fontPath = '';
      fontPath = 'assets/vendors/js/three.js/examples/fonts/helvetiker_regular.typeface.json';
      loader.load(fontPath, function (font) {
        // success event
        if (self.settings.errorLogging) console.log('Fonts loaded successfully.');
        self.settings.font.fontStyle.font = font;
        self.begin();
        if (self.settings.axesHelper.activateAxesHelper) self.labelAxes();
      }, function (event) {
        // in progress event.
        if (self.settings.errorLogging) console.log('Attempting to load fonts.');
      }, function (event) {
        // error event
        if (self.settings.errorLogging) console.log('Error loading fonts. Webserver required due to CORS policy.');
        self.settings.font.enable = false;
        self.begin();
      });
    },

    /* 	Inputs: pt - point in space to label, in the form of object with x, y, and z properties; label - text content for label; color - optional */
    labelPoint: function labelPoint(pt, label, color) {
      var parent = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : scene;
      var self = this;

      if (self.settings.font.enable) {
        color = color || 0xff0000;
        var textGeometry = new THREE.TextGeometry(label, self.settings.font.fontStyle);
        var textMaterial = new THREE.MeshBasicMaterial({
          color: color
        });
        var mesh = new THREE.Mesh(textGeometry, textMaterial);
        textGeometry.translate(pt.x, pt.y, pt.z);
        parent.add(mesh);
      }
    },
    setUpButtons: function setUpButtons() {
      var self = this;
      var message = document.getElementById('message');
      document.addEventListener('keyup', function (event) {
        var esc = 27;

        if (event.keyCode === esc) {
          self.resetScene();
          message.textContent = 'Reset scene';
          setTimeout(function () {
            message.textContent = '';
          }, self.settings.messageDuration);
        }
      });
      document.getElementById('preview-brightness').addEventListener('click', function (e) {
        self.isBrightnessChangeMode = !self.isBrightnessChangeMode;

        if (self.isBrightnessChangeMode) {} else {
          sphere1.material.color.set(color1);
          sphere2.material.color.set(color2);
          sphere3.material.color.set(color3);
          self.setColorPositions(sphere1, color1);
          self.setColorPositions(sphere2, color2);
          self.setColorPositions(sphere3, color3);
          exposure = 0.0;
          increaseExposure = true;
          self.setExposure(exposure);
        }
      });
    },
    resetScene: function resetScene() {
      var self = this;

      for (var i = scene.children.length - 1; i >= 0; i--) {
        var obj = scene.children[i];
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
    setCameraLocation: function setCameraLocation(pt) {
      camera.position.x = pt.x;
      camera.position.y = pt.y;
      camera.position.z = pt.z;
    },
    getCentroid: function getCentroid(geometry) {
      var result = {};
      var x = 0,
          y = 0,
          z = 0;

      for (var i = 0; i < geometry.vertices.length; i++) {
        x += geometry.vertices[i].x;
        y += geometry.vertices[i].y;
        z += geometry.vertices[i].z;
      }

      x = x / geometry.vertices.length;
      y = y / geometry.vertices.length;
      z = z / geometry.vertices.length;
      result = {
        x: x,
        y: y,
        z: z
      };
      return result;
    },
    resizeRendererOnWindowResize: function resizeRendererOnWindowResize() {
      window.addEventListener('resize', utils.debounce(function () {
        if (renderer) {
          camera.aspect = window.innerWidth / window.innerHeight;
          camera.updateProjectionMatrix();
          renderer.setSize(window.innerWidth, window.innerHeight);
        }
      }, 250));
    },
    RGB2XYZ: function RGB2XYZ(color) {
      var r = Math.min(color.r, 0.99);
      var g = Math.min(color.g, 0.99);
      var b = Math.min(color.b, 0.99);
      var x = (0.49 * r + 0.31 * g + 0.2 * b) / 0.17697;
      var y = (0.17697 * r + 0.81240 * g + 0.01063 * b) / 0.17697;
      var z = (0.01 * g + 0.99 * b) / 0.17697;
      return new THREE.Vector3(x, y, z);
    },
    XYZ2RGB: function XYZ2RGB(c) // c is Vector3
    {
      var r = Math.min(0.41847 * c.x - 0.15866 * c.y - 0.082835 * c.z, 0.99);
      var g = Math.min(-0.091169 * c.x + 0.25243 * c.y + 0.015708 * c.z, 0.99);
      var b = Math.min(0.00092090 * c.x - 0.0025498 * c.y + 0.1786 * c.z, 0.99);
      return new THREE.Color(r, g, b);
    },
    RGB2Lab: function RGB2Lab(color) {
      var xyz = this.RGB2XYZ(color);
      var xn = 95.05;
      var yn = 100;
      var zn = 108.88;

      var f = function f(t) {
        var d = 6.0 / 29.0;
        if (t > d * d * d) return Math.pow(t, 1.0 / 3.0);else return t / (3 * d * d) + 4.0 / 29.0;
      };

      var fx = f(xyz.x / xn);
      var fy = f(xyz.y / yn);
      var fz = f(xyz.z / zn);
      var L = 116 * fy - 16;
      var a = 500 * (fx - fy);
      var b = 200 * (fy - fz);
      return new THREE.Vector3(L, a, b);
    },
    Lab2RGB: function Lab2RGB(c) {
      var f = function f(t) {
        var d = 6.0 / 29.0;
        if (t > d) return t * t * t;else return 3 * d * d * (t - 4.0 / 29.0);
      };

      var xn = 95.05;
      var yn = 100;
      var zn = 108.88;
      var x = xn * f((c.x + 16.0) / 116 + c.y / 500.0);
      var y = yn * f((c.x + 16.0) / 116);
      var z = zn * f((c.x + 16.0) / 116 - c.z / 200.0);
      return this.XYZ2RGB(new THREE.Vector3(x, y, z));
    },
    renderTitle: function renderTitle() {
      if (this.settings.font.enable) {
        var textGeometry = new THREE.TextGeometry('Exploring 3D Color Space', this.settings.font.fontStyle);
        var textMaterial = new THREE.MeshBasicMaterial({
          color: new THREE.Color('black')
        });
        var mesh = new THREE.Mesh(textGeometry, textMaterial);
        textGeometry.translate(-RGBCubeSize / 2.5, 0, RGBCubeSize * 2);
        scene.add(mesh);
      }
    }
  };
};

},{}],2:[function(require,module,exports){
"use strict";

var Scene = require('./components/scene.js');

var Utilities = require('./utils.js');

(function () {
  document.addEventListener("DOMContentLoaded", function () {
    Scene().init();
  });
})();

},{"./components/scene.js":1,"./utils.js":3}],3:[function(require,module,exports){
"use strict";

(function () {
  var appSettings;

  window.utils = function () {
    return {
      appSettings: {
        breakpoints: {
          mobileMax: 767,
          tabletMin: 768,
          tabletMax: 991,
          desktopMin: 992,
          desktopLargeMin: 1200
        }
      },
      mobile: function mobile() {
        return window.innerWidth < this.appSettings.breakpoints.tabletMin;
      },
      tablet: function tablet() {
        return window.innerWidth > this.appSettings.breakpoints.mobileMax && window.innerWidth < this.appSettings.breakpoints.desktopMin;
      },
      desktop: function desktop() {
        return window.innerWidth > this.appSettings.breakpoints.desktopMin;
      },
      getBreakpoint: function getBreakpoint() {
        if (window.innerWidth < this.appSettings.breakpoints.tabletMin) return 'mobile';else if (window.innerWidth < this.appSettings.breakpoints.desktopMin) return 'tablet';else return 'desktop';
      },
      debounce: function debounce(func, wait, immediate) {
        var timeout;
        return function () {
          var context = this,
              args = arguments;

          var later = function later() {
            timeout = null;
            if (!immediate) func.apply(context, args);
          };

          var callNow = immediate && !timeout;
          clearTimeout(timeout);
          timeout = setTimeout(later, wait);
          if (callNow) func.apply(context, args);
        };
      },

      /* Purpose: Detect if any of the element is currently within the viewport */
      anyOnScreen: function anyOnScreen(element) {
        var win = $(window);
        var viewport = {
          top: win.scrollTop(),
          left: win.scrollLeft()
        };
        viewport.right = viewport.left + win.width();
        viewport.bottom = viewport.top + win.height();
        var bounds = element.offset();
        bounds.right = bounds.left + element.outerWidth();
        bounds.bottom = bounds.top + element.outerHeight();
        return !(viewport.right < bounds.left || viewport.left > bounds.right || viewport.bottom < bounds.top || viewport.top > bounds.bottom);
      },

      /* Purpose: Detect if an element is vertically on screen; if the top and bottom of the element are both within the viewport. */
      allOnScreen: function allOnScreen(element) {
        var win = $(window);
        var viewport = {
          top: win.scrollTop(),
          left: win.scrollLeft()
        };
        viewport.right = viewport.left + win.width();
        viewport.bottom = viewport.top + win.height();
        var bounds = element.offset();
        bounds.right = bounds.left + element.outerWidth();
        bounds.bottom = bounds.top + element.outerHeight();
        return !(viewport.bottom < bounds.top && viewport.top > bounds.bottom);
      },
      secondsToMilliseconds: function secondsToMilliseconds(seconds) {
        return seconds * 1000;
      },

      /*
      * Purpose: This method allows you to temporarily disable an an element's transition so you can modify its proprties without having it animate those changing properties.
      * Params:
      * 	-element: The element you would like to modify.
      * 	-cssTransformation: The css transformation you would like to make, i.e. {'width': 0, 'height': 0} or 'border', '1px solid black'
      */
      getTransitionDuration: function getTransitionDuration(element) {
        var $element = $(element);
        return utils.secondsToMilliseconds(parseFloat(getComputedStyle($element[0])['transitionDuration']));
      },
      isInteger: function isInteger(number) {
        return number % 1 === 0;
      },
      rotate: function rotate(array) {
        array.push(array.shift());
        return array;
      }
    };
  }();

  module.exports = window.utils;
})();

},{}]},{},[2]);
