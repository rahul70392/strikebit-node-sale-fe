import "react-toastify/dist/ReactToastify.css";
import "@rainbow-me/rainbowkit/styles.css";
import "../assets/styles/styles.scss";

import type {AppProps} from "next/app";
import Head from "next/head";
import { Bai_Jamjuree } from 'next/font/google'
import {ToastContainer} from "react-toastify";
import localFont from 'next/font/local'
import React from "react";
import {HeaderSEO} from "@/components/main-layout/HeaderSEO";
import {MainLayout} from "@/components/main-layout/MainLayout";

const baiJamjureeFont = Bai_Jamjuree({
  weight: ['400', '500', '600', '700'],
  style: ['normal', 'italic'],
  subsets: ['latin', 'latin-ext'],
  display: 'swap',
});

function ToastInitializer() {
  return <>
    <ToastContainer
      position="top-center"
      autoClose={3500}
      hideProgressBar={true}
      newestOnTop={true}
      closeOnClick
      rtl={false}
      theme="colored"
    />
  </>
}

export default function MyApp(appProps: AppProps) {
  const {Component, pageProps} = appProps;

  return (
    <>
      <Head>
        <title>DistriBrain</title>
        <HeaderSEO/>
      </Head>

      <style jsx global>{`
          html {
            --font-primary: ${baiJamjureeFont.style.fontFamily};
          }
      `}</style>

      <MainLayout>
        <Component {...pageProps} />
      </MainLayout>

      <ToastInitializer/>
    </>
  );
}


