import "react-toastify/dist/ReactToastify.css";
import "@rainbow-me/rainbowkit/styles.css";
import "../assets/styles/styles.scss";

import type {AppProps} from "next/app";
import Head from "next/head";
import {ToastContainer} from "react-toastify";
import localFont from 'next/font/local'
import React from "react";
import {HeaderSEO} from "@/components/main-layout/HeaderSEO";
import {MainLayout} from "@/components/main-layout/MainLayout";

const gilroyFont = localFont({
  src: [
    {
      path: '../assets/fonts/gilroy/Gilroy-Light.woff',
      weight: '300',
      style: 'normal',
    },
    {
      path: '../assets/fonts/gilroy/Gilroy-Regular.woff',
      weight: '400',
      style: 'normal',
    },
    {
      path: '../assets/fonts/gilroy/Gilroy-Medium.woff',
      weight: '500',
      style: 'normal',
    },
    {
      path: '../assets/fonts/gilroy/Gilroy-Bold.woff',
      weight: '700',
      style: 'normal',
    },
    {
      path: '../assets/fonts/gilroy/Gilroy-Heavy.woff',
      weight: '900',
      style: 'normal',
    },
  ],
});

function ToastInitializer() {
  return <>
    <ToastContainer
      position="top-center"
      autoClose={5000}
      hideProgressBar={true}
      newestOnTop={true}
      closeOnClick
      rtl={false}
      theme="dark"
    />
  </>
}

export default function MyApp(appProps: AppProps) {
  const {Component, pageProps} = appProps;

  return (
    <>
      <Head>
        <title>Droplet Social</title>
        <HeaderSEO/>
      </Head>

      <style jsx global>{`
          html {
              --font-gilroy: ${gilroyFont.style.fontFamily};
          }
      `}</style>

      <MainLayout>
        <Component {...pageProps} />
      </MainLayout>

      <ToastInitializer/>
    </>
  );
}


