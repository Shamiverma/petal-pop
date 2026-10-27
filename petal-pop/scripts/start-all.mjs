// Starts product-service, customer-service and the UI in ONE terminal.
// Consul must already be running (consul agent -dev).
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));
const files = ['bouquet-service/index.js', 'appointment-service/index.js', 'ui/server.js'];
const children = files.map(file => spawn(process.execPath, [file], { cwd: root, stdio: 'inherit' }));

// Ctrl+C reaches every child through the terminal, so each service deregisters
// itself. We simply wait for them to finish (and force-stop after 6 seconds).
process.on('SIGINT', () => setTimeout(() => children.forEach(c => c.kill()), 6000).unref());
process.on('SIGTERM', () => children.forEach(c => c.kill('SIGTERM')));

let running = children.length;
children.forEach(c => c.on('exit', () => { if (--running === 0) process.exit(0); }));
