/** 사용자 역할 */
export type UserRole = 'admin' | 'user';

/** 사용자 상태 */
export type UserStatus = 'pending' | 'approved' | 'rejected';

/** 사용자 프로필 (Firestore users/{uid}) */
export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  divisionId: string | null;
  divisionName?: string; // 클라이언트 편의용
  role: UserRole;
  status: UserStatus;
  mustChangePassword?: boolean;
  createdAt: Date;
  updatedAt: Date;
}

/** 영업부문 (Firestore divisions/{divisionId}) */
export interface Division {
  id: string;
  name: string;
  sortOrder: number;
  createdAt: Date;
  updatedAt: Date;
}

/** 인증 컨텍스트 상태 */
export interface AuthState {
  user: UserProfile | null;
  loading: boolean;
  error: string | null;
}
