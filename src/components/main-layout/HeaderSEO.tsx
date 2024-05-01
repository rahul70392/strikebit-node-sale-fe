import React from "react";

export function HeaderSEO() {
  return <>
    <meta charSet="utf-8"/>
    <meta name="viewport" content="width=device-width, initial-scale=1"/>

    <meta
      name="description"
      content="Droplet Social is an all-in-one social networking platform prioritizing content-creators"
    />

    <link rel="apple-touch-icon" sizes="152x152" href="/apple-touch-icon.png"/>
    <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png"/>
    <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png"/>
    <link rel="manifest" href="/site.webmanifest"/>
    <link rel="mask-icon" href="/safari-pinned-tab.svg" color="#070321"/>
    <meta name="msapplication-TileColor" content="#da532c"/>
    <meta name="theme-color" content="#ffffff"/>

    <meta property="og:title" content="Droplet Social"/>
    <meta property="og:description" content="Droplet Social is an all-in-one social networking platform prioritizing content-creators"/>
    <meta property="og:type" content="website"/>
    <meta property="og:image" content="/og-thumb.png"/>
    <meta property="og:width" content="1200"/>
    <meta property="og:height" content="630"/>

    <meta name="twitter:card" content="summary_large_image"/>
    <meta name="twitter:site" content="@DropletSocial"/>
    <meta name="twitter:title" content="Droplet Social"/>
    <meta name="twitter:description" content="Droplet Social is an all-in-one social networking platform prioritizing content-creators"/>
    <meta name="twitter:image" content="/og-thumb.png"/>
  </>
}