<template>
  <div class="overlay" :class="{ open: isOpen }" v-show="visible">
    <div class="overlay-content">
      <div class="data-content">
        <div class="filter-section">
          <div class="operation-types">
            <select
              v-model="selectedSuffix"
              @change="handleChangeType"
              class="suffix-select"
            >
              <option value="m3u8">过滤条件：m3u8</option>
              <option value="mp4">过滤条件：mp4</option>
              <option value="mp3">过滤条件：mp3</option>
              <option value="m4a">过滤条件：m4a</option>
            </select>
            <button @click="copySavedLinks">复制已保存链接</button>
            <button @click="clearSavedLinks">清空已保存链接</button>
          </div>
        </div>

        <div class="links">
          <div class="storage-list">
            <h3>已保存的链接</h3>
            <div
              v-for="(item, index) in savedItems"
              :key="index"
              class="storage-item"
            >
              <div class="storage-url">
                <div class="title">
                  <span class="label">title: </span> {{ item.title }}
                </div>
                <div class="origin">
                  <span class="label">origin: </span> {{ item.origin }}
                </div>
                <div class="real">
                  <span class="label">real: </span>{{ item.real }}
                </div>
              </div>
              <button class="move-up-btn" @click="moveUp(index)">上移</button>
              <button class="move-down-btn" @click="moveDown(index)">
                下移
              </button>
              <button class="delete-btn" @click="removeFromStorage(index)">
                删除
              </button>
            </div>
          </div>

          <div class="request-list">
            <h3>
              当前页面符合条件的链接({{ filteredRequests.length }}/{{
                requests.length
              }})
            </h3>
            <div
              v-for="(request, index) in filteredRequests"
              :key="index"
              class="request-item"
            >
              <div class="request-url">{{ request.url }}</div>
              <button class="save-btn" @click="saveToStorage(request)">
                保存
              </button>
            </div>
          </div>
        </div>
      </div>

      <div class="drag-handle" @click="toggleOpen">
        <div class="handle-icon"></div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from "vue";

const savedItems = ref([]);

const visible = ref(true);
const requests = ref([]);
const selectedSuffix = ref(localStorage.getItem("filterType") || "m3u8");
const isOpen = ref(localStorage.getItem("isopen") === "true");

const filteredRequests = computed(() => {
  return requests.value.filter(
    (request) =>
      request.url.toLowerCase().indexOf(`.${selectedSuffix.value}`) > -1
  );
});
const handleChangeType = () => {
  localStorage.setItem("filterType", selectedSuffix.value);
};
const toggleOpen = () => {
  isOpen.value = !isOpen.value;
  localStorage.setItem("isopen", isOpen.value ? "true" : "false");
};

const loadFromStorage = () => {
  const items = localStorage.getItem("saved_urls");
  savedItems.value = items ? JSON.parse(items) : [];
};
// 创建自定义事件监听器接收来自 content script 的消息
window.addEventListener("message", (event) => {
  if (event.data.type === "request_captured") {
    const allUrls = event.data.requestUrls.map((item) => {
      return {
        url: item.url,
        origin: event.data.origin || window.location.href,
        title: event.data.title || document.title,
        timestamp: item.timestamp,
      };
    });
    requests.value = allUrls;
    // 过滤出10秒内的请求
    // requests.value = allUrls.filter((item) => {
    //   return new Date().getTime() - item.timestamp < 1000 * 10;
    // });
  }
});

window.addEventListener("beforeunload", (event) => {
  chrome.runtime.sendMessage({
    type: "clear_requests",
  });
});

onMounted(() => {
  loadFromStorage();
});

const moveUp = (index) => {
  if (index > 0) {
    const temp = savedItems.value[index];
    savedItems.value[index] = savedItems.value[index - 1];
    savedItems.value[index - 1] = temp;
    localStorage.setItem("saved_urls", JSON.stringify(savedItems.value));
  }
};

const moveDown = (index) => {
  if (index < savedItems.value.length - 1) {
    const temp = savedItems.value[index];
    savedItems.value[index] = savedItems.value[index + 1];
    savedItems.value[index + 1] = temp;
    localStorage.setItem("saved_urls", JSON.stringify(savedItems.value));
  }
};

const saveToStorage = (request) => {
  // 检查是否已存在相同的 URL
  const isDuplicate = savedItems.value.some(
    (item) => item.real === request.url
  );

  console.log("isDuplicate", isDuplicate);

  // 如果不是重复的 URL，则添加到存储中
  if (!isDuplicate) {
    savedItems.value.push({
      origin: request.origin || window.location.href,
      real: request.url,
      title: request.title || document.title,
    });
    localStorage.setItem("saved_urls", JSON.stringify(savedItems.value));
  }

  chrome.runtime.sendMessage({
    type: "clear_requests",
    tabId: chrome.devtools.inspectedWindow.tabId,
  });
};

const removeFromStorage = (index) => {
  savedItems.value.splice(index, 1);
  localStorage.setItem("saved_urls", JSON.stringify(savedItems.value));
};

const copySavedLinks = () => {
  const links = JSON.stringify(savedItems.value);
  navigator.clipboard
    .writeText(links)
    .then(() => {
      alert("已复制到剪切板");
    })
    .catch((err) => {
      console.error("复制失败", err);
    });
};

