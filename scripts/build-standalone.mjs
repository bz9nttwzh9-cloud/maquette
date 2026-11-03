import { build } from 'vite';
import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));
const result = await build({
  configFile: false,
  root,
  logLevel: 'warn',
  build: {
    write: false,
    assetsInlineLimit: Infinity,
    cssCodeSplit: false,
    rollupOptions: {
      input: fileURLToPath(new URL('../src/main.js', import.meta.url)),
      output: { format: 'iife', inlineDynamicImports: true },
    },
  },
});
const outputs = result.output;
const script = outputs.find(output => output.type === 'chunk' && output.isEntry);
const styles = outputs.filter(output => output.type === 'asset' && output.fileName.endsWith('.css'));
if (!script || styles.length !== 1 || outputs.some(output => output !== script && !styles.includes(output))) {
  throw new Error('Standalone build must contain one script, one stylesheet, and no external assets.');
}
const template = await readFile(new URL('../index.html', import.meta.url), 'utf8');
const html = template
  .replace('</head>', () => `<style>${String(styles[0].source).replace(/<\/style/gi, '<\\/style')}</style></head>`)
  .replace('<script type="module" src="/src/main.js"></script>', () => `<script>${script.code.replace(/<\/script/gi, '<\\/script')}</script>`);
if (html.includes('src="/src/main.js"')) throw new Error('Source entry was not replaced.');
const destination = new URL('../maquette-quebec.html', import.meta.url);
await writeFile(destination, html);
await writeFile(new URL('../dist/maquette-quebec.html', import.meta.url), html);
console.log(`Standalone HTML: maquette-quebec.html (${Math.round(Buffer.byteLength(html) / 1024)} KiB)`);
