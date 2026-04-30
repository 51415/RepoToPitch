<img src="../public/icons/main logo.png" width="200" alt="RepoToPitch" />

# RepoToPitch — Use Cases & Tailored Q&A Sets

RepoToPitch was built for one situation: a working codebase with no clean product narrative around it.

That situation appears in more contexts than most people realise. Below are eight distinct use cases — each with the specific problem it solves, who it's for, and a tailored set of Q&A questions to replace or supplement the default founder Q&A in each context.

The tool's core workflow — read repo structure, analyse modules, synthesise across repos — is identical in every case. What changes is the framing of the questions and what the output is used for.

---

## 1. Technical Founder — Commercialising a Hobby Project

**The situation**
You built something for yourself. It works. You use it. Now you want to charge for it, raise money, or at least explain it to someone who hasn't seen your screen before.

**The blocker**
You built first and documented never. You can demo the product but you cannot articulate the problem it solves, to someone who doesn't already have the problem.

**What the tool produces**
- A **Per-repo Technical Summary** for each service
- A **Master PRD** describing the whole product as one story
- A **10-artifact Synthesis Suite** (GTM, Architecture, Risk Register, etc.)
- A **Pitch Deck** with speaker notes and executive schematics

**Who reviews the output**
Investors, co-founders, early customers, accelerator applications.

**Tailored Q&A for this context**

| Question | What you're actually asking |
|----------|---------------------------|
| What problem were you solving for yourself? | The authentic origin of the product — this becomes the problem slide |
| Who else has this problem and why haven't they solved it yet? | Market and persona definition |
| What would you charge, and why that number? | Business model and pricing logic |
| What are the three things users would miss most if this disappeared? | Core value, not feature list |
| What have you observed that tells you this is real for others, not just you? | Traction and validation signals |
| What makes this genuinely different from doing nothing or using something existing? | The honest differentiator |
| What do you need in the next 12 months and why? | The ask — funding, revenue, team |

---

## 2. New CTO / Engineering Director — Inheriting an Undocumented Codebase

**The situation**
You joined 60, 90, 120 days ago. You have access to the repos. You have spoken to the team. You still do not have a clean picture of what the system does as a *product* — what it enables users to do, what it owns, what it depends on, what the risks are.

**The blocker**
The original architects may have left. The people who remain are too close to it to explain it simply. Every document that exists is either a technical spec from three years ago or a Confluence page nobody has touched since the sprint it was written in.

**What the tool produces**
- A per-system PRD for each component or service cluster
- A master document describing the whole platform in product language
- A clear architecture summary with cross-system dependencies

**Who reviews the output**
The CTO uses it for their own clarity first. Then it becomes the foundation for the 100-day plan, the board update, the team briefing, or the modernisation roadmap.

**Tailored Q&A for this context**

| Question | What you're actually asking |
|----------|---------------------------|
| What business process does this system support and what would break if it went down? | Criticality and business dependency |
| Who are the actual users — internal, external, or both? | Persona and usage pattern |
| What was the original problem this was built to solve, and is that still the problem? | Fit-for-purpose assessment |
| Where does this system create the most friction for users right now? | Technical debt with user impact |
| What does the team believe is most at risk in this codebase? | Risk register starting point |
| What decisions are being deferred because the system makes them hard? | Strategic constraints imposed by the architecture |
| What would you want this system to do in two years that it cannot do today? | Forward-looking roadmap input |

**Note on local LLM**
In a corporate context, this constraint matters more than any other. Your codebase may contain proprietary business logic, customer data structures, or regulated information. Ollama runs entirely within your own infrastructure. No code, no structure, no file content reaches any external service. This is the answer to the information security question before it is asked.

---

## 3. Legacy Modernisation — Documenting What Exists Before Deciding What to Replace

**The situation**
The organisation has decided — or is considering — modernising a legacy platform. Before you can plan what to build, you need to understand what you have. The codebase is years old. The people who built it are mostly gone. The documentation, if it exists, describes what was intended, not what was built.

**The blocker**
Modernisation programmes fail at the requirements stage because nobody has a clear, accurate picture of what the existing system actually does. Teams underestimate scope. Scope creep is not scope creep — it is undiscovered scope from the beginning.

**What the tool produces**
- A PRD for the existing system (documenting what it does, not what it should do)
- An inventory of features, user flows, and constraints
- A dependency map showing what integrates with what
- A risk register per component

**Who reviews the output**
The programme board, the architecture review board, the delivery team, the business stakeholders who will sign off on scope.

**Tailored Q&A for this context**

