import type { Division, QuarterlyTarget, QuarterlyTargetInput, Quarter } from '@/types';
import {
  useTargetMatrix,
  ModeToggle,
  AnnualTargetInputs,
  RatioInputs,
  TargetDataTable,
} from '@/features/targetInput';

interface TargetInputTableProps {
  divisions: Division[];
  targets: QuarterlyTarget[];
  year: number;
  isSaving: boolean;
  onSave: (inputs: QuarterlyTargetInput[], createdBy: string) => Promise<void>;
  createdBy: string;
}

export default function TargetInputTable({
  divisions,
  targets,
  year,
  isSaving,
  onSave,
  createdBy,
}: TargetInputTableProps) {
  const {
    matrix,
    mode,
    setMode,
    ratios,
    ratioTotal,
    hasChanges,
    footerTotals,
    handleRatioChange,
    handleChange,
    handleTotalChange,
    handleSave,
  } = useTargetMatrix({ divisions, targets, year });

  if (divisions.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8 text-center text-slate-500">
        등록된 영업부문이 없습니다.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 space-y-4">
        <ModeToggle mode={mode} onModeChange={setMode} />

        {mode === 'percentage' && (
          <AnnualTargetInputs
            divisions={divisions}
            matrix={matrix}
            onTotalChange={handleTotalChange}
          />
        )}

        {mode === 'percentage' && (
          <RatioInputs
            ratios={ratios}
            ratioTotal={ratioTotal}
            onRatioChange={handleRatioChange}
          />
        )}
      </div>

      <TargetDataTable
        divisions={divisions}
        matrix={matrix}
        mode={mode}
        year={year}
        isSaving={isSaving}
        hasChanges={hasChanges}
        ratioTotal={ratioTotal}
        footerTotals={footerTotals}
        onChange={handleChange}
        onSave={() => handleSave(onSave, createdBy)}
      />
    </div>
  );
}
