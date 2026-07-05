const CACHE='kintaro-v11';
const ASSETS=['./','index.html','manifest.webmanifest',
  'hero.png','hero1.png','hero2.png','coin.png','rock.png','stump.png','crash.png',
  'hero_star.png','hero_star1.png','hero_star2.png',
  'title.png','board.png','result.png',
  'icon-192.png','icon-512.png','icon-180.png'];

self.addEventListener('install',e=>{
  // 個別にキャッシュ（1つ欠けても全体が失敗しないよう allSettled）
  e.waitUntil(caches.open(CACHE).then(c=>Promise.allSettled(ASSETS.map(a=>c.add(a)))).then(()=>self.skipWaiting()));
});
self.addEventListener('activate',e=>{
  e.waitUntil(caches.keys().then(keys=>
    Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k)))
  ).then(()=>self.clients.claim()));
});

// Network-first: オンラインなら常に最新、オフラインはキャッシュで動く
// ページ本体(index.html)はブラウザのHTTPキャッシュも飛ばして必ず最新を取りに行く
self.addEventListener('fetch',e=>{
  if(e.request.method!=='GET')return;
  const isPage = e.request.mode==='navigate' || e.request.url.indexOf('index.html')>=0;
  const req = isPage ? new Request(e.request.url, {cache:'no-store'}) : e.request;
  e.respondWith(
    fetch(req).then(res=>{
      if(res && res.ok){
        const copy=res.clone();
        caches.open(CACHE).then(c=>c.put(e.request,copy)).catch(()=>{});
      }
      return res;
    }).catch(()=>caches.match(e.request).then(hit=>hit||caches.match('index.html')))
  );
});
