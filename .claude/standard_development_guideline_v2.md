# Standard Development Guideline (v2.0) - Enhanced Edition

본 문서는 **Project A**의 소스 코드를 분석하여 도출된 표준 개발 가이드라인입니다. 향후 개발될 **Project B, Project C**에서도 본 가이드라인을 준수하여 일관성 있는 품질과 아키텍처를 유지해야 합니다.

**문서 버전**: v2.0 (2024년 12월 기준)  
**적용 범위**: 모든 신규/기존 프로젝트

---

## 📚 목차 (Table of Contents)

1. [디자인 시스템 및 UI 가이드](#1--디자인-시스템-및-ui-가이드-design-system)
2. [코딩 규칙 및 컨벤션](#2--코딩-규칙-및-컨벤션-coding-conventions)
3. [보안 규정 준수 사항](#3--보안-규정-준수-사항-security-best-practices)
4. [Firebase 설정 및 아키텍처](#4--firebase-설정-및-아키텍처-firebase-configuration)
5. [테스팅 전략](#5--테스팅-전략-testing-strategy)
6. [성능 최적화](#6--성능-최적화-performance-optimization)
7. [에러 처리 및 로깅](#7--에러-처리-및-로깅-error-handling--logging)
8. [배포 및 CI/CD](#8--배포-및-cicd-deployment--cicd)

---

## 1. 🎨 디자인 시스템 및 UI 가이드 (Design System)

### 1.1 Color Palette

`tailwind.config.js` 및 `index.css`에서 추출된 핵심 컬러 팔레트입니다.

| Category | Token Name | Hex Code (500/Main) | RGB | Usage |
|----------|------------|---------------------|-----|-------|
| **Primary** | `primary` | `#a855f7` (Purple) | `rgb(168, 85, 247)` | 메인 브랜드 컬러, 주요 액션 버튼, 링크 |
| **Accent** | `accent` | `#10b981` (Emerald) | `rgb(16, 185, 129)` | 성공 상태, 보조 강조 색상, 완료 표시 |
| **Danger** | `red` | `#ef4444` (Red) | `rgb(239, 68, 68)` | 삭제, 오류, 경고, 중요 알림 |
| **Warning** | `amber` | `#f59e0b` (Amber) | `rgb(245, 158, 11)` | 주의 메시지, 대기 상태 |
| **Info** | `blue` | `#3b82f6` (Blue) | `rgb(59, 130, 246)` | 정보 메시지, 도움말 |
| **Background** | `slate` | `#f8fafc` (Slate-50) | `rgb(248, 250, 252)` | 앱 배경 (Light mode) |
| **Surface** | `white` | `#ffffff` | `rgb(255, 255, 255)` | 카드, 모달 배경 |
| **Text-Primary** | `slate-900` | `#0f172a` | `rgb(15, 23, 42)` | 주요 텍스트 |
| **Text-Secondary** | `slate-600` | `#475569` | `rgb(71, 85, 105)` | 보조 텍스트, 설명 |

#### Color Shades (Scale)
각 컬러는 50~950 스케일을 가집니다:
- `50`: 가장 밝은 (배경/hover)
- `100-300`: 밝은 톤 (border, subtle background)
- `500`: 기본 컬러 (Default)
- `600-700`: 진한 톤 (Active state, Pressed)
- `900-950`: 가장 어두운 (Dark mode 배경)

**Global Styles (`index.css`):**
```css
/* Light Mode */
body {
  background: linear-gradient(to bottom right, 
    theme('colors.slate.50'), 
    theme('colors.purple.50/30%'), 
    theme('colors.slate.100')
  );
}

/* Dark Mode */
body.dark {
  background: linear-gradient(to bottom right, 
    theme('colors.gray.900'), 
    theme('colors.purple.950/20%'), 
    theme('colors.gray.900')
  );
}
```

### 1.2 Typography

#### Font Family
```css
font-family: 'Inter', 'Nanum Gothic', -apple-system, BlinkMacSystemFont, 
             'Segoe UI', 'Roboto', sans-serif;
```

- **영문**: `Inter` (Variable font 권장)
- **한글**: `Nanum Gothic` (또는 `Pretendard` 권장)
- **Fallback**: System fonts

#### Typography Scale

| Class | Font Size | Line Height | Use Case |
|-------|-----------|-------------|----------|
| `text-xs` | 0.75rem (12px) | 1rem | 캡션, 작은 레이블 |
| `text-sm` | 0.875rem (14px) | 1.25rem | 버튼, 입력 필드, 보조 텍스트 |
| `text-base` | 1rem (16px) | 1.5rem | 본문 텍스트 (기본) |
| `text-lg` | 1.125rem (18px) | 1.75rem | 부제목, 강조 텍스트 |
| `text-xl` | 1.25rem (20px) | 1.75rem | 섹션 헤더 |
| `text-2xl` | 1.5rem (24px) | 2rem | 페이지 제목 |
| `text-3xl` | 1.875rem (30px) | 2.25rem | 메인 헤더 |
| `text-4xl` | 2.25rem (36px) | 2.5rem | Hero 타이틀 |

#### Font Weight
- `font-normal` (400): 본문
- `font-medium` (500): 버튼, 레이블
- `font-semibold` (600): 소제목
- `font-bold` (700): 제목, 강조

### 1.3 Spacing & Layout

**Spacing Scale (Tailwind):**
- `4px` (1): 최소 간격
- `8px` (2): 작은 간격 (아이콘-텍스트)
- `12px` (3): 중간 간격
- `16px` (4): 기본 간격 (컴포넌트 내부)
- `24px` (6): 섹션 간격
- `32px` (8): 큰 섹션 간격
- `48px` (12): 페이지 레벨 간격

**Container Max-Width:**
- Mobile: 100%
- Tablet: 768px
- Desktop: 1280px
- Wide: 1536px

### 1.4 UI Component Patterns

공통 UI 컴포넌트는 `src/components/ui` 디렉토리에 위치하며, 일관된 클래스명을 사용합니다.

#### Buttons
```tsx
// Primary Button
<button className="
  px-6 py-2.5 rounded-xl font-medium
  bg-gradient-to-r from-primary-600 to-primary-500
  text-white shadow-lg shadow-primary-500/50
  hover:shadow-xl hover:shadow-primary-500/60
  active:scale-95
  transition-all duration-200
  disabled:opacity-50 disabled:cursor-not-allowed
">
  Submit
</button>

// Secondary Button
<button className="
  px-6 py-2.5 rounded-xl font-medium
  bg-slate-200 text-slate-700
  hover:bg-slate-300
  active:scale-95
  transition-all duration-200
">
  Cancel
</button>

// Danger Button
<button className="
  px-6 py-2.5 rounded-xl font-medium
  bg-gradient-to-r from-red-600 to-red-500
  text-white shadow-lg shadow-red-500/50
  hover:shadow-xl hover:shadow-red-500/60
  active:scale-95
  transition-all duration-200
">
  Delete
</button>
```

#### Cards
```tsx
// Modern Card
<div className="
  rounded-2xl bg-white
  shadow-soft hover:shadow-soft-lg
  transition-shadow duration-300
  p-6 border border-slate-100
">
  {/* Card Content */}
</div>

// Glassmorphism Card
<div className="
  rounded-2xl bg-white/80 backdrop-blur-md
  border border-white/20
  shadow-xl p-6
">
  {/* Card Content */}
</div>
```

#### Inputs
```tsx
// Text Input
<input className="
  w-full px-4 py-2.5 rounded-xl
  border-2 border-slate-200
  focus:border-primary-500 focus:ring-4 focus:ring-primary-200
  outline-none transition-all
  placeholder:text-slate-400
" />

// Select
<select className="
  w-full px-4 py-2.5 rounded-xl
  border-2 border-slate-200
  focus:border-primary-500 focus:ring-4 focus:ring-primary-200
  outline-none transition-all
  bg-white cursor-pointer
">
  <option>Option 1</option>
</select>
```

### 1.5 Responsive Design

**Breakpoints (Tailwind Default):**
```javascript
{
  'sm': '640px',   // Mobile landscape
  'md': '768px',   // Tablet
  'lg': '1024px',  // Desktop
  'xl': '1280px',  // Large Desktop
  '2xl': '1536px'  // Wide Display
}
```

**Mobile-First Approach:**
```tsx
// ❌ Bad
<div className="lg:flex md:hidden sm:block">

// ✅ Good (Mobile first)
<div className="block md:hidden lg:flex">
```

**Responsive Patterns:**
```tsx
// Grid Layout
<div className="
  grid grid-cols-1 
  sm:grid-cols-2 
  lg:grid-cols-3 
  xl:grid-cols-4 
  gap-4
">
  {/* Items */}
</div>

// Conditional Visibility
<div className="hidden md:block">Desktop Only</div>
<div className="block md:hidden">Mobile Only</div>
```

### 1.6 Animations & Transitions

#### Transition Presets
```css
/* tailwind.config.js */
theme: {
  extend: {
    transitionDuration: {
      '250': '250ms',
      '350': '350ms',
    },
    animation: {
      'fade-in': 'fadeIn 0.3s ease-in-out',
      'slide-up': 'slideUp 0.3s ease-out',
      'scale-in': 'scaleIn 0.2s ease-out',
    },
    keyframes: {
      fadeIn: {
        '0%': { opacity: '0' },
        '100%': { opacity: '1' },
      },
      slideUp: {
        '0%': { transform: 'translateY(20px)', opacity: '0' },
        '100%': { transform: 'translateY(0)', opacity: '1' },
      },
      scaleIn: {
        '0%': { transform: 'scale(0.95)', opacity: '0' },
        '100%': { transform: 'scale(1)', opacity: '1' },
      },
    },
  },
}
```

**Usage:**
```tsx
// Hover Transition
<button className="transition-all duration-200 hover:scale-105">

// Entry Animation
<div className="animate-fade-in">

// Combined
<div className="
  transition-all duration-300
  hover:shadow-lg hover:-translate-y-1
">
```

### 1.7 Dark Mode

**Strategy:** Class-based (Tailwind `darkMode: 'class'`)

```tsx
// Toggle Implementation
const toggleDarkMode = () => {
  document.documentElement.classList.toggle('dark');
  localStorage.setItem('theme', 
    document.documentElement.classList.contains('dark') ? 'dark' : 'light'
  );
};

// Component Usage
<div className="
  bg-white dark:bg-gray-800
  text-slate-900 dark:text-slate-100
">
```

### 1.8 Icon System

**Recommended Library:** Lucide React

```tsx
import { User, Settings, LogOut } from 'lucide-react';

<User className="w-5 h-5 text-slate-600" />
```

**Icon Sizes:**
- `w-4 h-4` (16px): Inline text icons
- `w-5 h-5` (20px): Button icons
- `w-6 h-6` (24px): Menu icons
- `w-8 h-8` (32px): Feature icons

---

## 2. 💻 코딩 규칙 및 컨벤션 (Coding Conventions)

### 2.1 Naming Conventions

| Type | Convention | Example | Description |
|------|------------|---------|-------------|
| **Component Files** | PascalCase | `TicketList.tsx` | React 컴포넌트 파일 |
| **Hook Files** | camelCase + `use` prefix | `useTickets.ts` | Custom Hooks |
| **Util Files** | camelCase | `dateFormatter.ts` | 유틸리티 함수 |
| **Service Files** | camelCase + `Service` suffix | `firestoreService.ts` | API/Backend 서비스 |
| **Config Files** | camelCase + `Config` suffix | `firebaseConfig.ts` | 설정 파일 |
| **Variables** | camelCase | `ticketCount` | 일반 변수 |
| **Functions** | camelCase | `handleSubmit` | 함수명은 동사로 시작 |
| **Constants** | UPPER_SNAKE_CASE | `MAX_RETRY_COUNT` | 전역 상수 |
| **Boolean Variables** | `is/has/should` prefix | `isLoading`, `hasError` | 불린 변수 |
| **Event Handlers** | `handle` prefix | `handleClick`, `handleChange` | 이벤트 핸들러 |
| **Interfaces** | PascalCase | `User`, `Ticket` | `I` prefix 사용 안 함 |
| **Type Aliases** | PascalCase | `UserRole`, `TicketStatus` | Type 정의 |
| **Enums** | PascalCase (type + values) | `enum Status { Active, Inactive }` | Enum 정의 |

### 2.2 Folder Structure

**Feature-based + Layer-based Hybrid** 구조를 따릅니다.

```
src/
├── assets/                 # 정적 파일 (images, fonts)
│   ├── images/
│   └── fonts/
│
├── components/             # 컴포넌트
│   ├── ui/                # 재사용 가능한 원자 단위 컴포넌트
│   │   ├── Button.tsx
│   │   ├── Card.tsx
│   │   ├── Input.tsx
│   │   └── Modal.tsx
│   │
│   ├── layout/            # 레이아웃 컴포넌트
│   │   ├── Header.tsx
│   │   ├── Sidebar.tsx
│   │   ├── Footer.tsx
│   │   └── MainLayout.tsx
│   │
│   └── features/          # 도메인별 복합 컴포넌트
│       ├── tickets/
│       │   ├── TicketList.tsx
│       │   ├── TicketCard.tsx
│       │   └── TicketFilters.tsx
│       └── users/
│           ├── UserTable.tsx
│           └── UserProfile.tsx
│
├── contexts/              # React Context
│   ├── AuthContext.tsx
│   ├── ThemeContext.tsx
│   └── NotificationContext.tsx
│
├── hooks/                 # Custom Hooks
│   ├── useTickets.ts
│   ├── useAuth.ts
│   ├── useDebounce.ts
│   └── useLocalStorage.ts
│
├── services/              # API 및 외부 서비스
│   ├── firestore/
│   │   ├── firestoreService.ts
│   │   ├── ticketService.ts
│   │   └── userService.ts
│   ├── api/
│   │   └── httpClient.ts
│   └── analytics/
│       └── analyticsService.ts
│
├── types/                 # TypeScript 타입 정의
│   ├── index.ts          # 공통 타입 export
│   ├── user.types.ts
│   ├── ticket.types.ts
│   └── api.types.ts
│
├── utils/                 # 유틸리티 함수
│   ├── dateFormatter.ts
│   ├── validation.ts
│   ├── constants.ts
│   └── helpers.ts
│
├── config/                # 설정 파일
│   ├── firebaseConfig.ts
│   └── appConfig.ts
│
├── pages/                 # 라우트 페이지 (React Router)
│   ├── HomePage.tsx
│   ├── TicketsPage.tsx
│   └── LoginPage.tsx
│
├── styles/                # 전역 스타일
│   ├── index.css
│   └── tailwind.css
│
├── App.tsx
└── main.tsx
```

### 2.3 Import Order

**표준 import 순서:**
```tsx
// 1. External libraries
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';

// 2. Internal modules (절대 경로)
import { Button, Card } from '@/components/ui';
import { useAuth } from '@/hooks';
import { firestoreService } from '@/services';

// 3. Types
import type { User, Ticket } from '@/types';

// 4. Relative imports (같은 디렉토리)
import { TicketCard } from './TicketCard';

// 5. Styles
import './TicketList.css';
```

### 2.4 Code Style Guide

#### React Components

```tsx
// ✅ Good: Functional Component with TypeScript
import React from 'react';

interface TicketCardProps {
  title: string;
  status: 'open' | 'closed';
  onUpdate?: (id: string) => void;
}

export const TicketCard: React.FC<TicketCardProps> = ({ 
  title, 
  status, 
  onUpdate 
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const handleClick = () => {
    setIsExpanded(!isExpanded);
  };

  return (
    <div className="ticket-card" onClick={handleClick}>
      <h3>{title}</h3>
      <span className={`status-${status}`}>{status}</span>
    </div>
  );
};
```

#### Custom Hooks

```tsx
// ✅ Good: Custom Hook with TypeScript
import { useState, useEffect } from 'react';
import { Ticket } from '@/types';
import { firestoreService } from '@/services';

interface UseTicketsResult {
  tickets: Ticket[];
  loading: boolean;
  error: Error | null;
  refresh: () => Promise<void>;
}

export const useTickets = (companyId: string): UseTicketsResult => {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchTickets = async () => {
    try {
      setLoading(true);
      const data = await firestoreService.getTickets(companyId);
      setTickets(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Unknown error'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTickets();
  }, [companyId]);

  return { tickets, loading, error, refresh: fetchTickets };
};
```

#### Service Layer

```tsx
// ✅ Good: Service Layer Pattern
import { 
  collection, 
  query, 
  where, 
  getDocs, 
  addDoc,
  updateDoc,
  doc 
} from 'firebase/firestore';
import { db } from '@/config/firebaseConfig';
import type { Ticket } from '@/types';

class TicketService {
  private collectionName = 'tickets';

  async getTicketsByCompany(companyId: string): Promise<Ticket[]> {
    const q = query(
      collection(db, this.collectionName),
      where('companyId', '==', companyId)
    );
    
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as Ticket));
  }

  async createTicket(ticket: Omit<Ticket, 'id'>): Promise<string> {
    const docRef = await addDoc(
      collection(db, this.collectionName),
      ticket
    );
    return docRef.id;
  }

  async updateTicket(id: string, updates: Partial<Ticket>): Promise<void> {
    const docRef = doc(db, this.collectionName, id);
    await updateDoc(docRef, updates);
  }
}

export const ticketService = new TicketService();
```

### 2.5 TypeScript Best Practices

#### Type vs Interface
```tsx
// ✅ Use Interface for object shapes
interface User {
  id: string;
  name: string;
  email: string;
}

// ✅ Use Type for unions, intersections, primitives
type UserRole = 'ADMIN' | 'USER' | 'GUEST';
type UserId = string;
type UserWithRole = User & { role: UserRole };
```

#### Avoid `any`
```tsx
// ❌ Bad
const handleData = (data: any) => {
  console.log(data.something);
};

// ✅ Good: Use unknown and type guard
const handleData = (data: unknown) => {
  if (typeof data === 'object' && data !== null && 'something' in data) {
    console.log((data as { something: string }).something);
  }
};

// ✅ Better: Define proper type
interface DataShape {
  something: string;
}

const handleData = (data: DataShape) => {
  console.log(data.something);
};
```

#### Utility Types
```tsx
// Partial - 모든 속성 optional
type PartialUser = Partial<User>;

// Required - 모든 속성 required
type RequiredUser = Required<User>;

// Pick - 특정 속성만 선택
type UserBasic = Pick<User, 'id' | 'name'>;

// Omit - 특정 속성 제외
type UserWithoutEmail = Omit<User, 'email'>;

// Record - 키-값 타입 정의
type UserMap = Record<string, User>;
```

### 2.6 Code Review Checklist

개발 완료 후 아래 체크리스트를 확인하세요:

- [ ] **Naming**: 변수/함수명이 명확하고 일관적인가?
- [ ] **Types**: TypeScript 타입이 모두 정의되어 있는가? (`any` 사용 없음)
- [ ] **Imports**: Import 순서가 정렬되어 있는가?
- [ ] **Component Size**: 컴포넌트가 200줄 이하인가? (아니면 분리 필요)
- [ ] **Props Drilling**: Props가 3단계 이상 내려가는가? (Context/State 고려)
- [ ] **Side Effects**: `useEffect` 의존성 배열이 정확한가?
- [ ] **Error Handling**: Try-catch 또는 Error Boundary가 있는가?
- [ ] **Accessibility**: 키보드 네비게이션, ARIA 속성이 있는가?
- [ ] **Performance**: 불필요한 리렌더링이 없는가? (React.memo, useMemo 고려)
- [ ] **Security**: XSS 취약점이 없는가? (사용자 입력 검증)

---

## 3. 🛡️ 보안 규정 준수 사항 (Security Best Practices)

### 3.1 Authentication & Authorization

#### Firebase Auth 설정
```typescript
// src/config/firebaseConfig.ts
import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  setPersistence, 
  browserLocalPersistence 
} from 'firebase/auth';

const app = initializeApp({
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  // ... other config
});

export const auth = getAuth(app);

// Session Persistence 설정
setPersistence(auth, browserLocalPersistence);
```

#### AuthContext Implementation
```tsx
// src/contexts/AuthContext.tsx
import React, { createContext, useContext, useEffect, useState } from 'react';
import { 
  User as FirebaseUser,
  onAuthStateChanged,
  signOut as firebaseSignOut
} from 'firebase/auth';
import { auth } from '@/config/firebaseConfig';
import { userService } from '@/services';
import type { User, UserRole } from '@/types';

interface AuthContextType {
  currentUser: User | null;
  loading: boolean;
  signOut: () => Promise<void>;
  hasRole: (role: UserRole) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ 
  children 
}) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        // Firestore에서 User 정보 조회
        const userData = await userService.getUserById(firebaseUser.uid);
        setCurrentUser(userData);
      } else {
        setCurrentUser(null);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const signOut = async () => {
    await firebaseSignOut(auth);
    setCurrentUser(null);
  };

  const hasRole = (role: UserRole) => {
    return currentUser?.role === role;
  };

  return (
    <AuthContext.Provider value={{ currentUser, loading, signOut, hasRole }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};
```

#### Role-Based Access Control (RBAC)

**User Roles Enum:**
```typescript
// src/types/user.types.ts
export enum UserRole {
  PLATFORM_ADMIN = 'PLATFORM_ADMIN',  // 플랫폼 관리자 (전체 접근)
  COMPANY_ADMIN = 'COMPANY_ADMIN',    // 회사 관리자 (자사 데이터만)
  MANAGER = 'MANAGER',                 // 매니저 (팀 데이터)
  STAFF = 'STAFF'                      // 일반 사용자 (자기 데이터만)
}
```

**Protected Route Component:**
```tsx
// src/components/auth/ProtectedRoute.tsx
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { UserRole } from '@/types';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: UserRole;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  children, 
  requiredRole 
}) => {
  const { currentUser, loading } = useAuth();

  if (loading) {
    return <LoadingSpinner />;
  }

  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }

  if (requiredRole && currentUser.role !== requiredRole) {
    return <Navigate to="/unauthorized" replace />;
  }

  return <>{children}</>;
};

// Usage in Router
<Route 
  path="/admin" 
  element={
    <ProtectedRoute requiredRole={UserRole.PLATFORM_ADMIN}>
      <AdminDashboard />
    </ProtectedRoute>
  } 
/>
```

### 3.2 Data Validation

#### Input Validation with Zod
```typescript
// src/utils/validation.ts
import { z } from 'zod';

// User Registration Schema
export const userRegistrationSchema = z.object({
  email: z.string()
    .email('유효한 이메일을 입력하세요')
    .min(5, '이메일은 최소 5자 이상이어야 합니다'),
  
  password: z.string()
    .min(8, '비밀번호는 최소 8자 이상이어야 합니다')
    .regex(/[A-Z]/, '대문자를 포함해야 합니다')
    .regex(/[a-z]/, '소문자를 포함해야 합니다')
    .regex(/[0-9]/, '숫자를 포함해야 합니다')
    .regex(/[^A-Za-z0-9]/, '특수문자를 포함해야 합니다'),
  
  name: z.string()
    .min(2, '이름은 최소 2자 이상이어야 합니다')
    .max(50, '이름은 50자를 초과할 수 없습니다'),
  
  phoneNumber: z.string()
    .regex(/^010-\d{4}-\d{4}$/, '올바른 전화번호 형식이 아닙니다')
    .optional(),
});

// Ticket Creation Schema
export const ticketSchema = z.object({
  title: z.string()
    .min(5, '제목은 최소 5자 이상이어야 합니다')
    .max(100, '제목은 100자를 초과할 수 없습니다'),
  
  description: z.string()
    .min(10, '설명은 최소 10자 이상이어야 합니다'),
  
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']),
  
  assigneeId: z.string().uuid('유효한 사용자 ID가 아닙니다').optional(),
  
  dueDate: z.date()
    .min(new Date(), '마감일은 현재 날짜 이후여야 합니다')
    .optional(),
});

export type UserRegistrationInput = z.infer<typeof userRegistrationSchema>;
export type TicketInput = z.infer<typeof ticketSchema>;
```

#### Form Validation in Component
```tsx
// src/components/forms/TicketForm.tsx
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ticketSchema, type TicketInput } from '@/utils/validation';

export const TicketForm: React.FC = () => {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting }
  } = useForm<TicketInput>({
    resolver: zodResolver(ticketSchema),
  });

  const onSubmit = async (data: TicketInput) => {
    try {
      await ticketService.createTicket(data);
      toast.success('티켓이 생성되었습니다');
    } catch (error) {
      toast.error('티켓 생성에 실패했습니다');
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <input 
        {...register('title')} 
        placeholder="제목"
      />
      {errors.title && (
        <span className="text-red-500">{errors.title.message}</span>
      )}

      <button type="submit" disabled={isSubmitting}>
        {isSubmitting ? '생성 중...' : '티켓 생성'}
      </button>
    </form>
  );
};
```

### 3.3 XSS (Cross-Site Scripting) 방어

#### 안전한 HTML 렌더링
```tsx
// ❌ Bad: Dangerous HTML injection
<div dangerouslySetInnerHTML={{ __html: userInput }} />

// ✅ Good: Use sanitization library
import DOMPurify from 'dompurify';

const SafeHTML: React.FC<{ html: string }> = ({ html }) => {
  const sanitizedHTML = DOMPurify.sanitize(html, {
    ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'a', 'p', 'br'],
    ALLOWED_ATTR: ['href', 'target'],
  });

  return <div dangerouslySetInnerHTML={{ __html: sanitizedHTML }} />;
};
```

#### URL Validation
```typescript
// src/utils/urlValidation.ts
export const isValidURL = (url: string): boolean => {
  try {
    const parsed = new URL(url);
    // Allow only http/https protocols
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
};

// Usage
const handleLinkClick = (url: string) => {
  if (!isValidURL(url)) {
    toast.error('유효하지 않은 URL입니다');
    return;
  }
  window.open(url, '_blank', 'noopener,noreferrer');
};
```

### 3.4 CSRF (Cross-Site Request Forgery) 방어

Firebase Auth는 기본적으로 CSRF 보호를 제공하지만, 추가 보안을 위해:

```typescript
// src/utils/csrfToken.ts
export const generateCSRFToken = (): string => {
  const token = crypto.randomUUID();
  sessionStorage.setItem('csrf_token', token);
  return token;
};

export const validateCSRFToken = (token: string): boolean => {
  const storedToken = sessionStorage.getItem('csrf_token');
  return token === storedToken;
};

// Usage in Form
const [csrfToken] = useState(() => generateCSRFToken());

<form onSubmit={handleSubmit}>
  <input type="hidden" name="csrf_token" value={csrfToken} />
  {/* Other fields */}
</form>
```

### 3.5 환경 변수 관리

#### `.env` File Structure
```bash
# .env.local (개발 환경)
VITE_FIREBASE_API_KEY=your_api_key_here
VITE_FIREBASE_AUTH_DOMAIN=your-app.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-app.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=your-app-id

# API Keys (절대 커밋하지 말 것)
VITE_STRIPE_PUBLIC_KEY=pk_test_...
VITE_GOOGLE_MAPS_API_KEY=AIza...

# Feature Flags
VITE_ENABLE_ANALYTICS=true
VITE_ENABLE_DEBUG=true
```

#### `.gitignore` 설정
```
# Environment Variables
.env
.env.local
.env.production
.env.development

# Firebase
.firebase/
firebase-debug.log
```

#### Type-safe Environment Variables
```typescript
// src/config/env.ts
interface ImportMetaEnv {
  readonly VITE_FIREBASE_API_KEY: string;
  readonly VITE_FIREBASE_AUTH_DOMAIN: string;
  readonly VITE_FIREBASE_PROJECT_ID: string;
  // ... other env vars
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

// Validation
const validateEnv = () => {
  const required = [
    'VITE_FIREBASE_API_KEY',
    'VITE_FIREBASE_AUTH_DOMAIN',
    'VITE_FIREBASE_PROJECT_ID',
  ];

  const missing = required.filter(key => !import.meta.env[key]);

  if (missing.length > 0) {
    throw new Error(`Missing environment variables: ${missing.join(', ')}`);
  }
};

validateEnv();

export const env = import.meta.env;
```

### 3.6 Rate Limiting (Client-side)

```typescript
// src/utils/rateLimiter.ts
class RateLimiter {
  private requests: Map<string, number[]> = new Map();

  canMakeRequest(key: string, maxRequests: number, windowMs: number): boolean {
    const now = Date.now();
    const timestamps = this.requests.get(key) || [];
    
    // Remove old timestamps outside the window
    const validTimestamps = timestamps.filter(t => now - t < windowMs);
    
    if (validTimestamps.length >= maxRequests) {
      return false;
    }
    
    validTimestamps.push(now);
    this.requests.set(key, validTimestamps);
    return true;
  }
}

export const rateLimiter = new RateLimiter();

// Usage in API call
const submitForm = async () => {
  const key = `submit_form_${currentUser.uid}`;
  
  if (!rateLimiter.canMakeRequest(key, 5, 60000)) {
    toast.error('너무 많은 요청이 발생했습니다. 잠시 후 다시 시도해주세요.');
    return;
  }
  
  // Proceed with form submission
  await api.submitForm(formData);
};
```

### 3.7 민감 정보 처리

#### 로그에서 민감 정보 제거
```typescript
// src/utils/logger.ts
const SENSITIVE_KEYS = ['password', 'token', 'apiKey', 'secret', 'creditCard'];

export const sanitizeData = (data: unknown): unknown => {
  if (typeof data !== 'object' || data === null) {
    return data;
  }

  if (Array.isArray(data)) {
    return data.map(sanitizeData);
  }

  const sanitized: Record<string, unknown> = {};
  
  for (const [key, value] of Object.entries(data)) {
    if (SENSITIVE_KEYS.some(sensitive => key.toLowerCase().includes(sensitive))) {
      sanitized[key] = '***REDACTED***';
    } else {
      sanitized[key] = sanitizeData(value);
    }
  }

  return sanitized;
};

export const logError = (error: Error, context?: unknown) => {
  console.error('Error:', error.message);
  if (context) {
    console.error('Context:', sanitizeData(context));
  }
};
```

---

## 4. 🔥 Firebase 설정 및 아키텍처 (Firebase Configuration)

### 4.1 Firestore Data Structure

Multi-tenant SaaS 구조를 위해 모든 주요 컬렉션 문서에 `companyId` 필드를 포함합니다.

#### Collection 구조

```
firestore/
├── users/                           # 사용자 컬렉션
│   └── {userId}/
│       ├── id: string
│       ├── email: string
│       ├── name: string
│       ├── role: UserRole
│       ├── companyId: string        # Tenant 격리
│       ├── managedUsers: string[]   # Manager가 관리하는 User IDs
│       ├── createdAt: Timestamp
│       └── updatedAt: Timestamp
│
├── companies/                       # 회사(Tenant) 컬렉션
│   └── {companyId}/
│       ├── id: string
│       ├── name: string
│       ├── plan: 'FREE' | 'BASIC' | 'PRO' | 'ENTERPRISE'
│       ├── status: 'ACTIVE' | 'SUSPENDED' | 'TRIAL'
│       ├── maxUsers: number
│       ├── features: string[]
│       ├── createdAt: Timestamp
│       └── billingInfo: object
│
├── tickets/                         # 티켓 컬렉션
│   └── {ticketId}/
│       ├── id: string
│       ├── title: string
│       ├── description: string
│       ├── status: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED'
│       ├── priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'
│       ├── companyId: string        # Tenant 격리
│       ├── customerId: string
│       ├── assigneeId: string
│       ├── createdBy: string
│       ├── createdAt: Timestamp
│       ├── updatedAt: Timestamp
│       └── tags: string[]
│       │
│       └── comments/                # Sub-collection
│           └── {commentId}/
│               ├── text: string
│               ├── authorId: string
│               ├── createdAt: Timestamp
│
├── customers/                       # 고객 컬렉션
│   └── {customerId}/
│       ├── id: string
│       ├── name: string
│       ├── email: string
│       ├── phone: string
│       ├── companyId: string        # Tenant 격리
│       ├── tags: string[]
│       └── createdAt: Timestamp
│
└── activityLogs/                    # 활동 로그 (감사)
    └── {logId}/
        ├── userId: string
        ├── companyId: string
        ├── action: string           # 'CREATE_TICKET', 'UPDATE_USER'
        ├── resourceType: string     # 'ticket', 'user'
        ├── resourceId: string
        ├── changes: object          # Before/After 값
        └── timestamp: Timestamp
```

### 4.2 Firestore Security Rules

**⚠️ CRITICAL**: 현재 `firestore.rules`가 `allow read, write: if true;`로 설정되어 있습니다.  
배포 전 반드시 아래 규칙으로 변경해야 합니다.

#### Production Rules Template

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // ========== Helper Functions ==========
    
    // 인증 여부 확인
    function isSignedIn() {
      return request.auth != null;
    }
    
    // 현재 사용자의 데이터 조회
    function getUserData() {
      return get(/databases/$(database)/documents/users/$(request.auth.uid)).data;
    }
    
    // 플랫폼 관리자 여부 확인
    function isPlatformAdmin() {
      return isSignedIn() && getUserData().role == 'PLATFORM_ADMIN';
    }
    
    // 회사 관리자 여부 확인
    function isCompanyAdmin(companyId) {
      return isSignedIn() && 
             getUserData().companyId == companyId && 
             getUserData().role == 'COMPANY_ADMIN';
    }
    
    // 회사 멤버 여부 확인
    function isCompanyMember(companyId) {
      return isSignedIn() && getUserData().companyId == companyId;
    }
    
    // 리소스 소유자 여부 확인
    function isResourceOwner(ownerId) {
      return isSignedIn() && request.auth.uid == ownerId;
    }
    
    // 데이터 무결성 검증: companyId 변경 방지
    function companyIdNotChanged() {
      return !request.resource.data.diff(resource.data).affectedKeys().hasAny(['companyId']);
    }
    
    // ========== Users Collection ==========
    match /users/{userId} {
      // Read: 본인, 같은 회사 멤버, 플랫폼 관리자
      allow read: if isSignedIn() && (
        request.auth.uid == userId || 
        isPlatformAdmin() || 
        isCompanyMember(resource.data.companyId)
      );
      
      // Create: 플랫폼 관리자만 (회원가입은 Cloud Function 사용)
      allow create: if isPlatformAdmin();
      
      // Update: 본인(일부 필드만) 또는 회사 관리자 또는 플랫폼 관리자
      allow update: if isSignedIn() && (
        (request.auth.uid == userId && 
         request.resource.data.diff(resource.data).affectedKeys()
           .hasOnly(['name', 'profileImage', 'phone'])) ||
        isCompanyAdmin(resource.data.companyId) ||
        isPlatformAdmin()
      ) && companyIdNotChanged();
      
      // Delete: 플랫폼 관리자만
      allow delete: if isPlatformAdmin();
    }
    
    // ========== Companies Collection ==========
    match /companies/{companyId} {
      // Read: 회사 멤버 또는 플랫폼 관리자
      allow read: if isCompanyMember(companyId) || isPlatformAdmin();
      
      // Create: 플랫폼 관리자만
      allow create: if isPlatformAdmin();
      
      // Update: 회사 관리자 또는 플랫폼 관리자
      allow update: if isCompanyAdmin(companyId) || isPlatformAdmin();
      
      // Delete: 플랫폼 관리자만
      allow delete: if isPlatformAdmin();
    }
    
    // ========== Tickets Collection ==========
    match /tickets/{ticketId} {
      // Read: 같은 회사 멤버 또는 플랫폼 관리자
      allow read: if isSignedIn() && (
        isPlatformAdmin() || 
        isCompanyMember(resource.data.companyId)
      );
      
      // Create: 같은 회사 멤버 (companyId 일치 검증)
      allow create: if isSignedIn() && 
        isCompanyMember(request.resource.data.companyId) &&
        request.resource.data.companyId == getUserData().companyId &&
        request.resource.data.createdBy == request.auth.uid;
      
      // Update: 같은 회사 멤버 또는 플랫폼 관리자 (companyId 변경 불가)
      allow update: if isSignedIn() && (
        isPlatformAdmin() || 
        isCompanyMember(resource.data.companyId)
      ) && companyIdNotChanged();
      
      // Delete: 회사 관리자 또는 플랫폼 관리자
      allow delete: if isPlatformAdmin() || 
        isCompanyAdmin(resource.data.companyId);
      
      // ========== Sub-collection: Comments ==========
      match /comments/{commentId} {
        allow read: if isSignedIn() && (
          isPlatformAdmin() || 
          isCompanyMember(get(/databases/$(database)/documents/tickets/$(ticketId)).data.companyId)
        );
        
        allow create: if isSignedIn() && 
          isCompanyMember(get(/databases/$(database)/documents/tickets/$(ticketId)).data.companyId) &&
          request.resource.data.authorId == request.auth.uid;
        
        allow update: if isResourceOwner(resource.data.authorId);
        
        allow delete: if isResourceOwner(resource.data.authorId) || 
          isPlatformAdmin();
      }
    }
    
    // ========== Customers Collection ==========
    match /customers/{customerId} {
      allow read: if isCompanyMember(resource.data.companyId) || isPlatformAdmin();
      
      allow create: if isCompanyMember(request.resource.data.companyId) &&
        request.resource.data.companyId == getUserData().companyId;
      
      allow update: if (isCompanyMember(resource.data.companyId) || isPlatformAdmin()) &&
        companyIdNotChanged();
      
      allow delete: if isCompanyAdmin(resource.data.companyId) || isPlatformAdmin();
    }
    
    // ========== Activity Logs Collection (Read-only for users) ==========
    match /activityLogs/{logId} {
      allow read: if isCompanyMember(resource.data.companyId) || isPlatformAdmin();
      
      // Logs are created by Cloud Functions only
      allow write: if false;
    }
  }
}
```

#### Rules Testing Checklist

배포 전 Firebase Emulator로 테스트:

```bash
# Emulator 실행
firebase emulators:start --only firestore

# Rules 테스트
firebase emulators:exec --only firestore "npm run test:rules"
```

**테스트 시나리오:**
- [ ] 플랫폼 관리자가 모든 데이터에 접근 가능
- [ ] 회사 관리자가 자사 데이터만 접근 가능
- [ ] 일반 사용자가 타사 데이터에 접근 불가
- [ ] `companyId` 변경 시도 시 차단
- [ ] 인증 없이 데이터 접근 시 차단
- [ ] Sub-collection (comments) 접근 제어 확인

### 4.3 Firestore 인덱싱 전략

#### Composite Indexes
```json
// firestore.indexes.json
{
  "indexes": [
    {
      "collectionGroup": "tickets",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "companyId", "order": "ASCENDING" },
        { "fieldPath": "status", "order": "ASCENDING" },
        { "fieldPath": "createdAt", "order": "DESCENDING" }
      ]
    },
    {
      "collectionGroup": "tickets",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "companyId", "order": "ASCENDING" },
        { "fieldPath": "assigneeId", "order": "ASCENDING" },
        { "fieldPath": "updatedAt", "order": "DESCENDING" }
      ]
    },
    {
      "collectionGroup": "activityLogs",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "companyId", "order": "ASCENDING" },
        { "fieldPath": "timestamp", "order": "DESCENDING" }
      ]
    }
  ],
  "fieldOverrides": []
}
```

#### 인덱스 생성 명령
```bash
firebase deploy --only firestore:indexes
```

### 4.4 Service Layer Pattern

**절대 컴포넌트에서 Firestore를 직접 호출하지 마세요!**  
모든 데이터 접근은 Service Layer를 통해야 합니다.

#### Firestore Service Base
```typescript
// src/services/firestore/firestoreService.ts
import { 
  collection, 
  query, 
  where, 
  getDocs, 
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  orderBy,
  limit,
  Timestamp,
  onSnapshot,
  Unsubscribe
} from 'firebase/firestore';
import { db } from '@/config/firebaseConfig';

