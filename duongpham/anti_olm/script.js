/*********************
 * 1. CHẶN TAB-DETECT
 *********************/

// Luôn báo đang visible
Object.defineProperty(document, "visibilityState", { get: () => "visible" });
Object.defineProperty(document, "hidden", { get: () => false });

// Chặn web nghe event visibilitychange
document.addEventListener("visibilitychange", e => e.stopImmediatePropagation(), true);

// Chặn mất focus
window.addEventListener("blur", e => e.stopImmediatePropagation(), true);
window.onblur = null;

// Fake luôn là đang focus
Object.defineProperty(document, "hasFocus", { get: () => true });
setInterval(() => window.dispatchEvent(new Event("focus")), 2000);

/*********************
 * 2. CHẶN FULLSCREEN
 *********************/

// Chặn yêu cầu vào fullscreen
["requestFullscreen", "webkitRequestFullscreen", "mozRequestFullScreen", "msRequestFullscreen"]
  .forEach(fn => {
    if (HTMLElement.prototype[fn]) {
      HTMLElement.prototype[fn] = function () {
        console.log("Blocked fullscreen request");
        return Promise.reject();
      };
    }
  });

// Ngăn web phát hiện thay đổi fullscreen
["fullscreenchange", "webkitfullscreenchange", "mozfullscreenchange", "MSFullscreenChange"]
  .forEach(evt => {
    document.addEventListener(evt, e => e.stopImmediatePropagation(), true);
  });

// Luôn trả về đang không fullscreen (để web không biết mình thoát)
Object.defineProperty(document, "fullscreenElement", { get: () => null });
Object.defineProperty(document, "webkitFullscreenElement", { get: () => null });

/************************************
 * 3. CHẶN TIMER / HEARTBEAT MONITOR
 ************************************/

// Fake fetch nếu chứa từ nghi vấn kiểu heartbeat/status
(function() {
  const originalFetch = window.fetch;
  window.fetch = function(...args) {
    const url = args[0];
    if (typeof url === "string" && (url.includes("heartbeat") || url.includes("status") || url.includes("progress"))) {
      console.log("Fake OK heartbeat:", url);
      return Promise.resolve(new Response("{}", { status: 200 }));
    }
    return originalFetch.apply(this, args);
  };
})();

// Fake XHR khi gửi nhịp tim (cách cũ)
(function() {
  const originalOpen = XMLHttpRequest.prototype.open;
  XMLHttpRequest.prototype.open = function(method, url) {
    if (url.includes("heartbeat") || url.includes("status") || url.includes("progress")) {
      console.log("Blocked XHR heartbeat:", url);
      this.abort();
    } else {
      originalOpen.apply(this, arguments);
    }
  };
})();

/*************************
 * 4. GIỮ TRẠNG THÁI ACTIVE
 *************************/

// Một vài web check thời gian không tương tác -> ta giả hoạt động nhẹ
setInterval(() => {
  window.dispatchEvent(new Event("mousemove"));
  window.dispatchEvent(new Event("keydown"));
}, 5000);

console.log("[Anti Exam Monitor] Loaded.");
