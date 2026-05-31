const TRACE_STATE_KEY = "traceState";

const elements = {
  statusIcon: document.querySelector("#status-icon"),
  statusLabel: document.querySelector("#status-label"),
  statusDetail: document.querySelector("#status-detail"),
  finalUrl: document.querySelector("#final-url"),
  copyButton: document.querySelector("#copy-button"),
  openButton: document.querySelector("#open-button"),
  sourceLabel: document.querySelector("#source-label"),
  redirectCount: document.querySelector("#redirect-count"),
  targetUrl: document.querySelector("#target-url")
};

// Localize static text in HTML immediately
localizeHtml();

init().catch((error) => {
  renderState({
    phase: "error",
    message: error?.message || chrome.i18n.getMessage("errSidePanelOpen")
  });
});

function localizeHtml() {
  document.querySelectorAll("[data-i18n]").forEach((el) => {
    const message = chrome.i18n.getMessage(el.getAttribute("data-i18n"));
    if (message) {
      el.textContent = message;
    }
  });
}

async function init() {
  const session = await chrome.storage.session.get(TRACE_STATE_KEY);
  renderState(session[TRACE_STATE_KEY]);

  chrome.storage.onChanged.addListener((changes, areaName) => {
    if (areaName !== "session" || !changes[TRACE_STATE_KEY]) {
      return;
    }

    renderState(changes[TRACE_STATE_KEY].newValue);
  });

  elements.copyButton.addEventListener("click", async () => {
    const value = elements.finalUrl.dataset.value;
    if (!value) {
      return;
    }

    await navigator.clipboard.writeText(value);
    const textSpan = elements.copyButton.querySelector("span");
    const originalText = textSpan.textContent;
    textSpan.textContent = chrome.i18n.getMessage("copyButtonCopied");
    window.setTimeout(() => {
      textSpan.textContent = originalText;
    }, 1200);
  });
}

function renderState(state = {}) {
  const phase = state.phase || "idle";
  elements.statusIcon.className = `status-icon ${phase === "idle" ? "idle" : phase}`;

  if (phase === "loading") {
    elements.statusLabel.textContent = state.step || chrome.i18n.getMessage("statusLoadingLabel");
    elements.statusDetail.textContent = state.detail || chrome.i18n.getMessage("statusLoadingDetail");
  } else if (phase === "success") {
    elements.statusLabel.textContent = chrome.i18n.getMessage("statusSuccessLabel");
    elements.statusDetail.textContent = chrome.i18n.getMessage("statusSuccessDetail");
  } else if (phase === "error") {
    elements.statusLabel.textContent = chrome.i18n.getMessage("statusErrorLabel");
    elements.statusDetail.textContent = state.message || chrome.i18n.getMessage("statusErrorDetailDefault");
  } else {
    elements.statusLabel.textContent = chrome.i18n.getMessage("statusIdleLabel");
    elements.statusDetail.textContent = chrome.i18n.getMessage("statusIdleDetail");
  }

  const finalUrl = state.finalUrl || null;
  elements.finalUrl.textContent = finalUrl || chrome.i18n.getMessage("noResultsYet");
  elements.finalUrl.classList.toggle("muted", !finalUrl);
  elements.finalUrl.dataset.value = finalUrl || "";
  elements.copyButton.disabled = !finalUrl;

  const resultUrl = state.resultUrl || null;
  elements.openButton.href = resultUrl || "#";
  elements.openButton.classList.toggle("disabled-link", !resultUrl);

  elements.sourceLabel.textContent = sourceToLabel(state.source);
  elements.sourceLabel.classList.toggle("muted", !state.source);

  const redirectValue =
    typeof state.redirectCount === "number" ? String(state.redirectCount) : "-";
  elements.redirectCount.textContent = redirectValue;
  elements.redirectCount.classList.toggle(
    "muted",
    typeof state.redirectCount !== "number"
  );

  const targetUrl = state.targetUrl || chrome.i18n.getMessage("waitingForInput");
  elements.targetUrl.textContent = targetUrl;
  elements.targetUrl.classList.toggle("muted", !state.targetUrl);
}

function sourceToLabel(source) {
  switch (source) {
    case "link":
      return chrome.i18n.getMessage("sourceLink");
    case "page":
      return chrome.i18n.getMessage("sourcePage");
    case "selection":
      return chrome.i18n.getMessage("sourceSelection");
    default:
      return chrome.i18n.getMessage("notTriggered");
  }
}
