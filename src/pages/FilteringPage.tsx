import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FilterPanel } from '../components/FilterPanel';
import { DestinationPanel } from '../components/DestinationPanel';
import { LogViewer } from '../components/LogViewer';
import { Play } from 'lucide-react';
import { LogEntry } from '../types/log';
import { ScanFilter, DestinationSettings } from '../types/filter';

export const FilteringPage = () => {
    const { t } = useTranslation();
    const [logs, setLogs] = useState<LogEntry[]>([]);

    const [filter, setFilter] = useState<ScanFilter>({
        sourcePath: '',
        includeSubfolders: true,
        typeMode: 'all',
        selectedExtensions: [],
        customExtensions: '',
        fileNameContains: '',
        dateStart: '',
        dateEnd: new Date().toISOString().split('T')[0],
        minSize: 0,
        maxSize: 1024 * 1024 * 10,
    });

    const [settings, setSettings] = useState<DestinationSettings>({
        targetPath: '',
        isMoveMode: true,
        groupMode: 'months',
        monthFormat: 'number',
        folderMask: 'N',
        conflictStrategy: 'skip',
    });

    // Initialize default paths and log listener
    useState(() => {
        const init = async () => {
            if (window.electronAPI) {
                const defaultSource = await window.electronAPI.getDefaultPath();
                setFilter(prev => ({ ...prev, sourcePath: defaultSource }));

                // For destination, we might want the same or a default "Pictures" folder
                // For now just use the same root
                setSettings(prev => ({ ...prev, targetPath: defaultSource }));

                window.electronAPI.onLogUpdate((log: LogEntry) => {
                    setLogs(prev => [log, ...prev]);
                });
            }
        };
        init();
    });

    const clearLogs = () => setLogs([]);

    const startProcessing = async () => {
        if (!filter.sourcePath || !settings.targetPath) {
            alert("Please select source and destination folders");
            return;
        }
        
        try {
            await window.electronAPI.processFiles(filter, settings);
        } catch (error) {
            console.error("Processing failed:", error);
            const errorLog: LogEntry = {
                id: Date.now().toString(),
                timestamp: new Date().toLocaleTimeString(),
                source: "-",
                destination: "-",
                status: 'error'
            };
            setLogs(prev => [errorLog, ...prev]);
        }
    };

    return (
        <main className="p-4 md:p-8">
            <div className="max-w-[1400px] mx-auto space-y-6">

                {/* Колонки выровнены по высоте (items-stretch) */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
                    <FilterPanel filter={filter} setFilter={setFilter} />
                    <DestinationPanel settings={settings} setSettings={setSettings} />
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