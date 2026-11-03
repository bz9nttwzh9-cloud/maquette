import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { createIcons, Layers3, CircleHelp, MapPin, ArrowUpRight, SlidersHorizontal, Landmark, Trees, Camera, Box, Map as MapIcon, Plus, Minus, RotateCcw, Maximize, Sun, Sunrise, Moon, Mouse, X } from 'lucide';
import '@fontsource-variable/dm-sans';
import '@fontsource-variable/manrope';
const icons = { Layers3, CircleHelp, MapPin, ArrowUpRight, SlidersHorizontal, Landmark, Trees, Camera, Box, Map: MapIcon, Plus, Minus, RotateCcw, Maximize, Sun, Sunrise, Moon, Mouse, X };
import './style.css';
import { createTerrainScene } from './terrain-scene.js';

const icon = (name, cls='') => `<i data-lucide="${name}" class="${cls}"></i>`;
const places = [
 {id:'frontenac', name:'Château Frontenac', area:'HAUTE-VILLE', year:'1893', pos:[8,9,0], text:'Une silhouette devenue l’emblème de Québec. Ses tourelles et ses toits de cuivre dominent le Saint-Laurent depuis le cap Diamant.', tag:'Hôtel historique', n:'01'},
 {id:'citadelle', name:'La Citadelle', area:'CAP DIAMANT', year:'1820', pos:[-22,6,19], text:'Une forteresse en étoile au sommet du cap Diamant. Ses remparts dessinent l’un des grands paysages fortifiés d’Amérique du Nord.', tag:'Site fortifié', n:'02'},
 {id:'royale', name:'Place Royale', area:'BASSE-VILLE', year:'1608', pos:[24,1.8,-12], text:'Le cœur historique de la ville, au pied de la falaise. Une petite place bordée de maisons de pierre et de toitures aux couleurs du Vieux-Québec.', tag:'Place historique', n:'03'},
 {id:'parlement', name:'Hôtel du Parlement', area:'COLLINE PARLEMENTAIRE', year:'1886', pos:[-24,5,-18], text:'Un édifice monumental inspiré du style Second Empire. Sa tour centrale marque la colline parlementaire, à l’extérieur des fortifications.', tag:'Architecture civique', n:'04'}
];
document.querySelector('#app').innerHTML = `
<header><a class="brand" href="./" aria-label="Accueil Atlas Québec"><span class="brand-mark">${icon('layers-3')}</span><span>atlas<span class="brand-dot">.</span></span><span class="brand-divider"></span><span class="brand-city">QUÉBEC</span></a><nav><span class="project-status"><b></b> Une ville, une nouvelle perspective</span><button class="help-button" id="help">${icon('circle-help')}<span>Comment explorer</span></button></nav></header>
<main><aside class="sidebar"><div class="intro"><div class="eyebrow"><span></span> EXPLORATION URBAINE</div><h1>Québec,<br>sous un autre angle<span>.</span></h1><p>Quatre siècles d’histoire. <br>Une ville à explorer en trois dimensions.</p><div class="location">${icon('map-pin')} 46°48′49″ N <span>·</span> 71°12′52″ O</div></div>
<div class="section-heading"><h2>Les lieux emblématiques</h2><span>04</span></div>
<div class="places">${places.map((p,i)=>`<button class="place ${i===0?'active':''}" data-place="${p.id}"><span class="place-thumb thumb-${p.id}"><span class="mini-building"></span></span><span class="place-copy"><small>${p.area}</small><strong>${p.name}</strong></span><span class="place-arrow">${icon('arrow-up-right')}</span></button>`).join('')}</div>
<section class="layers"><div class="section-heading"><h2>Composer la maquette</h2>${icon('sliders-horizontal')}</div><label><span>${icon('landmark')} Monuments / bâtiments</span><input id="buildings" type="checkbox" checked><span class="switch"></span></label><label><span>${icon('trees')} Végétation artistique</span><input id="trees" type="checkbox" checked><span class="switch"></span></label><label><span>${icon('map-pin')} Points d’intérêt</span><input id="markers" type="checkbox" checked><span class="switch"></span></label></section>
<div class="sidebar-bottom"><span class="mini-spark">✳</span><p>Le patrimoine prend du relief.<small>Maquette artistique · Géographie indicative</small></p></div></aside>
<section class="viewport" aria-label="Maquette 3D interactive de Québec"><div id="scene"></div><div class="scene-top"><div class="map-title"><span class="live-dot"></span><strong>Vieux-Québec</strong><span class="pill">3D</span><small>Québec, Canada</small></div><button id="capture" class="export">${icon('camera')}<span>Capturer la vue</span></button></div><div class="mode-control"><button id="perspective" class="selected">${icon('box')} Perspective</button><button id="overhead">${icon('map')} Vue du dessus</button></div><div id="labels"></div><div class="river-label">FLEUVE SAINT-LAURENT</div><div class="compass"><span>N</span><svg viewBox="0 0 60 60"><circle cx="30" cy="30" r="27"/><path d="M30 10 37 37 30 32 23 37Z" class="needle"/><path d="M30 49 23 37 30 32 37 37Z" class="needle-bottom"/></svg></div>
<div class="scene-controls"><button id="zoom-in" title="Rapprocher" aria-label="Rapprocher">${icon('plus')}</button><button id="zoom-out" title="Éloigner" aria-label="Éloigner">${icon('minus')}</button><span></span><button id="reset" title="Réinitialiser la vue" aria-label="Réinitialiser la vue">${icon('rotate-ccw')}</button><button id="fullscreen" title="Plein écran" aria-label="Plein écran">${icon('maximize')}</button></div>
<article class="detail-card"><div class="detail-top"><span id="detail-tag">Hôtel historique</span><span id="detail-year">DEPUIS 1893</span></div><h3 id="detail-name">Château Frontenac</h3><p id="detail-text">${places[0].text}</p><button id="focus">Se rapprocher ${icon('arrow-up-right')}</button><span class="card-number" id="detail-number">01</span></article>
<div class="lighting"><div class="lighting-title">${icon('sun')}<span>Lumière du jour</span><strong id="time-label">16:00</strong></div><div class="slider-row">${icon('sunrise')}<input id="light" aria-label="Heure de la journée" type="range" min="7" max="20" step="0.5" value="16">${icon('moon')}</div><div class="lighting-foot"><span>Heure dorée, ville de pierre.</span><span id="weather">☀ 18°</span></div></div>
<div class="map-footer"><span>${icon('mouse')} Glisser pour tourner <b>·</b> Molette pour zoomer <b>·</b> Clic droit pour déplacer</span><span class="scale">0 <i></i> 200 m <b>MODÈLE STYLISÉ</b></span></div><div class="loading" id="loading">Construction de votre point de vue…</div><div class="toast" id="toast" role="status"></div></section></main>
<dialog id="help-modal"><button id="close-help" aria-label="Fermer">${icon('x')}</button><div class="eyebrow">PRENDRE DE LA HAUTEUR</div><h2>La ville au bout des doigts.</h2><p>Glissez pour tourner autour de Québec. Utilisez la molette ou les boutons + et − pour zoomer, et le clic droit pour déplacer la scène.</p><p>Sur un écran tactile, glissez avec un doigt pour tourner et avec deux doigts pour déplacer ou zoomer.</p><p>Sélectionnez un monument pour découvrir son histoire. Les calques et le curseur de lumière vous permettent de composer votre propre point de vue.</p><small>Cette interprétation artistique ne constitue pas un relevé cadastral ou une restitution architecturale exacte.</small></dialog>`;
createIcons({icons});

