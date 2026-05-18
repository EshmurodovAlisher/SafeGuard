
import { BlacklistItem, StatisticData, MonitoredChannel } from './types';

export const MOCK_STATISTICS: StatisticData[] = [
  { name: 'Yanvar', value: 450 },
  { name: 'Fevral', value: 520 },
  { name: 'Mart', value: 890 },
  { name: 'Aprel', value: 1200 },
  { name: 'May', value: 980 },
  { name: 'Iyun', value: 1500 },
];

export const MOCK_BLACKLIST: BlacklistItem[] = [
  { id: '1', type: 'PHONE', value: '+998901234567', reportsCount: 45, lastReported: '2023-10-25', category: 'Bank xavfsizlik xizmati' },
  { id: '2', type: 'URL', value: 'humo-bonus.uz', reportsCount: 128, lastReported: '2023-10-26', category: 'Phishing' },
  { id: '3', type: 'TELEGRAM', value: '@prezident_yordam_bot', reportsCount: 89, lastReported: '2023-10-24', category: 'Soxta yordam' },
  { id: '4', type: 'PHONE', value: '+998990001122', reportsCount: 12, lastReported: '2023-10-26', category: 'Virtual raqam' },
];

export const MOCK_CHANNELS: MonitoredChannel[] = [
  { id: 'c1', name: 'Toshkent Bozor', members: '125K', status: 'ACTIVE' },
  { id: 'c2', name: 'Ish Bor (Rasmiy)', members: '89K', status: 'ACTIVE' },
  { id: 'c3', name: 'Tezkor Xabarlar', members: '250K', status: 'ACTIVE' },
  { id: 'c4', name: 'Sovg\'alar va Yutuqlar', members: '15K', status: 'ACTIVE' },
];

export const FRAUD_KEYWORDS = [
  "kodni ayting", "karta raqami", "bloklandi", "yutuq", "bonus", "prezident qarori",
  "moddiy yordam", "xavfsizlik xizmati", "shoshilinch", "click", "payme", "uzcard", "humo"
];
