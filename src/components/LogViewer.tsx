import { Terminal, Trash2 } from 'lucide-react';
import { LogEntry } from '../types/log';
import { useTranslation } from 'react-i18next';

interface LogViewerProps {
    logs: LogEntry[];
    onClear: () => void;
}

export const LogViewer = ({ logs, onClear }: LogViewerProps) => {
    const { t } = useTranslation();
    const logTabTitle = t('log_tab');
    const waitingForProcess = t('waiting_for_process');
    const source = t('source');
    const destination = t('destination');
    const action_move = t('action_move');
    const action_copy = t('action_copy');
    const action_skip = t('action_skip');
    const action_replace = t('action_replace');
    const action_compare_and_delete = t('action_compare_and_delete');

    return (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl overflow-hidden shadow-sm flex flex-col h-[400px] mt-6">
            <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/30">
                <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400 font-bold text-sm uppercase tracking-widest">
                    <Terminal size={18} className="text-blue-500" />
                    {logTabTitle}
                </div>
                <button onClick={onClear} className="p-2 text-slate-400 hover:text-red-500 transition-colors">
                    <Trash2 size={18} />
                </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 font-mono text-[13px] space-y-2 bg-[#0d1117] text-slate-300">
                {logs.length === 0 ? (
                    <div className="h-full flex items-center justify-center text-slate-500 italic">
                        {waitingForProcess}
                    </div>
                ) : (
                    logs.map((log) => (
                        <div key={log.id} className="border-b border-slate-800/50 pb-2 animate-in fade-in slide-in-from-left-2">
                            <div className="flex items-start gap-3">
                                <span className="text-slate-500">[{log.timestamp}]</span>
                                <span className={`font-bold uppercase ${log.status === 'error' ? 'text-red-400' :
                                    log.status === 'skipped' ? 'text-amber-400' : 'text-emerald-400'
                                    }`}>
                                    {log.status.replace('_', ' ')}
                                </span>
                            </div>
                            <div className="ml-8 mt-1 space-y-0.5 opacity-80">
                                <div className="flex gap-2 truncate">
                                    <span className="text-blue-400 shrink-0">{source}:</span> {log.source}
                                </div>
                                <div className="flex gap-2 truncate">
                                    <span className="text-purple-400 shrink-0">{destination}:</span> {log.destination}
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};