const host = document.querySelector('#scene');
const scene = new THREE.Scene(); scene.background = new THREE.Color('#dce6e2');
const camera = new THREE.PerspectiveCamera(38,1,.1,600); camera.position.set(100,94,125);
let renderer;
try { renderer = new THREE.WebGLRenderer({antialias:true,preserveDrawingBuffer:true}); }
catch { document.querySelector('#loading').textContent='Votre navigateur doit prendre en charge WebGL pour afficher la maquette 3D.'; throw new Error('WebGL unavailable'); }
renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=.9;
renderer.setPixelRatio(Math.min(devicePixelRatio,2));renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.setClearColor('#dce6e2');host.appendChild(renderer.domElement);
const controls = new OrbitControls(camera, renderer.domElement);controls.enableDamping=true;controls.minDistance=26;controls.maxDistance=240;controls.maxPolarAngle=Math.PI/2.12;controls.target.set(0,0,0);controls.enablePan=true;
scene.add(new THREE.HemisphereLight(0xf6f6e4,0x718d81,2.5));
const sun=new THREE.DirectionalLight(0xffe7bb,3.2);sun.position.set(-50,90,40);sun.castShadow=true;sun.shadow.mapSize.set(2048,2048);Object.assign(sun.shadow.camera,{left:-100,right:100,top:100,bottom:-100,near:1,far:20000});sun.shadow.bias=-.001;scene.add(sun);
const buildings=new THREE.Group(),vegetation=new THREE.Group();scene.add(buildings,vegetation);
const materials=new Map(); const mat=(c)=>{if(!materials.has(c))materials.set(c,new THREE.MeshStandardMaterial({color:c,roughness:.92}));return materials.get(c);};
function box(w,h,d,c,x,y,z,parent=scene){const m=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),mat(c));m.position.set(x,y+h/2,z);m.castShadow=true;m.receiveShadow=true;parent.add(m);return m;}
function polygon(points,depth,color,y,parent=scene){const s=new THREE.Shape();points.forEach(([x,z],i)=>i?s.lineTo(x,-z):s.moveTo(x,-z));s.closePath();const g=new THREE.ExtrudeGeometry(s,{depth,bevelEnabled:false});g.rotateX(-Math.PI/2);const m=new THREE.Mesh(g,mat(color));m.position.y=y;m.receiveShadow=true;m.castShadow=true;parent.add(m);return m;}
// The map is an authored miniature of the cape, not survey data.
box(600,.5,600,'#9ebfba',0,-2,0);
const terrain=[[-75,-62],[-14,-61],[23,-42],[35,-20],[35,4],[21,28],[-1,48],[-75,56]];
polygon(terrain,2,'#dbd9c5',-1);
const upper=[[-75,-59],[-16,-56],[12,-36],[18,-12],[17,8],[4,27],[-10,40],[-75,48]];
polygon(upper,5,'#b2ba9b',0);
polygon([[-72,-58],[-17,-55],[9,-35],[15,-12],[14,6],[1,25],[-12,37],[-72,45]],.35,'#d9d9be',5);
// Quays, lower town and the Dufferin boardwalk.
box(1,.28,54,'#f0e8ce',35,1,-9);box(3,.4,44,'#c8bca0',19,5.3,5).rotation.y=.28;
function road(points,width=1.1,color='#f0e9d5',y=5.38){for(let i=1;i<points.length;i++){let [ax,az]=points[i-1],[bx,bz]=points[i];let mesh=box(width,.06,Math.hypot(bx-ax,bz-az),color,(ax+bx)/2,y,(az+bz)/2);mesh.rotation.y=Math.atan2(bx-ax,bz-az);}}
for(let z=-46;z<=32;z+=11)road([[-70,z],[-24,z],[4,z-5],[13,z-8]],1.45);
for(let x=-62;x<12;x+=12)road([[x,-50],[x+3,-20],[x,14],[x-7,37]],1.2);
road([[23,-34],[29,-16],[28,6],[17,23],[0,41]],1.4,'#eee4cf',1.12);
road([[33,-27],[33,1],[24,21],[7,36]],1.2,'#e9dfc8',1.12);
let seed=1234;function rnd(){seed=(seed*1664525+1013904223)>>>0;return seed/4294967296;}
const walls=['#e5dcc5','#d8cfb7','#f1e7cf','#c8c3b1','#e3d0b0','#d6c8b5'];const roofs=['#798e85','#8c9790','#b47860','#6d807a','#a79c83'];
function house(x,z,w,d,h,y=5.45,parent=buildings){const g=new THREE.Group();g.position.set(x,y,z);parent.add(g);box(w,h,d,walls[Math.floor(rnd()*walls.length)],0,0,0,g);const geo=new THREE.CylinderGeometry(0,1,1,4);geo.rotateY(Math.PI/4);geo.scale(w*.75,1.2,d*.75);const roof=new THREE.Mesh(geo,mat(roofs[Math.floor(rnd()*roofs.length)]));roof.position.y=h+.6;roof.castShadow=true;g.add(roof);if(h>2.5){for(let a=-w*.28;a<=w*.3;a+=1.3){for(let b=1;b<h-.3;b+=1.3)box(.36,.55,.04,'#748482',a,b,d/2+.025,g);}}return g;}
for(let z=-45;z<32;z+=5.5){for(let x=-66;x<11;x+=5.2){if((x>-8&&z>-13&&z<13)||(x<-10&&x>-36&&z>7)||(x<-13&&x>-38&&z<-11&&z>-27))continue;if(z>20&&x>0)continue;if(rnd()>.14)house(x+rnd(),z+rnd(),3+rnd()*1.2,2.8+rnd(),1.8+rnd()*3);}}
for(let z=-29;z<22;z+=4.2){for(let x=23;x<33;x+=4.4){if(x<27&&z>-17&&z<-7)continue;house(x,z,2.6+rnd(),2.7,1.8+rnd()*1.8,1.1);}}
// Château Frontenac: brick wings, copper roofs and a tall central tower.
const castle=new THREE.Group();castle.position.set(8,5.45,0);buildings.add(castle);
function castleBlock(x,z,w,d,h){box(w,h,d,'#bb866b',x,0,z,castle);const roof=new THREE.Mesh(new THREE.CylinderGeometry(0,1,1,4),mat('#4e7d73'));roof.geometry.rotateY(Math.PI/4);roof.scale.set(w*.75,2.1,d*.75);roof.position.set(x,h+1,z);roof.castShadow=true;castle.add(roof);for(let xx=x-w/2+.7;xx<x+w/2;xx+=1)for(let yy=1;yy<h-.3;yy+=1.2)box(.33,.55,.06,'#e8d9b2',xx,yy,z+d/2+.04,castle);}
castleBlock(0,0,5,5,11);castleBlock(-5,1,6,3.8,5.7);castleBlock(4,2,4,4,6.5);castleBlock(-2,-4,9,3,5.8);
function turret(x,z,h){const t=new THREE.Mesh(new THREE.CylinderGeometry(.85,.9,h,8),mat('#c69a7b'));t.position.set(x,h/2,z);t.castShadow=true;castle.add(t);const r=new THREE.Mesh(new THREE.ConeGeometry(1.25,3.3,8),mat('#4e7d73'));r.position.set(x,h+1.6,z);r.castShadow=true;castle.add(r);}
turret(-2.5,2.5,9);turret(2.5,2.5,9);turret(-7,2.7,6.7);turret(6,3,7.8);box(.12,3,.12,'#e4dac0',0,13.1,0,castle);box(1,.55,.04,'#547eac',.45,15,0,castle);
// Citadel star and its grassy interior.
const citadelModel=new THREE.Group();buildings.add(citadelModel);const star=[];for(let i=0;i<20;i++){const a=i/20*Math.PI*2;const r=i%2?8:12;star.push([-24+Math.cos(a)*r,20+Math.sin(a)*r]);}polygon(star,1.1,'#8c9480',5.4,citadelModel);polygon(star.map(([x,z])=>[-24+(x+24)*.85,20+(z-20)*.85]),.12,'#adb690',6.51,citadelModel);house(-25,18,9,3.2,2.3,6.65,citadelModel);house(-22,24,7,2.5,1.7,6.65,citadelModel);
// Parliament with its central clock tower.
const parliament=new THREE.Group();parliament.position.set(-24,5.45,-19);buildings.add(parliament);box(17,4.2,5,'#d3c6a7',0,0,0,parliament);box(18,.8,5.7,'#748782',0,4.2,0,parliament);box(3.6,8.6,3.5,'#ddd1b6',0,0,1,parliament);const spire=new THREE.Mesh(new THREE.ConeGeometry(2.4,3,4),mat('#657f77'));spire.position.set(0,10,1);spire.rotation.y=Math.PI/4;parliament.add(spire);const clock=new THREE.Mesh(new THREE.CircleGeometry(.65,20),mat('#f4edd7'));clock.position.set(0,7.1,2.76);parliament.add(clock);for(let x=-7;x<=7;x+=1.5)box(.5,1,.05,'#77867d',x,2,2.55,parliament);
// Place Royale church and its steeple.
const royaleModel=new THREE.Group();buildings.add(royaleModel);
box(3.5,3.5,6,'#e7dec7',24,1.1,-14,royaleModel);box(1.4,6,1.4,'#dcd5bd',24,1.1,-10.7,royaleModel);const steeple=new THREE.Mesh(new THREE.ConeGeometry(1.2,3.5,4),mat('#697f79'));steeple.position.set(24,8.5,-10.7);steeple.rotation.y=Math.PI/4;royaleModel.add(steeple);
// Trees scattered through the streets and the park along the cape.
function tree(x,z,y=5.5){box(.22,1.3,.22,'#7e846b',x,y,z,vegetation);const leaf=new THREE.Mesh(new THREE.IcosahedronGeometry(.9+rnd()*.7,1),mat(['#80976b','#94a678','#687f5c','#b1b383'][Math.floor(rnd()*4)]));leaf.scale.y=1.3;leaf.position.set(x,y+2,z);leaf.castShadow=true;vegetation.add(leaf);}
for(let i=0;i<260;i++){const x=-70+rnd()*78,z=-50+rnd()*87;if((x>-5&&z>-14&&z<15)||(x>-37&&x<-10&&z>6&&z<34)||(x>-35&&x<-13&&z<-12&&z>-26))continue;if(rnd()>.6||x<-45)tree(x,z);}
for(let i=0;i<17;i++)tree(18-i*.5,12+i*1.3,4.8);
// Pale water lines, a ferry and distant bank.
for(let i=0;i<70;i++){let x=40+rnd()*95,z=-80+rnd()*170;box(2+rnd()*10,.012,.07,'#b9d0c8',x,-1.46,z);}
const boat=new THREE.Group();boat.position.set(60,-1.3,13);boat.rotation.y=-.35;scene.add(boat);box(3,.8,8,'#f1eadb',0,0,0,boat);box(2,1.4,4.5,'#f7f3e5',0,.8,.3,boat);box(2.1,.6,3.8,'#6c8f88',0,1.5,.3,boat);box(.5,1,.6,'#b8795e',0,2.2,1,boat);
polygon([[110,-160],[175,-160],[175,180],[140,180],[125,40],[117,-40]],3,'#b3bda1',-1.4);

