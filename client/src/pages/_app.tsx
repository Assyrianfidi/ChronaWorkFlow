import "../styles/globals.css";
import type { AppProps } from "next/app";
import { SessionProvider } from '../components/providers/SessionProvider.js';

export default function App({
  Component,
  pageProps: { session, ...pageProps },
}: AppProps) {
  return (
    <SessionProvider session={session}>
      <Component {...pageProps} />
    </SessionProvider>
  );
}
