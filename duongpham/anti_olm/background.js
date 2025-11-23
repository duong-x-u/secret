// background.js - v2.0
// Thêm danh sách ngoại lệ để không chạy script trên các trang web cụ thể.

const EXCLUDED_DOMAINS = [
  'facebook.com',
  'https://blank.page/',
  'google.com',
  'scratch.mit.edu',
  'github.com',
  'instagram.com',
  'pinterest.com/',
  // Thêm các tên miền khác vào đây trong tương lai, ví dụ: 'youtube.com', 'google.com'
];

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    // Chỉ chạy khi tab đang bắt đầu tải và có URL
    if (changeInfo.status !== 'loading' || !tab.url) {
        return;
    }

    try {
        const url = new URL(tab.url);
        // Lấy tên miền và loại bỏ 'www.' để so sánh cho dễ (vd: www.facebook.com -> facebook.com)
        const domain = url.hostname.replace(/^www\./, '');

        // Kiểm tra xem tên miền của trang có nằm trong danh sách ngoại lệ không.
        // Dùng .some() để duyệt qua danh sách và .includes() để xử lý các subdomain (vd: m.facebook.com)
        if (EXCLUDED_DOMAINS.some(excludedDomain => domain.includes(excludedDomain))) {
            // Nếu có, không tiêm script và thoát khỏi hàm.
            return;
        }
        
        // Nếu không nằm trong danh sách ngoại lệ, tiến hành tiêm script.
        chrome.scripting.executeScript({
            target: { tabId: tabId },
            files: ['script.js'],
            world: 'MAIN', // Tiêm vào môi trường chính để có hiệu lực sớm nhất
        });

    } catch (e) {
        // Bỏ qua nếu URL không hợp lệ (ví dụ: chrome://extensions)
    }
});