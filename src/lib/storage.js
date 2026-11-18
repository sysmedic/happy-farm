// ==========================================================================
// Happy Farm Storage Service (행복 농장 데이터 저장소 및 관계형 DB 매니저)
// ==========================================================================

import { 
  getTodayDateString, 
  formatDisplayBreed, 
  formatTagNumber,
  loadCustomCareCategories,
  saveCustomCareCategories
} from './types.js';

const STORAGE_ENTITIES_KEY = 'happy_farm_entities_v2';
const STORAGE_LOGS_KEY = 'happy_farm_care_logs_v2';
const STORAGE_SCHEDULES_KEY = 'happy_farm_schedules_v1';
const STORAGE_CONFIG_KEY = 'happy_farm_config_v1';

// 초기 풍부한 실제 한우 농장 20두 샘플 데이터 (번식우, 비육우, 육성우, 송아지, 씨수소)
export const INITIAL_SAMPLE_ENTITIES = [
  {
    id: 'ENT-001',
    tagNumber: '002-1402-9851-1',
    name: '복순이',
    category: 'hanwoo',
    breed: '번식우 - 암',
    gender: 'female',
    birthDate: '2024-03-15',
    barn: '제1축사 1번방',
    motherTag: '002-1100-3411-9',
    fatherTag: 'KPN-1422',
    weight: 485,
    status: 'pregnant',
    memo: '성품이 온순하고 사료 섭취율 우수함. 1차 인공수정으로 임신 7개월차 순항 중.',
    createdAt: '2024-03-15T09:00:00Z',
    updatedAt: '2026-11-10T14:20:00Z',
  },
  {
    id: 'ENT-002',
    tagNumber: '002-1521-4402-2',
    name: '금동이',
    category: 'hanwoo',
    breed: '비육우 - 거세',
    gender: 'castrated',
    birthDate: '2024-07-20',
    barn: '제1축사 3번방',
    motherTag: '002-1205-8821-8',
    fatherTag: 'KPN-1380',
    weight: 620,
    status: 'scheduled_ship',
    memo: '비육 후기 진행 중. 일당증체량 우수, 12월 축협 경매 출하 예정.',
    createdAt: '2024-07-20T10:00:00Z',
    updatedAt: '2026-11-12T11:00:00Z',
  },
  {
    id: 'ENT-003',
    tagNumber: '002-1601-7733-3',
    name: '미순이',
    category: 'hanwoo',
    breed: '번식우 - 암',
    gender: 'female',
    birthDate: '2023-11-05',
    barn: '제2축사 2번방',
    motherTag: '002-0992-1144-7',
    fatherTag: 'KPN-1390',
    weight: 495,
    status: 'in_heat',
    memo: '승가 행동 및 점액 분비 관찰됨. 금일 오후 인공수정(KPN-1422) 예정.',
    createdAt: '2023-11-05T08:30:00Z',
    updatedAt: '2026-11-16T08:15:00Z',
  },
  {
    id: 'ENT-004',
    tagNumber: '002-1755-1209-4',
    name: '대박이',
    category: 'hanwoo',
    breed: '번식우 - 암',
    gender: 'female',
    birthDate: '2025-01-10',
    barn: '제2축사 4번방',
    motherTag: '002-1322-9988-6',
    fatherTag: 'KPN-1450',
    weight: 390,
    status: 'treatment',
    memo: '호흡기 기침 증상으로 항생제 및 소염제 투약 2일차 경과 관찰 중.',
    createdAt: '2025-01-10T14:00:00Z',
    updatedAt: '2026-11-15T16:40:00Z',
  },
  {
    id: 'ENT-005',
    tagNumber: '002-1899-6501-5',
    name: '장군이',
    category: 'hanwoo',
    breed: '비육우 - 거세',
    gender: 'castrated',
    birthDate: '2024-09-12',
    barn: '제1축사 4번방',
    motherTag: '002-1144-8899-5',
    fatherTag: 'KPN-1410',
    weight: 580,
    status: 'healthy',
    memo: '비육 중기 배합사료 섭취량 양호. 발굽 상태 및 활력 정상.',
    createdAt: '2024-09-12T11:20:00Z',
    updatedAt: '2026-11-14T10:00:00Z',
  },
  {
    id: 'ENT-006',
    tagNumber: '002-1920-3312-6',
    name: '황우',
    category: 'hanwoo',
    breed: '육성우 - 수',
    gender: 'male',
    birthDate: '2025-08-01',
    barn: '제2축사 1번방',
    motherTag: '002-1402-9851-1',
    fatherTag: 'KPN-1466',
    weight: 295,
    status: 'healthy',
    memo: '복순이 자우. 활력 매우 좋고 배합사료 적응 완료.',
    createdAt: '2025-08-01T09:30:00Z',
    updatedAt: '2026-11-10T15:00:00Z',
  },
  {
    id: 'ENT-007',
    tagNumber: '002-1388-7210-7',
    name: '해순이',
    category: 'hanwoo',
    breed: '번식우 - 암',
    gender: 'female',
    birthDate: '2023-05-18',
    barn: '분만/포유사 1호실',
    motherTag: '002-0881-2211-4',
    fatherTag: 'KPN-1355',
    weight: 510,
    status: 'nursing',
    memo: '샛별이 어미소. 자우 포유 사양 관리 및 고단백 사료 급여 중.',
    createdAt: '2023-05-18T08:00:00Z',
    updatedAt: '2026-11-14T09:00:00Z',
  },
  {
    id: 'ENT-008',
    tagNumber: '002-1980-4421-8',
    name: '샛별이',
    category: 'hanwoo',
    breed: '송아지 - 암',
    gender: 'female',
    birthDate: '2026-10-28',
    barn: '분만/포유사 1호실',
    motherTag: '002-1388-7210-7',
    fatherTag: 'KPN-1422',
    weight: 48,
    status: 'healthy',
    memo: '해순이 자우(암송아지). 생후 20일령, 모유 섭취 왕성하고 기립 활력 우수.',
    createdAt: '2026-10-28T05:30:00Z',
    updatedAt: '2026-11-16T11:00:00Z',
  },
  {
    id: 'ENT-009',
    tagNumber: '002-1433-2299-9',
    name: '영순이',
    category: 'hanwoo',
    breed: '번식우 - 암',
    gender: 'female',
    birthDate: '2024-02-14',
    barn: '제1축사 2번방',
    motherTag: '002-1055-7788-3',
    fatherTag: 'KPN-1405',
    weight: 470,
    status: 'inseminated',
    memo: '인공수정(KPN-1466) 완료 15일차. 재발정 여부 및 수정란 착상 경과 관찰 중.',
    createdAt: '2024-02-14T10:00:00Z',
    updatedAt: '2026-11-15T09:30:00Z',
  },
  {
    id: 'ENT-010',
    tagNumber: '002-1677-8812-1',
    name: '백호',
    category: 'hanwoo',
    breed: '씨수소 - 수',
    gender: 'male',
    birthDate: '2022-09-05',
    barn: '종모우 특별사',
    motherTag: '002-0771-3344-2',
    fatherTag: 'KPN-1280',
    weight: 820,
    status: 'healthy',
    memo: '체격 당당하고 골격 우수. 정액 검사 활력도 88% 최우수 판정.',
    createdAt: '2022-09-05T09:00:00Z',
    updatedAt: '2026-11-12T14:00:00Z',
  },
  {
    id: 'ENT-011',
    tagNumber: '002-1510-9944-2',
    name: '태양이',
    category: 'hanwoo',
    breed: '비육우 - 거세',
    gender: 'castrated',
    birthDate: '2024-06-11',
    barn: '제1축사 3번방',
    motherTag: '002-1188-4422-1',
    fatherTag: 'KPN-1375',
    weight: 595,
    status: 'treatment',
    memo: '우측 뒷발굽 부제병으로 소독 및 항생 처치 3일차 진행 중. 보행 점진적 개선.',
    createdAt: '2024-06-11T13:00:00Z',
    updatedAt: '2026-11-16T10:30:00Z',
  },
  {
    id: 'ENT-012',
    tagNumber: '002-1799-5566-3',
    name: '달순이',
    category: 'hanwoo',
    breed: '번식우 - 암',
    gender: 'female',
    birthDate: '2024-11-20',
    barn: '제2축사 3번방',
    motherTag: '002-1244-6677-0',
    fatherTag: 'KPN-1430',
    weight: 460,
    status: 'pregnant',
    memo: '초음파 임신 감정 완료(수태 60일차). 태아 심박 및 양수 상태 매우 정상.',
    createdAt: '2024-11-20T10:30:00Z',
    updatedAt: '2026-11-11T15:20:00Z',
  },
  {
    id: 'ENT-013',
    tagNumber: '002-1644-3321-4',
    name: '누렁이',
    category: 'hanwoo',
    breed: '비육우 - 거세',
    gender: 'castrated',
    birthDate: '2024-08-15',
    barn: '제1축사 2번방',
    motherTag: '002-1211-5588-9',
    fatherTag: 'KPN-1395',
    weight: 540,
    status: 'healthy',
    memo: '비육 전기에서 중기로 순조롭게 전환. 조사료 및 농후사료 배합비 정상 섭취.',
    createdAt: '2024-08-15T11:00:00Z',
    updatedAt: '2026-11-13T16:00:00Z',
  },
  {
    id: 'ENT-014',
    tagNumber: '002-1855-6611-5',
    name: '꽃순이',
    category: 'hanwoo',
    breed: '육성우 - 암',
    gender: 'female',
    birthDate: '2025-05-10',
    barn: '제2축사 2번방',
    motherTag: '002-1355-7799-8',
    fatherTag: 'KPN-1440',
    weight: 340,
    status: 'in_heat',
    memo: '첫 발정(초발정) 징후 포착. 불안 행동 및 미근부 털 젖힘 관찰됨.',
    createdAt: '2025-05-10T14:30:00Z',
    updatedAt: '2026-11-16T12:00:00Z',
  },
  {
    id: 'ENT-015',
    tagNumber: '002-1711-2288-6',
    name: '천둥이',
    category: 'hanwoo',
    breed: '비육우 - 거세',
    gender: 'castrated',
    birthDate: '2024-05-02',
    barn: '출하 완료(퇴농)',
    motherTag: '002-1088-3355-7',
    fatherTag: 'KPN-1360',
    weight: 685,
    status: 'shipped',
    memo: '비육 완료 후 축협 경매 출하 완료(도체중 435kg, 1++ 등급 판정).',
    createdAt: '2024-05-02T09:00:00Z',
    updatedAt: '2026-11-15T11:30:00Z',
  },
  {
    id: 'ENT-016',
    tagNumber: '002-1933-7755-7',
    name: '햇살이',
    category: 'hanwoo',
    breed: '송아지 - 수',
    gender: 'male',
    birthDate: '2026-09-15',
    barn: '분만/포유사 2호실',
    motherTag: '002-1499-1133-8',
    fatherTag: 'KPN-1422',
    weight: 72,
    status: 'treatment',
    memo: '환절기 가벼운 백리(설사) 증세로 정장제 및 전해질 급여 중. 체온 38.8도 양호.',
    createdAt: '2026-09-15T07:20:00Z',
    updatedAt: '2026-11-16T14:00:00Z',
  },
  {
    id: 'ENT-017',
    tagNumber: '002-1499-1133-8',
    name: '진순이',
    category: 'hanwoo',
    breed: '번식우 - 암',
    gender: 'female',
    birthDate: '2023-08-25',
    barn: '분만/포유사 2호실',
    motherTag: '002-0944-1122-6',
    fatherTag: 'KPN-1370',
    weight: 490,
    status: 'nursing',
    memo: '햇살이 어미소. 유방염 예방 연고 도포 및 보양 미네랄제 보충 급여.',
    createdAt: '2023-08-25T10:00:00Z',
    updatedAt: '2026-11-14T11:00:00Z',
  },
  {
    id: 'ENT-018',
    tagNumber: '002-1588-4477-9',
    name: '보람이',
    category: 'hanwoo',
    breed: '번식우 - 암',
    gender: 'female',
    birthDate: '2024-01-05',
    barn: '제2축사 4번방',
    motherTag: '002-1133-8822-5',
    fatherTag: 'KPN-1415',
    weight: 525,
    status: 'pregnant',
    memo: '임신 250일차(만삭). 분만 예정일 D-35 도래. 유방 팽창 및 골반 인대 이완 시작.',
    createdAt: '2024-01-05T08:00:00Z',
    updatedAt: '2026-11-13T15:00:00Z',
  },
  {
    id: 'ENT-019',
    tagNumber: '002-1822-9900-1',
    name: '으뜸이',
    category: 'hanwoo',
    breed: '육성우 - 수',
    gender: 'male',
    birthDate: '2025-07-15',
    barn: '제2축사 1번방',
    motherTag: '002-1311-6644-4',
    fatherTag: 'KPN-1455',
    weight: 310,
    status: 'healthy',
    memo: '조사료 섭취 비율 60% 유지 중. 반추 활동 활발하고 털 윤기 우수.',
    createdAt: '2025-07-15T11:00:00Z',
    updatedAt: '2026-11-15T10:00:00Z',
  },
  {
    id: 'ENT-020',
    tagNumber: '002-1766-3344-2',
    name: '청우',
    category: 'hanwoo',
    breed: '비육우 - 거세',
    gender: 'castrated',
    birthDate: '2024-10-01',
    barn: '제1축사 1번방',
    motherTag: '002-1277-9911-3',
    fatherTag: 'KPN-1400',
    weight: 510,
    status: 'healthy',
    memo: '비육 전기 배합사료 섭취량 증가세. 일당 증체량 1.05kg 순항 중.',
    createdAt: '2024-10-01T09:00:00Z',
    updatedAt: '2026-11-16T15:30:00Z',
  }
];

