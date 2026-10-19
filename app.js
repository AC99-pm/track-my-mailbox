(function (global) {
  "use strict";

  const RECIPIENT_ID = "demo-recipient-001";
  const MIN_BUSY_DURATION_MS = 400;

  function createInMemoryStore() {
    const events = [];
    return {
      record(event) {
        const accepted = { ...event };
        events.push(accepted);
        return Promise.resolve(accepted);
      },
      listFor(recipientId) {
        return events.filter((event) => event.recipientId === recipientId);
      }
    };
  }

  function createEventId() {
    if (global.crypto && typeof global.crypto.randomUUID === "function") {
      return global.crypto.randomUUID();
    }
    return `test-event-${Date.now()}-${Math.random().toString(16).slice(2)}`;
  }

  function waitForFrame(requestFrame) {
    return new Promise((resolve) => requestFrame(resolve));
  }

  function waitForDuration(duration) {
    return new Promise((resolve) => global.setTimeout(resolve, duration));
  }

  function mount(root, options) {
    const settings = options || {};
    const store = settings.store || createInMemoryStore();
    const requestFrame = settings.requestFrame || global.requestAnimationFrame.bind(global);
    const now = settings.now || (() => global.performance.now());
    const wait = settings.wait || waitForDuration;
    const button = root.querySelector("[data-simulate]");
    const buttonLabel = button.querySelector(".button-icon")?.nextElementSibling || button.lastElementChild;
    const originalButtonLabel = buttonLabel ? buttonLabel.textContent : "Simulate Test Arrival";
    const list = root.querySelector("[data-arrivals]");
    const status = root.querySelector("[data-status]");
    let busy = false;

    function renderArrivals() {
      const events = store.listFor(RECIPIENT_ID);
      list.replaceChildren();
      if (events.length === 0) {
        const empty = document.createElement("li");
        empty.className = "empty-state";
        empty.dataset.empty = "";
        empty.textContent = "No simulated arrivals yet";
        list.append(empty);
        return;
      }

      events.slice().reverse().forEach((event) => {
        const row = document.createElement("li");
        row.className = "arrival-row";
        row.dataset.arrivalId = event.id;
        row.dataset.recipientId = event.recipientId;

        const icon = document.createElement("span");
        icon.className = "arrival-icon";
        icon.setAttribute("aria-hidden", "true");
        icon.textContent = "✓";

        const details = document.createElement("div");
        const title = document.createElement("p");
        title.className = "arrival-title";
        title.textContent = "Simulated test arrival";
        const time = document.createElement("time");
        time.className = "arrival-meta";
        time.dateTime = event.occurredAt;
        time.textContent = new Date(event.occurredAt).toLocaleString();
        details.append(title, time);

        const tag = document.createElement("span");
        tag.className = "arrival-tag";
        tag.textContent = "TEST · SIMULATED";
        row.append(icon, details, tag);
        list.append(row);
      });
    }

    async function recordArrival() {
      if (busy) return;

      const startedAt = now();
      // Set the duplicate guard synchronously before any asynchronous yield.
      busy = true;
      button.disabled = true;
      if (buttonLabel) buttonLabel.textContent = "Recording test arrival…";
      status.dataset.state = "progress";
      status.textContent = "Recording simulated test arrival…";

      const event = {
        id: createEventId(),
        recipientId: RECIPIENT_ID,
        occurredAt: new Date().toISOString(),
        isSimulated: true
      };

      // Best-effort rendering opportunity from the approved technical spec.
      await waitForFrame(requestFrame);
      await waitForFrame(requestFrame);

      let accepted;
      try {
        accepted = await store.record(event);
      } catch (error) {
        status.dataset.state = "error";
        status.textContent = "We couldn’t record this simulated arrival. Please try again.";
        if (buttonLabel) buttonLabel.textContent = originalButtonLabel;
        busy = false;
        button.disabled = false;
        return;
      }

      if (!accepted) {
        status.dataset.state = "error";
        status.textContent = "We couldn’t record this simulated arrival. Please try again.";
        if (buttonLabel) buttonLabel.textContent = originalButtonLabel;
        busy = false;
        button.disabled = false;
        return;
      }

      const remainingBusyTime = Math.max(0, MIN_BUSY_DURATION_MS - (now() - startedAt));
      if (remainingBusyTime > 0) await wait(remainingBusyTime);

      renderArrivals();
      status.dataset.state = "success";
      status.textContent = "Simulated arrival recorded successfully.";
      if (buttonLabel) buttonLabel.textContent = originalButtonLabel;

      busy = false;
      button.disabled = false;
    }

    renderArrivals();
    button.addEventListener("click", recordArrival);

    return { recordArrival, renderArrivals };
  }

  global.TMM = { RECIPIENT_ID, createInMemoryStore, mount };

  const demoRoot = document.querySelector("[data-tmm-app]");
  if (demoRoot) mount(demoRoot);
})(window);
