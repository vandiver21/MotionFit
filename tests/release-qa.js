// Evaluate on the served /MotionFit/ app in a temporary browser profile.
(async () => {
  const check = (ok, message) => { if(!ok) throw Error(message); };
  const registration = await navigator.serviceWorker.ready;
  check(registration.scope === new URL('./', location.href).href, 'Worker scope must follow the project path');
  check(navigator.serviceWorker.controller, 'App is not controlled');
  const names = await caches.keys();
  check(names.includes('motionfit-v1.0.0'), 'Release cache missing');
  check(!names.includes('motionfit-v0.9.1'), 'Old MotionFit cache survived upgrade');
  check(names.includes('unrelated-app-qa'), 'Unrelated cache was deleted');
  const cache = await caches.open('motionfit-v1.0.0');
  for(const path of ['./','index.html','css/styles.css','js/app.js','data/exercises.json','data/exercise-image-map.json','manifest.json','icons/icon-192.svg','icons/icon-512.svg']){
    const response = await cache.match(new URL(path,location.href));
    check(response?.ok, 'Missing shell entry: '+path);
  }
  const manifestResponse = await fetch('manifest.json');
  const manifest = await manifestResponse.json();
  for(const property of ['start_url','scope']) check(new URL(manifest[property], manifestResponse.url).pathname === '/MotionFit/', 'Manifest '+property);
  for(const icon of manifest.icons){const r=await fetch(new URL(icon.src,manifestResponse.url));check(r.ok && r.headers.get('content-type').includes('image/svg+xml'),'Manifest icon');}
  const missing = await fetch('assets/exercises/repdb/qa-missing.webp');
  check(missing.status===404, 'Missing image should remain a 404');
  check(!await cache.match(new URL('assets/exercises/repdb/qa-missing.webp',location.href)), '404 cached');
  const exercise=exerciseCatalog.find(e=>e.id==='goblet-squat');
  const response=await fetch(exercise.imageStart);
  check(response.ok && response.headers.get('content-type').includes('image/webp'), 'Image MIME');
  check(await cache.match(new URL(exercise.imageStart,location.href)), 'Loaded image not cached');
  return 'PASS: project scope, upgrade, unrelated cache preservation, 9 shell entries, manifest URLs/icons, 404 handling and runtime image caching';
})()
