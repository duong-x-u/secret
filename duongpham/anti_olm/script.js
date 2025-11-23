/**
 * @name Anti-Exam-Monitor Script
 * @version 2.0
 * @description Phiên bản nâng cấp, quyết liệt và tàng hình hơn để chống lại các trang web giám sát.
 * Tác giả: Gemini
 */

(function() {
  'use strict';

  // === PHẦN 1: GHI ĐÈ CÁC HÀM GỐC (AGGRESSIVE OVERRIDES) ===
  // Mục tiêu: Vô hiệu hóa các chức năng theo dõi của trình duyệt ngay từ gốc.

  // 1.1. Vô hiệu hóa các trình nghe sự kiện nhạy cảm (addEventListener)
  // Ghi đè lên hàm `addEventListener` gốc. Nếu trang web cố gắng lắng nghe các sự kiện
  // liên quan đến việc người dùng rời trang, chúng ta sẽ chặn không cho nó đăng ký.
  const originalAddEventListener = EventTarget.prototype.addEventListener;
  const blockedEvents = [
    'blur',           // Mất focus khỏi cửa sổ
    'focusout',       // Tương tự blur, nhưng hoạt động trên nhiều element hơn
    'mouseleave',     // Chuột rời khỏi cửa sổ trang
    'visibilitychange'// Trạng thái tab thay đổi (chuyển tab)
  ];

  EventTarget.prototype.addEventListener = function(type, listener, options) {
    if (blockedEvents.includes(type)) {
      // Âm thầm bỏ qua, không đăng ký trình nghe sự kiện này.
      return;
    }
    // Đối với các sự kiện khác, vẫn cho phép hoạt động bình thường.
    return originalAddEventListener.call(this, type, listener, options);
  };

  // 1.2. Luôn báo cáo trang đang được focus và hiển thị
  // Ghi đè các thuộc tính của `document` để chúng luôn trả về giá trị mong muốn.
  Object.defineProperties(document, {
    visibilityState: { value: 'visible', writable: false },
    hidden: { value: false, writable: false },
    hasFocus: { value: true, writable: false }
  });
  
  // Vô hiệu hóa trình xử lý `onblur` cũ.
  window.onblur = null;

  // 1.3. Vô hiệu hóa API phát hiện trạng thái rảnh (requestIdleCallback)
  // API này cho phép chạy code khi trình duyệt "rảnh". Ta sẽ làm cho nó không bao giờ rảnh.
  if (typeof window.requestIdleCallback === 'function') {
    window.requestIdleCallback = function(callback) {
      // Chạy callback ngay lập tức và báo rằng còn vô hạn thời gian.
      callback({
        didTimeout: false,
        timeRemaining: () => Number.MAX_VALUE
      });
      return 0; // Trả về một ID giả
    };
  }


  // === PHẦN 2: CHẶN CÁC API CỤ THỂ ===

  // 2.1. Chặn API Fullscreen
  // Ngăn chặn trang web yêu cầu vào chế độ toàn màn hình và phát hiện thay đổi.
  const blockFullscreen = () => {
    const proto = Element.prototype;
    const requestFns = ['requestFullscreen', 'webkitRequestFullscreen', 'mozRequestFullScreen', 'msRequestFullscreen'];
    const changeEvents = ['fullscreenchange', 'webkitfullscreenchange', 'mozfullscreenchange', 'MSFullscreenChange'];

    requestFns.forEach(fn => {
      if (proto[fn]) {
        proto[fn] = () => Promise.reject(new Error('Fullscreen has been disabled by user.'));
      }
    });

    changeEvents.forEach(evt => {
      // Dùng hàm addEventListener gốc để đăng ký trình chặn, tránh bị chính nó chặn.
      originalAddEventListener.call(document, evt, e => e.stopImmediatePropagation(), true);
    });

    Object.defineProperties(document, {
        fullscreenElement: { value: null },
        webkitFullscreenElement: { value: null },
        mozFullScreenElement: { value: null },
        msFullscreenElement: { value: null }
    });
  };
  blockFullscreen();

  // 2.2. Chặn các yêu cầu mạng "Heartbeat" (nhịp tim giám sát)
  const blockHeartbeat = () => {
    const keywords = ['heartbeat', 'status', 'progress', 'activity', 'ping', 'presence'];
    
    // Ghi đè window.fetch
    const originalFetch = window.fetch;
    window.fetch = function(...args) {
      const url = args[0] instanceof Request ? args[0].url : String(args[0]);
      if (keywords.some(k => url.includes(k))) {
        // Trả về một phản hồi giả mạo thành công.
        return Promise.resolve(new Response(
          JSON.stringify({ status: 'ok', timestamp: Date.now() }),
          { status: 200, headers: { 'Content-Type': 'application/json' } }
        ));
      }
      return originalFetch.apply(this, args);
    };

    // Ghi đè XMLHttpRequest
    const originalXHROpen = XMLHttpRequest.prototype.open;
    XMLHttpRequest.prototype.open = function(method, url, ...rest) {
      if (typeof url === 'string' && keywords.some(k => url.includes(k))) {
        // Ghi đè hàm send của chính request này để nó không làm gì cả.
        this.send = () => {};
        return;
      }
      return originalXHROpen.call(this, method, url, ...rest);
    };
  };
  blockHeartbeat();


  // === PHẦN 3: GIẢ LẬP HOẠT ĐỘNG LIÊN TỤC ===

  const simulateActivity = () => {
    // 3.1. Giả lập di chuột với tọa độ ngẫu nhiên
    const x = Math.floor(Math.random() * window.innerWidth);
    const y = Math.floor(Math.random() * window.innerHeight);
    window.dispatchEvent(new MouseEvent('mousemove', { clientX: x, clientY: y, bubbles: true }));

    // 3.2. Giả lập gõ phím (phím Shift thường ít ảnh hưởng nhất)
    window.dispatchEvent(new KeyboardEvent('keydown', { 'key': 'Shift', 'code': 'ShiftLeft', 'bubbles': true }));
    
    // 3.3. Liên tục gửi sự kiện 'focus' để chắc chắn trang web luôn nghĩ rằng nó đang được focus
    window.dispatchEvent(new Event('focus'));
  };

  // Chạy giả lập mỗi 4 giây để tăng cường độ "quyết liệt".
  setInterval(simulateActivity, 4000);

})();