// 按钮点击事件处理
document.getElementById('loadFollowers').addEventListener('click', () => {
  // 发送消息给 content.js，触发抓取关注值的操作
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    chrome.scripting.executeScript({
      target: { tabId: tabs[0].id },
      function: getFollowerDetails
    });
  });
});

// 处理从 content.js 发送的关注值
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'followersCountUpdated') {
    document.getElementById('followerCount').textContent = `关注者: ${message.followersCount}`;
    document.getElementById('followingStatus').textContent = `正在关注: ${message.followingCount}`;
    document.getElementById('creationTime').textContent = `创建时间: ${message.creationTime}`;
    document.getElementById('daysSinceCreation').textContent = `距离创建时间: ${message.daysSinceCreation} 天`;
    document.getElementById('verifiedStatus').textContent = `认证状态: ${message.isVerified ? '已认证' : '未认证'}`;
    document.getElementById('userMass').textContent = `信誉值: ${message.userMass || '未提供'}`; // 处理从 content.js 传来的信誉值
    document.getElementById('currentUrl').textContent = `当前网页: ${message.currentUrl}`; // 显示当前网页地址
  }
});

// 定义在 Twitter 页面上执行的函数
function getFollowerDetails() {
  // 获取当前网页地址
  // 获取当前网页地址
  let currentUrl = window.location.href;

  // 从 currentUrl 中提取 `https://x.com/` 之后的部分
  const match = currentUrl.match(/^https:\/\/x\.com\/([^\/]+)$/);
  if (match) {
    currentUrl = match[1]; // 提取匹配的部分
  } else {
    currentUrl = '未知路径'; // 如果 URL 不符合预期格式
  }

  // 输出提取的结果
  console.log('提取的 URL 部分:', currentUrl);
  // 查找具有 href 属性的链接元素
  // 动态生成选择器
  const followingSelector = `a[href="/${currentUrl}/following"]`;
  const verifiedFollowersSelector = `a[href="/${currentUrl}/verified_followers"]`;

  // 查找具有 href 属性的链接元素
  const followingLinkElement = document.querySelector(followingSelector);
  const verifiedFollowersLinkElement = document.querySelector(verifiedFollowersSelector);

  let followersCount = '未找到';
  let followingCount = '未找到';
  let creationTime = '未找到';
  let daysSinceCreation = '未计算';
  let isVerified = false;
  let userMass = '0'; // 初始化信誉值为0

  if (followingLinkElement) {
    // 查找目标的 <span> 元素
    const spanElementsFollowing = followingLinkElement.querySelectorAll('span');
    
    if (spanElementsFollowing.length >= 2) {
      // 获取第一个 <span> 元素的内容（关注者数量）
      followersCount = spanElementsFollowing[0].textContent.trim();
    }
  }
  
  if (verifiedFollowersLinkElement) {
    // 查找目标的 <span> 元素
    const spanElementsVerifiedFollowers = verifiedFollowersLinkElement.querySelectorAll('span');
    
    if (spanElementsVerifiedFollowers.length >= 1) {
      // 获取第一个 <span> 元素的内容（正在关注数量）
      followingCount = spanElementsVerifiedFollowers[0].textContent.trim();
    }
  }
  
  // 查找所有 <span> 元素
  const spanElements = document.querySelectorAll('span');
  
  // 遍历所有 <span> 元素，查找包含“加入”文本的元素
  spanElements.forEach(span => {
    if (span.textContent.includes('加入')) {
      creationTime = span.textContent.trim();
      
      // 解析创建时间
      const [year, month] = creationTime.match(/\d+/g).map(Number);
      const creationDate = new Date(year, month - 1, 1); // 设置为月份的第一天
      
      // 获取当前日期
      const currentDate = new Date();
      
      // 计算天数差
      const timeDifference = currentDate - creationDate;
      daysSinceCreation = Math.floor(timeDifference / (1000 * 60 * 60 * 24)); // 转换为天数
    }
  });
  
  // 查找 class="css-175oi2r r-aqfbo4 r-gtdqiz r-1gn8etr r-1g40b8q" 的元素
  const container = document.querySelector('.css-175oi2r.r-aqfbo4.r-gtdqiz.r-1gn8etr.r-1g40b8q');

  if (container) {
    // 在 container 内查找认证图标的 <svg> 元素
    const verifiedIcon = container.querySelector('svg[data-testid="icon-verified"]');
    isVerified = verifiedIcon !== null;
  }

  console.log(isVerified);

  // 根据认证状态设置信誉值
  if (isVerified) {
    userMass = '100'; // 如果认证用户，信誉值为100
  } else {
    // 非认证用户的信誉值计算
    let baseMass = 0.55; // 默认信誉值

    // 计算 normalizedAge
    let normalizedAge = (daysSinceCreation !== '未计算' && parseInt(daysSinceCreation) > 30) 
        ? 1.0 
        : Math.min(1.0, Math.log(1.0 + parseInt(daysSinceCreation) / 15.0));
    
    score=baseMass *normalizedAge 
    //如果score<=0.01 则赋值score=0.01
    // 如果 score <= 0.01，则将 score 赋值为 0.01
    if (score <= 0.01) {
      score = 0.01;
    }
    // 计算阶段的信誉值
    userMass = (score* 100)
  }

  //计算friendsToFollowersRatio== (1.0 + numFollowings) / (1.0 + numFollowers)followersCount
  // 计算 friendsToFollowersRatio == (1.0 + numFollowings) / (1.0 + numFollowers)
  let numFollowers = parseInt(followingCount.replace(/,/g, '')); // 去除千位分隔符并转换为数字
  let numFollowings = parseInt(followersCount.replace(/,/g, '')); // 去除千位分隔符并转换为数字

  // 处理可能的 NaN 值
  if (isNaN(numFollowers)) {
    numFollowers = 0;
  }
  if (isNaN(numFollowings)) {
    numFollowings = 0;
  }

  const friendsToFollowersRatio = ((1.0 + numFollowings) / (1.0 + numFollowers)).toFixed(4); // 保留4位小数
  console.log('friendsToFollowersRatio:', friendsToFollowersRatio);

  // 计算初始的信誉值
  let mass = parseFloat(userMass); // 将 userMass 转换为数字

  // 如果 numFollowings > 500 && friendsToFollowersRatio > 0.6
  if (numFollowings > 500 && friendsToFollowersRatio > 0.6) {
    // 使用 adjustedMass = mass / Math.exp(5.0 * (friendsToFollowersRatio - 0.6))
    console.log('mass:', mass);
    mass = mass / Math.exp(5.0 * (friendsToFollowersRatio - 0.6));
    console.log('mass-', Math.exp(5.0 * (friendsToFollowersRatio - 0.6)));
  }
 


  // 将调整后的 mass 格式化为字符串并赋值回 userMass
  userMass = mass.toFixed(2);
  console.log('friendsToFollowersRatio:', friendsToFollowersRatio);

  // 发送数据到 popup
  chrome.runtime.sendMessage({
    type: 'followersCountUpdated',
    followersCount,
    followingCount,
    creationTime,
    daysSinceCreation,
    isVerified,
    userMass, // 发送信誉值
    currentUrl // 发送当前网页地址
  });
}
