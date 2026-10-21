---
doc: checklist
status: approved
---

# Build Checklist

Build mode: learn

## Project Evolution: TMM (Version 1) → TMM_mvp (Version 2)

The participant reports that the original **TMM (Version 1)** was a more technically ambitious prototype developed before they recognized that the Devpost Learn Skill Pack was required from the beginning of the challenge workflow. Version 1 explored Next.js, React, Supabase, and related services; this record does not claim that those services were fully integrated or that Version 1 detected physical mail. The participant discontinued Version 1 as the submission candidate and restarted as **TMM_mvp (Version 2)** using the Pack's learning-oriented workflow to reduce complexity and focus on a testable recipient-awareness experience within the available timeframe. Only Version 2 is intended for submission; the public-facing project name may remain **Track My Mailbox**. This account records participant-reported project history and does not establish official eligibility or full Pack compliance.

| Category | Version 1 — TMM | Version 2 — TMM_mvp |
|---|---|---|
| Status | Discontinued prototype; not the current submission candidate | Current submission candidate |
| Approach | More technically ambitious prototype | Beginner-friendly, browser-based proof of concept |
| Technology | Next.js, React, Supabase, and related services were explored; operational integration is not asserted | Plain HTML, CSS, and JavaScript; Python 3 may support local development automation but is not part of the browser runtime |
| Arrival workflow | More ambitious integration concept; no verified physical-mail detection claim | Simulated arrival recording, confirmation, and test-only failure recovery |
| Data storage | Backend-oriented approach was explored; a working persistent store is not asserted | In-memory state for one active session |
| External integrations | Related services were explored; working external integrations are not established here | No external operational integrations |
| Verification | Earlier prototype verification is not used as evidence for Version 2 | Five automatic checks plus an optional interactive retry walkthrough; current manual review is learner-reported |
| Submission | Discontinued as the current submission candidate | Only version intended for submission |
| Future direction | Development as the submission candidate discontinued | Potential starting point for future investigation; no future feature is promised |

Version 2 deliberately excludes physical mailbox monitoring, automatic real-mail detection, USPS integration, persistent databases, real email or push notifications, production authentication, and production multi-user workflows. These are scope decisions, not implemented features.

## Slices

- [ ] **1. Core simulated-arrival workflow and success ordering**
  Becomes usable: A local browser app identifies the fixed test-only demo recipient, shows the honest empty state and primary action, records timestamped and explicitly simulated/test-labeled arrivals in the in-memory store for that recipient, and displays a new arrival and success confirmation only after the store accepts the write. Data is limited to the active session.
  Why now: Bootstrap belongs inside the first usable increment, and this slice proves the approved recipient-awareness workflow end to end before adding failure recovery.
  PRD ref: `prd.md > The Core Journey`; `prd.md > Screens and Layout > Home`; `prd.md > Features and Behavior > Single-Recipient Simulated Arrival` (including Acceptance Criteria); `prd.md > States and Boundaries`; `prd.md > Look and Feel`.
  Spec ref: `spec.md > The Core Journey Through the System`; `spec.md > Where It Runs and How Someone Tries It`; `spec.md > Look and Feel`; `spec.md > Components > Home Page`; `spec.md > Components > In-Memory Arrival Store`; `spec.md > Components > Arrival Workflow and View Updates`; `spec.md > Components > Proposed Visual Styling`; `spec.md > Components > Test Harness`; `spec.md > Data Model`; `spec.md > Minimum Test Strategy`.
  Build: Bootstrap the minimal plain HTML/CSS/JavaScript app and browser test harness required by the approved spec. Implement the fixed `demo-recipient-001` test-only identity, honest empty state, and “Simulate Test Arrival” action. Record an event with a timestamp and clear simulated/test label in the in-memory store, associated with that recipient. Set the duplicate-submission guard before yielding control, render progress using the spec's two-frame best-effort opportunity, and start the store without waiting for the 400 ms minimum busy duration. Keep progress active for at least 400 ms from action start; add the event to recent arrivals and show success only after store acceptance and the minimum duration have both completed. Do not imply that the browser is guaranteed to visibly paint progress before the write.
  Verify (mechanical): Open `tests/test.html` from the project root. With an immediately accepting store, verify the store call is not delayed until 400 ms, progress remains active for at least 400 ms from action start, and neither the new row nor success appears until both acceptance and the minimum duration. With a slower pending write, verify neither the new row nor success appears while pending; when acceptance occurs after 400 ms, verify both appear without extra delay. Verify the event has the fixed recipient association, timestamp, and simulated/test label. Open `index.html` in a foreground browser and perform the spec's manual smoke check: verify the in-progress state is visibly rendered before the result, the empty state is truthful before recording, and no manual refresh is needed to see the accepted event. Do not report the progress smoke check as passed if progress is not visibly rendered.
  Learner check: Use the local app to trigger an arrival. Confirm the demo identity, progress, timestamped simulated/test entry, and success message match the approved workflow. Share any behavior that differs from expectations before Slice 2.
  Commit: `Build simulated arrival success workflow` (after mechanical verification and learner check pass).

