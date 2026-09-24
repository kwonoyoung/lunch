# TMAP 연결 설정

현재 GitHub Pages 프론트엔드는 TMAP AppKey를 공개 저장소에 넣지 않도록 Cloudflare Worker 프록시 방식으로 구성되어 있습니다.

## 1. Cloudflare Worker 만들기

Cloudflare Dashboard → Workers & Pages → Create → Worker 생성

저장소의 `worker.js` 내용을 Worker 코드에 붙여넣고 배포합니다.

## 2. TMAP AppKey를 Secret으로 저장

Worker → Settings → Variables and Secrets → Add → **Secret**

- Name: `TMAP_APP_KEY`
- Value: 발급받은 TMAP AppKey

AppKey는 `index.html`, README, GitHub Actions 로그 등에 직접 넣지 마세요.

## 3. Worker 주소 연결

배포 후 주소 예:

`https://lunch-tmap-proxy.<계정>.workers.dev`

`index.html` 아래 줄을 실제 주소로 바꿉니다.

```js
const WORKER_URL='https://YOUR-WORKER.workers.dev';
```

## 4. 동작

현재 위치 → Worker `/pois` → TMAP POI 통합검색 → 반경 내 후보 정리 → 브라우저에서 한 곳 랜덤 추천

지원 UI: 300m~2km 반경, 점심/저녁/커피, 음식 종류, 다시 뽑기, TMAP/네이버지도 링크.

※ `영업 중만` 스위치는 UI만 준비되어 있으며 TMAP 응답에서 신뢰 가능한 영업 상태를 확인한 뒤 필터를 적용하는 것이 안전합니다.
