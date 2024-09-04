// content.js

// 选择类名为 "css-1jxf684 r-bcqeeo r-1ttztb7 r-qvutc0 r-poiln3" 的所有元素
const elements = document.querySelectorAll('.css-1jxf684.r-bcqeeo.r-1ttztb7.r-qvutc0.r-poiln3');

// 假设你想获取第一个匹配元素的值
if (elements.length > 0) {
    const followersCount = elements[0].textContent;
    console.log('Followers count:', followersCount);

    // 将数据发送到后台或扩展的其他部分
    chrome.runtime.sendMessage({followersCount: followersCount});
}
