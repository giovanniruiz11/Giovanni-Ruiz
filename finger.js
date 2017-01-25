var opts = {
  noiseForce: 0.6,
  curvesLength: 10,
  radius: 350,
  cubesQuantity: 45,
  pathOpacity: 0.2,
  speedAverage: 150000, //Ms
  zCamera: 900
};

var ww = window.innerWidth,
  wh = window.innerHeight;

var renderer = new THREE.WebGLRenderer({
  canvas: document.querySelector("canvas")
});
renderer.setClearColor(0x000000);
renderer.setSize(ww, wh);

var scene = new THREE.Scene();

var camera = new THREE.PerspectiveCamera(50, ww / wh, 1, 2000);
camera.position.set(0, 0, opts.zCamera);
camera.destinationLook = new THREE.Vector3();

function resetCamera() {
  TweenMax.to(camera.position, 2, {
    x: 0,
    y: 0,
    z: opts.zCamera,
    ease: Power1.easeInOut
  });
}
resetCamera();

var raycaster = new THREE.Raycaster();
var mouse = new THREE.Vector2(0.3, 0.3);
mouse.activated = false;
document.querySelector("canvas").addEventListener("mouseup", onMouseUp);
document.querySelector("canvas").addEventListener("touchstart", onMouseUp);
window.addEventListener("mousemove", detectSphereMouse);

function onMouseUp(e) {
  if (e.type === "touchstart") {
    mouse.x = (e.touches[0].clientX / ww) * 2 - 1;
    mouse.y = -(e.touches[0].clientY / wh) * 2 + 1;
  } else {
    mouse.x = (e.clientX / ww) * 2 - 1;
    mouse.y = -(e.clientY / wh) * 2 + 1;
  }
  raycaster.setFromCamera(mouse, camera);

  var intersects = raycaster.intersectObjects(cubesObject.children, true);
  if (intersects.length > 0) {
    //Check if clicked item is instance of a Mesh
    if (intersects[0].object instanceof THREE.Mesh) {
      if (clickedCube) {
        clickedCube.cameraMustFollow = false;
        clickedCube.visible = true;
        TweenMax.to(clickedCube.material, 0.6, {
          opacity: 1,
          ease: Power1.easeIn
        });
      }
      clickedCube = intersects[0].object;
      TweenMax.to(clickedCube.material, 0.6, {
        opacity: 0,
        ease: Power1.easeIn,
        onComplete: function() {
          clickedCube.visible = false;
        }
      });
      clickedCube.cameraMustFollow = true;
    }
  } else {
    if (clickedCube) {
      clickedCube.cameraMustFollow = false;
      clickedCube.visible = true;
      TweenMax.to(clickedCube.material, 0.6, {
        opacity: 1,
        ease: Power1.easeIn
      });
    }
    clickedCube = null;
    resetCamera();
  }
}

function detectSphereMouse(e){
  
  if (!mouse.activated) {
    mouse.activated = true;
  }
  mouse.x = (e.clientX / ww) * 2 - 1;
  mouse.y = -(e.clientY / wh) * 2 + 1;
  var ratio = 0.2;
  if (clickedCube) {
    ratio = Math.PI * 0.6;
  }
  TweenMax.to(camera.rotation, 1, {
    ease: Back.easeOut,
    y: -mouse.x * ratio,
    x: mouse.y * ratio
  });
  raycaster.setFromCamera(mouse, camera);
  var intersects = raycaster.intersectObjects(cubesObject.children, true);
  if (hoverCube) {
    hoverCube.material.emissive = new THREE.Color(0x000000);
    TweenMax.to(hoverCube.scale, 1.5, {
      ease: Elastic.easeOut.config(1.55, 0.2),
      x: hoverCube.size,
      y: hoverCube.size,
      z: hoverCube.size
    });
  }
  if (intersects.length > 0) {
    document.body.style.cursor = "pointer";
    hoverCube = intersects[0].object;
    hoverCube.material.emissive = new THREE.Color(0x313131);
    TweenMax.to(hoverCube.scale, 1.6, {
      ease: Back.easeOut,
      x: hoverCube.size * 1.5,
      y: hoverCube.size * 1.5,
      z: hoverCube.size * 1.5
    });
  } else {
    document.body.style.cursor = "default";
    hoverCube = null;
  }
};
window.addEventListener("resize", function() {
  ww = window.innerWidth;
  wh = window.innerHeight;
  camera.aspect = ww / wh;
  camera.updateProjectionMatrix();
  renderer.setSize(ww, wh);
  fxaa.uniforms.resolution.value.set(1 / ww, 1 / wh);
});
//ON DEVICE MOVE
function orientationEvent(e) {
  mouse.activated = false;
  var ratio = Math.PI * 2;
  var alpha = Math.round(e.alpha / 360 * ratio * 1000) / 1000;
  var beta = Math.round(e.beta / 360 * ratio * 1000) / 1000;
  var gamma = Math.round(e.gamma / 360 * ratio * 1000) / 1000;
  camera.rotation.x = -gamma;
  camera.rotation.y = beta;
  camera.rotation.z = alpha;
}
window.addEventListener("deviceorientation", orientationEvent, true);

