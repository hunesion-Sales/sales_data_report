---
name: react-firebase-webapp
description: Comprehensive development guidelines for building React + TypeScript + Firebase web applications with Tailwind CSS. Use this skill when developing or modifying web applications that involve React components, Firebase/Firestore integration, TypeScript code, form validation with Zod, UI styling with Tailwind, testing, performance optimization, or deployment. Covers design system, architecture patterns, security rules, testing strategy, CI/CD workflows, and error handling.
triggers:
  - build a React app
  - create Firebase functions
  - implement authentication
  - add form validation
  - style with Tailwind
  - optimize performance
  - setup CI/CD
  - deploy to Firebase
  - create component
  - add feature
  - implement hook
  - firestore query
  - security rules
  - React TypeScript
  - 컴포넌트 개발
  - 기능 추가
  - 스타일링
  - 성능 최적화
---

# React + Firebase + TypeScript 개발 가이드라인

이 프로젝트는 **Standard Development Guideline v2.0**을 따릅니다.
전체 가이드라인은 `.claude/standard_development_guideline_v2.md` 파일을 참조하세요.

## 핵심 원칙 요약

### 1. 디자인 시스템

**Color Palette:**
- Primary: `#a855f7` (Purple) - 메인 브랜드 컬러
- Accent: `#10b981` (Emerald) - 성공/보조 강조
- Danger: `#ef4444` (Red) - 삭제/오류
- Warning: `#f59e0b` (Amber) - 주의
- Info: `#3b82f6` (Blue) - 정보

**Typography:**
```css
font-family: 'Inter', 'Nanum Gothic', -apple-system, sans-serif;
```

**Button Patterns:**
```tsx
// Primary Button
<button className="
  px-6 py-2.5 rounded-xl font-medium
  bg-gradient-to-r from-primary-600 to-primary-500
  text-white shadow-lg shadow-primary-500/50
  hover:shadow-xl active:scale-95
  transition-all duration-200
">

// Secondary Button
<button className="
  px-6 py-2.5 rounded-xl font-medium
  bg-slate-200 text-slate-700
  hover:bg-slate-300 active:scale-95
  transition-all duration-200
">
```

**Card Patterns:**
```tsx
// Modern Card
<div className="
  rounded-2xl bg-white
  shadow-soft hover:shadow-soft-lg
  transition-shadow duration-300
  p-6 border border-slate-100
">

// Glassmorphism Card
<div className="
  rounded-2xl bg-white/80 backdrop-blur-md
  border border-white/20
  shadow-xl p-6
">
```

### 2. 코딩 컨벤션

**Naming:**
| Type | Convention | Example |
|------|------------|---------|
| Component Files | PascalCase | `TicketList.tsx` |
| Hook Files | camelCase + `use` | `useTickets.ts` |
| Service Files | camelCase + `Service` | `firestoreService.ts` |
| Variables | camelCase | `ticketCount` |
| Constants | UPPER_SNAKE_CASE | `MAX_RETRY_COUNT` |
| Boolean | `is/has/should` prefix | `isLoading`, `hasError` |
| Event Handlers | `handle` prefix | `handleClick` |

**폴더 구조:**
```
src/
├── components/
│   ├── ui/                # 재사용 원자 컴포넌트
│   ├── layout/            # 레이아웃 컴포넌트
│   └── features/          # 도메인별 복합 컴포넌트
├── contexts/              # React Context
├── hooks/                 # Custom Hooks
├── services/              # API/Firebase 서비스
├── types/                 # TypeScript 타입
├── utils/                 # 유틸리티 함수
├── config/                # 설정 파일
└── pages/                 # 라우트 페이지
```

**Import 순서:**
```tsx
// 1. External libraries
import React, { useState } from 'react';
import { Link } from 'react-router-dom';

// 2. Internal modules
import { Button } from '@/components/ui';
import { useAuth } from '@/hooks';

// 3. Types
import type { User } from '@/types';

// 4. Relative imports
import { TicketCard } from './TicketCard';

// 5. Styles
import './TicketList.css';
```

### 3. TypeScript Best Practices

```tsx
// Interface for object shapes
interface User {
  id: string;
  name: string;
  email: string;
}

// Type for unions
type UserRole = 'ADMIN' | 'USER' | 'GUEST';

// Avoid `any` - use `unknown` with type guards
const handleData = (data: unknown) => {
  if (isUser(data)) {
    console.log(data.name);
  }
};
```

### 4. Component Pattern

```tsx
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

### 5. Custom Hook Pattern

```tsx
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

### 6. Service Layer Pattern

**절대 컴포넌트에서 Firestore를 직접 호출하지 마세요!**

```typescript
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
}

export const ticketService = new TicketService();
```

### 7. Validation with Zod

```typescript
import { z } from 'zod';

export const ticketSchema = z.object({
  title: z.string()
    .min(5, '제목은 최소 5자 이상')
    .max(100, '제목은 100자 이하'),

  description: z.string()
    .min(10, '설명은 최소 10자 이상'),

  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']),
});

export type TicketInput = z.infer<typeof ticketSchema>;
```

### 8. Error Handling

```tsx
// Error Boundary 사용
<ErrorBoundary>
  <App />
</ErrorBoundary>

// Try-Catch Pattern
const handleSubmit = async () => {
  try {
    await ticketService.createTicket(formData);
    toast.success('티켓이 생성되었습니다');
  } catch (error) {
    const appError = handleError(error);
    toast.error(appError.message);
  }
};
```

### 9. Performance Optimization

```tsx
// React.memo for preventing re-renders
export const TicketCard = React.memo(({ ticket }) => {
  return <div>{ticket.title}</div>;
});

// useMemo for expensive calculations
const sortedTickets = useMemo(() => {
  return tickets.sort((a, b) => b.createdAt - a.createdAt);
}, [tickets]);

// useCallback for stable function references
const handleUpdate = useCallback((id) => {
  onUpdate(id);
}, [onUpdate]);

// Lazy loading for routes
const Dashboard = lazy(() => import('./pages/Dashboard'));
```

### 10. Responsive Design

```tsx
// Mobile-first approach
<div className="
  grid grid-cols-1
  sm:grid-cols-2
  lg:grid-cols-3
  xl:grid-cols-4
  gap-4
">

// Conditional visibility
<div className="hidden md:block">Desktop Only</div>
<div className="block md:hidden">Mobile Only</div>
```

## 상세 가이드라인

전체 가이드라인은 다음 파일을 참조하세요:
- `.claude/standard_development_guideline_v2.md`

이 파일에는 다음 내용이 포함되어 있습니다:
- 완전한 디자인 시스템 (Colors, Typography, Spacing)
- Firestore Security Rules 템플릿
- 테스팅 전략 (Unit, Integration, E2E)
- CI/CD 워크플로우
- 보안 Best Practices
