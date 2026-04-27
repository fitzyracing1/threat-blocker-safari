interface Stats {
    totalBlocked: number;
    blockedToday: number;
    indicatorCount: number;
    bySource: Record<string, number>;
    bySeverity: Record<string, number>;
}
declare function loadStats(): Promise<void>;
declare function updateFeedsList(bySource: Record<string, number>): void;
