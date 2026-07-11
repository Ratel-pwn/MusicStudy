import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { setTimeout as delay } from 'node:timers/promises';

const root = new URL('../', import.meta.url);
const viteBin = new URL('../node_modules/vite/bin/vite.js', import.meta.url);
const playwrightCli = new URL('../node_modules/@playwright/test/cli.js', import.meta.url);
const serverUrl = 'http://127.0.0.1:4173';
const cwd = fileURLToPath(root);

function waitForExit(child) {
  return new Promise((resolve) => {
    if (child.exitCode !== null || child.signalCode !== null) {
      resolve({ code: child.exitCode, signal: child.signalCode });
      return;
    }
    child.once('exit', (code, signal) => resolve({ code, signal }));
  });
}

async function waitForServer(child, timeoutMs = 15_000) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    if (child.exitCode !== null || child.signalCode !== null) {
      throw new Error(`Vite exited before becoming ready (code=${child.exitCode}, signal=${child.signalCode})`);
    }
    try {
      const response = await fetch(serverUrl);
      if (response.ok) return;
    } catch {
      // Vite is still starting.
    }
    await delay(100);
  }
  throw new Error(`Vite did not become ready at ${serverUrl} within ${timeoutMs}ms`);
}

async function stopServer(child) {
  if (child.exitCode !== null || child.signalCode !== null) return;
  child.kill();
  const stopped = await Promise.race([
    waitForExit(child).then(() => true),
    delay(5_000).then(() => false),
  ]);
  if (stopped) return;
  child.kill('SIGKILL');
  const forced = await Promise.race([
    waitForExit(child).then(() => true),
    delay(3_000).then(() => false),
  ]);
  if (!forced) throw new Error('Vite did not exit after SIGKILL');
}

const vite = spawn(process.execPath, [fileURLToPath(viteBin), '--host', '127.0.0.1', '--port', '4173'], {
  cwd,
  stdio: 'inherit',
});

let result = { code: 1, signal: null };
let failure;
try {
  await waitForServer(vite);
  const playwright = spawn(process.execPath, [fileURLToPath(playwrightCli), 'test', ...process.argv.slice(2)], {
    cwd,
    stdio: 'inherit',
  });
  result = await waitForExit(playwright);
} catch (error) {
  failure = error;
} finally {
  try {
    await stopServer(vite);
  } catch (error) {
    failure ??= error;
  }
}

if (failure) {
  console.error(failure);
  process.exitCode = 1;
} else if (result.signal) {
  console.error(`Playwright terminated by signal ${result.signal}`);
  process.exitCode = 1;
} else {
  process.exitCode = result.code ?? 1;
}
