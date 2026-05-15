import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { buildTreeText, getOS } from './folderUtils'

// Native Storage Bridge for Tauri 2.0
const tauriStorage = {
  getItem: async (name) => {
    try {
      const { appLocalDataDir, join } = await import('@tauri-apps/api/path')
      const { readTextFile, exists } = await import('@tauri-apps/plugin-fs')
      const dataDir = await appLocalDataDir()
      const filePath = await join(dataDir, `${name}.json`)
      
      if (await exists(filePath)) {
        return await readTextFile(filePath)
      }
    } catch (e) {
      console.warn('[STORAGE] Native read failed, falling back to empty:', e)
    }
    return null
  },
  setItem: async (name, value) => {
    try {
      const { appLocalDataDir, join } = await import('@tauri-apps/api/path')
      const { writeTextFile, mkdir, exists } = await import('@tauri-apps/plugin-fs')
      const dataDir = await appLocalDataDir()
      const filePath = await join(dataDir, `${name}.json`)
      
      if (!(await exists(dataDir))) {
        await mkdir(dataDir, { recursive: true })
      }
      
      await writeTextFile(filePath, value)
    } catch (e) {
      console.error('[STORAGE] Native write failed:', e)
    }
  },
  removeItem: async (name) => {
    try {
      const { appLocalDataDir, join } = await import('@tauri-apps/api/path')
      const { remove } = await import('@tauri-apps/plugin-fs')
      const dataDir = await appLocalDataDir()
      const filePath = await join(dataDir, `${name}.json`)
      await remove(filePath)
    } catch (e) {
      console.error('[STORAGE] Native remove failed:', e)
    }
  }
}

function uid() {
  return Math.random().toString(36).slice(2, 10)
}

function blankRepo(role = '') {
  return { 
    id: uid(), 
    name: '', 
    role, 
    treeData: [], 
    treeText: '', 
    maxDepth: 3, 
    modules: [], 
    overview: '', 
    prd: '', 
    calls: [],
    documents: []
  }
}

