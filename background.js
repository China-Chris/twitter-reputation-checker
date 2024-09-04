// background.js

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.followersCount) {
      console.log('Received followers count:', request.followersCount);
      // 存储关注值
      chrome.storage.local.set({followersCount: request.followersCount}, () => {
          // 发送消息给前端，告知关注值已更新
          chrome.runtime.sendMessage({type: 'followersCountUpdated', followersCount: request.followersCount});
      });
  }
});
