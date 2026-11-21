import { readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const projectRoot = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const sourceRoot = path.join(projectRoot, 'src');
const moduleNames = ['admin', 'kitchen'];

function sourceFiles(directory) {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const entryPath = path.join(directory, entry.name);
    if (entry.isDirectory()) return sourceFiles(entryPath);
    return /\.(?:ts|tsx)$/.test(entry.name) ? [entryPath] : [];
  });
}

function resolveInternalImport(importer, specifier) {
  if (specifier.startsWith('@core/')) {
    return path.join(sourceRoot, 'core', specifier.slice('@core/'.length));
  }
  if (specifier.startsWith('@features/')) {
    return path.join(sourceRoot, 'features', specifier.slice('@features/'.length));
  }
  if (specifier === '@modules/admin' || specifier.startsWith('@modules/admin/')) {
    return path.join(sourceRoot, 'modules', 'admin', specifier.slice('@modules/admin'.length));
  }
  if (specifier === '@modules/kitchen' || specifier.startsWith('@modules/kitchen/')) {
    return path.join(sourceRoot, 'modules', 'kitchen', specifier.slice('@modules/kitchen'.length));
  }
  if (specifier.startsWith('.')) return path.resolve(path.dirname(importer), specifier);
  return null;
}

function moduleFor(filePath) {
  const relativePath = path.relative(sourceRoot, filePath);
  const segments = relativePath.split(path.sep);
  return segments[0] === 'modules' && moduleNames.includes(segments[1]) ? segments[1] : null;
}

const importPattern = /\b(?:import|export)\s+(?:[^'"]*?\s+from\s*)?['"]([^'"]+)['"]|\bimport\s*\(\s*['"]([^'"]+)['"]\s*\)/g;
const violations = [];

for (const filePath of sourceFiles(sourceRoot)) {
  const contents = readFileSync(filePath, 'utf8');
  const importerModule = moduleFor(filePath);
  for (const match of contents.matchAll(importPattern)) {
    const specifier = match[1] || match[2];
    const resolvedImport = resolveInternalImport(filePath, specifier);
    if (!resolvedImport) continue;

    const relativeTarget = path.relative(sourceRoot, resolvedImport);
    const targetSegments = relativeTarget.split(path.sep);
    const targetModule = targetSegments[0] === 'modules' ? targetSegments[1] : null;
    const isModuleRoot = targetSegments[0] === 'modules'
      && moduleNames.includes(targetSegments[1])
      && targetSegments.length === 2;

    if (importerModule) {
      if (targetSegments[0] === 'core') continue;
      if (targetModule === importerModule) continue;
      violations.push(`${path.relative(projectRoot, filePath)} imports outside its module/core boundary: ${specifier}`);
      continue;
    }

    if (targetModule && moduleNames.includes(targetModule) && !isModuleRoot) {
      violations.push(`${path.relative(projectRoot, filePath)} imports a module internal path: ${specifier}`);
    }
  }
}

if (violations.length > 0) {
  console.error(violations.join('\n'));
  process.exitCode = 1;
} else {
  console.log('Import boundaries passed.');
}
