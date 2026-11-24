import React, { useState, useEffect, useMemo } from 'react';
import { 
  X, 
  Calendar, 
  Clock, 
  Sparkles, 
  Check, 
  AlertCircle,
  Trash2,
  Plus,
  RotateCcw,
  BookmarkPlus
} from 'lucide-react';
import { 
  getTodayDateString, 
  normalizeCategoryId,
  loadQuickTitlesMap,
  saveQuickTitlesMap,
  DEFAULT_QUICK_TITLES
} from '../../lib/types.js';

// 일정 전용 카테고리 프리셋 (types.js 4글자 표준 카테고리와 100% 동기화)
export const SCHEDULE_CATEGORIES = [
  { id: 'vaccine', label: '백신접종', icon: '💉', color: '#0ea5e9' },
  { id: 'treatment', label: '진료치료', icon: '💊', color: '#ef4444' },
  { id: 'breeding', label: '인공수정', icon: '🧬', color: '#8b5cf6' },
  { id: 'heat_check', label: '발정관찰', icon: '🔥', color: '#f97316' },
  { id: 'pregnancy_check', label: '임신감정', icon: '💖', color: '#ec4899' },
  { id: 'calving', label: '분만관리', icon: '🐮', color: '#10b981' },
  { id: 'shipment', label: '출하매매', icon: '🚛', color: '#0ea5e9' },
  { id: 'weight', label: '체중측정', icon: '⚖️', color: '#64748b' },
  { id: 'routine', label: '방역소독', icon: '🛡️', color: '#10b981' },
  { id: 'facility', label: '시설환경', icon: '🛠️', color: '#f59e0b' },
  { id: 'feed', label: '사료자재', icon: '🌾', color: '#d97706' },
  { id: 'other', label: '퇴비기타', icon: '📋', color: '#64748b' },
];

// 번식 전용 카테고리 (암소 전용: 농장 공통 및 거세/수소에서 제외)
export const BREEDING_CATEGORY_IDS = new Set(['breeding', 'heat_check', 'pregnancy_check', 'calving']);

// 카테고리별 빠른 제목 추천 목록
const QUICK_TITLES = {
  vaccine: ['구제역 일제 정기 백신', '소 호흡기 5종 혼합 백신', '아까바네 백신 접종', '기생충 구충제 투약'],
  treatment: ['호흡기 치료 경과 확인', '소화기/설사 투약 2차', '외과 처치 및 드레싱'],
  breeding: ['인공수정 시술 (수정사 방문)', '종모우 정액 준비 및 확인', '배란 유도제 투약'],
  heat_check: ['수정 후 21일차 발정관찰', '초발정 징후 관찰', '승가 행위 및 점액 확인'],
  pregnancy_check: ['수정 후 60일차 초음파 임신감정', '직장검사 임신 확인'],
  calving: ['분만 대기 및 분만사 이동', '초유 급여 준비 및 분만 관찰'],
  shipment: ['농협 안심한우 공판장 출하 상차', '우시장 송아지 경매 출하', '생체중 계근 및 상차', '출하차량 운송 확인'],
  weight: ['월령별 체중 계근', '비육 단계별 발육 측정', '출하 전 최종 체중 계근'],
  // ── 농장 공통 4대 표준 분류 추천 제목 ──
  routine: ['축사 내외부 안개분무 일제 소독', '축사 진입로 생석회 도포', '차량 소독조 약품 교체', '파리·모기 방제제 살포', '쥐 구서제(쥐약) 설치'],
  facility: ['우사 바닥 깔짚(톱밥) 교체', '우사 바닥 로터리 뒤집기', '자동 급수조(워터컵) 일제 청소', '환풍기 모터 청소 및 점검', '급수 배관 동파 방지 점검', '축사 시설 및 펜스 보수'],
  feed: ['조사료(볏짚/사일리지) 입고 및 적재', '배합사료 정기 벌크 입고', '사료빈 내부 결로 점검 및 청소', '미네랄/비타민 스톤 일괄 교체'],
  other: ['퇴비사 분뇨 교반(뒤집기) 작업', '가축분뇨 부숙도 검사 의뢰', '부숙 퇴비 농경지 반출', '지하수 음용수 수질검사 의뢰', '농장 가축재해보험 갱신'],
};

