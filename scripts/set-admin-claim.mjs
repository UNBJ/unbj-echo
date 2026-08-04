import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');
const apiDir = path.join(rootDir, 'preview-project', 'packages', 'api');
const envPath = path.join(apiDir, '.env');
const requireFromApi = createRequire(path.join(apiDir, 'package.json'));
const admin = requireFromApi('firebase-admin');

function readEnvFile(filePath) {
  const env = {};
  const content = fs.readFileSync(filePath, 'utf8');
  for (const line of content.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const idx = trimmed.indexOf('=');
    if (idx === -1) continue;
    const key = trimmed.slice(0, idx).trim();
    let value = trimmed.slice(idx + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    env[key] = value;
  }
  return env;
}

function getArgs() {
  const [, , email, role = 'super_admin'] = process.argv;
  if (!email) {
    console.error('Uso: npm run preview:grant-admin -- <email> [admin|super_admin]');
    process.exit(1);
  }
  if (!['admin', 'super_admin'].includes(role)) {
    console.error(`Rol invalido: ${role}. Usa admin o super_admin.`);
    process.exit(1);
  }
  return { email, role };
}

async function main() {
  const { email, role } = getArgs();

  if (!fs.existsSync(envPath)) {
    console.error(`No existe ${envPath}. Corre primero npm run preview:refresh o configura el preview.`);
    process.exit(1);
  }

  const env = readEnvFile(envPath);
  const projectId = env.FIREBASE_PROJECT_ID;
  const clientEmail = env.FIREBASE_CLIENT_EMAIL;
  const privateKey = env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');

  if (!projectId || !clientEmail || !privateKey) {
    console.error('Faltan FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL o FIREBASE_PRIVATE_KEY en preview-project/packages/api/.env');
    process.exit(1);
  }

  if (!admin.apps.length) {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId,
        clientEmail,
        privateKey,
      }),
    });
  }

  const user = await admin.auth().getUserByEmail(email);
  const nextClaims = { ...(user.customClaims ?? {}), role };
  await admin.auth().setCustomUserClaims(user.uid, nextClaims);

  console.log(`Claim asignado: ${email} -> ${role}`);
  console.log('Cierra sesion en el admin y vuelve a entrar para refrescar el token.');
}

main().catch((error) => {
  console.error('No se pudo asignar el claim:', error);
  process.exit(1);
});
