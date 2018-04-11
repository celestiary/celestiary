const THREE = require('three');
const TrackballControls = require('./lib/TrackballControls.js');

function ThreeUi(container, animationCb, postAnimationCb, windowResizeCb) {
  container.innerHTML = '';
  this.container = container;
  this.animationCb = animationCb || (() => {});
  this.postAnimationCb = postAnimationCb || (() => {});
  this.windowResizeCb = windowResizeCb || (() => {});
  this.setSize();
  this.initRenderer(container);
  this.camera = new THREE.PerspectiveCamera(25, this.width / this.height, 1, 1E13);
  this.camera.rotationAutoUpdate = true;
  this.initControls(this.camera);
  this.scene = new THREE.Scene();

  window.addEventListener(
      'resize',
      () => {
        this.onWindowResize();
      },
      false);

  this.startRendering();
}


ThreeUi.prototype.setSize = function() {
  this.width = this.container.clientWidth || window.innerWidth;
  this.height = this.container.clientHeight || window.innerHeight;
};


ThreeUi.prototype.initRenderer = function(container) {
  var r = new THREE.WebGLRenderer({antialias: true});
  r.setClearColor(0, 1);
  r.setSize(this.width, this.height);
  r.sortObjects = true;
  r.autoClear = true;
  container.appendChild(r.domElement);
  this.renderer = r;
};


ThreeUi.prototype.initControls = function(camera) {
  const c = new TrackballControls(camera);
  // Rotation speed is changed in scene.js depending on target
  // type: faster for sun, slow for planets.
  c.noZoom = false;
  c.noPan = false;
  c.staticMoving = true;
  c.dynamicDampingFactor = 0.3;
  this.controls = c;
};


ThreeUi.prototype.onWindowResize = function() {
  this.setSize();
  this.renderer.setSize(this.width, this.height);
  this.camera.aspect = this.width / this.height;
  this.camera.updateProjectionMatrix();
  this.camera.radius = (this.width + this.height) / 4;
  this.controls.screen.width = this.width;
  this.controls.screen.height = this.height;
  // TODO(pablo): this doesn't tilt the view when JS console is toggled?
  this.windowResizeCb(this.camera, this.scene);
};


ThreeUi.prototype.startRendering = function() {
  renderLoop(this.controls, this.animationCb, this.scene, this.camera, this.renderer, this.postAnimationCb);
};


function renderLoop(controls, animationCb, scene, camera, renderer, postAnimationCb) {
  controls.update();
  animationCb(scene, camera);
  renderer.clear();
  renderer.render(scene, camera);
  postAnimationCb();
  requestAnimationFrame(function() {
    renderLoop(controls, animationCb, scene, camera, renderer, postAnimationCb);
  });
}


module.exports = ThreeUi;
