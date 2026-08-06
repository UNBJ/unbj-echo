import { execSync } from 'child_process';
import path from 'path';
import fs from 'fs-extra';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');
const testProjectName = 'test-generation-build';
const testProjectPath = path.join(rootDir, testProjectName);

const SCENARIOS = [
  {
    name: '1. Roles con todos los módulos y multi-idioma (es-en)',
    archetype: 'roles',
    modules: 'tshirt,workshops,rooms,voting',
    languages: 'es-en',
    expectedModules: ['tshirt', 'workshops', 'rooms', 'voting'],
  },
  {
    name: '2. Plenarias con todos los módulos y miembresías (es-en)',
    archetype: 'plenarias',
    modules: 'tshirt,workshops,rooms,voting',
    languages: 'es-en',
    expectedModules: ['tshirt', 'workshops', 'rooms', 'voting'],
  },
  {
    name: '3. Standard con español único y sin módulos opcionales',
    archetype: 'standard',
    modules: '',
    languages: 'es',
    expectedModules: [],
  }
];

const MODULE_SERVERLESS_MARKERS = {
  tshirt: ['/users/shirt-size/status', '/users/shirt-size/select'],
  workshops: ['/logistic/studios', '/logistic/my-studios', '/logistic/studios/select'],
  rooms: [
    '/logistic/rooms/status',
    '/logistic/rooms/create',
    '/logistic/rooms/join',
    '/logistic/rooms/requests',
    '/logistic/rooms/requests/respond',
    '/logistic/rooms/leave',
  ],
  voting: ['/polls/active', '/polls/vote', '/admin/polls', '/admin/polls/{id}/toggle'],
};

async function assertGeneratedArtifacts(projectPath, scenario) {
  const serverlessPath = path.join(projectPath, 'packages', 'api', 'serverless.yml');
  const portalFeaturesPath = path.join(projectPath, 'apps', 'portal', 'src', 'config', 'features.config.ts');
  const apiFeaturesPath = path.join(projectPath, 'packages', 'api', 'src', 'config', 'features.ts');

  const [serverlessContent, portalFeatures, apiFeatures] = await Promise.all([
    fs.readFile(serverlessPath, 'utf8'),
    fs.readFile(portalFeaturesPath, 'utf8'),
    fs.readFile(apiFeaturesPath, 'utf8'),
  ]);

  for (const [moduleName, markers] of Object.entries(MODULE_SERVERLESS_MARKERS)) {
    const shouldEnableByDefault = scenario.expectedModules.includes(moduleName);
    for (const marker of markers) {
      if (!serverlessContent.includes(marker)) {
        throw new Error(`Endpoint faltante para modulo "${moduleName}" en escenario "${scenario.name}": ${marker}`);
      }
    }

    const expectedFlag = shouldEnableByDefault ? 'true' : 'false';
    const portalMarker = `${moduleName}Enabled: ${expectedFlag}`;
    const apiMarker = `${moduleName}Enabled: ${expectedFlag}`;
    if (!portalFeatures.includes(portalMarker)) {
      throw new Error(`Flag faltante en portal para modulo "${moduleName}" en escenario "${scenario.name}"`);
    }
    if (!apiFeatures.includes(apiMarker)) {
      throw new Error(`Flag faltante en api para modulo "${moduleName}" en escenario "${scenario.name}"`);
    }
  }
}

async function runTest() {
  console.log('🚀 Iniciando pruebas de cobertura de compilacion del generador...\n');

  try {
    // 1. Asegurar que el CLI esté compilado
    console.log('📦 Compilando unbj-echo CLI...');
    execSync('npm run build', { cwd: rootDir, stdio: 'inherit' });
    console.log('✅ CLI compilado con éxito.\n');

    for (const scenario of SCENARIOS) {
      console.log(`--------------------------------------------------------------------------------`);
      console.log(`🎬 Ejecutando escenario: ${scenario.name}`);
      console.log(`--------------------------------------------------------------------------------`);

      // Limpiar directorio de prueba previo si existe
      if (await fs.pathExists(testProjectPath)) {
        await fs.remove(testProjectPath);
      }

      // Generar el proyecto
      console.log(`👾 Generando proyecto [arquetipo: ${scenario.archetype}, idiomas: ${scenario.languages}, módulos: ${scenario.modules || 'ninguno'}]...`);
      const generateCommand = `node dist/index.js --output ${testProjectName} --event-name "Test Compilación Escenario" -a ${scenario.archetype} -m "${scenario.modules || ''}" -l ${scenario.languages} -y`;
      execSync(generateCommand, { cwd: rootDir, stdio: 'inherit' });
      console.log('✅ Proyecto generado.');

      console.log('🧪 Validando artefactos generados...');
      await assertGeneratedArtifacts(testProjectPath, scenario);
      console.log('✅ Artefactos validados.');

      // Instalar dependencias
      console.log('📥 Instalando dependencias (pnpm install)...');
      execSync('pnpm install', { cwd: testProjectPath, stdio: 'inherit' });
      console.log('✅ Dependencias instaladas.');

      // Verificación de tipos
      console.log('🔍 Ejecutando verificación de tipos (pnpm typecheck)...');
      execSync('pnpm run typecheck', { cwd: testProjectPath, stdio: 'inherit' });
      console.log(`🎉 Escenario verificado con éxito!\n`);

      // Limpieza parcial
      await fs.remove(testProjectPath);
    }

    console.log('🏆 ¡Todos los escenarios del generador han sido validados con éxito y compilan al 100%! 🏆\n');

  } catch (error) {
    console.error('\n❌ La prueba falló con el siguiente error:');
    console.error(error.message);
    
    // Dejar la carpeta de pruebas intacta si hay un error para poder depurar
    console.log(`💡 Conservando la carpeta ${testProjectName} para facilitar la inspección del error.`);
    process.exit(1);
  }
}

runTest();
