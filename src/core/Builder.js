'use strict';

const fs = require('fs-extra');
const path = require('path');

class Builder {
    constructor(options = {}) {
        this.options = {
            sourceDir: options.sourceDir || 'pages',
            outputDir: options.outputDir || 'dist',
            moduleDir: options.moduleDir || 'modules',
            varDir: options.varDir || path.join(options.moduleDir || 'modules', 'var'),
            env: options.env || 'production',
            minify: options.minify || false,
            ...options
        };

        // Lazy load dependencies to avoid circular deps if any, though not needed here strictly
        const VariableManager = require('./VariableManager');
        const ModuleProcessor = require('./ModuleProcessor');
        this.variableManager = new VariableManager(this.options.varDir);
        this.moduleProcessor = new ModuleProcessor(this.options.moduleDir, this.variableManager);
    }

    async build() {
        console.log(`Build started (${this.options.env})...`);

        // Load variables
        await this.variableManager.loadVariables();

        // Inject system variables
        const now = new Date();
        this.variableManager.setSystemVariables({
            build: {
                year: now.getFullYear(),
                timestamp: now.toISOString(),
                env: this.options.env
            }
        });

        console.log('Variables loaded');

        // Clean output directory
        await fs.emptyDir(this.options.outputDir);

        if (!await fs.pathExists(this.options.sourceDir)) {
            console.error(`Source directory not found: ${this.options.sourceDir}`);
            return;
        }

        // Process files
        await this._processDirectory(this.options.sourceDir, this.options.outputDir);

        console.log('Build completed!');
    }

    async _processDirectory(currentSourceDir, currentOutputDir) {
        await fs.ensureDir(currentOutputDir);
        const items = await fs.readdir(currentSourceDir);

        for (const item of items) {
            const srcPath = path.join(currentSourceDir, item);
            const destPath = path.join(currentOutputDir, item);
            const stat = await fs.stat(srcPath);

            if (stat.isDirectory()) {
                await this._processDirectory(srcPath, destPath);
            } else {
                if (path.extname(item) === '.html') {
                    await this._processHtml(srcPath, destPath);
                } else {
                    await fs.copy(srcPath, destPath);
                }
            }
        }
    }

    async _processHtml(srcPath, destPath) {
        let content = await fs.readFile(srcPath, 'utf8');

        // Process content (Modules + Variables)
        try {
            content = await this.moduleProcessor.process(content);

            // Minification (simple)
            if (this.options.minify) {
                content = content
                    // Remove comments
                    .replace(/<!--[\s\S]*?-->/g, '')
                    // Collapse whitespace (conservative)
                    .replace(/\s+/g, ' ')
                    // Remove whitespace between tags
                    .replace(/>\s+</g, '><')
                    .trim();
            }
        } catch (e) {
            console.error(`Error processing ${srcPath}:`, e);
        }

        await fs.writeFile(destPath, content);
    }
}

module.exports = Builder;
