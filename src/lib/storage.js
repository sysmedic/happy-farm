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

// v3로 스토리지 키 버전업하여 기존 구버전 캐시 파기 및 신규 20두 데이터 즉시 반영
const STORAGE_ENTITIES_KEY = 'happy_farm_entities_v3';
const STORAGE_LOGS_KEY = 'happy_farm_care_logs_v3';
const STORAGE_SCHEDULES_KEY = 'happy_farm_schedules_v3';
const STORAGE_CONFIG_KEY = 'happy_farm_config_v1';

// ==========================================================================
// 신규 실제 한우 20두 정밀 데이터 (번식우 8, 비육우 6, 육성우 3, 송아지 2, 씨수소 1)
// ==========================================================================
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
    weight: 495,
    status: 'pregnant',
    memo: '성품 온순하고 모성애 우수함. 초음파 감정 완료되어 임신 7개월차 순항 중.',
    createdAt: '2024-03-15T09:00:00Z',
    updatedAt: '2026-11-20T10:00:00Z',
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
    weight: 625,
    status: 'scheduled_ship',
    memo: '비육 후기 사양 완료. 체형 및 등지방 두께 최상위, 12월 5일 축협 경매 출하 예정.',
    createdAt: '2024-07-20T10:00:00Z',
    updatedAt: '2026-11-20T09:30:00Z',
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
    weight: 490,
    status: 'in_heat',
    memo: '명확한 승가 허용 및 맑은 점액 분비 관찰. 금일 오후 KPN-1422 인공수정 시술 완료.',
    createdAt: '2023-11-05T08:30:00Z',
    updatedAt: '2026-11-20T14:00:00Z',
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
    weight: 405,
    status: 'healthy',
    memo: '환절기 기침 증상으로 5일간 투약 치료 완료. 호흡 및 식욕 완전 정상 회복.',
    createdAt: '2025-01-10T14:00:00Z',
    updatedAt: '2026-11-20T11:00:00Z',
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
    weight: 585,
    status: 'healthy',
    memo: '비육 중기 배합사료 섭취량 왕성. 발굽 및 체구 발달 매우 양호.',
    createdAt: '2024-09-12T11:20:00Z',
    updatedAt: '2026-11-19T16:00:00Z',
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
    weight: 310,
    status: 'healthy',
    memo: '복순이 자우. 골격 형성이 우수하고 양질의 건초 섭취 적응 완료.',
    createdAt: '2025-08-01T09:30:00Z',
    updatedAt: '2026-11-18T14:00:00Z',
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
    weight: 515,
    status: 'nursing',
    memo: '10월 24일 샛별이 자연 분만 후 포유 중. 비유량 풍부하고 자우 관리 극진함.',
    createdAt: '2023-05-18T08:00:00Z',
    updatedAt: '2026-11-19T09:00:00Z',
  },
  {
    id: 'ENT-008',
    tagNumber: '002-1980-4421-8',
    name: '샛별이',
    category: 'hanwoo',
    breed: '송아지 - 암',
    gender: 'female',
    birthDate: '2026-10-24',
    barn: '분만/포유사 1호실',
    motherTag: '002-1388-7210-7',
    fatherTag: 'KPN-1422',
    weight: 52,
    status: 'healthy',
    memo: '해순이 자우(암송아지). 생후 27일차, 모유 섭취 양호하고 어린송아지 사료 입질 시작.',
    createdAt: '2026-10-24T06:15:00Z',
    updatedAt: '2026-11-20T08:30:00Z',
  },
  {
    id: 'ENT-009',
    tagNumber: '002-1204-5519-9',
    name: '소망이',
    category: 'hanwoo',
    breed: '번식우 - 암',
    gender: 'female',
    birthDate: '2023-08-12',
    barn: '제1축사 2번방',
    motherTag: '002-0944-1234-5',
    fatherTag: 'KPN-1377',
    weight: 480,
    status: 'inseminated',
    memo: '11월 6일 KPN-1422 인공수정 완료. 11월 27일 재발정 관찰 예정.',
    createdAt: '2023-08-12T10:00:00Z',
    updatedAt: '2026-11-17T11:20:00Z',
  },
  {
    id: 'ENT-010',
    tagNumber: '002-1433-8820-0',
    name: '건우',
    category: 'hanwoo',
    breed: '비육우 - 거세',
    gender: 'castrated',
    birthDate: '2024-05-10',
    barn: '제1축사 2번방',
    motherTag: '002-1055-6677-2',
    fatherTag: 'KPN-1402',
    weight: 640,
    status: 'healthy',
    memo: '비육 후기 진행 중. 골격 크고 체장 김. 등심 단면적 기대치 높음.',
    createdAt: '2024-05-10T14:30:00Z',
    updatedAt: '2026-11-16T15:00:00Z',
  },
  {
    id: 'ENT-011',
    tagNumber: '002-1677-9011-1',
    name: '달순이',
    category: 'hanwoo',
    breed: '번식우 - 암',
    gender: 'female',
    birthDate: '2024-02-28',
    barn: '제2축사 3번방',
    motherTag: '002-1188-3321-4',
    fatherTag: 'KPN-1412',
    weight: 505,
    status: 'pregnant',
    memo: '10월 31일 초음파 감정으로 수태 최종 확인(임신 3개월차). 유산 방지 사양 관리 중.',
    createdAt: '2024-02-28T09:00:00Z',
    updatedAt: '2026-11-18T10:30:00Z',
  },
  {
    id: 'ENT-012',
    tagNumber: '002-1712-4456-2',
    name: '만석이',
    category: 'hanwoo',
    breed: '비육우 - 거세',
    gender: 'castrated',
    birthDate: '2024-11-03',
    barn: '제1축사 5번방',
    motherTag: '002-1250-9981-3',
    fatherTag: 'KPN-1430',
    weight: 550,
    status: 'healthy',
    memo: '비육 전기에서 중기로 순조롭게 전환. 농후사료 증량 프로그램 적용 중.',
    createdAt: '2024-11-03T11:00:00Z',
    updatedAt: '2026-11-17T14:00:00Z',
  },
  {
    id: 'ENT-013',
    tagNumber: '002-1845-6678-3',
    name: '꽃님이',
    category: 'hanwoo',
    breed: '육성우 - 암',
    gender: 'female',
    birthDate: '2025-09-15',
    barn: '제2축사 5번방',
    motherTag: '002-1399-4412-8',
    fatherTag: 'KPN-1445',
    weight: 275,
    status: 'healthy',
    memo: '초발정 징후 예의주시 중. 골반 폭 넓고 장래 번식 공우로 유망함.',
    createdAt: '2025-09-15T15:00:00Z',
    updatedAt: '2026-11-19T13:40:00Z',
  },
  {
    id: 'ENT-014',
    tagNumber: '002-1955-1123-4',
    name: '태풍이',
    category: 'hanwoo',
    breed: '씨수소 - 수',
    gender: 'male',
    birthDate: '2023-02-14',
    barn: '종모우 단독사',
    motherTag: '002-0788-9900-1',
    fatherTag: 'KPN-1290',
    weight: 810,
    status: 'healthy',
    memo: '농장 대표 종모우. 체구 웅장하고 정액 성상 및 활력도 특상급 유지.',
    createdAt: '2023-02-14T08:00:00Z',
    updatedAt: '2026-11-18T16:00:00Z',
  },
  {
    id: 'ENT-015',
    tagNumber: '002-1311-8890-5',
    name: '보배',
    category: 'hanwoo',
    breed: '번식우 - 암',
    gender: 'female',
    birthDate: '2023-09-20',
    barn: '분만/포유사 2호실',
    motherTag: '002-0855-4432-6',
    fatherTag: 'KPN-1360',
    weight: 520,
    status: 'nursing',
    memo: '11월 2일 으뜸이(수송아지) 순산. 분만 후 빠른 회복세 보이며 젖 분비 원활.',
    createdAt: '2023-09-20T10:30:00Z',
    updatedAt: '2026-11-20T08:00:00Z',
  },
  {
    id: 'ENT-016',
    tagNumber: '002-1599-2234-6',
    name: '백두',
    category: 'hanwoo',
    breed: '비육우 - 거세',
    gender: 'castrated',
    birthDate: '2024-08-05',
    barn: '제1축사 5번방',
    motherTag: '002-1166-7788-9',
    fatherTag: 'KPN-1399',
    weight: 605,
    status: 'healthy',
    memo: '비육 후기 진입. 마블링 형성을 위한 볏짚 급여 제한 및 전용 농후사료 급여.',
    createdAt: '2024-08-05T13:00:00Z',
    updatedAt: '2026-11-15T11:00:00Z',
  },
  {
    id: 'ENT-017',
    tagNumber: '002-1788-3345-7',
    name: '은실이',
    category: 'hanwoo',
    breed: '번식우 - 암',
    gender: 'female',
    birthDate: '2024-04-12',
    barn: '제2축사 2번방',
    motherTag: '002-1244-5566-0',
    fatherTag: 'KPN-1450',
    weight: 475,
    status: 'inseminated',
    memo: '11월 12일 KPN-1450 인공수정 완료. 12월 3일 재발정 유무 확인 필요.',
    createdAt: '2024-04-12T09:15:00Z',
    updatedAt: '2026-11-16T14:20:00Z',
  },
  {
    id: 'ENT-018',
    tagNumber: '002-1877-5567-8',
    name: '한라',
    category: 'hanwoo',
    breed: '비육우 - 거세',
    gender: 'castrated',
    birthDate: '2024-10-18',
    barn: '제1축사 4번방',
    motherTag: '002-1299-8800-4',
    fatherTag: 'KPN-1415',
    weight: 565,
    status: 'healthy',
    memo: '성장 속도 안정적임. 요결석 예방제 및 염화암모늄 정기 투약 중.',
    createdAt: '2024-10-18T11:40:00Z',
    updatedAt: '2026-11-18T15:20:00Z',
  },
  {
    id: 'ENT-019',
    tagNumber: '002-1933-7789-9',
    name: '별이',
    category: 'hanwoo',
    breed: '육성우 - 암',
    gender: 'female',
    birthDate: '2025-10-05',
    barn: '제2축사 1번방',
    motherTag: '002-1355-6677-1',
    fatherTag: 'KPN-1460',
    weight: 260,
    status: 'healthy',
    memo: '이유 완료 후 단체방 입식. 알팔파 건초 기호성 우수.',
    createdAt: '2025-10-05T14:10:00Z',
    updatedAt: '2026-11-19T10:00:00Z',
  },
  {
    id: 'ENT-020',
    tagNumber: '002-1999-0012-0',
    name: '으뜸이',
    category: 'hanwoo',
    breed: '송아지 - 수',
    gender: 'male',
    birthDate: '2026-11-02',
    barn: '분만/포유사 2호실',
    motherTag: '002-1311-8890-5',
    fatherTag: 'KPN-1440',
    weight: 46,
    status: 'healthy',
    memo: '보배 자우(수송아지). 생후 18일차, 금일 전기제각 실시 및 상처 소독 완료.',
    createdAt: '2026-11-02T05:30:00Z',
    updatedAt: '2026-11-20T11:30:00Z',
  },
];

