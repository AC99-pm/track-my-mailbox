(function () {
  "use strict";

  const results = document.querySelector("[data-results]");
  const fixture = document.querySelector("[data-fixture]");
  const walkthroughMode = new URLSearchParams(window.location.search).get("walkthrough") === "failure-retry";
  const walkthroughTimeoutMs = 60000;
  let walkthroughPrompt;
  let acceptControlledWriteButton;

  function setupWalkthrough() {
    if (!walkthroughMode) return;

    const panel = document.createElement("section");
    panel.className = "arrivals";
    panel.setAttribute("aria-label", "Test-only failure and retry walkthrough");

    const heading = document.createElement("h2");
    heading.textContent = "Test-only failure and retry walkthrough";
    walkthroughPrompt = document.createElement("p");
    walkthroughPrompt.setAttribute("role", "status");
    walkthroughPrompt.setAttribute("aria-live", "polite");

    acceptControlledWriteButton = document.createElement("button");
    acceptControlledWriteButton.className = "primary-action";
    acceptControlledWriteButton.type = "button";
    acceptControlledWriteButton.textContent = "Accept controlled write (test only)";
    acceptControlledWriteButton.hidden = true;

    const reloadLink = document.createElement("a");
    reloadLink.href = `${window.location.pathname}?walkthrough=failure-retry`;
    reloadLink.textContent = "Reload walkthrough";

    panel.append(heading, walkthroughPrompt, acceptControlledWriteButton, reloadLink);
    results.parentElement.parentElement.insertBefore(panel, results.parentElement);
  }

  function waitForUserClick(element) {
    return new Promise((resolve) => {
      const timeoutId = window.setTimeout(() => {
        element.removeEventListener("click", onClick);
        resolve(false);
      }, walkthroughTimeoutMs);

      function onClick() {
        window.clearTimeout(timeoutId);
        resolve(true);
      }

      element.addEventListener("click", onClick, { once: true });
    });
  }

  function walkthroughTimeout() {
    const error = new Error("Walkthrough paused after 60 seconds without a required click.");
    error.name = "WalkthroughTimeout";
    return error;
  }

  setupWalkthrough();

  function createIsolatedFixture() {
    const isolatedFixture = fixture.cloneNode(true);
    fixture.parentElement.append(isolatedFixture);
    return isolatedFixture;
  }

  function assert(condition, message) {
    if (!condition) throw new Error(message);
  }

  function report(message) {
    const row = document.createElement("li");
    row.className = "arrival-row";
    row.textContent = `PASS — ${message}`;
    row.style.color = "#215b36";
    results.append(row);
  }

  function deferred() {
    let resolve;
    const promise = new Promise((done) => { resolve = done; });
    return { promise, resolve };
  }

  async function run() {
    const writeStarted = deferred();
    const acceptWrite = deferred();
    const records = [];
    const events = [];
    let elapsed = 0;
    let minimumWaitCalls = 0;
    const controlledStore = {
      record(event) {
        records.push(event);
        writeStarted.resolve();
        return acceptWrite.promise.then(() => {
          events.push(event);
          return event;
        });
      },
      listFor(recipientId) {
        return events.filter((event) => event.recipientId === recipientId);
      }
    };

    const scenarioFixture = createIsolatedFixture();
    const app = TMM.mount(scenarioFixture, {
      store: controlledStore,
      now: () => elapsed,
      wait(duration) {
        minimumWaitCalls += 1;
        elapsed += duration;
        return Promise.resolve();
      }
    });
    const button = scenarioFixture.querySelector("[data-simulate]");
    const list = scenarioFixture.querySelector("[data-arrivals]");
    const status = scenarioFixture.querySelector("[data-status]");
    const attempt = app.recordArrival();
    assert(button.disabled, "The duplicate guard is active before the first asynchronous yield.");
    assert(status.dataset.state === "progress", "Progress feedback is set before the first asynchronous yield.");

    await writeStarted.promise;
    assert(records.length === 1, "The controlled store received one write.");
    assert(button.disabled, "The action is disabled while the write is pending.");
    assert(list.querySelectorAll("[data-arrival-id]").length === 0, "No new arrival row appears while the write is pending.");
    assert(status.dataset.state === "progress", "The in-progress status is set while the write is pending.");
    assert(!status.textContent.includes("successfully"), "No success confirmation appears while the write is pending.");
    app.recordArrival();
    assert(records.length === 1, "A second submission while busy does not trigger another store write.");
    assert(records[0].recipientId === TMM.RECIPIENT_ID, "The event is associated with the fixed demo recipient.");
    assert(!Number.isNaN(Date.parse(records[0].occurredAt)), "The event has a parseable timestamp.");
    assert(records[0].isSimulated === true, "The event is marked as simulated test data.");

    report("While the store write is pending, the new row and success confirmation are absent.");
    elapsed = 450;
    assert(button.disabled, "The action remains busy after 400 ms while the store is still pending.");
    assert(list.querySelectorAll("[data-arrival-id]").length === 0, "No arrival row appears after 400 ms while the store is still pending.");
    assert(status.dataset.state === "progress", "Progress remains active after 400 ms while the store is still pending.");
    assert(!status.textContent.includes("successfully"), "No success appears after 400 ms while the store is still pending.");
    acceptWrite.resolve();
    await attempt;

    assert(minimumWaitCalls === 0, "Acceptance after 400 ms adds no further minimum-duration wait.");
    assert(list.querySelectorAll("[data-arrival-id]").length === 1, "One accepted event appears in recent arrivals.");
    assert(list.querySelector(".arrival-title").textContent === "Simulated test arrival", "The arrival is clearly labeled as simulated test data.");
    const displayedTime = list.querySelector("time");
    assert(displayedTime && displayedTime.dateTime === records[0].occurredAt && displayedTime.textContent.trim().length > 0, "The accepted event displays its timestamp.");
    assert(status.dataset.state === "success", "Success appears only after the store accepts the write and the minimum duration has elapsed.");
    assert(!button.disabled, "The action becomes available again after success.");
    report("A slower pending write shows no early result and appears immediately after acceptance beyond 400 ms.");

    const immediateWriteStarted = deferred();
    const waitStarted = deferred();
    const releaseMinimumWait = deferred();
    const immediateEvents = [];
    const timeline = [];
    let immediateElapsed = 0;
    const immediateStore = {
      record(event) {
        timeline.push("store");
        immediateWriteStarted.resolve(event);
        immediateEvents.push(event);
        return Promise.resolve(event);
      },
      listFor(recipientId) {
        return immediateEvents.filter((event) => event.recipientId === recipientId);
      }
    };
    const immediateFixture = createIsolatedFixture();
    const immediateApp = TMM.mount(immediateFixture, {
      store: immediateStore,
      now: () => immediateElapsed,
      requestFrame(callback) { callback(); },
      wait(duration) {
        timeline.push("wait");
        waitStarted.resolve(duration);
        return releaseMinimumWait.promise;
      }
    });
    const immediateAttempt = immediateApp.recordArrival();
    const immediateButton = immediateFixture.querySelector("[data-simulate]");
    const immediateList = immediateFixture.querySelector("[data-arrivals]");
    const immediateStatus = immediateFixture.querySelector("[data-status]");

    assert(immediateButton.disabled, "The action is disabled before the immediate write begins.");
    await immediateWriteStarted.promise;
    assert(timeline[0] === "store", "The store operation begins before the minimum-duration wait.");
    const requestedWait = await waitStarted.promise;
    assert(requestedWait === 400, "An immediately accepted write waits only for the remaining 400 ms.");
    assert(timeline.join(",") === "store,wait", "The existing frame opportunity is followed by the store call, then any remaining busy-time wait.");
    assert(immediateButton.disabled, "The action remains disabled until the minimum duration completes.");
    assert(immediateList.querySelectorAll("[data-arrival-id]").length === 0, "No arrival row appears before the minimum duration completes.");
    assert(immediateStatus.dataset.state === "progress", "Progress remains active before the minimum duration completes.");
    assert(!immediateStatus.textContent.includes("successfully"), "No success appears before the minimum duration completes.");

    immediateElapsed = 399;
    assert(immediateList.querySelectorAll("[data-arrival-id]").length === 0, "No arrival row appears at 399 ms.");
    immediateElapsed = 400;
    releaseMinimumWait.resolve();
    await immediateAttempt;
    assert(immediateElapsed >= 400, "The immediate-write workflow stays busy for at least 400 ms from action start.");
    assert(immediateList.querySelectorAll("[data-arrival-id]").length === 1, "The event appears after acceptance and the minimum duration.");
    assert(immediateStatus.dataset.state === "success", "Success appears after acceptance and the minimum duration.");
    assert(!immediateButton.disabled, "The action becomes available after the minimum duration completes.");
    report("An immediately accepted write starts before the 400 ms wait and displays only after the minimum duration.");

    const retryEvents = [];
    let retryWriteCount = 0;
    let retryElapsed = 0;
    const retryWriteStarted = deferred();
    const acceptRetryWrite = deferred();
    const retryStore = {
      record(event) {
        retryWriteCount += 1;
        if (retryWriteCount === 1) return Promise.reject(new Error("test rejection"));
        retryWriteStarted.resolve();
        return acceptRetryWrite.promise.then(() => {
          retryEvents.push(event);
          return event;
        });
      },
      listFor(recipientId) {
        return retryEvents.filter((event) => event.recipientId === recipientId);
      }
    };
    const retryFixture = createIsolatedFixture();
    const retryApp = TMM.mount(retryFixture, {
      store: retryStore,
      now: () => retryElapsed,
      requestFrame(callback) { callback(); },
      wait(duration) {
        retryElapsed += duration;
        return Promise.resolve();
      }
    });
    const retryButton = retryFixture.querySelector("[data-simulate]");
    const retryList = retryFixture.querySelector("[data-arrivals]");
    const retryStatus = retryFixture.querySelector("[data-status]");
    await retryApp.recordArrival();
    assert(retryList.querySelectorAll("[data-arrival-id]").length === 0, "A rejected write leaves recent arrivals unchanged.");
    assert(retryStatus.dataset.state === "error", "A rejected write displays the error state.");
    assert(retryStatus.textContent === "We couldn’t record this simulated arrival. Please try again.", "A rejected write displays the clear retryable message.");
    assert(!retryStatus.textContent.includes("successfully"), "A rejected write does not display success.");
    assert(!retryButton.disabled, "The action is available after a rejected write.");
    assert(retryWriteCount === 1, "The first retry-store call was rejected.");
    const arrivalsAfterFailure = retryList.querySelectorAll("[data-arrival-id]").length;

    if (walkthroughMode) {
      retryFixture.hidden = false;
      walkthroughPrompt.textContent = "The test-only store rejected the first write. Review the error in the fixture, then click its Simulate Test Arrival button to retry.";
      if (!await waitForUserClick(retryButton)) throw walkthroughTimeout();
    } else {
      retryButton.click();
    }
    assert(retryStatus.dataset.state === "progress", "Retry immediately clears the prior error and shows progress.");
    assert(!retryStatus.textContent.includes("couldn’t record"), "The prior error is cleared when retry begins.");
    assert(retryButton.disabled, "The action is disabled while the retry is pending.");
    await retryWriteStarted.promise;
    assert(retryEvents.length === 0, "The retry store has not accepted an event while its write is pending.");
    assert(retryList.querySelectorAll("[data-arrival-id]").length === arrivalsAfterFailure, "No arrival row appears before the retry store accepts the event.");
    assert(retryStatus.dataset.state === "progress", "No success is displayed before the retry store accepts the event.");
    assert(!retryStatus.textContent.includes("successfully"), "The retry does not show success while the store write is pending.");
    const retrySuccessRendered = new Promise((resolve) => {
      const observer = new MutationObserver(() => {
        if (retryStatus.dataset.state === "success") {
          observer.disconnect();
          resolve();
        }
      });
      observer.observe(retryStatus, { attributes: true, attributeFilter: ["data-state"] });
    });
    if (walkthroughMode) {
      acceptControlledWriteButton.hidden = false;
      walkthroughPrompt.textContent = "The retry is pending. Review the progress state, disabled action, and unchanged list. Click the test-only control below to let the fake store accept the write.";
      if (!await waitForUserClick(acceptControlledWriteButton)) throw walkthroughTimeout();
      acceptControlledWriteButton.disabled = true;
    }
    acceptRetryWrite.resolve();
    await retrySuccessRendered;
    assert(retryWriteCount === 2, "Retry submits one new store write.");
    assert(retryEvents.length === 1, "A successful retry adds exactly one event to the store.");
    const retriedEvent = retryEvents[0];
    assert(retriedEvent.recipientId === TMM.RECIPIENT_ID, "The successful retry records the expected demo recipient.");
    assert(Number.isFinite(Date.parse(retriedEvent.occurredAt)), "The successful retry records a valid timestamp.");
    assert(retriedEvent.isSimulated === true, "The successful retry records the simulated-event marker.");
    const retryArrivalRows = retryList.querySelectorAll("[data-arrival-id]");
    assert(retryArrivalRows.length === arrivalsAfterFailure + 1 && retryArrivalRows.length === 1, "A successful retry adds exactly one arrival to the unchanged list.");
    const retriedRow = retryArrivalRows[0];
    assert(retriedRow.dataset.recipientId === TMM.RECIPIENT_ID, "The displayed retry arrival is associated with the expected demo recipient.");
    assert(retriedRow.querySelector(".arrival-title").textContent === "Simulated test arrival", "The displayed retry arrival has the expected simulated/test label.");
    assert(retriedRow.querySelector(".arrival-tag").textContent === "TEST · SIMULATED", "The displayed retry arrival has the expected test/simulated label.");
    assert(retriedRow.querySelector("time").dateTime === retriedEvent.occurredAt, "The displayed retry arrival shows the recorded timestamp.");
    assert(retryStatus.dataset.state === "success", "A successful retry displays success.");
    assert(retryStatus.textContent.includes("successfully"), "The retry success confirmation appears after store acceptance.");
    assert(!retryButton.disabled, "The action is available after a successful retry.");
    if (walkthroughMode) walkthroughPrompt.textContent = "The controlled retry was accepted. Review the timestamped test arrival and success; the walkthrough assertions will now finish.";
    report("A rejected write leaves the list unchanged and retry clears the error before a successful result.");

    const thrownEvents = [];
    const throwingStore = {
      record() {
        throw new Error("test synchronous throw");
      },
      listFor(recipientId) {
        return thrownEvents.filter((event) => event.recipientId === recipientId);
      }
    };
    const throwingFixture = createIsolatedFixture();
    const throwingApp = TMM.mount(throwingFixture, {
      store: throwingStore,
      requestFrame(callback) { callback(); }
    });
    const throwingButton = throwingFixture.querySelector("[data-simulate]");
    const throwingList = throwingFixture.querySelector("[data-arrivals]");
    const throwingStatus = throwingFixture.querySelector("[data-status]");
    await throwingApp.recordArrival();
    assert(throwingList.querySelectorAll("[data-arrival-id]").length === 0, "A synchronous throw leaves recent arrivals unchanged.");
    assert(throwingStatus.dataset.state === "error", "A synchronous throw displays the error state.");
    assert(throwingStatus.textContent === "We couldn’t record this simulated arrival. Please try again.", "A synchronous throw displays the retryable message.");
    assert(!throwingStatus.textContent.includes("successfully"), "A synchronous throw does not display success.");
    assert(!throwingButton.disabled, "The action is available after a synchronous throw.");
    report("A synchronous store throw displays a retryable error without adding an event or success.");
  }

  run().catch((error) => {
    if (walkthroughMode && error.name === "WalkthroughTimeout") {
      walkthroughPrompt.textContent = `${error.message} No result is claimed; use Reload walkthrough to start again.`;
      document.documentElement.dataset.testResult = "cancelled";
      return;
    }
    const row = document.createElement("li");
    row.className = "arrival-row";
    row.textContent = `FAIL — ${error.message}`;
    row.style.color = "#8d3030";
    results.append(row);
    document.documentElement.dataset.testResult = "failed";
  }).then(() => {
    if (!document.documentElement.dataset.testResult) {
      document.documentElement.dataset.testResult = "passed";
    }
  });
})();
