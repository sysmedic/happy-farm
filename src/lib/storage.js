// ==========================================================================
// Happy Farm Storage Service (행복 농장 데이터 저장소 및 관계형 DB 매니저)
// ==========================================================================

import { 
  getTodayDateString, 
  formatDisplayBreed, 
  formatTagNumber,
  loadCustomCareCategories,
  saveCustomCareCategories,
  normalizeCategoryId
} from './types.js';

// v5로 스토리지 키 버전업하여 필드 테스트용 10두 매뉴얼 레퍼런스 데이터 즉시 반영
const STORAGE_ENTITIES_KEY = 'happy_farm_entities_v5';
const STORAGE_LOGS_KEY = 'happy_farm_care_logs_v5';
const STORAGE_SCHEDULES_KEY = 'happy_farm_schedules_v5';
const STORAGE_CONFIG_KEY = 'happy_farm_config_v1';
const STORAGE_SETTINGS_KEY = 'happy_farm_settings_v1';

// 기본 농장 환경 설정
export const DEFAULT_FARM_SETTINGS = {
  farmName: '행복농장',
  ownerName: '관리자',
  address: '',
  workers: [], // 추가 작업자 / 담당자 명단
  startTab: 'entities' // 'entities' (개체관리) | 'diary' (캘린더)
};

export function loadFarmSettings() {
  try {
    // 과거 레거시 작업자 캐시 잔재 완전 삭제
    try { localStorage.removeItem('happy_farm_last_operator'); } catch (e) {}
    const raw = localStorage.getItem(STORAGE_SETTINGS_KEY);
    if (!raw) return { ...DEFAULT_FARM_SETTINGS };
    const parsed = JSON.parse(raw);
    return {
      ...DEFAULT_FARM_SETTINGS,
      ...parsed,
      workers: Array.isArray(parsed.workers) ? parsed.workers : [],
      // 하위 호환성 및 보정 (calendar로 들어와도 diary로 매핑)
      startTab: parsed.startTab === 'calendar' ? 'diary' : (parsed.startTab || 'entities')
    };
  } catch (err) {
    console.warn('[Storage] 농장 설정 로드 실패, 기본값 사용:', err);
    return { ...DEFAULT_FARM_SETTINGS };
  }
}

export function saveFarmSettings(settings) {
  try {
    const toSave = {
      ...DEFAULT_FARM_SETTINGS,
      ...settings
    };
    localStorage.setItem(STORAGE_SETTINGS_KEY, JSON.stringify(toSave));
    return true;
  } catch (err) {
    console.error('[Storage] 농장 설정 저장 실패:', err);
    return false;
  }
}

