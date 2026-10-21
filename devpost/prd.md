---
doc: prd
status: approved
---

# Track My Mailbox (TMM_mvp) — Product Requirements

A focused proof of concept that helps a person in shared housing see a recipient-specific simulated mail-arrival event and an honest in-app confirmation.
Source: `scope.md > The Unique Kernel`, `scope.md > Who It's For`.

The public-facing project name is **Track My Mailbox**. This submission candidate is Version 2, **TMM_mvp**; the earlier TMM prototype is discontinued and is not part of this implementation. See `scope.md > Project Evolution` for the concise history.

## The Core Journey

1. **Open the app.** The one demo recipient sees TMM's purpose, a clear test-only demo-identity label, an empty recent-arrivals state, and one primary action: **Simulate Test Arrival**. No arrival or success message appears before an event has been recorded.
2. **Start a simulated arrival.** The demo recipient activates **Simulate Test Arrival**. The app visibly indicates that the attempt is in progress and prevents duplicate submissions until it finishes.
3. **See a successful result.** Only after the event is successfully recorded for the demo recipient, the recent-arrivals section displays the new entry with a timestamp and explicit test/simulated label. The list updates without a manual page refresh, and an in-app success confirmation says that the simulated arrival was recorded.
4. **Recover from a failed attempt.** If recording fails, no arrival entry is added and no success confirmation is shown. A clear, non-technical error appears on the same screen, such as “We couldn’t record this simulated arrival. Please try again.” The recipient can retry with the same action after the failed attempt ends. Keep the error visible until retry or another clear state change. A successful retry follows step 3.
5. **Understand the boundary.** The full demo proves the awareness workflow in one active session. It does not claim physical mail was detected, email was sent, or the demo identity provides production authentication or multi-user security.

Source: `scope.md > The Core Loop`, `scope.md > What "Working" Looks Like`, `scope.md > The POC Boundary`.

## Screens and Layout

### Home

The MVP has one minimal home screen and no additional navigation or dashboard surfaces. Keep this order and hierarchy:

- Short purpose statement explaining that TMM demonstrates awareness of a **simulated** mail arrival.
- Clearly visible identity label identifying the current user as a test-only demo recipient, not a production-authenticated user.
- Recent arrivals section. Before a successful event exists in the active session, show “No simulated arrivals yet” (or equivalent). After success, show the new recipient-associated event with timestamp and test/simulated label.
- One prominent, clearly labeled **Simulate Test Arrival** action.
- In-progress, success, or failure feedback in context on this screen.

Do not add sign-in, account management, extra dashboard panels, charts, unrelated cards, or roommate-oriented controls.

Source: `scope.md > The Core Loop`, `scope.md > The POC Boundary`.

## Look and Feel

This is a proposed visual direction for the MVP, not a finalized brand identity. No visual references or established brand system were supplied.

- Calm, trustworthy, practical, and approachable; a focused personal utility, not an AI dashboard or enterprise analytics product.
- Soft off-white or very light gray background, deep navy or charcoal text, and muted mailbox blue as the primary accent.
- Subtle green for confirmed success; restrained amber or neutral red for errors, with accessible contrast.
- Clean, readable sans-serif typography with clear hierarchy. Make the primary action and arrival status easy to scan; avoid decorative type and oversized marketing headings.
- Minimal screen, generous spacing, simple surfaces, restrained borders, and no unnecessary cards, charts, navigation, or decoration.
- Make loading, success, and failure states visually distinct. Keep text readable, controls clearly labeled and keyboard usable, and never rely on color alone to communicate status.

Source: learner-provided design direction; `scope.md > Inspiration & Identity`.

## Features and Behavior

### Single-Recipient Simulated Arrival

The demo has one clearly identified test-only recipient. The interface and every arrival-related item identify the activity as simulated/test data. Associate the event with that one demo recipient. The demo identity is a visible product label only; it does not promise authentication, privacy protection, or multi-user isolation.

The recipient can start one simulated-arrival attempt with **Simulate Test Arrival**. While the attempt is in progress, prevent duplicate submissions. A successful recording means the event has been accepted by the chosen storage mechanism during the active session; storage technology and implementation remain for the technical spec. Only after that operation completes successfully:

- Add the event to recent arrivals without a manual page refresh.
- Show its timestamp and explicit test/simulated label.
- Show an in-app success confirmation that the event was recorded.

If recording fails, show an understandable same-screen error, add no recent-arrival entry, and show no success. Once the failed attempt is over, make the same action available for retry. Keep the error visible until retry or another clear state change. A successful retry shows the normal successful result.

#### Acceptance Criteria

