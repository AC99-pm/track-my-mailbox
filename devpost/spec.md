---
doc: spec
status: approved
---

# Track My Mailbox (TMM_mvp) — Technical Spec

## How This Works, In Plain Language

TMM will be a small web page made with the browser's built-in HTML, CSS, and JavaScript. There is no server, database, sign-in, package dependency, or outside service. JavaScript keeps the current session's simulated arrivals in memory, like a short-lived list held by the open page.

When the recipient presses **Simulate Test Arrival**, the page creates a test event for the one fixed demo-recipient ID and asks the in-memory store to accept it. The page adds the event to the visible list and shows success only after the store accepts it. If the store rejects it, the list stays as it was, the page shows a retryable error that remains until retry begins, and the action becomes available again. After success, the action also remains available for another arrival; duplicate submissions are blocked only while an attempt is active. A small browser-based test page will pass in a fake store that rejects or delays a write; that test mechanism is not shown in the product screen.

This is the smallest approach that demonstrates the approved workflow in one active session. Its trade-off is that reloading or closing the page clears the events. The approved PRD does not require refresh persistence.

## The Core Journey Through the System

Implements `prd.md > The Core Journey` and `prd.md > Features and Behavior > Single-Recipient Simulated Arrival`.

1. The browser opens `index.html` and JavaScript initializes an empty in-memory event list for the fixed demo recipient.
2. The recipient selects **Simulate Test Arrival**. Before yielding control, the event handler sets the in-progress guard, disables the button, and renders progress feedback. It creates an event with an ID, the fixed recipient ID, the current timestamp, and a simulated/test marker. Keep the busy state active for at least 400 ms measured from the start of the action.
3. Two successive `requestAnimationFrame` callbacks provide a best-effort opportunity for the browser to render progress before the store call; they do not guarantee a visible paint. Verify the visible in-progress state in a foreground browser during the manual smoke check. The in-progress guard stays active throughout this yield, so another activation is ignored. Only then does the handler call the store; do not wait for the 400 ms minimum before starting the write.
4. The in-memory store accepts the event and resolves its recording operation. Only after acceptance and after at least 400 ms have elapsed from the start of the action does the handler read the recipient's recent events, update the page, and show the in-app success confirmation. If the store takes longer than 400 ms, show the result immediately after acceptance without adding further delay. The action becomes available again after success, allowing another separate arrival attempt.
5. If recording rejects or throws before acceptance, the handler leaves the recent-arrivals view unchanged, shows the PRD's clear retryable error, shows no success, and re-enables the action after the attempt ends. Keep the error visible until the recipient starts a retry; starting that attempt clears the prior error as progress is shown.
6. A retry or a new attempt after success follows the same steps. A page reload starts a new empty session because the store exists only in memory.

## Stack

- **HTML, CSS, and browser JavaScript:** Use the browser platform directly with classic scripts (no module imports), so the app and its test page can be opened locally without a server or dependency installation. The learner approved this approach. Trade-off: it intentionally avoids framework conventions and persistence in favor of a small, transparent proof of concept.
- **Dependencies:** None beyond a modern browser. No package manager, external library, database, backend, or network API is part of the MVP.
- **Target:** October 22, 2026 is the project target deadline, not a Build With AI Pack requirement.

