// ==========================================================================
// Happy Farm Types & Helpers (행복 농장 상수 및 도우미 함수)
// ==========================================================================

export const ENTITY_CATEGORIES = [
  { id: 'hanwoo', label: '한우', icon: '🐂', defaultBreed: '한우(번식우)' },
];

export const HANWOO_BREEDS = [
  { id: 'breeding_cow', label: '번식우', shortLabel: '번식우', defaultGender: 'female', isGenderFixed: true, allowedGenders: ['female'] },
  { id: 'steer_beef', label: '비육우', shortLabel: '비육우', defaultGender: 'castrated', isGenderFixed: false, allowedGenders: ['castrated', 'female'] },
  { id: 'calf', label: '송아지', shortLabel: '송아지', defaultGender: 'female', isGenderFixed: false, allowedGenders: ['female', 'male'] },
  { id: 'growing', label: '육성우', shortLabel: '육성우', defaultGender: 'female', isGenderFixed: false, allowedGenders: ['female', 'male', 'castrated'] },
  { id: 'bull', label: '씨수소', shortLabel: '씨수소', defaultGender: 'male', isGenderFixed: true, allowedGenders: ['male'] },
];

// 사육구분 표시 포맷터: 성별 고정 품종(번식우, 씨수소)은 성별 꼬리표 제거, 가변 품종은 '단계 - 성별' 유지
export function formatDisplayBreed(breedStr) {
  if (!breedStr) return '번식우';
  
  // 1) 번식우(암소 100% 고정)는 뒤의 성별 꼬리표 완전 제거
  if (breedStr.includes('번식') || breedStr.includes('암소')) {
    return '번식우';
  }
  // 2) 씨수소(수소 100% 고정)도 성별 꼬리표 완전 제거
  if (breedStr.includes('씨수소') || breedStr.includes('종모우')) {
    return '씨수소';
  }
  // 3) 비육우 (거세 또는 암컷 비육)
  if (breedStr.includes('비육') || breedStr.includes('거세')) {
    if (breedStr.includes('암')) return '비육우 - 암';
    return '비육우 - 거세';
  }
  // 4) 송아지
  if (breedStr.includes('송아지')) {
    return (breedStr.includes('수컷') || breedStr.includes(' - 수')) ? '송아지 - 수' : '송아지 - 암';
  }
  // 5) 육성우
  if (breedStr.includes('육성')) {
    if (breedStr.includes('거세')) return '육성우 - 거세';
    return (breedStr.includes('수컷') || breedStr.includes(' - 수')) ? '육성우 - 수' : '육성우 - 암';
  }
  
  return breedStr.replace(' - 암컷', ' - 암').replace(' - 수컷', ' - 수');
}

// 사육단계(stage)와 성별(gender)로부터 표준 사육구분 명칭 생성
export function buildBreedName(stage, gender) {
  const cleanStage = (stage || '번식우').trim();
  if (cleanStage.includes('번식') || cleanStage === '번식우') return '번식우';
  if (cleanStage.includes('씨수소') || cleanStage === '씨수소') return '씨수소';
  
  const genderLabel = gender === 'female' ? '암' : gender === 'male' ? '수' : '거세';
  return `${cleanStage} - ${genderLabel}`;
}

// 개체식별번호(이표번호 12자리: 002-XXXX-XXXX-X) 숫자 자동 하이픈 포맷팅
export function formatTagNumber(value) {
  if (!value) return '';
  const clean = value.replace(/[^0-9]/g, '').slice(0, 12);
  if (clean.length <= 3) return clean;
  if (clean.length <= 7) return `${clean.slice(0, 3)}-${clean.slice(3)}`;
  if (clean.length <= 11) return `${clean.slice(0, 3)}-${clean.slice(3, 7)}-${clean.slice(7)}`;
  return `${clean.slice(0, 3)}-${clean.slice(3, 7)}-${clean.slice(7, 11)}-${clean.slice(11, 12)}`;
}

export const GENDER_OPTIONS = [
  { id: 'female', label: '암컷', symbol: '♀', color: '#ec4899' },
  { id: 'male', label: '수컷', symbol: '♂', color: '#3b82f6' },
  { id: 'castrated', label: '거세', symbol: '⚲', color: '#8b5cf6' },
];

