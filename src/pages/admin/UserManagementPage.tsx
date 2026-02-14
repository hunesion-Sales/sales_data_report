import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Users,
  Loader2,
  AlertCircle,
  X,
  Check,
  Ban,
  Shield,
  ShieldOff,
  Building2,
  Clock,
  CheckCircle,
  XCircle,
  Filter,
} from 'lucide-react';
import { getUsers } from '@/firebase/services/userService';
import { getDivisions } from '@/firebase/services/divisionService';
import {
  approveUser,
  rejectUser,
  updateUserRole,
  updateUserDivision,
} from '@/firebase/services/authService';
import type { UserProfile, Division, UserStatus } from '@/types';

export default function UserManagementPage() {
  const navigate = useNavigate();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [divisions, setDivisions] = useState<Division[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 필터
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterDivision, setFilterDivision] = useState<string>('all');

  // 작업 중 상태
  const [processingId, setProcessingId] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setIsLoading(true);
      const [usersData, divisionsData] = await Promise.all([
        getUsers(),
        getDivisions(),
      ]);
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

  const getStatusBadge = (status: UserStatus) => {
    switch (status) {
      case 'approved':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-green-100 text-green-700 rounded text-xs">
            <CheckCircle className="w-3 h-3" />
            승인됨
          </span>
        );
      case 'pending':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-amber-100 text-amber-700 rounded text-xs">
            <Clock className="w-3 h-3" />
            대기중
          </span>
        );
      case 'rejected':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-red-100 text-red-700 rounded text-xs">
            <XCircle className="w-3 h-3" />
            거절됨
          </span>
        );
    }
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
      await loadData();
    } catch (err) {
      setError('부문 변경에 실패했습니다.');
      console.error(err);
    } finally {
      setProcessingId(null);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
          <p className="text-slate-500">사용자 목록을 불러오는 중...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-sm">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/')}
              className="p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-2">
              <Users className="w-6 h-6 text-blue-600" />
              <h1 className="text-xl font-bold text-slate-900">사용자 관리</h1>
              {pendingCount > 0 && (
                <span className="px-2 py-0.5 bg-amber-100 text-amber-700 rounded-full text-xs font-medium">
                  {pendingCount}명 대기
                </span>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-700">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <span>{error}</span>
            <button onClick={() => setError(null)} className="ml-auto">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          {/* 필터 */}
          <div className="p-4 border-b border-slate-100 bg-slate-50 flex flex-wrap gap-4 items-center">
            <Filter className="w-4 h-4 text-slate-400" />
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-3 py-1.5 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
            >
              <option value="all">모든 상태</option>
              <option value="pending">대기중</option>
              <option value="approved">승인됨</option>
              <option value="rejected">거절됨</option>
            </select>
            <select
              value={filterDivision}
              onChange={(e) => setFilterDivision(e.target.value)}
              className="px-3 py-1.5 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
            >
              <option value="all">모든 부문</option>
              <option value="">미배정</option>
              {divisions.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </select>
            <span className="text-sm text-slate-500">
              {filteredUsers.length}명 / 총 {users.length}명
            </span>
          </div>

          {/* 사용자 목록 */}
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-100 text-slate-600">
                <tr>
                  <th className="px-4 py-3 text-left font-medium">사용자</th>
                  <th className="px-4 py-3 text-left font-medium">이메일</th>
                  <th className="px-4 py-3 text-left font-medium">부문</th>
                  <th className="px-4 py-3 text-center font-medium">상태</th>
                  <th className="px-4 py-3 text-center font-medium">역할</th>
                  <th className="px-4 py-3 text-center font-medium">관리</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredUsers.map((user) => (
                  <tr
                    key={user.uid}
                    className={`hover:bg-slate-50/50 transition-colors ${
                      user.status === 'pending' ? 'bg-amber-50/30' : ''
                    }`}
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-slate-200 rounded-full flex items-center justify-center text-slate-600 font-medium text-sm">
                          {user.displayName.charAt(0).toUpperCase()}
                        </div>
                        <span className="font-medium text-slate-700">
                          {user.displayName}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-slate-600">{user.email}</td>
                    <td className="px-4 py-3">
                      {user.status === 'approved' ? (
                        <select
                          value={user.divisionId || ''}
                          onChange={(e) =>
                            handleDivisionChange(user.uid, e.target.value)
                          }
                          disabled={processingId === user.uid}
                          className="px-2 py-1 border border-slate-200 rounded text-xs focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none disabled:opacity-50"
                        >
                          <option value="">미배정</option>
                          {divisions.map((d) => (
                            <option key={d.id} value={d.id}>
                              {d.name}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-slate-100 text-slate-500 rounded text-xs">
                          <Building2 className="w-3 h-3" />
                          {getDivisionName(user.divisionId)}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {getStatusBadge(user.status)}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {user.role === 'admin' ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-indigo-100 text-indigo-700 rounded text-xs">
                          <Shield className="w-3 h-3" />
                          관리자
                        </span>
                      ) : (
                        <span className="text-slate-400 text-xs">일반</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-center gap-1">
                        {processingId === user.uid ? (
                          <Loader2 className="w-4 h-4 text-slate-400 animate-spin" />
                        ) : (
                          <>
                            {user.status === 'pending' && (
                              <>
                                <button
                                  onClick={() => handleApprove(user.uid)}
                                  className="p-1.5 text-green-600 hover:bg-green-50 rounded transition-colors"
                                  title="승인"
                                >
                                  <Check className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => handleReject(user.uid)}
                                  className="p-1.5 text-red-600 hover:bg-red-50 rounded transition-colors"
                                  title="거절"
                                >
                                  <Ban className="w-4 h-4" />
                                </button>
                              </>
                            )}
                            {user.status === 'approved' && (
                              <button
                                onClick={() => handleToggleAdmin(user)}
                                className={`p-1.5 rounded transition-colors ${
                                  user.role === 'admin'
                                    ? 'text-amber-600 hover:bg-amber-50'
                                    : 'text-indigo-600 hover:bg-indigo-50'
                                }`}
                                title={
                                  user.role === 'admin'
                                    ? '관리자 해제'
                                    : '관리자 지정'
                                }
                              >
                                {user.role === 'admin' ? (
                                  <ShieldOff className="w-4 h-4" />
                                ) : (
                                  <Shield className="w-4 h-4" />
                                )}
                              </button>
                            )}
                            {user.status === 'rejected' && (
                              <button
                                onClick={() => handleApprove(user.uid)}
                                className="p-1.5 text-green-600 hover:bg-green-50 rounded transition-colors"
                                title="다시 승인"
                              >
                                <Check className="w-4 h-4" />
                              </button>
                            )}
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}

                {filteredUsers.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-slate-500">
                      {users.length === 0
                        ? '등록된 사용자가 없습니다.'
                        : '필터 조건에 맞는 사용자가 없습니다.'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}
