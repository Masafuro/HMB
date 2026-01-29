'use strict';

const fs = require('fs-extra');
const path = require('path');

class ModuleProcessor {
    constructor(moduleDir, variableManager) {
        this.moduleDir = moduleDir;
        this.variableManager = variableManager;
    }

    /**
     * Process HTML content: resolve <module> tags and replace variables
     * @param {string} content - HTML content
     * @returns {Promise<string>} - Processed HTML content
     */
    async process(content) {
        // 1. Process Modules (Recursive)
        content = await this._resolveModules(content);

        // 2. Global variable replacement
        // Note: Variables might be needed for conditionals
        content = this._replaceGlobalVariables(content);

        // 3. Conditional Rendering
        content = this._resolveConditionals(content);

        return content;
    }

    async _resolveModules(content) {
        // Regex to find <module ... />
        // Matches: <module src="path" attr="val" ... />
        // Note: This regex is simple and assumes src is double-quoted.
        const moduleRegex = /<module\s+src="([^"]+)"\s*(.*?)\s*\/>/g;

        // We use a loop to handle async replacements propery
        let match;
        let newContent = content;

        // Find all matches first to avoid infinite loop issues if replacement contains tag (though it shouldn't if resolved)
        // Actually, we must resolve recursively, so we replace one by one or bottom up?
        // Top-down replacement: Find first match, resolve it (which might contain more modules), then replace.
        // If the resolved content contains <module>, we need to resolve that too.

        // Simply replacing all at this level, then recursively calling _resolveModules on the result until no changes.
        // But verify max depth to avoid infinite loop.

        let hasMatch = true;
        let loopCount = 0;
        const MAX_LOOPS = 100;

        while (hasMatch && loopCount < MAX_LOOPS) {
            hasMatch = false;
            loopCount++;

            // We need to use replace with async... String.prototype.replace doesn't support async callback perfectly.
            // So we'll use a custom approach: match all, process all, replace all.

            const matches = [];
            let m;
            // Reset regex index
            moduleRegex.lastIndex = 0; // Global regex state
            while ((m = moduleRegex.exec(newContent)) !== null) {
                matches.push({
                    fullMatch: m[0],
                    src: m[1],
                    attrsString: m[2],
                    index: m.index
                });
            }

            if (matches.length > 0) {
                hasMatch = true;
                // Process matches in reverse order to keep indices valid (if we were splicing string)
                // Or simpler: splitting string by matches?
                // Let's process each match and get replacement

                // We will build the new string from scratch
                let resultString = '';
                let lastIndex = 0;

                for (const matchObj of matches) {
                    resultString += newContent.substring(lastIndex, matchObj.index);
                    const replacement = await this._loadModule(matchObj.src, matchObj.attrsString);
                    resultString += replacement;
                    lastIndex = matchObj.index + matchObj.fullMatch.length;
                }
                resultString += newContent.substring(lastIndex);
                newContent = resultString;
            }
        }

        if (loopCount >= MAX_LOOPS) {
            console.warn('Max module recursion depth reached. Possible infinite loop.');
        }

        return newContent;
    }

    async _loadModule(src, attrsString) {
        let modulePath = path.join(this.moduleDir, src);
        if (path.extname(modulePath) === '') {
            modulePath += '.html';
        }

        if (!await fs.pathExists(modulePath)) {
            console.error(`Module not found: ${src} (at ${modulePath})`);
            return `<!-- Module not found: ${src} -->`;
        }

        let content = await fs.readFile(modulePath, 'utf8');

        // Parse attributes
        const args = this._parseAttributes(attrsString);

        // Replace arguments: {{arg}}
        // Also support global variables inside module? Yes, eventually. 
        // But arguments take precedence? Or separate syntax?
        // README: "モジュール内の {{引数名}} を渡された引数で置換"

        for (const [key, val] of Object.entries(args)) {
            const argRegex = new RegExp(`\\{\\{\\s*${key}\\s*\\}\\}`, 'g');
            content = content.replace(argRegex, val);
        }

        // Clean up undefined arguments? 
        // "Undefined variable" handling is usually to leave it or empty it. 
        // For now, leave it.

        return content;
    }

    _parseAttributes(attrsString) {
        const args = {};
        if (!attrsString) return args;

        // Simple regex for key="value"
        // Does not handle escaped quotes or values without quotes well
        const attrRegex = /([a-zA-Z0-9_-]+)="([^"]*)"/g;
        let match;
        while ((match = attrRegex.exec(attrsString)) !== null) {
            args[match[1]] = match[2];
        }
        return args;
    }

    _replaceGlobalVariables(content) {
        return content.replace(/\{\{@([a-zA-Z0-9_.]+)\}\}/g, (match, pathString) => {
            const val = this.variableManager.get(pathString);
            if (val === undefined) {
                console.warn(`Warning: Variable not found: ${pathString}`);
                return match;
            }
            return val;
        });
    }

    _resolveConditionals(content) {
        // Simple regex for <!-- @if condition --> content <!-- @endif -->
        // Supports nested blocks? No, regex based is hard for nested. 
        // Let's support non-nested first with greedy match for simple cases or non-greedy for multiple blocks?
        // Non-greedy ([\s\S]*?) is safer for multiple independent blocks.

        const ifRegex = /<!--\s*@if\s+([^\s]+)\s*-->([\s\S]*?)<!--\s*@endif\s*-->/g;

        return content.replace(ifRegex, (match, condition, blockContent) => {
            let isTrue = false;

            // Check if condition refers to a global variable
            if (condition.startsWith('@')) {
                const val = this.variableManager.get(condition.substring(1)); // remove @
                // Check truthiness
                isTrue = !!val;
            } else {
                // Literal check (e.g. true) or not supported yet
                if (condition === 'true') isTrue = true;
            }

            return isTrue ? blockContent : '';
        });
    }
}

module.exports = ModuleProcessor;
