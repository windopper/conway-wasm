# Conway's Game of Life - WebAssembly

Rust와 WebAssembly를 사용하여 구현한 Conway의 생명 게임입니다.

## 기술 스택
- React + Tailwind CSS / Rust + WebAssembly (wasm-bindgen)
- **Build Tool**: Webpack + wasm-pack

## 주요 기능

- Conway의 생명 게임 규칙 구현
- 실시간 시뮬레이션 및 렌더링
- 다크모드 지원
- 패턴 선택 및 배치 기능
- 속도 조절 및 일시정지
- 반응형 디자인

## 개발 환경 설정

### 필수 요구사항

- Rust (최신 버전)
- Node.js (v16 이상)
- wasm-pack

### 설치 및 실행

1. 의존성 설치
```bash
npm install
```

2. WebAssembly 빌드
```bash
npm run build:wasm
```

3. 개발 서버 실행
```bash
npm run dev
```

### 빌드

프로덕션 빌드:
```bash
npm run build:wasm
npm run build
```

## 프로젝트 구조

```
conway-wasm/
├── src/
│   ├── lib.rs          # Rust WebAssembly 코드
│   ├── App.jsx         # React 메인 컴포넌트
│   ├── pattern/        # 게임 패턴 관련
│   └── ...
├── pkg/                # WebAssembly 빌드 결과물
└── dist/               # 웹팩 빌드 결과물
```

## Conway의 생명 게임 규칙

1. 살아있는 셀은 2개 또는 3개의 이웃이 있으면 다음 세대에도 살아남습니다
2. 살아있는 셀은 1개 이하 또는 4개 이상의 이웃이 있으면 죽습니다
3. 죽어있는 셀은 정확히 3개의 이웃이 있으면 다음 세대에 살아납니다

## 라이선스

MIT License
