import {
  Check,
  Ban,
  Shield,
  ShieldOff,
  Building2,
  Loader2,
} from 'lucide-react';
import type { UserProfile, Division } from '@/types';
import StatusBadge from './StatusBadge';

interface UserTableProps {
  filteredUsers: UserProfile[];
  totalCount: number;
  divisions: Division[];
  processingId: string | null;
  getDivisionName: (divisionId: string | null) => string;
  onApprove: (uid: string) => void;
  onReject: (uid: string) => void;
  onToggleAdmin: (user: UserProfile) => void;
  onDivisionChange: (uid: string, divisionId: string) => void;
}

export default function UserTable({
  filteredUsers,
  totalCount,
  divisions,
  processingId,
  getDivisionName,
  onApprove,
  onReject,
  onToggleAdmin,
  onDivisionChange,
}: UserTableProps) {
  return (
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
              className={`hover:bg-slate-50/50 transition-colors ${user.status === 'pending' ? 'bg-amber-50/30' : ''}`}
            >
              <td className="px-4 py-3">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-slate-200 rounded-full flex items-center justify-center text-slate-600 font-medium text-sm">
                    {user.displayName.charAt(0).toUpperCase()}
                  </div>
                  <span className="font-medium text-slate-700">{user.displayName}</span>
                </div>
              </td>
              <td className="px-4 py-3 text-slate-600">{user.email}</td>
              <td className="px-4 py-3">
                {user.status === 'approved' ? (
                  <select
                    value={user.divisionId || ''}
                    onChange={(e) => onDivisionChange(user.uid, e.target.value)}
                    disabled={processingId === user.uid}
                    className="px-2 py-1 border border-slate-200 rounded text-xs focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none disabled:opacity-50"
                  >
                    <option value="">미배정</option>
                    {divisions.map((d) => (
                      <option key={d.id} value={d.id}>{d.name}</option>
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
                <StatusBadge status={user.status} />
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
                            onClick={() => onApprove(user.uid)}
                            className="p-1.5 text-green-600 hover:bg-green-50 rounded transition-colors"
                            title="승인"
                          >
                            <Check className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => onReject(user.uid)}
                            className="p-1.5 text-red-600 hover:bg-red-50 rounded transition-colors"
                            title="거절"
                          >
                            <Ban className="w-4 h-4" />
                          </button>
                        </>
                      )}
                      {user.status === 'approved' && (
                        <button
                          onClick={() => onToggleAdmin(user)}
                          className={`p-1.5 rounded transition-colors ${user.role === 'admin'
                            ? 'text-amber-600 hover:bg-amber-50'
                            : 'text-indigo-600 hover:bg-indigo-50'
                            }`}
                          title={user.role === 'admin' ? '관리자 해제' : '관리자 지정'}
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
                          onClick={() => onApprove(user.uid)}
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
                {totalCount === 0
                  ? '등록된 사용자가 없습니다.'
                  : '필터 조건에 맞는 사용자가 없습니다.'}
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
