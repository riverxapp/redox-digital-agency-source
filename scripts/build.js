import { cp, mkdir, rm } from 'node:fs/promises';

// Keep the template's ordered classic scripts and relative runtime asset URLs.
await rm(new URL('../dist/', import.meta.url), { recursive: true, force: true });
await mkdir(new URL('../dist/', import.meta.url), { recursive: true });
for (const entry of ['index.html', 'assets']) {
  await cp(new URL(`../${entry}`, import.meta.url), new URL(`../dist/${entry}`, import.meta.url), {
    recursive: true,
  });
}
await import('./verify-assets.js');