// ==========================================================================
// 10월 21일부터 11월 20일(오늘)까지의 풍부한 일자별 영농 관리 내역 (Care Logs)
// ==========================================================================
export const INITIAL_SAMPLE_CARE_LOGS = [
  // 10월 21일 (월) - 환절기 구충 및 영양 관리
  {
    id: 'LOG-1021-1',
    entityId: 'ENT-001',
    tagNumber: '002-1402-9851-1',
    entityName: '복순이',
    category: 'medication',
    date: '2026-10-21',
    time: '09:30',
    title: '환절기 내외부 기생충 구충제 피하 주사',
    description: '이버멕틴 제제 10ml 피하 주사 처치. 주사 부위 알코올 소독 실시.',
    cost: 15000,
    worker: '김대표',
    nextScheduleDate: '2027-04-21',
    nextScheduleTime: '09:00',
    nextScheduleTitle: '봄철 정기 구충제 투약'
  },
  {
    id: 'LOG-1021-2',
    entityId: 'ENT-002',
    tagNumber: '002-1521-4402-2',
    entityName: '금동이',
    category: 'medication',
    date: '2026-10-21',
    time: '10:15',
    title: '비육우 정기 구충 및 비타민 복합제 급여',
    description: '사료 혼합형 구충제 급여 및 간기능 개선제 사료 탑드레싱.',
    cost: 12000,
    worker: '김대표',
    nextScheduleDate: null
  },

  // 10월 23일 (수) - 만삭 어미소 분만실 입식
  {
    id: 'LOG-1023-1',
    entityId: 'ENT-007',
    tagNumber: '002-1388-7210-7',
    entityName: '해순이',
    category: 'calving',
    date: '2026-10-23',
    time: '14:00',
    title: '분만 징후 관찰 및 분만 단독사 입식',
    description: '유방 팽창 및 골반 인대 이완 확인. 볏짚 두껍게 깔고 CCTV 모니터링 시작.',
    cost: 0,
    worker: '박관리',
    nextScheduleDate: '2026-10-24',
    nextScheduleTime: '06:00',
    nextScheduleTitle: '분만 진행 상태 집중 확인'
  },

  // 10월 24일 (목) - 자연 분만 및 송아지 출산
  {
    id: 'LOG-1024-1',
    entityId: 'ENT-007',
    tagNumber: '002-1388-7210-7',
    entityName: '해순이',
    category: 'calving',
    date: '2026-10-24',
    time: '06:15',
    title: '우량 암송아지(샛별이) 자연 분만 성공',
    description: '난산 없이 자연 분만 성공. 태반 후산 정상 배출 확인. 따뜻한 전해질수 20L 급여.',
    cost: 50000,
    worker: '김대표',
    nextScheduleDate: '2026-10-25',
    nextScheduleTime: '09:00',
    nextScheduleTitle: '분만 후 자궁 회복 및 활력 확인'
  },
  {
    id: 'LOG-1024-2',
    entityId: 'ENT-008',
    tagNumber: '002-1980-4421-8',
    entityName: '샛별이',
    category: 'calving',
    date: '2026-10-24',
    time: '07:00',
    title: '생후 1시간 내 고품질 초유 급여 및 탯줄 소독',
    description: '어미소 초유 1.5L 포유 확인. 탯줄 7% 요오드 팅크 딥핑 소독. 체온 38.6도 양호.',
    cost: 10000,
    worker: '김대표',
    nextScheduleDate: '2026-10-25',
    nextScheduleTime: '10:00',
    nextScheduleTitle: '신생 송아지 비타민 투약'
  },

  // 10월 25일 (금) - 신생 송아지 처치
  {
    id: 'LOG-1025-1',
    entityId: 'ENT-008',
    tagNumber: '002-1980-4421-8',
    entityName: '샛별이',
    category: 'medication',
    date: '2026-10-25',
    time: '10:00',
    title: '초기 면역 강화 비타민 A, D3, E 피하 주사',
    description: '송아지 전용 면역 증강 복합제 주사 및 보온 조끼 착용.',
    cost: 8000,
    worker: '박관리',
    nextScheduleDate: '2026-11-08',
    nextScheduleTime: '10:00',
    nextScheduleTitle: '송아지 2주령 건강 체크'
  },

  // 10월 27일 (일) - 비육우 정기 체중 측정
  {
    id: 'LOG-1027-1',
    entityId: 'ENT-002',
    tagNumber: '002-1521-4402-2',
    entityName: '금동이',
    category: 'weight',
    date: '2026-10-27',
    time: '11:00',
    title: '비육 후기 우형기 체중 측정 (610kg 달성)',
    description: '전월 대비 28kg 증가. 일당증체량 0.93kg 양호. 사료 섭취 상태 최상.',
    cost: 0,
    worker: '김대표',
    nextScheduleDate: '2026-11-14',
    nextScheduleTime: '11:00',
    nextScheduleTitle: '출하 직전 최종 체중 측정'
  },
  {
    id: 'LOG-1027-2',
    entityId: 'ENT-005',
    tagNumber: '002-1899-6501-5',
    entityName: '장군이',
    category: 'weight',
    date: '2026-10-27',
    time: '11:30',
    title: '비육 중기 체중 측정 (570kg 달성)',
    description: '일당증체량 1.05kg. 배합사료 11kg 기준 정상 섭취 중.',
    cost: 0,
    worker: '김대표',
    nextScheduleDate: '2026-11-27',
    nextScheduleTime: '11:00',
    nextScheduleTitle: '비육우 정기 체중 측정'
  },

  // 10월 29일 (화) - 육성우 혼합 백신
  {
    id: 'LOG-1029-1',
    entityId: 'ENT-006',
    tagNumber: '002-1920-3312-6',
    entityName: '황우',
    category: 'vaccine',
    date: '2026-10-29',
    time: '14:20',
    title: '소 호흡기 질병 5종 혼합 백신 1차 접종',
    description: 'IBR, BVDV 1/2형, PI3, BRSV 예방 백신 5ml 근육 주사.',
    cost: 25000,
    worker: '박관리',
    nextScheduleDate: '2026-11-29',
    nextScheduleTime: '14:00',
    nextScheduleTitle: '5종 혼합 백신 2차 보강 접종'
  },

  // 10월 31일 (목) - 초음파 임신 감정
  {
    id: 'LOG-1031-1',
    entityId: 'ENT-011',
    tagNumber: '002-1677-9011-1',
    entityName: '달순이',
    category: 'breeding',
    date: '2026-10-31',
    time: '15:00',
    title: '인공수정 65일차 초음파 임신 감정 (임신 확정)',
    description: '수의사 초음파 진단 결과 태아 심박동 및 양수 정상 확인. 분만 예정일 2027년 5월 중순.',
    cost: 35000,
    worker: '수의사',
    nextScheduleDate: '2027-01-15',
    nextScheduleTime: '14:00',
    nextScheduleTitle: '임신 후기 초음파 재감정'
  },

  // 11월 02일 (토) - 보배 수송아지 분만
  {
    id: 'LOG-1102-1',
    entityId: 'ENT-015',
    tagNumber: '002-1311-8890-5',
    entityName: '보배',
    category: 'calving',
    date: '2026-11-02',
    time: '05:30',
    title: '건강한 수송아지(으뜸이) 분만 성공',
    description: '오전 5시경 양수 파열 후 30분 만에 자연 순산. 후산 2시간 내 완전 배출.',
    cost: 50000,
    worker: '김대표',
    nextScheduleDate: '2026-11-03',
    nextScheduleTime: '08:00',
    nextScheduleTitle: '어미소 자궁 수축제 투약'
  },
  {
    id: 'LOG-1102-2',
    entityId: 'ENT-020',
    tagNumber: '002-1999-0012-0',
    entityName: '으뜸이',
    category: 'calving',
    date: '2026-11-02',
    time: '06:10',
    title: '신생 송아지 탯줄 소독 및 초유 유도 포유',
    description: '골격이 매우 큰 수송아지(생시체중 42kg). 스스로 일어나 초유 2L 흡입 완료.',
    cost: 10000,
    worker: '김대표',
    nextScheduleDate: '2026-11-20',
    nextScheduleTime: '11:00',
    nextScheduleTitle: '생후 18일차 전기제각 실시'
  },

  // 11월 04일 (월) - 축사 보온 및 설사 예방
  {
    id: 'LOG-1104-1',
    entityId: 'ENT-020',
    tagNumber: '002-1999-0012-0',
    entityName: '으뜸이',
    category: 'feed',
    date: '2026-11-04',
    time: '09:00',
    title: '송아지 로타/코로나 바이러스 설사 예방 백신 투약',
    description: '경구용 생균제 및 면역 항체 젤 30ml 급여. 분만사 온열 보온등 높이 조절.',
    cost: 18000,
    worker: '박관리',
    nextScheduleDate: null
  },

  // 11월 06일 (수) - 인공수정
  {
    id: 'LOG-1106-1',
    entityId: 'ENT-009',
    tagNumber: '002-1204-5519-9',
    entityName: '소망이',
    category: 'breeding',
    date: '2026-11-06',
    time: '14:30',
    title: '1차 인공수정 시술 (우량 보증씨수소 KPN-1422)',
    description: '발정 개시 14시간 경과 후 수정 적기. 자궁경관 깊숙이 스트로 주입 완료.',
    cost: 65000,
    worker: '수정사',
    nextScheduleDate: '2026-11-27',
    nextScheduleTime: '08:30',
    nextScheduleTitle: '수정 21일차 재발정 유무 집중 관찰'
  },

  // 11월 08일 (금) - 송아지 설사 치료
  {
    id: 'LOG-1108-1',
    entityId: 'ENT-008',
    tagNumber: '002-1980-4421-8',
    entityName: '샛별이',
    category: 'treatment',
    date: '2026-11-08',
    time: '08:40',
    title: '일시적 수양성 연변 관찰에 따른 전해질 수액 처치',
    description: '탈수 방지를 위해 구강 전해질 포도당 수액 1L 경구 급여 및 정장제 투약.',
    cost: 15000,
    worker: '김대표',
    nextScheduleDate: '2026-11-09',
    nextScheduleTime: '08:30',
    nextScheduleTitle: '변 상태 및 기립 활력 확인'
  },

  // 11월 10일 (일) - 영양 블록 보충
  {
    id: 'LOG-1110-1',
    entityId: 'ENT-001',
    tagNumber: '002-1402-9851-1',
    entityName: '복순이',
    category: 'feed',
    date: '2026-11-10',
    time: '10:30',
    title: '임신우 전용 미네랄 릭블록 교체 및 양질 건초 보충',
    description: '칼슘, 인, 셀레늄 강화 릭블록 10kg 신규 설치. 티모시 건초 급여량 증량.',
    cost: 22000,
    worker: '박관리',
    nextScheduleDate: null
  },

  // 11월 12일 (화) - 인공수정
  {
    id: 'LOG-1112-1',
    entityId: 'ENT-017',
    tagNumber: '002-1788-3345-7',
    entityName: '은실이',
    category: 'breeding',
    date: '2026-11-12',
    time: '15:20',
    title: '2차 인공수정 시술 (KPN-1450 정액)',
    description: '승가 허용 후 경관 상태 양호. KPN-1450 1스트로 융해 후 주입 완료.',
    cost: 65000,
    worker: '수정사',
    nextScheduleDate: '2026-12-03',
    nextScheduleTime: '08:30',
    nextScheduleTitle: '수정 후 21일 재발정 확인'
  },

  // 11월 14일 (목) - 출하 전 점검
  {
    id: 'LOG-1114-1',
    entityId: 'ENT-002',
    tagNumber: '002-1521-4402-2',
    entityName: '금동이',
    category: 'weight',
    date: '2026-11-14',
    time: '11:00',
    title: '출하 전 최종 공복 체중 측정 (625kg 달성)',
    description: '체중 625kg 확인. 잔류물질 휴약기간 적합 확인 및 출하 전 위생 점검 완료.',
    cost: 0,
    worker: '김대표',
    nextScheduleDate: '2026-12-05',
    nextScheduleTime: '06:00',
    nextScheduleTitle: '축협 가축시장 경매 출하 상차'
  },

  // 11월 15일 (금) - 호흡기 치료 개시
  {
    id: 'LOG-1115-1',
    entityId: 'ENT-004',
    tagNumber: '002-1755-1209-4',
    entityName: '대박이',
    category: 'treatment',
    date: '2026-11-15',
    time: '16:00',
    title: '초기 호흡기 기침 및 비루(콧물) 증상 1차 투약',
    description: '체온 39.4도. 툴라스로마이신 항생제 4ml 피하 주사 및 소염진통제 근육 주사.',
    cost: 45000,
    worker: '수의사',
    nextScheduleDate: '2026-11-16',
    nextScheduleTime: '09:00',
    nextScheduleTitle: '체온 재측정 및 경과 확인'
  },

  // 11월 16일 (토) - 호흡기 치료 2일차
  {
    id: 'LOG-1116-1',
    entityId: 'ENT-004',
    tagNumber: '002-1755-1209-4',
    entityName: '대박이',
    category: 'treatment',
    date: '2026-11-16',
    time: '09:30',
    title: '호흡기 치료 경과 관찰 및 체온 안정화 확인',
    description: '체온 38.7도로 하강. 기침 빈도 현저히 감소하고 건초 섭취 시작.',
    cost: 15000,
    worker: '김대표',
    nextScheduleDate: '2026-11-20',
    nextScheduleTime: '10:00',
    nextScheduleTitle: '완치 판정 및 건강 상태 복귀'
  },

  // 11월 17일 (일) - 구제역 정기 백신
  {
    id: 'LOG-1117-1',
    entityId: 'ENT-001',
    tagNumber: '002-1402-9851-1',
    entityName: '복순이',
    category: 'vaccine',
    date: '2026-11-17',
    time: '10:00',
    title: '하반기 구제역(FMD) 2가 오일백신 정기 접종',
    description: '정부 지원 구제역 2가 백신 2ml 경부 근육 주사 처치.',
    cost: 0,
    worker: '방역관',
    nextScheduleDate: '2027-05-17',
    nextScheduleTime: '10:00',
    nextScheduleTitle: '상반기 구제역 정기 접종'
  },
  {
    id: 'LOG-1117-2',
    entityId: 'ENT-003',
    tagNumber: '002-1601-7733-3',
    entityName: '미순이',
    category: 'vaccine',
    date: '2026-11-17',
    time: '10:20',
    title: '하반기 구제역(FMD) 백신 정기 접종',
    description: '경부 근육 주사 접종 완료. 주사 부위 마사지 실시.',
    cost: 0,
    worker: '방역관',
    nextScheduleDate: '2027-05-17',
    nextScheduleTime: '10:00',
    nextScheduleTitle: '상반기 구제역 정기 접종'
  },

  // 11월 18일 (월) - 종모우 발굽 및 정액 점검
  {
    id: 'LOG-1118-1',
    entityId: 'ENT-014',
    tagNumber: '002-1955-1123-4',
    entityName: '태풍이',
    category: 'treatment',
    date: '2026-11-18',
    time: '14:00',
    title: '종모우 정기 발굽 손질(제번) 및 영양제 주사',
    description: '전문 제번사 입회하에 양측 앞발굽 균형 교정 삭제. 활력 증진 복합 미네랄 주사.',
    cost: 80000,
    worker: '전문제번사',
    nextScheduleDate: '2027-05-18',
    nextScheduleTime: '14:00',
    nextScheduleTitle: '종모우 정기 발굽 검진'
  },

  // 11월 19일 (화) - 피부염 치료
  {
    id: 'LOG-1119-1',
    entityId: 'ENT-013',
    tagNumber: '002-1845-6678-3',
    entityName: '꽃님이',
    category: 'treatment',
    date: '2026-11-19',
    time: '11:20',
    title: '환절기 쇠버짐(백선) 소독 및 항진균 연고 도포',
    description: '안면부 버짐 병변 포비돈 세척 후 클로트리마졸 연고 도포. 축사 환기 강화.',
    cost: 10000,
    worker: '박관리',
    nextScheduleDate: '2026-11-26',
    nextScheduleTime: '11:00',
    nextScheduleTitle: '버짐 호전 경과 확인 및 2차 도포'
  },

  // 11월 20일 (수 - 오늘!) - 최신 주요 작업
  {
    id: 'LOG-1120-1',
    entityId: 'ENT-003',
    tagNumber: '002-1601-7733-3',
    entityName: '미순이',
    category: 'breeding',
    date: '2026-11-20',
    time: '14:00',
    title: '자연 발정 관찰에 따른 우량 정액(KPN-1422) 인공수정 시술',
    description: '오전 6시 승가 허용 확인 후 14시에 수정사 시술 완료. 자궁 경관 탄력 우수하고 주입 순조로움.',
    cost: 65000,
    worker: '정수정사',
    nextScheduleDate: '2026-12-11',
    nextScheduleTime: '08:00',
    nextScheduleTitle: '수정 21일차 재발정 관찰'
  },
  {
    id: 'LOG-1120-2',
    entityId: 'ENT-020',
    tagNumber: '002-1999-0012-0',
    entityName: '으뜸이',
    category: 'treatment',
    date: '2026-11-20',
    time: '11:00',
    title: '생후 18일차 전기제각기 제각 및 국소 소독 처치',
    description: '전기 제각기로 각봉 소작 완료. 지혈제 도포 및 항생 분무제 살포. 어미소와 격리 후 진정 확인.',
    cost: 30000,
    worker: '김대표',
    nextScheduleDate: '2026-11-23',
    nextScheduleTime: '10:00',
    nextScheduleTitle: '제각 부위 가피 형성 확인'
  },
  {
    id: 'LOG-1120-3',
    entityId: 'ENT-004',
    tagNumber: '002-1755-1209-4',
    entityName: '대박이',
    category: 'treatment',
    date: '2026-11-20',
    time: '10:30',
    title: '호흡기 치료 완료 판정 및 건강 개체군 전환',
    description: '기침 및 콧물 완전 소멸, 호흡수 분당 24회 정상. 체온 38.5도 확인되어 치료 상태 해제.',
    cost: 0,
    worker: '김대표',
    nextScheduleDate: null
  }
];

