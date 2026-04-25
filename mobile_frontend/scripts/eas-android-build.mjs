/**
 * Bypasses broken Windows PowerShell npm.ps1 shims ("Could not determine Node.js install directory").
 * Uses the same node.exe as this script + npm-cli.js next to it (or nvm-style lib path).
 */
import { spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const node = process.execPath;
const profile = process.argv[2] || 'preview';

function findNpmCli() {
  const binDir = path.dirname(node);
  const candidates = [
    path.join(binDir, 'node_modules', 'npm', 'bin', 'npm-cli.js'),
    path.join(binDir, '..', 'lib', 'node_modules', 'npm', 'bin', 'npm-cli.js'),
  ];
  for (const c of candidates) {
    if (existsSync(c)) return c;
  }
  return null;
}

function runNode(script, args, cwd = root) {
  return spawnSync(node, [script, ...args], { cwd, stdio: 'inherit', shell: false });
}

const npmCli = findNpmCli();
if (!npmCli) {
  console.error('Could not find npm-cli.js next to Node. Reinstall Node.js from https://nodejs.org');
  process.exit(1);
}

const easRun = path.join(root, 'node_modules', 'eas-cli', 'bin', 'run');
if (!existsSync(path.join(root, 'node_modules', 'eas-cli'))) {
  console.log('Installing dependencies (npm-cli.js via node, no npm shim)...');
  const inst = runNode(npmCli, ['install'], root);
  if (inst.status !== 0) process.exit(inst.status ?? 1);
}

if (!existsSync(easRun)) {
  console.error('eas-cli is missing after npm install.');
  process.exit(1);
}

console.log(`Starting EAS Android build (profile: ${profile})...`);
const build = runNode(easRun, ['build', '--platform', 'android', '--profile', profile], root);
process.exit(build.status ?? 1);