//LIGHTS
var pointLight = new THREE.PointLight(0xffffff, 0.5);
scene.add(pointLight);

var light = new THREE.HemisphereLight(0xffffff, 0xcccccc, 0.5);
scene.add(light);

var basicCube = new THREE.SphereBufferGeometry(1, 8, 8);
var clickedCube = null;
var hoverCube = null;
//Create a path filled with cubes
function Necklace() {
  var points = [];
  //Set the amount of points to create the paths
  var lengthPathPoints = 40;
  noise.seed(Math.random());
  var rotation = Math.random() * Math.PI;
  //Generate points to create random curves
  for (var i = 0; i < lengthPathPoints; i++) {
    var x = Math.cos(i / lengthPathPoints * Math.PI * 2) * opts.radius;
    var y = Math.sin(i / lengthPathPoints * Math.PI * 2) * opts.radius;
    var random = noise.simplex2(x * 0.002, y * 0.002) * opts.noiseForce;
    x *= (random - 1);
    y *= (random - 1);
    var z = 0;
    var vertex = new THREE.Vector3(x, y, z);
    vertex.applyAxisAngle(new THREE.Vector3(0, 0.1, 0).normalize(), rotation);
    points.push(vertex);
  }
  this.curve = new THREE.CatmullRomCurve3(points);
  this.curve.closed = true;
  var geometry = new THREE.Geometry();
  geometry.vertices = this.curve.getPoints(100);
  var material = new THREE.LineBasicMaterial({
    color: 0xdddddd,
    transparent: true,
    opacity: opts.pathOpacity
  });
  this.lace = new THREE.Line(geometry, material);

  this.items = new THREE.Object3D();
  this.speed = (Math.random() + 0.5) * opts.speedAverage;
  var angle = Math.random() * 60 + 150;
  for (i = 0; i < opts.cubesQuantity; i++) {
    var color = new THREE.Color("hsl(" + (Math.random() * 20 + angle) + ", 100%, 50%)");
    var sphereMaterial = new THREE.MeshPhongMaterial({
      color: color,
      transparent: true,
      shading: THREE.FlatShading
    });
    var size = (Math.random() * 0.8 + 0.4) * 12;
    var mesh = new THREE.Mesh(basicCube, sphereMaterial);
    mesh.ratio = i / opts.cubesQuantity;
    mesh.size = size;
    mesh.scale.set(size, size, size);
    mesh.cameraMustFollow = false;
    this.items.add(mesh);
  }

  this.object = new THREE.Object3D();
  this.object.add(this.items);
}

var interval = 0.001;
Necklace.prototype.update = function(a) {
  //Loop through all cubes in one path
  var cube, tempA, percent, p1, p2;
  for (var i = 0; i < this.items.children.length; i++) {
    cube = this.items.children[i];
    tempA = a + cube.ratio * this.speed;
    percent = ((tempA % this.speed) / this.speed) % 1;
    //Calculate the next point position
    p1 = this.curve.getPointAt(percent);
    //Calculate the point where the cube must look At
    p2 = this.curve.getPointAt((percent + interval) % 1);
    //Update the position & rotation of the cube
    cube.position.set(p1.x, p1.y, p1.z);
    cube.lookAt(p2);

    if (cube.cameraMustFollow) {
      TweenMax.to(camera.position, 2, {
        x: p1.x,
        y: p1.y,
        z: p1.z,
        ease: Power1.easeOut
      });
    }

  }
};

// ===============
//WRAP WITH PARTICLES
// ===============
var totalParticlesWrap = 3000;
var wrapGeom = new THREE.Geometry();
var positions = new Float32Array(totalParticlesWrap * 3);
var sizes = new Float32Array(totalParticlesWrap);
var opacities = new Float32Array(totalParticlesWrap);
var texture = new THREE.TextureLoader().load("https://s3-us-west-2.amazonaws.com/s.cdpn.io/127738/dotTexture.png");
for (var i = 0; i < totalParticlesWrap; i++) {
  var vector = new THREE.Vector3(0, 0, 0);
  vector.speedX = (Math.random() - 0.5) * 0.0004;
  vector.speedY = (Math.random() - 0.5) * 0.0004;
  vector.speedZ = (Math.random() - 0.5) * 0.0004;
  vector.applyMatrix4(new THREE.Matrix4().makeTranslation(0, Math.random() * 2000 + 300, 0));
  vector.applyMatrix4(new THREE.Matrix4().makeRotationX(Math.random() * (Math.PI * 2)));
  vector.applyMatrix4(new THREE.Matrix4().makeRotationY(Math.random() * (Math.PI * 2)));
  vector.applyMatrix4(new THREE.Matrix4().makeRotationZ(Math.random() * (Math.PI * 2)));
  wrapGeom.vertices.push(vector);
  //Add to attributes
  vector.toArray(positions, i * 3);
  sizes[i] = Math.random() * 1 + 1;
  opacities[i] = Math.random() * 0.7 + 0.1;
}
var bufferWrapGeom = new THREE.BufferGeometry();
bufferWrapGeom.addAttribute('position', new THREE.BufferAttribute(positions, 3));
bufferWrapGeom.addAttribute('size', new THREE.BufferAttribute(sizes, 1));
bufferWrapGeom.addAttribute('opacity', new THREE.BufferAttribute(opacities, 1));
var wrapMatShader = new THREE.ShaderMaterial({
  uniforms: {
    texture: {
      value: texture
    }
  },
  vertexShader: document.getElementById("wrapVertexShader").textContent,
  fragmentShader: document.getElementById("wrapFragmentShader").textContent,
  transparent: true
});
var wrap = new THREE.Points(bufferWrapGeom, wrapMatShader);
scene.add(wrap);

