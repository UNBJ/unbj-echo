#!/usr/bin/env node

import fs from 'fs-extra';
import path from 'path';
import { Command } from 'commander';
import { intro, outro, text, select, multiselect, spinner, confirm } from '@clack/prompts';
import picocolors from 'picocolors';
import { generateProject } from './utils/generator';

const ARCHETYPES = ['standard', 'roles', 'plenarias'] as const;
const LANGUAGES = ['es', 'es-en'] as const;
const MODULES = ['tshirt', 'workshops', 'rooms', 'voting'] as const;

function slugify(value: string): string {
  const slug = value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return slug || 'evento';
}

function cancelled(): never {
  outro(picocolors.yellow('Proceso cancelado.'));
  process.exit(0);
}

async function askEventName(): Promise<string> {
  const result = await text({
    message: '¿Cuál es el nombre del evento?',
    placeholder: 'Congreso Anual 2026',
    validate(value) {
      if (!value.trim()) return 'El nombre del evento no puede estar vacío';
    },
  });
  if (typeof result === 'symbol') cancelled();
  return result as string;
}

function validateDestination(destPath: string): void {
  if (!fs.existsSync(destPath)) return;
  const entries = fs.readdirSync(destPath);
  if (entries.length > 0) {
    throw new Error(`La carpeta destino ya existe y no está vacía: ${destPath}. Usa --output con otra ruta.`);
  }
}

const program = new Command();

program
  .name('unbj-echo')
  .description('CLI to generate customized event registration platforms')
  .version('1.0.0')
  .option('-n, --event-name <name>', 'Nombre visible del evento')
  .option('-e, --event <event>', 'Alias compatible de --event-name')
  .option('-o, --output <path>', 'Ruta de salida (por defecto, una subcarpeta del directorio actual)')
  .option('-a, --archetype <archetype>', 'Arquetipo base (standard, roles, plenarias)')
  .option('-m, --modules <modules>', 'Módulos separados por coma (tshirt, workshops, rooms, voting)')
  .option('-l, --languages <languages>', 'Idiomas (es, es-en)')
  .option('-y, --yes', 'Omitir confirmaciones de destino y generación')
  .action(async (options) => {
    console.clear();
    intro(picocolors.cyan('👾 unbj-echo — CLI de Echo'));

    if (options.archetype && !ARCHETYPES.includes(options.archetype)) {
      console.error(picocolors.red(`Error: Arquetipo inválido "${options.archetype}". Debe ser "${ARCHETYPES.join('", "')}".`));
      process.exit(1);
    }
    if (options.languages && !LANGUAGES.includes(options.languages)) {
      console.error(picocolors.red(`Error: Idioma inválido "${options.languages}". Debe ser "${LANGUAGES.join('" o "')}".`));
      process.exit(1);
    }

    const eventName = options.eventName ?? options.event ?? await askEventName();
    const projectName = slugify(eventName);
    const outputPath = options.output
      ? path.resolve(process.cwd(), options.output)
      : path.resolve(process.cwd(), projectName);

    let archetype: string = options.archetype;
    if (!archetype) {
      const result = await select({
        message: 'Selecciona el arquetipo de flujo base para el evento:',
        options: [
          { value: 'standard', label: 'Registro Estándar', hint: 'Formulario básico + Pago + QR' },
          { value: 'roles', label: 'Registro por Roles / Entradas', hint: 'Categorías con precios y cupos independientes' },
          { value: 'plenarias', label: 'Registro por Iglesias / Delegados', hint: 'Iglesias, delegados y carta de autorización' },
        ],
      });
      if (typeof result === 'symbol') cancelled();
      archetype = result as string;
    }

    let modules: string[];
    if (options.modules !== undefined) {
      modules = options.modules ? options.modules.split(',').map((module: string) => module.trim()).filter(Boolean) : [];
    } else {
      const result = await multiselect({
        message: 'Selecciona los módulos adicionales a inyectar:',
        options: [
          { value: 'tshirt', label: 'Tallas de Playeras', hint: 'Campo de talla y estadísticas' },
          { value: 'workshops', label: 'Selección de Talleres', hint: 'Catálogo con cupo limitado' },
          { value: 'rooms', label: 'Hospedaje y Asignación de Cuartos', hint: 'Responsables y compañeros' },
          { value: 'voting', label: 'Votación en Tiempo Real', hint: 'Votaciones en vivo y resultados' },
        ],
        required: false,
      });
      if (typeof result === 'symbol') cancelled();
      modules = result as string[];
    }

    const invalidModules = modules.filter((module) => !MODULES.includes(module as typeof MODULES[number]));
    if (invalidModules.length) {
      console.error(picocolors.red(`Error: Módulo(s) inválido(s): ${invalidModules.join(', ')}. Deben ser: ${MODULES.join(', ')}.`));
      process.exit(1);
    }

    let languages: string = options.languages;
    if (!languages) {
      const result = await select({
        message: '¿El portal de registro debe contar con soporte multi-idioma?',
        options: [
          { value: 'es-en', label: 'Sí, Español e Inglés', hint: 'Configura locales es/en' },
          { value: 'es', label: 'No, Solo Español', hint: 'Portal únicamente en español' },
        ],
      });
      if (typeof result === 'symbol') cancelled();
      languages = result as string;
    }

    try {
      validateDestination(outputPath);
    } catch (error: any) {
      outro(picocolors.red(error.message));
      process.exit(1);
    }

    if (!options.yes) {
      console.log('\n' + picocolors.cyan('📋 Resumen de la configuración:'));
      console.log(`  • Evento:       ${picocolors.green(eventName)}`);
      console.log(`  • Carpeta:      ${picocolors.green(outputPath)}`);
      console.log(`  • Nombre técnico: ${picocolors.green(projectName)}`);
      console.log(`  • Arquetipo:    ${picocolors.green(archetype)}`);
      console.log(`  • Módulos:      ${picocolors.green(modules.length ? modules.join(', ') : 'Ninguno')}`);
      console.log(`  • Idiomas:      ${picocolors.green(languages)}\n`);
      const shouldProceed = await confirm({ message: '¿Quieres generar la plataforma con esta configuración?' });
      if (!shouldProceed || typeof shouldProceed === 'symbol') {
        outro(picocolors.yellow('Generación cancelada por el usuario.'));
        process.exit(0);
      }
    }

    const s = spinner();
    s.start('Generando estructura de archivos y configuraciones...');
    try {
      await generateProject(outputPath, {
        projectName,
        eventName,
        archetype: archetype as any,
        modules,
        languages: languages as any,
      });
      s.stop('¡Estructura base generada!');
    } catch (error: any) {
      s.stop('Error durante la generación');
      outro(picocolors.red(`Ocurrió un error: ${error.message}`));
      process.exit(1);
    }

    outro(
      picocolors.green(`🎉 Plataforma creada con éxito en ${outputPath}\n`) +
      picocolors.dim('Siguientes pasos:\n') +
      picocolors.dim(`  1. cd ${outputPath}\n`) +
      picocolors.dim('  2. pnpm install\n') +
      picocolors.dim('  3. Sigue las instrucciones de configuración en README.md')
    );
  });

program.parse(process.argv);