export abstract class FirestoreService<T> {
  protected abstract collectionName: string;

  protected getCollection() {
    return collection(db, this.collectionName);
  }

  protected async getByCompany(companyId: string): Promise<T[]> {
    const q = query(
      this.getCollection(),
      where('companyId', '==', companyId)
    );
    
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as T));
  }

  protected subscribeToCompany(
    companyId: string, 
    callback: (data: T[]) => void
  ): Unsubscribe {
    const q = query(
      this.getCollection(),
      where('companyId', '==', companyId)
    );

    return onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as T));
      callback(data);
    });
  }

  async create(data: Omit<T, 'id'>): Promise<string> {
    const docRef = await addDoc(this.getCollection(), {
      ...data,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now()
    });
    return docRef.id;
  }

  async update(id: string, updates: Partial<T>): Promise<void> {
    const docRef = doc(db, this.collectionName, id);
    await updateDoc(docRef, {
      ...updates,
      updatedAt: Timestamp.now()
    });
  }

  async delete(id: string): Promise<void> {
    const docRef = doc(db, this.collectionName, id);
    await deleteDoc(docRef);
  }
}
```

#### Ticket Service Implementation
```typescript
// src/services/firestore/ticketService.ts
import { query, where, orderBy } from 'firebase/firestore';
import { FirestoreService } from './firestoreService';
import type { Ticket, TicketStatus } from '@/types';

