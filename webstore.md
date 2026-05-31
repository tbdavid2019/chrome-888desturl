# Chrome Web Store 審查提交指南

請直接複製以下對應欄位的內容填入 Chrome 線上應用程式商店（Developer Dashboard）的表單中。

---

## 1. 產品詳細資料 (Product Details)

### 單一用途說明 (Single Purpose Description)
> **中文：**
> 此擴充功能的單一用途是協助使用者在瀏覽網頁時，能透過右鍵選單快速查詢任何連結、網頁或選取文字的最終跳轉目的地網址（Redirect Destination），並於側邊欄（Side Panel）中即時顯示結果，避免被惡意跳轉或廣告網址誤導。
>
> **英文：**
> The single purpose of this extension is to allow users to quickly trace and check the final redirect destination of any link, page, or selected URL directly from the right-click context menu, displaying the results immediately in the Chrome side panel to improve browsing security and transparency.

### 產品詳細說明 (Product Description)
> **中文：**
> **秒速追蹤跳轉，一眼看穿真實網址！**
> 
> 您是否經常點擊短網址或未知連結後，經過多次重定向與等待才到達目的地，甚至擔心被引導至釣魚網站？
> 
> 「final destination 檢查網址的最終目的地 333」是一款專為 Chrome 設計的極簡側邊欄擴充功能。透過強大的 888desturl API，能幫您在「不點開連結、不干擾當前瀏覽」的前提下，直接查明該連結最後會帶您去哪裡。
> 
> **✨ 核心特色**
> - **右鍵即時查詢**：在任何連結、網頁空白處或選取的 URL 文字上點擊右鍵，選擇「檢查最終網址」即可開始追蹤。
> - **獨立側邊欄介面**：結果直接在 Chrome 側邊欄（Side Panel）中渲染，不阻塞、不影響您當前閱讀的網頁。
> - **透明的重定向資訊**：清晰顯示最終目的地網址、重定向次數（跳轉次數）以及查詢來源。
> - **主備雙伺服器支援**：具備高可用性的自動降級技術，順暢連線不中斷。
> - **安全防護**：一鍵複製最終網址，或快速開啟詳細分析頁，點擊連結前心中有數，上網更安心。
>
> **英文：**
> **Trace redirect hops in a split second and see the true URL instantly!**
> 
> Have you ever clicked on a shortened link or a suspicious URL, only to wait through multiple redirects, or worry about being sent to a phishing website?
> 
> "final destination 檢查網址的最終目的地 333" is a minimalist Chrome extension designed for the Side Panel. Powered by the 888desturl API, it allows you to find out exactly where a link leads, without clicking it or interrupting your browsing.
> 
> **✨ Key Features**
> - **Instant Right-Click Tracing**: Right-click on any link, page background, or selected URL text, and click "Check final destination" to start tracing immediately.
> - **Dedicated Side Panel Interface**: Results are rendered directly in the Chrome Side Panel, ensuring a smooth, non-intrusive view that doesn't block or disrupt your active reading.
> - **Transparent Redirect Information**: Clearly shows the final destination URL, redirect hop count, and request source.
> - **Primary & Backup Server Support**: Features built-in automatic failover for high availability and seamless fallback connection.
> - **Secure Protection**: Easily copy the final resolved URL with a single click, or quickly open the detailed trace analysis page to ensure safety before you visit.

---

## 2. 要求權限的理由 (Permissions Justification)

### 要求 `contextMenus` 的理由
> **中文：**
> 用來建立「檢查最終網址」的右鍵選單項目，讓使用者可以在任何網頁、連結或選取的文字上直接點擊，以觸發最終網址的跳轉追蹤。
>
> **英文：**
> Used to add the "Check final destination" item to the right-click context menu, allowing users to trigger redirect tracing easily on any page, link, or selected URL text.

### 要求 `sidePanel` 的理由
> **中文：**
> 用來開啟與管理 Chrome 側邊欄（Side Panel），在其中顯示解析跳轉的即時進度、跳轉次數以及最終目的地網址，提供使用者流暢且不中斷網頁瀏覽的獨立顯示介面。
>
> **英文：**
> Used to open and manage the Chrome Side Panel, providing a dedicated and non-intrusive UI to display real-time redirect progress, hop counts, and the final resolved URL.

### 要求 `storage` 的理由
> **中文：**
> 用來在背景服務程式（Service Worker）與側邊欄頁面之間進行狀態同步（使用 `chrome.storage.session`）。當背景程式收到右鍵點擊並完成 API 請求後，透過 Session 儲存區通知並將跳轉結果安全地渲染在側邊欄上。
>
> **英文：**
> Used to synchronize the redirect tracing state between the background service worker and the side panel using `chrome.storage.session`. Once the background worker fetches the API results, it updates the session storage to render the results in the side panel.

### 要求網站存取權限的理由 (Host Permissions)
> **中文：**
> 擴充功能需要存取 `https://url.create360.ai/*` 與 `https://url.david888.com/*`，這是用來發送網路請求（fetch）以向 888desturl API 查詢網址最終跳轉目的地。為了防止主伺服器故障，此存取權包含了備用的 API 伺服器權限。
>
> **英文：**
> The extension requires host permissions for `https://url.create360.ai/*` and `https://url.david888.com/*` to send fetch requests to the 888desturl API. This allows resolving the redirect destinations, including a fallback host for high availability.

---

## 3. ⚠️ 關於「遠端程式碼」的關鍵提醒（非常重要）

在您的第二張截圖中，您在**「你正在使用『遠端程式碼』嗎？」**欄位勾選了「**是，我使用了遠端程式碼**」。

### **請務必改勾選為：「不，我沒有使用遠端程式碼」**。

**原因說明：**
1. **本專案沒有使用遠端程式碼**：此擴充功能的所有 JS、HTML 和 CSS 都是本地打包的程式。透過 `fetch` 存取 REST API 取得 JSON 格式的數據，**這不屬於「遠端程式碼」**。遠端程式碼是指「從伺服器下載 JavaScript/Wasm 檔案並在擴充功能中用 `eval()` 或 `<script>` 標籤動態載入執行」。
2. **MV3 政策限制**：在 Manifest V3 規範中，Chrome 官方**嚴禁**擴充功能下載並執行任何遠端程式碼。如果您在商店勾選了「是」，審查團隊會用極度嚴格的標準調查，且因為 MV3 的安全政策，這會**導致您的擴充功能直接被拒絕上架（Reject）**。

因此，請在該欄位安全地勾選 **「不，我沒有使用遠端程式碼」**，即可順利通過此項審查。
