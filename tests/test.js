(function () {
  "use strict";

  const results = document.querySelector("[data-results]");
  const fixture = document.querySelector("[data-fixture]");
  const fixtureHost = document.querySelector("[data-fixture-host]");
  const walkthroughRegion = document.querySelector("[data-walkthrough]");
  const walkthroughPanel = document.querySelector("[data-walkthrough-panel]");
  const walkthroughStatus = document.querySelector("[data-walkthrough-status]");
  const walkthroughMode = new URLSearchParams(window.location.search).get("walkthrough") === "failure-retry";
  const walkthroughTimeoutMs = 30000;
  let walkthroughPrompt;
  let walkthroughCountdown;
  let walkthroughCountdownCopy;
  let walkthroughCountdownMeter;
  let acceptControlledWriteButton;
  let acceptControlledWriteGroup;
  let activeActionWait;
  const walkthroughWaitCleanup = new Set();
  let cancelControlledWrite;
  let walkthroughSteps = [];

  function setWalkthroughStatus(state) {
    if (!walkthroughStatus) return;
    const labels = {
      "not-started": "Not started",
      "in-progress": "In progress",
      passed: "Passed",
      failed: "Failed"
    };
    walkthroughStatus.dataset.state = state;
    walkthroughStatus.textContent = labels[state];
  }

  function setWalkthroughProgress(currentIndex, completedCount) {
    walkthroughSteps.forEach((step, index) => {
      const state = index < completedCount ? "complete" : index === currentIndex ? "current" : "upcoming";
      step.dataset.stepState = state;
      if (state === "current") step.setAttribute("aria-current", "step");
      else step.removeAttribute("aria-current");
    });
  }

  function markWalkthroughIssue(state) {
    const current = walkthroughSteps.find((step) => step.dataset.stepState === "current");
    if (current) current.dataset.stepState = state;
  }

  function setupWalkthrough() {
    if (!walkthroughMode) return;

    const panel = document.createElement("section");
    panel.className = "arrivals walkthrough-status";
    panel.setAttribute("aria-label", "Test-only failure and retry walkthrough");

    const heading = document.createElement("h2");
    heading.textContent = "Failure/retry walkthrough";

    const stepper = document.createElement("ol");
    stepper.className = "walkthrough-stepper";
    stepper.setAttribute("aria-label", "Failure and retry steps");
    ["Attempt 1 — Simulate an arrival", "Attempt 2 — Retry after rejection", "Attempt 3 — Retry and confirm arrival"].forEach((label, index) => {
      const step = document.createElement("li");
      step.className = "walkthrough-step";
      step.dataset.stepState = "upcoming";
      const number = document.createElement("span");
      number.className = "step-number";
      number.setAttribute("aria-hidden", "true");
      number.textContent = String(index + 1);
      const text = document.createElement("span");
      text.textContent = label;
      step.append(number, text);
      stepper.append(step);
      walkthroughSteps.push(step);
    });

    const nextStepLabel = document.createElement("p");
    nextStepLabel.className = "step-status";
    nextStepLabel.textContent = "Your next step";
    walkthroughPrompt = document.createElement("p");
    walkthroughPrompt.className = "walkthrough-prompt";
    walkthroughPrompt.setAttribute("role", "status");
    walkthroughPrompt.setAttribute("aria-live", "polite");

    walkthroughCountdown = document.createElement("div");
    walkthroughCountdown.className = "countdown";
    walkthroughCountdown.hidden = true;
    walkthroughCountdownCopy = document.createElement("p");
    walkthroughCountdownCopy.className = "countdown-copy";
    walkthroughCountdownCopy.setAttribute("role", "timer");
    walkthroughCountdownCopy.setAttribute("aria-live", "off");
    walkthroughCountdownMeter = document.createElement("progress");
    walkthroughCountdownMeter.max = 30;
    walkthroughCountdownMeter.value = 30;
    walkthroughCountdownMeter.setAttribute("aria-label", "Time remaining for this action");
    walkthroughCountdown.append(walkthroughCountdownCopy, walkthroughCountdownMeter);

    acceptControlledWriteButton = document.createElement("button");
    acceptControlledWriteButton.className = "test-accept-action";
    acceptControlledWriteButton.type = "button";
    acceptControlledWriteButton.textContent = "Simulate successful retry";
    acceptControlledWriteButton.hidden = true;
    const acceptExplanation = document.createElement("p");
    acceptExplanation.className = "test-control-note";
    acceptExplanation.textContent = "This confirms the simulated arrival for the demonstration. It does not detect real mail.";
    acceptExplanation.hidden = true;
    acceptControlledWriteGroup = document.createElement("div");
    acceptControlledWriteGroup.className = "controlled-acceptance";
    acceptControlledWriteGroup.hidden = true;
    acceptControlledWriteGroup.append(acceptControlledWriteButton, acceptExplanation);

    const restartButton = document.createElement("button");
    restartButton.className = "secondary-action";
    restartButton.type = "button";
    restartButton.textContent = "Start over";
    restartButton.addEventListener("click", () => {
      clearWalkthroughWaits("restart");
      window.location.href = `${window.location.pathname}?walkthrough=failure-retry`;
    });

    const actions = document.createElement("div");
    actions.className = "walkthrough-actions";
    actions.append(acceptControlledWriteGroup, restartButton);

    panel.append(heading, stepper, nextStepLabel, walkthroughPrompt, walkthroughCountdown, actions);
    walkthroughPanel.append(panel);
  }

  function waitForUserClick(element) {
    return new Promise((resolve) => {
      const deadline = Date.now() + walkthroughTimeoutMs;
      let timerId;
      let previousSeconds = null;
      let settled = false;

      function complete(result) {
        if (settled) return;
        settled = true;
        window.clearTimeout(timerId);
        element.removeEventListener("click", onClick, true);
        if (activeActionWait && activeActionWait.complete === complete) activeActionWait = null;
        walkthroughWaitCleanup.delete(cancelWait);

        if (result === false) {
          if ("disabled" in element) element.disabled = true;
          if (element === acceptControlledWriteButton) acceptControlledWriteGroup.hidden = true;
          walkthroughCountdown.hidden = true;
          walkthroughCountdown.removeAttribute("data-state");
          walkthroughPrompt.dataset.state = "timeout";
          walkthroughPrompt.textContent = "Time expired. Restart the demo to try again.";
        } else {
          walkthroughCountdown.hidden = true;
          walkthroughCountdown.removeAttribute("data-state");
        }
        resolve(result);
      }

      function onClick(event) {
        if (Date.now() >= deadline) {
          event.preventDefault();
          event.stopImmediatePropagation();
          complete(false);
          return;
        }
        complete(true);
      }

      function updateCountdown() {
        const remainingMs = Math.max(0, deadline - Date.now());
        const seconds = Math.ceil(remainingMs / 1000);
        if (seconds !== previousSeconds) {
          walkthroughCountdownCopy.textContent = `${seconds} ${seconds === 1 ? "second" : "seconds"} remaining`;
          walkthroughCountdownMeter.value = seconds;
          previousSeconds = seconds;
        }
        if (remainingMs === 0) {
          complete(false);
          return;
        }
        timerId = window.setTimeout(updateCountdown, Math.min(1000, remainingMs));
      }

      function cancelWait() { complete("restart"); }

      walkthroughCountdownMeter.hidden = false;
      walkthroughCountdownMeter.max = walkthroughTimeoutMs / 1000;
      walkthroughCountdown.hidden = false;
      activeActionWait = { complete, cancel: () => complete("restart") };
      walkthroughWaitCleanup.add(cancelWait);
      element.addEventListener("click", onClick, { once: true, capture: true });
      updateCountdown();
    });
  }

  async function waitForRequiredClick(element) {
    const result = await waitForUserClick(element);
    if (result === "restart") {
      const error = new Error("The walkthrough was restarted.");
      error.name = "WalkthroughRestarted";
      throw error;
    }
    if (!result) throw walkthroughTimeout();
  }

  window.addEventListener("pagehide", () => {
    clearWalkthroughWaits("page-exit");
  });

  function clearWalkthroughWaits(reason) {
    const error = reason === "timeout" ? walkthroughTimeout() : new Error("The walkthrough was stopped.");
    error.name = reason === "timeout" ? "WalkthroughTimeout" : "WalkthroughRestarted";
    if (activeActionWait) {
      try { activeActionWait.cancel(); } catch (_) { /* Preserve the original walkthrough outcome. */ }
    }
    for (const cancel of Array.from(walkthroughWaitCleanup)) {
      try { cancel(error); } catch (_) { /* Cleanup must not replace the original outcome. */ }
    }
    walkthroughWaitCleanup.clear();
    if (cancelControlledWrite) {
      try { cancelControlledWrite(); } catch (_) { /* The controlled promise must settle even on cleanup errors. */ }
      cancelControlledWrite = null;
    }
  }

  function waitForStatusState(element, expectedState) {
    const pending = new Promise((resolve, reject) => {
      if (element.dataset.state === expectedState) {
        resolve(true);
        return;
      }
      let settled = false;
      let timeoutId;
      const observer = new MutationObserver(() => {
        if (element.dataset.state === expectedState) {
          finish(true);
        }
      });
      function finish(value, error) {
        if (settled) return;
        settled = true;
        observer.disconnect();
        window.clearTimeout(timeoutId);
        walkthroughWaitCleanup.delete(cancel);
        if (error) reject(error);
        else resolve(value);
      }
      function cancel(error) { finish(false, error || new Error("The walkthrough was stopped.")); }
      timeoutId = window.setTimeout(() => finish(false, walkthroughTimeout()), walkthroughTimeoutMs);
      walkthroughWaitCleanup.add(cancel);
      observer.observe(element, { attributes: true, attributeFilter: ["data-state"] });
    });
    pending.catch(() => {});
    return pending;
  }

  function waitForRecipientRetryReady(button, status) {
    const ready = () => status.dataset.state === "error" && !button.disabled;
    if (ready()) return Promise.resolve(true);

    const pending = new Promise((resolve, reject) => {
      let settled = false;
      let timeoutId;
      const observer = new MutationObserver(() => {
        if (ready()) finish(true);
      });
      function finish(value, error) {
        if (settled) return;
        settled = true;
        observer.disconnect();
        window.clearTimeout(timeoutId);
        walkthroughWaitCleanup.delete(cancel);
        if (error) reject(error);
        else resolve(value);
      }
      function cancel(error) { finish(false, error || new Error("The walkthrough was stopped.")); }
      timeoutId = window.setTimeout(() => finish(false, walkthroughTimeout()), walkthroughTimeoutMs);
      walkthroughWaitCleanup.add(cancel);
      observer.observe(status, { attributes: true, attributeFilter: ["data-state"] });
      observer.observe(button, { attributes: true, attributeFilter: ["disabled"] });
      if (ready()) finish(true);
    });
    pending.catch(() => {});
    return pending;
  }

  function waitForSignal(signal) {
    return new Promise((resolve, reject) => {
      let settled = false;
      let timeoutId;
      function finish(value, error) {
        if (settled) return;
        settled = true;
        window.clearTimeout(timeoutId);
        walkthroughWaitCleanup.delete(cancel);
        if (error) reject(error);
        else resolve(value);
      }
      function cancel(error) { finish(null, error || new Error("The walkthrough was stopped.")); }
      timeoutId = window.setTimeout(() => finish(null, walkthroughTimeout()), walkthroughTimeoutMs);
      walkthroughWaitCleanup.add(cancel);
      signal.then((value) => finish(value), (error) => finish(null, error));
    });
  }

  function waitForAcceptedArrival(list, status, button, event) {
    return new Promise((resolve, reject) => {
      let settled = false;
      let timeoutId;
      const observer = new MutationObserver(check);
      function check() {
        const row = Array.from(list.querySelectorAll("[data-arrival-id]"))
          .find((item) => item.dataset.arrivalId === event.id);
        if (row && status.dataset.state === "success" && !button.disabled) finish({ row });
      }
      function finish(value, error) {
        if (settled) return;
        settled = true;
        observer.disconnect();
        window.clearTimeout(timeoutId);
        walkthroughWaitCleanup.delete(cancel);
        if (error) reject(error);
        else resolve(value);
      }
      function cancel(error) { finish(null, error || new Error("The walkthrough was stopped.")); }
      timeoutId = window.setTimeout(() => finish(null, walkthroughTimeout()), walkthroughTimeoutMs);
      walkthroughWaitCleanup.add(cancel);
      observer.observe(list, { childList: true, subtree: true, attributes: true, characterData: true });
      observer.observe(status, { attributes: true, childList: true, characterData: true, subtree: true });
      observer.observe(button, { attributes: true, attributeFilter: ["disabled"] });
      check();
    });
  }

  function walkthroughTimeout() {
    const error = new Error("Time expired. Restart the demo to try again.");
    error.name = "WalkthroughTimeout";
    return error;
  }

  setupWalkthrough();

  function createIsolatedFixture() {
    const isolatedFixture = fixture.cloneNode(true);
    fixtureHost.append(isolatedFixture);
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

    report("No early confirmation — The arrival does not appear in Recent arrivals until it is confirmed.");
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
    report("Delayed confirmation works — Even when confirmation takes longer, the arrival appears only after it succeeds.");

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
    report("Fast confirmation displays correctly — Even a quick confirmation follows the expected recording process.");

    const retryEvents = [];
    let retryWriteCount = 0;
    let retryElapsed = 0;
    let thirdAttemptEvent;
    let thirdAttemptSettled = false;
    let thirdWriteStartedSignalled = false;
    const retryWriteStarted = deferred();
    const thirdWriteStarted = deferred();
    const acceptRetryWrite = deferred();
    const acceptThirdWrite = deferred();
    const retryStore = {
      record(event) {
        retryWriteCount += 1;
        if (retryWriteCount <= (walkthroughMode ? 2 : 1)) return Promise.reject(new Error("test rejection"));
        if (walkthroughMode && retryWriteCount === 3) {
          thirdAttemptEvent = event;
          thirdWriteStartedSignalled = true;
          thirdWriteStarted.resolve(event);
          return acceptThirdWrite.promise.then((accepted) => {
            if (!accepted) throw new Error("controlled test write cancelled");
            retryEvents.push(event);
            return event;
          });
        }
        retryWriteStarted.resolve(event);
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
    let walkthroughCompleteLock = false;
    if (walkthroughMode) {
      retryButton.addEventListener("click", (event) => {
        if (!walkthroughCompleteLock) return;
        event.preventDefault();
        event.stopImmediatePropagation();
      }, true);
    }
    let thirdWriteAccepted = false;
    function settleThirdWrite(accepted) {
      if (thirdAttemptSettled) return false;
      thirdAttemptSettled = true;
      thirdWriteAccepted = accepted;
      acceptThirdWrite.resolve(accepted);
      cancelControlledWrite = null;
      return true;
    }
    if (walkthroughMode) {
      cancelControlledWrite = () => {
        if (!thirdWriteStartedSignalled) thirdWriteStarted.resolve(null);
        settleThirdWrite(false);
      };
      walkthroughRegion.hidden = false;
      retryFixture.hidden = false;
      setWalkthroughProgress(0, 0);
      walkthroughPrompt.textContent = "Click Simulate Test Arrival to begin. The first attempt is deliberately rejected, so no arrival should appear yet.";
      const firstReady = waitForRecipientRetryReady(retryButton, retryStatus);
      await waitForRequiredClick(retryButton);
      setWalkthroughStatus("in-progress");
      await firstReady;
    } else {
      await retryApp.recordArrival();
    }
    assert(retryList.querySelectorAll("[data-arrival-id]").length === 0, "A rejected write leaves recent arrivals unchanged.");
    assert(retryStatus.dataset.state === "error", "A rejected write displays the error state.");
    assert(retryStatus.textContent === "We couldn’t record this simulated arrival. Please try again.", "A rejected write displays the clear retryable message.");
    assert(!retryStatus.textContent.includes("successfully"), "A rejected write does not display success.");
    assert(!retryButton.disabled, "The action is available after a rejected write.");
    assert(retryWriteCount === 1, "The first retry-store call was rejected.");
    const arrivalsAfterFailure = retryList.querySelectorAll("[data-arrival-id]").length;
    if (walkthroughMode) {
      retryButton.lastElementChild.textContent = "Try Again – Attempt 2";
      retryButton.classList.add("try-again-action");
      assert(retryButton.lastElementChild.textContent === "Try Again – Attempt 2", "The first failed attempt labels the next action as Attempt 2.");
      setWalkthroughProgress(1, 1);
      walkthroughPrompt.textContent = "Attempt 1 was rejected. In the recipient preview, click Try Again – Attempt 2. Check Recent arrivals; it should remain empty.";
    }

    if (walkthroughMode) {
      const secondProgress = waitForStatusState(retryStatus, "progress");
      await waitForRequiredClick(retryButton);
      await secondProgress;
    } else {
      retryButton.click();
    }
    assert(retryStatus.dataset.state === "progress", "Retry immediately clears the prior error and shows progress.");
    assert(!retryStatus.textContent.includes("couldn’t record"), "The prior error is cleared when retry begins.");
    assert(retryButton.disabled, "The action is disabled while the retry is pending.");
    if (walkthroughMode) {
      retryButton.classList.remove("try-again-action");
      await waitForRecipientRetryReady(retryButton, retryStatus);
      assert(retryList.querySelectorAll("[data-arrival-id]").length === arrivalsAfterFailure, "The second rejected write leaves recent arrivals unchanged.");
      assert(retryStatus.dataset.state === "error" && !retryStatus.textContent.includes("successfully"), "The second rejected write reports failure without success.");
      assert(!retryButton.disabled, "The recipient action is restored after the second rejection.");
      retryButton.lastElementChild.textContent = "Try Again – Attempt 3";
      assert(retryButton.lastElementChild.textContent === "Try Again – Attempt 3", "The third attempt stage identifies its attempt number.");
      retryButton.classList.add("try-again-action");
      walkthroughPrompt.textContent = "Attempt 2 was also rejected. In the recipient preview, click Try Again – Attempt 3; this attempt will wait for test confirmation. Recent arrivals should remain empty.";
      const thirdProgress = waitForStatusState(retryStatus, "progress");
      await waitForRequiredClick(retryButton);
      await thirdProgress;
      assert(retryButton.lastElementChild.textContent === "Recording test arrival…", "The third attempt restores the application's recording-progress label.");
      retryButton.classList.remove("try-again-action");
      const acceptedEvent = await waitForSignal(thirdWriteStarted.promise);
      assert(acceptedEvent, "The controlled third write starts before its bounded wait expires.");
      assert(retryWriteCount === 3, "The third retry starts exactly one controlled store write.");
      assert(retryList.querySelectorAll("[data-arrival-id]").length === arrivalsAfterFailure, "No arrival appears while the third write is pending.");
      assert(retryStatus.dataset.state === "progress" && !retryStatus.textContent.includes("successfully"), "The third pending write has progress but no success.");
      assert(retryButton.disabled, "The recipient action is disabled while the third write is pending.");
      retryButton.click();
      assert(retryWriteCount === 3, "A click on the disabled recipient action does not start another write.");
      await retryApp.recordArrival();
      assert(retryWriteCount === 3, "The defensive recordArrival API path also respects the busy guard.");
      assert(retryEvents.length === 0, "The third event is not accepted before explicit test-control activation.");
      acceptControlledWriteGroup.hidden = false;
      acceptControlledWriteButton.hidden = false;
      acceptControlledWriteButton.disabled = false;
      acceptControlledWriteGroup.querySelector(".test-control-note").hidden = false;
      walkthroughPrompt.textContent = "The retry is waiting for confirmation. Check Recent arrivals; no new arrival should appear until you choose Simulate successful retry to confirm this test-only event.";
      const finalArrival = waitForAcceptedArrival(retryList, retryStatus, retryButton, acceptedEvent);
      finalArrival.catch(() => {});
      await waitForRequiredClick(acceptControlledWriteButton);
      acceptControlledWriteButton.disabled = true;
      assert(settleThirdWrite(true), "The controlled third write is accepted at most once.");
      const accepted = await finalArrival;
      const row = accepted.row;
      assert(thirdWriteAccepted && retryEvents.length === 1 && retryEvents[0] === acceptedEvent, "The exact third event is accepted by the controlled store.");
      assert(row.dataset.arrivalId === acceptedEvent.id, "The rendered row matches the exact third event ID.");
      assert(row.dataset.recipientId === TMM.RECIPIENT_ID && acceptedEvent.recipientId === TMM.RECIPIENT_ID, "The exact third event is associated with the demo recipient.");
      assert(Number.isFinite(Date.parse(acceptedEvent.occurredAt)) && row.querySelector("time").dateTime === acceptedEvent.occurredAt, "The exact third event has a valid, matching timestamp.");
      assert(acceptedEvent.isSimulated === true && row.querySelector(".arrival-tag").textContent === "TEST · SIMULATED", "The exact third event and row are labeled simulated test data.");
      assert(retryStatus.textContent === "Simulated arrival recorded successfully.", "The existing success message is rendered for the accepted third event.");
      assert(!retryButton.disabled, "The recipient action is re-enabled before walkthrough completion.");
      assert(retryButton.lastElementChild.textContent === "Simulate Test Arrival", "Success restores the application's normal action label.");
      acceptControlledWriteGroup.hidden = true;
      setWalkthroughProgress(2, 2);
      walkthroughPrompt.textContent = "Check Recent arrivals for the confirmed event, timestamp, and TEST · SIMULATED label. The last check is finishing.";
    } else {
      await retryWriteStarted.promise;
      assert(retryEvents.length === 0, "The retry store has not accepted an event while its write is pending.");
      assert(retryList.querySelectorAll("[data-arrival-id]").length === arrivalsAfterFailure, "No arrival row appears before the retry store accepts the event.");
      assert(retryStatus.dataset.state === "progress", "No success is displayed before the retry store accepts the event.");
      assert(!retryStatus.textContent.includes("successfully"), "The retry does not show success while the store write is pending.");
      acceptRetryWrite.resolve();
      await waitForStatusState(retryStatus, "success");
    }

    assert(retryWriteCount === (walkthroughMode ? 3 : 2), "Retry submits the expected number of new store writes.");
    assert(retryEvents.length === 1, "A successful retry adds exactly one event to the store.");
    const retriedEvent = retryEvents[0];
    assert(retriedEvent.recipientId === TMM.RECIPIENT_ID, "The successful retry records the expected demo recipient.");
    assert(Number.isFinite(Date.parse(retriedEvent.occurredAt)), "The successful retry records a valid timestamp.");
    assert(retriedEvent.isSimulated === true, "The successful retry records the simulated-event marker.");
    const retryArrivalRows = retryList.querySelectorAll("[data-arrival-id]");
    assert(retryArrivalRows.length === arrivalsAfterFailure + 1 && retryArrivalRows.length === 1, "A successful retry adds exactly one arrival to the unchanged list.");
    const retriedRow = retryArrivalRows[0];
    assert(retriedRow.dataset.arrivalId === retriedEvent.id, "The displayed row matches the accepted retry event ID.");
    assert(retriedRow.dataset.recipientId === TMM.RECIPIENT_ID, "The displayed retry arrival is associated with the expected demo recipient.");
    assert(retriedRow.querySelector(".arrival-title").textContent === "Simulated test arrival", "The displayed retry arrival has the expected simulated/test label.");
    assert(retriedRow.querySelector(".arrival-tag").textContent === "TEST · SIMULATED", "The displayed retry arrival has the expected test/simulated label.");
    assert(retriedRow.querySelector("time").dateTime === retriedEvent.occurredAt, "The displayed retry arrival shows the recorded timestamp.");
    assert(retryStatus.dataset.state === "success", "A successful retry displays success.");
    assert(retryStatus.textContent === "Simulated arrival recorded successfully.", "The retry success confirmation appears after store acceptance.");
    assert(!retryButton.disabled, "The action is available after a successful retry.");
    if (walkthroughMode) {
      walkthroughCompleteLock = true;
      retryButton.disabled = true;
      retryButton.classList.add("demo-complete");
      retryButton.lastElementChild.textContent = "Demo Complete";
      assert(retryButton.disabled, "The recipient action is disabled after the walkthrough succeeds.");
      assert(retryButton.lastElementChild.textContent === "Demo Complete", "The completed walkthrough labels the recipient action Demo Complete.");
      retryButton.click();
      retryButton.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true }));
      assert(retryWriteCount === 3 && retryEvents.length === 1 && retryList.querySelectorAll("[data-arrival-id]").length === 1, "Post-completion clicks cannot trigger another write or arrival.");
    }
    report("Retry works after an error — An unsuccessful attempt does not create an arrival, and the user can try again.");

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
    report("Unexpected errors are handled safely — If recording encounters an error, no false arrival appears and the user can retry.");
  }

  run().then(() => {
    clearWalkthroughWaits("complete");
    if (!document.documentElement.dataset.testResult) {
      document.documentElement.dataset.testResult = "passed";
      if (walkthroughMode) {
        setWalkthroughProgress(-1, 3);
        walkthroughPrompt.dataset.state = "complete";
        walkthroughPrompt.textContent = "Demo complete. Check Recent arrivals for the confirmed simulated arrival. Select Start over to run the demo again.";
        setWalkthroughStatus("passed");
      }
    }
  }, (error) => {
    clearWalkthroughWaits(error.name === "WalkthroughTimeout" ? "timeout" : "failure");
    if (walkthroughMode) {
      acceptControlledWriteButton.hidden = true;
      acceptControlledWriteButton.disabled = true;
      acceptControlledWriteGroup.hidden = true;
    }
    if (walkthroughMode && error.name === "WalkthroughRestarted") {
      document.documentElement.dataset.testResult = "cancelled";
      return;
    }
    if (walkthroughMode && error.name === "WalkthroughTimeout") {
      walkthroughPrompt.dataset.state = "timeout";
      walkthroughPrompt.textContent = error.message;
      markWalkthroughIssue("paused");
      const recipientAction = walkthroughRegion.querySelector("[data-simulate]");
      if (recipientAction) {
        recipientAction.disabled = true;
        Promise.resolve().then(() => Promise.resolve()).then(() => {
          if (document.documentElement.dataset.testResult === "cancelled") recipientAction.disabled = true;
        });
      }
      document.documentElement.dataset.testResult = "cancelled";
      return;
    }
    const row = document.createElement("li");
    row.className = "arrival-row";
    row.classList.add("test-failure");
    row.textContent = `FAIL — ${error.message}`;
    row.style.color = "#8d3030";
    results.append(row);
    document.documentElement.dataset.testResult = "failed";
    if (walkthroughMode) {
      setWalkthroughStatus("failed");
      walkthroughPrompt.dataset.state = "error";
      markWalkthroughIssue("failed");
      walkthroughPrompt.textContent = "Something didn’t pass the check. Review the result below, then try again. The demonstration is not complete yet.";
    }
  });
})();