class TicketService extends FirestoreService<Ticket> {
  protected collectionName = 'tickets';

  async getTicketsByStatus(
    companyId: string, 
    status: TicketStatus
  ): Promise<Ticket[]> {
    const q = query(
      this.getCollection(),
      where('companyId', '==', companyId),
      where('status', '==', status),
      orderBy('createdAt', 'desc')
    );

    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as Ticket));
  }

  async getTicketsByAssignee(
    companyId: string, 
    assigneeId: string
  ): Promise<Ticket[]> {
    const q = query(
      this.getCollection(),
      where('companyId', '==', companyId),
      where('assigneeId', '==', assigneeId),
      orderBy('updatedAt', 'desc')
    );

    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as Ticket));
  }

  subscribeToTickets(
    companyId: string,
    callback: (tickets: Ticket[]) => void
  ) {
    return this.subscribeToCompany(companyId, callback);
  }
}

export const ticketService = new TicketService();
```

### 4.5 Firebase Storage 구조

```
storage/
├── companies/
│   └── {companyId}/
│       ├── logos/
│       │   └── logo.png
│       └── documents/
│           └── {documentId}/
│               └── file.pdf
│
└── users/
    └── {userId}/
        └── profile/
            └── avatar.jpg
```

#### Storage Upload Service
```typescript
// src/services/storage/storageService.ts
import { 
  ref, 
  uploadBytes, 
  getDownloadURL,
  deleteObject 
} from 'firebase/storage';
import { storage } from '@/config/firebaseConfig';

