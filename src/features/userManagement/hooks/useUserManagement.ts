import { useState, useEffect, useMemo } from 'react';
import { getUsers } from '@/firebase/services/userService';
import { getDivisions } from '@/firebase/services/divisionService';
import { useNotification } from '@/hooks/useNotification';
import {
  approveUser,
  rejectUser,
  updateUserRole,
  updateUserDivision,
  createUserByAdmin,
  sendPasswordReset,
} from '@/firebase/services/authService';
import type { UserProfile, Division } from '@/types';

export function useUserManagement() {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [divisions, setDivisions] = useState<Division[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { notification, showNotification } = useNotification();

  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterDivision, setFilterDivision] = useState<string>('all');
  const [processingId, setProcessingId] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setIsLoading(true);
      const [usersData, divisionsData] = await Promise.all([getUsers(), getDivisions()]);
      setUsers(usersData);
      setDivisions(divisionsData);
      setError(null);
    } catch (err) {
      setError('데이터를 불러오는데 실패했습니다.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      if (filterStatus !== 'all' && u.status !== filterStatus) return false;
      if (filterDivision !== 'all' && u.divisionId !== filterDivision) return false;
      return true;
    });
  }, [users, filterStatus, filterDivision]);

  const pendingCount = useMemo(
    () => users.filter((u) => u.status === 'pending').length,
    [users]
  );

  const getDivisionName = (divisionId: string | null) => {
    if (!divisionId) return '미배정';
    return divisions.find((d) => d.id === divisionId)?.name || '미배정';
  };

  const handleApprove = async (uid: string) => {
    try {
      setProcessingId(uid);
      await approveUser(uid);
      await loadData();
    } catch (err) {
      setError('사용자 승인에 실패했습니다.');
      console.error(err);
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (uid: string) => {
    try {
      setProcessingId(uid);
      await rejectUser(uid);
      await loadData();
    } catch (err) {
      setError('사용자 거절에 실패했습니다.');
      console.error(err);
    } finally {
      setProcessingId(null);
    }
  };

  const handleToggleAdmin = async (user: UserProfile) => {
    try {
      setProcessingId(user.uid);
      const newRole = user.role === 'admin' ? 'user' : 'admin';
      await updateUserRole(user.uid, newRole);
      await loadData();
    } catch (err) {
      setError('역할 변경에 실패했습니다.');
      console.error(err);
    } finally {
      setProcessingId(null);
    }
  };

  const handleDivisionChange = async (uid: string, divisionId: string) => {
    try {
      setProcessingId(uid);
      await updateUserDivision(uid, divisionId);

      if (divisionId === 'solution') {
        const user = users.find(u => u.uid === uid);
        if (user && user.role !== 'admin') {
          await updateUserRole(uid, 'admin');
          showNotification('솔루션사업본부 배정으로 관리자 권한이 자동 부여되었습니다.');
        } else {
          showNotification('부문이 변경되었습니다.');
        }
      } else {
        showNotification('부문이 변경되었습니다.');
      }

      await loadData();
    } catch (err) {
      setError('부문 변경에 실패했습니다.');
      console.error(err);
    } finally {
      setProcessingId(null);
    }
  };

  const handleAddUser = async (
    email: string,
    password: string,
    displayName: string,
    divisionId: string | null
  ) => {
    await createUserByAdmin(email, password, displayName, divisionId);
    showNotification(`${displayName} 사용자가 추가되었습니다.`);
    await loadData();
  };

  const handlePasswordReset = async (uid: string, email: string) => {
    try {
      setProcessingId(uid);
      await sendPasswordReset(uid, email);
      showNotification(`${email}로 비밀번호 초기화 메일이 발송되었습니다.`);
    } catch (err) {
      setError('비밀번호 초기화 메일 발송에 실패했습니다.');
      console.error(err);
    } finally {
      setProcessingId(null);
    }
  };

  return {
    users,
    divisions,
    filteredUsers,
    pendingCount,
    isLoading,
    error,
    setError,
    notification,
    filterStatus,
    setFilterStatus,
    filterDivision,
    setFilterDivision,
    processingId,
    getDivisionName,
    handleApprove,
    handleReject,
    handleToggleAdmin,
    handleDivisionChange,
    handleAddUser,
    handlePasswordReset,
  };
}
