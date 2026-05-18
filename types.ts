
export enum RiskLevel {
  LOW = 'PAST',
  MEDIUM = 'O\'RTA',
  HIGH = 'YUQORI'
}

export interface AnalysisResult {
  isFraud: boolean;
  riskLevel: RiskLevel;
  confidence: number;
  reasoning: string[];
  suggestedAction: string;
}

export interface BlacklistItem {
  id: string;
  type: 'PHONE' | 'URL' | 'TELEGRAM';
  value: string;
  reportsCount: number;
  lastReported: string;
  category: string;
}

export interface StatisticData {
  name: string;
  value: number;
}

export interface BotLogEntry {
  id: string;
  source: string;
  message: string;
  timestamp: string;
  status: 'SAFE' | 'THREAT';
  details?: AnalysisResult;
}

export interface MonitoredChannel {
  id: string;
  name: string;
  members: string;
  status: 'ACTIVE' | 'PAUSED';
}