class StorageService {
  async uploadUserAvatar(
    userId: string, 
    file: File
  ): Promise<string> {
    const storageRef = ref(storage, `users/${userId}/profile/avatar.jpg`);
    await uploadBytes(storageRef, file);
    return getDownloadURL(storageRef);
  }

  async uploadCompanyLogo(
    companyId: string, 
    file: File
  ): Promise<string> {
    const storageRef = ref(storage, `companies/${companyId}/logos/logo.png`);
    await uploadBytes(storageRef, file);
    return getDownloadURL(storageRef);
  }

  async deleteFile(path: string): Promise<void> {
    const storageRef = ref(storage, path);
    await deleteObject(storageRef);
  }
}

export const storageService = new StorageService();
```

### 4.6 Firebase 비용 최적화

#### Read/Write 최소화 전략

**1. 실시간 리스너 최소화**
```typescript
// ❌ Bad: 모든 컴포넌트에서 리스너 생성
useEffect(() => {
  const unsubscribe = onSnapshot(query(...), callback);
  return unsubscribe;
}, []);

// ✅ Good: Context에서 한 번만 리스너 생성
// AuthContext나 DataContext에서 관리
```

**2. Pagination 구현**
```typescript
const getTicketsPaginated = async (
  companyId: string,
  pageSize: number = 20,
  lastDoc?: DocumentSnapshot
) => {
  let q = query(
    collection(db, 'tickets'),
    where('companyId', '==', companyId),
    orderBy('createdAt', 'desc'),
    limit(pageSize)
  );

  if (lastDoc) {
    q = query(q, startAfter(lastDoc));
  }

  const snapshot = await getDocs(q);
  return {
    tickets: snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })),
    lastDoc: snapshot.docs[snapshot.docs.length - 1]
  };
};
```

**3. 클라이언트 캐싱**
```typescript
// React Query를 사용한 캐싱
import { useQuery } from '@tanstack/react-query';

