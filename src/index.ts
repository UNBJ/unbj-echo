import path from 'path';
import { Command } from 'commander';
import { intro, outro, text, select, multiselect, spinner, confirm } from '@clack/prompts';
import picocolors from 'picocolors';
import { generateProject } from './utils/generator';

const program = new Command();

program
  .name('unbj-echo')
  .description('CLI to generate customized event registration platforms')
  .version('1.0.0')
  .option('-n, --name <name>', 'Nombre de la carpeta del proyecto')
  .option('-e, --event <event>', 'Nombre del evento')
  .option('-a, --archetype <archetype>', 'Arquetipo base (standard, roles, plenarias)')
  .option('-m, --modules <modules>', 'Módulos separados por coma (tshirt, workshops, rooms, voting)')
  .option('-l, --languages <languages>', 'Idiomas (es, es-en)')
  .option('-y, --yes', 'Omitir confirmación de generación')
  .action(async (options) => {
    console.clear();
    intro(picocolors.cyan('👾 unbj-echo — CLI de Echo'));

    // Validar flags básicos antes de proceder
    if (options.archetype && !['standard', 'roles', 'plenarias'].includes(options.archetype)) {
      console.error(picocolors.red(`Error: Arquetipo inválido "${options.archetype}". Debe ser "standard", "roles" o "plenarias".`));
      process.exit(1);
    }
    if (options.languages && !['es', 'es-en'].includes(options.languages)) {
      console.error(picocolors.red(`Error: Idioma inválido "${options.languages}". Debe ser "es" o "es-en".`));
      process.exit(1);
    }

    // 1. Nombre del directorio/proyecto
    let projectDir: string;
    if (options.name) {
      projectDir = options.name;
    } else {
      const res = await text({
        message: '¿Cómo se llamará la carpeta del proyecto?',
        placeholder: 'mi-plataforma-registro',
        defaultValue: 'mi-plataforma-registro',
        validate(value) {
          if (value.trim().length === 0) return 'El nombre no puede estar vacío';
          if (/[^a-zA-Z0-9-_]/.test(value)) return 'El nombre solo puede contener letras, números, guiones y guiones bajos';
        },
      });
      if (typeof res === 'symbol') {
        outro(picocolors.yellow('Proceso cancelado.'));
        process.exit(0);
      }
      projectDir = res;
    }

    // 2. Nombre del Evento
    let eventName: string;
    if (options.event) {
      eventName = options.event;
    } else {
      const res = await text({
        message: '¿Cuál es el nombre del evento?',
        placeholder: 'Plenarias Anuales 2026',
        defaultValue: 'Plenarias Anuales 2026',
        validate(value) {
          if (value.trim().length === 0) return 'El nombre del evento no puede estar vacío';
        },
      });
      if (typeof res === 'symbol') {
        outro(picocolors.yellow('Proceso cancelado.'));
        process.exit(0);
      }
      eventName = res;
    }

    // 3. Selección de Arquetipo de Evento
    let archetype: string;
    if (options.archetype) {
      archetype = options.archetype;
    } else {
      const res = await select({
        message: 'Selecciona el arquetipo de flujo base para el evento:',
        options: [
          {
            value: 'standard',
            label: 'Registro Estándar',
            hint: 'Formulario básico + Pago + QR (Ideal para congresos y festivales)',
          },
          {
            value: 'roles',
            label: 'Registro por Roles / Entradas',
            hint: 'Categorías (VIP, General, Estudiante) con precios y cupos independientes',
          },
          {
            value: 'plenarias',
            label: 'Registro Plenarias CNBM',
            hint: 'Búsqueda de iglesia, validación de cupos de mensajeros y carga de carta',
          },
        ],
      });
      if (typeof res === 'symbol') {
        outro(picocolors.yellow('Proceso cancelado.'));
        process.exit(0);
      }
      archetype = res;
    }

    // 4. Selección de Módulos (Puzzle Pieces)
    let modules: string[];
    if (options.modules !== undefined) {
      modules = options.modules ? options.modules.split(',').map((m: string) => m.trim()) : [];
      const validModules = ['tshirt', 'workshops', 'rooms', 'voting'];
      for (const mod of modules) {
        if (!validModules.includes(mod)) {
          console.error(picocolors.red(`Error: Módulo inválido "${mod}". Debe ser uno de: ${validModules.join(', ')}`));
          process.exit(1);
        }
      }
    } else {
      const res = await multiselect({
        message: 'Selecciona los módulos adicionales a inyectar (Rompecabezas):',
        options: [
          {
            value: 'tshirt',
            label: 'Tallas de Playeras',
            hint: 'Añade campo de talla en el formulario y estadísticas de pedido en el panel de administración',
          },
          {
            value: 'workshops',
            label: 'Selección de Talleres',
            hint: 'Añade catálogo de talleres con cupo limitado y selección post-pago',
          },
          {
            value: 'rooms',
            label: 'Hospedaje y Asignación de Cuartos',
            hint: 'Lógica completa de responsable de habitación, códigos de invitación y compañeros',
          },
          {
            value: 'voting',
            label: 'Votación en Tiempo Real',
            hint: 'Votaciones anónimas en vivo (para el portal) y visor en proyector (para el panel admin)',
          },
        ],
        required: false,
      });
      if (typeof res === 'symbol') {
        outro(picocolors.yellow('Proceso cancelado.'));
        process.exit(0);
      }
      modules = res as string[];
    }

    // 5. Soporte Multi-idioma
    let languages: string;
    if (options.languages) {
      languages = options.languages;
    } else {
      const res = await select({
        message: '¿El portal de registro debe contar con soporte multi-idioma (next-intl)?',
        options: [
          {
            value: 'es-en',
            label: 'Sí, Multi-idioma (Español e Inglés)',
            hint: 'Configura locales es/en y selector de idioma en el portal',
          },
          {
            value: 'es',
            label: 'No, Solo Español',
            hint: 'El portal estará predeterminado únicamente en español',
          },
        ],
      });
      if (typeof res === 'symbol') {
        outro(picocolors.yellow('Proceso cancelado.'));
        process.exit(0);
      }
      languages = res;
    }

    // 6. Confirmación de generación
    if (!options.yes) {
      console.log('\n' + picocolors.cyan('📋 Resumen de la Configuración:'));
      console.log(`  • Carpeta:      ${picocolors.green(projectDir)}`);
      console.log(`  • Evento:       ${picocolors.green(eventName)}`);
      console.log(`  • Arquetipo:    ${picocolors.green(archetype)}`);
      console.log(`  • Módulos:      ${picocolors.green(modules.length > 0 ? modules.join(', ') : 'Ninguno')}`);
      console.log(`  • Idiomas:      ${picocolors.green(languages)}\n`);

      const shouldProceed = await confirm({
        message: '¿Quieres generar la plataforma de registro con esta configuración?',
      });

      if (!shouldProceed || typeof shouldProceed === 'symbol') {
        outro(picocolors.yellow('Generación cancelada por el usuario.'));
        process.exit(0);
      }
    }

    const s = spinner();
    s.start('Generando estructura de archivos y configuraciones...');
    
    try {
      const destPath = path.resolve(process.cwd(), projectDir);
      await generateProject(destPath, {
        projectName: projectDir,
        eventName: eventName,
        archetype: archetype as any,
        modules: modules,
        languages: languages as any,
      });
      s.stop('¡Estructura base generada!');
    } catch (error: any) {
      s.stop('Error durante la generación');
      outro(picocolors.red(`Ocurrió un error: ${error.message}`));
      process.exit(1);
    }

    outro(
      picocolors.green(`🎉 Plataforma creada con éxito en el directorio ./${projectDir}\n`) +
      picocolors.dim('Siguientes pasos:\n') +
      picocolors.dim(`  1. cd ${projectDir}\n`) +
      picocolors.dim('  2. Sigue las instrucciones de configuración en el README.md')
    );
  });

program.parse(process.argv);
