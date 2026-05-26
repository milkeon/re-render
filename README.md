# re:render

화면 / 프로그램을 선택해서, 그 내용을 크게 다시 보여주는 **단순한 개념 MVP**입니다.

## What it does
- 하나의 버튼으로 보여줄 화면/프로그램을 선택합니다.
- 미니맵에서 현재 보고 있는 영역을 드래그로 다시 잡을 수 있습니다.
- 선택한 대상에 따라 메인 뷰의 내용과 분위기가 바뀝니다.

## Why this exists
실제 목표는 다음과 같습니다.
- macOS / Windows / 모바일 / 웹에서
- 특정 화면이나 프로그램의 일부를
- 원하는 만큼 크게 다시 보여주기

이 저장소는 그 아이디어를 검증하기 위한 단순한 UI/UX 프로토타입입니다.

## Demo behavior
- 메인 캔버스는 선택한 화면/프로그램의 상태를 시뮬레이션합니다.
- 오른쪽 아래 미니맵은 전체 영역과 현재 선택 박스를 보여줍니다.
- 왼쪽 상단의 단일 버튼으로 보여줄 대상을 고릅니다.

## Controls
- **보여줄 화면 / 프로그램**: 단일 선택 버튼
- **미니맵 드래그**: 영역 재지정
- **방향키**: 영역 이동
- **+ / -**: 확대/축소
- **Esc**: 선택 메뉴 닫기

## Future work
실제 제품화 단계에서는 각 플랫폼 API를 연결해야 합니다.
- **macOS**: ScreenCaptureKit
- **Windows**: Desktop Duplication API
- **iOS**: ReplayKit
- **Android**: MediaProjection
- **웹**: getDisplayMedia / WebRTC 기반 공유

## Local preview
브라우저로 `index.html`을 열면 바로 실행됩니다.

### Option A: 직접 열기
- 파일 탐색기에서 `index.html`을 더블클릭
- 또는 브라우저에 `file:///home/ubuntu/projects/screen-reframe/index.html` 입력

### Option B: 로컬 웹서버로 열기
```bash
cd /home/ubuntu/projects/screen-reframe
python3 -m http.server 8000
```
그 다음 `http://localhost:8000` 을 엽니다.

## Verification
아래 항목을 브라우저로 확인했습니다.
- 단일 버튼이 보이고 선택 메뉴가 열림
- 미니맵 드래그로 선택 영역 변경
- 선택한 대상이 메인 뷰에 반영됨
- `+ / -` 키로 확대 비율이 변경됨

### Observed result
- 로컬 `index.html`에서 정상 렌더링 확인
- GitHub Pages 배포본에서도 동일한 UI 타이틀과 상호작용 확인
- 배포 URL: https://milkeon.github.io/screen-re-render/

## Repo hygiene
- 의미 있는 프로젝트명: `re-render`
- 메인 소스가 루트 `index.html`과 `README.md`로 분명하게 구성됨
- 별도 빌드 없이 재현 가능한 단일 페이지 MVP
