import { Music } from 'lucide-react';
import { STAGE_COLORS } from '@/lib/config';
import { cn } from '@/lib/utils';

interface StageFilterBarProps {
  selectedStage: string | null;
  onSelect: (stage: string | null) => void;
}

export function StageFilterBar({ selectedStage, onSelect }: StageFilterBarProps) {
  return (
    <section className="bg-card border-b border-border py-4">
      <div className="container mx-auto px-4 md:px-8">
        <div className="flex flex-wrap items-center gap-4 justify-center">
          <span className="font-display text-muted-foreground text-xs tracking-widest uppercase">
            Filter:
          </span>
          {Object.entries(STAGE_COLORS).map(([stage, colors]) => {
            const isActive = selectedStage === stage;
            return (
              <button
                key={stage}
                onClick={() => onSelect(isActive ? null : stage)}
                className={cn(
                  'flex items-center gap-1.5 border rounded px-3 py-1 text-xs font-display tracking-wider transition-all cursor-pointer',
                  isActive
                    ? `${colors.bg} text-white border-transparent`
                    : `${colors.border} ${colors.text} hover:opacity-80`,
                )}
              >
                <Music size={10} />
                {stage}
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
}
