import { createApp } from "vue";
import Overlay from "./Overlay.vue";
// 监听来自后台脚本的消息
chrome.runtime.onMessage.addListener((message) => {
  if (message.type === "request_captured") {
    window.postMessage(message, "*");
  }
});
// 创建容器元素
const container = document.createElement("div");
container.id = "data-collection-for-twenty-two";
container.style.position = "absolute";
container.style.top = 0;
container.style.left = 0;
container.style.width = "100%";
// container.style.height = '100%'
container.style.zIndex = 99999999;
container.style.pointerEvents = "none";
document.body.appendChild(container);

// 创建 Vue 应用
const app = createApp(Overlay);
app.mount("#data-collection-for-twenty-two");
