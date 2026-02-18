# 웹 디자인 가이드라인

> 휴네시온 3개년 통합 실적 분석 페이지 기준 디자인 시스템

---

## 1. 기본 설정

### 폰트
```css
font-family: 'Noto Sans KR', sans-serif;
```

```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@300;400;500;700&display=swap" rel="stylesheet">
```

### 배경색
```css
background-color: #f1f5f9; /* Slate 100 */
```

---

## 2. 색상 팔레트

### 기본 색상 (Tailwind CSS)
| 용도 | 색상 코드 | Tailwind 클래스 |
|------|-----------|-----------------|
| 배경 | `#f1f5f9` | `bg-slate-100` |
| 주요 텍스트 | `#1e293b` | `text-slate-800` |
| 보조 텍스트 | `#64748b` | `text-slate-500` |
| 비활성 텍스트 | `#94a3b8` | `text-slate-400` |
| 테두리 | `#e2e8f0` | `border-slate-200` |
| 테두리 (진함) | `#cbd5e1` | `border-slate-300` |

### 강조 색상
| 용도 | 색상 코드 | Tailwind 클래스 |
|------|-----------|-----------------|
| Primary (파랑) | `#3b82f6` | `bg-blue-500` |
| Primary Dark | `#2563eb` | `bg-blue-600` |
| Indigo | `#4f46e5` | `bg-indigo-600` |
| Indigo Dark | `#4338ca` | `bg-indigo-700` |
| 성공 (녹색) | `#10b981` | `text-emerald-500` |
| 경고 (주황) | `#f59e0b` | `text-amber-500` |
| 위험 (빨강) | `#f43f5e` | `text-rose-500` |

### 산업 부문별 색상
```javascript
const sectorColors = {
    "공공": "#64748b",      // Slate 500
    "발전자회사": "#84cc16", // Lime 500
    "국방": "#1e293b",      // Slate 800
    "방산": "#15803d",      // Green 700
    "지자체": "#0ea5e9",    // Sky 500
    "금융": "#3b82f6",      // Blue 500
    "기업": "#f43f5e",      // Rose 500
    "한전": "#f59e0b",      // Amber 500
    "클라우드": "#8b5cf6",  // Violet 500
    "교육,병원": "#d946ef", // Fuchsia 500
    "유지보수": "#10b981",  // Emerald 500
    "기타": "#94a3b8"       // Slate 400
};
```

---

## 3. 카드 컴포넌트

### 기본 카드
```css
.card {
    background: white;
    border-radius: 12px;
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
}
```

```html
<div class="card p-6">
    <!-- 카드 내용 -->
</div>
```

### 상단 테두리 강조 카드
```html
<!-- 과거 데이터 -->
<div class="card p-5 border-t-4 border-slate-400">

<!-- 성장 데이터 -->
<div class="card p-5 border-t-4 border-blue-400">

<!-- 현재 데이터 (강조) -->
<div class="card p-5 border-t-4 border-indigo-600 shadow-lg">

<!-- Top 5 카드들 -->
<div class="card p-6 border-t-4 border-blue-500">    <!-- 매출 -->
<div class="card p-6 border-t-4 border-indigo-500"> <!-- 이익 -->
<div class="card p-6 border-t-4 border-emerald-500"> <!-- 성장 -->
<div class="card p-6 border-t-4 border-rose-500">   <!-- 하락 -->
```

---

## 4. 버튼 스타일

### 메트릭 토글 버튼
```css
.metric-btn {
    transition: all 0.3s;
}

.metric-btn.active {
    background-color: #1e293b;
    color: white;
    transform: scale(1.05);
    box-shadow: 0 4px 12px rgba(30, 41, 59, 0.2);
}

.metric-btn:not(.active) {
    background-color: white;
    color: #64748b;
    border: 1px solid #cbd5e1;
}

.metric-btn:not(.active):hover {
    background-color: #f8fafc;
}
```

