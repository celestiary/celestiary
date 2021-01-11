import {Float32BufferAttribute, BufferGeometry} from './lib/three.js/three.module.mjs';


export default class GalaxyBufferGeometry extends BufferGeometry {
  constructor(numStars) {
    super();
    const coords = new Float32Array(numStars * 3);
    const colors = new Float32Array(numStars * 3);
    const velocities = new Float32Array(numStars * 3);
    const sizes = new Float32Array(numStars);
    this.setAttribute('position', new Float32BufferAttribute(coords, 3));
    this.setAttribute('size', new Float32BufferAttribute(sizes, 1));
    this.setAttribute('velocity', new Float32BufferAttribute(velocities, 3));
    this.setAttribute('color', new Float32BufferAttribute(colors, 3));
    this.computeBoundingSphere();
  }
}