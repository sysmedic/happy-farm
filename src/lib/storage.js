// ==========================================================================
// Happy Farm Storage Service (행복 농장 데이터 저장소 및 관계형 DB 매니저)
// ==========================================================================

import { getTodayDateString } from './types.js';

const STORAGE_ENTITIES_KEY = 'happy_farm_entities_v1';
const STORAGE_LOGS_KEY = 'happy_farm_care_logs_v1';
const STORAGE_CONFIG_KEY = 'happy_farm_config_v1';

// 초기 풍부한 실제 한우 농장 샘플 데이터 (번식우, 비육우, 육성우, 송아지)
export const INITIAL_SAMPLE_ENTITIES = [
  {
    id: 'ENT-001',
    tagNumber: '002-1402-9851',
    name: '복순이',
    category: 'hanwoo',
    breed: '한우(번식우)',
    gender: 'female',
    birthDate: '2024-03-15',
    barn: '제1축사 1번방',
    motherTag: '002-1100-3411',
    fatherTag: 'KPN-1422',
    weight: 485,
    status: 'pregnant',
    memo: '성품이 온순하고 사료 섭취율 우수함. 1차 인공수정으로 임신 성공.',
    createdAt: '2024-03-15T09:00:00Z',
    updatedAt: '2026-11-10T14:20:00Z',
  },
  {
    id: 'ENT-002',
    tagNumber: '002-1521-4402',
    name: '금동이',
    category: 'hanwoo',
    breed: '한우(거세비육우)',
    gender: 'castrated',
    birthDate: '2024-07-20',
    barn: '제1축사 3번방',
    motherTag: '002-1205-8821',
    fatherTag: 'KPN-1380',
    weight: 620,
    status: 'scheduled_ship',
    memo: '비육 후기 진행 중. 일당증체량 우수, 12월 경매 출하 예정.',
    createdAt: '2024-07-20T10:00:00Z',
    updatedAt: '2026-11-12T11:00:00Z',
  },
  {
    id: 'ENT-003',
    tagNumber: '002-1601-7733',
    name: '미순이',
    category: 'hanwoo',
    breed: '한우(번식우 - 암소)',
    gender: 'female',
    birthDate: '2023-11-05',
    barn: '제2축사 2번방',
    motherTag: '002-0992-1144',
    fatherTag: 'KPN-1390',
    weight: 495,
    status: 'in_heat',
    memo: '승가 행동 및 점액 분비 관찰됨. 금일 오후 인공수정(KPN-1422) 예정.',
    createdAt: '2023-11-05T08:30:00Z',
    updatedAt: '2026-11-16T08:15:00Z',
  },
  {
    id: 'ENT-004',
    tagNumber: '002-1755-1209',
    name: '대박이',
    category: 'hanwoo',
    breed: '한우(번식우 - 암소)',
    gender: 'female',
    birthDate: '2025-01-10',
    barn: '제2축사 4번방',
    motherTag: '002-1322-9988',
    fatherTag: 'KPN-1450',
    weight: 390,
    status: 'treatment',
    memo: '호흡기 기침 증상으로 항생제 및 소염제 투약 2일차 경과 관찰 중.',
    createdAt: '2025-01-10T14:00:00Z',
    updatedAt: '2026-11-15T16:40:00Z',
  },
  {
    id: 'ENT-005',
    tagNumber: '002-1899-6501',
    name: '장군이',
    category: 'hanwoo',
    breed: '한우(거세 비육우)',
    gender: 'castrated',
    birthDate: '2024-09-12',
    barn: '제1축사 4번방',
    motherTag: '002-1144-8899',
    fatherTag: 'KPN-1410',
    weight: 580,
    status: 'healthy',
    memo: '비육 중기 배합사료 섭취량 양호. 발굽 상태 및 활력 정상.',
    createdAt: '2024-09-12T11:20:00Z',
    updatedAt: '2026-11-14T10:00:00Z',
  },
  {
    id: 'ENT-006',
    tagNumber: '002-1920-3312',
    name: '황우',
    category: 'hanwoo',
    breed: '한우(육성우)',
    gender: 'male',
    birthDate: '2025-08-01',
    barn: '제2축사 1번방',
    motherTag: '002-1402-9851',
    fatherTag: 'KPN-1466',
    weight: 295,
    status: 'healthy',
    memo: '복순이 자우. 활력 매우 좋고 배합사료 적응 완료.',
    createdAt: '2025-08-01T09:30:00Z',
    updatedAt: '2026-11-10T15:00:00Z',
  }
];

