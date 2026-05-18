import { CheckCircle2, Circle, AlertCircle, Loader2 } from 'lucide-react';
import { PIPELINE_STAGES, STATUS_LABELS } from '../../constants/workflow.js';
import usePipeline from '../../hooks/usePipeline.js';

const STAGE_BG = {
  gray:   { done: 'bg-gray-500',   active: 'bg-gray-100 border-2 border-gray-500',   pending: 'bg-gray-100' },
  indigo: { done: 'bg-indigo-500', active: 'bg-indigo-50 border-2 border-indigo-500', pending: 'bg-gray-100' },
  violet: { done: 'bg-violet-500', active: 'bg-violet-50 border-2 border-violet-500', pending: 'bg-gray-100' },
  cyan:   { done: 'bg-cyan-500',   active: 'bg-cyan-50 border-2 border-cyan-500',     pending: 'bg-gray-100' },
  teal:   { done: 'bg-teal-500',   active: 'bg-teal-50 border-2 border-teal-500',     pending: 'bg-gray-100' },
  purple: { done: 'bg-purple-500', active: 'bg-purple-50 border-2 border-purple-500', pending: 'bg-gray-100' },
  blue:   { done: 'bg-blue-500',   active: 'bg-blue-50 border-2 border-blue-500',     pending: 'bg-gray-100' },
  amber:  { done: 'bg-amber-500',  active: 'bg-amber-50 border-2 border-amber-500',   pending: 'bg-gray-100' },
  orange: { done: 'bg-orange-500', active: 'bg-orange-50 border-2 border-orange-500', pending: 'bg-gray-100' },
  sky:    { done: 'bg-sky-500',    active: 'bg-sky-50 border-2 border-sky-500',       pending: 'bg-gray-100' },
  green:  { done: 'bg-green-500',  active: 'bg-green-50 border-2 border-green-500',   pending: 'bg-gray-100' }
};

function StageIcon({ stage, isComplete, isActive, isFailed }) {
  const colors = STAGE_BG[stage.color] || STAGE_BG.gray;
  const base = 'w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 transition-all';

  if (isFailed) return (
    <div className={`${base} bg-red-100`}>
      <AlertCircle className="w-5 h-5 text-red-500" />
    </div>
  );
  if (isComplete) return (
    <div className={`${base} ${colors.done}`}>
      <CheckCircle2 className="w-5 h-5 text-white" />
    </div>
  );
  if (isActive) return (
    <div className={`${base} ${colors.active}`}>
      <Loader2 className="w-4 h-4 animate-spin text-gray-600" />
    </div>
  );
  return (
    <div className={`${base} ${colors.pending}`}>
      <Circle className="w-4 h-4 text-gray-300" />
    </div>
  );
}

/**
 * Displays the full 11-stage DoFE pipeline as a vertical stepper.
 *
 * Props:
 *   candidateId {string}  — fetches pipeline data automatically
 *   compact     {boolean} — render a condensed horizontal version
 */
export function PipelineStageTracker({ candidateId, compact = false }) {
  const { data, loading, error } = usePipeline(candidateId);

  if (loading) return (
    <div className="flex items-center gap-2 text-gray-500 text-sm p-4">
      <Loader2 className="w-4 h-4 animate-spin" />
      Loading pipeline…
    </div>
  );

  if (error) return (
    <div className="text-red-500 text-sm p-4">{error}</div>
  );

  if (!data) return null;

  const FAILED_STATUSES = new Set([
    'trade_test_failed', 'medical_failed', 'medical_expired',
    'orientation_absent', 'visa_rejected', 'cancelled'
  ]);

  const isFailed = FAILED_STATUSES.has(data.currentStatus);

  if (compact) return <CompactTracker data={data} isFailed={isFailed} />;

  return (
    <div className="space-y-1">
      {/* Progress bar */}
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">
          Pipeline Progress
        </span>
        <span className="text-sm font-semibold text-gray-700">
          {data.progress}%
        </span>
      </div>
      <div className="h-1.5 bg-gray-100 rounded-full mb-4">
        <div
          className="h-1.5 bg-primary-500 rounded-full transition-all duration-500"
          style={{ width: `${data.progress}%` }}
        />
      </div>

      {/* Stage list */}
      <ol className="space-y-0">
        {PIPELINE_STAGES.map((stage, idx) => {
          const stageData = data.stages.find(s => s.id === stage.id);
          const isComplete = stageData?.isComplete;
          const isActive = stageData?.isCurrentStage;
          const isStageFailure = isActive && isFailed;

          return (
            <li key={stage.id} className="flex gap-3">
              {/* Connector line + icon */}
              <div className="flex flex-col items-center">
                <StageIcon
                  stage={stage}
                  isComplete={isComplete}
                  isActive={isActive && !isFailed}
                  isFailed={isStageFailure}
                />
                {idx < PIPELINE_STAGES.length - 1 && (
                  <div className={`w-0.5 flex-1 my-1 min-h-4 ${isComplete ? 'bg-primary-300' : 'bg-gray-200'}`} />
                )}
              </div>

              {/* Stage label + current status chip */}
              <div className="pb-4 flex-1 min-w-0">
                <p className={`text-sm font-medium leading-8 ${
                  isActive ? 'text-gray-900' : isComplete ? 'text-gray-600' : 'text-gray-400'
                }`}>
                  {stage.label}
                </p>
                {isActive && (
                  <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium mt-0.5 ${
                    isStageFailure
                      ? 'bg-red-100 text-red-700'
                      : 'bg-primary-100 text-primary-700'
                  }`}>
                    {STATUS_LABELS[data.currentStatus] || data.currentStatus}
                  </span>
                )}
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

function CompactTracker({ data, isFailed }) {
  const currentOrder = PIPELINE_STAGES.find(s => s.id === data.currentStage)?.order ?? 0;

  return (
    <div className="flex items-center gap-1 overflow-x-auto py-1">
      {PIPELINE_STAGES.map((stage, idx) => {
        const isComplete = stage.order < currentOrder;
        const isActive = stage.id === data.currentStage;
        const colors = STAGE_BG[stage.color] || STAGE_BG.gray;

        return (
          <div key={stage.id} className="flex items-center">
            <div
              title={stage.label}
              className={`w-3 h-3 rounded-full flex-shrink-0 ${
                isActive && isFailed ? 'bg-red-500'
                : isComplete ? colors.done
                : isActive ? colors.done + ' ring-2 ring-offset-1 ring-gray-400'
                : 'bg-gray-200'
              }`}
            />
            {idx < PIPELINE_STAGES.length - 1 && (
              <div className={`h-0.5 w-3 ${isComplete ? 'bg-gray-400' : 'bg-gray-200'}`} />
            )}
          </div>
        );
      })}
      <span className="ml-2 text-xs text-gray-500 whitespace-nowrap">
        {data.progress}%
      </span>
    </div>
  );
}

export default PipelineStageTracker;
