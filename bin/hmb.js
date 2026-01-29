#!/usr/bin/env node
'use strict';

const { Command } = require('commander');
const path = require('path');
const { Builder } = require('../src/index');
const ConfigLoader = require('../src/utils/ConfigLoader');

// Load config from current working directory
const userConfig = ConfigLoader.load();

const program = new Command();

program
    .name('hmb')
    .description('HMB - Html Module Builder')
    .version(require('../package.json').version);

program
    .command('build')
    .description('Build the project')
    .option('-s, --source <path>', 'Source directory')
    .option('-d, --dest <path>', 'Output directory')
    .option('-m, --module <path>', 'Module directory')
    .option('--minify', 'Minify output HTML')
    .action(async (options) => {
        try {
            const finalOptions = { ...userConfig, ...options };
            const builder = new Builder({
                sourceDir: finalOptions.source,
                outputDir: finalOptions.dest,
                moduleDir: finalOptions.module,
                env: 'production',
                varDir: finalOptions.var || finalOptions.varDir // handle inconsistent naming if any, though Builder handles it mostly.
                // CLI options -> Builder options mapping needs care if keys differ.
                // CLI: source, dest, module
                // Builder: sourceDir, outputDir, moduleDir
                // Config: sourceDir, outputDir, moduleDir (as per README)
            });
            // We need to map CLI short opts to Builder opts if not present
            if (!builder.options.sourceDir && finalOptions.source) builder.options.sourceDir = finalOptions.source;
            // Actually, best is passing everything and let Builder handle defaults/overrides?
            // Builder constructor mixes in `options` argument.
            // But CLI `options` has `source`, `dest`. Builder expects `sourceDir`, `outputDir`.

            // Helper to get option value respecting priority: CLI (if set) > Config > Default
            const getVal = (cliKey, configKey, defaultVal) => {
                // commander options contains defaults if not set by user? 
                // Yes, commander sets defaults. We need to distinguish if user provided it.
                // Actually, if user didn't provide, it has default value.
                // But we want Config to override commander default if user didn't provide specific arg.
                // Commander's .option() sets default. If we rely on that, we can't easily distinguish.
                // Better approach: Don't set defaults in .option(), handle defaults here?
                // Or: check process.argv? Too messy.
                // Or: use program.opts() source? 

                // Let's assume if option === default, we check config.
                // But what if user explicitly passed the default value?
                // For now, simpler logic:
                // If userConfig has it, use it. If not, use option (which has default 'pages' etc).

                // WAIT. options.source is 'pages' by default. userConfig might be 'example/pages'.
                // If we use options.source || userConfig.sourceDir, it will take 'pages' always.
                // We need: (UserArg) > Config > Default.

                // Commander has .getOptionValueSource(key) in newer versions, but we might be on older?
                // Let's remove defaults from .option() definitions and handle them here manually.
                return options[cliKey] || (userConfig && userConfig[configKey]) || defaultVal;
            };

            const buildOptions = {
                sourceDir: getVal('source', 'sourceDir', 'pages'),
                outputDir: getVal('dest', 'outputDir', 'dist'),
                moduleDir: getVal('module', 'moduleDir', 'modules'),
                ...(userConfig.varDir ? { varDir: userConfig.varDir } : {}),
                minify: options.minify || userConfig.minify || false,
                env: 'production'
            };

            const builderInstance = new Builder(buildOptions);
            await builderInstance.build();
        } catch (err) {
            console.error('Build failed:', err);
            process.exit(1);
        }
    });

program
    .command('dev')
    .description('Start development server with watch mode')
    .option('-s, --source <path>', 'Source directory')
    .option('-d, --dest <path>', 'Output directory')
    .option('-m, --module <path>', 'Module directory')
    .option('-p, --port <number>', 'Port number')
    .action(async (options) => {
        try {
            const { DevServer } = require('../src/index');

            const devOptions = {
                sourceDir: options.source || userConfig.sourceDir,
                outputDir: options.dest || userConfig.outputDir,
                moduleDir: options.module || userConfig.moduleDir,
                varDir: userConfig.varDir,
                port: parseInt(options.port || userConfig.devServer?.port || '3000', 10),
                env: 'development'
            };

            const server = new DevServer(devOptions);
            await server.start();
        } catch (err) {
            console.error('Dev server failed:', err);
            process.exit(1);
        }
    });

program
    .command('init [projectName]')
    .description('Initialize a new HMB project')
    .action(async (projectName) => {
        try {
            const targetDir = projectName ? path.resolve(process.cwd(), projectName) : process.cwd();
            const { Initializer } = require('../src/index');
            const initializer = new Initializer(targetDir);
            await initializer.run();
        } catch (err) {
            console.error('Initialization failed:', err);
            process.exit(1);
        }
    });

program.parse();