export const INITIAL_SAMPLE_CARE_LOGS = [
  {
    id: 'LOG-20261116-001',
    entityId: 'ENT-003',
    tagNumber: '002-1601-7733',
    entityName: '미순이',
    date: getTodayDateString(),
    time: '08:30',
    category: 'breeding',
    title: '발정 관찰 및 인공수정 예약',
    details: '아침 급여 시 승가 행동 및 점액 분비 관찰됨. 수정사(김번식) 방문 요청 완료.',
    operator: '홍길동 대표',
    nextScheduleDate: getTodayDateString(),
    nextScheduleTitle: '인공수정 시술 진행 (14:00)',
    cost: 50000,
    completed: true,
    createdAt: '2026-11-16T08:30:00Z'
  },
  {
    id: 'LOG-20261116-002',
    entityId: 'ENT-004',
    tagNumber: '002-1755-1209',
    entityName: '대박이',
    date: getTodayDateString(),
    time: '09:40',
    category: 'treatment',
    title: '호흡기 2차 항생제 주사',
    details: '드랙신 8ml 근육 주사 처치. 체온 38.6도로 전일 대비 정상 회복세.',
    operator: '이수의 수의사',
    nextScheduleDate: '2026-11-18',
    nextScheduleTitle: '호흡기 최종 회복 점검',
    cost: 35000,
    completed: true,
    createdAt: '2026-11-16T09:40:00Z'
  },
  {
    id: 'LOG-20261115-001',
    entityId: 'ENT-001',
    tagNumber: '002-1402-9851',
    entityName: '복순이',
    date: '2026-11-15',
    time: '14:20',
    category: 'routine',
    title: '임신 후기 영양제 급여 및 축사 소독',
    details: '비타민/미네랄 블록 교체, 바닥 톱밥 전면 보강 및 생석회 소독 실시.',
    operator: '홍길동 대표',
    nextScheduleDate: '2026-12-05',
    nextScheduleTitle: '분만 예정방 이동 및 태아 심음 확인',
    cost: 15000,
    completed: true,
    createdAt: '2026-11-15T14:20:00Z'
  },
  {
    id: 'LOG-20261114-001',
    entityId: 'ENT-005',
    tagNumber: '002-1899-6501',
    entityName: '장군이',
    date: '2026-11-14',
    time: '10:30',
    category: 'treatment',
    title: '정기 구충제 투약 및 사양 점검',
    details: '이버멕틴 12ml 피하 주사 처치 완료. 사료 섭취량 아주 양호.',
    operator: '홍길동 대표',
    nextScheduleDate: '2026-12-14',
    nextScheduleTitle: '비육 후기 전환 사료 급여 점검',
    cost: 10000,
    completed: true,
    createdAt: '2026-11-14T10:30:00Z'
  },
  {
    id: 'LOG-20261112-001',
    entityId: 'ENT-002',
    tagNumber: '002-1521-4402',
    entityName: '금동이',
    date: '2026-11-12',
    time: '11:00',
    category: 'weight',
    title: '출하 전 체중 측정 (620kg)',
    details: '체중계 실측 620kg 달성. 사료 섭취량 아주 양호. 육질 1++등급 예상.',
    operator: '김축협 팀장',
    nextScheduleDate: '2026-12-02',
    nextScheduleTitle: '우시장 출하 차량 배차 확인',
    cost: 0,
    completed: true,
    createdAt: '2026-11-12T11:00:00Z'
  },
  {
    id: 'LOG-20261110-001',
    entityId: 'ENT-001',
    tagNumber: '002-1402-9851',
    entityName: '복순이',
    date: '2026-11-10',
    time: '10:30',
    category: 'vaccine',
    title: '구제역 백신 정기 접종',
    details: 'A+O형 2가 불활화 백신 2ml 이모 주사. 접종 부위 이상 반응 없음.',
    operator: '방역지원본부',
    nextScheduleDate: '2027-05-10',
    nextScheduleTitle: '구제역 차기 정기 보강 접종',
    cost: 0,
    completed: true,
    createdAt: '2026-11-10T10:30:00Z'
  },
  {
    id: 'LOG-20261108-001',
    entityId: 'ENT-006',
    tagNumber: '002-1920-3312',
    entityName: '황우',
    date: '2026-11-08',
    time: '15:00',
    category: 'vaccine',
    title: '송아지 로타/코로나 설사병 예방 접종',
    details: '생후 3개월차 예방 접종 완료. 식욕 정상, 활력 최상.',
    operator: '이수의 수의사',
    nextScheduleDate: '2026-12-08',
    nextScheduleTitle: '송아지 2차 호흡기 복합 백신',
    cost: 25000,
    completed: true,
    createdAt: '2026-11-08T15:00:00Z'
  }
];

