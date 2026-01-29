'use strict';

const fs = require('fs-extra');
const path = require('path');
const http = require('http');
const chokidar = require('chokidar');
const Builder = require('./Builder');

class DevServer {
    constructor(options = {}) {
        this.options = {
            port: 3000,
            ...options
        };
        this.builder = new Builder(this.options);
    }

    async start() {
        // 1. Initial Build
        await this.builder.build();

        // 2. Start HTTP Server
        this._startServer();

        // 3. Start Watcher
        this._startWatcher();
    }

    _startServer() {
        const server = http.createServer(async (req, res) => {
            // Basic static file serving
            // Remove leading slash to join correctly
            const safeUrl = req.url === '/' ? 'index.html' : req.url.substring(1);
            let filePath = path.resolve(this.options.outputDir, safeUrl);

            // Prevent directory traversal
            const absOutputDir = path.resolve(this.options.outputDir);
            if (!filePath.startsWith(absOutputDir)) {
                res.writeHead(403);
                res.end('Forbidden');
                return;
            }

            try {
                const stats = await fs.stat(filePath);
                if (stats.isDirectory()) {
                    filePath = path.join(filePath, 'index.html');
                }

                const data = await fs.readFile(filePath);
                const ext = path.extname(filePath);
                const contentType = this._getContentType(ext);

                res.writeHead(200, { 'Content-Type': contentType });
                res.end(data);
            } catch (err) {
                if (err.code === 'ENOENT') {
                    res.writeHead(404);
                    res.end('Not Found');
                } else {
                    res.writeHead(500);
                    res.end('Server Error: ' + err.code);
                }
            }
        });

        server.listen(this.options.port, () => {
            console.log(`Development server running at http://localhost:${this.options.port}/`);
        });
    }

    _getContentType(ext) {
        const types = {
            '.html': 'text/html',
            '.css': 'text/css',
            '.js': 'text/javascript',
            '.json': 'application/json',
            '.png': 'image/png',
            '.jpg': 'image/jpeg',
            '.gif': 'image/gif',
            '.svg': 'image/svg+xml'
        };
        return types[ext] || 'application/octet-stream';
    }

    _startWatcher() {
        const watchPaths = [
            this.options.sourceDir,
            this.options.moduleDir
        ];

        console.log(`Watching for changes in: ${watchPaths.join(', ')}`);

        const watcher = chokidar.watch(watchPaths, {
            ignored: /(^|[\/\\])\../, // ignore dotfiles
            persistent: true,
            ignoreInitial: true
        });

        watcher.on('all', async (event, filePath) => {
            console.log(`File change detected: ${event} ${filePath}`);
            try {
                await this.builder.build();
                console.log('Rebuild completed');
            } catch (err) {
                console.error('Rebuild failed:', err);
            }
        });
    }
}

module.exports = DevServer;
