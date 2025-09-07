import { execSync } from 'child_process';
import { fileURLToPath } from 'url';
import path from 'path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

try {
  execSync('make swetest', { cwd: __dirname, stdio: 'inherit' });
} catch (err) {
  console.warn('swetest build failed:', err.message);
}
