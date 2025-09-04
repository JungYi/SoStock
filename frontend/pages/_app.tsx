import type { AppProps } from 'next/app';
import { Toaster } from 'react-hot-toast';
import '../src/styles/globals.css';
import Layout from '../components/Layout';

export default function MyApp({ Component, pageProps }: AppProps) {
  // 페이지에서 Layout을 끄고 싶다면: (Component as any).noLayout = true;
  // 지금은 전 페이지 공통으로 Layout 적용
  return (
    <Layout>
      <Component {...pageProps} />
      <Toaster position="top-center" reverseOrder={false} />
    </Layout>
  );
}