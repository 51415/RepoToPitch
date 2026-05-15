/**
 * Plugin Discovery & Loading Logic
 */
import { configDir, join } from '@tauri-apps/api/path';
import { readTextFile, readDir, exists, BaseDirectory } from '@tauri-apps/plugin-fs';

export const pluginManager = {
  async runHook(hookName, context) {
    try {
      const plugins = await getInstalledPlugins();
      let lastResult = null;
      for (const p of plugins) {
        if (p.active !== false && p.entry) {
          try {
            const relativePathNew = `growthvariable/RepoToPitch/plugins/${p.id}/${p.entry}`;
            const relativePathOld = `growthvariable/r2p/plugins/${p.id}/${p.entry}`;
            
            let code = null;
            if (await exists(relativePathNew, { baseDir: BaseDirectory.AppData })) {
              code = await readTextFile(relativePathNew, { baseDir: BaseDirectory.AppData });
            } else if (await exists(relativePathOld, { baseDir: BaseDirectory.AppData })) {
              code = await readTextFile(relativePathOld, { baseDir: BaseDirectory.AppData });
            }
            
            if (code) {
              const customModule = { exports: {} };
              const fn = new Function('module', 'exports', 'console', code);
              fn(customModule, customModule.exports, console);
              const hookFn = customModule.exports?.hooks?.[hookName];
              if (typeof hookFn === 'function') {
                const res = await hookFn(context);
                if (res !== undefined) lastResult = res;
              }
            }
          } catch (pe) {
            console.error(`[PLUGINS] Plugin execution error for ${p.id}:`, pe);
          }
        }
      }
      return lastResult;
    } catch (err) {
      console.error(`[PLUGINS] Hook router execution failed for ${hookName}:`, err);
      return null;
    }
  }
};

export async function getInstalledPlugins() {
  try {
    const plugins = [];
    const checkAndLoad = async (relPluginsDir) => {
      if (await exists(relPluginsDir, { baseDir: BaseDirectory.AppData })) {
        const entries = await readDir(relPluginsDir, { baseDir: BaseDirectory.AppData });
        for (const entry of entries) {
          if (entry.isDirectory) {
            const relManifest = `${relPluginsDir}/${entry.name}/manifest.json`;
            if (await exists(relManifest, { baseDir: BaseDirectory.AppData })) {
              try {
                const content = await readTextFile(relManifest, { baseDir: BaseDirectory.AppData });
                const manifest = JSON.parse(content);
                if (!plugins.some(p => p.id === entry.name)) {
                  plugins.push({ id: entry.name, ...manifest });
                }
              } catch (pe) {
                console.error(`[PLUGINS] Failed to parse manifest for ${entry.name}:`, pe);
              }
            }
          }
        }
      }
    };

    await checkAndLoad('growthvariable/RepoToPitch/plugins');
    await checkAndLoad('growthvariable/r2p/plugins');

    return plugins;
  } catch (err) {
    console.error('[PLUGINS] Discovery failed:', err);
    return [];
  }
}