function updateWrap(a) {
  for (var i = 0; i < totalParticlesWrap; i++) {
    var vector = wrapGeom.vertices[i];
    vector.applyMatrix4(new THREE.Matrix4().makeRotationX(vector.speedX));
    vector.applyMatrix4(new THREE.Matrix4().makeRotationY(vector.speedY));
    vector.applyMatrix4(new THREE.Matrix4().makeRotationZ(vector.speedZ));
    vector.toArray(positions, i * 3);
  }
  bufferWrapGeom.addAttribute('position', new THREE.BufferAttribute(positions, 3));
}

//Black center
var geom = new THREE.SphereGeometry(100, 32, 32);
var mat = new THREE.MeshPhongMaterial({
  color: 0x000000
});
var core = new THREE.Mesh(geom, mat);
scene.add(core);

var geom = new THREE.SphereBufferGeometry(1, 15, 15);
var mat = new THREE.MeshBasicMaterial({
  color: 0xffffff
});
var atoms = new THREE.Object3D();
scene.add(atoms);
for (var i = 0; i < 150; i++) {
  var nucleus = new THREE.Mesh(geom, mat);
  var size = Math.random() * 6 + 1.5;
  nucleus.speedX = (Math.random() - 0.5) * 0.08;
  nucleus.speedY = (Math.random() - 0.5) * 0.08;
  nucleus.speedZ = (Math.random() - 0.5) * 0.08;
  nucleus.applyMatrix(new THREE.Matrix4().makeScale(size, size, size));
  nucleus.applyMatrix(new THREE.Matrix4().makeTranslation(0, 100 + Math.random() * 10, 0));
  nucleus.applyMatrix(new THREE.Matrix4().makeRotationX(Math.random() * (Math.PI * 2)));
  nucleus.applyMatrix(new THREE.Matrix4().makeRotationY(Math.random() * (Math.PI * 2)));
  nucleus.applyMatrix(new THREE.Matrix4().makeRotationZ(Math.random() * (Math.PI * 2)));
  atoms.add(nucleus);
}

function updateNucleus(a) {
  for (var i = 0; i < atoms.children.length; i++) {
    var part = atoms.children[i];
    part.applyMatrix(new THREE.Matrix4().makeRotationX(part.speedX));
    part.applyMatrix(new THREE.Matrix4().makeRotationY(part.speedY));
    part.applyMatrix(new THREE.Matrix4().makeRotationZ(part.speedZ));
  }
}

//Create scene
var necks = [];
var cubesObject = new THREE.Object3D();
scene.add(cubesObject);
//Generate n path with cubes
for (var i = 0; i < opts.curvesLength; i++) {
  var neck = new Necklace();
  cubesObject.add(neck.object);
  necks.push(neck);
}

var renderPass = new THREE.RenderPass(scene, camera);
var shift = new THREE.ShaderPass(THREE.RGBShiftShader);
shift.uniforms.amount.value = -0.0015;
shift.uniforms.angle.value = 180;
var fxaa = new THREE.ShaderPass(THREE.FXAAShader);
fxaa.uniforms.resolution.value.set(1 / ww, 1 / wh);
composer = new THREE.EffectComposer(renderer);
composer.addPass(renderPass);
composer.addPass(shift);
composer.addPass(fxaa);
fxaa.renderToScreen = true;

// ========  
//RENDER
// ========  
function render(a) {
  requestAnimationFrame(render);

  for (var i = 0; i < necks.length; i++) {
    necks[i].update(a);
  }

  updateNucleus(a);
  updateWrap(a);
  
  renderer.render(scene, camera);
  composer.render(0.05);

}

requestAnimationFrame(render);

var startButton = document.querySelector(".start");
startButton.addEventListener("click", windowDown);
startButton.addEventListener("touchend", windowDown);
document.querySelector(".about").addEventListener("click", windowDown);


function windowDown(e) {
  document.querySelector("canvas").classList.toggle("blurry");
  document.querySelector(".home").classList.toggle("hidden");
}
