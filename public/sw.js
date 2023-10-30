// Copyright 2020-2022 SubQuery Pte Ltd authors & contributors
// SPDX-License-Identifier: Apache-2.0

importScripts('https://static.subquery.network/sw/workbox-sw.js');

workbox.setConfig({
  modulePathPrefix: 'https://static.subquery.network/sw',
});

// https://developers.google.com/web/tools/workbox/reference-docs/latest/workbox.routing#registerRoute
workbox.routing.registerRoute(
  //,
  /((localhost:3006)|((dev|kepler)\.thechaindata\.com)|(kepler.subquery.network))\/((dashboard)|(explorer)|(profile)|(indexer)|(delegator)|(consumer)|(swap)|(studio)).*/g,
  // https://developers.google.com/web/tools/workbox/reference-docs/latest/workbox.strategies
  new workbox.strategies.NetworkFirst({
    cacheName: 'workbox:html',
  }),
);

workbox.routing.registerRoute(
  /\.js(?!\.json)(?=\?|$)/,
  new workbox.strategies.CacheFirst({
    cacheName: 'workbox:js',
  }),
);

workbox.routing.registerRoute(
  /\.css/,
  new workbox.strategies.CacheFirst({
    cacheName: 'workbox:css',
  }),
);

workbox.routing.registerRoute(
  // Cache image files
  /.+\.(?:png|jpg|jpeg|svg|gif|ico)/,
  // Use the cache if it's available
  new workbox.strategies.StaleWhileRevalidate({
    // Use a custom cache name
    cacheName: 'workbox:image',
  }),
);
