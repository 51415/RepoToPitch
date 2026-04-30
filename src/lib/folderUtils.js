/**
 * Utilities for scanning local folders via the File System Access API.
 */

export function getOS() {
  const ua = window.navigator.userAgent;
  if (ua.indexOf('Windows') !== -1) return 'windows';
  if (ua.indexOf('Mac') !== -1) return 'macos';
  if (ua.indexOf('Linux') !== -1) return 'linux';
  return 'unix';
}

// Simple glob-to-regex converter for .gitignore patterns
function patternToRegex(pattern) {
  if (!pattern || pattern.startsWith('#') || pattern.trim() === '') return null;
  let p = pattern.trim();
  
  // Remove leading/trailing slashes for easier matching
  p = p.replace(/^\/+|\/+$/g, '');
  
  // Escape regex characters
  p = p.replace(/[.+^${}()|[\]\\]/g, '\\$&');
  
  // Handle trailing slash (make it optional in the match)
  if (p.endsWith('\\/')) {
    p = p.slice(0, -2);
  }

  // Handle wildcards
  p = p.replace(/\*/g, '.*');
  p = p.replace(/\?/g, '.');
  
  return new RegExp(`^${p}$|^${p}/|/${p}/|/${p}$`);
}

/**
 * Walks a directory handle and returns a structured JSON tree.
 * Includes ignored items but marks them as such.
 */
export async function scanDirectory(handle, depth = 0, maxDepth = 4, ignoreList = [], os = 'unix', parentPath = '') {
  if (depth > maxDepth) return [];

  const sep = os === 'windows' ? '\\' : '/';
  let currentIgnoreList = [...ignoreList];

  // 1. Collect all entries in a single pass to avoid multiple async iterator calls
  const entries = [];
  try {
    for await (const [name, entry] of handle.entries()) {
      entries.push({ name, entry });
    }
  } catch (e) {
    console.error(`[SCAN] Error listing entries in ${handle.name}:`, e);
    return [];
  }

  // 2. Look for .gitignore in collected entries BEFORE processing
  const gitignoreFile = entries.find(e => e.name === '.gitignore' && e.entry.kind === 'file');
  if (gitignoreFile) {
    try {
      const file = await gitignoreFile.entry.getFile();
      const content = await file.text();
      const patterns = content.split('\n')
        .map(p => p.trim())
        .filter(p => p && !p.startsWith('#'));
      currentIgnoreList = [...currentIgnoreList, ...patterns];
    } catch (e) {
      console.error('[SCAN] Error reading .gitignore:', e);
    }
  }

  const ignoreRegexes = currentIgnoreList.map(p => {
    try { return patternToRegex(p); } catch(e) { return null; }
  }).filter(Boolean);
  
  const hardIgnores = [/^\.git$/, /^node_modules$/];

  // 3. Build tree nodes using the populated ignore list
  const results = [];
  for (const { name, entry } of entries) {
    const path = parentPath ? `${parentPath}${sep}${name}` : name;
    const isIgnored = hardIgnores.some(re => re.test(name)) || ignoreRegexes.some(re => re.test(name));
    
    const node = {
      name,
      kind: entry.kind,
      path,
      depth,
      ignored: isIgnored,
      children: []
    };

    if (entry.kind === 'directory' && depth < maxDepth) {
      // Don't recurse into hard-ignored folders to keep it efficient
      if (!hardIgnores.some(re => re.test(name))) {
        node.children = await scanDirectory(entry, depth + 1, maxDepth, currentIgnoreList, os, path);
      }
    }
    
    results.push(node);
  }

  // Sort: directories first, then alphabetical
  results.sort((a, b) => {
    if (a.kind === b.kind) return a.name.localeCompare(b.name);
    return a.kind === 'directory' ? -1 : 1;
  });

  return results;
}

/**
 * Converts the structured treeData back to a flat string for LLM consumption.
 * Respects the 'ignored' flag.
 */
export function buildTreeText(treeData, os = 'unix') {
  if (!treeData || !Array.isArray(treeData)) return '';
  
  const sep = os === 'windows' ? '\\' : '/';
  let output = '';

  function traverse(nodes, depth = 0) {
    if (!nodes || !Array.isArray(nodes)) return;
    for (const node of nodes) {
      if (node.ignored) continue;
      
      const indent = '  '.repeat(depth);
      output += `${indent}${node.name}${node.kind === 'directory' ? sep : ''}\n`;
      
      if (node.children && node.children.length > 0) {
        traverse(node.children, depth + 1);
      }
    }
  }

  traverse(treeData);
  return output;
}

/**
 * Guesses the repository role (frontend vs api) based on file contents and structure.
 */
export async function guessRole(handle) {
  let hasFrontendDeps = false;
  let hasBackendDeps = false;
  let hasGo = false;
  let hasPython = false;
  let hasRust = false;
  let hasDocker = false;

  try {
    for await (const [name, entry] of handle.entries()) {
      if (name === 'package.json' && entry.kind === 'file') {
        try {
          const file = await entry.getFile();
          const text = await file.text();
          const pkg = JSON.parse(text);
          const allDeps = { ...(pkg.dependencies || {}), ...(pkg.devDependencies || {}) };
          
          const feDeps = ['react', 'vue', 'svelte', 'next', 'vite', 'expo', 'react-native', 'tailwindcss', 'bootstrap', 'angular', 'lucide-react'];
          const beDeps = ['express', 'fastify', 'nest', 'koa', 'prisma', 'sequelize', 'mongoose', 'typeorm', 'hapi', 'dotenv', 'fastapi', 'flask', 'django'];
          
          if (feDeps.some(d => allDeps[d])) hasFrontendDeps = true;
          if (beDeps.some(d => allDeps[d])) hasBackendDeps = true;
        } catch(e) { /* ignore parse errors */ }
      }
      
      const lowerName = name.toLowerCase();
      if (lowerName === 'go.mod' || lowerName.endsWith('.go')) hasGo = true;
      if (lowerName === 'requirements.txt' || lowerName === 'pyproject.toml' || lowerName === 'pipfile' || lowerName.endsWith('.py')) hasPython = true;
      if (lowerName === 'cargo.toml' || lowerName.endsWith('.rs')) hasRust = true;
      if (lowerName === 'dockerfile' || lowerName === 'docker-compose.yml') hasDocker = true;
      
      // Check for common directories
      if (entry.kind === 'directory') {
        const dName = lowerName;
        if (['routes', 'controllers', 'models', 'migrations', 'api', 'backend', 'server', 'handlers', 'services', 'dal', 'repository'].includes(dName)) {
          hasBackendDeps = true;
        }
      }
    }
  } catch (e) {
    console.error('[SCAN] Error guessing role:', e);
  }

  if (hasGo || hasPython || hasRust || hasBackendDeps) return 'api';
  if (hasFrontendDeps) return 'frontend';
  return hasDocker ? 'api' : 'api';
}
