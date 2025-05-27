// 监听网络请求
var requestUrls = []

chrome.webRequest.onBeforeRequest.addListener(
    function (details) {
        requestUrls.push(details.url);
        // 向内容脚本发送消息
        chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
            if (tabs[0]) {
                chrome.tabs.sendMessage(tabs[0].id, {
                    type: 'request_captured',
                    urls: [...new Set(requestUrls)],
                    method: details.method
                })
            }
        })
    },
    { urls: ["<all_urls>"] }
)