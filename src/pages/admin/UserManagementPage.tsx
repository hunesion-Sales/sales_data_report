import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Users, Loader2, AlertCircle, X, Save, Filter } from 'lucide-react';
import { useUserManagement, UserTable } from '@/features/userManagement';

export default function UserManagementPage() {
  const navigate = useNavigate();
  const {
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
  } = useUserManagement();

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
    <div className="min-h-screen bg-slate-50 relative">
      {notification && (
        <div className={`fixed top-4 left-1/2 transform -translate-x-1/2 z-50 px-6 py-3 rounded-full shadow-lg flex items-center gap-2 animate-bounce-in ${notification.type === 'error' ? 'bg-red-500 text-white' : 'bg-emerald-600 text-white'}`}>
          {notification.type === 'error' ? <X className="w-4 h-4" /> : <Save className="w-4 h-4" />}
          <span className="font-medium text-sm">{notification.message}</span>
        </div>
      )}

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
          {/* Filter */}
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
                <option key={d.id} value={d.id}>{d.name}</option>
              ))}
            </select>
            <span className="text-sm text-slate-500">
              {filteredUsers.length}명 / 총 {users.length}명
            </span>
          </div>

          <UserTable
            filteredUsers={filteredUsers}
            totalCount={users.length}
            divisions={divisions}
            processingId={processingId}
            getDivisionName={getDivisionName}
            onApprove={handleApprove}
            onReject={handleReject}
            onToggleAdmin={handleToggleAdmin}
            onDivisionChange={handleDivisionChange}
          />
        </div>
      </main>
    </div>
  );
}