// ==========================================================================
// 필드 테스트용 10두 모범 레퍼런스 데이터 (샘플1~샘플10)
// ==========================================================================
export const INITIAL_SAMPLE_ENTITIES = [
  {
    "id": "ENT-001",
    "tagNumber": "002-1201-1001-1",
    "name": "샘플1",
    "category": "hanwoo",
    "breed": "번식우",
    "gender": "female",
    "birthDate": "2022-03-15",
    "barn": "제1축사 1번방",
    "motherTag": "002-1055-7788-1",
    "fatherTag": "KPN-1380",
    "weight": 510,
    "status": "pregnant",
    "memo": "초음파 감정 완료된 임신우 (KPN-1410 수태). 11월 말 분만 예정으로 분만실 이동 대기 중.",
    "createdAt": "2026-01-01T00:00:00Z",
    "updatedAt": "2026-11-21T09:00:00Z"
  },
  {
    "id": "ENT-002",
    "tagNumber": "002-1202-1002-2",
    "name": "샘플2",
    "category": "hanwoo",
    "breed": "번식우",
    "gender": "female",
    "birthDate": "2023-04-10",
    "barn": "분만·포유사 1호실",
    "motherTag": "002-1066-8899-2",
    "fatherTag": "KPN-1390",
    "weight": 485,
    "status": "nursing",
    "memo": "10월 20일 우량 암송아지(샘플5) 자연 순산 성공. 포유량 우수하며 비타민 및 미네랄 강화 사료 급여 중.",
    "createdAt": "2026-01-01T00:00:00Z",
    "updatedAt": "2026-11-21T09:00:00Z"
  },
  {
    "id": "ENT-003",
    "tagNumber": "002-1203-1003-3",
    "name": "샘플3",
    "category": "hanwoo",
    "breed": "번식우",
    "gender": "female",
    "birthDate": "2023-08-20",
    "barn": "제1축사 2번방",
    "motherTag": "002-1077-9900-3",
    "fatherTag": "KPN-1405",
    "weight": 475,
    "status": "inseminated",
    "memo": "11월 15일 KPN-1422 1차 인공수정 완료. 21일 주기 재발정 여부 면밀 관찰 필요.",
    "createdAt": "2026-01-01T00:00:00Z",
    "updatedAt": "2026-11-21T09:00:00Z"
  },
  {
    "id": "ENT-004",
    "tagNumber": "002-1204-1004-4",
    "name": "샘플4",
    "category": "hanwoo",
    "breed": "번식우",
    "gender": "female",
    "birthDate": "2024-01-12",
    "barn": "제1축사 3번방",
    "motherTag": "002-1088-0011-4",
    "fatherTag": "KPN-1375",
    "weight": 440,
    "status": "in_heat",
    "memo": "오전부터 강한 승가 및 외음부 발적 징후 관찰됨. 오늘 오후 인공수정사 방문 시술 예정.",
    "createdAt": "2026-01-01T00:00:00Z",
    "updatedAt": "2026-11-21T09:00:00Z"
  },
  {
    "id": "ENT-005",
    "tagNumber": "002-1205-1005-5",
    "name": "샘플5",
    "category": "hanwoo",
    "breed": "송아지 - 암",
    "gender": "female",
    "birthDate": "2026-10-20",
    "barn": "분만·포유사 1호실",
    "motherTag": "002-1202-1002-2",
    "fatherTag": "KPN-1410",
    "weight": 48,
    "status": "healthy",
    "memo": "샘플2의 자우. 생시체중 28kg로 순산. 초유 섭취 양호하며 로타/코로나 백신 접종 완료.",
    "createdAt": "2026-10-20T00:00:00Z",
    "updatedAt": "2026-11-21T09:00:00Z"
  },
  {
    "id": "ENT-006",
    "tagNumber": "002-1206-1006-6",
    "name": "샘플6",
    "category": "hanwoo",
    "breed": "송아지 - 수",
    "gender": "male",
    "birthDate": "2026-06-15",
    "barn": "송아지 육성사 2호",
    "motherTag": "002-1099-1122-5",
    "fatherTag": "KPN-1415",
    "weight": 135,
    "status": "treatment",
    "memo": "11월 18일 외과적 거세 시술 완료. 술부 감염 예방을 위해 광범위 항생제 및 소염제 3일간 투약 치료 중.",
    "createdAt": "2026-06-15T00:00:00Z",
    "updatedAt": "2026-11-21T09:00:00Z"
  },
  {
    "id": "ENT-007",
    "tagNumber": "002-1207-1007-7",
    "name": "샘플7",
    "category": "hanwoo",
    "breed": "육성우 - 암",
    "gender": "female",
    "birthDate": "2025-09-10",
    "barn": "제3육성사 A동",
    "motherTag": "002-1100-2233-6",
    "fatherTag": "KPN-1398",
    "weight": 315,
    "status": "healthy",
    "memo": "골격 발달 및 BCS 체형 스코어 우수. 14개월령 첫 수정(초종) 목표로 번식사료 서서히 전환 중.",
    "createdAt": "2026-01-01T00:00:00Z",
    "updatedAt": "2026-11-21T09:00:00Z"
  },
  {
    "id": "ENT-008",
    "tagNumber": "002-1208-1008-8",
    "name": "샘플8",
    "category": "hanwoo",
    "breed": "비육우 - 거세",
    "gender": "castrated",
    "birthDate": "2024-05-20",
    "barn": "비육전문사 4번방",
    "motherTag": "002-1111-3344-7",
    "fatherTag": "KPN-1365",
    "weight": 760,
    "status": "scheduled_ship",
    "memo": "30개월령 비육 완성우. 음수 및 사료 섭취 상태 최상이며 농협 안심한우 공판장 다음 주 월요일 출하 예정.",
    "createdAt": "2026-01-01T00:00:00Z",
    "updatedAt": "2026-11-21T09:00:00Z"
  },
  {
    "id": "ENT-009",
    "tagNumber": "002-1209-1009-9",
    "name": "샘플9",
    "category": "hanwoo",
    "breed": "비육우 - 암",
    "gender": "female",
    "birthDate": "2023-11-05",
    "barn": "비육전문사 2번방",
    "motherTag": "002-1122-4455-8",
    "fatherTag": "KPN-1350",
    "weight": 630,
    "status": "healthy",
    "memo": "경산우 암소 비육 후기 진행 중. 마블링 강화 배합사료 급여 중이며 체형 안정적.",
    "createdAt": "2026-01-01T00:00:00Z",
    "updatedAt": "2026-11-21T09:00:00Z"
  },
  {
    "id": "ENT-010",
    "tagNumber": "002-1210-1010-0",
    "name": "샘플10",
    "category": "hanwoo",
    "breed": "씨수소",
    "gender": "male",
    "birthDate": "2022-06-01",
    "barn": "종모우 특별사 A-1",
    "motherTag": "002-1133-5566-9",
    "fatherTag": "KPN-1250",
    "weight": 890,
    "status": "healthy",
    "memo": "유전능력 최상위 혈통 보증 종모우. 정기 정액 성상 검사(활력도 A급) 통과 및 활력 관리.",
    "createdAt": "2026-01-01T00:00:00Z",
    "updatedAt": "2026-11-21T09:00:00Z"
  }
];

