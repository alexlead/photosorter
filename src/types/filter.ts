export type FileTypeMode = 'all' | 'photo' | 'video' | 'selected' | 'custom';

export interface ScanFilter {
    sourcePath: string;
    includeSubfolders: boolean;
    typeMode: FileTypeMode;
    selectedExtensions: string[];
    customExtensions: string;
    fileNameContains: string;
    dateStart: string;
    dateEnd: string;
    minSize: number;
    maxSize: number;
}

export type GroupMode = 'none' | 'months' | 'quarters' | 'years';
export type ConflictStrategy = 'skip' | 'replace' | 'compare_and_delete';
export type MonthFormat = 'number' | 'name';

export interface DestinationSettings {
    targetPath: string;
    isMoveMode: boolean;
    groupMode: GroupMode;
    monthFormat: MonthFormat;
    folderMask: string;
    conflictStrategy: ConflictStrategy;
}