import { readdir, readFile } from 'node:fs/promises';
import { extname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const sourceRoot = fileURLToPath(new URL('../src/', import.meta.url));
const extensions = new Set(['.ts', '.tsx', '.json']);
const banned = [/\u4e0d\u662f.{0,40}\u800c\u662f/, /SECTION\s+\d+/i, /QUESTION\s+\d+/i, /Lorem ipsum/i];

async function sourceFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const nested = await Promise.all(entries.map(async (entry) => {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) return sourceFiles(path);
    return extensions.has(extname(entry.name)) ? [path] : [];
  }));
  return nested.flat();
}

const violations = [];
for (const file of await sourceFiles(sourceRoot)) {
  const contents = await readFile(file, 'utf8');
  for (const pattern of banned) {
    const match = contents.match(pattern);
    if (!match || match.index === undefined) continue;
    const line = contents.slice(0, match.index).split(/\r?\n/).length;
    violations.push(`${relative(sourceRoot, file)}:${line} ${pattern}`);
  }
}

if (violations.length > 0) {
  console.error(`Copy check failed:\n${violations.join('\n')}`);
  process.exitCode = 1;
} else {
  console.log('Copy check passed.');
}
