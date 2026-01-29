'use strict';

const fs = require('fs-extra');
const path = require('path');
const yaml = require('js-yaml');
const glob = require('glob');

class VariableManager {
    constructor(varDir) {
        this.varDir = varDir;
        this.variables = {};
    }

    async loadVariables() {
        if (!await fs.pathExists(this.varDir)) {
            return {};
        }

        const files = await fs.readdir(this.varDir);

        for (const file of files) {
            if (path.extname(file) === '.yaml' || path.extname(file) === '.yml') {
                const namespace = path.basename(file, path.extname(file));
                const content = await fs.readFile(path.join(this.varDir, file), 'utf8');
                try {
                    this.variables[namespace] = yaml.load(content);
                } catch (e) {
                    console.error(`Error loading YAML file ${file}:`, e.message);
                }
            }
        }

        return this.variables;
    }

    get(pathString) {
        // pathString example: "site.name", "site.author.email"
        const parts = pathString.split('.');
        let current = this.variables;

        for (const part of parts) {
            if (current === undefined || current === null) return undefined;
            current = current[part];
        }

        return current;
    }
    setSystemVariables(sysVars) {
        // Shallow merge using spread or Object.assign to protect user variables?
        // Or specific merge logic?
        // Using spread: this.variables = { ...sysVars, ...this.variables }; 
        // If we want system variables to be defaults (overridden by user), put sysVars first.
        // But @build is reserved, so maybe we want system to override user?
        // Let's make system variables override user variables for security/consistency.
        this.variables = { ...this.variables, ...sysVars };
    }
}

module.exports = VariableManager;