export default function ScheduleFormModal({
  initialDate,
  scheduleToEdit,
  initialData = null,
  entities = [],
  careCategories,
  onAddCustomCategory,
  onDeleteCustomCategory,
  onClose,
  onSave,
  onDelete
}) {
  const isEditing = Boolean(scheduleToEdit);
  const allCategories = careCategories || SCHEDULE_CATEGORIES;

  const [date, setDate] = useState(scheduleToEdit?.date || initialData?.date || initialDate || getTodayDateString());
  const [time, setTime] = useState(scheduleToEdit?.time || initialData?.time || '');
  const [targetType, setTargetType] = useState(() => {
    if (scheduleToEdit) {
      return scheduleToEdit.entityId ? 'entity' : 'farm';
    }
    if (initialData?.targetType) {
      return initialData.targetType;
    }
    if (initialData?.entityId) {
      return 'entity';
    }
    // 새 일정 추가 기본값: 첫 번째 탭인 '개체 개별'
    return 'entity';
  });
  const [selectedEntityId, setSelectedEntityId] = useState(
    scheduleToEdit?.entityId || initialData?.entityId || ''
  );
  const [category, setCategory] = useState(() => {
    if (scheduleToEdit?.category) return normalizeCategoryId(scheduleToEdit.category);
    if (initialData?.category) return normalizeCategoryId(initialData.category);
    return targetType === 'farm' ? 'routine' : 'vaccine';
  });
  const [title, setTitle] = useState(scheduleToEdit?.title || initialData?.title || '');
  const [memo, setMemo] = useState(scheduleToEdit?.memo || initialData?.memo || '');
  const [errorMsg, setErrorMsg] = useState('');

  // 선택된 대상 개체 정보 (개체 개별 일정 시)
  const selectedEntity = useMemo(() => {
    if (targetType !== 'entity') return null;
    return (entities || []).find(e => e.id === selectedEntityId) || initialData?.preselectedEntity || null;
  }, [entities, targetType, selectedEntityId, initialData]);

  // 개체 카드 등에서 특정 개체가 사전 지정되어 열린 경우 판별 (상단 대상 탭/선택창 대신 단정형 1줄 텍스트로 노출)
  const isPreselectedEntity = Boolean(
    !scheduleToEdit && (initialData?.preselectedEntity || (initialData?.entityId && targetType === 'entity'))
  );

  // 지능형 분류 필터링 (개체 개별 vs 농장 공통 완전 분리):
  // 1) 농장 공통('farm'): 축약된 4대 표준 분류 (방역소독, 시설환경, 사료자재, 퇴비기타) + 커스텀 분류만 깔끔하게 노출!
  // 2) 개체 개별('entity'): 농장 공통 전용 4종(방역소독, 시설환경, 사료자재, 퇴비기타) 완전 제외!
  //    - 수컷/거세우: 번식 4종(인공수정, 발정관찰, 임신감정, 분만관리) 추가 제외!
  const categoriesToDisplay = useMemo(() => {
    if (targetType === 'farm') {
      return allCategories.filter(cat => {
        const norm = normalizeCategoryId(cat.id);
        return norm === 'routine' || norm === 'facility' || norm === 'feed' || norm === 'other' || cat.isCustom;
      });
    }

    // 개체 개별: 농장 공통 4종 제외 + 수컷/거세우 번식 4종 제외
    const isMaleOrCastrated = selectedEntity && (selectedEntity.gender === 'castrated' || selectedEntity.gender === 'male');
    return allCategories.filter(cat => {
      const norm = normalizeCategoryId(cat.id);
      // 농장 공통 전용 4종은 개체 개별에서 완전 제외
      if (['routine', 'facility', 'feed', 'other'].includes(norm)) return false;
      // 거세우/수컷의 번식 4종 제외
      if (isMaleOrCastrated && BREEDING_CATEGORY_IDS.has(norm)) return false;
      return true;
    });
  }, [allCategories, targetType, selectedEntity]);

  // 대상 변경(농장공통 <-> 개체개별 전환 또는 거세우 선택)으로 인해 현재 선택 카테고리가 제외된 경우 안전하게 자동 전환
  useEffect(() => {
    const normCurrentCat = normalizeCategoryId(category);
    if (targetType === 'farm') {
      // 농장 공통에서 허용되지 않는 개체 전용 분류가 선택되어 있다면 기본인 'routine'(방역소독)으로 전환
      if (!['routine', 'facility', 'feed', 'other'].includes(normCurrentCat) && !allCategories.find(c => c.id === normCurrentCat && c.isCustom)) {
        setCategory('routine');
        setTitle('');
      }
    } else {
      // 개체 개별일 때: 농장 공통 전용 분류이거나 수컷/거세우 번식 카테고리인 경우 'vaccine'(백신접종)으로 전환
      const isFarmCommonCat = ['routine', 'facility', 'feed', 'other'].includes(normCurrentCat);
      const isMaleOrCastrated = selectedEntity && (selectedEntity.gender === 'castrated' || selectedEntity.gender === 'male');
      const isDisallowedBreeding = isMaleOrCastrated && BREEDING_CATEGORY_IDS.has(normCurrentCat);

      if (isFarmCommonCat || isDisallowedBreeding) {
        setCategory('vaccine');
        setTitle('');
      }
    }
  }, [targetType, selectedEntity, category, allCategories]);

  // 빠른 추천 제목 목록 (localStorage 연동)
  const [quickTitlesMap, setQuickTitlesMap] = useState(() => loadQuickTitlesMap());
  const [isAddingQuickTitle, setIsAddingQuickTitle] = useState(false);
  const [newQuickTitleInput, setNewQuickTitleInput] = useState('');

  const currentCategoryKey = normalizeCategoryId(category);
  const currentQuickTitles = quickTitlesMap[currentCategoryKey] || [];

  // 빠른 추천 제목 추가
  const handleAddQuickTitle = (titleToAdd) => {
    const trimmed = (titleToAdd || newQuickTitleInput).trim();
    if (!trimmed || !currentCategoryKey) return;

    setQuickTitlesMap(prev => {
      const existing = prev[currentCategoryKey] || [];
      if (existing.includes(trimmed)) return prev;
      const updated = { ...prev, [currentCategoryKey]: [...existing, trimmed] };
      saveQuickTitlesMap(updated);
      return updated;
    });

    setNewQuickTitleInput('');
    setIsAddingQuickTitle(false);
  };

  // 빠른 추천 제목 삭제
  const handleRemoveQuickTitle = (titleToRemove, e) => {
    if (e) e.stopPropagation();
    if (!currentCategoryKey) return;

    setQuickTitlesMap(prev => {
      const existing = prev[currentCategoryKey] || [];
      const updated = { ...prev, [currentCategoryKey]: existing.filter(t => t !== titleToRemove) };
      saveQuickTitlesMap(updated);
      return updated;
    });
  };

  // 빠른 추천 기본값 복원
  const handleResetQuickTitles = () => {
    if (window.confirm('이 분류의 빠른 제목 추천을 기본 상태로 복원하시겠습니까?')) {
      const defaultForCat = DEFAULT_QUICK_TITLES[currentCategoryKey] || [];
      setQuickTitlesMap(prev => {
        const updated = { ...prev, [currentCategoryKey]: [...defaultForCat] };
        saveQuickTitlesMap(updated);
        return updated;
      });
    }
  };

  // 새 커스텀 분류 추가 상태
  const [isAddingCategory, setIsAddingCategory] = useState(false);
  const [newCatName, setNewCatName] = useState('');

  // 새 커스텀 분류 생성
  const handleCreateCategory = () => {
    const trimmed = newCatName.trim();
    if (!trimmed) {
      alert('새 분류명을 입력해주세요.');
      return;
    }
    if (categoriesToDisplay.some(c => c.label.toLowerCase() === trimmed.toLowerCase())) {
      alert('이미 동일한 이름의 분류가 존재합니다.');
      return;
    }
    const newCat = {
      id: `custom_${Date.now()}`,
      label: trimmed,
      icon: '',
      badgeClass: 'badge-cat-custom',
      isCustom: true
    };
    if (onAddCustomCategory) {
      onAddCustomCategory(newCat);
    }
    setCategory(newCat.id);
    if (!title) {
      setTitle(trimmed);
    }
    setIsAddingCategory(false);
    setNewCatName('');
  };

  // 커스텀 분류 삭제 처리
  const handleDeleteCategoryClick = (cat) => {
    const isCurrentlySelected = category === cat.id;
    let confirmMsg = `'${cat.label}' 분류를 삭제하시겠습니까?`;
    if (isCurrentlySelected) {
      confirmMsg = `⚠️ 현재 등록 폼에 '${cat.label}' 분류가 선택되어 있습니다.\n삭제 시 기본 분류('백신접종')로 자동 변경됩니다.\n\n정말 '${cat.label}' 분류를 삭제하시겠습니까?`;
    }
    if (window.confirm(confirmMsg)) {
      if (onDeleteCustomCategory) {
        onDeleteCustomCategory(cat.id);
      }
      if (isCurrentlySelected) {
        setCategory('vaccine');
      }
    }
  };

  const handleDelete = () => {
    if (!scheduleToEdit || !onDelete) return;
    if (window.confirm('정말 이 일정을 삭제하시겠습니까?\n삭제된 일정은 복구할 수 없습니다.')) {
      onDelete(scheduleToEdit.id, true);
      onClose();
    }
  };

  // 사육 중인 살아있는 개체 목록 필터
  const activeEntities = useMemo(() => {
    return entities.filter(e => e.status !== 'shipped' && e.status !== 'deceased');
  }, [entities]);

  useEffect(() => {
    if (scheduleToEdit) {
      setDate(scheduleToEdit.date);
      setTime(scheduleToEdit.time || '');
      setTargetType(scheduleToEdit.entityId ? 'entity' : 'farm');
      setSelectedEntityId(scheduleToEdit.entityId || '');
      setCategory(scheduleToEdit.category || 'routine');
      setTitle(scheduleToEdit.title || '');
      setMemo(scheduleToEdit.memo || '');
    } else {
      setDate(initialDate || getTodayDateString());
      if (activeEntities.length > 0 && !selectedEntityId) {
        setSelectedEntityId(activeEntities[0].id);
      }
    }
  }, [scheduleToEdit, initialDate, activeEntities, selectedEntityId]);

  // 카테고리 선택 핸들러
  const handleCategoryChange = (catId) => {
    setCategory(catId);
    // 제목이 비어있거나 기존 카테고리 추천 제목 중 하나였던 경우 첫 번째 추천 제목으로 변경
    const quickList = QUICK_TITLES[catId];
    if (quickList && quickList.length > 0) {
      if (!title || Object.values(QUICK_TITLES).flat().includes(title)) {
        setTitle(quickList[0]);
      }
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!title.trim()) {
      setErrorMsg('일정 제목을 입력해 주세요.');
      return;
    }
    if (!date) {
      setErrorMsg('예정 일자를 선택해 주세요.');
      return;
    }

    let entityInfo = {
      entityId: null,
      tagNumber: null,
      entityName: '농장 공통'
    };

    if (targetType === 'entity') {
      const ent = entities.find(e => e.id === selectedEntityId);
      if (ent) {
        entityInfo = {
          entityId: ent.id,
          tagNumber: ent.tagNumber,
          entityName: ent.name || ent.tagNumber
        };
      }
    }

    const payload = {
      id: scheduleToEdit?.id || `SCHED-${Date.now()}`,
      date,
      time: time.trim(),
      ...entityInfo,
      category,
      title: title.trim(),
      memo: memo.trim(),
      originReminderLogId: initialData?.originReminderLogId || scheduleToEdit?.originReminderLogId || null,
      completed: scheduleToEdit ? scheduleToEdit.completed : false,
      completedAt: scheduleToEdit ? scheduleToEdit.completedAt : null,
      createdAt: scheduleToEdit?.createdAt || new Date().toISOString()
    };

    onSave(payload);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div 
        className="modal-content modal-content-md schedule-modal"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: '540px' }}
      >
        <div className="modal-header">
          <div className="modal-header-title">
            <span style={{ fontWeight: 800, fontSize: '1.25rem' }}>
              {isEditing ? '일정 수정' : '새 일정 추가'}
            </span>
          </div>
          <button 
            type="button" 
            className="modal-close-btn" 
            onClick={onClose}
            title="창 닫기"
            aria-label="닫기"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body" style={{ maxHeight: '72vh', overflowY: 'auto' }}>
            {errorMsg && (
              <div style={{
                background: 'rgba(239, 68, 68, 0.1)',
                border: '1px solid var(--color-danger)',
                color: 'var(--color-danger)',
                padding: '0.65rem 0.85rem',
                borderRadius: 'var(--radius-md)',
                marginBottom: '1rem',
                fontSize: '0.85rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem'
              }}>
                <AlertCircle size={16} />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* 1. 예정 일자 및 시간 */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '1rem' }}>
              <div className="form-group">
                <label className="form-label" style={{ fontWeight: 700 }}>
                  예정 일자 <span style={{ color: 'var(--color-danger)' }}>*</span>
                </label>
                <input
                  type="date"
                  className="form-input"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label" style={{ fontWeight: 700 }}>
                  예정 시간 (선택)
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    type="time"
                    className="form-input"
                    value={time}
                    onChange={(e) => setTime(e.target.value)}
                    placeholder="선택 사항"
                  />
                </div>
              </div>
            </div>

            {/* 2. 대상 구분 (사전 지정된 개체가 있을 경우 단정형 1줄 텍스트로 노출, 일반 진입 시 2분할 탭+선택창) */}
            {isPreselectedEntity && selectedEntity ? (
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '0.65rem', 
                marginBottom: '1.15rem', 
                minWidth: 0, 
                overflow: 'hidden' 
              }}>
                <span style={{ 
                  fontSize: '1.18rem', 
                  fontWeight: 800, 
                  color: 'var(--text-main)', 
                  fontFamily: 'var(--font-family)',
                  fontVariantNumeric: 'tabular-nums',
                  fontFeatureSettings: '"tnum" 1',
                  letterSpacing: '-0.025em',
                  whiteSpace: 'nowrap',
                  flexShrink: 0 
                }}>
                  {selectedEntity.tagNumber}
                </span>
                {selectedEntity.name && (
                  <span style={{ 
                    fontSize: '1.05rem', 
                    fontWeight: 700, 
                    color: 'var(--text-main)', 
                    overflow: 'hidden', 
                    textOverflow: 'ellipsis', 
                    whiteSpace: 'nowrap' 
                  }}>
                    {selectedEntity.name}
                  </span>
                )}
              </div>
            ) : (
              <div className="form-group" style={{ marginBottom: '1.15rem' }}>
                <label className="form-label" style={{ fontWeight: 700, marginBottom: '0.45rem' }}>
                  일정 대상
                </label>
                <div style={{ 
                  display: 'grid', 
                  gridTemplateColumns: '1fr 1fr', 
                  gap: '0.35rem', 
                  background: 'var(--bg-card-subtle)',
                  padding: '0.25rem',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border-color)',
                  marginBottom: '0.6rem' 
                }}>
                  <button
                    type="button"
                    onClick={() => setTargetType('entity')}
                    style={{ 
                      padding: '0.55rem 0.5rem', 
                      fontSize: '0.88rem',
                      fontWeight: targetType === 'entity' ? 800 : 600,
                      borderRadius: 'var(--radius-sm)',
                      border: targetType === 'entity' ? '1px solid #0284c7' : '1px solid transparent',
                      background: targetType === 'entity' ? '#0284c7' : 'transparent',
                      color: targetType === 'entity' ? '#ffffff' : 'var(--text-muted)',
                      boxShadow: targetType === 'entity' ? '0 1px 3px rgba(2, 132, 199, 0.3)' : 'none',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    개체 개별
                  </button>
                  <button
                    type="button"
                    onClick={() => setTargetType('farm')}
                    style={{ 
                      padding: '0.55rem 0.5rem', 
                      fontSize: '0.88rem',
                      fontWeight: targetType === 'farm' ? 800 : 600,
                      borderRadius: 'var(--radius-sm)',
                      border: targetType === 'farm' ? '1px solid #0284c7' : '1px solid transparent',
                      background: targetType === 'farm' ? '#0284c7' : 'transparent',
                      color: targetType === 'farm' ? '#ffffff' : 'var(--text-muted)',
                      boxShadow: targetType === 'farm' ? '0 1px 3px rgba(2, 132, 199, 0.3)' : 'none',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    농장 공통
                  </button>
                </div>

                {/* 특정 개체 지정 시 개체 선택 드롭다운 */}
                {targetType === 'entity' && (
                  <div style={{ marginTop: '0.5rem' }}>
                    <select
                      className="form-select"
                      value={selectedEntityId}
                      onChange={(e) => setSelectedEntityId(e.target.value)}
                    >
                      {activeEntities.map(ent => (
                        <option key={ent.id} value={ent.id}>
                          {ent.tagNumber}{ent.name ? ` ${ent.name}` : ''}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
            )}

            {/* 3. 일정 분류 선택 (관리 내역 추가와 동일한 알약 캡슐 디자인 및 커스텀 분류 실시간 연동) */}
            <div className="form-group" style={{ marginBottom: '1.15rem' }}>
              <label className="form-label" style={{ fontWeight: 700, marginBottom: '0.45rem' }}>
                일정 분류 선택
              </label>
              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(3, 1fr)', 
                gap: '0.45rem',
                marginTop: '0.25rem'
              }}>
                {categoriesToDisplay.map(cat => {
                  const isSelected = category === cat.id;
                  return (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => handleCategoryChange(cat.id)}
                      style={{
                        position: 'relative',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '0.3rem',
                        padding: '0.45rem 0.35rem',
                        borderRadius: '9999px',
                        border: isSelected ? '1.5px solid #0284c7' : '1px solid var(--border-color)',
                        background: isSelected ? 'rgba(2, 132, 199, 0.12)' : 'var(--bg-card)',
                        color: isSelected ? '#0284c7' : 'var(--text-main)',
                        fontWeight: isSelected ? 800 : 600,
                        fontSize: '0.82rem',
                        cursor: 'pointer',
                        boxShadow: isSelected ? '0 1px 4px rgba(2, 132, 199, 0.25)' : 'none',
                        transition: 'all 0.15s ease',
                        whiteSpace: 'nowrap',
                        minWidth: 0,
                        width: '100%'
                      }}
                    >
                      {cat.isCustom && (
                        <span
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteCategoryClick(cat);
                          }}
                          title="이 커스텀 분류 삭제"
                          style={{
                            position: 'absolute',
                            top: '2px',
                            right: '4px',
                            width: '14px',
                            height: '14px',
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            borderRadius: '50%',
                            background: 'rgba(0, 0, 0, 0.08)',
                            color: 'var(--text-muted)'
                          }}
                        >
                          <X size={9} />
                        </span>
                      )}
                      {cat.icon && <span style={{ fontSize: '1.05rem', lineHeight: 1, flexShrink: 0 }}>{cat.icon}</span>}
                      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{cat.label}</span>
                    </button>
                  );
                })}

                {/* 새 분류 추가 버튼 (관리 내역 모달과 동일한 3열 균등 알약 칩 형태) */}
                <button
                  type="button"
                  onClick={() => setIsAddingCategory(prev => !prev)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.25rem',
                    padding: '0.45rem 0.35rem',
                    borderRadius: '9999px',
                    border: isAddingCategory ? '1.5px solid #0284c7' : '1px dashed var(--border-color)',
                    background: isAddingCategory ? 'rgba(2, 132, 199, 0.12)' : 'transparent',
                    color: '#0284c7',
                    fontWeight: isAddingCategory ? 800 : 700,
                    fontSize: '0.82rem',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                    whiteSpace: 'nowrap',
                    width: '100%'
                  }}
                  title="새 일정 분류 직접 만들기"
                >
                  <Plus size={15} color="#0284c7" />
                  <span>분류 추가</span>
                </button>
              </div>

              {/* 인라인 새 분류 생성 폼 */}
              {isAddingCategory && (
                <div style={{
                  marginTop: '0.75rem',
                  padding: '0.85rem 1rem',
                  background: 'var(--bg-card-subtle)',
                  border: '1px solid var(--border-color)',
                  borderRadius: 'var(--radius-md)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.55rem',
                  animation: 'fadeIn 0.15s ease-out'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-main)' }}>
                      새 일정 분류명 입력
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setIsAddingCategory(false);
                        setNewCatName('');
                      }}
                      style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}
                    >
                      <X size={16} />
                    </button>
                  </div>

                  <div style={{ display: 'flex', gap: '0.45rem' }}>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="예: 발굽 손질, 제각, 방역소독 등"
                      value={newCatName}
                      onChange={(e) => setNewCatName(e.target.value)}
                      style={{ height: '36px', fontSize: '0.88rem', flex: 1 }}
                      maxLength={15}
                      autoFocus
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleCreateCategory();
                        }
                      }}
                    />
                    <button
                      type="button"
                      className="btn"
                      onClick={handleCreateCategory}
                      style={{ 
                        padding: '0 0.85rem', 
                        height: '36px', 
                        fontSize: '0.82rem', 
                        fontWeight: 700,
                        background: '#0284c7',
                        borderColor: '#0284c7',
                        color: '#ffffff'
                      }}
                    >
                      추가
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* 4. 빠른 제목 추천 프리셋 뱃지 (스카이 블루 테마 + 직접 추가/삭제 지원) */}
            {currentCategoryKey && (
              <div style={{ marginBottom: '0.85rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    빠른 제목 추천 (클릭 시 자동 입력):
                  </span>
                  <button
                    type="button"
                    onClick={handleResetQuickTitles}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      fontSize: '0.72rem',
                      color: 'var(--text-muted)',
                      cursor: 'pointer',
                      padding: 0,
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.2rem'
                    }}
                    title="이 분류의 빠른 추천 목록을 기본 상태로 복원"
                  >
                    <RotateCcw size={11} />
                    <span>기본 복원</span>
                  </button>
                </div>

                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem', alignItems: 'center' }}>
                  {currentQuickTitles.map((presetTitle, idx) => {
                    const isSelected = title === presetTitle;
                    return (
                      <div
                        key={idx}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          background: isSelected ? '#0284c7' : 'var(--bg-card-subtle)',
                          color: isSelected ? '#ffffff' : 'var(--text-main)',
                          border: isSelected ? '1px solid #0284c7' : '1px solid var(--border-color)',
                          borderRadius: '9999px',
                          padding: '0.2rem 0.5rem 0.2rem 0.65rem',
                          fontSize: '0.76rem',
                          fontWeight: isSelected ? 800 : 700,
                          boxShadow: isSelected ? '0 1px 3px rgba(2, 132, 199, 0.3)' : '0 1px 2px rgba(0, 0, 0, 0.03)',
                          transition: 'all 0.15s ease',
                          gap: '0.3rem'
                        }}
                      >
                        <span 
                          onClick={() => setTitle(presetTitle)}
                          style={{ cursor: 'pointer' }}
                        >
                          {presetTitle}
                        </span>
                        <button
                          type="button"
                          onClick={(e) => handleRemoveQuickTitle(presetTitle, e)}
                          title="이 추천 항목 삭제"
                          style={{
                            background: 'transparent',
                            border: 'none',
                            color: isSelected ? '#ffffff' : 'var(--text-muted)',
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            padding: '1px',
                            borderRadius: '50%',
                            lineHeight: 1
                          }}
                        >
                          <X size={12} />
                        </button>
                      </div>
                    );
                  })}

                  {/* [+ 추천 추가] 칩 버튼 또는 인라인 인풋 */}
                  {!isAddingQuickTitle ? (
                    <button
                      type="button"
                      onClick={() => setIsAddingQuickTitle(true)}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.2rem',
                        background: 'transparent',
                        color: 'var(--text-muted)',
                        border: '1px dashed var(--border-color)',
                        borderRadius: '9999px',
                        padding: '0.2rem 0.55rem',
                        fontSize: '0.76rem',
                        fontWeight: 700,
                        cursor: 'pointer',
                        transition: 'all 0.15s ease'
                      }}
                      title="새 추천 제목 직접 추가"
                    >
                      <Plus size={13} />
                      <span>추천 추가</span>
                    </button>
                  ) : (
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', background: 'var(--bg-card)', padding: '0.15rem 0.35rem', borderRadius: '9999px', border: '1px solid #0284c7' }}>
                      <input
                        type="text"
                        value={newQuickTitleInput}
                        onChange={(e) => setNewQuickTitleInput(e.target.value)}
                        placeholder="새 추천 제목"
                        style={{ height: '22px', fontSize: '0.76rem', padding: '0 0.35rem', width: '120px', border: 'none', outline: 'none', background: 'transparent', color: 'var(--text-main)' }}
                        autoFocus
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleAddQuickTitle();
                          } else if (e.key === 'Escape') {
                            setIsAddingQuickTitle(false);
                            setNewQuickTitleInput('');
                          }
                        }}
                      />
                      <button
                        type="button"
                        onClick={() => handleAddQuickTitle()}
                        style={{ height: '20px', padding: '0 0.4rem', fontSize: '0.72rem', background: '#0284c7', color: '#fff', border: 'none', borderRadius: '9999px', cursor: 'pointer', fontWeight: 700 }}
                      >
                        추가
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setIsAddingQuickTitle(false);
                          setNewQuickTitleInput('');
                        }}
                        style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', display: 'inline-flex' }}
                      >
                        <X size={12} />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* 5. 일정 제목 직접 입력 */}
            <div className="form-group" style={{ marginBottom: '1rem' }}>
              <label className="form-label" style={{ fontWeight: 700 }}>
                일정 제목 <span style={{ color: 'var(--color-danger)' }}>*</span>
              </label>
              <input
                type="text"
                className="form-input"
                placeholder="예: 1번 축사 구제역 백신 접종"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />

              {/* 현재 입력한 제목을 이 분류의 빠른 추천으로 원클릭 등록 버튼 */}
              {title.trim() && !currentQuickTitles.includes(title.trim()) && (
                <button
                  type="button"
                  onClick={() => handleAddQuickTitle(title.trim())}
                  style={{
                    marginTop: '0.4rem',
                    background: 'rgba(2, 132, 199, 0.08)',
                    border: '1px solid rgba(2, 132, 199, 0.25)',
                    borderRadius: 'var(--radius-sm)',
                    color: '#0284c7',
                    fontSize: '0.76rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.3rem',
                    padding: '0.25rem 0.55rem',
                    transition: 'all 0.15s ease'
                  }}
                  title="현재 입력한 제목을 이 분류의 빠른 추천 목록에 추가"
                >
                  <BookmarkPlus size={13} />
                  <span>현재 제목을 빠른 추천으로 저장</span>
                </button>
              )}
            </div>

            {/* 6. 상세 메모 */}
            <div className="form-group">
              <label className="form-label" style={{ fontWeight: 700 }}>
                상세 내용 / 준비사항 (선택)
              </label>
              <textarea
                className="form-input"
                rows={3}
                placeholder="준비 약품, 작업자 주의사항, 비고 등을 자유롭게 입력하세요"
                value={memo}
                onChange={(e) => setMemo(e.target.value)}
              />
            </div>
          </div>

          {/* 모달 푸터: 좌측 삭제 격리 및 우측 저장/취소 안전 배치 */}
          <div className="modal-footer" style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: isEditing && onDelete ? 'space-between' : 'flex-end',
            width: '100%',
            gap: '0.6rem'
          }}>
            {isEditing && onDelete && (
              <button 
                type="button" 
                className="btn btn-outline"
                onClick={handleDelete}
                style={{
                  border: '1.5px solid rgba(239, 68, 68, 0.4)',
                  color: 'var(--color-danger)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                  fontWeight: 700,
                  background: 'rgba(239, 68, 68, 0.05)'
                }}
              >
                <Trash2 size={16} color="var(--color-danger)" />
                <span>일정 삭제</span>
              </button>
            )}

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <button 
                type="button" 
                className="btn btn-secondary" 
                onClick={onClose}
                style={{
                  border: '1px solid var(--text-muted)',
                  color: 'var(--text-main)',
                  fontWeight: 600
                }}
              >
                취소
              </button>
              <button 
                type="submit" 
                className="btn"
                style={isEditing ? {
                  border: '1px solid var(--text-muted)',
                  color: 'var(--text-main)',
                  fontWeight: 700,
                  background: 'var(--bg-card)'
                } : {
                  fontWeight: 800,
                  minWidth: '105px',
                  background: 'rgba(2, 132, 199, 0.14)',
                  border: '1px solid #0284c7',
                  color: '#0284c7',
                  boxShadow: 'var(--shadow-sm)',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.35rem',
                  borderRadius: 'var(--radius-sm)'
                }}
              >
                <Check size={16} color={isEditing ? 'currentColor' : '#0284c7'} strokeWidth={2.4} />
                <span>{isEditing ? '수정 사항 저장' : '일정 등록'}</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