// Preserve the original miniature as a separate, explicitly artistic view.
const models=[castle,citadelModel,royaleModel,parliament].map((object,i)=>{
 const clone=object.clone(true);
 const center=i===1?[-24,5.4,20]:i===2?[24,1.1,-12]:[0,0,0];
 if(i===1||i===2)clone.children.forEach(child=>child.position.sub(new THREE.Vector3(...center)));
 clone.position.set(0,0,0);return clone;
});
const geographic=createTerrainScene(models);
const artistic=new THREE.Group();artistic.name='Original artistic miniature';
[...scene.children].filter(o=>!o.isLight).forEach(o=>artistic.add(o));scene.add(artistic,geographic.group);
const originalPositions=places.map(p=>[...p.pos]);
let geographicMode=true;
const dataButton=document.createElement('button');dataButton.id='geography';dataButton.textContent='Maquette artistique';document.querySelector('.mode-control').appendChild(dataButton);
const attribution=document.createElement('div');attribution.className='geographic-attribution';document.querySelector('.viewport').appendChild(attribution);
function applyGeography(){
 artistic.visible=!geographicMode;geographic.group.visible=geographicMode;
 places.forEach((p,i)=>p.pos=[...(geographicMode?geographic.points[i]:originalPositions[i])]);
 camera.far=geographicMode?30000:600;camera.near=geographicMode?1:.1;camera.updateProjectionMatrix();
 controls.minDistance=geographicMode?80:26;controls.maxDistance=geographicMode?18000:240;
 const t=geographicMode?new THREE.Vector3(1200,40,500):new THREE.Vector3();
 camera.position.copy(t).add(geographicMode?new THREE.Vector3(2400,2500,3200):new THREE.Vector3(100,94,125));controls.target.copy(t);
 Object.assign(sun.shadow.camera,geographicMode?{left:-4000,right:4000,top:4000,bottom:-4000}:{left:-100,right:100,top:100,bottom:-100});sun.shadow.camera.updateProjectionMatrix();
 sun.position.set(...(geographicMode?[-3000,6000,2000]:[-50,90,40]));
 attribution.textContent=geographicMode?'Relief : Mapzen / AWS Open Data · grille 50 m · hauteurs non exagérées. Monuments simplifiés, positions indicatives. Bâtiments et rues OSM indisponibles (HTTP 406). Eau indicative.':'Maquette artistique originale · Géographie et proportions indicatives';
 dataButton.textContent=geographicMode?'Maquette artistique':'Relief géographique';
 document.querySelector('.sidebar-bottom small').textContent=geographicMode?'Relief réel · Ville détaillée en attente':'Maquette artistique · Géographie indicative';
 document.querySelector('.river-label').hidden=geographicMode;
}
dataButton.onclick=()=>{move=null;geographicMode=!geographicMode;applyGeography();targets.forEach((m,i)=>{m.position.set(...places[i].pos);m.scale.setScalar(geographicMode?5:1);});};
applyGeography();

