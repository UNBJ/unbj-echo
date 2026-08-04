import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const srcProject = '/Users/raulcanul/Documents/Dev/registro-plenarias';
const destTemplate = path.join(__dirname, '..', 'templates', 'archetypes', 'plenarias');

// Carpetas y archivos a ignorar al copiar las plantillas
const IGNORE_LIST = [
  '.git',
  'node_modules',
  '.next',
  '.serverless',
  '.esbuild',
  'pnpm-lock.yaml',
  'CLAUDE.md',
  '.env.local',
  '.env'
];

async function copyTemplates() {
  console.log(`🧹 Limpiando directorio destino: ${destTemplate}...`);
  await fs.remove(destTemplate);
  await fs.ensureDir(destTemplate);

  console.log(`🚀 Copiando de ${srcProject} a ${destTemplate}...`);
  await fs.copy(srcProject, destTemplate, {
    filter: (src) => {
      const relativePath = path.relative(srcProject, src);
      const parts = relativePath.split(path.sep);
      
      // Si algún elemento de la ruta está en la lista de ignorados, se filtra
      const shouldIgnore = parts.some(part => IGNORE_LIST.includes(part));
      
      return !shouldIgnore;
    }
  });

  console.log('✅ Copiado de plantilla "plenarias" completado con éxito.');
}

copyTemplates().catch(err => {
  console.error('❌ Error copiando plantillas:', err);
  process.exit(1);
});
