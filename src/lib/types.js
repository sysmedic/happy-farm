// ==========================================================================
// Happy Farm Types & Helpers (행복 농장 상수 및 도우미 함수)
// ==========================================================================

export const ENTITY_CATEGORIES = [
  { id: 'hanwoo', label: '한우', icon: '🐂', defaultBreed: '한우(번식우)' },
];

export const HANWOO_BREEDS = [
  { id: 'breeding_cow', label: '한우(번식우 - 암소)', shortLabel: '번식우' },
  { id: 'steer_beef', label: '한우(거세 비육우)', shortLabel: '거세/비육우' },
  { id: 'calf', label: '한우(송아지 - 자우)', shortLabel: '송아지' },
  { id: 'growing', label: '한우(육성우)', shortLabel: '육성우' },
  { id: 'bull', label: '한우(종모우/씨수소)', shortLabel: '씨수소' },
];

export const GENDER_OPTIONS = [
  { id: 'female', label: '암컷', symbol: '♀', color: '#ec4899' },
  { id: 'male', label: '수컷', symbol: '♂', color: '#3b82f6' },
  { id: 'castrated', label: '거세', symbol: '⚲', color: '#8b5cf6' },
];

export const ENTITY_STATUSES = [
  { id: 'healthy', label: '건강/양호', colorClass: 'badge-healthy', icon: '✨' },
  { id: 'in_heat', label: '발정 관찰', colorClass: 'badge-in_heat', icon: '🔥' },
  { id: 'inseminated', label: '수정 완료', colorClass: 'badge-inseminated', icon: '💉' },
  { id: 'pregnant', label: '임신/수태', colorClass: 'badge-pregnant', icon: '🍼' },
  { id: 'nursing', label: '포유/육아', colorClass: 'badge-nursing', icon: '🤱' },
  { id: 'treatment', label: '치료/투약중', colorClass: 'badge-treatment', icon: '💊' },
  { id: 'scheduled_ship', label: '출하 예정', colorClass: 'badge-scheduled_ship', icon: '🚛' },
  { id: 'shipped', label: '출하 완료', colorClass: 'badge-shipped', icon: '🏷️' },
];

export const CARE_CATEGORIES = [
  { id: 'vaccine', label: '예방접종(백신)', icon: '💉', badgeClass: 'badge-cat-vaccine' },
  { id: 'treatment', label: '진료/투약치료', icon: '💊', badgeClass: 'badge-cat-treatment' },
  { id: 'breeding', label: '인공수정/번식', icon: '🧬', badgeClass: 'badge-cat-breeding' },
  { id: 'calving', label: '분만/출산', icon: '🍼', badgeClass: 'badge-cat-calving' },
  { id: 'feed', label: '특수사료/영양제', icon: '🌾', badgeClass: 'badge-cat-feed' },
  { id: 'weight', label: '체중/증체측정', icon: '⚖️', badgeClass: 'badge-cat-weight' },
  { id: 'routine', label: '축사이동/정기점검', icon: '🏡', badgeClass: 'badge-cat-routine' },
];

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
  const CHOSEONG = ['ㄱ','ㄲ','ㄴ','ㄷ','ㄸ','ㄹ','ㅁ','ㅂ','ㅃ','ㅅ','ㅆ','ㅇ','ㅈ','ㅉ','ㅊ','ㅋ','ㅌ','ㅍ','ㅎ'];
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