// ==========================================================================
// 독립 영농 일정 관리 (Schedules)
// ==========================================================================
export const INITIAL_SAMPLE_SCHEDULES = [
  {
    id: 'SCHED-001',
    date: '2026-11-20',
    time: '10:00',
    entityId: null,
    tagNumber: null,
    entityName: '농장 공통',
    category: 'routine',
    title: '제1·2축사 안개 분무 방역 소독 및 환기팬 청소',
    memo: '구제역/ASF 대비 축사 주변 생석회 도포 및 안개 분무 소독',
    completed: true,
    createdAt: '2026-11-20T08:00:00Z'
  },
  {
    id: 'SCHED-002',
    date: '2026-11-20',
    time: '14:00',
    entityId: 'ENT-003',
    tagNumber: '002-1601-7733-3',
    entityName: '미순이',
    category: 'breeding',
    title: '미순이 KPN-1422 인공수정 시술 진행',
    memo: '정수정사 방문 예정. 질경 및 주입기 소독 준비',
    completed: true,
    createdAt: '2026-11-20T08:30:00Z'
  },
  {
    id: 'SCHED-003',
    date: '2026-11-23',
    time: '10:00',
    entityId: 'ENT-020',
    tagNumber: '002-1999-0012-0',
    entityName: '으뜸이',
    category: 'treatment',
    title: '으뜸이 제각 부위 상처 소독 및 가피 점검',
    memo: '염증 유무 확인 및 항생 연고 재도포',
    completed: false,
    createdAt: '2026-11-20T11:30:00Z'
  },
  {
    id: 'SCHED-004',
    date: '2026-11-27',
    time: '08:30',
    entityId: 'ENT-009',
    tagNumber: '002-1204-5519-9',
    entityName: '소망이',
    category: 'breeding',
    title: '소망이 인공수정 후 21일차 재발정 관찰',
    memo: '승가 행동 및 점액 분비 유무 아침/저녁 2회 집중 관찰',
    completed: false,
    createdAt: '2026-11-06T14:30:00Z'
  },
  {
    id: 'SCHED-005',
    date: '2026-12-05',
    time: '06:00',
    entityId: 'ENT-002',
    tagNumber: '002-1521-4402-2',
    entityName: '금동이',
    category: 'shipment',
    title: '금동이 축협 가축시장 경매 출하 상차',
    memo: '전용 수송 트럭 배차 확인 및 축산물이력제 출하 신고',
    completed: false,
    createdAt: '2026-11-14T11:00:00Z'
  }
];

