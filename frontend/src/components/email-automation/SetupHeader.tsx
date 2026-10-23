import React from 'react';
import { Mail, Sparkles, Moon, Sun, Check } from 'lucide-react';

interface SetupHeaderProps {
  darkMode: boolean;
  onToggleTheme: () => void;
  smtpConnected: boolean;
  smtpUsername?: string;
  currentStep: number;
  onStepClick: (step: number) => void;
  onOpenAiCopilot: () => void;
}

const STEPS = [
  { id: 1, label: 'Mailbox Setup', caption: 'SMTP & Security' },
  { id: 2, label: 'Audience & Leads', caption: 'CSV & Mapping' },
  { id: 3, label: 'AI Generation', caption: 'Personalized Copy' },
  { id: 4, label: 'Review & Launch', caption: 'Rate Limits' },
];

export const SetupHeader: React.FC<SetupHeaderProps> = ({
  darkMode,
  onToggleTheme,
  smtpConnected,
  smtpUsername,
  currentStep,
  onStepClick,
  onOpenAiCopilot,
}) => {
  return (
    <div className="w-full border-b border-zinc-200 dark:border-zinc-800 bg-white/95 dark:bg-zinc-950/95 backdrop-blur-md sticky top-0 z-40 transition-colors">
      {/* 1. Slim Top Bar */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-4">
        {/* Left: Brand */}
        <div className="flex items-center gap-2.5">
          <div className="h-7 w-7 rounded-lg bg-indigo-600 flex items-center justify-center text-white shadow-xs">
            <Mail className="h-4 w-4" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-sm font-semibold tracking-tight text-zinc-900 dark:text-white">
              Novotion <span className="font-normal text-zinc-500">Email</span>
            </span>
            <span className="hidden sm:inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-mono font-medium bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400">
              v2.0
            </span>
          </div>
        </div>

        {/* Center: Status Pill */}
        <div className="flex items-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/60 font-medium">
            {smtpConnected ? (
              <>
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                <span className="text-zinc-700 dark:text-zinc-200">
                  SMTP:{' '}
                  <span className="text-emerald-600 dark:text-emerald-400 font-semibold truncate max-w-[140px]">
                    {smtpUsername || 'Connected'}
                  </span>
                </span>
              </>
            ) : (
              <>
                <span className="h-2 w-2 rounded-full bg-zinc-400 dark:bg-zinc-500"></span>
                <span className="text-zinc-500 dark:text-zinc-400">SMTP: Disconnected</span>
              </>
            )}
          </div>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onOpenAiCopilot}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-zinc-700 dark:text-zinc-200 hover:text-zinc-900 dark:hover:text-white bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200/80 dark:hover:bg-zinc-700 transition-colors"
          >
            <Sparkles className="h-3.5 w-3.5 text-indigo-500" />
            <span className="hidden sm:inline">AI Copilot</span>
            <kbd className="hidden md:inline-block px-1 rounded bg-black/10 dark:bg-white/10 text-[10px] font-mono text-zinc-500 dark:text-zinc-400">
              ⌘K
            </kbd>
          </button>

          <button
            type="button"
            onClick={onToggleTheme}
            className="p-1.5 rounded-lg text-zinc-500 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
            title={darkMode ? 'Switch to Light' : 'Switch to Dark'}
          >
            {darkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {/* 2. Sleek Compact Stepper */}
      <div className="border-t border-zinc-100 dark:border-zinc-800/60 bg-zinc-50/50 dark:bg-zinc-900/30">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-2.5">
          <nav aria-label="Wizard Steps">
            <ol className="flex items-center justify-between gap-2 sm:gap-6 overflow-x-auto no-scrollbar">
              {STEPS.map((step, idx) => {
                const isComplete = currentStep > step.id;
                const isCurrent = currentStep === step.id;

                return (
                  <li key={step.id} className="flex-1 min-w-[120px]">
                    <button
                      type="button"
                      onClick={() => onStepClick(step.id)}
                      className="w-full flex items-center gap-2.5 py-1 text-left group"
                    >
                      {/* Step Indicator */}
                      <div
                        className={`h-6 w-6 rounded-md flex items-center justify-center text-xs font-medium flex-shrink-0 transition-all ${
                          isComplete
                            ? 'bg-emerald-600 text-white'
                            : isCurrent
                            ? 'bg-indigo-600 text-white shadow-xs'
                            : 'bg-zinc-200 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 group-hover:bg-zinc-300 dark:group-hover:bg-zinc-700'
                        }`}
                      >
                        {isComplete ? (
                          <Check className="h-3.5 w-3.5 stroke-[2.5]" />
                        ) : (
                          <span>{step.id}</span>
                        )}
                      </div>

                      {/* Step Text */}
                      <div className="min-w-0 flex-1">
                        <p
                          className={`text-xs font-medium tracking-tight truncate ${
                            isCurrent
                              ? 'text-zinc-900 dark:text-white font-semibold'
                              : isComplete
                              ? 'text-zinc-700 dark:text-zinc-300'
                              : 'text-zinc-400 dark:text-zinc-500'
                          }`}
                        >
                          {step.label}
                        </p>
                      </div>

                      {/* Line connector */}
                      {idx < STEPS.length - 1 && (
                        <div
                          className={`hidden md:block h-[1px] flex-1 transition-colors ${
                            currentStep > step.id
                              ? 'bg-emerald-500 dark:bg-emerald-600'
                              : 'bg-zinc-200 dark:border-zinc-800'
                          }`}
                        />
                      )}
                    </button>
                  </li>
                );
              })}
            </ol>
          </nav>
        </div>
      </div>
    </div>
  );
};
