const TRACE_STATE_KEY = "traceState";

const elements = {
  statusIcon: document.querySelector("#status-icon"),
  statusLabel: document.querySelector("#status-label"),
  statusDetail: document.querySelector("#status-detail"),
  finalUrl: document.querySelector("#final-url"),
  copyButton: document.querySelector("#copy-button"),
  openButton: document.querySelector("#open-button"),
  finalImage: document.querySelector("#final-image"),
  finalImagePlaceholder: document.querySelector("#final-image-placeholder"),
  openImageButton: document.querySelector("#open-image-button"),
  sourceLabel: document.querySelector("#source-label"),
  redirectCount: document.querySelector("#redirect-count"),
  webRiskBadge: document.querySelector("#web-risk-badge"),
  webRiskDetail: document.querySelector("#web-risk-detail"),
  webRiskMeta: document.querySelector("#web-risk-meta"),
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

  elements.finalImage.addEventListener("load", () => {
    elements.finalImage.hidden = false;
    elements.finalImagePlaceholder.textContent = "";
  });

  elements.finalImage.addEventListener("error", () => {
    elements.finalImage.hidden = true;
    elements.finalImage.removeAttribute("src");
    elements.finalImagePlaceholder.textContent =
      chrome.i18n.getMessage("finalImageLoadFailed");
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

  renderFinalImage(state);
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

  renderWebRisk(state);
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

function renderFinalImage(state = {}) {
  const finalImageUrl = state.finalImageUrl || null;
  const placeholderMessage =
    state.phase === "loading"
      ? chrome.i18n.getMessage("finalImageLoading")
      : chrome.i18n.getMessage("finalImageUnavailable");

  elements.openImageButton.href = finalImageUrl || "#";
  elements.openImageButton.classList.toggle("disabled-link", !finalImageUrl);

  if (!finalImageUrl) {
    elements.finalImage.hidden = true;
    elements.finalImage.removeAttribute("src");
    delete elements.finalImage.dataset.src;
    elements.finalImagePlaceholder.textContent = placeholderMessage;
    return;
  }

  if (elements.finalImage.dataset.src !== finalImageUrl) {
    elements.finalImage.dataset.src = finalImageUrl;
    elements.finalImage.alt = state.finalUrl || state.targetUrl || "";
    elements.finalImage.hidden = true;
    elements.finalImagePlaceholder.textContent =
      chrome.i18n.getMessage("finalImageLoading");
    elements.finalImage.src = finalImageUrl;
  }
}

function renderWebRisk(state = {}) {
  const webRisk = state.webRisk;
  const status = typeof webRisk?.status === "string" ? webRisk.status : null;
  const tone = getRiskTone(status);
  const badgeText = getRiskBadgeText(status);
  const metaParts = [];
  let detailText = webRisk?.message || "";

  if (!detailText) {
    if (status === "safe") {
      detailText = chrome.i18n.getMessage("webRiskSafeDetail");
    } else if (state.phase === "loading") {
      detailText = chrome.i18n.getMessage("webRiskLoading");
    } else if (state.phase === "idle" || !state.phase) {
      detailText = chrome.i18n.getMessage("webRiskWaiting");
    } else {
      detailText = chrome.i18n.getMessage("webRiskUnavailable");
    }
  }

  if (webRisk?.source) {
    metaParts.push(webRisk.source);
  }

  if (webRisk?.checkedAt) {
    metaParts.push(formatDateTime(webRisk.checkedAt));
  }

  elements.webRiskBadge.textContent = badgeText;
  elements.webRiskBadge.className = `risk-badge${tone ? ` ${tone}` : ""}`;
  elements.webRiskBadge.classList.toggle("muted", !status);

  elements.webRiskDetail.textContent = detailText;
  elements.webRiskDetail.classList.toggle("muted", !webRisk?.message && !status);

  elements.webRiskMeta.textContent = metaParts.join(" • ");
  elements.webRiskMeta.classList.toggle("muted", metaParts.length === 0);
}

function getRiskTone(status) {
  const normalized = status?.toLowerCase() || "";

  if (!normalized) {
    return "";
  }

  if (["safe", "clean", "ok"].includes(normalized)) {
    return "safe";
  }

  if (
    ["unsafe", "malware", "phishing", "danger", "harmful", "blocked"].includes(
      normalized
    )
  ) {
    return "danger";
  }

  return "caution";
}

function getRiskBadgeText(status) {
  const normalized = status?.toLowerCase() || "";

  switch (normalized) {
    case "safe":
    case "clean":
    case "ok":
      return chrome.i18n.getMessage("webRiskSafe");
    case "unsafe":
    case "danger":
    case "harmful":
    case "blocked":
      return chrome.i18n.getMessage("webRiskUnsafe");
    case "malware":
      return chrome.i18n.getMessage("webRiskMalware");
    case "phishing":
      return chrome.i18n.getMessage("webRiskPhishing");
    case "suspicious":
      return chrome.i18n.getMessage("webRiskSuspicious");
    default:
      return chrome.i18n.getMessage("webRiskUnknown");
  }
}

function formatDateTime(value) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(date);
}
