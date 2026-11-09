import { join } from 'node:path';
import { writeCredits } from './credits';
import { loadManifest } from './manifest';

const root = process.cwd();
const manifest = loadManifest(join(root, 'public/assets/manifest.json'));
if (process.argv.includes('--dry-run')) {
  console.log('[dry-run] CREDITS.md not written');
} else {
  writeCredits(join(root, 'CREDITS.md'), manifest);
  console.log('CREDITS.md written');
}