export const ENTITY_STATUSES = [
  { id: 'healthy', label: '건강/양호', colorClass: 'badge-healthy', icon: '💚', allowedGenders: ['female', 'male', 'castrated'] },
  { id: 'in_heat', label: '발정 관찰', colorClass: 'badge-in_heat', icon: '🔥', allowedGenders: ['female'] },
  { id: 'inseminated', label: '수정 완료', colorClass: 'badge-inseminated', icon: '🧬', allowedGenders: ['female'] },
  { id: 'pregnant', label: '임신/수태', colorClass: 'badge-pregnant', icon: '💖', allowedGenders: ['female'] },
  { id: 'nursing', label: '포유/육아', colorClass: 'badge-nursing', icon: '🐄', allowedGenders: ['female'] },
  { id: 'treatment', label: '치료/투약중', colorClass: 'badge-treatment', icon: '💊', allowedGenders: ['female', 'male', 'castrated'] },
  { id: 'scheduled_ship', label: '출하 예정', colorClass: 'badge-scheduled_ship', icon: '🚛', allowedGenders: ['female', 'male', 'castrated'] },
  { id: 'shipped', label: '출하 완료', colorClass: 'badge-shipped', icon: '🏷️', allowedGenders: ['female', 'male', 'castrated'] },
  { id: 'deceased', label: '폐사/도태', colorClass: 'badge-deceased', icon: '🪦', allowedGenders: ['female', 'male', 'castrated'] },
];

// 사육 종료(사육 이력) 상태인지 검사 (출하 완료 또는 폐사/도태)
export function isHistoricalStatus(status) {
  return status === 'shipped' || status === 'deceased';
}

// 사육단계(송아지, 육성우, 번식우 등) 및 성별에 따른 허용 상태 목록 필터링
// - 송아지: 암/수 불문 번식 4종(발정, 수정, 임신, 포유) 제외한 4종만 가능
// - 수컷/거세우: 사육단계 불문 번식 4종 제외한 4종만 가능
// - 육성우 - 암컷: 초발정 및 첫 수정 가능, 임신/포유 불가 (6종 가능)
// - 번식우(성우 암소): 전체 8종 가능
export function getAvailableStatuses(breedOrStage, gender) {
  const isCalf = (breedOrStage || '').includes('송아지');
  const isGrowing = (breedOrStage || '').includes('육성');
  const isMaleOrCastrated = gender === 'male' || gender === 'castrated';

  return ENTITY_STATUSES.filter(st => {
    // 1. 수컷 또는 거세우는 번식 관련 4종 전체 불가
    if (isMaleOrCastrated && ['in_heat', 'inseminated', 'pregnant', 'nursing'].includes(st.id)) {
      return false;
    }
    // 2. 송아지는 암/수 불문 번식 관련 4종 전체 불가
    if (isCalf && ['in_heat', 'inseminated', 'pregnant', 'nursing'].includes(st.id)) {
      return false;
    }
    // 3. 육성우(암컷)는 초발정/첫 수정은 가능하나, 미경산우이므로 임신/포유 불가
    if (isGrowing && ['pregnant', 'nursing'].includes(st.id)) {
      return false;
    }
    return true;
  });
}

// 특정 상태가 해당 사육단계 및 성별에 유효한지 검사
export function isStatusAllowed(statusId, breedOrStage, gender) {
  if (!statusId) return true;
  const available = getAvailableStatuses(breedOrStage, gender);
  return available.some(st => st.id === statusId);
}

// 성별에 따른 허용 상태 목록 필터링 도우미 (하위 호환)
export function getEntityStatusesByGender(gender, breedOrStage = '') {
  return getAvailableStatuses(breedOrStage, gender);
}

// 특정 상태가 해당 성별에 유효한지 검사 (하위 호환)
export function isStatusAllowedForGender(statusId, gender, breedOrStage = '') {
  return isStatusAllowed(statusId, breedOrStage, gender);
}

export const DEFAULT_CARE_CATEGORIES = [
  { id: 'vaccine', label: '백신접종', icon: '💉', badgeClass: 'badge-cat-vaccine' },
  { id: 'treatment', label: '진료치료', icon: '💊', badgeClass: 'badge-cat-treatment' },
  { id: 'breeding', label: '인공수정', icon: '🧬', badgeClass: 'badge-cat-breeding' },
  { id: 'heat_check', label: '발정관찰', icon: '🔥', badgeClass: 'badge-cat-heat' },
  { id: 'pregnancy_check', label: '임신감정', icon: '💖', badgeClass: 'badge-cat-pregnancy' },
  { id: 'calving', label: '분만관리', icon: '🐮', badgeClass: 'badge-cat-calving' },
  { id: 'shipment', label: '출하매매', icon: '🚛', badgeClass: 'badge-cat-shipment' },
  { id: 'weight', label: '체중측정', icon: '⚖️', badgeClass: 'badge-cat-weight' },
  { id: 'routine', label: '방역소독', icon: '🛡️', badgeClass: 'badge-cat-routine' },
  { id: 'facility', label: '시설환경', icon: '🛠️', badgeClass: 'badge-cat-facility' },
  { id: 'feed', label: '사료자재', icon: '🌾', badgeClass: 'badge-cat-feed' },
  { id: 'other', label: '퇴비기타', icon: '📋', badgeClass: 'badge-cat-other' },
];