| Question | What you're actually asking |
|----------|---------------------------|
| What does this system do that users depend on daily, even if they complain about it? | Non-negotiable functional requirements |
| What integrations does this system have and which of them are undocumented? | Integration risk surface |
| What workarounds have users built because the system cannot do something? | Hidden requirements that will appear late |
| What business rules are encoded in this system that exist nowhere else? | Critical logic at risk of being lost |
| What would a five-year migration roadmap need to preserve at every stage? | Phasing constraints |
| What is the cost of keeping this system running for another three years versus replacing it? | Business case framing |
| What does the organisation believe this system does that it actually does not? | Expectation gap — a common source of project failure |

---

## 4. M&A Technical Due Diligence — Understanding an Acquisition Target's Codebase

**The situation**
You are acquiring a company. You have access to their repositories under NDA. You have two weeks. You need to understand the technical asset you are buying — its quality, its risks, its dependencies, its scalability, and whether the product narrative the founders have been selling matches what is actually in the code.

**The blocker**
Standard due diligence focuses on financials and legal structure. Technical due diligence is often under-resourced and produces a report that says "the code is reasonable" without being able to articulate what the code *does* or what the risks are in product terms.

**What the tool produces**
- A product-level description of each repo or system component
- A dependency and integration map
- A risk register per component
- A PRD describing the product as it actually exists (not as it was pitched)
- A gap analysis between the pitch narrative and the code reality

**Who reviews the output**
The acquiring CTO, the deal team, the integration planning team, the board.

**Critical advantage**
Under NDA, no code can leave the acquiring organisation's environment. Running the tool locally on Ollama means the target's codebase is analysed entirely within a controlled environment. No external API calls. No data exposure.

**Tailored Q&A for this context**

| Question | What you're actually asking |
|----------|---------------------------|
| What does this product actually do, versus what the founders say it does? | Narrative vs reality gap |
| What are the three biggest technical risks in this codebase? | Risk register starting point |
| What would it cost and take to scale this system 10x? | Scalability assessment |
| What key-person dependencies exist in this codebase? | Bus factor — who has to stay |
| What technical debt would need to be addressed in year one post-acquisition? | Integration cost |
| What integrations or dependencies would be broken by separating this from the current organisation? | Separation complexity |
| What is missing from this system that would need to be built before it is fit for the acquirer's market? | Build cost post-acquisition |

---

## 5. Internal Budget / Board Justification — Translating Engineering Value into Business Language

**The situation**
Your team has built and maintained a platform that the business depends on. Now you need to justify next year's budget, defend headcount, or make the case for a significant re-architecture. The board does not speak engineering. You need to speak business.

**The blocker**
Engineers describe systems in terms of what they are. Boards need to hear what they *enable* and what the cost of losing them would be. The translation is consistently the hardest part.

**What the tool produces**
- A business-language description of each platform component
- A capability map: what the business can do *because* this system exists
- A risk exposure document: what would break, and at what cost, if each component failed
- A roadmap framed in business outcomes, not technical milestones

**Who reviews the output**
The CFO, the CEO, the board, the programme sponsor.

**Tailored Q&A for this context**

| Question | What you're actually asking |
|----------|---------------------------|
| What business revenue or operations does each system directly enable? | Commercial dependency |
| What would the cost be if this system were unavailable for 24 hours? 1 week? | Risk quantification |
| What decisions can the business not make without this system? | Strategic dependency |
| What competitive advantage does this platform create, if any? | Investment justification |
| What would it cost to buy this capability from a vendor instead of maintaining it? | Build vs buy framing |
| What would the team need to deliver the next phase of the roadmap? | The ask, framed as investment |
| What does good look like in 18 months, in terms a CFO would find credible? | Success metrics in business language |

---

## 6. Consulting / Systems Integrator — Onboarding to a Client's Codebase

**The situation**
You have been engaged to work on a client's system. You have repository access. You have some documentation. You have limited time with the people who built it. You need to get to a useful level of comprehension faster than the client expects, and without spending the first month asking questions that should have been answered by documentation.

**The blocker**
Client onboarding is expensive on both sides. The consultant asks questions the client does not have answers to. The client assumes the consultant understands more than they do. Both sides lose time.

**What the tool produces**
- A rapid product-level understanding of each system component
- A set of specific, intelligent questions to ask the client (the gaps the tool identifies)
- A working document that becomes the foundation for the engagement's discovery phase
- A shared language between the consultant and the client team

**Who reviews the output**
The consultant uses it internally. Selectively, the client-facing version becomes the discovery document that opens the first working session.

**Tailored Q&A for this context**

