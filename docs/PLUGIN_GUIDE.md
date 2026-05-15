# RepoToPitch Plugin Development Guide

Welcome to the RepoToPitch community! This guide provides everything you need to know to build, test, and share plugins for the R2P ecosystem.

## 1. Plugin Architecture

Plugins are standalone JavaScript scripts that hook into the R2P execution pipeline. They run in a sandboxed environment with access to a restricted set of APIs.

### The Hook System

R2P uses a hook-based architecture. Your plugin should export a `hooks` object containing the functions you want to trigger.

```javascript
module.exports = {
  hooks: {
    /**
     * Triggered during document generation to apply custom branding or layout.
     * @param {Object} context - Includes 'type' (docx/pptx), 'doc' (the document object), 'content', and 'brandConfig'.
     */
    APPLY_DOCUMENT_BRANDING: async (context) => {
      console.log('Applying branding for:', context.type);
      // Modify the document object here
      return context.doc;
    }
  }
};
```

## 2. Metadata Standards

Plugins must declare their identity using JSDoc-style tags or a `manifest.json` file.

### Recommended Tags (at the top of your script):
```javascript
/**
 * @plugin_id my-custom-plugin
 * @plugin_name Custom Layout Engine
 * @plugin_tab_name LAYOUT
 * @plugin_description Adds specialized layout capabilities to DOCX exports.
 */
```

## 3. Commercial Plugin Integration

If you want to sell your plugin or require a license check, you can leverage the built-in Lemon Squeezy integration.

### Licensing Handshake
The host app will look for a valid `PluginToken` before running your plugin. You can trigger a background check in your plugin's entry point:

```javascript
// The host app handles activation via the UI.
// Your plugin just needs to verify it is authorized.
```

## 4. Deployment

1. Compile your plugin into a single `.js` file.
2. Go to **Settings > Plugins** in RepoToPitch.
3. Click **Load Plugin File** and select your script.
4. If it requires a license, enter your key to activate.

## 6. Boilerplate Template

Copy this into a file named `my-plugin.js` to get started:

```javascript
/**
 * @plugin_id my-plugin
 * @plugin_name My Custom Extension
 * @plugin_tab_name MY_UNIT
 * @plugin_description Extends RepoToPitch with custom hooks.
 */

module.exports = {
  hooks: {
    /**
     * Optional: Triggered when the plugin is first loaded.
     */
    ON_PLUGIN_LOAD: async () => {
      console.log('My Plugin Loaded');
    },

    /**
     * Core: Apply branding/layout logic during exports.
     */
    APPLY_DOCUMENT_BRANDING: async (context) => {
      const { type, doc, brandConfig } = context;
      console.log(`Processing ${type} with company: ${brandConfig.companyName}`);
      
      // Example: Add a custom watermark or footer logic
      // Return the modified document object
      return doc;
    }
  }
};
```

---
Happy Coding!
For more info, visit [growthvariable.com](https://growthvariable.com)

