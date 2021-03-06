var THREE = require('three');
var OrbitControls = require('three-orbit-controls')(THREE);
var PhysicsRenderer = require('./PhysicsRenderer.js').PhysicsRenderer;
var dat = require('dat.gui');
var ss = require('../shaders/particle-sim.frag');
var vs = require('../shaders/particle-render.vert');
var fs = require('../shaders/particle-render.frag');
var svs = require('../shaders/sphere.vert');
var sfs = require('../shaders/sphere.frag');

var renderer,
physicsRenderer,
scene,
camera,
analyser,
freqArr,
start = Date.now(),
fov  = 35,
SIZE = 512,
freq = 0.005,
scale = 64,
simUniforms = {
    time : { type:'f',value: 0.0 },
    rM : { type:'f',value: 1.0 },
    phiM : { type:'f',value: 5.0 },
    thetaM : { type:'f',value: 7.0 },
    scale : { type:'f',value: 0.7 },
    baseFreq : { type:'f',value: 1.0 },
    freqM : { type:'f',value: 1.0025 },
    bounds: { type:'f',value:(SIZE - SIZE/2)/(SIZE/scale) },
    fft : { type:'1fv',value: null }
},
/*sphereUniforms = {
    t_ramp: { type: "t", value: null },
    fft: { type: "1fv", value: null },
    bM: {type: "f", value: 1.0},
    noiseM: {type: "f", value: 20.0},
    perlinM: {type: "f", value: 5.0},
    timeM: {type: "f", value: 70.0},
    time: { type: "f", value: 0.0 }
},*/
renderUniforms = {
    t_pos: { type: "t", value: null },
    t_img: { type: "t", value: null }
};

