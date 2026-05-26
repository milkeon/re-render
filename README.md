# re:render

`re:render`는 *실행 중인 실제 창*을 골라서, 그 화면 일부를 미니맵에서 다시 잘라 크게 보여주는 데스크톱 앱입니다.

## 한줄 사용법
1. 앱을 연다
2. 왼쪽 상단 버튼에서 창을 고른다
3. 오른쪽 아래 미니맵에서 **클릭 + 드래그**로 보고 싶은 영역을 다시 잡는다
4. 가운데 큰 화면에서 선택한 부분을 확인한다

## 무엇을 하는 앱인가
- 실제 실행 중인 창만 보여줌
- 가짜 프리셋 창은 사용하지 않음
- 선택한 창의 썸네일을 보여줌
- 미니맵은 이동이 아니라 **새 영역 선택** 용도
- 선택한 영역을 메인 화면에 크게 다시 렌더링함

## 기술 구성
- Electron
- JavaScript 렌더러
- `preload.js`의 네이티브 브리지
- Canvas 기반 메인 화면 / 미니맵 렌더링

## 로컬 실행
```bash
cd /home/ubuntu/projects/screen-reframe
npm install
npm start
```

## 패키징
```bash
npm run package
```

완료되면 로컬 빌드는 다음 위치에 생성됩니다.
- `dist/linux-unpacked/`

GitHub Releases에는 Windows EXE와 Mac DMG/ZIP가 올라갑니다.

## 참고
- 앱 자신은 창 목록에서 제외됩니다.
- 현재 구조는 실제 창 썸네일을 기준으로 동작합니다.
- 미니맵은 드래그로 영역을 다시 잡는 선택 도구입니다.