| Question | What you're actually asking |
|----------|---------------------------|
| What were we engaged to achieve and how does this codebase relate to that goal? | Scope grounding |
| Who are the primary users of each system component and what do they complain about most? | User pain starting point |
| What constraints — technical, organisational, or contractual — do we need to work within? | Delivery constraints |
| What has been tried before on this problem and why did it not work? | Avoiding repeated mistakes |
| Who in the client organisation knows this system best and is available to us? | Knowledge access |
| What does success look like at the end of this engagement, in terms the client can measure? | Outcome definition |
| What is the most important thing to get right in the first 30 days? | Priority setting |

---

## 7. Startup Advisor — Understanding a Client's Product Before Giving Strategic Advice

**The situation**
You are advising a startup. You have had two or three conversations. You have a sense of the business. Yet when you try to give specific product or technical advice, you are working from what the founder *told* you the product does — not from what it actually does.

**The blocker**
Founders describe their products in terms of their vision, not their current reality. The gap between the two is where most strategic advice goes wrong. You advise on a product that does not yet exist, and the founder nods along because they see the vision too.

**What the tool produces**
- An honest, code-derived description of what the product currently does
- A gap map between the current product and the founder's narrative
- A PRD that becomes the shared working document for the advisory relationship
- A set of specific strategic questions surfaced by the gap analysis

**Who reviews the output**
The advisor uses it to sharpen their advice. The founder uses it as a mirror — often the most valuable output is seeing the gap between what they say and what the code reveals.

**Tailored Q&A for this context**

| Question | What you're actually asking |
|----------|---------------------------|
| What does the founder believe this product does that the code does not yet support? | Vision-reality gap |
| Who has actually used this product, other than the founder and their team? | Real user validation |
| What is the single most important thing that needs to be true for this business to work? | Critical assumption |
| What would a well-resourced competitor need to build to make this irrelevant? | Competitive risk |
| What does the founder consistently avoid talking about when asked about the product? | The uncomfortable truth |
| What would need to change in the product for revenue to double in 12 months? | Growth constraint |
| What advice has the founder received that they have not acted on, and why? | Resistance mapping |

---

## 8. Digital Agency — Project Handover Documentation

**The situation**
You have built a product for a client. The project is complete, or moving to a maintenance phase. You need to hand over the codebase with documentation that the client's internal team — or the next agency — can work from. The documentation that exists is what the developers wrote during the build, which is accurate and completely useless to anyone who was not there.

**The blocker**
Handover documentation is always the last thing done and the first thing cut when a project runs over. It is written by developers for developers, in the final week when everyone is exhausted. It describes how the system works, not what it does or why.

**What the tool produces**
- A product-level description of each system component in language the client can read
- User flows documented from the code — not from memory or the original brief
- A dependency and integration map
- A non-functional requirements summary (performance, security, reliability)
- A forward roadmap section: what would need to happen next, and what it would involve

**Who reviews the output**
The client's internal team, their new internal CTO or technical lead, the maintenance team, the next agency.

**Tailored Q&A for this context**

| Question | What you're actually asking |
|----------|---------------------------|
| What does the client need to be able to do with this system without agency support? | Self-sufficiency requirements |
| What are the three things most likely to go wrong in the first six months post-handover? | Risk handover |
| What decisions were made during the build that the client needs to understand and own? | Architectural decisions requiring client awareness |
| What ongoing costs — hosting, licences, third-party services — does this system carry? | Total cost of ownership |
| What would the next phase of development require, in scope and cost terms? | Roadmap framing |
| What would the client need to do internally to maintain this system without us? | Capability requirements |
| What should the client's first technical hire understand about this system? | Onboarding brief |

---

**Local LLM is not a feature. In enterprise contexts it is a requirement.**

Every corporate use case above involves code that cannot leave the organisation's environment. Proprietary business logic. Customer data structures. Systems under regulatory oversight. Code subject to NDA.

RepoToPitch runs as a **Standalone Desktop Application**, which reinforces this privacy model and optimizes AI performance:
1. **Air-Gapped Ready**: The app requires no internet connection to function (assuming models are pre-loaded in Ollama).
2. **Native Sandboxing**: Analysis happens within a compiled Tauri binary, isolating your source code from the browser's potential vulnerabilities and enabling secure native filesystem access.
3. **High-Performance Scanning**: The Rust-powered backend indexes repositories with significantly lower latency than browser-based alternatives.
4. **Snow Premium UI**: Executive-level interface designed for deep strategic focus and professional reporting.

This is the definitive answer to the information security question. State it early. It removes the blocker before it appears.
