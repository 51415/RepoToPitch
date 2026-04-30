/**
 * Global utility for File System Access with fallbacks for Brave, Firefox, and Safari.
 */

export async function pickDirectory() {
  // 0. Try Tauri Native Dialog if available
  try {
    const { isTauri, pickDirectoryTauri } = await import('./tauriUtils');
    if (isTauri()) {
      const handle = await pickDirectoryTauri();
      if (handle) return handle;
    }
  } catch (e) {
    console.warn('[TAURI] Failed to load Tauri utils, falling back to browser API.', e);
  }

  // 1. Try modern File System Access API
  if (window.showDirectoryPicker) {
    try {
      return await window.showDirectoryPicker();
    } catch (e) {
      if (e.name === 'AbortError') throw e;
      
      // If it fails (likely blocked by Brave Shields or security context)
      const isBrave = (navigator.brave && await navigator.brave.isBrave()) || false;
      if (isBrave) {
        throw new Error('BRAVE_SHIELDS_BLOCK: To pick a folder, please turn OFF Brave Shields for this site. We promise NO SOURCE CODE OR DATA LEAVES YOUR SYSTEM; this permission only allows the app to index your local files for synthesis.');
      }
      throw e;
    }
  }

  // 2. Fallback to webkitdirectory input (Legacy but reliable)
  return new Promise((resolve, reject) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.webkitdirectory = true;
    
    input.onchange = () => {
      if (input.files && input.files.length > 0) {
        resolve({
          kind: 'directory',
          name: input.files[0].webkitRelativePath.split('/')[0] || 'Selected Folder',
          isLegacy: true,
          files: Array.from(input.files)
        });
      } else {
        reject(new Error('No files selected'));
      }
    };
    
    input.oncancel = () => reject(new Error('AbortError'));
    input.onerror = (e) => reject(e);
    
    input.click();
  });
}

/**
 * Enhanced scan that handles both modern handles and legacy file snapshots.
 */
export async function smartScan(handle, depth = 0, maxDepth = 4, ignoreList = [], os = 'unix', parentPath = '') {
  if (handle.isTauri) {
    const { scanDirectoryTauri } = await import('./tauriUtils');
    return await scanDirectoryTauri(handle.path, depth, maxDepth, ignoreList, os, parentPath);
  }

  if (handle.isLegacy) {
    const { processLegacyFiles } = await import('./storageUtils');
    return await processLegacyFiles(handle.files, maxDepth, os);
  }
  
  const { scanDirectory } = await import('./folderUtils');
  return scanDirectory(handle, depth, maxDepth, ignoreList, os, parentPath);
}

/**
 * Guesses role (frontend/api) across both modes.
 */
export async function smartGuessRole(handle) {
  if (handle.isTauri) {
    const { guessRoleTauri } = await import('./tauriUtils');
    const { getOS } = await import('./folderUtils');
    return await guessRoleTauri(handle.path, getOS());
  }

  if (handle.isLegacy) {
    // Basic analysis of file names in the list
    const names = handle.files.map(f => f.webkitRelativePath.toLowerCase());
    
    const beIndicators = ['go.mod', 'requirements.txt', 'dockerfile', 'server.js', 'app.py', 'main.go', 'manage.py', 'composer.json', 'gemfile', 'routes/', 'controllers/', 'models/'];
    const feIndicators = ['package.json', 'index.html', 'src/components', 'src/pages', 'src/app', 'vite.config', 'next.config', 'tailwind.config', 'public/', 'static/'];
    
    const hasBE = beIndicators.some(ind => names.some(n => n.includes(ind)));
    const hasFE = feIndicators.some(ind => names.some(n => n.includes(ind)));
    
    if (hasBE && !hasFE) return 'api';
    if (hasFE) return 'frontend';
    return 'api';
  }

  const { guessRole } = await import('./folderUtils');
  return guessRole(handle);
}

export async function processLegacyFiles(files, maxDepth, os) {
  const sep = os === 'windows' ? '\\' : '/';
  const root = [];
  const { patternToRegex } = await import('./folderUtils');
  
  // 1. Load all .gitignore files from the flat list
  const ignorePatterns = [];
  const hardIgnores = [/^\.git$/, /^node_modules$/];
  
  for (const file of files) {
    if (file.name === '.gitignore') {
      try {
        const content = await file.text();
        const patterns = content.split('\n')
          .map(p => p.trim())
          .filter(p => p && !p.startsWith('#'));
        ignorePatterns.push(...patterns);
      } catch (e) {}
    }
  }

  const ignoreRegexes = ignorePatterns.map(p => {
    try { return patternToRegex(p); } catch(e) { return null; }
  }).filter(Boolean);
  
  files.forEach(file => {
    const parts = file.webkitRelativePath.split('/');
    parts.shift(); // Remove root folder
    
    if (parts.length > maxDepth) return;
    
    let currentLevel = root;
    parts.forEach((part, i) => {
      const isFile = i === parts.length - 1;
      let existing = currentLevel.find(n => n.name === part);
      
      if (!existing) {
        const isIgnored = hardIgnores.some(re => re.test(part)) || ignoreRegexes.some(re => re.test(part));
        existing = {
          name: part,
          kind: isFile ? 'file' : 'directory',
          path: parts.slice(0, i + 1).join(sep),
          depth: i,
          ignored: isIgnored,
          children: [],
          _file: isFile ? file : null
        };
        currentLevel.push(existing);
      }
      currentLevel = existing.children;
    });
  });

  const sortNodes = (nodes) => {
    nodes.sort((a, b) => {
      if (a.kind === b.kind) return a.name.localeCompare(b.name);
      return a.kind === 'directory' ? -1 : 1;
    });
    nodes.forEach(n => { if (n.children.length > 0) sortNodes(n.children); });
  };
  
  sortNodes(root);
  return root;
}
