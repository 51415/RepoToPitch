# README ADDITION — Corporate & Enterprise Use Cases
========================================================
Insert this section into README.md after the "Who this is for" section.
Replace or extend that section with this expanded version.
========================================================

---

## Who this is for

RepoToPitch was built for one situation: a working codebase with no clean product narrative around it.

That situation appears in more places than most people realise.

### Technical founders
You built something for yourself. It works. Now you need to explain it to investors, co-founders, or early customers — in product language, not engineering language.

### New CTOs and engineering directors
You joined 60–90 days ago. You have repo access. You have spoken to the team. You still do not have a clean picture of what the system does as a *product* — what it enables, what it owns, what the risks are. The documentation describes a system that no longer exists.

### Legacy modernisation programmes
Before you decide what to replace, you need to know what you have. The existing system's original architects have mostly left. The PRD for what was built — not what was designed — needs to exist before scope can be set honestly.

### M&A technical due diligence
You have two weeks and access to the target's repositories under NDA. You need to understand the technical asset — its capabilities, its risks, its dependencies — and whether the product narrative the founders have been selling matches what is actually in the code.

### Engineering teams preparing board or budget submissions
Your team maintains a platform the business depends on. The board asks why it needs six people. You need a document that describes what the platform enables, what the risk is if it is underfunded, and what investment will produce — in language a CFO finds credible.

### Consultants and fractional CTOs
You have a week to get to a useful level of comprehension of a client's system before you are expected to give strategic recommendations. Reading code line by line is not the fastest path to understanding what a system does as a product.

### Startup advisors
Founders describe their vision, not their product. The gap between the two is usually where the advisory work needs to happen. Reading the code before giving strategic advice closes that gap.

### Digital agencies handling project handover
Handover documentation written by the team that built the system is almost always useless to the client who has to maintain it. It describes how the system works. The client needs to know what it does, what would break, and what the next phase would involve.

---

## The constraint that matters in corporate contexts

**Local LLM is not a feature. In enterprise environments, it is a requirement.**

Most AI-assisted analysis tools require sending code to an external API — OpenAI, Anthropic, or similar. You cannot do that with banking code, healthcare systems, defence contracts, proprietary business logic, or anything under NDA.

RepoToPitch runs on [Ollama](https://ollama.ai), which runs entirely within your own infrastructure. No code, no file content, no structural information reaches any external server. It can run on a developer's laptop, on a secure internal server, or inside an air-gapped environment.

This is the answer to the information security question before it is asked.

---

## Tailored Q&A sets for each context

The default Q&A layer is tuned for founders preparing for commercial conversations. For other contexts, the questions need to change.

Full tailored Q&A sets for each use case are in [USE-CASES.md](USE-CASES.md):

- [New CTO inheriting a codebase](USE-CASES.md#2-new-cto--engineering-director--inheriting-an-undocumented-codebase)
- [Legacy modernisation](USE-CASES.md#3-legacy-modernisation--documenting-what-exists-before-deciding-what-to-replace)
- [M&A technical due diligence](USE-CASES.md#4-ma-technical-due-diligence--understanding-an-acquisition-targets-codebase)
- [Board / budget justification](USE-CASES.md#5-internal-budget--board-justification--translating-engineering-value-into-business-language)
- [Consulting / systems integrator](USE-CASES.md#6-consulting--systems-integrator--onboarding-to-a-clients-codebase)
- [Startup advisor](USE-CASES.md#7-startup-advisor--understanding-a-clients-product-before-giving-strategic-advice)
- [Digital agency handover](USE-CASES.md#8-digital-agency--project-handover-documentation)

You can replace or supplement the default Q&A questions in `src/pages/QAPage.jsx` for your specific context.
