# 검증 로그

## Electron 빌드
- `node --check main.js`
- `node --check preload.js`
- `node --check renderer.js`
- `npm run package`
- 결과물은 `dist/linux-unpacked/` 에 생성됨

## 실행 확인
- `npm start`는 처음에 호스트에 `libgtk-3.so.0` 이 없어서 실패함
- `apt-get` 으로 필요한 GTK 런타임 패키지를 설치함
- `xvfb-run -a npm start` 는 headless 디스플레이에서 정상 실행됨
- `xvfb-run -a ./dist/linux-unpacked/re-render` 도 실행되어 패키징본 부팅을 확인함

## 동작 확인
- 창 목록은 네이티브 브리지에서 가져옴
- 가짜 프리셋 창은 제거함
- 미니맵은 클릭+드래그로 새 영역을 지정함
- 메인 화면은 선택한 영역을 다시 렌더링함
