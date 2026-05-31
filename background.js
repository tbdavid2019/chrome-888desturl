const MENU_ID = "trace-final-url";
const TRACE_STATE_KEY = "traceState";
const PRIMARY_BASE = "https://url.create360.ai";
const FALLBACK_BASE = "https://url.david888.com";
const SLOW_HINT_MS = 1500;
const ABORT_MS = 20000;

chrome.runtime.onInstalled.addListener(async () => {
  await ensureContextMenu();
  await initializeSidePanel();
});

chrome.runtime.onStartup.addListener(async () => {
  await ensureContextMenu();
  await initializeSidePanel();
});

async function ensureContextMenu() {
  await chrome.contextMenus.removeAll();

  chrome.contextMenus.create({
    id: MENU_ID,
    title: chrome.i18n.getMessage("contextMenuTitle"),
    contexts: ["link", "page", "selection"]
  });
}

async function initializeSidePanel() {
  if (!chrome.sidePanel) {
    return;
  }

  await chrome.sidePanel.setOptions({
    path: "panel.html",
    enabled: true
  });

  await chrome.sidePanel.setPanelBehavior({
    openPanelOnActionClick: true
  });
}

chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId !== MENU_ID) {
    return;
  }

  const target = getTargetFromContext(info, tab);
  const tabId = tab?.id;

  if (!tabId) {
    void setTraceState({
      phase: "error",
      message: chrome.i18n.getMessage("errNoTab"),
      finalUrl: null,
      redirectCount: null,
      resultUrl: null,
      targetUrl: target.url ?? null,
      source: target.source
    });
    return;
  }

  // Keep sidePanel.open() directly in the user gesture call stack.
  chrome.sidePanel.open({ windowId: tab.windowId }).catch((error) => {
    void setTraceState({
      phase: "error",
      finalUrl: null,
      redirectCount: null,
      resultUrl: null,
      targetUrl: target.url ?? null,
      source: target.source,
      message: error?.message || chrome.i18n.getMessage("errSidePanelOpen")
    });
  });

  void handleTraceRequest(target);
});

function getTargetFromContext(info, tab) {
  if (info.linkUrl && isHttpUrl(info.linkUrl)) {
    return { url: info.linkUrl, source: "link" };
  }

  const selectedText = info.selectionText?.trim();
  if (selectedText && isHttpUrl(selectedText)) {
    return { url: selectedText, source: "selection" };
  }

  if (info.pageUrl && isHttpUrl(info.pageUrl)) {
    return { url: info.pageUrl, source: "page" };
  }

  if (tab?.url && isHttpUrl(tab.url)) {
    return { url: tab.url, source: "page" };
  }

  return { url: null, source: "unknown" };
}

function isHttpUrl(value) {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

function normalizeResultUrl(value, activeBase) {
  if (!value) {
    return null;
  }

  if (value.startsWith("http://") || value.startsWith("https://")) {
    return value;
  }

  return `${activeBase}${value}`;
}

async function setTraceState(patch) {
  const current = await chrome.storage.session.get(TRACE_STATE_KEY);
  const nextState = {
    finalUrl: null,
    redirectCount: null,
    resultUrl: null,
    targetUrl: null,
    source: null,
    message: null,
    step: null,
    detail: null,
    checkedAt: null,
    ...current[TRACE_STATE_KEY],
    ...patch
  };

  await chrome.storage.session.set({
    [TRACE_STATE_KEY]: nextState
  });
}

async function handleTraceRequest(target) {
  if (!target.url) {
    await setTraceState({
      phase: "error",
      message: chrome.i18n.getMessage("errInvalidUrl"),
      finalUrl: null,
      redirectCount: null,
      resultUrl: null,
      targetUrl: null,
      source: target.source
    });
    return;
  }

  const targetUrl = target.url;
  const path = `/api/final?url=${encodeURIComponent(targetUrl)}&format=json`;
  
  const controller = new AbortController();
  const abortTimer = setTimeout(() => controller.abort(), ABORT_MS);
  const slowTimer = setTimeout(() => {
    void setTraceState({
      phase: "loading",
      step: chrome.i18n.getMessage("statusLoadingSlowLabel"),
      detail: chrome.i18n.getMessage("statusLoadingSlowDetail")
    });
  }, SLOW_HINT_MS);

  await setTraceState({
    phase: "loading",
    finalUrl: null,
    redirectCount: null,
    resultUrl: null,
    message: null,
    targetUrl,
    source: target.source,
    step: chrome.i18n.getMessage("statusLoadingLabel"),
    detail: chrome.i18n.getMessage("statusLoadingDetail")
  });

  try {
    let response;
    let activeBase = PRIMARY_BASE;

    // Try primary base URL first
    try {
      response = await fetch(`${PRIMARY_BASE}${path}`, {
        method: "GET",
        headers: {
          Accept: "application/json"
        },
        signal: controller.signal
      });

      if (!response.ok) {
        throw new Error(`主伺服器回傳 ${response.status}`);
      }
    } catch (primaryError) {
      // If the request was explicitly aborted (timeout), rethrow to trigger outer catch
      if (primaryError?.name === "AbortError") {
        throw primaryError;
      }

      console.warn("主伺服器連線失敗，嘗試備用伺服器:", primaryError);

      // Fallback to backup base URL
      activeBase = FALLBACK_BASE;
      response = await fetch(`${FALLBACK_BASE}${path}`, {
        method: "GET",
        headers: {
          Accept: "application/json"
        },
        signal: controller.signal
      });

      if (!response.ok) {
        throw new Error(`備用伺服器回傳 ${response.status}`);
      }
    }

    const data = await response.json();
    await setTraceState({
      phase: "success",
      targetUrl,
      source: target.source,
      finalUrl: data.final_url ?? null,
      redirectCount: data.redirect_count ?? null,
      resultUrl: normalizeResultUrl(data.result_url, activeBase),
      message: null,
      step: null,
      detail: null,
      checkedAt: new Date().toISOString()
    });
  } catch (error) {
    const message =
      error?.name === "AbortError"
        ? chrome.i18n.getMessage("errTimeout")
        : error?.message || chrome.i18n.getMessage("errFetchFailed");

    await setTraceState({
      phase: "error",
      finalUrl: null,
      redirectCount: null,
      resultUrl: null,
      targetUrl,
      source: target.source,
      message
    });
  } finally {
    clearTimeout(abortTimer);
    clearTimeout(slowTimer);
  }
}
