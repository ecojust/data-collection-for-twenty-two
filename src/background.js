// 监听网络请求
var requestUrls = []

chrome.webRequest.onBeforeRequest.addListener(
    function (details) {
        requestUrls.push({
            url: details.url,
            timestamp: new Date().getTime(),
            method: details.method
        });


        // 向内容脚本发送消息
        chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
            if (tabs[0]) {
                chrome.tabs.sendMessage(tabs[0].id, {
                    type: 'request_captured',
                    requestUrls: requestUrls
                })
            }
        })
    },
    { urls: ["<all_urls>"] }
)

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.type === 'clear_requests') {
        console.log('收到消息:clear_requests', request.data);
        requestUrls = [];
        // 处理逻辑
        //   sendResponse({ success: true });
    }
    return true; // 保持通道开放用于异步响应
});