```html
<div class="flex bg-slate-100 p-1 rounded-xl">
    <button class="metric-btn active px-6 py-2 rounded-lg font-bold text-sm">
        매출액 보기
    </button>
    <button class="metric-btn px-6 py-2 rounded-lg font-bold text-sm ml-2">
        매출이익 보기
    </button>
</div>
```

### 필터 버튼
```css
.filter-btn {
    transition: all 0.2s;
    font-size: 0.85rem;
}

.filter-btn.active {
    background-color: #3b82f6;
    color: white;
    border-color: #3b82f6;
    font-weight: 600;
}

.filter-btn:not(.active) {
    background-color: white;
    color: #64748b;
    border: 1px solid #e2e8f0;
}

.filter-btn:not(.active):hover {
    background-color: #f1f5f9;
}
```

```html
<div class="flex bg-white rounded-lg shadow-sm border p-1">
    <button class="filter-btn active px-4 py-1.5 rounded">전체 보기</button>
    <button class="filter-btn px-4 py-1.5 rounded ml-1">성장률 Top 5</button>
    <button class="filter-btn px-4 py-1.5 rounded ml-1">하락률 Top 5</button>
</div>
```

### 탭 버튼
```css
.tab-btn.active {
    background-color: #2563eb;
    color: white;
    border-color: #2563eb;
}
```

```html
<div class="flex space-x-1">
    <button class="tab-btn px-4 py-1.5 bg-white border border-slate-300 text-slate-600 text-sm rounded-l-lg hover:bg-slate-50">
        2023
    </button>
    <button class="tab-btn px-4 py-1.5 bg-white border border-slate-300 text-slate-600 text-sm hover:bg-slate-50">
        2024
    </button>
    <button class="tab-btn active px-4 py-1.5 bg-indigo-600 border border-indigo-600 text-white text-sm rounded-r-lg hover:bg-indigo-700">
        2025
    </button>
</div>
```

### 텍스트 링크 버튼
```html
<button class="text-xs text-blue-500 hover:text-blue-700 underline">
    상세보기
</button>
```

---

## 5. 배지/태그

### 상태 배지
```html
<!-- 과거 -->
<span class="bg-slate-100 text-slate-600 text-xs font-semibold px-2 py-1 rounded">
    Past
</span>

<!-- 성장 -->
<span class="bg-blue-50 text-blue-600 text-xs font-semibold px-2 py-1 rounded">
    Growth
</span>

<!-- 현재 -->
<span class="bg-indigo-100 text-indigo-700 text-xs font-semibold px-2 py-1 rounded">
    Current
</span>
```

### 섹터 레전드 버튼
```html
<button class="flex items-center px-3 py-1 rounded-full text-xs font-bold transition-all opacity-100 ring-2 ring-offset-1"
    style="background-color: #3b82f620; color: #3b82f6; border: 1px solid #3b82f6;">
    <span class="w-2 h-2 rounded-full mr-2" style="background-color: #3b82f6"></span>
    금융
</button>
```

---

## 6. 테이블 스타일

```html
<table class="w-full text-sm text-left text-slate-600">
    <thead class="text-xs text-slate-700 uppercase bg-slate-50">
        <tr>
            <th class="px-6 py-3 rounded-l-lg">산업 부문</th>
            <th class="px-6 py-3 text-right cursor-pointer hover:bg-slate-100">
                매출액 (백만원) <span>▼</span>
            </th>
            <!-- ... -->
            <th class="px-6 py-3 text-right rounded-r-lg">매출이익비중 (%)</th>
        </tr>
    </thead>
    <tbody>
        <tr class="bg-white border-b hover:bg-slate-50 transition">
            <td class="px-6 py-4 font-medium text-slate-900">공공</td>
            <td class="px-6 py-4 text-right">10,760</td>
            <td class="px-6 py-4 text-right font-bold text-slate-800">6,500</td>
            <td class="px-6 py-4 text-right">
                <span class="text-green-600 font-bold">60%</span>
            </td>
            <td class="px-6 py-4 text-right text-indigo-600 font-medium">15.2%</td>
        </tr>
    </tbody>
</table>
```

