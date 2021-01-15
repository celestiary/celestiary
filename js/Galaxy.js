import * as THREE from './lib/three.js/three.module.js';

import GalaxyBufferGeometry from './GalaxyBufferGeometry.js';
import {pathTexture} from './material.js';


const Tau = 2.0 * Math.PI;
const armDensityRatio = 0.4;
const G = 1e-7;
const colorTemp = 0.5;
const minDistnce = 0.1;

export default class Galaxy extends THREE.Points {
  // numStars, ms
  // 400, 20
  // 500, 30
  // 600, 40
  // 700, 54
  // 800, 70
  // 900, 88
  // 1000, 110
  constructor(numStars = 5, radius = 10, mass = numStars) {
    super(new GalaxyBufferGeometry(numStars),
          new THREE.ShaderMaterial({
              uniforms: {
                texSampler: { value: pathTexture('star_glow', '.png') },
              },
              vertexShader: vertexShader,
              fragmentShader: fragmentShader,
              blending: THREE.AdditiveBlending,
              depthTest: true,
              depthWrite: false,
              transparent: true,
            }));
    this.numStars = numStars;
    this.first = true;
    const coords = this.geometry.attributes.position.array;
    const sizes = this.geometry.attributes.size.array;
    const velocities = this.geometry.attributes.velocity.array;
    const colors = this.geometry.attributes.color.array;
    let xi, yi, zi;
    if (false) {
      for (let i = 0; i < numStars; i++) {
        const off = 3 * i, xi = off, yi = off + 1, zi = off + 2;
        const theta = Math.random() * Tau;
        const numSpokes = 8;
        const r = Math.random() * radius;
        const x = r * Math.cos(theta);
        const y = (radius / 8) * (Math.random() - 0.5);
        const z = r * Math.sin(theta);
        coords[xi] = x;
        coords[yi] = y;
        coords[zi] = z;
        colors[xi] = 1 - colorTemp + colorTemp * Math.random();
        colors[yi] = 1 - colorTemp + colorTemp * Math.random();
        colors[zi] = 1 - colorTemp + colorTemp * Math.random();
        sizes[i] = 10 * ((1 - armDensityRatio) + armDensityRatio * Math.cos(theta * numSpokes));
        velocities[xi] = 0;
        velocities[yi] = 0;
        velocities[zi] = 0;
      }
    } else {
      // Custom setup for testing..
      // star 0: 0,0,0
      sizes[0] = 1000;
      colors[0] = colors[1] = colors[2] = 1;

      // star 1: 1,0,0
      coords[3] = 1;
      sizes[1] = 5;
      colors[3] = 1;

      // star 2: -1,0,0
      coords[6] = -1;
      sizes[2] = 5;
      colors[7] = 1;

      // star 3: 2,0,0
      coords[9] = 2;
      sizes[3] = 5;
      colors[9] = colors[10] = 1;

      // star 4: -2,0,0
      coords[12] = -2;
      sizes[4] = 5;
      colors[12] = colors[14] = 1;
    }

    this.newAccels = new Float32Array(velocities.length);

    // Set the orbital speed the the magnitude from this equation:
    //   https://en.wikipedia.org/wiki/Orbital_speed#Mean_orbital_speed
    // and normal (tangent, along the orbit) to the gravity vector (inward).
    this.computeAccels(coords, sizes, velocities, this.newAccels);
    for (let i = 0; i < coords.length; i += 3) {
      const xi = i, yi = i + 1, zi = i + 2;
      const M = sizes[i / 3];
      const x = this.newAccels[xi], z = this.newAccels[zi];
      const r = Math.sqrt(x * x + z * z);
      const R = Math.abs(coords[xi]);
      //const theta = Math.atan2(z, x);
      //const uX = Math.cos(theta), uZ = Math.sin(theta);
      //const speed = r == 0 ? 0 : 3.3e-5 * Math.sqrt(M/r);
      const mu = 4 * Math.PI * Math.PI * R*R*R / 2.9e-3;
      const speed = R == 0 ? 0 : Math.sqrt(mu / R);
      //const speed = 2 * Math.PI * R * 2.4e1;
      velocities[xi] = speed * z;
      velocities[zi] = speed * -x;
      //console.log(`${xi} ${zi} ${R} ${speed}`);
      //velocities[xi] = speed * uZ;
      //velocities[zi] = speed * -uX;
    }
    console.log('first coords, velocities:', coords, velocities);
  }


  computeAccels(coords, sizes, velocities, newAccels) {
    for (let i = 0; i < coords.length; i += 3) {
      const xi = i, yi = i + 1, zi = i + 2;
      const aX = coords[xi];
      const aY = coords[yi];
      const aZ = coords[zi];
      const aS = sizes[i / 3];
      let fX = 0, fY = 0, fZ = 0;
      for (let j = coords.length - 3; j > i ; j -= 3) {
        const xj = j, yj = j + 1, zj = j + 2;
        const bX = coords[xj];
        const bY = coords[yj];
        const bZ = coords[zj];
        const bS = sizes[j / 3];

        const dX = bX - aX;
        const dY = bY - aY;
        const dZ = bZ - aZ;
        const d = Math.sqrt(dX*dX + dY*dY + dZ*dZ) + minDistnce;
        const g = G / (d * d * d);
        const bSG = bS * g;
        const aSG = aS * g;
        fX += bSG * dX;
        fY += bSG * dY;
        fZ += bSG * dZ;
        newAccels[xj] += aSG * -dX;
        newAccels[yj] += aSG * -dY;
        newAccels[zj] += aSG * -dZ;
        if (false) {
          console.log(`d(${d}) g(${g}) dX(${dX}) dY(${dY}) dZ(${dZ})`);
        }
      }
      newAccels[xi] += fX;
      newAccels[yi] += fY;
      newAccels[zi] += fZ;
    }
  }


  move(coords, velocities, newAccels) {
    for (let i = 0; i < coords.length; i += 3) {
      const xi = i, yi = i + 1, zi = i + 2;
      coords[xi] += velocities[xi] += newAccels[xi];
      coords[yi] += velocities[yi] += newAccels[yi];
      coords[zi] += velocities[zi] += newAccels[zi];
      newAccels[xi] = newAccels[yi] = newAccels[zi] = 0;
    }
  }


  animate(debug) {
    const coords = this.geometry.attributes.position.array;
    const sizes = this.geometry.attributes.size.array;
    const velocities = this.geometry.attributes.velocity.array;
    const newAccels = this.newAccels;
    this.computeAccels(coords, sizes, velocities, newAccels);
    this.move(coords, velocities, newAccels);
    //console.log('newAccels:', newAccels);
    if (this.first) {
      this.first = false;
      if (debug) {
        console.log('first coords, velocities:', coords, velocities);
      }
    }
    this.geometry.attributes.position.needsUpdate = true;
  }
}


const vertexShader = `
  attribute float size;
  attribute vec3 color;
  varying vec3 vColor;
  void main() {
    vColor = color;
    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
    gl_PointSize = size * 50. / -mvPosition.z;
    gl_Position = projectionMatrix * mvPosition;
  }
`;


const fragmentShader = `
  uniform sampler2D texSampler;
  varying vec3 vColor;
  void main() {
    gl_FragColor = vec4(vColor, 1.) * texture(texSampler, gl_PointCoord);
  }
`;