export const INITIAL_SAMPLE_CARE_LOGS = [
  {
    id: 'LOG-20261116-001',
    entityId: 'ENT-003',
    tagNumber: '002-1601-7733-3',
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
    tagNumber: '002-1755-1209-4',
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
    id: 'LOG-20261116-003',
    entityId: 'ENT-011',
    tagNumber: '002-1510-9944-2',
    entityName: '태양이',
    date: getTodayDateString(),
    time: '10:30',
    category: 'treatment',
    title: '뒷발굽 부제병 세척 및 항생 연고 도포',
    details: '환부 생리식염수 세척 후 클로르헥시딘 소독 및 붕대 드레싱 교체.',
    operator: '홍길동 대표',
    nextScheduleDate: '2026-11-19',
    nextScheduleTitle: '부제병 환부 4일차 확인 및 재소독',
    cost: 15000,
    completed: true,
    createdAt: '2026-11-16T10:30:00Z'
  },
  {
    id: 'LOG-20261116-004',
    entityId: 'ENT-016',
    tagNumber: '002-1933-7755-7',
    entityName: '햇살이',
    date: getTodayDateString(),
    time: '14:00',
    category: 'treatment',
    title: '송아지 전해질 음수 및 비타민 투약',
    details: '설사 완화용 전해질제 500ml 미온수에 타서 강제 급여. 탈수 징후 없음.',
    operator: '홍길동 대표',
    nextScheduleDate: '2026-11-17',
    nextScheduleTitle: '변 상태 확인 및 정장제 추가 급여',
    cost: 8000,
    completed: true,
    createdAt: '2026-11-16T14:00:00Z'
  },
  {
    id: 'LOG-20261115-001',
    entityId: 'ENT-001',
    tagNumber: '002-1402-9851-1',
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
    id: 'LOG-20261115-002',
    entityId: 'ENT-015',
    tagNumber: '002-1711-2288-6',
    entityName: '천둥이',
    date: '2026-11-15',
    time: '11:30',
    category: 'weight',
    title: '출하 전 육질 초음파 및 체중 측정 (645kg)',
    details: '체중 645kg 실측. 등심단면적 112㎠, 근내지방도 8점 예상.',
    operator: '김축협 팀장',
    nextScheduleDate: '2026-11-25',
    nextScheduleTitle: '출하 출하증명서 발급 및 축협 배차 확인',
    cost: 20000,
    completed: true,
    createdAt: '2026-11-15T11:30:00Z'
  },
  {
    id: 'LOG-20261114-001',
    entityId: 'ENT-005',
    tagNumber: '002-1899-6501-5',
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
    id: 'LOG-20261113-001',
    entityId: 'ENT-018',
    tagNumber: '002-1588-4477-9',
    entityName: '보람이',
    date: '2026-11-13',
    time: '15:00',
    category: 'routine',
    title: '분만 대기방 이동 및 산실 톱밥 보강',
    details: '제2축사 4번방 단독 산실로 이동. CCTV 각도 조절 완료.',
    operator: '홍길동 대표',
    nextScheduleDate: '2026-12-18',
    nextScheduleTitle: '분만 예정일 D-Day 집중 감시',
    cost: 0,
    completed: true,
    createdAt: '2026-11-13T15:00:00Z'
  },
  {
    id: 'LOG-20261112-001',
    entityId: 'ENT-002',
    tagNumber: '002-1521-4402-2',
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
    id: 'LOG-20261111-001',
    entityId: 'ENT-012',
    tagNumber: '002-1799-5566-3',
    entityName: '달순이',
    date: '2026-11-11',
    time: '15:20',
    category: 'breeding',
    title: '초음파 임신 감정 (수태 60일령 확인)',
    details: '직장 초음파 진단 결과 수정란 정상 착상 및 태아 심박 확인 완료.',
    operator: '이수의 수의사',
    nextScheduleDate: '2027-02-15',
    nextScheduleTitle: '임신 후기 사양관리 전환 점검',
    cost: 40000,
    completed: true,
    createdAt: '2026-11-11T15:20:00Z'
  },
  {
    id: 'LOG-20261110-001',
    entityId: 'ENT-001',
    tagNumber: '002-1402-9851-1',
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
    tagNumber: '002-1920-3312-6',
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
      // 한우 전용 농장 데이터 정규화 및 표준 사육구분 포맷, 이표번호 12자리 자동 마이그레이션
      let needsSave = false;
      const sampleMap = new Map(INITIAL_SAMPLE_ENTITIES.map(s => [s.id, s]));

      const normalized = parsed.map(e => {
        const standardBreed = formatDisplayBreed(e.breed);
        let tag = e.tagNumber || '';
        let mother = e.motherTag || '';

        // 샘플 개체인 경우 최신 12자리 표준 이표번호로 동기화
        const matchedSample = sampleMap.get(e.id);
        if (matchedSample) {
          if (tag !== matchedSample.tagNumber) {
            tag = matchedSample.tagNumber;
            needsSave = true;
          }
          if (mother !== matchedSample.motherTag) {
            mother = matchedSample.motherTag;
            needsSave = true;
          }
        } else {
          // 사용자 등록 개체의 경우 12자리 표준 포맷팅 확인
          const formattedTag = formatTagNumber(tag);
          if (formattedTag && formattedTag !== tag) {
            tag = formattedTag;
            needsSave = true;
          }
          if (mother) {
            const formattedMother = formatTagNumber(mother);
            if (formattedMother && formattedMother !== mother) {
              mother = formattedMother;
              needsSave = true;
            }
          }
        }

        if (e.breed !== standardBreed || e.category !== 'hanwoo') {
          needsSave = true;
        }

        return {
          ...e,
          tagNumber: tag,
          motherTag: mother,
          category: 'hanwoo',
          breed: standardBreed,
        };
      });
      if (needsSave) {
        saveEntities(normalized);
      }
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
    if (Array.isArray(parsed) && parsed.length > 0) {
      let needsSave = false;
      const sampleLogMap = new Map(INITIAL_SAMPLE_CARE_LOGS.map(l => [l.id, l]));
      const sampleEntityMap = new Map(INITIAL_SAMPLE_ENTITIES.map(e => [e.id, e]));

      const normalized = parsed.map(log => {
        let tag = log.tagNumber || '';
        const matchedSampleLog = sampleLogMap.get(log.id);
        if (matchedSampleLog) {
          if (tag !== matchedSampleLog.tagNumber) {
            tag = matchedSampleLog.tagNumber;
            needsSave = true;
          }
        } else {
          const matchedEntity = sampleEntityMap.get(log.entityId);
          if (matchedEntity && matchedEntity.tagNumber) {
            if (tag !== matchedEntity.tagNumber) {
              tag = matchedEntity.tagNumber;
              needsSave = true;
            }
          } else {
            const formatted = formatTagNumber(tag);
            if (formatted && formatted !== tag) {
              tag = formatted;
              needsSave = true;
            }
          }
        }
        return {
          ...log,
          tagNumber: tag,
        };
      });
      if (needsSave) {
        saveCareLogs(normalized);
      }
      return normalized;
    }
    return INITIAL_SAMPLE_CARE_LOGS;
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

// --------------------------------------------------------------------------
// Independent Farm Schedules (독립 영농 일정 관리)
// --------------------------------------------------------------------------
export const INITIAL_SAMPLE_SCHEDULES = [
  {
    id: 'SCHED-001',
    date: getTodayDateString(),
    time: '10:00',
    entityId: null,
    tagNumber: null,
    entityName: '농장 공통',
    category: 'routine',
    title: '제1·2축사 오전 정기 환기 및 방역 소독',
    memo: '환풍기 정상 작동 확인 및 안개 분무 소독제 살포',
    completed: false,
    createdAt: new Date().toISOString()
  },
  {
    id: 'SCHED-002',
    date: getTodayDateString(),
    time: '14:30',
    entityId: 'ENT-003',
    tagNumber: '002-1601-7733-3',
    entityName: '미순이',
    category: 'breeding',
    title: '인공수정 적기 확인 및 수정사 시술',
    memo: 'KPN-1422 정액 준비 완료. 발정 지속 상태 재확인',
    completed: false,
    createdAt: new Date().toISOString()
  }
];

export function loadSchedules() {
  try {
    const raw = localStorage.getItem(STORAGE_SCHEDULES_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
    return INITIAL_SAMPLE_SCHEDULES;
  } catch (err) {
    console.error('Failed to load schedules:', err);
    return INITIAL_SAMPLE_SCHEDULES;
  }
}

export function saveSchedules(schedules) {
  try {
    localStorage.setItem(STORAGE_SCHEDULES_KEY, JSON.stringify(schedules));
  } catch (err) {
    console.error('Failed to save schedules:', err);
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
export function exportFullDatabase(entities, careLogs, customCategories, schedules) {
  const data = {
    app: 'happy-farm',
    version: '1.1.0',
    exportTimestamp: new Date().toISOString(),
    entities: entities || loadEntities(),
    careLogs: careLogs || loadCareLogs(),
    schedules: schedules || loadSchedules(),
    customCategories: customCategories || loadCustomCareCategories(),
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
    const schedules = Array.isArray(data.schedules) ? data.schedules : [];

    saveEntities(entities);
    saveCareLogs(careLogs);
    saveSchedules(schedules);

    if (Array.isArray(data.customCategories)) {
      saveCustomCareCategories(data.customCategories);
    }

    return { 
      success: true, 
      entityCount: entities.length, 
      logCount: careLogs.length,
      scheduleCount: schedules.length,
      categoryCount: Array.isArray(data.customCategories) ? data.customCategories.length : 0
    };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

// Reset to Sample Data
export function resetToSampleData() {
  saveEntities(INITIAL_SAMPLE_ENTITIES);
  saveCareLogs(INITIAL_SAMPLE_CARE_LOGS);
  saveSchedules(INITIAL_SAMPLE_SCHEDULES);
  return { 
    entities: INITIAL_SAMPLE_ENTITIES, 
    careLogs: INITIAL_SAMPLE_CARE_LOGS,
    schedules: INITIAL_SAMPLE_SCHEDULES
  };
}