### 조건부 색상 (이익률 기준)
```javascript
// 90% 이상: 녹색 강조
className = 'text-green-600 font-bold'

// 50% 이하: 주황색
className = 'text-orange-500'

// 기본
className = 'text-slate-600'
```

---

## 7. 모달

```html
<div class="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center">
    <div class="relative p-5 border w-[500px] shadow-lg rounded-md bg-white">
        <!-- 헤더 -->
        <div class="flex justify-between items-center mb-4 border-b pb-2">
            <h3 class="text-xl font-bold text-slate-800">전체 순위</h3>
            <button class="text-slate-400 hover:text-slate-600 font-bold text-xl">&times;</button>
        </div>

        <!-- 콘텐츠 -->
        <div class="max-h-[60vh] overflow-y-auto">
            <ul class="space-y-2">
                <!-- 리스트 아이템 -->
            </ul>
        </div>

        <!-- 푸터 -->
        <div class="mt-4 text-right">
            <button class="px-4 py-2 bg-slate-200 text-slate-700 rounded hover:bg-slate-300 transition">
                닫기
            </button>
        </div>
    </div>
</div>
```

---

## 8. 리스트 아이템

```html
<li class="flex justify-between items-center text-sm p-2 hover:bg-slate-50 rounded bg-white border border-slate-100 mb-1">
    <div class="flex items-center">
        <span class="w-6 h-6 flex items-center justify-center bg-slate-100 text-slate-500 rounded text-xs font-bold mr-3">
            1
        </span>
        <span class="text-slate-700 font-medium">공공</span>
    </div>
    <span class="font-bold text-slate-700">107.6억</span>
</li>
```

### 성장/하락 표시
```html
<!-- 성장 -->
<span class="text-emerald-600 font-bold">▲ 25.3%</span>

<!-- 하락 -->
<span class="text-rose-600 font-bold">▼ 12.5%</span>
```

---

## 9. 인풋 & 폼

### 비밀번호 입력
```html
<input type="password"
    placeholder="비밀번호 입력"
    class="w-full border p-3 rounded-lg mb-4 text-center text-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
```

### 에러 상태
```html
<input class="border-red-500 ring-2 ring-red-200">
<p class="text-red-500 text-sm mt-3">비밀번호가 일치하지 않습니다.</p>
```

### 폼 레이블
```html
<label class="block text-sm text-gray-600 mb-1">현재 비밀번호</label>
<input type="password" class="w-full border p-2 rounded focus:ring-2 focus:ring-blue-500 outline-none">
```

---

## 10. 오버레이

### 전체 화면 오버레이 (비밀번호 입력)
```html
<div class="fixed inset-0 bg-[#f1f5f9] z-[9999] flex items-center justify-center">
    <div class="bg-white p-8 rounded-2xl shadow-xl text-center w-[90%] max-w-[400px]">
        <h2 class="text-2xl font-bold text-slate-800 mb-2">보안 접속</h2>
        <p class="text-slate-500 text-sm mb-6">내용을 확인하려면 비밀번호를 입력하세요.</p>
        <!-- 폼 요소 -->
    </div>
</div>
```

---

## 11. 차트 스타일 (Chart.js)

### 막대 차트 색상
```javascript
// 2023년 (회색)
backgroundColor: '#cbd5e1'
borderColor: '#94a3b8'

// 2024년 (파랑)
backgroundColor: '#60a5fa'
borderColor: '#3b82f6'

// 2025년 (인디고)
backgroundColor: '#4f46e5'
borderColor: '#4338ca'
```

### 라인 차트
```javascript
// 점선 스타일
borderDash: [5, 5]
pointRadius: 3
pointBackgroundColor: '#fff'
tension: 0.4

// 강조 라인 (2025)
borderWidth: 3
pointRadius: 4
pointBorderColor: '#4338ca'
```