Reference documentation: [HTML](https://developer.mozilla.org/en-US/docs/Web/HTML), [CSS](https://developer.mozilla.org/en-US/docs/Web/CSS), and [JavaScript](https://developer.mozilla.org/en-US/docs/Web/JavaScript).

## Where It Runs and How Someone Tries It

Run locally in a desktop browser on the learner's computer; deployment is not part of this architecture. No credentials, environment variables, account, or network connection are needed.

- From the project root on macOS, run `open index.html` to open the demo in the default browser. The first screen should show the test-only recipient label, an empty recent-arrivals state, and **Simulate Test Arrival**.
- Run `open tests/test.html` to open the browser-based test harness. It reports pass/fail results for the success, rejected-write, and duplicate-submission checks without adding a test control to the demo screen.
- The demo and test pages use only local HTML, CSS, and classic JavaScript files. They do not fetch resources or call external services.
- For `6-ship`, the Pack says submission requires a short demo video and a public GitHub repository. This local app can be recorded; deployment is optional and does not replace either submission item.

## Look and Feel

Implements `prd.md > Look and Feel` and carries forward `scope.md > Inspiration & Identity`. These remain proposed visual choices, not an approved brand system.

Use a soft off-white or very light gray page, deep navy or charcoal text, and muted mailbox blue for the primary action. Use a subtle green for success and restrained amber or neutral red for failure, always with readable contrast and text labels. Use a clean sans-serif font, clear type hierarchy, generous spacing, simple surfaces, and restrained borders. Keep the one-screen layout focused on purpose, test identity, recent arrivals, and the action. Use semantic HTML, keyboard-operable controls, and a text status region so loading, success, and failure are understandable without color.

## Components

### Home Page (`index.html`)

Provides the single-screen purpose statement, test-only identity label, recent-arrivals region, primary action, and in-context status. It contains no sign-in, navigation, or unrelated dashboard features.

Implements `prd.md > Screens and Layout > Home`.

### In-Memory Arrival Store (`app.js`)

Owns an array of events for the active page session and exposes a small `record(event)` operation plus a recipient-filtered read. `record` adds an event to memory and resolves only after acceptance. It does not write to browser storage or a remote system.

Implements `prd.md > Features and Behavior > Single-Recipient Simulated Arrival` and `prd.md > States and Boundaries`.

### Arrival Workflow and View Updates (`app.js`)

Handles button submission, event creation, busy state, duplicate prevention, store call, recent-arrivals rendering, success confirmation, and failure/retry messaging. Set the busy flag synchronously before yielding control, render progress, and retain the guard through the two-frame render opportunity, the store operation, and any remaining time needed to reach the 400 ms minimum busy duration. Start the store after the two-frame opportunity without waiting for 400 ms. On acceptance, read and render recent events and show success only after both the store has resolved and 400 ms have elapsed since the action began; if acceptance takes at least 400 ms, add no delay. On rejection, keep the existing list unchanged and show no success; keep the error visible until retry begins. Re-enable the action after either completion so a later attempt can be made.

Implements `prd.md > The Core Journey`, `prd.md > Features and Behavior > Single-Recipient Simulated Arrival`, and `prd.md > States and Boundaries`.

### Proposed Visual Styling (`styles.css`)

Applies the proposed palette, typography, spacing, borders, and visibly distinct text-backed progress/success/failure states. It does not introduce a separate brand identity.

Implements `prd.md > Look and Feel`.

### Test Harness (`tests/test.html`, `tests/test.js`)

Runs browser-native checks against the same arrival workflow using injected fake stores. `app.js` provides the workflow with an injectable store seam for this harness; a fake rejecting store and a controllably delayed store exist only in the test harness. There is no user-facing failure toggle or test mode in the demo.

Verifies `prd.md > Features and Behavior > Single-Recipient Simulated Arrival` and its acceptance criteria.

## Data Model

The only identity is a fixed constant, `demo-recipient-001`, with a matching visible label such as “Test-only demo recipient.” It is a demo association, not authentication or an authorization boundary.

Each accepted arrival has this in-memory shape:

```text
{
  id: unique event identifier,
  recipientId: "demo-recipient-001",
  occurredAt: ISO 8601 timestamp,
  isSimulated: true
}
```

The timestamp is created when the recipient starts the attempt and displayed in a readable local format. The explicit simulated marker drives a visible “Simulated test arrival” label. The in-memory array is the source used to render recent arrivals. A successful write appends to the array before resolving; the view reads from it after resolution. A rejected write must not append an event. All data is cleared when the page is reloaded or closed. No data is written to `localStorage`, `sessionStorage`, a file, or a service.

## Minimum Test Strategy

Run the browser-native harness with `open tests/test.html`; it has no external test dependency. The harness calls the same workflow used by the demo and injects controlled stores:

1. **Success, minimum busy duration, and store-before-display ordering:** With an immediately accepting store, verify progress remains active for at least 400 ms from action start and that the store call begins without waiting for that duration; show neither the success confirmation nor the new arrival row until the store accepts and 400 ms have elapsed. With a controllable slower pending write, verify neither success nor the new row appears while pending; resolve acceptance after 400 ms and verify both appear immediately after acceptance, with no added delay. In each case verify exactly one recent-arrivals row has the fixed recipient ID, a parseable timestamp, and the simulated marker/label, alongside the in-app success message without manual reload.
2. **Rejected recording and retry:** Start with an existing list (or empty state), use a store that rejects before accepting the new event, and verify the list remains unchanged, no success appears, and the clear error stays visible after the action is re-enabled. Verify it remains until retry begins; begin a retry and confirm the error clears as progress appears. Then accept the retry and verify the event and success appear.
3. **Duplicate submission:** Hold the fake store's first write pending, activate the action again before releasing it, and verify the store receives one write only and the action remains disabled. Release the write and verify one event appears. After success, verify the action is available for a separate subsequent attempt.

These checks cover workflow state and rendering in the local test page. A final manual smoke check is to open `index.html`, confirm the initial empty/test identity screen, and trigger one successful simulated arrival.

## File Structure

Planned project files; this spec is the only artifact being created in this phase.

```text
TMM_mvp/
├── index.html                 # Single-screen local demo
├── styles.css                 # Proposed accessible visual direction
├── app.js                     # Fixed demo identity, in-memory store, workflow, and rendering
├── tests/
│   ├── test.html              # Local test-harness page, separate from product UI
│   └── test.js                # Success, rejection/retry, and duplicate-submit checks
└── devpost/
    ├── learner-profile.md     # Existing learner context
    ├── scope.md               # Existing approved product boundary
    ├── prd.md                 # Existing approved behavior
    └── spec.md                # This technical blueprint
```

## External Services and Dependencies

None. The app uses only local files and built-in browser capabilities. It has no external API calls, database, hosting dependency, credentials, or environment configuration.

## Important Failure Modes

- **Store rejects or throws before accepting an event** → keep the visible recent-arrivals list unchanged, show “We couldn’t record this simulated arrival. Please try again.”, show no success, and make the same action available after the attempt ends. Keep the error visible until the recipient starts a retry; clear it when the retry enters its in-progress state.
- **A second activation arrives while recording is pending** → ignore it and keep the action visibly disabled until the first attempt finishes.
- **Page reload or close** → the in-memory list is cleared and the initial empty state returns. This is expected for the MVP, not a recovery claim.

## What Was Simplified and Why

- **One fixed demo identity** instead of sign-up, passwords, or account management — only one recipient's awareness workflow is in the approved proof of concept. It provides no production authentication or multi-user isolation.
- **In-memory event list** instead of a database or browser persistence — the required journey is one active session, so a durable storage system would add setup without proving more of the approved workflow. The accepted trade-off is loss of events on refresh.
- **In-app result** instead of email, push, real-mail detection, or a remote integration — only the simulated recipient-awareness workflow is in scope.
- **Browser test harness with injected fake stores** instead of an external test dependency — it exercises rejection and delayed writes without adding product controls or installing packages.

## Decisions and Open Issues

- **Learner-approved:** Use plain HTML, CSS, and JavaScript with in-memory storage for one active session. This has no framework setup and satisfies the session-only proof; accepted trade-off: events disappear on refresh.
- **Learner-approved behavior:** Associate events with one test-only demo recipient and show timestamped, clearly simulated data only after the in-memory store accepts the event.
- **Scope interpretation:** The approved scope and PRD describe one simulated-arrival workflow and a singular proof event, but do not set a one-success-per-session limit. Keep the action available after success so the same recipient can record another simulated event; prevent duplicates only while an attempt is active.
- **Derived implementation detail:** Use the fixed internal ID `demo-recipient-001`; it is a stable label for the single demo identity, not a security mechanism.
- **Derived implementation detail:** Keep the duplicate guard in the submit handler before any yield, allow one browser render opportunity via two animation-frame callbacks before starting the write, and make `record` the single acceptance boundary. Keep progress active for a minimum of 400 ms from action start without delaying the store call; render the new row and success only after that call resolves and the minimum has elapsed, whichever is later.
- **Useful uncertainty clarified:** An in-memory write ordinarily has few natural rejection cases. The learner requested deterministic failure coverage; a fake store injected by the separate test harness can reject a write without adding a failure control to the recipient-facing screen.
- **Open issue for build verification:** Confirm the chosen local browser can open the HTML files and run classic local scripts as expected. No dependency or external service is required; if browser restrictions interfere, resolve that within the same local-only architecture before adding tools.
- **Persistence decision:** Refresh persistence is unnecessary for the approved MVP and will not be implemented. This follows `scope.md > The Core Loop` and `prd.md > States and Boundaries`.
