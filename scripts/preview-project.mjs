import { execSync } from 'child_process';
import path from 'path';
import fs from 'fs-extra';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');
const previewProjectName = 'preview-project';
const previewProjectPath = path.join(rootDir, previewProjectName);

function run(command, cwd = rootDir) {
  execSync(command, { cwd, stdio: 'inherit' });
}

async function cleanPreview() {
  if (await fs.pathExists(previewProjectPath)) {
    await fs.remove(previewProjectPath);
  }
}

async function generatePreview() {
  run('npm run build');
  await cleanPreview();
  run(
    `node dist/index.js -n ${previewProjectName} -e "Preview Platform" -a plenarias -m "tshirt,workshops,rooms,voting" -l es-en -y`
  );
}

async function main() {
  const action = process.argv[2];

  switch (action) {
    case 'clean':
      await cleanPreview();
      break;
    case 'generate':
      await generatePreview();
      break;
    case 'refresh':
      await generatePreview();
      run(`pnpm install --dir ${previewProjectName}`);
      break;
    default:
      console.error(`Accion no soportada: ${action ?? '(ninguna)'}`);
      process.exit(1);
  }
}

main().catch((error) => {
  console.error('preview-project error:', error);
  process.exit(1);
});
