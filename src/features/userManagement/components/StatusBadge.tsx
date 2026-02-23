import { CheckCircle, Clock, XCircle } from 'lucide-react';
import type { UserStatus } from '@/types';

interface StatusBadgeProps {
  status: UserStatus;
}

export default function StatusBadge({ status }: StatusBadgeProps) {
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
}