- [ ] One clearly identified, test-only demo recipient can trigger one simulated arrival.
- [ ] A successful event is associated with that demo recipient.
- [ ] The recent-arrivals view shows the new event with a timestamp and explicit test/simulated labeling without manual refresh.
- [ ] An in-app success confirmation appears only after successful recording completes.
- [ ] A failed recording creates no displayed arrival entry and no success confirmation.
- [ ] A failure produces a clear, non-technical message on the same screen, remains visible until retry or another clear state change, and allows retry after the attempt ends.
- [ ] Duplicate submissions are prevented while an attempt is in progress.
- [ ] The screen does not claim physical mail detection, actual email delivery, production authentication, or multi-user security.

### Verification Page (Test Only)

The separate test page presents **Milestone 1 — Arrival Recording** for automatic checks and **Milestone 2 — Failure & Retry** for the optional interactive walkthrough. The walkthrough deliberately rejects the first two test writes and waits for the participant to confirm the third through a test-only control. These are presentation labels for verification; they do not rename the original implementation slices or establish that separate slice commits were made. Walkthrough controls do not appear in the recipient-facing app.

Source: `scope.md > The Core Loop`, `scope.md > What "Working" Looks Like`, `scope.md > Version 2 Direction (Resolved in the PRD and Spec)`.

## States and Boundaries

- **First use / empty:** Show the purpose, demo-recipient label, “No simulated arrivals yet” (or equivalent), and primary action. Do not show an arrival or success.
- **Attempt in progress:** Make the attempt visibly in progress and prevent duplicate submissions.
- **Success:** After successful recording completes, add the labeled, timestamped event to recent arrivals, update the view without manual refresh, and show in-app confirmation.
- **Failure:** Show a clear same-screen error, no event row, and no success confirmation. The recipient can retry after the attempt ends.
- **Session persistence:** The full workflow is required within one active session. Persistence across a page refresh is not required unless the technical spec establishes that it is necessary and feasible before the project target deadline of October 22, 2026. Exact storage behavior is not decided here.
- **Identity and scope:** One test-only demo recipient and one simulated workflow. This does not represent production authentication or secure multi-user data isolation.
- **Truthful labeling:** Simulated/test events must never be presented as detected physical mail; no email-sent or email-delivered status exists in this MVP.

Source: `scope.md > The POC Boundary`, `scope.md > What the MVP Demonstrates and What Remains Unproven`, `scope.md > Explicitly Cut`.

## Product Decisions

- Keep the MVP to one test-only demo recipient and one simulated-arrival workflow, so the proof stays focused on recipient awareness.
- Use one home screen with a purpose statement, demo-identity label, recent-arrivals area, and a single primary action.
- Require an in-app success confirmation only after successful recording; failures add no arrival and show no success.
- Allow retry after failure, keep the error visible until retry or another clear state change, and block duplicate submissions during an attempt.
- Require the entire demonstration to work in one active session. Refresh persistence is not a product requirement; the technical spec may determine whether it is necessary and feasible before the project target deadline.
- Treat the supplied color, typography, layout, and accessibility guidance as a proposed direction for review, not finalized branding.
- Project target deadline: October 22, 2026. Keep the workflow the smallest testable end-to-end implementation.

## What We're Building

One screen for one clearly labeled test-only demo recipient to trigger one simulated arrival, see a timestamped and test-labeled event appear without refreshing after successful recording, receive an honest in-app confirmation, and recover from a failed attempt through a clear error and retry.

## Deferred From the POC

- Durable persistence across page refreshes, unless the technical spec shows it is necessary and feasible before the project target deadline of October 22, 2026; the required acceptance path is one active session.
- Production sign-in, password reset, account management, authentication, and multi-user access; the MVP uses one demo identity and does not make security claims.
- Actual email notifications or delivery confirmation; the approved scope excludes email services and credentials.
- Real mail detection, USPS integration, physical mailbox sensing, or claims that real mail was detected; the MVP only simulates an arrival.
- Household or roommate monitoring; it is outside the recipient-awareness goal.

## Possible Later Enhancements

- Investigate whether reliable real-mail detection is feasible, without assuming a particular API exists.
- If the concept proceeds beyond the MVP, investigate persistent storage and recipient-specific notifications alongside appropriate authentication and privacy safeguards.
- Reconsider email notifications, production authentication, or multi-user support only with a separate scope decision after the MVP.

## Non-Goals

- Detect or verify physical mail, access USPS data, or imply a mailbox is monitored.
- Send or claim delivery of email notifications.
- Provide production authentication, account management, privacy guarantees, or secure multi-user isolation.
- Track roommates or guests, attribute responsibility, or imply wrongdoing.
- Add unrelated dashboard features or infrastructure.

## Open Questions

- No unresolved product decision blocks the approved Version 2 MVP. The storage, persistence, and failure-display decisions were resolved in the approved technical spec.
- Universal physical-mail detection remains an open future feasibility dependency documented in `scope.md`; it is not an MVP requirement or a capability demonstrated by this PRD.
- The visual direction remains proposed guidance rather than a finalized brand identity.
