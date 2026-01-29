'use strict';

const fs = require('fs-extra');
const path = require('path');

class Initializer {
    constructor(targetDir) {
        this.targetDir = targetDir;
    }

    async run() {
        console.log(`Initializing HMB project in ${this.targetDir}...`);

        await fs.ensureDir(this.targetDir);

        const directories = [
            'pages',
            'modules',
            'modules/var',
            'modules/components'
        ];

        for (const dir of directories) {
            await fs.ensureDir(path.join(this.targetDir, dir));
            console.log(`Created directory: ${dir}`);
        }

        await this.createSampleFiles();

        console.log('Initialization completed!');
        console.log('Run "hmb dev" to start development server.');
    }

    async createSampleFiles() {
        // pages/index.html
        await this._writeFile('pages/index.html', `<!DOCTYPE html>
<html lang="{{@site.language}}">
<head>
    <meta charset="UTF-8">
    <title>{{@site.name}}</title>
</head>
<body>
    <module src="header" />
    <main>
        <h1>Welcome to {{@site.name}}</h1>
        <module src="components/card" title="Hello" description="This is a sample card component." />
    </main>
    <module src="footer" />
</body>
</html>`);

        // modules/header.html
        await this._writeFile('modules/header.html', `<header>
    <h1>{{@site.name}}</h1>
</header>`);

        // modules/footer.html
        await this._writeFile('modules/footer.html', `<footer>
    <p>&copy; {{@build.year}} {{@site.name}}</p>
</footer>`);

        // modules/components/card.html
        await this._writeFile('modules/components/card.html', `<div class="card">
    <h2>{{title}}</h2>
    <p>{{description}}</p>
</div>`);

        // modules/var/site.yaml
        await this._writeFile('modules/var/site.yaml', `name: "My Awesome Site"
language: "en"
author: "Your Name"`);
    }

    async _writeFile(relPath, content) {
        const fullPath = path.join(this.targetDir, relPath);
        if (!await fs.pathExists(fullPath)) {
            await fs.writeFile(fullPath, content);
            console.log(`Created file: ${relPath}`);
        } else {
            console.log(`Skipped existing file: ${relPath}`);
        }
    }
}

module.exports = Initializer;
