import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FilterPanel } from '../components/FilterPanel';
import { DestinationPanel } from '../components/DestinationPanel';
import { LogViewer } from '../components/LogViewer';
import { Play } from 'lucide-react';
import { LogEntry } from '../types/log';

export const FilteringPage = () => {
    const { t } = useTranslation();
    const [logs, setLogs] = useState<LogEntry[]>([]);

    const clearLogs = () => setLogs([]);

    const startProcessing = () => {
        const testLog: LogEntry = {
            id: Date.now().toString(),
            timestamp: new Date().toLocaleTimeString(),
            source: "C:/Source/img.jpg",
            destination: "D:/Dest/2026/img.jpg",
            status: 'moved'
        };
        setLogs(prev => [testLog, ...prev]);
    };

    return (
        <main className="p-4 md:p-8">
            <div className="max-w-[1400px] mx-auto space-y-6">

                {/* Колонки выровнены по высоте (items-stretch) */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
                    <FilterPanel />
                    <DestinationPanel />
                </div>

                {/* Кнопка ПЕРЕД логами */}
                <div className="flex justify-center pt-4">
                    <button
                        onClick={startProcessing}
                        className="px-12 py-4 bg-blue-600 hover:bg-blue-500 text-white font-black text-lg rounded-2xl transition-all shadow-xl shadow-blue-600/20 active:scale-95 flex items-center gap-3"
                    >
                        <Play size={20} fill="currentColor" />
                        {t('start_button')}
                    </button>
                </div>

                {/* Логи вынесены в компонент */}
                <LogViewer logs={logs} onClear={clearLogs} />

            </div>
        </main>
    );
};