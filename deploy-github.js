const fs = require('fs');
const { execSync } = require('child_process');

// 確保 .nojekyll 文件存在（這告訴 GitHub Pages 不要使用 Jekyll 處理）
fs.writeFileSync('./out/.nojekyll', '');

// 創建 CNAME 文件（如果需要自定義域名）
// fs.writeFileSync('./out/CNAME', 'yourdomain.com');

try {
  // 初始化 Git 並提交靜態文件
  console.log('部署到 GitHub Pages...');
  execSync('git init out', { stdio: 'inherit' });
  execSync('cd out && git add .', { stdio: 'inherit' });
  execSync('cd out && git commit -m "Deploy to GitHub Pages"', { stdio: 'inherit' });
  
  // 獲取當前時間作為分支名稱，以避免衝突
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const branchName = `gh-pages-${timestamp}`;
  
  // 創建新分支並推送到 GitHub
  execSync(`cd out && git checkout -b ${branchName}`, { stdio: 'inherit' });
  
  // 這裡需要替換為您的 GitHub 倉庫 URL
  console.log('請手動運行以下命令將靜態站點推送到 GitHub：');
  console.log('\ncd out');
  console.log(`git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO.git`);
  console.log(`git push -f origin ${branchName}:gh-pages\n`);
  
  console.log('然後在 GitHub 倉庫設置中啟用 GitHub Pages，選擇 gh-pages 分支作為源。');
  console.log('您的網站將在幾分鐘後可以訪問。');
  
} catch (error) {
  console.error('部署過程中出錯：', error);
} 