const useTickets = (companyId: string) => {
  return useQuery({
    queryKey: ['tickets', companyId],
    queryFn: () => ticketService.getByCompany(companyId),
    staleTime: 5 * 60 * 1000, // 5분간 캐시
    cacheTime: 10 * 60 * 1000, // 10분간 메모리 유지
  });
};
```

### 4.7 백업 및 복구 전략

#### 자동 백업 설정 (Firebase Console)
1. Firebase Console → Firestore Database
2. "백업" 탭 → "백업 예약" 설정
3. 일일 백업 권장 (Storage 비용 고려)

#### 수동 백업 (Firebase CLI)
```bash
# Firestore 데이터 내보내기
gcloud firestore export gs://[BUCKET_NAME]/[EXPORT_FOLDER]

# 데이터 가져오기
gcloud firestore import gs://[BUCKET_NAME]/[EXPORT_FOLDER]
```

---

## 5. 🧪 테스팅 전략 (Testing Strategy)

### 5.1 테스트 계층 구조

```
테스트 피라미드:
    /\
   /E2E\          (5% - Cypress/Playwright)
  /------\
 /  통합   \       (15% - React Testing Library)
/---------\
/  단위 테스트\    (80% - Vitest/Jest)
```

### 5.2 Unit Testing (Vitest)

#### 설치
```bash
npm install -D vitest @testing-library/react @testing-library/jest-dom
```

#### 설정 (`vite.config.ts`)
```typescript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/test/setup.ts',
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'src/test/',
      ],
    },
  },
});
```

#### Component Test 예시
```typescript
// src/components/ui/Button.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { Button } from './Button';