window.addEventListener('load', function() {
  var container = document.getElementById("container");
  scene = new THREE.Scene();
  camera = new THREE.PerspectiveCamera(
    fov,
    window.innerWidth / window.innerHeight,
    1,
    1000
  );
  camera.position.z = 100;

  //initialize WebAudioAPI from <audio> element
  var audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  var audioElement = document.getElementById('audio');
  var audioSrc = audioCtx.createMediaElementSource(audioElement);
  //create analyser and set parameters
  analyser = audioCtx.createAnalyser();
  analyser.minDecibels = -90;
  analyser.maxDecibels = -10;
  analyser.smoothingTimeConstant = 0.85;
  analyser.fftSize = 256; //higher val = more freq info, less time domain
  //connect audio elements
  audioSrc.connect(analyser);
  audioSrc.connect(audioCtx.destination);
  audioElement.play(); //for auto play   

  //get FFT data from analyser
  freqArr = new Float32Array(analyser.frequencyBinCount);
  analyser.getFloatTimeDomainData(freqArr);
    
  //initialize Three.js renderer
  renderer = new THREE.WebGLRenderer({ antialias:true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(window.devicePixelRatio);
  container.appendChild(renderer.domElement);

  //create data texture from freqArr
  /*var fftTexture = new THREE.DataTexture({
    data: freqArr, 
    width: analyser.frequencyBinCount / 4, 
    height: 1, 
    format: THREE.RGBAFormat,
    type: THREE.FloatType
  });
  fftTexture.needsUpdate = true;
  simUniforms.t_fft.value = fftTexture;
  sphereUniforms.t_fft.value = fftTexture;*/

  //initialize PhysicsRenderer with simulation shader
  physicsRenderer = new PhysicsRenderer(SIZE, ss(), renderer);

  //pass uniforms for shader
  physicsRenderer.setUniforms(simUniforms);
  
  //load sphere color ramp texture
  /*sphereUniforms.t_ramp.value = new THREE.TextureLoader().load('/assets/img/sphere-purp.png');
  var sphereMaterial = new THREE.ShaderMaterial( {
    uniforms: sphereUniforms,
    vertexShader: svs(),
    fragmentShader: sfs()
  });
  var sphereGeom = new THREE.TorusGeometry(100, 50, 128,128);
  //push sphere slightly behind particle plane
  sphereGeom.translate(0,0,-100);
  var sphereMesh = new THREE.Mesh(sphereGeom, sphereMaterial);
  scene.add(sphereMesh);
  */
  //render geometry needs a lookup map to reference positions within texture
  var renderGeometry = generateLookupGeometry(SIZE);

  renderUniforms.t_img.value = new THREE.TextureLoader().load('/assets/img/texture/particle.png');
  renderMaterial = new THREE.ShaderMaterial({
    uniforms:renderUniforms, 
    vertexShader: vs(), 
    fragmentShader: fs(),
    blending: THREE.AdditiveBlending,
    depthTest: false,
    transparent: true,
    vertexColors: true
  });

  //create points to add to scene
  var points = new THREE.Points(renderGeometry, renderMaterial);
  //points have a lookup map with references rather than actual positions
  //this may cause them to be outside of bounds and culled, so disable
  points.frustumCulled = false;
  scene.add(points);
  
  //create a plane of points
  var positionData = generateRandomPlane(SIZE, 0.5, scale);
  //put points into datatexture to pass to PhysicsRenderer
  var dataTexture = new THREE.DataTexture(
    positionData,
    SIZE,
    SIZE,
    THREE.RGBAFormat,
    THREE.FloatType
  );
  dataTexture.minFilter = THREE.NearestFilter;
  dataTexture.magFilter = THREE.NearestFilter;
  dataTexture.needsUpdate = true;
  physicsRenderer.reset(dataTexture);

  /* FOR DEBUG OUTPUT OF TEXTURE LAYOUT
  physicsRenderer.addDebugScene(scene);
  physicsRenderer.debugScene.translateY(-50);
  physicsRenderer.debugScene.scale.multiplyScalar(.05);*/
  
  //bind simulation output to render uniforms
  physicsRenderer.addBoundTexture(renderUniforms.t_pos, 'output');

  /**
   * Initialize dat.gui and orbit controls
   **/
  var controls = new OrbitControls(camera);
  var gui = new dat.GUI();
  var waveParams = gui.addFolder('Wave Parameters');
  var params = {
    Radius: simUniforms.rM.value,
    Phi: simUniforms.phiM.value,
    Theta: simUniforms.thetaM.value,
    fftFreq: simUniforms.baseFreq.value,
    fftScale: simUniforms.freqM.value,
    linearMode: false,
    linearScale: simUniforms.freqM.value,
    Amplitude: simUniforms.scale.value,
    Frequency: freq
  };
  waveParams.add(params, 'Amplitude', 0.1, 5.0).onFinishChange(function(value){
    simUniforms.scale.value = value; 
  });
  waveParams.add(params, 'Phi', 0.1, 50).onFinishChange(function(value){
    simUniforms.phiM.value = value; 
  });
  waveParams.add(params, 'Theta', 0.1, 50).onFinishChange(function(value){
    simUniforms.thetaM.value = value; 
  });
  waveParams.add(params, 'Radius', 0.25, 5).onFinishChange(function(value){
    simUniforms.rM.value = value; 
  });
  waveParams.add(params, 'fftFreq', 0.01, 5).onFinishChange(function(value){
    simUniforms.baseFreq.value = value; 
  });
  var freqControl = waveParams.add(params, 'fftScale', 1.0001, 1.01).onFinishChange(function(value){
    simUniforms.freqM.value = value; 
  });
    waveParams.add(params, 'Frequency', 0.001, 0.01).onFinishChange(function(value){
    freq = value; 
  });
  waveParams.add(params, 'linearMode').onFinishChange(function(value){
    //disable freqScale control, since only baseFreq is used
    if(value){
      freqControl.domElement.style.pointerEvents = "none";
      freqControl.domElement.style.opacity = 0.5;
      simUniforms.freqM.value = 0.0;
    //re-enable freqScale
    } else {
      freqControl.domElement.style.pointerEvents = "auto";
      freqControl.domElement.style.opacity = 1.0;
      simUniforms.freqM.value = freqControl.getValue();
    }
  });
  //button for resetting points to their initial positions
  var reset = {reset:function(){physicsRenderer.reset(dataTexture);}};
  waveParams.add(reset, 'reset');
  waveParams.open();

  /*var sphereControl = gui.addFolder('Sphere Controls');
  sphereParams = {
    Frequency: sphereUniforms.timeM.value,
    Noise: sphereUniforms.noiseM.value,
    Perlin: sphereUniforms.perlinM.value,
    Scale: sphereUniforms.bM.value
  };
  sphereControl.add(sphereParams, 'Noise', 5.0, 100.0).onFinishChange(function(value){
    sphereUniforms.noiseM.value = value; 
  });
  sphereControl.add(sphereParams, 'Frequency', 10.0, 100.0).onFinishChange(function(value){
    sphereUniforms.timeM.value = value; 
  });
  sphereControl.add(sphereParams, 'Scale', 0.001, 5.0).onFinishChange(function(value){
    sphereUniforms.bM.value = value; 
  });
  sphereControl.add(sphereParams, 'Perlin', 0.01, 25.0).onFinishChange(function(value){
    sphereUniforms.perlinM.value = value; 
  });*/

  //music controls
  var musicControl = gui.addFolder('Music Controls');
  //propagate click to file input
  var fileInput = document.getElementById('fileInput');
  var file = {file:function(){fileInput.click();}};
  musicControl.add(file, 'file');
  //audio file update routine
  fileInput.onchange = function(){
    var input = this.files;
    var file = URL.createObjectURL(input[0]);
    /*TODO: Add BPM detection from AudioBuffer and adjust frequency accordingly
    var fr = new FileReader;
    fr.onload = function(){
      var buff = this.result;
      audioContext.decodeAudioData(buff).then(function(decodedData){
        analyze(decodedData)
          .then((tempo) => {
            console.log(tempo);
          })
          .catch((err) => {
            console.log("BPM detection error: " + err);
          });
      });
      //do BPM detection here
    }
    fr.readAsArrayBuffer(input[0]);*/
    audioElement.src = file;
    audioElement.play();

  };
  var play = {play:function(){audioElement.play()}};
  musicControl.add(play, 'play');
  var stop = {stop:function(){audioElement.pause()}};
  musicControl.add(stop, 'stop');
  musicControl.open();

    
  onWindowResize();
  window.addEventListener('resize', onWindowResize);
  
  render();
});

function onWindowResize() {
  renderer.setSize(window.innerWidth, window.innerHeight);
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
}

function generateLookupGeometry(size) {
  var geom = new THREE.BufferGeometry();
  var pos = new Float32Array(size * size * 3);
  var colors = [];
  var color = new THREE.Color();
  for(var i = 0, j = 0; i < size * size; i++, j+=3) {
    pos[j] = (i % size) / size;
    pos[j+1] = Math.floor(i/size)/size;
    color.setHSL(Math.random(), 0.9, 0.5);
    colors.push(color.r, color.g, color.b);
  }
  var posAttribute = new THREE.BufferAttribute(pos, 3);
  geom.addAttribute('position', posAttribute);
  var colorAttribute = new THREE.Float32BufferAttribute(colors, 3);
  geom.addAttribute('color', colorAttribute);
  return geom;
}

function generateRandomPlane(size, z, scale) {
  var length = size * size * 4;
  var output = new Float32Array(length);
  for(var i = 0; i < size; i++){
    for(var j = 0; j < size; j++){
      output[(i*size+j)*4] = (i-(size/2) + Math.random())/(size/scale);
      output[((i*size+j)*4)+1] = (j-(size/2) + Math.random())/(size/scale);
      output[((i*size+j)*4)+2] = Math.random()*z;
      output[((i*size+j)*4)+3] = 0;
    }
  }
  return output;
}

function render() {
  requestAnimationFrame(render);
  //get new FFT data from Web Audio API
  analyser.getFloatTimeDomainData(freqArr);
  //updateCheckerboard();
  //sphereUniforms.fft_prev.value = sphereUniforms.fft.value;
  simUniforms.fft.value = freqArr;
  simUniforms.time.value = freq * (Date.now() - start);
  //sphereUniforms.time.value = freq / 500 * (Date.now() - start); 
  //get gpu compute update frame
  physicsRenderer.update();

   //++*______*++\\
  //+++FIAT_LVX+++\\
  renderer.render(scene, camera);
}
