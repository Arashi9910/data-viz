import Head from 'next/head';
import Link from 'next/link';
import styles from '../styles/Home.module.css';

export default function Home() {
  return (
    <div className={styles.container}>
      <Head>
        <title>商品優化數據儀表板</title>
        <meta name="description" content="商品銷售數據分析和視覺化工具" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main className={styles.main}>
        <h1 className={styles.title}>
          歡迎使用<br />商品優化數據儀表板
        </h1>

        <p className={styles.description}>
          數據視覺化和分析工具
        </p>

        <div className={styles.grid}>
          <Link href="/sheet-data" className={styles.card}>
            <h2>商品數據分析 &rarr;</h2>
            <p>查看銷售數據、品牌比較和動銷率分析</p>
          </Link>

          <Link href="/sheet-data?debug=true" className={styles.card}>
            <h2>調試模式 &rarr;</h2>
            <p>使用調試模式查看更多詳細數據資訊</p>
          </Link>
        </div>
        
        <div className={styles.infoBox}>
          <h3>無痕模式訪問說明</h3>
          <p>如果您在無痕模式下無法訪問，請嘗試:</p>
          <ul>
            <li>直接訪問 <a href="/sheet-data" style={{color: 'blue', textDecoration: 'underline'}}>/sheet-data</a> 頁面</li>
            <li>使用非無痕模式訪問</li>
            <li>清除瀏覽器快取後再試</li>
          </ul>
        </div>
      </main>

      <footer className={styles.footer}>
        <p>數據儀表板 | 版本 1.0.3</p>
      </footer>
    </div>
  );
} 