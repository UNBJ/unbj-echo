import { execFileSync, execSync } from 'child_process';
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

function getListeningPid(port) {
  try {
    return execFileSync('lsof', ['-tiTCP:' + String(port), '-sTCP:LISTEN'], {
      cwd: rootDir,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    }).trim();
  } catch {
    return '';
  }
}

function assertPreviewNotRunning() {
  const previewPorts = [
    { port: 3100, name: 'portal' },
    { port: 3102, name: 'admin' },
    { port: 3001, name: 'api' },
  ];

  const busyPorts = previewPorts
    .map(({ port, name }) => ({ port, name, pid: getListeningPid(port) }))
    .filter(({ pid }) => pid);

  if (busyPorts.length === 0) return;

  const details = busyPorts.map(({ name, port, pid }) => `${name}:${port} (PID ${pid})`).join(', ');
  throw new Error(
    `Preview activo detectado. Deten los procesos antes de regenerar: ${details}`
  );
}

async function cleanPreview() {
  assertPreviewNotRunning();
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
  await writePreviewEnvFiles();
}

async function writePreviewEnvFiles() {
  const apiEnvPath = path.join(previewProjectPath, 'packages', 'api', '.env');
  const portalEnvPath = path.join(previewProjectPath, 'apps', 'portal', '.env.local');
  const adminEnvPath = path.join(previewProjectPath, 'apps', 'admin', '.env.local');

  const apiEnv = `FIREBASE_PROJECT_ID=preview-local
FIREBASE_CLIENT_EMAIL=preview-local@example.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\\npreview-local\\n-----END PRIVATE KEY-----\\n"
FIREBASE_STORAGE_BUCKET=preview-local.appspot.com
RESEND_API_KEY=
RESEND_FROM_EMAIL=onboarding@resend.dev
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=preview-local.appspot.com
NEXT_PUBLIC_PORTAL_URL=http://localhost:3100
NEXT_PUBLIC_ADMIN_URL=http://localhost:3102
NEXT_PUBLIC_API_URL=http://localhost:3001
`;

  const clientEnv = `NEXT_PUBLIC_API_URL=http://localhost:3001
NEXT_PUBLIC_PORTAL_URL=http://localhost:3100
NEXT_PUBLIC_ADMIN_URL=http://localhost:3102
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=preview-local
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=preview-local.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=
`;

  await fs.writeFile(apiEnvPath, apiEnv, 'utf8');
  await fs.writeFile(portalEnvPath, clientEnv, 'utf8');
  await fs.writeFile(adminEnvPath, clientEnv, 'utf8');
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