describe('Button Component', () => {
  it('renders with correct text', () => {
    render(<Button>Click me</Button>);
    expect(screen.getByText('Click me')).toBeInTheDocument();
  });

  it('calls onClick when clicked', () => {
    const handleClick = vi.fn();
    render(<Button onClick={handleClick}>Click me</Button>);
    
    fireEvent.click(screen.getByText('Click me'));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('is disabled when disabled prop is true', () => {
    render(<Button disabled>Click me</Button>);
    expect(screen.getByText('Click me')).toBeDisabled();
  });
});
```

#### Hook Test 예시
```typescript
// src/hooks/useTickets.test.ts
import { renderHook, waitFor } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { useTickets } from './useTickets';
import { ticketService } from '@/services';

vi.mock('@/services', () => ({
  ticketService: {
    getByCompany: vi.fn(),
  },
}));

describe('useTickets Hook', () => {
  it('fetches tickets on mount', async () => {
    const mockTickets = [
      { id: '1', title: 'Test Ticket', companyId: 'company1' },
    ];
    
    vi.mocked(ticketService.getByCompany).mockResolvedValue(mockTickets);

    const { result } = renderHook(() => useTickets('company1'));

    expect(result.current.loading).toBe(true);

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.tickets).toEqual(mockTickets);
    expect(ticketService.getByCompany).toHaveBeenCalledWith('company1');
  });
});
```

### 5.3 Integration Testing

```typescript
// src/components/features/tickets/TicketList.test.tsx
import { render, screen, waitFor } from '@testing-library/react';
import { TicketList } from './TicketList';
import { AuthProvider } from '@/contexts/AuthContext';

const renderWithProviders = (component: React.ReactElement) => {
  return render(
    <AuthProvider>
      {component}
    </AuthProvider>
  );
};

describe('TicketList Integration', () => {
  it('displays tickets after loading', async () => {
    renderWithProviders(<TicketList />);

    expect(screen.getByText('Loading...')).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
    });

    expect(screen.getByText('Test Ticket')).toBeInTheDocument();
  });
});
```

### 5.4 E2E Testing (Playwright)

#### 설치
```bash
npm install -D @playwright/test
npx playwright install
```

#### E2E Test 예시
```typescript
// e2e/login.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Login Flow', () => {
  test('should login successfully', async ({ page }) => {
    await page.goto('http://localhost:5173/login');

    await page.fill('input[name="email"]', 'test@example.com');
    await page.fill('input[name="password"]', 'password123');
    await page.click('button[type="submit"]');

    await expect(page).toHaveURL('http://localhost:5173/dashboard');
    await expect(page.locator('text=Welcome')).toBeVisible();
  });

  test('should show error with invalid credentials', async ({ page }) => {
    await page.goto('http://localhost:5173/login');

    await page.fill('input[name="email"]', 'wrong@example.com');
    await page.fill('input[name="password"]', 'wrongpassword');
    await page.click('button[type="submit"]');

    await expect(page.locator('text=Invalid credentials')).toBeVisible();
  });
});
```

### 5.5 Testing Checklist

개발 완료 후 확인:

- [ ] **Unit Tests**: 모든 Utils, Hooks, 컴포넌트에 대한 단위 테스트 작성
- [ ] **Integration Tests**: 주요 기능 흐름에 대한 통합 테스트 작성
- [ ] **E2E Tests**: 핵심 사용자 시나리오(로그인, 티켓 생성 등) E2E 테스트 작성
- [ ] **Coverage**: 최소 80% 커버리지 달성
- [ ] **CI/CD**: 모든 테스트가 CI 파이프라인에서 자동 실행

---

## 6. ⚡ 성능 최적화 (Performance Optimization)

### 6.1 React Performance

#### React.memo
```tsx
// ❌ Bad: 불필요한 리렌더링
export const TicketCard = ({ ticket }) => {
  return <div>{ticket.title}</div>;
};