// Helper: Local Storage Safe Load & Save
export function loadEntities() {
  try {
    const raw = localStorage.getItem(STORAGE_ENTITIES_KEY);
    if (!raw) {
      saveEntities(INITIAL_SAMPLE_ENTITIES);
      return INITIAL_SAMPLE_ENTITIES;
    }
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      // 한우 전용 농장 데이터 정규화
      const normalized = parsed.map(e => {
        if (e.category !== 'hanwoo') {
          return {
            ...e,
            category: 'hanwoo',
            breed: e.breed && e.breed.includes('한우') ? e.breed : '한우(번식우)',
          };
        }
        return e;
      });
      return normalized;
    }
    return INITIAL_SAMPLE_ENTITIES;
  } catch (err) {
    console.error('Failed to load entities:', err);
    return INITIAL_SAMPLE_ENTITIES;
  }
}

export function saveEntities(entities) {
  try {
    localStorage.setItem(STORAGE_ENTITIES_KEY, JSON.stringify(entities));
  } catch (err) {
    console.error('Failed to save entities:', err);
  }
}

export function loadCareLogs() {
  try {
    const raw = localStorage.getItem(STORAGE_LOGS_KEY);
    if (!raw) {
      saveCareLogs(INITIAL_SAMPLE_CARE_LOGS);
      return INITIAL_SAMPLE_CARE_LOGS;
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : INITIAL_SAMPLE_CARE_LOGS;
  } catch (err) {
    console.error('Failed to load care logs:', err);
    return INITIAL_SAMPLE_CARE_LOGS;
  }
}

export function saveCareLogs(logs) {
  try {
    localStorage.setItem(STORAGE_LOGS_KEY, JSON.stringify(logs));
  } catch (err) {
    console.error('Failed to save care logs:', err);
  }
}

// Relational Query Helpers
export function getCareLogsForEntity(tagNumberOrId, allLogs) {
  const logs = allLogs || loadCareLogs();
  return logs
    .filter(log => log.entityId === tagNumberOrId || log.tagNumber === tagNumberOrId)
    .sort((a, b) => new Date(b.date + ' ' + (b.time || '00:00')) - new Date(a.date + ' ' + (a.time || '00:00')));
}

export function getCareLogsForDate(dateStr, allLogs) {
  const logs = allLogs || loadCareLogs();
  return logs
    .filter(log => log.date === dateStr)
    .sort((a, b) => (b.time || '').localeCompare(a.time || ''));
}

export function getSchedulesForDate(dateStr, allLogs) {
  const logs = allLogs || loadCareLogs();
  return logs
    .filter(log => log.nextScheduleDate === dateStr)
    .sort((a, b) => (a.time || '').localeCompare(b.time || ''));
}

// Full Database Export / Import
export function exportFullDatabase(entities, careLogs) {
  const data = {
    app: 'happy-farm',
    version: '1.0.0',
    exportTimestamp: new Date().toISOString(),
    entities: entities || loadEntities(),
    careLogs: careLogs || loadCareLogs(),
  };
  return JSON.stringify(data, null, 2);
}

export function importFullDatabase(jsonString) {
  try {
    const data = JSON.parse(jsonString);
    if (!data.entities || !Array.isArray(data.entities)) {
      throw new Error('유효한 개체 데이터(entities)가 없습니다.');
    }
    const entities = data.entities;
    const careLogs = Array.isArray(data.careLogs) ? data.careLogs : [];

    saveEntities(entities);
    saveCareLogs(careLogs);

    return { success: true, entityCount: entities.length, logCount: careLogs.length };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

// Reset to Sample Data
export function resetToSampleData() {
  saveEntities(INITIAL_SAMPLE_ENTITIES);
  saveCareLogs(INITIAL_SAMPLE_CARE_LOGS);
  return { entities: INITIAL_SAMPLE_ENTITIES, careLogs: INITIAL_SAMPLE_CARE_LOGS };
}
