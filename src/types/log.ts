export interface LogEntry {
    id: string;
    timestamp: string;
    source: string;
    destination: string;
    status: 'moved' | 'copied' | 'skipped' | 'error' | 'deleted_duplicate';
    message?: string;
}