// ✅ Good: Props가 변경되지 않으면 리렌더링 방지
export const TicketCard = React.memo(({ ticket }) => {
  return <div>{ticket.title}</div>;
}, (prevProps, nextProps) => {
  return prevProps.ticket.id === nextProps.ticket.id;
});
```

#### useMemo & useCallback
```tsx
const TicketList = ({ tickets, onUpdate }) => {
  // ✅ 비용이 큰 계산 메모이제이션
  const sortedTickets = useMemo(() => {
    return tickets.sort((a, b) => b.createdAt - a.createdAt);
  }, [tickets]);

  // ✅ 함수 메모이제이션 (자식 컴포넌트에 전달 시)
  const handleUpdate = useCallback((id) => {
    onUpdate(id);
  }, [onUpdate]);

  return (
    <>
      {sortedTickets.map(ticket => (
        <TicketCard key={ticket.id} ticket={ticket} onUpdate={handleUpdate} />
      ))}
    </>
  );
};
```

#### Code Splitting (Lazy Loading)
```tsx
// ✅ Route-based code splitting
import { lazy, Suspense } from 'react';

const Dashboard = lazy(() => import('./pages/Dashboard'));
const TicketsPage = lazy(() => import('./pages/TicketsPage'));

function App() {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <Routes>
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/tickets" element={<TicketsPage />} />
      </Routes>
    </Suspense>
  );
}
```

### 6.2 Bundle Size Optimization

#### Vite 번들 분석
```bash
npm install -D rollup-plugin-visualizer
```

```typescript
// vite.config.ts
import { visualizer } from 'rollup-plugin-visualizer';

export default defineConfig({
  plugins: [
    react(),
    visualizer({ open: true }),
  ],
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          'firebase': ['firebase/app', 'firebase/auth', 'firebase/firestore'],
          'ui': ['@headlessui/react', 'lucide-react'],
        },
      },
    },
  },
});
```

### 6.3 Image Optimization

```tsx
// ✅ Responsive Images
<img 
  srcSet="
    image-320w.jpg 320w,
    image-640w.jpg 640w,
    image-1280w.jpg 1280w
  "
  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
  src="image-640w.jpg"
  alt="Description"
  loading="lazy"
/>

// ✅ WebP with fallback
<picture>
  <source srcSet="image.webp" type="image/webp" />
  <source srcSet="image.jpg" type="image/jpeg" />
  <img src="image.jpg" alt="Description" />
</picture>
```

### 6.4 Network Optimization

#### Request Debouncing
```typescript
// src/hooks/useDebounce.ts
import { useState, useEffect } from 'react';

export const useDebounce = <T>(value: T, delay: number = 500): T => {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => clearTimeout(handler);
  }, [value, delay]);

  return debouncedValue;
};

