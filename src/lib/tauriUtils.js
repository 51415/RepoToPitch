import { open } from '@tauri-apps/plugin-dialog';
import { readDir, readTextFile, stat } from '@tauri-apps/plugin-fs';

/**
 * Checks if the app is running within a Tauri environment.
 */
export function isTauri() {
  return !!window.__TAURI_INTERNALS__;
}

/**
 * Uses the native Tauri dialog to pick a directory.
 */
export async function pickDirectoryTauri() {
  const selected = await open({
    directory: true,
    multiple: false,
    title: 'Select Repository Folder'
  });

  if (!selected) return null;

  // selected is a string path
  return {
    kind: 'directory',
    name: selected.split(/[\\/]/).pop() || 'Selected Folder',
    path: selected,
    isTauri: true
  };
}

/**
 * Tauri-specific directory scanner using plugin-fs.
 */
export async function scanDirectoryTauri(path, depth = 0, maxDepth = 4, ignoreList = [], os = 'unix', parentPath = '') {
  if (depth > maxDepth) return [];

  const sep = os === 'windows' ? '\\' : '/';
  let currentIgnoreList = [...ignoreList];

  // 1. List entries
  let entries = [];
  try {
    entries = await readDir(path);
  } catch (e) {
    console.error(`[TAURI-SCAN] Error listing entries in ${path}:`, e);
    return [];
  }

  // 2. Look for .gitignore
  const gitignoreEntry = entries.find(e => e.name === '.gitignore' && e.isFile);
  if (gitignoreEntry) {
    try {
      const content = await readTextFile(`${path}${sep}.gitignore`);
      const patterns = content.split('\n')
        .map(p => p.trim())
        .filter(p => p && !p.startsWith('#'));
      currentIgnoreList = [...currentIgnoreList, ...patterns];
    } catch (e) {
      console.error('[TAURI-SCAN] Error reading .gitignore:', e);
    }
  }

  // Helper for regex matching (imported logic from folderUtils if possible, or duplicated here for simplicity)
  const patternToRegex = (pattern) => {
    if (!pattern || pattern.startsWith('#') || pattern.trim() === '') return null;
    let p = pattern.trim().replace(/^\/+|\/+$/g, '').replace(/[.+^${}()|[\]\\]/g, '\\$&');
    p = p.replace(/\*/g, '.*').replace(/\?/g, '.');
    return new RegExp(`^${p}$|^${p}/|/${p}/|/${p}$`);
  };

  const ignoreRegexes = currentIgnoreList.map(p => {
    try { return patternToRegex(p); } catch(e) { return null; }
  }).filter(Boolean);
  
  const hardIgnores = [/^\.git$/, /^node_modules$/];

  const results = [];
  for (const entry of entries) {
    const entryPath = `${path}${sep}${entry.name}`;
    const nodePath = parentPath ? `${parentPath}${sep}${entry.name}` : entry.name;
    const isIgnored = hardIgnores.some(re => re.test(entry.name)) || ignoreRegexes.some(re => re.test(entry.name));
    
    const node = {
      name: entry.name,
      kind: entry.isDirectory ? 'directory' : 'file',
      path: nodePath,
      fullPath: entryPath, // Store full system path for reading
      depth,
      ignored: isIgnored,
      children: []
    };

    if (entry.isDirectory && depth < maxDepth) {
      if (!hardIgnores.some(re => re.test(entry.name))) {
        node.children = await scanDirectoryTauri(entryPath, depth + 1, maxDepth, currentIgnoreList, os, nodePath);
      }
    }
    
    results.push(node);
  }

  results.sort((a, b) => {
    if (a.kind === b.kind) return a.name.localeCompare(b.name);
    return a.kind === 'directory' ? -1 : 1;
  });

  return results;
}

/**
 * Tauri-specific role guesser.
 */
export async function guessRoleTauri(path, os = 'unix') {
  const sep = os === 'windows' ? '\\' : '/';
  let hasFrontendDeps = false;
  let hasBackendDeps = false;
  let hasGo = false;
  let hasPython = false;
  let hasRust = false;
  let hasDocker = false;

  try {
    const entries = await readDir(path);
    for (const entry of entries) {
      if (entry.name === 'package.json' && entry.isFile) {
        try {
          const text = await readTextFile(`${path}${sep}package.json`);
          const pkg = JSON.parse(text);
          const allDeps = { ...(pkg.dependencies || {}), ...(pkg.devDependencies || {}) };
          
          const feDeps = ['react', 'vue', 'svelte', 'next', 'vite', 'expo', 'react-native', 'tailwindcss', 'bootstrap', 'angular', 'lucide-react'];
          const beDeps = ['express', 'fastify', 'nest', 'koa', 'prisma', 'sequelize', 'mongoose', 'typeorm', 'hapi', 'dotenv', 'fastapi', 'flask', 'django'];
          
          if (feDeps.some(d => allDeps[d])) hasFrontendDeps = true;
          if (beDeps.some(d => allDeps[d])) hasBackendDeps = true;
        } catch(e) {}
      }
      
      const lowerName = entry.name.toLowerCase();
      if (lowerName === 'go.mod' || lowerName.endsWith('.go')) hasGo = true;
      if (lowerName === 'requirements.txt' || lowerName === 'pyproject.toml' || lowerName === 'pipfile' || lowerName.endsWith('.py')) hasPython = true;
      if (lowerName === 'cargo.toml' || lowerName.endsWith('.rs')) hasRust = true;
      if (lowerName === 'dockerfile' || lowerName === 'docker-compose.yml') hasDocker = true;
      
      if (entry.isDirectory) {
        if (['routes', 'controllers', 'models', 'migrations', 'api', 'backend', 'server', 'handlers', 'services', 'dal', 'repository'].includes(lowerName)) {
          hasBackendDeps = true;
        }
      }
    }
  } catch (e) {}

  if (hasGo || hasPython || hasRust || hasBackendDeps) return 'api';
  if (hasFrontendDeps) return 'frontend';
  return hasDocker ? 'api' : 'api';
}
