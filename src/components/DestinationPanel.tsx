import React from 'react';
import { useTranslation } from 'react-i18next';
import { FolderDown, Copy, Move, Layers, ShieldAlert, Settings } from 'lucide-react';
import { ConflictStrategy, DestinationSettings, GroupMode, MonthFormat } from '../types/filter';

export const DestinationPanel = ({ settings, setSettings }: {
    settings: DestinationSettings,
    setSettings: React.Dispatch<React.SetStateAction<DestinationSettings>>
}) => {
    const { t } = useTranslation();
    const api = window.electronAPI;

    const handleBrowse = async () => {
        const path = await api.selectFolder(settings.targetPath);
        if (path) setSettings({ ...settings, targetPath: path });
    };

    return (
        <div className="flex flex-col h-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm">
            <div className="flex-1 space-y-8">

                <section className="space-y-4">
                    <div className="flex items-center gap-2 text-emerald-500 font-bold text-sm uppercase tracking-wider">
                        <FolderDown size={16} />
                        {t('destination_folder')}
                    </div>
                    <div className="flex gap-2">
                        <input
                            readOnly
                            value={settings.targetPath}
                            className="flex-1 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm outline-none"
                        />
                        <button onClick={handleBrowse} className="bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2.5 rounded-xl transition flex items-center gap-2">
                            {t('browse')}
                        </button>
                    </div>

                    <div className="flex gap-4 p-1 bg-slate-100 dark:bg-slate-800 w-fit rounded-xl">
                        <button
                            onClick={() => setSettings({ ...settings, isMoveMode: true })}
                            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${settings.isMoveMode ? 'bg-white dark:bg-slate-700 shadow-sm text-emerald-600' : 'text-slate-500'}`}
                        >
                            <Move size={14} /> {t('action_move')}
                        </button>
                        <button
                            onClick={() => setSettings({ ...settings, isMoveMode: false })}
                            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${!settings.isMoveMode ? 'bg-white dark:bg-slate-700 shadow-sm text-emerald-600' : 'text-slate-500'}`}
                        >
                            <Copy size={14} /> {t('action_copy')}
                        </button>
                    </div>
                </section>

                <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-3">
                        <label className="text-xs font-bold text-slate-500 uppercase flex items-center gap-2">
                            <Layers size={14} /> {t('group_by')}
                        </label>
                        <select
                            value={settings.groupMode}
                            onChange={e => setSettings({ ...settings, groupMode: e.target.value as GroupMode })}
                            className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm outline-none"
                        >
                            <option value="none">{t('group_none')}</option>
                            <option value="years">{t('group_years')}</option>
                            <option value="quarters">{t('group_quarters')}</option>
                            <option value="months">{t('group_months')}</option>
                        </select>
                    </div>

                    <div className="space-y-3">
                        <label className="text-xs font-bold text-slate-500 uppercase flex items-center gap-2">
                            <Settings size={14} /> {t('folder_mask')}
                        </label>
                        <div className="flex gap-2">
                            {settings.groupMode === 'months' && (
                                <select
                                    value={settings.monthFormat}
                                    onChange={e => setSettings({ ...settings, monthFormat: e.target.value as MonthFormat })}
                                    className="bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs outline-none"
                                >
                                    <option value="number">№ (01)</option>
                                    <option value="name">Name (January)</option>
                                </select>
                            )}
                            <input
                                placeholder="e.g. folder_N_archive"
                                value={settings.folderMask}
                                onChange={e => setSettings({ ...settings, folderMask: e.target.value })}
                                className="flex-1 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm outline-none"
                            />
                        </div>
                        <p className="text-[10px] text-slate-400 italic leading-tight">
                            * N {t('mask_hint')}
                        </p>
                    </div>
                </section>

                <section className="space-y-4">
                    <div className="flex items-center gap-2 text-amber-500 font-bold text-sm uppercase tracking-wider">
                        <ShieldAlert size={16} />
                        {t('conflict_strategy')}
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        {(['skip', 'replace', 'compare_and_delete'] as ConflictStrategy[]).map((strategy) => (
                            <label
                                key={strategy}
                                className={`flex items-center justify-center p-3 rounded-xl border text-center cursor-pointer transition-all ${settings.conflictStrategy === strategy
                                    ? 'bg-amber-50 dark:bg-amber-900/20 border-amber-500 text-amber-600 font-bold'
                                    : 'bg-slate-50 dark:bg-slate-800/30 border-slate-200 dark:border-slate-700 text-slate-500 hover:border-slate-400'
                                    }`}
                            >
                                <input
                                    type="radio"
                                    className="hidden"
                                    name="strategy"
                                    value={strategy}
                                    checked={settings.conflictStrategy === strategy}
                                    onChange={() => setSettings({ ...settings, conflictStrategy: strategy })}
                                />
                                <span className="text-xs">{t(`strategy_${strategy}`)}</span>
                            </label>
                        ))}
                    </div>
                </section>
            </div>
        </div>
    );
};