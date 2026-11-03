import { chromium } from 'playwright';
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
const html=await readFile(new URL('../maquette-quebec.html',import.meta.url));
const server=createServer((req,res)=>{res.setHeader('Content-Type','text/html');res.end(html);});
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
const url=`http://127.0.0.1:${server.address().port}/maquette-quebec.html`;
try {
const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH || '/usr/bin/chromium',headless:true,args:['--no-sandbox','--enable-unsafe-swiftshader']});
const page=await browser.newPage({viewport:{width:1440,height:1000}});
const errors=[];page.on('pageerror',e=>errors.push(e.message));
const requests=[];page.on('request',r=>requests.push(r.url()));
await page.goto(url);
await page.waitForTimeout(2500);

if(!await page.locator('canvas').isVisible())throw Error('No visible canvas');
if(!await page.locator('.geographic-attribution').textContent().then(t=>t.includes('Mapzen')))throw Error('Geographic mode missing');
await page.locator('[data-place="parlement"]').first().click();await page.waitForTimeout(1400);
if(await page.locator('#detail-name').textContent()!=='Hôtel du Parlement')throw Error('Selection failed');
await page.locator('#overhead').click();await page.waitForTimeout(1300);
await page.locator('#geography').click();await page.waitForTimeout(1000);

await page.locator('#geography').click();await page.locator('#buildings').uncheck();await page.locator('#buildings').check();
await page.locator('#light').fill('19');await page.locator('#light').dispatchEvent('input');
await page.locator('#reset').click();await page.waitForTimeout(1400);
if(errors.length)throw Error(errors.join('\n'));
if(requests.some(u=>u!==url))throw Error('Offline HTML made external requests');
console.log('PASS: standalone served HTML WebGL, geographic/artistic views, selection, layers, lighting, overhead/reset; no runtime errors or network requests.');
await browser.close();

} finally { server.close(); }
