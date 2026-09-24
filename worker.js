export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const origin = request.headers.get('Origin') || '';
    const allowed = ['https://kwonoyoung.github.io','http://localhost:8000','http://127.0.0.1:8000'];
    const cors = {
      'Access-Control-Allow-Origin': allowed.includes(origin) ? origin : 'https://kwonoyoung.github.io',
      'Access-Control-Allow-Methods': 'GET,OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type'
    };
    if (request.method === 'OPTIONS') return new Response(null,{headers:cors});
    if (url.pathname !== '/pois') return new Response('Not found',{status:404,headers:cors});
    if (!env.TMAP_APP_KEY) return Response.json({error:'TMAP_APP_KEY secret is missing'},{status:500,headers:cors});

    const lat = Number(url.searchParams.get('lat'));
    const lon = Number(url.searchParams.get('lon'));
    const radiusM = Math.max(300, Math.min(2000, Number(url.searchParams.get('radius') || 1000)));
    const meal = url.searchParams.get('meal') || '점심';
    const genre = url.searchParams.get('genre') || '';
    if (!Number.isFinite(lat) || !Number.isFinite(lon)) return Response.json({error:'invalid coordinates'},{status:400,headers:cors});

    const keywords = genre ? [genre] : (meal === '커피' ? ['카페','커피'] : ['음식점','한식','일식','중식','분식','고기']);
    const found = new Map();

    for (const kw of keywords) {
      const api = new URL('https://apis.openapi.sk.com/tmap/pois');
      api.searchParams.set('version','1');
      api.searchParams.set('format','json');
      api.searchParams.set('searchKeyword',kw);
      api.searchParams.set('centerLon',String(lon));
      api.searchParams.set('centerLat',String(lat));
      api.searchParams.set('radius',String(Math.max(1,Math.ceil(radiusM/1000))));
      api.searchParams.set('page','1');
      api.searchParams.set('count','100');
      api.searchParams.set('reqCoordType','WGS84GEO');
      api.searchParams.set('resCoordType','WGS84GEO');
      const r = await fetch(api,{headers:{accept:'application/json',appKey:env.TMAP_APP_KEY}});
      if (!r.ok) continue;
      const j = await r.json();
      const arr = j?.searchPoiInfo?.pois?.poi || [];
      for (const p of arr) {
        const plat = Number(p.noorLat || p.frontLat || p.lat);
        const plon = Number(p.noorLon || p.frontLon || p.lon);
        if (!Number.isFinite(plat) || !Number.isFinite(plon)) continue;
        const d = distance(lat,lon,plat,plon);
        if (d > radiusM) continue;
        const name = p.name || p.bizName || '';
        const key = p.id || `${name}:${plat}:${plon}`;
        const address = [p.upperAddrName,p.middleAddrName,p.lowerAddrName,p.detailAddrName].filter(Boolean).join(' ');
        const category = [p.upperBizName,p.middleBizName,p.lowerBizName,p.detailBizName].filter(Boolean).join(' > ');
        found.set(key,{id:key,name,lat:plat,lon:plon,distance:d,address,category,
          tmapUrl:`https://www.tmap.co.kr/tmap2/mobile/route.jsp?name=${encodeURIComponent(name)}&lon=${plon}&lat=${plat}`});
      }
    }
    const places = [...found.values()].sort((a,b)=>a.distance-b.distance);
    return Response.json({places},{headers:{...cors,'Cache-Control':'public, max-age=120'}});
  }
}
function distance(a,b,c,d){const R=6371000,toRad=x=>x*Math.PI/180,dp=toRad(c-a),dl=toRad(d-b),q=Math.sin(dp/2)**2+Math.cos(toRad(a))*Math.cos(toRad(c))*Math.sin(dl/2)**2;return 2*R*Math.asin(Math.sqrt(q))}
