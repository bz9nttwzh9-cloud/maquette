import * as THREE from 'three';
import terrain from '../data/quebec-terrain.json';
import { EXTENT, project } from './geo.js';

export function elevation(x, z) {
  const u = THREE.MathUtils.clamp((x - EXTENT.west) / terrain.step, 0, terrain.columns - 1);
  const v = THREE.MathUtils.clamp((z - EXTENT.north) / terrain.step, 0, terrain.rows - 1);
  const a = Math.min(Math.floor(u), terrain.columns - 2), b = Math.min(Math.floor(v), terrain.rows - 2);
  const h = (i, j) => terrain.heights[j * terrain.columns + i];
  return THREE.MathUtils.lerp(THREE.MathUtils.lerp(h(a,b),h(a+1,b),u-a), THREE.MathUtils.lerp(h(a,b+1),h(a+1,b+1),u-a),v-b);
}
export const landmarks = [
  [46.8119, -71.2052], [46.8075, -71.2071],
  [46.8130, -71.2025], [46.8087, -71.2140],
];
export function createTerrainScene(models) {
  const group = new THREE.Group(); group.name = 'Geographic terrain, metres';
  const geometry = new THREE.PlaneGeometry(8000,6000,terrain.columns-1,terrain.rows-1);
  geometry.rotateX(-Math.PI/2);
  const positions = geometry.attributes.position;
  const colors = [];
  for (let i=0;i<positions.count;i++) {
    const h=terrain.heights[i]; positions.setY(i,h);
    const color=new THREE.Color(h<5?'#91b9b7':h<15?'#b4c3ad':h<60?'#bec4ad':'#b1ba9c');
    colors.push(color.r,color.g,color.b);
  }
  geometry.setAttribute('color',new THREE.Float32BufferAttribute(colors,3));geometry.computeVertexNormals();
  const ground=new THREE.Mesh(geometry,new THREE.MeshStandardMaterial({vertexColors:true,roughness:1}));
  ground.name='Mapzen raster terrain';ground.receiveShadow=true;group.add(ground);
  // The source raster has a 3 m floor over the Saint Lawrence. A flat water
  // plane covers the low raster cells; it is not an OSM shoreline.
  const water=new THREE.Mesh(new THREE.PlaneGeometry(8000,6000),new THREE.MeshStandardMaterial({color:'#7eaeb0',roughness:.3,metalness:.18}));
  water.rotation.x=-Math.PI/2;water.position.y=4.5;water.name='Indicative water level';group.add(water);
  const points=landmarks.map(([lat,lon],i)=>{
    const p=project(lat,lon);p[1]=elevation(p[0],p[2]);
    const model=models[i].clone(true);model.scale.setScalar(i===1?10:5);model.position.set(...p);group.add(model);return p;
  });
  return {group,points,terrain};
}
