---
doc: scope
status: approved
---

# Track My Mailbox (TMM_mvp)

A small proof of concept for recipient-specific awareness of a simulated mail arrival in shared housing.

## The Unique Kernel
Proactive, recipient-specific awareness: instead of repeatedly checking a shared mailbox or relying on a roommate to report an arrival, the intended recipient sees a clearly labeled arrival record and immediate in-app confirmation. The demo proves that awareness workflow, not that physical mail was detected.

## Who It's For
A person living in a shared rental home or apartment, especially where roommates or guests may change and have access to a shared mailbox. They are waiting for mail addressed to them and today may check the mailbox themselves or depend on someone else to tell them whether mail arrived.

## The Core Loop
In one active session, the one demo recipient triggers a simulated arrival. TMM records the event for that recipient, adds a timestamped test-labeled entry to recent arrivals without a manual page refresh, and shows an in-app success confirmation only after successful recording. If recording fails, the app reports the failure and does not show success. Durable storage across page refreshes is not part of the required workflow.

## Inspiration & Identity
The idea is grounded in the learner's own experience with uncertainty about mail arrival in shared housing. No visual references, aesthetic direction, or brand treatment have been established; visual choices remain open for the PRD.

## Why This Matters to the Learner
The learner experienced uncertainty about whether mail had arrived in shared housing. TMM is intended to reduce that uncertainty without monitoring roommates or implying that anyone took or mishandled mail.

## Core Hypothesis
If the intended recipient can see a recent, clearly labeled arrival record and an immediate confirmation when an arrival is recorded, a recipient-specific awareness workflow may reduce uncertainty and delay in shared housing. This is a hypothesis; the simulated MVP will not establish real-world behavior change.

## What "Working" Looks Like
The end-to-end workflow completes in one active session and meets all of these checks:
1. One clearly identified, test-only demo recipient triggers one simulated arrival.
2. The arrival is successfully recorded and associated with that demo recipient.
3. The recent-arrivals view displays the new entry with a timestamp and explicit test/simulated label without a manual page refresh.
4. An in-app success confirmation appears only after successful recording.
5. If recording fails, the app displays an understandable failure message and does not report success.
6. The demo does not claim to detect physical mail or provide production authentication or multi-user security.

For these criteria, **successfully recorded** means that the chosen storage mechanism accepts the event during the active session. The UI displays success only after that operation completes successfully. The storage technology and implementation details remain for the technical spec.

The required demo proves this workflow within one active session. It does not require the event to survive a page refresh unless the technical spec establishes that persistence is necessary and feasible before October 22, 2026.

## The POC Boundary
**Target: October 22, 2026. In for the MVP:**
- One test-only demo recipient, clearly labeled in the interface.
- One simulated-arrival workflow associated with that recipient.
- A timestamped, explicitly simulated/test-labeled recent-arrival entry.
- An in-app confirmation after a successful record, with an understandable failure state.
- A small, testable end-to-end demo of recipient awareness.

The identity label and recipient association are demo behavior only. They do not provide production authentication, privacy, or multi-user data isolation.

## Proposed Technical Direction (Tentative)
Keep implementation to the smallest testable end-to-end workflow in one active session: trigger one simulated event for the fixed demo recipient, record its recipient association, timestamp, and test marker, then update recent arrivals without a manual refresh and show success only after recording succeeds. Keep failures visible. The workspace is fresh and has no existing application architecture or authentication to reuse. Choose the smallest suitable event-storage approach in the technical spec; this scope does not select a database. Durable storage across refreshes is optional unless the spec shows it is necessary and feasible before October 22, 2026. Use no external mail-detection or email service and add no unnecessary infrastructure.

## What the MVP Demonstrates and What Remains Unproven
**Demonstrates:** the recipient can trigger a simulated arrival and receive an immediate, recipient-scoped in-app record and confirmation, including an honest failure state.

**Does not demonstrate:** physical mailbox sensing, USPS data access, reliable identification of actual delivered mail, actual email delivery, production authentication, or production-grade multi-user isolation. It also does not establish that the workflow changes when or whether someone retrieves real mail.

## Later
- Explore whether reliable real-mail detection is feasible and what sources or mechanisms could support it; no API is assumed to exist.
- Consider actual email notifications or production authentication only after the MVP and with a separate scope decision.
- Consider multi-user support only if later evidence justifies it.

### Open Feasibility Dependency: Universal USPS Mail Detection

**Target outcome:** Notify the intended recipient when USPS physically delivers ordinary letters, flats, or tracked packages addressed to their name, without mailbox hardware or dependence on USPS Informed Delivery.

**Status:** Open — authorized data access and coverage not yet validated.

**Current limitations:**

- The existing TMM workflow uses simulated arrivals; it does not detect physical mail.
- Package tracking cannot establish universal coverage of ordinary, untracked letters and flats.
- No publicly documented, authorized USPS data feed has yet been verified to provide universal, recipient-specific physical delivery events to TMM.

**Constraints:**

- Do not modify the current application code as part of this feasibility phase.
- Do not scrape private USPS accounts or assume access to internal USPS delivery records.
- Do not add scanners, cameras, sensors, or other mailbox hardware.
- Do not represent simulated arrivals, mail previews, or package-only tracking as fulfillment of the universal detection requirement.

**Next action:** Seek confirmation from USPS through official channels regarding approved third-party access to recipient-authorized delivery events, including mail-type coverage, recipient matching, event timing, eligibility, and access requirements.

**Exit criterion:** Keep this dependency open until a legitimate data source and its coverage are verified. Reassess the technical approach only after that evidence is available.

## Explicitly Cut
- Real USPS integration or claims of USPS data access: the MVP uses simulated arrivals and no integration is established.
- Physical mailbox detection or claims that real mail was detected: simulation cannot prove this.
- Email sending, email-provider integrations, credentials, and external email-service calls: excluded from this MVP and unnecessary to demonstrate the in-app workflow.
- Full sign-up, password reset, account management, and production authentication: beyond one test-only demo identity.
- Multi-user support or claims of secure isolation: a single demo identity is not a security boundary.
- Monitoring, tracking, or accusing roommates or guests: contrary to the intended recipient-awareness purpose.

## Assumptions and Risks
- **Assumption:** one fixed demo recipient and simulated event are enough to show the core recipient-awareness workflow.
- **Assumption:** an in-app confirmation is the notification proof needed for this MVP; email is not required.
- **Assumption:** one active session is sufficient for the demo; durable storage across page refreshes is not necessary to prove the required workflow.
- **Risk:** the test identity can be mistaken for real authentication or privacy protection unless the interface labels it clearly.
- **Risk:** simulated events can be mistaken for detected mail unless every event is visibly labeled as test/simulated.
- **Risk:** choosing an event-storage approach or adding infrastructure beyond the workflow could threaten the October 22, 2026 target; the spec should keep the implementation minimal.
- **Unresolved:** exact storage/persistence behavior and the UI details of triggering a simulated arrival belong in the technical spec and PRD, respectively.
