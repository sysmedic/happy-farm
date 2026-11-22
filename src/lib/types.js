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
  { id: 'feed', label: '사료영양', icon: '🌾', badgeClass: 'badge-cat-feed' },
  { id: 'routine', label: '방역점검', icon: '🛡️', badgeClass: 'badge-cat-routine' },
  { id: 'other', label: '기타작업', icon: '📋', badgeClass: 'badge-cat-other' },
];

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
  birth: 'calving',
  nutrition: 'feed',
  sale: 'shipment',
  shipping: 'shipment'
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
  checkup: '방역점검',
  breeding: '인공수정',
  treatment: '진료치료',
  vaccine: '백신접종',
  calving: '분만관리',
  shipment: '출하매매',
  sale: '출하매매',
  shipping: '출하매매',
  weight: '체중측정',
  feed: '사료영양',
  routine: '방역점검',
  other: '기타작업'
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