export const useStore = create(
  persist(
    (set, get) => ({
      modelCode: 'gemma2:latest',
      modelArtifacts: 'gemma2:latest',
      ollamaHost: 'http://localhost:11434',
      projectName: '',
      currentProjectId: null,
      globalContext: '',
      globalDocuments: [],
      projectOverview: '',
      masterPrd: '',
      pitchSlides: [],
      pitchInstructions: '',
      techArchitecture: '',
      competitivePositioning: '',
      goToMarket: '',
      riskRegister: '',
      dataPrivacy: '',
      apiDocs: '',
      onboardingGuide: '',
      masterPageTab: 'project-overview',
      brandConfig: {},
      setupComplete: false,


      
      setGlobalContext: (c) => set({ globalContext: c, isDirty: true }),
      setProjectOverview: (o) => set({ projectOverview: o, isDirty: true }),
      setPitchInstructions: (i) => set({ pitchInstructions: i, isDirty: true }),
      addGlobalDocument: (doc) => set(s => ({ isDirty: true, globalDocuments: [...s.globalDocuments, doc] })),
      removeGlobalDocument: (name) => set(s => ({ isDirty: true, globalDocuments: s.globalDocuments.filter(d => d.name !== name) })),
      setProjectName: (n) => set({ projectName: n, isDirty: true }),
      setModelCode: (m) => set({ modelCode: m }),
      setModelArtifacts: (m) => set({ modelArtifacts: m }),
      setOllamaHost: (h) => set({ ollamaHost: h }),
      setMasterPrd: (p) => set({ masterPrd: p, isDirty: true }),
      setPitchSlides: (sl) => set({ pitchSlides: sl, isDirty: true }),
      setTechArchitecture: (a) => set({ techArchitecture: a, isDirty: true }),
      setCompetitivePositioning: (p) => set({ competitivePositioning: p, isDirty: true }),
      setGoToMarket: (g) => set({ goToMarket: g, isDirty: true }),
      setRiskRegister: (r) => set({ riskRegister: r, isDirty: true }),
      setDataPrivacy: (d) => set({ dataPrivacy: d, isDirty: true }),
      setApiDocs: (a) => set({ apiDocs: a, isDirty: true }),
      setOnboardingGuide: (o) => set({ onboardingGuide: o, isDirty: true }),
      setMasterPageTab: (t) => set({ masterPageTab: t }),
      setBrandConfig: (b) => set({ brandConfig: b }),
      setSetupComplete: (val) => set({ setupComplete: val }),


      activeRepoId: null,
      setActiveRepoId: (id) => set({ activeRepoId: id }),
      activeAnalyseRepoId: null,
      setActiveAnalyseRepoId: (id) => set({ activeAnalyseRepoId: id }),

      showSettings: false,
      setShowSettings: (val) => set({ showSettings: val }),
      settingsFlashCount: 0,
      triggerSettingsFlash: () => set(s => ({ settingsFlashCount: s.settingsFlashCount + 1 })),

      autoPicker: false,
      setAutoPicker: (val) => set({ autoPicker: val }),

      currentStep: 0,
      setStep: (s) => set({ currentStep: s }),

      globalMaxDepth: 3,
      setGlobalMaxDepth: (d) => set({ globalMaxDepth: d }),

      checkModels: () => {
        const { modelCode, modelArtifacts } = get()
        if (!modelCode || !modelArtifacts) {
          set({ showSettings: true })
          return false
        }
        return true
      },

      tasks: [],
      addTask: (t) => set(s => ({ 
        tasks: [
          ...s.tasks.filter(ex => ex.status !== 'error'),
          { id: uid(), status: 'pending', progress: 0, ...t }
        ] 
      })),
      updateTask: (id, patch) => set(s => ({ tasks: s.tasks.map(t => t.id === id ? { ...t, ...patch } : t) })),
      removeTask: (id) => set(s => ({ tasks: s.tasks.filter(t => t.id !== id) })),
      clearTasks: () => set({ tasks: [] }),

      projects: [], 

      projectFilePath: null,
      setProjectFilePath: (p) => set({ projectFilePath: p }),

      saveProject: async (name) => {
        const state = get()
        const finalName = name || state.projectName
        if (!finalName) return false;

        const isDuplicate = state.projects.some(p => p.name?.toLowerCase() === finalName.toLowerCase() && p.id !== state.currentProjectId)
        if (isDuplicate) {
          alert(`A project with the name "${finalName}" already exists. Please use a unique name.`)
          return false
        }

        const projectData = {
          id: state.currentProjectId || uid(),
          name: finalName,
          date: new Date().toISOString(),
          data: {
            repos: state.repos,
            qaAnswers: state.qaAnswers,
            masterPrd: state.masterPrd,
            pitchSlides: state.pitchSlides,
            techArchitecture: state.techArchitecture,
            competitivePositioning: state.competitivePositioning,
            goToMarket: state.goToMarket,
            riskRegister: state.riskRegister,
            dataPrivacy: state.dataPrivacy,
            apiDocs: state.apiDocs,
            onboardingGuide: state.onboardingGuide,
            projectOverview: state.projectOverview,
            pitchInstructions: state.pitchInstructions,
            globalContext: state.globalContext,
            globalDocuments: state.globalDocuments,
            customPrompts: state.customPrompts
          }
        }

        try {
          let targetPath = state.projectFilePath
          if (!targetPath) {
            const { save } = await import('@tauri-apps/plugin-dialog')
            targetPath = await save({
              defaultPath: `${(finalName || 'project').toLowerCase().replace(/[^a-z0-9]/g, '_')}.json`,
              filters: [{ name: 'Project', extensions: ['json'] }]
            })
          }

          if (targetPath) {
            const { writeTextFile } = await import('@tauri-apps/plugin-fs')
            await writeTextFile(targetPath, JSON.stringify(projectData, null, 2))
            
            set(s => {
              const filtered = s.projects.filter(p => p.id !== projectData.id)
              return {
                projects: [{ ...projectData, path: targetPath }, ...filtered],
                isDirty: false,
                projectName: finalName,
                currentProjectId: projectData.id,
                projectFilePath: targetPath
              }
            })
          }
        } catch (e) {
          console.error('[SAVE] Failed to save project:', e)
        }
      },

      loadProject: (id) => {
        const project = get().projects.find(p => p.id === id)
        if (!project) return
        get().importProjectData(project)
      },

      importProjectData: (project) => {
        set({
          repos: project.data.repos,
          qaAnswers: project.data.qaAnswers,
          masterPrd: project.data.masterPrd,
          pitchSlides: project.data.pitchSlides,
          techArchitecture: project.data.techArchitecture || '',
          competitivePositioning: project.data.competitivePositioning || '',
          goToMarket: project.data.goToMarket || '',
          riskRegister: project.data.riskRegister || '',
          dataPrivacy: project.data.dataPrivacy || '',
          apiDocs: project.data.apiDocs || '',
          onboardingGuide: project.data.onboardingGuide || '',
          projectOverview: project.data.projectOverview || '',
          pitchInstructions: project.data.pitchInstructions || '',
          globalContext: project.data.globalContext || '',
          globalDocuments: project.data.globalDocuments || [],
          customPrompts: project.data.customPrompts,
          projectName: project.name,
          currentProjectId: project.id,
          projectFilePath: project.path || null,
          currentStep: 0,
          isDirty: false,
          activeRepoId: null,
          activeAnalyseRepoId: null
        })
      },

      openProject: async () => {
        try {
          if (get().isDirty) {
            try {
              const { ask } = await import('@tauri-apps/plugin-dialog');
              const confirmed = await ask('You have unsaved changes. Open another project?', {
                title: 'Unsaved Changes',
                kind: 'warning',
                okLabel: 'Open Project',
                cancelLabel: 'Cancel'
              });
              if (!confirmed) return;
            } catch (e) {
              if (!window.confirm('You have unsaved changes. Open another project?')) return;
            }
          }

          const { open } = await import('@tauri-apps/plugin-dialog')
          const selected = await open({
            multiple: false,
            filters: [{ name: 'Project', extensions: ['json'] }]
          })

          if (selected) {
            const { readTextFile } = await import('@tauri-apps/plugin-fs')
            const content = await readTextFile(selected)
            const projectData = JSON.parse(content)
            
            if (!projectData || !projectData.data) {
              throw new Error('Invalid project file format');
            }

            set(s => {
              const filtered = s.projects.filter(p => p.id !== projectData.id)
              const metadata = {
                id: projectData.id,
                name: projectData.name,
                date: projectData.date,
                path: selected
              }
              return {
                projects: [metadata, ...filtered],
                repos: projectData.data.repos,
                qaAnswers: projectData.data.qaAnswers,
                masterPrd: projectData.data.masterPrd,
                pitchSlides: projectData.data.pitchSlides,
                techArchitecture: projectData.data.techArchitecture || '',
                competitivePositioning: projectData.data.competitivePositioning || '',
                goToMarket: projectData.data.goToMarket || '',
                riskRegister: projectData.data.riskRegister || '',
                dataPrivacy: projectData.data.dataPrivacy || '',
                apiDocs: projectData.data.apiDocs || '',
                onboardingGuide: projectData.data.onboardingGuide || '',
                projectOverview: projectData.data.projectOverview || '',
                pitchInstructions: projectData.data.pitchInstructions || '',
                globalContext: projectData.data.globalContext || '',
                globalDocuments: projectData.data.globalDocuments || [],
                customPrompts: projectData.data.customPrompts,
                projectName: projectData.name,
                currentProjectId: projectData.id,
                projectFilePath: selected,
                currentStep: 1, 
                isDirty: false,
                activeRepoId: null,
                activeAnalyseRepoId: null
              }
            })
          }
        } catch (e) {
          console.error('[OPEN] Failed to open project:', e)
          alert(`Failed to open project: ${e.message || 'Unknown error'}`)
        }
      },

      closeProject: async () => {
        if (get().isDirty) {
          try {
            const { ask } = await import('@tauri-apps/plugin-dialog');
            const confirmed = await ask('You have unsaved changes. Close current project?', {
              title: 'Unsaved Changes',
              kind: 'warning',
              okLabel: 'Close Anyway',
              cancelLabel: 'Stay'
            });
            if (!confirmed) return;
          } catch (e) {
            if (!window.confirm('You have unsaved changes. Close current project?')) return;
          }
        }
        get().resetProject();
      },
      
      newProject: async () => {
        if (get().isDirty) {
          try {
            const { ask } = await import('@tauri-apps/plugin-dialog');
            const confirmed = await ask('You have unsaved changes. Start new project?', {
              title: 'Unsaved Changes',
              kind: 'warning',
              okLabel: 'New Project',
              cancelLabel: 'Cancel'
            });
            if (!confirmed) return;
          } catch (e) {
            if (!window.confirm('You have unsaved changes. Start new project?')) return;
          }
        }
        get().resetProject();
      },

      
      deleteProject: (id) => set(s => ({ projects: s.projects.filter(p => p.id !== id) })),

      customPrompts: {},
      setCustomPrompt: (key, patch) => set((s) => ({
        customPrompts: {
          ...s.customPrompts,
          [key]: { ...(s.customPrompts[key] || {}), ...patch }
        }
      })),
      setCustomPrompts: (prompts) => set({ customPrompts: prompts }),

      repos: [],
      addRepo: (role = '', initial = {}) =>
        set((s) => ({ repos: [...s.repos, { ...blankRepo(role), ...initial }], isDirty: true })),
      removeRepo: (id) =>
        set((s) => ({ repos: s.repos.filter((r) => r.id !== id), isDirty: true })),
      updateRepo: (id, patch) =>
        set((s) => ({
          isDirty: true,
          repos: s.repos.map((r) => {
            if (r.id !== id) return r
            const updated = { ...r, ...patch }
            if (patch.treeData || patch.ignored !== undefined) {
              updated.treeText = buildTreeText(updated.treeData, getOS())
            }
            return updated
          })
        })),

      addDocument: (repoId, doc) =>
        set((s) => ({
          isDirty: true,
          repos: s.repos.map((r) =>
            r.id === repoId ? { ...r, documents: [...r.documents, doc] } : r
          )
        })),
      removeDocument: (repoId, docName) =>
        set((s) => ({
          isDirty: true,
          repos: s.repos.map((r) =>
            r.id === repoId ? { ...r, documents: r.documents.filter(d => d.name !== docName) } : r
          )
        })),

      toggleRepoIgnore: (repoId, nodePath) => {
        const repo = get().repos.find(r => r.id === repoId)
        if (!repo) return
        function setIgnoredRecursive(nodes, forceState) {
          return nodes.map(node => {
            const nextNode = { ...node, ignored: forceState }
            if (node.children && node.children.length > 0) {
              nextNode.children = setIgnoredRecursive(node.children, forceState)
            }
            return nextNode
          })
        }
        function findAndToggle(nodes) {
          return nodes.map(node => {
            if (node.path === nodePath) {
              const nextState = !node.ignored
              const nextNode = { ...node, ignored: nextState }
              if (node.children && node.children.length > 0) {
                nextNode.children = setIgnoredRecursive(node.children, nextState)
              }
              return nextNode
            }
            if (node.children && node.children.length > 0) {
              return { ...node, children: findAndToggle(node.children) }
            }
            return node
          })
        }
        const nextTreeData = findAndToggle(repo.treeData)
        get().updateRepo(repoId, { treeData: nextTreeData })
      },

      qaAnswers: {},
      setQaAnswer: (key, val) =>
        set((s) => ({ qaAnswers: { ...s.qaAnswers, [key]: val }, isDirty: true })),

      isDirty: false,
      setDirty: (val) => set({ isDirty: val }),

      resetProject: () => {
        set({
          currentStep: 1, 
          repos: [],
          qaAnswers: {},
          masterPrd: '',
          pitchSlides: [],
          techArchitecture: '',
          competitivePositioning: '',
          goToMarket: '',
          riskRegister: '',
          dataPrivacy: '',
          apiDocs: '',
          onboardingGuide: '',
          tasks: [],
          autoPicker: false,
          isDirty: false,
          projectName: '',
          currentProjectId: null,
          projectFilePath: null,
          globalContext: '',
          globalDocuments: [],
          projectOverview: '',
          activeRepoId: null,
          activeAnalyseRepoId: null
        })
      },


      resetSystem: () => {
        set({
          projects: [],
          currentStep: 0,
          repos: [],
          qaAnswers: {},
          masterPrd: '',
          pitchSlides: [],
          techArchitecture: '',
          competitivePositioning: '',
          goToMarket: '',
          riskRegister: '',
          dataPrivacy: '',
          apiDocs: '',
          onboardingGuide: '',
          tasks: [],
          modelCode: '',
          modelArtifacts: '',
          customPrompts: {},
          brandConfig: {},

          autoPicker: false,
          showSettings: false
        })
      },
    }),
    {
      name: 'r2p-settings',
      storage: createJSONStorage(() => tauriStorage),
      partialize: (s) => ({
        modelCode: s.modelCode,
        modelArtifacts: s.modelArtifacts,
        ollamaHost: s.ollamaHost,
        customPrompts: s.customPrompts,
        brandConfig: s.brandConfig,
        projects: s.projects 
      }),
    }
  )
)
