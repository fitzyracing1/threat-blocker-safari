import Dexie, { Table } from 'dexie';
import { ThreatIndicator, BlockedRequest, ThreatLog, ISPReport } from '../types';
declare class ThreatDatabase extends Dexie {
    indicators: Table<ThreatIndicator & {
        id?: number;
    }, number>;
    blocked: Table<BlockedRequest & {
        id?: number;
    }, number>;
    threatLogs: Table<ThreatLog, string>;
    ispReports: Table<ISPReport, string>;
    constructor();
    addIndicators(indicators: ThreatIndicator[]): Promise<void>;
    checkThreat(value: string): Promise<ThreatIndicator | undefined>;
    getIndicatorsBySource(source: string): Promise<ThreatIndicator[]>;
    addBlockedRequest(request: BlockedRequest): Promise<void>;
    getBlockedToday(): Promise<number>;
    getTotalBlocked(): Promise<number>;
    clearOldIndicators(olderThan: number): Promise<void>;
    addThreatLog(log: ThreatLog): Promise<void>;
    getThreatLogs(limit?: number): Promise<ThreatLog[]>;
    getThreatLogById(id: string): Promise<ThreatLog | undefined>;
    updateThreatLog(id: string, updates: Partial<ThreatLog>): Promise<void>;
    getThreatLogsByIP(ipAddress: string): Promise<ThreatLog[]>;
    getThreatLogsByAttackType(attackType: string): Promise<ThreatLog[]>;
    clearOldThreatLogs(days?: number): Promise<void>;
    addISPReport(report: ISPReport): Promise<void>;
    updateISPReport(id: string, updates: Partial<ISPReport>): Promise<void>;
    getPendingISPReports(): Promise<ISPReport[]>;
    getISPReports(limit?: number): Promise<ISPReport[]>;
}
export declare const db: ThreatDatabase;
export {};
