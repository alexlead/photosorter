import React from 'react';
import { useTranslation } from 'react-i18next';
import { FolderOpen, Calendar, HardDrive, FileSearch, Settings2 } from 'lucide-react';
import { FileTypeMode, ScanFilter } from '../types/filter';

const COMMON_PHOTO = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'heic'];
const COMMON_VIDEO = ['mp4', 'mov', 'avi', 'mkv', 'wmv'];

export const FilterPanel = ({ filter, setFilter }: {
    filter: ScanFilter,
    setFilter: React.Dispatch<React.SetStateAction<ScanFilter>>
}) => {
    const { t } = useTranslation();
    const today = new Date().toISOString().split('T')[0];

    const handleBrowse = async () => {
        const path = await window.electronAPI.selectFolder(filter.sourcePath);
        if (path) setFilter({ ...filter, sourcePath: path });
    };

    const toggleExtension = (ext: string) => {
        const current = filter.selectedExtensions;
        setFilter({
            ...filter,
            selectedExtensions: current.includes(ext)
                ? current.filter(e => e !== ext)
                : [...current, ext]
        });
    };

    return (
        <div className="flex flex-col h-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm">
            <div className="flex-1 space-y-8">

                <section className="space-y-4">
                    <div className="flex items-center gap-2 text-blue-500 font-bold text-sm uppercase tracking-wider">
                        <HardDrive size={16} />
                        {t('source_folder')}
                    </div>
                    <div className="flex gap-2">
                        <input
                            readOnly
                            value={filter.sourcePath}
                            className="flex-1 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-blue-500 transition-all"
                        />
                        <button onClick={handleBrowse} className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2.5 rounded-xl transition flex items-center gap-2">
                            <FolderOpen size={18} />
                            {t('browse')}
                        </button>
                    </div>
                    <label className="flex items-center gap-3 cursor-pointer group w-fit">
                        <input
                            type="checkbox"
                            checked={filter.includeSubfolders}
                            onChange={e => setFilter({ ...filter, includeSubfolders: e.target.checked })}
                            className="w-5 h-5 rounded border-slate-300 dark:border-slate-600 accent-blue-600"
                        />
                        <span className="text-sm text-slate-600 dark:text-slate-400 group-hover:text-blue-500 transition-colors">
                            {t('include_subfolders')}
                        </span>
                    </label>
                </section>

                <section className="space-y-4">
                    <div className="flex items-center gap-2 text-blue-500 font-bold text-sm uppercase tracking-wider">
                        <Settings2 size={16} />
                        {t('file_types')}
                    </div>
                    <select
                        value={filter.typeMode}
                        onChange={e => setFilter({ ...filter, typeMode: e.target.value as FileTypeMode })}
                        className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm outline-none appearance-none"
                    >
                        <option value="all">{t('mode_all')}</option>
                        <option value="photo">{t('mode_photo')}</option>
                        <option value="video">{t('mode_video')}</option>
                        <option value="selected">{t('mode_selected')}</option>
                        <option value="custom">{t('mode_custom')}</option>
                    </select>

                    {filter.typeMode === 'selected' && (
                        <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 p-4 bg-slate-50 dark:bg-slate-800/30 rounded-2xl border border-dashed border-slate-200 dark:border-slate-700">
                            {[...COMMON_PHOTO, ...COMMON_VIDEO].map(ext => (
                                <label key={ext} className="flex items-center gap-2 text-xs cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={filter.selectedExtensions.includes(ext)}
                                        onChange={() => toggleExtension(ext)}
                                        className="accent-blue-600"
                                    />
                                    <span className="uppercase">{ext}</span>
                                </label>
                            ))}
                        </div>
                    )}

                    {filter.typeMode === 'custom' && (
                        <input
                            placeholder="png, raw, webp..."
                            value={filter.customExtensions}
                            onChange={e => setFilter({ ...filter, customExtensions: e.target.value })}
                            className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm outline-none"
                        />
                    )}
                </section>

                <section className="grid grid-cols-1 md:grid-cols-2 gap-6">

                    <div className="space-y-3">
                        <label className="text-xs font-bold text-slate-500 uppercase flex items-center gap-2">
                            <FileSearch size={14} /> {t('filename_contains')}
                        </label>
                        <input
                            placeholder="e.g. *holiday*"
                            value={filter.fileNameContains}
                            onChange={e => setFilter({ ...filter, fileNameContains: e.target.value })}
                            className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm"
                        />
                    </div>

                    <div className="space-y-3">
                        <label className="text-xs font-bold text-slate-500 uppercase flex items-center gap-2">
                            <Calendar size={14} /> {t('date_range')}
                        </label>
                        <div className="flex gap-2 items-center">
                            <input
                                type="date"
                                max={today}
                                value={filter.dateStart}
                                onChange={e => setFilter({ ...filter, dateStart: e.target.value })}
                                className="flex-1 bg-slate-50 dark:bg-slate-800/50 p-2 rounded-lg text-xs border border-slate-200 dark:border-slate-700"
                            />
                            <span className="text-slate-400">-</span>
                            <input
                                type="date"
                                max={today}
                                value={filter.dateEnd}
                                onChange={e => setFilter({ ...filter, dateEnd: e.target.value })}
                                className="flex-1 bg-slate-50 dark:bg-slate-800/50 p-2 rounded-lg text-xs border border-slate-200 dark:border-slate-700"
                            />
                        </div>
                    </div>

                    <div className="space-y-3 md:col-span-2">
                        <label className="text-xs font-bold text-slate-500 uppercase">{t('file_size_kb')}</label>
                        <div className="flex gap-4">
                            <div className="flex-1 space-y-1">
                                <span className="text-[10px] text-slate-400 italic">Min</span>
                                <input
                                    type="number"
                                    value={filter.minSize}
                                    onChange={e => setFilter({ ...filter, minSize: Number(e.target.value) })}
                                    className="w-full bg-slate-50 dark:bg-slate-800/50 p-2 rounded-lg text-sm border border-slate-200 dark:border-slate-700"
                                />
                            </div>
                            <div className="flex-1 space-y-1">
                                <span className="text-[10px] text-slate-400 italic">Max</span>
                                <input
                                    type="number"
                                    value={filter.maxSize}
                                    onChange={e => setFilter({ ...filter, maxSize: Number(e.target.value) })}
                                    className="w-full bg-slate-50 dark:bg-slate-800/50 p-2 rounded-lg text-sm border border-slate-200 dark:border-slate-700"
                                />
                            </div>
                        </div>
                    </div>
                </section>
            </div>
        </div>
    );
};