- [ ] **2. Failure recovery and reliability**
  Becomes usable: A rejected recording leaves recent arrivals unchanged, shows an understandable retryable error without false success, and allows retry; the action is available after success and failure, while overlapping submissions are prevented during a pending attempt.
  Why now: Once the successful end-to-end path works, this slice verifies the approved failure and retry behavior without adding infrastructure or product features.
  PRD ref: `prd.md > The Core Journey`; `prd.md > Features and Behavior > Single-Recipient Simulated Arrival` (including Acceptance Criteria); `prd.md > States and Boundaries`.
  Spec ref: `spec.md > The Core Journey Through the System`; `spec.md > Components > Arrival Workflow and View Updates`; `spec.md > Components > Test Harness`; `spec.md > Minimum Test Strategy`; `spec.md > Important Failure Modes`.
  Build: Add a rejected-write mechanism to the test harness or injected test store only; do not expose a failure control in the product UI. Handle store rejection so the arrival list stays unchanged, no success appears, and the clear error remains visible until retry begins. Restore the action after failure; keep it available after success as well. Preserve and verify the guard against duplicate submissions while a write is pending.
  Verify (mechanical): Open `tests/test.html` and verify: a rejected write does not add an arrival or show success; the error remains visible until retry begins; a successful retry adds the timestamped, labeled event and success confirmation; the action is available after both success and failure; and a second activation during a pending write does not create an overlapping write. Run the Pack-required mechanical checks and repeat the foreground-browser progress smoke check from Slice 1. If the two-frame opportunity does not visibly render progress in the foreground browser, do not claim the smoke check passed.
  Learner check: In the test harness, exercise failure followed by retry and review the pending duplicate-submission result. In the app, trigger another arrival after a successful one and confirm the action remains available. Report whether failure, retry, and the final success are understandable.
  Commit: `Add simulated arrival failure recovery` (after mechanical verification and learner check pass).

## Hands-on Checkpoints

- [x] Early usable behavior explored — after Slice 1; the learner reported the simulated-arrival success path and shared feedback before Slice 2.
- [x] Final kick-the-tires exploration and feedback completed — after Slice 2; try another successful arrival, review failure/retry and duplicate-submission checks, and discuss findings before revisions.

## Final Review

- [x] Final review complete — feedback resolved, required checks pass, and learner confirms the proof of concept is ready. The learner explicitly confirmed Version 2 is ready to proceed to submission preparation under the manager-authorized exception.

## Code Tour and App Map

- [x] Learning activity complete — guided route, focused alternative, prior practice connected, or brief recap.
- [x] Optional edit and transfer reflection addressed — learner-approved reflection recorded in the ignored learner profile.
- [x] `devpost/app-map.html` generated from finished code, checked, and shown, including a project-grounded practice to reuse.

Activity and evidence (learner-reported): Completed the focused alternative by tracing the store-before-display decision through `app.js` `recordArrival()` (lines 90–143) and the pending-write test in `tests/test.js` (lines 406–425). The test holds a controlled promise pending and checks that no arrival row or success message appears while pending, including after 400 ms; after acceptance, it checks that the row and success status appear. This supports store-before-display behavior in that tested scenario; it does not prove physical mail detection, real email delivery, persistent storage, or production readiness.
Route and stops: Learner reviewed `devpost/app-map.html` in the browser and checked its content and source references through Terminal. The map's source route is reference-only; no interactive tour is claimed.
Edit outcome: Optional edit has not been offered; no edit outcome is claimed.
Reflection (learner-approved): Recorded in the ignored `devpost/learner-profile.md`; personal reflection text is kept out of this public checklist.
Activity mode: Focused alternative.

