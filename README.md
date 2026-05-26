# Screen Reframe

화면1의 특정 영역만 화면2에서 확대/재렌더링해서 보여주는 **크로스플랫폼 개념 MVP**입니다.

## What it does
- 전체 화면 미니맵을 보여줍니다.
- 흰색 사각형으로 현재 선택된 영역을 표시합니다.
- 미니맵을 드래그하면 메인 뷰가 즉시 그 영역으로 바뀝니다.
- 메인 뷰에서 마우스 휠로 줌을 조절할 수 있습니다.
- 키보드 방향키, 숫자 키, `F` 키로 빠르게 제어할 수 있습니다.

## Why this exists
실제 목표는 다음과 같습니다.
- macOS / Windows / 모바일 / 웹에서
- 원본 화면 또는 창의 일부를
- 사용자가 선택한 영역만 빠르게 확대해서
- 더 잘 보이게 하는 것

이 저장소는 그 아이디어를 검증하기 위한 UI/UX 및 상호작용 프로토타입입니다.

## Demo behavior
- `Screen 1`은 캔버스로 시뮬레이션된 가상 화면입니다.
- `Screen 2`는 그 가상 화면의 crop을 전체 화면으로 다시 보여줍니다.
- 오른쪽 아래 미니맵은 전체 영역과 선택 박스를 표시합니다.

## Controls
- **중앙 보기**: 가운데로 이동
- **좌상단 / 우하단 / 세부 영역**: 프리셋 선택
- **Auto Scan**: 자동으로 선택 영역을 움직이는 데모 모드
- **Zoom**: 확대 비율 조절
- **미니맵 드래그**: 영역 재지정
- **마우스 휠**: 확대/축소
- **방향키**: 영역 이동
- **+ / -**: 줌 조절
- **F**: Auto Scan 토글

## Future work
실제 제품화 단계에서는 각 플랫폼 API를 연결해야 합니다.
- **macOS**: ScreenCaptureKit
- **Windows**: Desktop Duplication API
- **iOS**: ReplayKit
- **Android**: MediaProjection
- **웹**: getDisplayMedia / WebRTC 기반 공유

## Local preview
브라우저로 `index.html`을 열면 바로 실행됩니다.