// 농장 공통 4대 핵심 분류 ID 세트 (방역소독, 시설환경, 사료자재, 퇴비기타)
export const FARM_COMMON_CATEGORY_IDS = new Set(['routine', 'facility', 'feed', 'other']);

// 개체 개별 전용 8대 분류 ID 세트 (백신, 치료, 인공수정, 발정, 임신, 분만, 출하, 체중)
export const ENTITY_ONLY_CATEGORY_IDS = new Set([
  'vaccine',
  'treatment',
  'breeding',
  'heat_check',
  'pregnancy_check',
  'calving',
  'shipment',
  'weight'
]);

export const CARE_CATEGORIES = DEFAULT_CARE_CATEGORIES;

const STORAGE_CUSTOM_CATEGORIES_KEY = 'happy_farm_custom_care_categories_v1';

export function loadCustomCareCategories() {
  try {
    const raw = localStorage.getItem(STORAGE_CUSTOM_CATEGORIES_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (e) {
    console.error('Failed to load custom care categories:', e);
  }
  return [];
}

export function saveCustomCareCategories(cats) {
  try {
    localStorage.setItem(STORAGE_CUSTOM_CATEGORIES_KEY, JSON.stringify(cats));
  } catch (e) {
    console.error('Failed to save custom care categories:', e);
  }
}

// 영문 레거시 카테고리 ID -> 표준 카테고리 ID 정규화 매핑
export const LEGACY_CATEGORY_MAP = {
  medication: 'treatment',
  insemination: 'breeding',
  estrus: 'heat_check',
  heat: 'heat_check',
  pregnancy: 'pregnancy_check',
  vaccination: 'vaccine',
  checkup: 'routine',
  sanitation: 'routine',
  disinfection: 'routine',
  facility: 'facility',
  maintenance: 'facility',
  repair: 'facility',
  birth: 'calving',
  nutrition: 'feed',
  sale: 'shipment',
  shipping: 'shipment',
  compost: 'other'
};

// 카테고리 ID 정규화 함수 (어디서든 일관되게 레거시 ID를 표준 ID로 승격)
export function normalizeCategoryId(catId) {
  if (!catId) return '';
  return LEGACY_CATEGORY_MAP[catId] || catId;
}

// 미등록 영문 카테고리에 대한 한글 라벨 폴백 (4글자 표준)
export const FALLBACK_CATEGORY_LABELS = {
  medication: '진료치료',
  insemination: '인공수정',
  estrus: '발정관찰',
  heat_check: '발정관찰',
  pregnancy_check: '임신감정',
  vaccination: '백신접종',
  checkup: '방역소독',
  breeding: '인공수정',
  treatment: '진료치료',
  vaccine: '백신접종',
  calving: '분만관리',
  shipment: '출하매매',
  sale: '출하매매',
  shipping: '출하매매',
  weight: '체중측정',
  feed: '사료자재',
  routine: '방역소독',
  facility: '시설환경',
  other: '퇴비기타'
};

export function getCategoryById(catId, customCategories = []) {
  const all = [...DEFAULT_CARE_CATEGORIES, ...customCategories];
  // 영문 레거시/저장소 ID 정규화 (medication -> treatment, insemination -> breeding 등)
  const normalizedId = normalizeCategoryId(catId);
  const found = all.find(c => c.id === normalizedId || c.id === catId);
  if (found) return found;

  const fallbackLabel = FALLBACK_CATEGORY_LABELS[catId] || catId || '기타 관리';
  return {
    id: normalizedId,
    label: fallbackLabel,
    icon: '📋',
    badgeClass: 'badge-cat-custom'
  };
}

// 생년월일 기준 개월령 및 일령 계산
export function calculateAge(birthDate) {
  if (!birthDate) return { months: 0, days: 0, text: '정보 없음' };
  const birth = new Date(birthDate);
  if (isNaN(birth.getTime())) return { months: 0, days: 0, text: '날짜 오류' };

  const now = new Date();
  const diffTime = Math.abs(now - birth);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  let months = (now.getFullYear() - birth.getFullYear()) * 12;
  months -= birth.getMonth();
  months += now.getMonth();
  if (now.getDate() < birth.getDate()) {
    months--;
  }
  const safeMonths = Math.max(0, months);

  return {
    months: safeMonths,
    days: diffDays,
    text: `${safeMonths}개월령 (${diffDays}일)`
  };
}

// 오늘 날짜 문자열 YYYY-MM-DD
export function getTodayDateString() {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// 현재 시간 문자열 HH:mm
export function getCurrentTimeString() {
  const d = new Date();
  const hours = String(d.getHours()).padStart(2, '0');
  const mins = String(d.getMinutes()).padStart(2, '0');
  return `${hours}:${mins}`;
}

// 한글 초성 검색 헬퍼 (프로드릴앱 차용)
export function getKoreanChoseong(str) {
  if (!str) return '';
  const normalized = str.normalize('NFC');
  const CHOSEONG = ['ㄱ', 'ㄲ', 'ㄴ', 'ㄷ', 'ㄸ', 'ㄹ', 'ㅁ', 'ㅂ', 'ㅃ', 'ㅅ', 'ㅆ', 'ㅇ', 'ㅈ', 'ㅉ', 'ㅊ', 'ㅋ', 'ㅌ', 'ㅍ', 'ㅎ'];
  let result = '';
  for (let i = 0; i < normalized.length; i++) {
    const code = normalized.charCodeAt(i) - 44032;
    if (code >= 0 && code <= 11172) {
      const choseongIndex = Math.floor(code / 588);
      result += CHOSEONG[choseongIndex];
    } else {
      result += normalized[i];
    }
  }
  return result.toLowerCase();
}

// ==========================================================================
// 빠른 제목 추천 (Quick Titles) 기본 목록 및 사용자 맞춤 스토리지
// ==========================================================================

export const DEFAULT_QUICK_TITLES = {
  vaccine: ['구제역 일제 정기 백신', '소 호흡기 5종 혼합 백신', '아까바네 백신 접종', '기생충 구충제 투약'],
  treatment: ['호흡기 치료 경과 확인', '소화기/설사 투약 2차', '외과 처치 및 드레싱'],
  breeding: ['인공수정 시술 (수정사 방문)', '종모우 정액 준비 및 확인', '배란 유도제 투약'],
  heat_check: ['수정 후 21일차 발정관찰', '초발정 징후 관찰', '승가 행위 및 점액 확인'],
  pregnancy_check: ['수정 후 60일차 초음파 임신감정', '직장검사 임신 확인'],
  calving: ['분만 대기 및 분만사 이동', '초유 급여 준비 및 분만 관찰'],
  shipment: ['농협 안심한우 공판장 출하 상차', '우시장 송아지 경매 출하', '생체중 계근 및 상차', '출하차량 운송 확인'],
  weight: ['월령별 체중 계근', '비육 단계별 발육 측정', '출하 전 최종 체중 계근'],
  routine: ['축사 내외부 안개분무 일제 소독', '축사 진입로 생석회 도포', '차량 소독조 약품 교체', '파리·모기 방제제 살포', '쥐 구서제(쥐약) 설치'],
  facility: ['우사 바닥 깔짚(톱밥) 교체', '우사 바닥 로터리 뒤집기', '자동 급수조(워터컵) 일제 청소', '환풍기 모터 청소 및 점검', '급수 배관 동파 방지 점검', '축사 시설 및 펜스 보수'],
  feed: ['조사료(볏짚/사일리지) 입고 및 적재', '배합사료 정기 벌크 입고', '사료빈 내부 결로 점검 및 청소', '미네랄/비타민 스톤 일괄 교체'],
  other: ['퇴비사 분뇨 교반(뒤집기) 작업', '가축분뇨 부숙도 검사 의뢰', '부숙 퇴비 농경지 반출', '지하수 음용수 수질검사 의뢰', '농장 가축재해보험 갱신']
};

const STORAGE_CUSTOM_QUICK_TITLES_KEY = 'happy_farm_custom_quick_titles_v1';

export function loadQuickTitlesMap() {
  try {
    const raw = localStorage.getItem(STORAGE_CUSTOM_QUICK_TITLES_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === 'object') {
        const merged = { ...DEFAULT_QUICK_TITLES };
        for (const [k, v] of Object.entries(parsed)) {
          if (Array.isArray(v)) {
            merged[k] = v;
          }
        }
        return merged;
      }
    }
  } catch (e) {
    console.error('Failed to load custom quick titles:', e);
  }
  return { ...DEFAULT_QUICK_TITLES };
}

export function saveQuickTitlesMap(map) {
  try {
    localStorage.setItem(STORAGE_CUSTOM_QUICK_TITLES_KEY, JSON.stringify(map));
  } catch (e) {
    console.error('Failed to save custom quick titles:', e);
  }
}