// ==========================================================================
// 2026년 1월~11월 실전 생애 관리 매뉴얼 기록 데이터
// ==========================================================================
export const INITIAL_SAMPLE_CARE_LOGS = [
  {
    "id": "LOG-1001",
    "entityId": "ENT-001",
    "tagNumber": "002-1201-1001-1",
    "date": "2026-01-08",
    "time": "09:30",
    "category": "treatment",
    "title": "혹한기 면역 증강제 및 비타민 AD3E 주사",
    "description": "겨울철 기온 급강하 대비 면역력 증강제 및 지용성 비타민 복합제 근육 주사 투여 완료.",
    "operator": "김축산 수의사",
    "cost": 15000,
    "createdAt": "2026-01-08T09:30:00Z"
  },
  {
    "id": "LOG-1002",
    "entityId": "ENT-002",
    "tagNumber": "002-1202-1002-2",
    "date": "2026-01-14",
    "time": "10:20",
    "category": "breeding",
    "title": "1차 인공수정 시술 (KPN-1410 우량 정액)",
    "description": "자연 발정 확인 후 수정 적기 10시간 경과 시점 인공수정 실시. 정액 스트로 보관 상태 양호.",
    "operator": "이인공 수정사",
    "cost": 35000,
    "nextScheduleDate": "2026-02-04",
    "nextScheduleTime": "09:00",
    "nextScheduleTitle": "21일차 재발정 관찰",
    "nextScheduleCompleted": true,
    "createdAt": "2026-01-14T10:20:00Z"
  },
  {
    "id": "LOG-1003",
    "entityId": "ENT-008",
    "tagNumber": "002-1208-1008-8",
    "date": "2026-01-20",
    "time": "14:00",
    "category": "weight",
    "title": "비육 중기 정기 체중 계근 (610kg)",
    "description": "비육 중기 사양 프로그램 점검. 일당 증체량 0.85kg 유지 확인.",
    "operator": "농장주",
    "cost": 0,
    "createdAt": "2026-01-20T14:00:00Z"
  },
  {
    "id": "LOG-1004",
    "entityId": "ENT-001",
    "tagNumber": "002-1201-1001-1",
    "date": "2026-02-03",
    "time": "08:15",
    "category": "breeding",
    "title": "승가 허용 및 끈적한 점액 분비 (자연 발정)",
    "description": "동방우의 승가를 차분히 허용하는 명확한 발정 행동 확인. 당일 오후 인공수정 예약.",
    "operator": "농장주",
    "cost": 0,
    "createdAt": "2026-02-03T08:15:00Z"
  },
  {
    "id": "LOG-1005",
    "entityId": "ENT-001",
    "tagNumber": "002-1201-1001-1",
    "date": "2026-02-03",
    "time": "15:30",
    "category": "breeding",
    "title": "인공수정 시술 (KPN-1410 보증씨수소)",
    "description": "자궁경관 통과 원활, 자궁각 깊숙이 정액 주입 완료. 자궁 수축 양호.",
    "operator": "이인공 수정사",
    "cost": 35000,
    "nextScheduleDate": "2026-02-24",
    "nextScheduleTime": "09:00",
    "nextScheduleTitle": "21일차 재발정 여부 관찰",
    "nextScheduleCompleted": true,
    "createdAt": "2026-02-03T15:30:00Z"
  },
  {
    "id": "LOG-1006",
    "entityId": "ENT-010",
    "tagNumber": "002-1210-1010-0",
    "date": "2026-02-18",
    "time": "11:00",
    "category": "feed",
    "title": "춘계 대비 종모우 보양 배합사료 급여",
    "description": "활력 증진을 위한 고단백 영양제 및 비타민 복합 사료 첨가.",
    "operator": "농장주",
    "cost": 25000,
    "createdAt": "2026-02-18T11:00:00Z"
  },
  {
    "id": "LOG-1007",
    "entityId": "ENT-001",
    "tagNumber": "002-1201-1001-1",
    "date": "2026-03-10",
    "time": "10:00",
    "category": "vaccine",
    "title": "춘계 구제역(FMD) 2가 오일백신 정기 접종",
    "description": "정부 일제접종 시책에 따른 이근부 피하 2ml 접종 완료. 이상 반응 무.",
    "operator": "공수의사 박방역",
    "cost": 0,
    "createdAt": "2026-03-10T10:00:00Z"
  },
  {
    "id": "LOG-1008",
    "entityId": "ENT-002",
    "tagNumber": "002-1202-1002-2",
    "date": "2026-03-10",
    "time": "10:05",
    "category": "vaccine",
    "title": "춘계 구제역(FMD) 2가 오일백신 정기 접종",
    "description": "이근부 피하 2ml 접종 완료.",
    "operator": "공수의사 박방역",
    "cost": 0,
    "createdAt": "2026-03-10T10:05:00Z"
  },
  {
    "id": "LOG-1009",
    "entityId": "ENT-008",
    "tagNumber": "002-1208-1008-8",
    "date": "2026-03-10",
    "time": "10:15",
    "category": "vaccine",
    "title": "춘계 구제역(FMD) 2가 오일백신 정기 접종",
    "description": "이근부 피하 2ml 접종 완료.",
    "operator": "공수의사 박방역",
    "cost": 0,
    "createdAt": "2026-03-10T10:15:00Z"
  },
  {
    "id": "LOG-1010",
    "entityId": "ENT-002",
    "tagNumber": "002-1202-1002-2",
    "date": "2026-03-25",
    "time": "14:30",
    "category": "breeding",
    "title": "초음파 임신 감정 (임신 확인 / 수태 판정)",
    "description": "인공수정 후 70일차 직장 초음파 진단 결과 배아 심박동 확인 및 정상 임신 확정.",
    "operator": "김축산 수의사",
    "cost": 20000,
    "nextScheduleDate": "2026-10-25",
    "nextScheduleTime": "09:00",
    "nextScheduleTitle": "분만 예정일 대비 분만실 이동",
    "nextScheduleCompleted": true,
    "createdAt": "2026-03-25T14:30:00Z"
  },
  {
    "id": "LOG-1011",
    "entityId": "ENT-007",
    "tagNumber": "002-1207-1007-7",
    "date": "2026-04-12",
    "time": "15:00",
    "category": "weight",
    "title": "육성우 전기 체중 측정 (250kg)",
    "description": "골격 성장 우수, 체고 및 흉위 표준 발육 곡선 상회.",
    "operator": "농장주",
    "cost": 0,
    "createdAt": "2026-04-12T15:00:00Z"
  },
  {
    "id": "LOG-1012",
    "entityId": "ENT-009",
    "tagNumber": "002-1209-1009-9",
    "date": "2026-04-20",
    "time": "11:30",
    "category": "feed",
    "title": "암소 비육용 고급 배합사료 전환",
    "description": "근내지방도(BMS) 향상을 위한 전용 사료 급여 프로그램 가동.",
    "operator": "농장주",
    "cost": 0,
    "createdAt": "2026-04-20T11:30:00Z"
  },
  {
    "id": "LOG-1013",
    "entityId": "ENT-001",
    "tagNumber": "002-1201-1001-1",
    "date": "2026-05-02",
    "time": "10:30",
    "category": "breeding",
    "title": "초음파 임신 감정 (임신 확정 / 수태 성공)",
    "description": "인공수정 후 88일차 초음파 감정 결과 정상 수태 확인. 분만 예정일: 2026-11-28 산출.",
    "operator": "김축산 수의사",
    "cost": 20000,
    "nextScheduleDate": "2026-11-28",
    "nextScheduleTime": "09:00",
    "nextScheduleTitle": "예정 분만일 및 분만실 집중 관리",
    "nextScheduleCompleted": true,
    "nextSchedulePromotedScheduleId": "SCH-1003",
    "createdAt": "2026-05-02T10:30:00Z"
  },
  {
    "id": "LOG-1014",
    "entityId": "ENT-001",
    "tagNumber": "002-1201-1001-1",
    "date": "2026-05-15",
    "time": "14:00",
    "category": "vaccine",
    "title": "소 유행열·아까바네 2종 혼합 백신 접종",
    "description": "여름철 모기 매개 바이러스성 전염병 예방 백신 접종.",
    "operator": "공수의사 박방역",
    "cost": 0,
    "createdAt": "2026-05-15T14:00:00Z"
  },
  {
    "id": "LOG-1015",
    "entityId": "ENT-002",
    "tagNumber": "002-1202-1002-2",
    "date": "2026-05-15",
    "time": "14:05",
    "category": "vaccine",
    "title": "소 유행열·아까바네 2종 혼합 백신 접종",
    "description": "여름철 모기 매개 바이러스성 전염병 예방 백신 접종.",
    "operator": "공수의사 박방역",
    "cost": 0,
    "createdAt": "2026-05-15T14:05:00Z"
  },
  {
    "id": "LOG-1016",
    "entityId": "ENT-010",
    "tagNumber": "002-1210-1010-0",
    "date": "2026-05-28",
    "time": "10:00",
    "category": "treatment",
    "title": "씨수소 정기 정액 성상 검사",
    "description": "정액 활력도, 직진성, 기형률 검사 결과 전체 A급 판정.",
    "operator": "축산과학원 연구원",
    "cost": 50000,
    "createdAt": "2026-05-28T10:00:00Z"
  },
  {
    "id": "LOG-1017",
    "entityId": "ENT-008",
    "tagNumber": "002-1208-1008-8",
    "date": "2026-06-10",
    "time": "16:00",
    "category": "weight",
    "title": "비육 후기 1차 체중 계근 (680kg)",
    "description": "배최장근 단면적 및 등지방 두께 초음파 육질 판독 병행. A등급 이상 기대.",
    "operator": "농장주",
    "cost": 0,
    "createdAt": "2026-06-10T16:00:00Z"
  },
  {
    "id": "LOG-1018",
    "entityId": "ENT-006",
    "tagNumber": "002-1206-1006-6",
    "date": "2026-06-15",
    "time": "08:30",
    "category": "calving",
    "title": "수송아지 출생 등록 (생시체중 31kg)",
    "description": "우량 수송아지 자연 분만 출생. 초유 2L 섭취 및 탯줄 소독 완료.",
    "operator": "농장주",
    "cost": 0,
    "createdAt": "2026-06-15T08:30:00Z"
  },
  {
    "id": "LOG-1019",
    "entityId": "ENT-001",
    "tagNumber": "002-1201-1001-1",
    "date": "2026-07-15",
    "time": "11:00",
    "category": "weight",
    "title": "정기 번식우 체형 스코어(BCS 3.2) 측정",
    "description": "임신 중기 과비 방지 및 양호한 영양 밸런스 유지 확인.",
    "operator": "농장주",
    "cost": 0,
    "createdAt": "2026-07-15T11:00:00Z"
  },
  {
    "id": "LOG-1020",
    "entityId": "ENT-007",
    "tagNumber": "002-1207-1007-7",
    "date": "2026-07-22",
    "time": "14:00",
    "category": "weight",
    "title": "육성우 중기 체중 계근 (280kg)",
    "description": "일당 증체 0.7kg 순조로운 성장세 유지.",
    "operator": "농장주",
    "cost": 0,
    "createdAt": "2026-07-22T14:00:00Z"
  },
  {
    "id": "LOG-1021",
    "entityId": "ENT-009",
    "tagNumber": "002-1209-1009-9",
    "date": "2026-08-14",
    "time": "09:00",
    "category": "treatment",
    "title": "여름철 환절기 호흡기 질환 치료 (항생제 투여)",
    "description": "기침 및 비루 증상 관찰되어 틸미코신 주사 투여. 휴약기간 28일 엄수 고지.",
    "operator": "김축산 수의사",
    "cost": 30000,
    "createdAt": "2026-08-14T09:00:00Z"
  },
  {
    "id": "LOG-1022",
    "entityId": "ENT-006",
    "tagNumber": "002-1206-1006-6",
    "date": "2026-08-20",
    "time": "10:30",
    "category": "vaccine",
    "title": "송아지 로타·코로나·대장균 3종 설사 예방 백신",
    "description": "생후 2개월차 필수 설사 예방 백신 경구 투여.",
    "operator": "농장주",
    "cost": 12000,
    "createdAt": "2026-08-20T10:30:00Z"
  },
  {
    "id": "LOG-1023",
    "entityId": "ENT-001",
    "tagNumber": "002-1201-1001-1",
    "date": "2026-09-05",
    "time": "10:00",
    "category": "vaccine",
    "title": "하반기 구제역(FMD) 2가 백신 일제 접종",
    "description": "추계 정기 접종 완료. 임신 후기 스트레스 최소화 주사.",
    "operator": "공수의사 박방역",
    "cost": 0,
    "createdAt": "2026-09-05T10:00:00Z"
  },
  {
    "id": "LOG-1024",
    "entityId": "ENT-008",
    "tagNumber": "002-1208-1008-8",
    "date": "2026-09-05",
    "time": "10:10",
    "category": "vaccine",
    "title": "하반기 구제역(FMD) 2가 백신 일제 접종",
    "description": "출하 2개월 전 접종 완료.",
    "operator": "공수의사 박방역",
    "cost": 0,
    "createdAt": "2026-09-05T10:10:00Z"
  },
  {
    "id": "LOG-1025",
    "entityId": "ENT-008",
    "tagNumber": "002-1208-1008-8",
    "date": "2026-09-18",
    "time": "15:00",
    "category": "weight",
    "title": "비육 후기 2차 체중 측정 (720kg)",
    "description": "700kg 돌파. 육질 1++ 등급 출하 목표 순항 중.",
    "operator": "농장주",
    "cost": 0,
    "createdAt": "2026-09-18T15:00:00Z"
  },
  {
    "id": "LOG-1026",
    "entityId": "ENT-002",
    "tagNumber": "002-1202-1002-2",
    "date": "2026-10-20",
    "time": "04:30",
    "category": "calving",
    "title": "우량 암송아지(샘플5) 자연 순산 성공",
    "description": "새벽 4시 양수 파수 후 30분 만에 조산 없이 자연 분만. 후산 2시간 내 완전 배출.",
    "operator": "농장주",
    "cost": 0,
    "createdAt": "2026-10-20T04:30:00Z"
  },
  {
    "id": "LOG-1027",
    "entityId": "ENT-005",
    "tagNumber": "002-1205-1005-5",
    "date": "2026-10-20",
    "time": "05:30",
    "category": "calving",
    "title": "신생 송아지 생시체중 계근 (28kg) 및 초유 급여",
    "description": "체온 38.6도 양호. 분만 1시간 내 면역글로불린 농축 초유 1.5L 자발 포유 성공.",
    "operator": "농장주",
    "cost": 0,
    "createdAt": "2026-10-20T05:30:00Z"
  },
  {
    "id": "LOG-1028",
    "entityId": "ENT-005",
    "tagNumber": "002-1205-1005-5",
    "date": "2026-10-28",
    "time": "14:00",
    "category": "vaccine",
    "title": "송아지 로타·코로나 혼합 백신 1차 접종",
    "description": "초기 바이러스성 설사 예방을 위한 피하 접종 완료.",
    "operator": "농장주",
    "cost": 15000,
    "createdAt": "2026-10-28T14:00:00Z"
  },
  {
    "id": "LOG-1029",
    "entityId": "ENT-007",
    "tagNumber": "002-1207-1007-7",
    "date": "2026-11-05",
    "time": "14:00",
    "category": "weight",
    "title": "육성우 14개월령 체중 측정 (315kg) 및 BCS 점검",
    "description": "체중 315kg 돌파. 번식우로서 첫 수정 목표 체중(300kg) 도달 완료.",
    "operator": "농장주",
    "cost": 0,
    "createdAt": "2026-11-05T14:00:00Z"
  },
  {
    "id": "LOG-1030",
    "entityId": "ENT-003",
    "tagNumber": "002-1203-1003-3",
    "date": "2026-11-15",
    "time": "11:20",
    "category": "breeding",
    "title": "1차 인공수정 시술 (KPN-1422 우량 정액)",
    "description": "자연 발정 확인 후 오전 적기 시술. 자궁내막 주입 양호.",
    "operator": "이인공 수정사",
    "cost": 35000,
    "nextScheduleDate": "2026-12-06",
    "nextScheduleTime": "09:00",
    "nextScheduleTitle": "21일차 재발정 여부 면밀 관찰",
    "nextScheduleCompleted": false,
    "createdAt": "2026-11-15T11:20:00Z"
  },
  {
    "id": "LOG-1031",
    "entityId": "ENT-008",
    "tagNumber": "002-1208-1008-8",
    "date": "2026-11-15",
    "time": "15:30",
    "category": "weight",
    "title": "출하 전 최종 계근 (760kg 달성)",
    "description": "생체중 760kg 도달. 비육 상태 극상. 11월 24일 도축장 출하 확정.",
    "operator": "농협 축산지도사",
    "cost": 0,
    "nextScheduleDate": "2026-11-24",
    "nextScheduleTime": "07:00",
    "nextScheduleTitle": "농협 공판장 출하 상차",
    "nextScheduleCompleted": true,
    "nextSchedulePromotedScheduleId": "SCH-1002",
    "createdAt": "2026-11-15T15:30:00Z"
  },
  {
    "id": "LOG-1032",
    "entityId": "ENT-006",
    "tagNumber": "002-1206-1006-6",
    "date": "2026-11-18",
    "time": "10:30",
    "category": "treatment",
    "title": "외과적 거세 시술 (무혈 거세법 병행)",
    "description": "비육우 전환을 위한 수술적 거세 완료. 국소마취 및 지혈 완료.",
    "operator": "김축산 수의사",
    "cost": 45000,
    "createdAt": "2026-11-18T10:30:00Z"
  },
  {
    "id": "LOG-1033",
    "entityId": "ENT-006",
    "tagNumber": "002-1206-1006-6",
    "date": "2026-11-20",
    "time": "09:30",
    "category": "treatment",
    "title": "거세 수술 후 소염 항생제 2차 투약",
    "description": "술부 부종 경미, 식욕 정상 확인. 광범위 항생제 및 진통소염제 주사.",
    "operator": "농장주",
    "cost": 8000,
    "createdAt": "2026-11-20T09:30:00Z"
  },
  {
    "id": "LOG-1034",
    "entityId": "ENT-004",
    "tagNumber": "002-1204-1004-4",
    "date": "2026-11-21",
    "time": "07:30",
    "category": "breeding",
    "title": "승가 행동 및 외음부 충혈 관찰 (자연 발정)",
    "description": "오침 승가 허용, 맑은 점액 배출 확인. 금일 오후 14시 인공수정 예약.",
    "operator": "농장주",
    "cost": 0,
    "nextScheduleDate": "2026-11-21",
    "nextScheduleTime": "14:00",
    "nextScheduleTitle": "KPN 보증정액 인공수정 시술",
    "nextScheduleCompleted": false,
    "createdAt": "2026-11-21T07:30:00Z"
  },
  {
    "id": "LOG-1035",
    "entityId": null,
    "tagNumber": null,
    "entityName": "농장 공통",
    "isFarmCommon": true,
    "date": "2026-11-18",
    "time": "10:00",
    "category": "routine",
    "title": "축사 내외부 안개분무 일제 소독",
    "details": "생석회 도포 구역 확인 및 구제역·ASF 방역 안개분무 소독액 120L 전구역 살포 완료.",
    "operator": "농장주",
    "cost": 35000,
    "createdAt": "2026-11-18T10:00:00Z"
  },
  {
    "id": "LOG-1036",
    "entityId": null,
    "tagNumber": null,
    "entityName": "농장 공통",
    "isFarmCommon": true,
    "date": "2026-11-05",
    "time": "15:30",
    "category": "routine",
    "title": "환풍기 모터 점검 및 방진망 청소",
    "details": "동절기 대비 환풍기 8대 가동 상태 점검 및 방진망 고압 세척.",
    "operator": "농장주",
    "cost": 0,
    "createdAt": "2026-11-05T15:30:00Z"
  }
];

