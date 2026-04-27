import Dexie, { Table } from 'dexie';
import { ThreatIndicator, BlockedRequest, ThreatLog, ISPReport } from '../types';

class ThreatDatabase extends Dexie {
  indicators!: Table<ThreatIndicator & { id?: number }, number>;
  blocked!: Table<BlockedRequest & { id?: number }, number>;
  threatLogs!: Table<ThreatLog, string>;
  ispReports!: Table<ISPReport, string>;

  constructor() {
    super('ThreatBlockerDB');
    
    this.version(1).stores({
      indicators: '++id, value, type, source, severity, lastSeen',
      blocked: '++id, url, timestamp, tabId',
      threatLogs: 'id, timestamp, ipAddress, attackType, blocked, resumed, reportedToISP',
      ispReports: 'id, timestamp, threatLogId, status'
    });
  }

  async addIndicators(indicators: ThreatIndicator[]): Promise<void> {
    await this.indicators.bulkPut(indicators);
  }

  async checkThreat(value: string): Promise<ThreatIndicator | undefined> {
    return await this.indicators
      .where('value')
      .equals(value)
      .first();
  }

  async getIndicatorsBySource(source: string): Promise<ThreatIndicator[]> {
    return await this.indicators
      .where('source')
      .equals(source)
      .toArray();
  }

  async addBlockedRequest(request: BlockedRequest): Promise<void> {
    await this.blocked.add(request);
  }

  async getBlockedToday(): Promise<number> {
    const startOfDay = new Date().setHours(0, 0, 0, 0);
    return await this.blocked
      .where('timestamp')
      .above(startOfDay)
      .count();
  }

  async getTotalBlocked(): Promise<number> {
    return await this.blocked.count();
  }

  async clearOldIndicators(olderThan: number): Promise<void> {
    await this.indicators
      .where('lastSeen')
      .below(olderThan)
      .delete();
  }

  // Enhanced threat logging
  async addThreatLog(log: ThreatLog) {
    await this.threatLogs.add(log);
  }

  async getThreatLogs(limit: number = 100): Promise<ThreatLog[]> {
    return await this.threatLogs.orderBy('timestamp').reverse().limit(limit).toArray();
  }

  async getThreatLogById(id: string): Promise<ThreatLog | undefined> {
    return await this.threatLogs.get(id);
  }

  async updateThreatLog(id: string, updates: Partial<ThreatLog>) {
    await this.threatLogs.update(id, updates);
  }

  async getThreatLogsByIP(ipAddress: string): Promise<ThreatLog[]> {
    return await this.threatLogs.where('ipAddress').equals(ipAddress).toArray();
  }

  async getThreatLogsByAttackType(attackType: string): Promise<ThreatLog[]> {
    return await this.threatLogs.where('attackType').equals(attackType).toArray();
  }

  async clearOldThreatLogs(days: number = 30) {
    const cutoff = Date.now() - days * 24 * 60 * 60 * 1000;
    await this.threatLogs.where('timestamp').below(cutoff).delete();
  }

  // ISP reporting
  async addISPReport(report: ISPReport) {
    await this.ispReports.add(report);
  }

  async updateISPReport(id: string, updates: Partial<ISPReport>) {
    await this.ispReports.update(id, updates);
  }

  async getPendingISPReports(): Promise<ISPReport[]> {
    return await this.ispReports.where('status').equals('pending').toArray();
  }

  async getISPReports(limit: number = 50): Promise<ISPReport[]> {
    return await this.ispReports.orderBy('timestamp').reverse().limit(limit).toArray();
  }
}

export const db = new ThreatDatabase();
