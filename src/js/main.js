var sweet = require('sweet-scroll');
var particle = require('canvas-particle-network');

/* sweetScroll load */
document.addEventListener("DOMContentLoaded", function () {
  const sweetScroll = new sweet({/* some options */});

  var canvas = new particle(
                      document.getElementById('particles-js'), 
                      {particleColor: '#5fd3bc'}
  );
  
  /*Particles.init({
    selector: '#particles-js',
    color: '#429383',
    connectParticles: true
  });*/


  /* particlesJS.load(@dom-id, @path-json, @callback (optional)); 
  window.particleJS.particleJS('particles-js', {
    "particles": {
      "number": {
        "value": 65,
        "density": {
          "enable": true,
          "value_area": 1000
        }
      },
      "color": {
        "value": "#9be3d5"
      },
      "shape": {
        "type": "polygon",
        "stroke": {
          "width": 0,
          "color": "#429383"
        },
        "polygon": {
          "nb_sides": 6
        },
        "image": {
          "src": "img/github.svg",
          "width": 100,
          "height": 100
        }
      },
      "opacity": {
        "value": 0.9,
        "random": false,
        "anim": {
          "enable": true,
          "speed": 0.6,
          "opacity_min": 0.1,
          "sync": false
        }
      },
      "size": {
        "value": 5.7,
        "random": true,
        "anim": {
          "enable": false,
          "speed": 3.180819,
          "size_min": 1.73,
          "sync": false
        }
      },
      "line_linked": {
        "enable": true,
        "distance": 170,
        "color": "#5fd3bc",
        "opacity": 0.87,
        "width": 1
      },
      "move": {
        "enable": true,
        "speed": 2.5,
        "direction": "none",
        "random": true,
        "straight": false,
        "out_mode": "bounce",
        "bounce": false,
        "attract": {
          "enable": false,
          "rotateX": 1623,
          "rotateY": 1267
        }
      },
      nb: 100
    },
    "interactivity": {
      "detect_on": "window",
      "events": {
        "onhover": {
          "enable": false,
          "mode": "repulse"
        },
        "onclick": {
          "enable": true,
          "mode": "repulse"
        },
        "resize": true
      },
      "modes": {
        "grab": {
          "distance": 130,
          "line_linked": {
            "opacity": 0.5
          }
        },
        "bubble": {
          "distance": 400,
          "size": 40,
          "duration": 1,
          "opacity": 8,
          "speed": 3
        },
        "repulse": {
          "distance": 130,
          "duration": 0.8
        },
        "push": {
          "particles_nb": 3
        },
        "remove": {
          "particles_nb": 2
        }
      }
    },
    "retina_detect": true
  });*/

}, false);
