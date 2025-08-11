import type { AppProps } from 'next/app';
import { Toaster } from 'react-hot-toast';
import '../src/styles/globals.css';

export default function MyApp({ Component, pageProps }: AppProps) {
  return (
    <>
      <Component {...pageProps} />
      <Toaster position="top-center" reverseOrder={false} />
    </>
  );
}