### 레전드 표시
```html
<div class="flex flex-wrap gap-4 text-xs font-medium text-slate-600">
    <div class="flex items-center">
        <span class="w-3 h-3 bg-slate-300 rounded mr-1"></span>2023
    </div>
    <div class="flex items-center">
        <span class="w-3 h-3 bg-blue-400 rounded mr-1"></span>2024
    </div>
    <div class="flex items-center">
        <span class="w-3 h-3 bg-indigo-600 rounded mr-1"></span>2025
    </div>
</div>
```

---

## 12. 레이아웃

### 페이지 컨테이너
```html
<body class="p-6">
    <div class="max-w-7xl mx-auto">
        <!-- 콘텐츠 -->
    </div>
</body>
```

### 반응형 그리드
```html
<!-- 3열 그리드 -->
<div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">

<!-- 4열 그리드 -->
<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">

<!-- 2열 그리드 -->
<div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
```

### 차트 높이
```html
<div class="relative h-[450px]">  <!-- 메인 차트 -->
<div class="relative h-[300px]">  <!-- 서브 차트 -->
```

---

## 13. 타이포그래피

### 제목
```html
<h1 class="text-3xl font-bold text-slate-800">페이지 제목</h1>
<h2 class="text-xl font-bold text-slate-800">섹션 제목</h2>
<h3 class="text-lg font-bold text-slate-800">카드 제목</h3>
```

### 부제목
```html
<p class="text-slate-500 mt-2">설명 텍스트</p>
<p class="text-sm text-slate-500 mt-1">작은 설명</p>
<p class="text-xs text-slate-500">아주 작은 설명</p>
```

### 레이블
```html
<div class="text-xs text-slate-400 mb-1">레이블</div>
```

### 강조 텍스트
```html
<span class="font-bold text-slate-800">강조 값</span>
<span class="font-semibold text-blue-600">링크 스타일</span>
<span class="font-bold text-indigo-700">프라이머리 강조</span>
```

---

## 14. 애니메이션 & 트랜지션

```css
transition: all 0.3s;      /* 버튼 전환 */
transition: all 0.2s;      /* 빠른 전환 */
transition               /* Tailwind 기본 */
```

### 호버 효과
```html
hover:bg-slate-50        /* 테이블 행 */
hover:bg-slate-100       /* 헤더 셀 */
hover:bg-blue-700        /* 버튼 */
hover:text-blue-700      /* 링크 */
```

---

## 15. 프린트 스타일

```html
<!-- 프린트 시 숨김 -->
<button class="no-print">비밀번호 변경</button>
<div class="no-print">...</div>
```

```css
@media print {
    .no-print {
        display: none !important;
    }
}
```

---

## 16. 외부 라이브러리

```html
<!-- Tailwind CSS -->
<script src="https://cdn.tailwindcss.com"></script>

<!-- Chart.js -->
<script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
<script src="https://cdn.jsdelivr.net/npm/chartjs-plugin-datalabels@2.0.0"></script>
```

---

## 17. 색상 조합 예시

### 데이터 카드 (요약)
- 배경: `white`
- 상단 테두리: `border-t-4 border-{color}-400`
- 제목: `text-slate-700`
- 값: `font-bold text-slate-800`
- 보조 텍스트: `text-slate-500 text-sm`
- 강조 값: `font-semibold text-blue-600`

### 차트 영역
- 배경: `white` (card)
- 제목: `text-slate-800 font-bold`
- Y축 그리드: `#f1f5f9`
- 막대: 연도별 그라데이션 (slate → blue → indigo)

### 테이블
- 헤더 배경: `bg-slate-50`
- 헤더 텍스트: `text-slate-700 uppercase text-xs`
- 행 배경: `bg-white`
- 행 테두리: `border-b`
- 호버: `hover:bg-slate-50`