// ==========================================================================
// 모범 다이어리 미래 스케줄 데이터
// ==========================================================================
export const INITIAL_SAMPLE_SCHEDULES = [
  {
    "id": "SCH-1001",
    "entityId": "ENT-004",
    "tagNumber": "002-1204-1004-4",
    "date": "2026-11-21",
    "time": "14:00",
    "title": "[샘플4] KPN 보증정액 인공수정 시술",
    "category": "breeding",
    "completed": false,
    "memo": "이인공 수정사 방문 예정. KPN-1425 정액 준비."
  },
  {
    "id": "SCH-1002",
    "entityId": "ENT-008",
    "tagNumber": "002-1208-1008-8",
    "date": "2026-11-24",
    "time": "07:00",
    "title": "[샘플8] 농협 안심한우 공판장 출하 상차",
    "category": "routine",
    "completed": false,
    "originReminderLogId": "LOG-1031",
    "memo": "전일 저녁부터 절식 실시. 수송 차량 7시 도착 예정."
  },
  {
    "id": "SCH-1003",
    "entityId": "ENT-001",
    "tagNumber": "002-1201-1001-1",
    "date": "2026-11-28",
    "time": "09:00",
    "title": "[샘플1] 예정 분만일 (분만실 집중 관찰)",
    "category": "calving",
    "completed": false,
    "originReminderLogId": "LOG-1013",
    "memo": "CCTV 분만실 감시 가동 및 마른 깔짚 충분히 보충."
  },
  {
    "id": "SCH-1004",
    "entityId": "ENT-003",
    "tagNumber": "002-1203-1003-3",
    "date": "2026-12-06",
    "time": "09:00",
    "title": "[샘플3] 21일차 재발정 여부 면밀 관찰",
    "category": "breeding",
    "completed": false,
    "memo": "승가 행동 및 점액 분비 여부 확인 후 미발정 시 1월 초음파 감정 예약."
  },
  {
    "id": "SCH-1005",
    "entityId": "ENT-005",
    "tagNumber": "002-1205-1005-5",
    "date": "2026-12-10",
    "time": "14:00",
    "title": "[샘플5] 송아지 5종 복합 백신 2차 추가접종",
    "category": "vaccine",
    "completed": false,
    "memo": "폐렴 및 장염 복합 백신 2차 보강 접종."
  }
];

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
        let hasModified = false;
        let normalized = parsed.map(log => {
          const normCat = normalizeCategoryId(log.category);
          const normTag = formatTagNumber(log.tagNumber);
          if (log.category !== normCat || log.tagNumber !== normTag) {
            hasModified = true;
          }
          return {
            ...log,
            category: normCat,
            tagNumber: normTag
          };
        });
        // 알람-일정 간 누락된 연결 고리 및 유령 알람 자동 치유 (Auto-healing)
        try {
          const schedRaw = localStorage.getItem(STORAGE_SCHEDULES_KEY);
          const existingSchedules = schedRaw ? JSON.parse(schedRaw) : [];
          if (Array.isArray(existingSchedules) && existingSchedules.length > 0) {
            let schedModified = false;
            normalized.forEach(log => {
              if (log.nextScheduleDate) {
                // 이미 등록된 일정 중 이 알람과 일치하는 일정 매칭 (ID 연결 또는 개체/날짜/작업명 일치)
                const matchedSched = existingSchedules.find(s => 
                  s.originReminderLogId === log.id ||
                  s.id === log.nextSchedulePromotedScheduleId ||
                  ((s.entityId === log.entityId || s.tagNumber === log.tagNumber) && 
                   s.date === log.nextScheduleDate && 
                   log.nextScheduleTitle && s.title && (s.title.includes(log.nextScheduleTitle) || log.nextScheduleTitle.includes(s.title)))
                );
                if (matchedSched) {
                  if (!log.nextSchedulePromotedScheduleId) {
                    log.nextSchedulePromotedScheduleId = matchedSched.id;
                    hasModified = true;
                  }
                  if (!matchedSched.originReminderLogId) {
                    matchedSched.originReminderLogId = log.id;
                    schedModified = true;
                  }
                  // 일정이 이미 완료되었거나 공식 일정으로 등록된 경우 알람도 중복 방지 완료 처리
                  if (!log.nextScheduleCompleted) {
                    log.nextScheduleCompleted = true;
                    log.nextScheduleCompletedDate = matchedSched.date;
                    hasModified = true;
                  }
                }
              }
            });
            if (schedModified) {
              localStorage.setItem(STORAGE_SCHEDULES_KEY, JSON.stringify(existingSchedules));
            }
          }
        } catch (e) {
          // 자동 치유 파싱 예외 무시
        }

        // 농장 공통 관리기록 샘플이 전혀 없는 경우 기본 방역/소독 모범 데이터 2건 보강
        const hasFarmCommon = normalized.some(l => l.isFarmCommon || (!l.entityId && l.entityName === '농장 공통'));
        if (!hasFarmCommon) {
          const sampleCommons = INITIAL_SAMPLE_CARE_LOGS.filter(l => l.isFarmCommon);
          normalized = [...normalized, ...sampleCommons];
          hasModified = true;
        }

        // 레거시 카테고리(insemination, birth 등) 또는 알람 자동치유가 수행된 경우 스토리지 즉시 갱신 저장
        if (hasModified) {
          saveCareLogs(normalized);
        }
        return normalized;
      }
    }
    // 새 버전 초기 데이터 자동 저장
    const normalizedSeed = INITIAL_SAMPLE_CARE_LOGS.map(log => ({
      ...log,
      category: normalizeCategoryId(log.category),
      tagNumber: formatTagNumber(log.tagNumber)
    }));
    saveCareLogs(normalizedSeed);
    return normalizedSeed;
  } catch (err) {
    console.error('Failed to load care logs:', err);
    return INITIAL_SAMPLE_CARE_LOGS.map(log => ({
      ...log,
      category: normalizeCategoryId(log.category),
      tagNumber: formatTagNumber(log.tagNumber)
    }));
  }
}

export function saveCareLogs(logs) {
  try {
    const normalized = (logs || []).map(log => ({
      ...log,
      category: normalizeCategoryId(log.category),
      tagNumber: formatTagNumber(log.tagNumber)
    }));
    localStorage.setItem(STORAGE_LOGS_KEY, JSON.stringify(normalized));
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
export function exportFullDatabase(entities, careLogs, customCategories, schedules, farmSettings) {
  const data = {
    app: 'happy-farm',
    version: '2.2.0',
    exportTimestamp: new Date().toISOString(),
    farmSettings: farmSettings || loadFarmSettings(),
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

    if (data.farmSettings && typeof data.farmSettings === 'object') {
      saveFarmSettings(data.farmSettings);
    }

    return { 
      success: true, 
      entityCount: entities.length, 
      logCount: careLogs.length,
      scheduleCount: schedules.length,
      categoryCount: Array.isArray(data.customCategories) ? data.customCategories.length : 0,
      hasFarmSettings: Boolean(data.farmSettings)
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