const clearSavedLinks = () => {
  savedItems.value = [];
  localStorage.setItem("saved_urls", JSON.stringify(savedItems.value));
  alert("已清空所有已保存链接");
};
</script>

<style lang="less" scoped>
.overlay {
  pointer-events: auto;
  width: 100vw;
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 9999;
  top: -300px;
  position: relative;
  transition: all 0.3s ease;
  background: transparent;

  &.open {
    top: 0px;
  }
  &-content {
    position: relative;
    width: 100%;
    overflow-y: auto;
    transform-origin: bottom;
    display: flex;
    flex-direction: column;
    align-items: center;

    @keyframes slideIn {
      from {
        opacity: 0;
        transform: translateY(-20px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }

    .data-content {
      background-color: rgb(192, 184, 184);
      width: 100%;
      height: 300px;
      padding: 8px 30px;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
      box-sizing: border-box;
      .filter-section {
        height: 40px;

        .suffix-select {
          padding: 8px 15px;
          border-radius: 6px;
          border: 1px solid #ddd;
          font-size: 14px;
          background-color: #f8f9fa;
          cursor: pointer;
          transition: all 0.2s ease;

          &:focus {
            outline: none;
            border-color: #4a90e2;
            box-shadow: 0 0 0 3px rgba(74, 144, 226, 0.1);
          }

          &:hover {
            border-color: #4a90e2;
          }
        }
      }

      // ... existing code ...
      .filter-section {
        margin-bottom: 10px;

        h4 {
          font-size: 16px;
          margin-bottom: 8px;
        }

        .operation-types {
          display: flex;
          gap: 10px;
          margin-bottom: 10px;

          button {
            padding: 6px 12px;
            background-color: #4a90e2;
            color: white;
            border: none;
            border-radius: 4px;
            cursor: pointer;
            transition: background-color 0.2s ease;

            &:hover {
              background-color: #357abd;
            }
          }
        }
      }
      // ... existing code ...
    }

    .drag-handle {
      width: 40px;
      height: 20px;
      background-color: #f4600a;
      border-radius: 0 0 8px 8px;
      cursor: pointer;
      display: flex;
      justify-content: center;
      align-items: center;
      transition: background-color 0.2s ease;

      &:hover {
        background-color: #e0e0e0;
      }

      .handle-icon {
        width: 30px;
        height: 4px;
        background-color: #ffffff;
        border-radius: 2px;
      }
    }

    .links {
      display: flex;
      justify-content: space-between;
      width: 100%;
      height: 205px;
      margin-top: 20px;
      .storage-list {
        height: 100%;
        overflow-y: auto;

        width: 48%;
        padding: 10px;
        border: 1px solid #ddd;
        border-radius: 4px;
        background-color: #f8f9fa;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        h3 {
          font-size: 16px;
          color: #2c3e50;
          margin-bottom: 10px;
        }
        .storage-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 12px 15px;
          background-color: #ffffff;
          border: 1px solid #e0e4e8;
          border-radius: 6px;
          margin-bottom: 10px;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
          transition: all 0.2s ease;

          &:hover {
            transform: translateY(-2px);
            box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
          }

          .storage-url {
            font-size: 14px;
            color: #2c3e50;
            word-break: break-all;
            margin-right: 15px;
            flex: 1;

            .title {
              font-weight: bold;
              margin-bottom: 4px;
              font-size: 12px;
            }

            .real {
              color: #4a90e2;
              margin-bottom: 2px;
              font-size: 12px;
            }

            .origin {
              color: #666;
              font-size: 12px;
            }
            .label {
              font-weight: 900;
              color: #c82333;
            }
          }

          .delete-btn,
          .move-up-btn,
          .move-down-btn {
            padding: 6px 12px;
            background-color: #dc3545;
            color: white;
            border: none;
            border-radius: 4px;
            cursor: pointer;
            font-weight: 500;
            transition: all 0.2s ease;

            &:hover {
              background-color: #c82333;
              transform: scale(1.05);
            }

            &:active {
              transform: scale(0.95);
            }
          }
          .move-up-btn,
          .move-down-btn {
            background-color: #3586dc;
            &:hover {
              background-color: #1879c8;
              transform: scale(1.05);
            }
          }
          > button + button {
            margin-left: 4px;
          }
        }
      }

      .request-list {
        height: 100%;
        overflow-y: auto;
        width: 48%;
        padding: 10px;
        border: 1px solid #ddd;
        border-radius: 4px;
        background-color: #f8f9fa;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        h3 {
          font-size: 16px;
          color: #2c3e50;
          margin-bottom: 10px;
        }
        .request-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 12px 15px;
          background-color: #ffffff;
          border: 1px solid #e0e4e8;
          border-radius: 6px;
          margin-bottom: 10px;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
          transition: all 0.2s ease;

          &:hover {
            transform: translateY(-2px);
            box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
          }

          .request-url {
            font-size: 14px;
            color: #2c3e50;
            word-break: break-all;
            margin-right: 15px;
            flex: 1;
          }

          .save-btn {
            padding: 6px 12px;
            background-color: #4a90e2;
            color: white;
            border: none;
            border-radius: 4px;
            cursor: pointer;
            font-weight: 500;
            transition: all 0.2s ease;

            &:hover {
              background-color: #357abd;
              transform: scale(1.05);
            }

            &:active {
              transform: scale(0.95);
            }
          }
        }
      }
    }
  }
}
</style>
