import { Command } from '@tauri-apps/plugin-shell';
import { exists, BaseDirectory } from '@tauri-apps/plugin-fs';

export async function checkExportDependencies() {
  const results = {
    msOffice: false,
    libreOffice: false,
    sofficePath: null
  };

  try {
    // 1. Check for MS Office via PowerShell (Registry Check - multiple locations)
    const checkOffice = await Command.create('powershell', [
      '-Command',
      '$paths = @(' +
        '"HKLM:\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\App Paths\\Winword.exe", ' +
        '"HKCU:\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\App Paths\\Winword.exe", ' +
        '"HKLM:\\SOFTWARE\\WOW6432Node\\Microsoft\\Windows\\CurrentVersion\\App Paths\\Winword.exe", ' +
        '"HKLM:\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\App Paths\\Powerpnt.exe", ' +
        '"HKCU:\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\App Paths\\Powerpnt.exe", ' +
        '"HKLM:\\SOFTWARE\\WOW6432Node\\Microsoft\\Windows\\CurrentVersion\\App Paths\\Powerpnt.exe"' +
      '); $found = $false; foreach ($p in $paths) { if (Test-Path $p) { $found = $true; break } }; echo $found'
    ]).execute();
    
    if (checkOffice.stdout.trim().toLowerCase() === 'true') {
      results.msOffice = true;
    }


    // 2. Check for LibreOffice in PATH
    try {
      const checkLO = await Command.create('soffice', ['--version']).execute();
      if (checkLO.code === 0) {
        results.libreOffice = true;
        results.sofficePath = 'soffice';
      }
    } catch (e) {
      // Not in PATH
    }

    // 3. Check for LibreOffice in common Windows location
    if (!results.libreOffice) {
      const commonPath = 'C:\\Program Files\\LibreOffice\\program\\soffice.exe';
      const loExists = await Command.create('powershell', [
        '-Command',
        `Test-Path "${commonPath}"`
      ]).execute();
      
      if (loExists.stdout.trim().toLowerCase() === 'true') {
        results.libreOffice = true;
        results.sofficePath = commonPath;
      }
    }

    // 4. Check for Portable LibreOffice in AppData
    if (!results.libreOffice) {
      const portablePath = 'growthvariable/RepoToPitch/bin/libreoffice/program/soffice.exe';
      if (await exists(portablePath, { baseDir: BaseDirectory.AppData })) {
        results.libreOffice = true;
        results.sofficePath = 'PORTABLE'; 
      }
    }

  } catch (err) {
    console.error('[DEPENDENCY] Check failed:', err);
  }

  return results;
}

export async function downloadLibreOffice() {
  const { open } = await import('@tauri-apps/plugin-shell');
  await open('https://www.libreoffice.org/download/portable-versions/');
  alert('Please download and extract the Portable version of LibreOffice. Once extracted, the app will automatically detect it if placed in the system PATH or the default program folder.');
}