// Batch static geometry by material to keep navigation smooth on smaller devices.
function batchStatic(group) {
  group.updateMatrixWorld(true);
  const batches = new Map();
  group.traverse(object => {
    if (!object.isMesh) return;
    const geometry = object.geometry.index ? object.geometry.toNonIndexed() : object.geometry.clone();
    geometry.applyMatrix4(object.matrixWorld);
    if (!batches.has(object.material)) batches.set(object.material, []);
    batches.get(object.material).push(geometry);
  });
  group.clear();
  for (const [material, geometries] of batches) {
    const merged = mergeGeometries(geometries);
    const mesh = new THREE.Mesh(merged, material);
    mesh.castShadow = true; mesh.receiveShadow = true;
    group.add(mesh);
    geometries.forEach(geometry => geometry.dispose());
  }
}
batchStatic(buildings); batchStatic(vegetation);

// Projected labels remain attached to the buildings while orbiting.
const labelHost=document.querySelector('#labels');places.forEach(p=>{const b=document.createElement('button');b.className='map-label'+(p.id==='frontenac'?' active':'');b.dataset.place=p.id;b.innerHTML=`<span class="label-dot"></span>${p.name}${p.id==='frontenac'?'<span class="label-small">↗</span>':''}`;labelHost.appendChild(b);});
let selected=places[0],move=null,markers=true;
function selectPlace(id,fly=false){selected=places.find(p=>p.id===id);document.querySelectorAll('[data-place]').forEach(e=>e.classList.toggle('active',e.dataset.place===id));document.querySelector('#detail-name').textContent=selected.name;document.querySelector('#detail-tag').textContent=selected.tag;document.querySelector('#detail-year').textContent='DEPUIS '+selected.year;document.querySelector('#detail-text').textContent=selected.text;document.querySelector('#detail-number').textContent=selected.n;if(fly)focusPlace();}
function travel(target,position){move={from:camera.position.clone(),to:position,fromTarget:controls.target.clone(),target,start:performance.now()};}
function focusPlace(){const t=new THREE.Vector3(...selected.pos);travel(t,t.clone().add(new THREE.Vector3(...(geographicMode?[310,290,370]:[31,29,37]))));}
document.querySelectorAll('[data-place]').forEach(b=>b.onclick=()=>selectPlace(b.dataset.place,true));document.querySelector('#focus').onclick=focusPlace;
document.querySelector('#buildings').onchange=e=>{buildings.visible=e.target.checked;geographic.group.children.slice(2).forEach(m=>m.visible=e.target.checked);};document.querySelector('#trees').onchange=e=>vegetation.visible=e.target.checked;document.querySelector('#markers').onchange=e=>{markers=e.target.checked;labelHost.hidden=!markers;};
const initial=new THREE.Vector3(100,94,125);
function setMode(overhead){if(geographicMode){const t=new THREE.Vector3(1200,40,500);travel(t,t.clone().add(overhead?new THREE.Vector3(0,6000,.1):new THREE.Vector3(2400,2500,3200)));document.querySelector('#perspective').classList.toggle('selected',!overhead);document.querySelector('#overhead').classList.toggle('selected',overhead);return;}document.querySelector('#perspective').classList.toggle('selected',!overhead);document.querySelector('#overhead').classList.toggle('selected',overhead);travel(new THREE.Vector3(),overhead?new THREE.Vector3(0,155,.1):initial.clone());}
document.querySelector('#perspective').onclick=()=>setMode(false);document.querySelector('#overhead').onclick=()=>setMode(true);document.querySelector('#reset').onclick=()=>setMode(false);
function zoom(factor){const offset=camera.position.clone().sub(controls.target);offset.setLength(THREE.MathUtils.clamp(offset.length()*factor,controls.minDistance,controls.maxDistance));travel(controls.target.clone(),controls.target.clone().add(offset));}
document.querySelector('#zoom-in').onclick=()=>zoom(.78);document.querySelector('#zoom-out').onclick=()=>zoom(1.28);
controls.addEventListener('start',()=>move=null);
document.querySelector('#light').oninput=e=>{const hour=Number(e.target.value);document.querySelector('#time-label').textContent=`${Math.floor(hour)}:${hour%1?'30':'00'}`;const t=(hour-7)/13;sun.position.set(Math.cos(t*Math.PI)*90,Math.sin(t*Math.PI)*90+8,40).multiplyScalar(geographicMode?65:1);sun.color.set(hour>17?'#ffbf82':'#ffebcd');sun.intensity=hour>19?1:3.2;scene.background.set(hour>19?'#a7b6bc':'#dce6e2');document.querySelector('.viewport').style.setProperty('--map-bg',hour>19?'#a7b6bc':'#dce6e2');};
function toast(text){const el=document.querySelector('#toast');el.textContent=text;el.classList.add('visible');setTimeout(()=>el.classList.remove('visible'),3000);}
document.querySelector('#capture').onclick=()=>{renderer.render(scene,camera);const a=document.createElement('a');a.download='quebec-atlas-3d.png';a.href=renderer.domElement.toDataURL('image/png');a.click();toast('Votre point de vue a été capturé.');};
document.querySelector('#fullscreen').onclick=async()=>{try{if(document.fullscreenElement)await document.exitFullscreen();else await document.querySelector('.viewport').requestFullscreen();}catch{toast('Le plein écran n’est pas disponible dans ce navigateur.');}};
const dialog=document.querySelector('#help-modal');document.querySelector('#help').onclick=()=>dialog.showModal();document.querySelector('#close-help').onclick=()=>dialog.close();dialog.addEventListener('click',e=>{if(e.target===dialog)dialog.close();});
// Picking a visible monument also selects its information card.
const ray=new THREE.Raycaster(),mouse=new THREE.Vector2();const targets=places.map(p=>{const m=new THREE.Mesh(new THREE.SphereGeometry(p.id==='citadelle'?10:5),new THREE.MeshBasicMaterial({visible:false}));m.position.set(...p.pos);m.scale.setScalar(geographicMode?5:1);m.userData.id=p.id;scene.add(m);return m;});let down;
renderer.domElement.addEventListener('pointerdown',e=>down=[e.clientX,e.clientY]);renderer.domElement.addEventListener('pointerup',e=>{if(!down||Math.hypot(e.clientX-down[0],e.clientY-down[1])>5||e.button!==0||!buildings.visible)return;const r=renderer.domElement.getBoundingClientRect();mouse.set((e.clientX-r.left)/r.width*2-1,-(e.clientY-r.top)/r.height*2+1);ray.setFromCamera(mouse,camera);const hit=ray.intersectObjects(targets)[0];if(hit)selectPlace(hit.object.userData.id);});
function resize(){const w=host.clientWidth,h=host.clientHeight;camera.aspect=w/h;camera.updateProjectionMatrix();renderer.setSize(w,h);}new ResizeObserver(resize).observe(host);resize();
const vector=new THREE.Vector3();function animate(now){requestAnimationFrame(animate);if(move){let t=Math.min((now-move.start)/1100,1);t=t*t*(3-2*t);camera.position.lerpVectors(move.from,move.to,t);controls.target.lerpVectors(move.fromTarget,move.target,t);if(t===1)move=null;}controls.update();renderer.render(scene,camera);
 const center=controls.target.clone().project(camera), east=controls.target.clone().add(new THREE.Vector3(100,0,0)).project(camera);
 const pixelsPerMetre=Math.hypot((east.x-center.x)*host.clientWidth/2,(east.y-center.y)*host.clientHeight/2)/100;
 const scaleMetres=10**Math.floor(Math.log10(80/Math.max(pixelsPerMetre,.00001)));
 document.querySelector('.scale').innerHTML=geographicMode?`0 <i style="width:${scaleMetres*pixelsPerMetre}px"></i> ${scaleMetres} m <b>EST-OUEST AU CENTRE</b>`:'<b>MAQUETTE ARTISTIQUE · SANS ÉCHELLE</b>';
 if(markers){places.forEach(p=>{vector.set(...p.pos);vector.y+=(p.id==='frontenac'?12:7)*(geographicMode?5:1);vector.project(camera);const el=labelHost.querySelector(`[data-place="${p.id}"]`);el.style.left=`${(vector.x*.5+.5)*host.clientWidth}px`;el.style.top=`${(-vector.y*.5+.5)*host.clientHeight}px`;el.style.display=vector.z>1||vector.x<-.95||vector.x>.95||vector.y<-.8||vector.y>.85?'none':'';});}document.querySelector('.compass svg').style.transform=`rotate(${Math.atan2(camera.position.x-controls.target.x,camera.position.z-controls.target.z)*180/Math.PI}deg)`;}
requestAnimationFrame(animate);document.querySelector('#loading').remove();
