---
doc: checklist
status: approved
---

# Build Checklist

Build mode: learn

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

- [ ] Early usable behavior explored — after Slice 1; share learner feedback on the working simulated-arrival success path before Slice 2.
- [x] Final kick-the-tires exploration and feedback completed — after Slice 2; try another successful arrival, review failure/retry and duplicate-submission checks, and discuss findings before revisions.

## Final Review

- [ ] Final review complete — feedback resolved, required checks pass, and learner confirms the proof of concept is ready.

## Code Tour and App Map

- [x] Learning activity complete — guided route, focused alternative, prior practice connected, or brief recap.
- [ ] Optional edit and transfer reflection addressed — offered/declined/already covered/not applicable as appropriate.
- [x] `devpost/app-map.html` generated from finished code, checked, and shown, including a project-grounded practice to reuse.

Activity and evidence (learner-reported): Completed the focused alternative by tracing the store-before-display decision through `app.js` `recordArrival()` (lines 90–143) and the pending-write test in `tests/test.js` (lines 126–152). The test holds a controlled promise pending and checks that no arrival row or success message appears while pending, including after 400 ms; after acceptance, it checks that the row and success status appear. This supports store-before-display behavior in that tested scenario; it does not prove physical mail detection, real email delivery, persistent storage, or production readiness.
Route and stops: Learner reviewed `devpost/app-map.html` in the browser and checked its content and source references through Terminal. The map's source route is reference-only; no interactive tour is claimed.
Edit outcome: Not yet offered.
Reflection: Not yet offered.
Activity mode: Focused alternative.

## Revisions

- **Uncompleted slice commit checkpoints:** The required sequential commits, `Build simulated arrival success workflow` and `Add simulated arrival failure recovery`, were not created. Read-only inspection found an unborn `main` branch with no commits or Git objects, no tracked files, and no authentic Slice 1-only snapshot in the repository or conventional project-local backups checked. The current worktree contains the combined implementation, so assigning it to the Slice 1 commit or creating an empty Slice 2 commit would misrepresent the history. The required commit sequence was not completed.
- **Automated verification evidence (learner-reported):** The learner reports that `node --check app.js` and `node --check tests/test.js` passed, and that the normal browser harness reported five passing checks. The learner reports that these checks covered the existing workflow, including failure/retry behavior. These results were not independently executed during this update.
- **Hands-on review evidence (learner-reported):** The initial screen showed the test-only recipient identity, empty state, and available action with no arrival or success. The first arrival showed progress, disabled the button, and appeared with a timestamp and `TEST · SIMULATED` label without refresh. A second arrival appeared as a second row and the button became available again. In the test-only failure/retry walkthrough, the learner observed the retryable error, progress and disabled button during retry, and the accepted successful arrival; the learner found the failure/retry flow understandable. The learner reports six foreground-workflow checks passed. These observations were not independently repeated during this update.
- **Learning wrap-up evidence (learner-reported):** The learner reports reviewing `devpost/app-map.html` in the browser and checking its content and source references through Terminal. The learner also reports five passing browser-harness checks and passing syntax checks for both JavaScript files.
- **Remaining checks:** Slice 1 and Slice 2 remain unchecked because their required commit checkpoints were not completed; the missing authentic Slice 1 snapshot and Git history deviation remains in effect. The early usable-behavior checkpoint remains open. Final kick-the-tires exploration and feedback is recorded complete from the learner's report, but the final-review box remains open until the learner explicitly confirms the proof of concept is ready. The optional-edit/transfer reflection remains unaddressed.
- **Status:** No slice commit checkpoint was completed. This record documents the deviation; it does not satisfy the Pack’s commit requirements or authorize marking slices complete or starting `6-ship`.