// --------------------------------------------------------------------------
// 저장소 읽기 / 쓰기 함수 (v3 키 우선, 없으면 초기 샘플 반환)
// --------------------------------------------------------------------------
export function loadEntities() {
  try {
    const raw = localStorage.getItem(STORAGE_ENTITIES_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed.map(e => ({
          ...e,
          breed: formatDisplayBreed(e.breed),
          tagNumber: formatTagNumber(e.tagNumber)
        }));
      }
    }
    // 새 버전 초기 데이터 자동 저장
    saveEntities(INITIAL_SAMPLE_ENTITIES);
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
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed.map(log => ({
          ...log,
          tagNumber: formatTagNumber(log.tagNumber)
        }));
      }
    }
    // 새 버전 초기 데이터 자동 저장
    saveCareLogs(INITIAL_SAMPLE_CARE_LOGS);
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

export function loadSchedules() {
  try {
    const raw = localStorage.getItem(STORAGE_SCHEDULES_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
    saveSchedules(INITIAL_SAMPLE_SCHEDULES);
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
    .sort((a, b) => (a.nextScheduleTime || a.time || '').localeCompare(b.nextScheduleTime || b.time || ''));
}

// Full Database Export / Import
export function exportFullDatabase(entities, careLogs, customCategories, schedules) {
  const data = {
    app: 'happy-farm',
    version: '2.0.0',
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