## Revisions

- **Uncompleted slice commit checkpoints:** The required sequential commits, `Build simulated arrival success workflow` and `Add simulated arrival failure recovery`, were not created. At the initial slice-checkpoint review, `main` was unborn with no commits or Git objects and no tracked files; no authentic Slice 1-only snapshot was found in the repository or conventional project-local backups checked. A single baseline commit, `1898ca313b52cb93621e5018147de19a458093b1`, was created later from the combined implementation. It preserves a baseline but does not recreate either slice checkpoint. The current worktree still contains combined Slice 1 and Slice 2 changes, so assigning it to either sequential checkpoint or creating an empty slice commit would misrepresent the history. The required commit sequence remains incomplete.
- **Manager-authorized exception (learner-provided):** In response to the learner's recovery inquiry, the Learn Skill Pack manager wrote: “This is totally fine! You don't need to recover anything and can push and submit as is. Thanks!” This authorizes proceeding toward publication and submission without reconstructing the missing sequential slice commits. The authorization is recorded as learner-provided, not independently authenticated. It does not create the commits or complete either original slice checkpoint; both remain unchecked and the historical deviation above remains in effect.
- **Build and presentation terminology:** The approved checklist retains its original implementation slices: **1. Core simulated-arrival workflow and success ordering** and **2. Failure recovery and reliability**. The verification page presents **Milestone 1 — Arrival Recording** (automatic verification) and **Milestone 2 — Failure & Retry** (interactive walkthrough) for clearer stakeholder-facing labels. These presentation labels do not rename the implementation slices or establish that the required sequential slice commits exist.
- **Automated verification evidence (learner-reported):** The learner reports that `node --check app.js` and `node --check tests/test.js` passed, and that the normal browser harness reported five passing checks. The learner reports that these checks covered the existing workflow, including failure/retry behavior. These results were not independently executed during this update.
- **Hands-on review evidence (learner-reported):** Before Slice 2, the learner reported the initial screen with the test-only recipient identity, empty state, and available action, then a first arrival with visible progress, a temporarily disabled button, and a timestamped `TEST · SIMULATED` row without refresh. This supports the checked early usable-behavior checkpoint. In the later hands-on review, a second arrival appeared and the button became available again; the learner also observed the retryable error, progress and disabled button during retry, and the accepted successful arrival, and found the failure/retry flow understandable. The learner reports six foreground-workflow checks passed. These observations were not independently repeated during this update.
- **Milestone review (learner-reported):** The participant reports manually reviewing the current Version 2 interface and both verification milestones. This update did not independently rerun browser checks.
- **Learning wrap-up evidence (learner-reported):** The learner reports reviewing `devpost/app-map.html` in the browser and checking its content and source references through Terminal. The learner also reports five passing browser-harness checks and passing syntax checks for both JavaScript files.
- **Submission evidence still needed:** The Pack requires a short demo video and a public GitHub repository. Local configuration points to the dedicated TMM `origin` and the baseline tracks `origin/main`, but this record does not independently verify public visibility or a publicly accessible URL. No video link or completed Devpost form/exit survey is recorded here. The learner must complete the actual submission fields and exit-survey questions; constraints not documented in the local Pack are not guessed.
- **Remaining checks:** Slice 1 and Slice 2 remain unchecked because their required commit checkpoints were not completed; the missing authentic Slice 1 snapshot and Git history deviation remains in effect under the manager-authorized exception above. The early usable-behavior checkpoint and final kick-the-tires exploration are recorded complete from learner-reported observations. The final-review box is complete following the learner's explicit readiness confirmation. The optional transfer reflection is recorded in the ignored learner profile; the optional edit was not offered. The Pack's `6-ship` workflow has not been completed.
- **Status:** The baseline commit does not satisfy the original slice commit requirements. This record preserves the deviation and outstanding submission evidence; it does not claim all Pack requirements are complete or that Devpost submission has occurred.
