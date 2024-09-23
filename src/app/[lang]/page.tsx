// /app/page.tsx (サーバーサイドコンポーネント)
import dynamic from 'next/dynamic';
import { getDictionary } from '../../get-dictionary';
import { Locale } from '../../i18n-config';

// クライアントサイドの App コンポーネントを動的にインポート
const ClientApp = dynamic(() => import('./client-app'), { ssr: false });

export default async function Page({ params: { lang } }: { params: { lang: Locale } }) {
  const dictionary = await getDictionary(lang); // サーバー側で辞書データを取得

  return (
    <div>
      <title>{dictionary["server-component"]?.title}</title>   
        <meta name="description" content={dictionary["server-component"]?.description} />
        <meta name="keywords" content={dictionary["server-component"]?.keywords} />
        <meta name="robots" content="index, follow" />
        <meta property="og:title" content={dictionary["server-component"]?.ogTitle} />
        <meta property="og:description" content={dictionary["server-component"]?.ogDescription} />
        <meta property="og:image" content="https://voice-mix.heartstat.net/logo192.png" />
        <meta property="og:url" content="https://voice-mix.heartstat.net" />
        <meta name="twitter:card" content="summary_large_image" />    
      <ClientApp dictionary={dictionary} lang={lang} />
    </div>
  );
}
