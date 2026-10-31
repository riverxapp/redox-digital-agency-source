import { readFile, readdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../dist/', import.meta.url));
const resources = new Set(['index.html']);
const failures = [];
const base = process.argv[2];

async function inspect(file) {
  const text = await readFile(path.join(root, file), 'utf8');
  const pattern = file.endsWith('.html')
    ? /\b(?:src|href|poster|data-background)\s*=\s*["']([^"']+)["']/g
    : /url\(\s*["']?([^\s"')][^"')]*?)["']?\s*\)/g;
  for (const match of text.matchAll(pattern)) {
    const url = match[1].trim();
    if (/^(?:[a-z][a-z\d+.-]*:|\/\/|#)/i.test(url)) continue;
    const relative = decodeURIComponent(url.split(/[?#]/)[0]);
    const target = relative.startsWith('/')
      ? relative.slice(1)
      : path.posix.join(path.posix.dirname(file), relative);
    resources.add(target);
  }
}

async function walk(directory) {
  for (const entry of await readdir(path.join(root, directory), { withFileTypes: true })) {
    const file = path.posix.join(directory, entry.name);
    if (entry.isDirectory()) await walk(file);
    else if (file.endsWith('.css') || file.endsWith('.html')) await inspect(file);
  }
}

await walk('');
for (const file of resources) {
  try {
    const expected = await readFile(path.join(root, file));
    if (base) {
      const url = new URL(file === 'index.html' ? './' : file, base.endsWith('/') ? base : `${base}/`);
      const response = await fetch(url, { signal: AbortSignal.timeout(10000) });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const actual = Buffer.from(await response.arrayBuffer());
      if (!actual.equals(expected)) throw new Error('Response differs from asset (possible HTML fallback)');
    }
  } catch (error) {
    failures.push(`${file}: ${error.message}`);
  }
}
if (failures.length) {
  console.error(failures.join('\n'));
  process.exitCode = 1;
} else {
  console.log(`Verified ${resources.size} local resources${base ? ` over HTTP at ${base}` : ' in dist'}.`);
}
