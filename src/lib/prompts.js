export const DEFAULT_PROMPTS = {
  repoOverview: {
    system: `You are a product-minded engineer extracting product meaning from code structure.
Be concise. Return ONLY the markdown structure requested. No preamble.`,
    prompt: `Analyse this {{repo_role_type}} repository as a product component.

Repository name: {{repo_name}}
Role in system: {{repo_role_desc}}
Other repos in this product: {{other_repos}}

=== REPO STRUCTURE ===
{{tree_text}}
=== END ===

=== ADDITIONAL CONTEXT ===
{{additional_docs}}
=== END ===

Return ONLY this markdown:

# {{repo_name}} — Component Overview

## Role
(1 sentence: what does this repo do in the overall system?)

## User-Facing Capabilities
(What can a user do because of this repo? 3–6 bullets. Even for APIs, think: "This enables the frontend to...")

## Key Technical Boundaries
(What does this repo own? What does it depend on externally? 2–4 bullets)

## Likely API Surface / Entry Points
(List the main endpoints, routes, or exported components you can infer from the structure. File paths + 1-line description)`
  },

  projectOverview: {
    system: `You are a solution architect. Synthesise multiple repository overviews into ONE high-level system overview.
Be concise. Focus on how components interact. Return ONLY markdown.`,
    prompt: `Synthesise these {{repo_count}} repositories into a single System Overview.

=== REPOSITORY OVERVIEWS ===
{{repo_overviews}}
=== END ===

Return ONLY this markdown:

# System Overview: Unified Architecture

## 1. System Mission
(2 sentences: What is the collective purpose of these repositories?)

## 2. Integrated Architecture Map
(Describe the high-level flow of data between the {{repo_count}} components. Use a simple text-based list or table.)

## 3. Global Capabilities
(What can the end-user do across the whole system? 4–8 bullets)

## 4. Cross-Component Dependencies
(How do these repos call each other? 3–5 bullets)

## 5. Technical Stack Consolidation
(What are the primary shared technologies inferred from all components?)`
  },

  moduleAnalysis: {
    system: `You are a product manager converting code into product language. No jargon. Return ONLY the markdown structure.`,
    prompt: `Analyse this file from the "{{repo_name}}" {{repo_role}} repository.

=== REPO CONTEXT ===
{{overview}}
=== END ===

=== FILE: {{file_path}} ===
{{file_content}}
=== END ===

Return ONLY this markdown:

# {{file_name}}

## What This Enables
(2–3 sentences from a user perspective)

## User Flows
### Flow 1: [name]
- Steps:
- Inputs:
- Outputs:
- Value:

## Constraints & Risks
(3–5 bullets)`
  },

  repoPrd: {
    system: `You are a senior product manager. Write a focused PRD for one service/component. Be specific. Return ONLY markdown.`,
    prompt: `Write a PRD for the "{{repo_name}}" repository ({{repo_role_desc}}).

=== COMPONENT OVERVIEW ===
{{overview}}
=== END ===

=== MODULE ANALYSES ===
{{module_analyses}}
=== END ===

=== ADDITIONAL CONTEXT ===
{{additional_docs}}
=== END ===

Return ONLY this PRD markdown:

# PRD: {{repo_name}}

## 1. Purpose
- What this component does (2 sentences)
- Who/what depends on it

## 2. Features
For each feature:
### [Feature Name]
- Description (1 sentence)
- User story: As a [user/system], I want to [action] so that [outcome]
- Acceptance criteria (2–3 bullets)

## 3. API / Interface Contract
(Key endpoints or component props with brief descriptions)

## 4. Non-Functional Requirements
- Performance:
- Security:
- Error handling:

## 5. Dependencies
- Calls: (other repos/services this depends on)
- Called by: (what uses this)

## 6. Roadmap
### Now
### Next (3–6 months)
### Later (6–12 months)`
  },

  masterPrd: {
    system: `You are a senior product manager writing a master PRD for a multi-service product. 
Synthesise across all components into ONE coherent product story. Return ONLY markdown.`,
    prompt: `Write a master PRD for a product made up of {{repo_count}} repositories.

=== SYSTEM ARCHITECTURE ===
{{system_architecture}}
=== END ===

=== PER-REPO PRDs ===
{{per_repo_prds}}
=== END ===

=== FOUNDER Q&A ===
- Problem they solved for themselves: {{qa_problem}}
- Who else has this problem: {{qa_users}}
- What makes it different: {{qa_differentiator}}
- Top 3 features: {{qa_top_features}}
- Pricing model: {{qa_pricing}}
- Traction / signals: {{qa_traction}}
- Commercialisation goal: {{qa_goal}}
=== END ===

=== GLOBAL NARRATIVE & DOCUMENTS ===
{{global_narrative}}

{{global_documents}}
=== END ===

Return ONLY this master PRD markdown:

## 1. Project Vision & Mission
(The 'Why' behind this product)

## 2. Target Audience
(Who are we building for?)

## 3. Product Principles
- Simplicity:
- Scalability:
- Reliability:
- Security:

## 4. Master Feature List
(High-level capabilities across the whole ecosystem)
| Feature | Description | Service(s) | Maturity |
|---------|-------------|------------|----------|

## 5. Technical Overview & Stack
(Consolidated view of the {{repo_count}} repositories)
| Repository | Role | Main Tech |
|------------|------|-----------|

## 6. Goals & Success Metrics
(What does success look like for the project?)

## 7. Governance & Contribution
(Maintainership, contribution standards, roadmap management)

## 8. Master Roadmap
### Phase 1 — MVP & Core Stability (Now)
### Phase 2 — Scaling & Feature Expansion (3–6 months)
### Phase 3 — Ecosystem & Integrations (6–12 months)

## 9. Open Questions
(Topics currently under discovery or discussion)
`
  },

  pitchOutline: {
    system: `You are a Master Pitch Architect. Define a strategic {{slide_count}}-slide investor pitch deck outline.
Return ONLY a valid JSON array of {{slide_count}} objects: [{"slide": 1, "title": "...", "subtitle": "..."}, ...]`,
    prompt: `Create a {{slide_count}}-slide pitch outline from this Master PRD.
    
=== MASTER PRD ===
{{master_prd}}
=== END ===

=== STRATEGIC CONTEXT ===
- Users: {{qa_users}}
- Goal: {{qa_goal}}
- Instructions: {{pitch_instructions}}

Return ONLY the JSON array of titles/subtitles. No preamble.`
  },

  pitchSlideContent: {
    system: `You are a Master Pitch Architect. Write high-fidelity content for ONE specific slide in a 10-slide deck.
Return ONLY valid JSON. NEVER return markdown fences, comments, or placeholder text like "[X]".
If you cannot generate content, return the JSON with an empty bullets array.`,
    prompt: `Generate content for Slide {{slide_number}}: "{{slide_title}}"

=== SLIDE CONTEXT ===
- Subtitle: {{slide_subtitle}}
- Overall Project: {{master_prd_summary}}
- Strategy: {{pitch_instructions}}

Return ONLY this JSON structure. NO OTHER TEXT:
{
  "slide": {{slide_number}},
  "title": "{{slide_title}}",
  "subtitle": "{{slide_subtitle}}",
  "bullets": ["3-4 punchy investor bullets"],
  "speaker_note": "A deep-dive architect note for the founder"
}
`
  },

  techArchitecture: {
    system: `You are a Principal Software Architect. Write a thorough Technical Architecture document.
Return ONLY markdown. Focus on modularity, scalability, and performance.`,
    prompt: `Generate a Technical Architecture document for this multi-repo product.
    
=== REPOSITORY DETAILS ===
{{repo_details}}
=== END ===

=== MASTER PRODUCT CONTEXT ===
{{master_prd_summary}}
=== END ===

Return ONLY this markdown structure:

# Technical Architecture & System Design

## 1. Architectural Style
(e.g., Microservices, Monolithic with Modules, Serverless, etc.)

## 2. Component Deconstruction
(Deep dive into the {{repo_count}} repositories and their internal modules)
| Component | Primary Responsibility | Key Modules | Interaction Pattern |
|-----------|------------------------|-------------|---------------------|

## 3. Communication & Data Flow
(Describe how components talk to each other: REST, WebSockets, Pub/Sub, etc.)

## 4. Technology Stack & Tooling
- Frontend:
- Backend:
- Database / Storage:
- DevOps / CI/CD:

## 5. Deployment Architecture
(How to run the whole system. Docker, Kubernetes, Local Setup)

## 6. Security Architecture
(Authentication, Authorization, Data Encryption at rest/motion)

## 7. Extensibility & Plugin System
(How can other developers extend this system?)

## 8. Testing & Quality Assurance
(Unit tests, Integration tests, Performance benchmarks)`
  },

  competitivePositioning: {
    system: `You are a Strategic Product Analyst. Define the competitive landscape and unique value proposition.
Return ONLY markdown.`,
    prompt: `Generate a Competitive Positioning document.

=== PROJECT OVERVIEW ===
{{project_overview}}
=== END ===

=== FOUNDER INSIGHTS ===
- Problem: {{qa_problem}}
- Target Users: {{qa_users}}
- Unique Differentiator: {{qa_differentiator}}
- Top Features: {{qa_top_features}}
- Pricing/Model: {{qa_pricing}}
=== END ===

Return ONLY this markdown structure:

# Competitive Positioning & Market Fit

## 1. Market Landscape
(Overview of the space this product occupies)

## 2. Direct Competitors
| Competitor | Strengths | Weaknesses | Our Advantage |
|------------|-----------|------------|---------------|

## 3. Unique Value Proposition (UVP)
(Why should someone choose THIS product over alternatives?)

## 4. Strategic Differentiation
(What makes this approach unique?)

## 5. SWOT Analysis
- Strengths:
- Weaknesses:
- Opportunities:
- Threats:

## 6. User Personas
(Who is the ideal user?)`
  },

  goToMarket: {
    system: `You are a GTM Strategist. Define the adoption and growth strategy.
Return ONLY markdown.`,
    prompt: `Generate a Go-To-Market (GTM) Strategy.

=== PROJECT OVERVIEW ===
{{project_overview}}
=== END ===

=== FOUNDER INSIGHTS ===
- Problem: {{qa_problem}}
- Users: {{qa_users}}
- Differentiator: {{qa_differentiator}}
- Features: {{qa_top_features}}
- Pricing/Sustainability: {{qa_pricing}}
- Current Traction: {{qa_traction}}
- Main Goal: {{qa_goal}}
=== END ===

Return ONLY this markdown structure:

# Go-To-Market (GTM) Strategy

## 1. Launch Strategy
(Initial announcement channels and target markets)

## 2. Acquisition Channels
(How to get the first 100/1000 users)

## 3. Content Roadmap
(Documentation, Tutorials, Blog Posts, Case Studies)

## 4. Partnerships & Integrations
(Which other projects should we integrate with?)

## 5. Pricing & Sustainability Model
(How the project will be sustained commercially or via community support)`
  },

  riskRegister: {
    system: `You are a Risk Management Specialist. Identify technical, operational, and market risks.
Return ONLY markdown.`,
    prompt: `Generate a Risk Register.

=== PROJECT OVERVIEW ===
{{project_overview}}
=== END ===

=== MASTER PRD CONTEXT ===
{{master_prd_summary}}
=== END ===

Return ONLY this markdown structure:

# Project Risk Register

## 1. Technical Risks
| Risk | Impact | Probability | Mitigation Strategy |
|------|--------|-------------|---------------------|

## 2. Operational & Execution Risks
| Risk | Impact | Probability | Mitigation Strategy |

## 3. Security & Privacy Risks
| Risk | Impact | Probability | Mitigation Strategy |

## 4. Market & Competitive Risks
| Risk | Impact | Probability | Mitigation Strategy |

## 5. Compliance & Legal Risks
(Licenses, Patents, GDPR)`
  },

  dataPrivacy: {
    system: `You are a Privacy & Data Security Expert. Define the data handling and privacy policy.
Return ONLY markdown.`,
    prompt: `Generate a Data Privacy & Security document.

=== PROJECT OVERVIEW ===
{{project_overview}}
=== END ===

=== TECHNICAL CONTEXT ===
{{master_prd_summary}}
=== END ===

Return ONLY this markdown structure:

# Data Privacy & Security Architecture

## 1. Data Flow Map
(Where does data enter, move, and rest?)

## 2. Personally Identifiable Information (PII)
(What data is collected and why?)

## 3. Telemetry & Analytics Policy
(How do we track usage while respecting privacy?)

## 4. Encryption Standards
(Motion and Rest)

## 5. Security Controls
(CI/CD security scanning, dependency auditing, vulnerability reporting)

## 6. Compliance Frameworks
(GDPR, CCPA, etc. as they apply to the project)`
  },

  apiDocs: {
    system: `You are a Technical Writer & API Designer. Generate high-fidelity API documentation for developers.
Return ONLY markdown.`,
    prompt: `Generate API Documentation for the system.

=== REPOSITORY DETAILS ===
{{repo_details}}
=== END ===

=== TECHNICAL CONTEXT ===
{{master_prd_summary}}
=== END ===

Return ONLY this markdown structure:

# API Documentation & Developer Guide

## 1. Getting Started
(Base URLs, Authentication patterns)

## 2. Authentication & Security
(How to get access tokens, API keys, etc.)

## 3. Core API References
(List major endpoints grouped by service/repo)
### [Service Name]
- Endpoint: 
- Method:
- Parameters:
- Response Format:

## 4. Webhooks & Events
(Real-time updates)

## 5. Error Handling & Rate Limits
(Common error codes and how to handle them)

## 6. SDKs & Client Libraries
(Available official and community libraries)`
  },

  onboardingGuide: {
    system: `You are a Developer Experience (DX) Specialist. Generate a thorough onboarding guide for new team members.
Return ONLY markdown.`,
    prompt: `Generate a Project Onboarding Guide.

=== PROJECT OVERVIEW ===
{{project_overview}}
=== END ===

=== TECHNICAL CONTEXT ===
{{master_prd_summary}}
=== END ===

Return ONLY this markdown structure:

# Project Onboarding & Contributor Guide

## 1. Quick Start
(How to get the product running in 5 minutes)

## 2. Local Environment Setup
(Prerequisites, Installation, Environment Variables)

## 3. Architecture Orientation
(Where to find what in the multi-repo structure)

## 4. Development Workflow
(Branching strategy, PR process, Code review standards)

## 5. Running Tests & Linters
(Ensuring code quality before submission)

## 6. Resources & Support
(Where to ask questions)`
  }
}

export function renderPrompt(key, context, customPrompts = {}) {
  const defaults = DEFAULT_PROMPTS[key] || { system: '', prompt: '' }
  const custom = customPrompts[key] || {}
  
  let system = custom.system || defaults.system
  let prompt = custom.prompt || defaults.prompt

  Object.entries(context).forEach(([k, v]) => {
    const regex = new RegExp(`{{${k}}}`, 'g')
    system = system.replace(regex, v)
    prompt = prompt.replace(regex, v)
  })

  const noLatexRule = "\nCRITICAL: Never use LaTeX math notation (e.g., $ightarrow$, \\rightarrow). Use standard Unicode symbols like →, ←, •, etc."
  return { system: system + noLatexRule, prompt }
}
