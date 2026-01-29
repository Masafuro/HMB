'use strict';

const path = require('path');
const fs = require('fs-extra');

class ConfigLoader {
    static load(cwd = process.cwd()) {
        const configPath = path.join(cwd, 'hmb.config.js');
        if (fs.existsSync(configPath)) {
            try {
                const config = require(configPath);
                console.log(`Loaded configuration from ${configPath}`);
                return config;
            } catch (e) {
                console.error(`Error loading hmb.config.js: ${e.message}`);
                return {};
            }
        }
        return {};
    }
}

module.exports = ConfigLoader;
