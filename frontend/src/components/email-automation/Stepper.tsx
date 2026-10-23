import React from 'react';
import { Check, Mail, Users, Sparkles, Rocket } from 'lucide-react';

interface StepperProps {
  currentStep: number;
  onStepClick?: (stepId: number) => void;
}

const STEPS: { id: number; title: string; subtitle: string; icon: React.ComponentType<{ className?: string }> }[] = [
  {
    id: 1,
    title: 'Connect Mailbox',
    subtitle: 'SMTP & Security Handshake',
    icon: Mail,
  },
  {
    id: 2,
    title: 'Recipients & Mapping',
    subtitle: 'CSV Leads & Custom Tags',
    icon: Users,
  },
  {
    id: 3,
    title: 'AI Personalization',
    subtitle: 'Dynamic Prompts & Tone',
    icon: Sparkles,
  },
  {
    id: 4,
    title: 'Review & Launch',
    subtitle: 'Pre-flight & Rate Limits',
    icon: Rocket,
  },
];

export const Stepper: React.FC<StepperProps> = ({ currentStep, onStepClick }) => {
  return (
    <div className="w-full bg-white dark:bg-[#09090b] border-b border-slate-200/80 dark:border-white/10 transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <nav aria-label="Progress">
          <ol className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
            {STEPS.map((step, index) => {
              const isComplete = currentStep > step.id;
              const isCurrent = currentStep === step.id;
              const Icon = step.icon;

              return (
                <li key={step.id} className="relative">
                  {/* Subtle connector line for desktop */}
                  {index > 0 && (
                    <div
                      className="hidden md:block absolute top-4 -left-3 lg:-left-3.5 w-6 lg:w-7 h-[1px] -translate-x-1/2"
                      aria-hidden="true"
                    >
                      <div
                        className={`h-full transition-colors duration-300 ${
                          isComplete || isCurrent
                            ? 'bg-indigo-600 dark:bg-indigo-500'
                            : 'bg-slate-200 dark:bg-zinc-800'
                        }`}
                      />
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={() => onStepClick && onStepClick(step.id)}
                    disabled={!onStepClick}
                    className={`w-full text-left group flex items-center gap-3 p-2.5 rounded-xl transition-all duration-200 ${
                      isCurrent
                        ? 'bg-slate-50 dark:bg-zinc-900/90 ring-1 ring-slate-200 dark:ring-zinc-800 shadow-xs'
                        : 'hover:bg-slate-50/70 dark:hover:bg-zinc-900/40'
                    }`}
                  >
                    {/* Step Icon / Number Indicator */}
                    <div className="relative flex-shrink-0">
                      {isComplete ? (
                        <div className="h-8 w-8 rounded-lg bg-emerald-500 dark:bg-emerald-600 text-white flex items-center justify-center shadow-xs shadow-emerald-500/20">
                          <Check className="h-4 w-4 stroke-[2.5]" />
                        </div>
                      ) : isCurrent ? (
                        <div className="h-8 w-8 rounded-lg bg-indigo-600 dark:bg-indigo-500 text-white flex items-center justify-center shadow-sm shadow-indigo-500/30 ring-2 ring-indigo-500/30 ring-offset-2 ring-offset-white dark:ring-offset-zinc-950">
                          <Icon className="h-4 w-4 stroke-[2]" />
                        </div>
                      ) : (
                        <div className="h-8 w-8 rounded-lg bg-slate-100 dark:bg-zinc-800/80 text-slate-400 dark:text-zinc-500 flex items-center justify-center border border-slate-200/80 dark:border-zinc-700/60 font-semibold text-xs group-hover:border-slate-300 dark:group-hover:border-zinc-600 transition-colors">
                          <Icon className="h-4 w-4 stroke-[1.75]" />
                        </div>
                      )}
                    </div>

                    {/* Step Text Info */}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] font-bold tracking-wider uppercase text-slate-400 dark:text-zinc-500">
                          Step 0{step.id}
                        </span>
                        {isCurrent && (
                          <span className="inline-block w-1.5 h-1.5 rounded-full bg-indigo-600 dark:bg-indigo-400 animate-pulse" />
                        )}
                      </div>
                      <p
                        className={`text-xs font-semibold truncate transition-colors ${
                          isCurrent
                            ? 'text-slate-900 dark:text-white'
                            : isComplete
                            ? 'text-slate-700 dark:text-zinc-300'
                            : 'text-slate-500 dark:text-zinc-500'
                        }`}
                      >
                        {step.title}
                      </p>
                      <p className="text-[11px] text-slate-400 dark:text-zinc-500 truncate hidden lg:block">
                        {step.subtitle}
                      </p>
                    </div>
                  </button>
                </li>
              );
            })}
          </ol>
        </nav>
      </div>
    </div>
  );
};