// Usage
const SearchBar = () => {
  const [query, setQuery] = useState('');
  const debouncedQuery = useDebounce(query, 300);

  useEffect(() => {
    if (debouncedQuery) {
      searchAPI(debouncedQuery);
    }
  }, [debouncedQuery]);

  return <input value={query} onChange={(e) => setQuery(e.target.value)} />;
};
```

---

## 7. 🚨 에러 처리 및 로깅 (Error Handling & Logging)

### 7.1 Error Boundary

```tsx
// src/components/ErrorBoundary.tsx
import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught:', error, errorInfo);
    
    // Send to logging service (e.g., Sentry)
    // logErrorToService(error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <div className="error-container">
          <h1>문제가 발생했습니다</h1>
          <p>{this.state.error?.message}</p>
          <button onClick={() => window.location.reload()}>
            페이지 새로고침
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

// Usage
<ErrorBoundary>
  <App />
</ErrorBoundary>
```

### 7.2 Try-Catch Pattern

```typescript
// src/utils/errorHandler.ts
export class AppError extends Error {
  constructor(
    message: string,
    public code?: string,
    public statusCode?: number
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export const handleError = (error: unknown): AppError => {
  if (error instanceof AppError) {
    return error;
  }

  if (error instanceof Error) {
    return new AppError(error.message);
  }

  return new AppError('알 수 없는 오류가 발생했습니다');
};

// Usage in Component
const handleSubmit = async () => {
  try {
    await ticketService.createTicket(formData);
    toast.success('티켓이 생성되었습니다');
  } catch (error) {
    const appError = handleError(error);
    toast.error(appError.message);
    console.error('Ticket creation failed:', appError);
  }
};
```

### 7.3 Toast Notifications

```typescript
// src/utils/toast.ts (React Hot Toast)
import toast from 'react-hot-toast';

export const showToast = {
  success: (message: string) => {
    toast.success(message, {
      duration: 3000,
      position: 'top-right',
    });
  },

  error: (message: string) => {
    toast.error(message, {
      duration: 4000,
      position: 'top-right',
    });
  },

  loading: (message: string) => {
    return toast.loading(message, {
      position: 'top-right',
    });
  },

  promise: <T,>(
    promise: Promise<T>,
    messages: {
      loading: string;
      success: string;
      error: string;
    }
  ) => {
    return toast.promise(promise, messages, {
      position: 'top-right',
    });
  },
};
```

---

## 8. 🚀 배포 및 CI/CD (Deployment & CI/CD)

### 8.1 Build 최적화

```typescript
// vite.config.ts
export default defineConfig({
  build: {
    target: 'es2015',
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true, // Production에서 console 제거
        drop_debugger: true,
      },
    },
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom'],
          'router': ['react-router-dom'],
          'firebase': ['firebase/app', 'firebase/auth', 'firebase/firestore'],
        },
      },
    },
  },
});
```

### 8.2 GitHub Actions CI/CD

```yaml
# .github/workflows/deploy.yml
name: Deploy to Firebase

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Run linter
        run: npm run lint

      - name: Run tests
        run: npm run test

      - name: Build
        run: npm run build
        env:
          VITE_FIREBASE_API_KEY: ${{ secrets.VITE_FIREBASE_API_KEY }}
          VITE_FIREBASE_AUTH_DOMAIN: ${{ secrets.VITE_FIREBASE_AUTH_DOMAIN }}
          VITE_FIREBASE_PROJECT_ID: ${{ secrets.VITE_FIREBASE_PROJECT_ID }}

  deploy:
    needs: test
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    
    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'

      - name: Install dependencies
        run: npm ci

      - name: Build
        run: npm run build
        env:
          VITE_FIREBASE_API_KEY: ${{ secrets.VITE_FIREBASE_API_KEY }}
          VITE_FIREBASE_AUTH_DOMAIN: ${{ secrets.VITE_FIREBASE_AUTH_DOMAIN }}
          VITE_FIREBASE_PROJECT_ID: ${{ secrets.VITE_FIREBASE_PROJECT_ID }}

      - name: Deploy to Firebase
        uses: FirebaseExtended/action-hosting-deploy@v0
        with:
          repoToken: '${{ secrets.GITHUB_TOKEN }}'
          firebaseServiceAccount: '${{ secrets.FIREBASE_SERVICE_ACCOUNT }}'
          channelId: live
          projectId: your-project-id
```

### 8.3 환경별 배포 전략

#### 환경 분리
- **Development**: `dev` branch → Firebase Dev Environment
- **Staging**: `staging` branch → Firebase Staging Environment
- **Production**: `main` branch → Firebase Production Environment

#### Firebase Hosting 설정
```json
// firebase.json
{
  "hosting": {
    "public": "dist",
    "ignore": ["firebase.json", "**/.*", "**/node_modules/**"],
    "rewrites": [
      {
        "source": "**",
        "destination": "/index.html"
      }
    ],
    "headers": [
      {
        "source": "**/*.@(jpg|jpeg|gif|png|webp)",
        "headers": [
          {
            "key": "Cache-Control",
            "value": "max-age=31536000"
          }
        ]
      },
      {
        "source": "**/*.@(js|css)",
        "headers": [
          {
            "key": "Cache-Control",
            "value": "max-age=31536000"
          }
        ]
      }
    ]
  }
}
```

---

## 📋 개발 체크리스트 (Development Checklist)

### Pre-Development
- [ ] 프로젝트 구조 설정 완료
- [ ] Tailwind CSS + TypeScript 설정
- [ ] Firebase 프로젝트 생성 및 설정
- [ ] `.env` 파일 생성 및 환경 변수 설정
- [ ] Git 저장소 초기화

### During Development
- [ ] 컴포넌트에 TypeScript 타입 정의
- [ ] Service Layer를 통한 Firestore 접근
- [ ] 모든 사용자 입력에 대한 Validation (Zod)
- [ ] Error Boundary 및 Try-Catch 구현
- [ ] Loading/Error 상태 UI 처리
- [ ] Responsive Design 적용

### Pre-Deployment
- [ ] **Firestore Security Rules 변경** (Test Mode → Production Rules)
- [ ] 환경 변수 Production 값으로 변경
- [ ] Console.log 제거 (Terser 설정 확인)
- [ ] Bundle Size 분석 및 최적화
- [ ] Lighthouse 점수 확인 (90점 이상 목표)
- [ ] 모든 테스트 통과 확인

### Post-Deployment
- [ ] Production 환경에서 주요 기능 테스트
- [ ] Firebase Usage 모니터링 설정
- [ ] Error Tracking (Sentry 등) 설정
- [ ] Analytics 연동 확인
- [ ] 백업 자동화 설정

---

## 🔗 참고 자료 (References)

### 공식 문서
- [React Documentation](https://react.dev)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [Firebase Documentation](https://firebase.google.com/docs)
- [Vite Guide](https://vitejs.dev/guide/)

### 보안
- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Firebase Security Best Practices](https://firebase.google.com/docs/rules/best-practices)

### 테스팅
- [Vitest Documentation](https://vitest.dev)
- [React Testing Library](https://testing-library.com/react)
- [Playwright](https://playwright.dev)

---

## 📝 버전 히스토리 (Version History)

- **v2.0** (2024-12): Enhanced Edition
  - 테스팅 전략 추가
  - 성능 최적화 가이드 추가
  - 에러 처리 및 로깅 섹션 추가
  - CI/CD 가이드 추가
  - 보안 규칙 상세화

- **v1.0** (2024-11): Initial Release
  - 기본 디자인 시스템 정의
  - 코딩 컨벤션 수립
  - Firebase 기본 설정

---

**문서 작성자**: Haeng Chang  
**최종 수정일**: 2024-12-04  
**문서 관리**: 모든 프로젝트는 이 가이드라인을 준수해야 하며, 개선 사항은 버전 관리를 통해 반영합니다.
