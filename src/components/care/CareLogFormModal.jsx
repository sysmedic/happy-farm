import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  X, 
  Save, 
  AlertCircle,
  Plus,
  Trash2,
  RotateCcw,
  BookmarkPlus,
  Calendar
} from 'lucide-react';
import { 
  CARE_CATEGORIES, 
  getTodayDateString, 
  getCurrentTimeString,
  normalizeCategoryId,
  loadQuickTitlesMap,
  saveQuickTitlesMap,
  DEFAULT_QUICK_TITLES
} from '../../lib/types.js';

// 번식 전용 카테고리 (암소 전용: 거세/수소에서 제외)
const BREEDING_CATEGORY_IDS = new Set(['breeding', 'heat_check', 'pregnancy_check', 'calving']);

export default function CareLogFormModal({
  preselectedEntity,
  logToEdit,
  initialValues = null,
  entities,
  careLogs,
  careCategories,
  farmSettings,
  onAddCustomCategory,
  onDeleteCustomCategory,
  onClose,
  onSave,
  onDelete
}) {
  const isEditing = Boolean(logToEdit);
  const defaultOwnerName = farmSettings?.ownerName || '농장주';
  const farmWorkers = Array.isArray(farmSettings?.workers) ? farmSettings.workers : [];

  // 환경설정에 등록된 농장 대표자 및 작업자들로만 예시 목록 구성 (일반명칭 수의사/수정사 제외)
  const operatorSuggestions = Array.from(new Set([defaultOwnerName, ...farmWorkers])).filter(Boolean);

  const allCategories = careCategories || CARE_CATEGORIES;
  const initialEntityId = logToEdit 
    ? (logToEdit.isFarmCommon || (!logToEdit.entityId && logToEdit.entityName === '농장 공통') ? 'FARM_COMMON' : logToEdit.entityId)
    : (initialValues?.entityId || preselectedEntity?.id || (preselectedEntity === 'FARM_COMMON' ? 'FARM_COMMON' : ''));
  const [selectedEntityId, setSelectedEntityId] = useState(initialEntityId);

  // 농장 공통 여부 판별
  const isFarmCommon = selectedEntityId === 'FARM_COMMON';

  // 현재 선택된 개체 정보 (농장 공통인 경우 가상 개체 객체 반환)
  const currentSelectedEntity = useMemo(() => {
    if (isFarmCommon) {
      return { id: 'FARM_COMMON', tagNumber: null, name: '농장 공통', isFarmCommon: true };
    }
    return (entities || []).find(e => e.id === selectedEntityId) || preselectedEntity || null;
  }, [entities, selectedEntityId, preselectedEntity, isFarmCommon]);

  // 지능형 분류 필터링 (개체 개별 vs 농장 공통 완전 분리):
  // 1) 농장 공통('FARM_COMMON'): 축약된 4대 표준 분류 (방역소독, 시설환경, 사료자재, 퇴비기타) + 커스텀 분류만 깔끔하게 노출!
  // 2) 개체 개별: 농장 공통 전용 4종(방역소독, 시설환경, 사료자재, 퇴비기타) 완전 제외!
  //    - 거세우/수컷 개체의 경우 번식 카테고리 4종 추가 제외!
  const categoriesToDisplay = useMemo(() => {
    if (isFarmCommon) {
      return allCategories.filter(cat => {
        const norm = normalizeCategoryId(cat.id);
        return norm === 'routine' || norm === 'facility' || norm === 'feed' || norm === 'other' || cat.isCustom;
      });
    }

    // 개체 개별: 농장 공통 4대 분류 완전 제외 + 수컷/거세우 번식 4종 제외
    const isMaleOrCastrated = currentSelectedEntity && (currentSelectedEntity.gender === 'castrated' || currentSelectedEntity.gender === 'male');
    return allCategories.filter(cat => {
      const norm = normalizeCategoryId(cat.id);
      // 농장 공통 전용 4종은 개체 개별에서 완전 제외
      if (['routine', 'facility', 'feed', 'other'].includes(norm)) return false;
      // 거세우/수컷 번식 4종 제외
      if (isMaleOrCastrated && BREEDING_CATEGORY_IDS.has(norm)) return false;
      return true;
    });
  }, [allCategories, currentSelectedEntity, isFarmCommon]);

  const [date, setDate] = useState(logToEdit?.date || initialValues?.date || getTodayDateString());
  const [time, setTime] = useState(logToEdit?.time || getCurrentTimeString());
  const [category, setCategory] = useState(normalizeCategoryId(logToEdit?.category || initialValues?.category) || '');
  const [title, setTitle] = useState(logToEdit?.title || initialValues?.title || '');
  const [details, setDetails] = useState(logToEdit?.details || initialValues?.details || '');
  // 신규 등록 시에는 항상 깨끗한 빈칸("")으로 시작 (지정이 아닌 예시 제시 원칙)
  const [operator, setOperator] = useState(logToEdit?.operator || '');
  const [cost, setCost] = useState(logToEdit?.cost ? String(logToEdit.cost) : '');

  // 빠른 추천 제목 목록 (localStorage 연동)
  const [quickTitlesMap, setQuickTitlesMap] = useState(() => loadQuickTitlesMap());
  const [isAddingQuickTitle, setIsAddingQuickTitle] = useState(false);
  const [newQuickTitleInput, setNewQuickTitleInput] = useState('');

  const currentCategoryKey = normalizeCategoryId(category);
  const currentQuickTitles = quickTitlesMap[currentCategoryKey] || [];

  // 대상 개체 전환(개체 <-> 농장 공통 또는 거세우 선택) 시 선택 불가능한 카테고리가 남아있으면 안전하게 자동 리셋
  useEffect(() => {
    if (!category) return;
    const norm = normalizeCategoryId(category);
    if (isFarmCommon) {
      if (!['routine', 'facility', 'feed', 'other'].includes(norm) && !allCategories.find(c => c.id === norm && c.isCustom)) {
        setCategory('routine');
      }
    } else {
      const isFarmCommonCat = ['routine', 'facility', 'feed', 'other'].includes(norm);
      const isMaleOrCastrated = currentSelectedEntity && (currentSelectedEntity.gender === 'castrated' || currentSelectedEntity.gender === 'male');
      const isDisallowedBreeding = isMaleOrCastrated && BREEDING_CATEGORY_IDS.has(norm);
      if (isFarmCommonCat || isDisallowedBreeding) {
        setCategory('');
      }
    }
  }, [isFarmCommon, currentSelectedEntity, category, allCategories]);

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
  
  // 차기 일정 등록 (일정 다이어리 자동 연동)
  const [hasNextSchedule, setHasNextSchedule] = useState(Boolean(logToEdit?.nextScheduleDate));
  const [nextScheduleDate, setNextScheduleDate] = useState(logToEdit?.nextScheduleDate || '');
  const [nextScheduleTime, setNextScheduleTime] = useState(logToEdit?.nextScheduleTime || '');
  const [nextScheduleTitle, setNextScheduleTitle] = useState(logToEdit?.nextScheduleTitle || '');

  // 체중 또는 상태 즉시 업데이트
  const [updateWeight, setUpdateWeight] = useState('');
  const [updateStatus, setUpdateStatus] = useState('');

  const [errorMsg, setErrorMsg] = useState('');

  // 차기 일정 등록 섹션 자동 스크롤 및 포커스 참조
  const nextScheduleRef = useRef(null);
  const nextScheduleDateInputRef = useRef(null);

  useEffect(() => {
    if (initialValues?.focusNextSchedule) {
      const timer = setTimeout(() => {
        if (nextScheduleRef.current) {
          nextScheduleRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
        if (nextScheduleDateInputRef.current) {
          nextScheduleDateInputRef.current.focus();
        }
      }, 250);
      return () => clearTimeout(timer);
    }
  }, [initialValues]);

  const activeEntities = useMemo(() => entities ? entities.filter(e => e.status !== 'shipped' && e.status !== 'deceased') : [], [entities]);
  const historyEntities = useMemo(() => entities ? entities.filter(e => e.status === 'shipped' || e.status === 'deceased') : [], [entities]);

  useEffect(() => {
    if (logToEdit) {
      const editEntId = logToEdit.isFarmCommon || (!logToEdit.entityId && logToEdit.entityName === '농장 공통') ? 'FARM_COMMON' : logToEdit.entityId;
      setSelectedEntityId(editEntId);
      setDate(logToEdit.date);
      setTime(logToEdit.time || getCurrentTimeString());
      setCategory(normalizeCategoryId(logToEdit.category));
      setTitle(logToEdit.title);
      setDetails(logToEdit.details || '');
      setOperator(logToEdit.operator || '');
      setCost(logToEdit.cost ? String(logToEdit.cost) : '');
      setHasNextSchedule(Boolean(logToEdit.nextScheduleDate));
      setNextScheduleDate(logToEdit.nextScheduleDate || '');
      setNextScheduleTime(logToEdit.nextScheduleTime || '');
      setNextScheduleTitle(logToEdit.nextScheduleTitle || '');
    } else {
      // 신규 등록 시 강제 지정하지 않고 항상 빈 문자열로 초기화 (예시 칩으로 선택 가능)
      setOperator('');
      if (initialValues) {
        if (initialValues.category) setCategory(normalizeCategoryId(initialValues.category));
        else setCategory('');
        if (initialValues.title) setTitle(initialValues.title);
        else setTitle('');
        if (initialValues.date) setDate(initialValues.date);
        else setDate(getTodayDateString());
        if (initialValues.time) setTime(initialValues.time);
        else setTime(getCurrentTimeString());
        if (initialValues.entityId) {
          setSelectedEntityId(initialValues.entityId);
        } else if (initialValues.isFarmCommon) {
          setSelectedEntityId('FARM_COMMON');
        }
        if (initialValues.details) setDetails(initialValues.details);
        else setDetails('');
      } else {
        setCategory('');
        setTitle('');
        setDetails('');
        setDate(getTodayDateString());
        setTime(getCurrentTimeString());
      }
      if (preselectedEntity) {
        setSelectedEntityId(preselectedEntity === 'FARM_COMMON' ? 'FARM_COMMON' : preselectedEntity.id);
      } else if (entities && entities.length > 0 && !selectedEntityId && !initialValues?.entityId && !initialValues?.isFarmCommon) {
        const firstActive = entities.find(e => e.status !== 'shipped' && e.status !== 'deceased') || entities[0];
        setSelectedEntityId(firstActive.id);
      }
    }
  }, [logToEdit, preselectedEntity, initialValues, entities, selectedEntityId, careLogs]);

  // 카테고리 선택 시 권장 작업명 자동 추천
  const handleCategorySelect = (catId) => {
    setCategory(catId);
    if (!title) {
      if (isFarmCommon) {
        if (catId === 'routine') setTitle('축사 내외부 안개분무 일제 소독');
        else if (catId === 'facility') setTitle('우사 바닥 깔짚(톱밥) 교체');
        else if (catId === 'feed') setTitle('조사료(볏짚/사일리지) 입고 및 적재');
        else if (catId === 'other') setTitle('퇴비사 분뇨 교반(뒤집기) 작업');
        else {
          const found = categoriesToDisplay.find(c => c.id === catId);
          if (found) setTitle(found.label);
        }
      } else {
        if (catId === 'vaccine') setTitle('구제역 정기 백신 접종');
        else if (catId === 'breeding') setTitle('인공수정 시술');
        else if (catId === 'treatment') setTitle('진료 및 처방 투약');
        else if (catId === 'calving') setTitle('자연 분만 출산');
        else if (catId === 'facility') setTitle('축사 보수 및 환경 정비');
        else if (catId === 'feed') setTitle('특수 영양제 및 미네랄 급여');
        else if (catId === 'weight') setTitle('정기 체중 측정');
        else if (catId === 'routine') setTitle('축사 소독 및 환경 점검');
        else {
          const found = categoriesToDisplay.find(c => c.id === catId);
          if (found) setTitle(found.label);
        }
      }
    }
  };

  // 새 커스텀 관리 분류 생성 (이모지 없이 이름만 등록)
  const handleCreateCategory = () => {
    const trimmed = newCatName.trim();
    if (!trimmed) {
      alert('새 분류명을 입력해주세요.');
      return;
    }
    if (categoriesToDisplay.some(c => c.label.toLowerCase() === trimmed.toLowerCase())) {
      alert('이미 동일한 이름의 관리 분류가 존재합니다.');
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

  // 커스텀 분류 삭제 처리 (경고 및 연계 검증)
  const handleDeleteCategoryClick = (cat) => {
    const isCurrentlySelected = category === cat.id;
    const linkedCount = careLogs ? careLogs.filter(l => normalizeCategoryId(l.category) === cat.id).length : 0;

    let confirmMsg = `'${cat.label}' 분류를 삭제하시겠습니까?`;

    if (isCurrentlySelected && linkedCount > 0) {
      confirmMsg = `⚠️ 주의:\n1. 현재 등록 폼에 '${cat.label}' 분류가 선택되어 있습니다.\n2. 이미 이 분류로 등록된 관리 기록이 ${linkedCount}건 존재합니다.\n\n정말 '${cat.label}' 분류를 삭제하시겠습니까?\n(삭제 시 현재 폼의 분류는 기본 분류('백신접종')로 변경됩니다.)`;
    } else if (isCurrentlySelected) {
      confirmMsg = `⚠️ 현재 등록 폼에 '${cat.label}' 분류가 선택되어 있습니다.\n삭제 시 기본 분류('백신접종')로 자동 변경됩니다.\n\n정말 '${cat.label}' 분류를 삭제하시겠습니까?`;
    } else if (linkedCount > 0) {
      confirmMsg = `⚠️ 주의: 이미 '${cat.label}' 분류로 등록된 관리 기록이 ${linkedCount}건 존재합니다.\n분류를 삭제해도 기존 기록은 보존되지만, 필터링 등에서 제한될 수 있습니다.\n\n정말 '${cat.label}' 분류를 삭제하시겠습니까?`;
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

  // 차기 일정 빠른 날짜 계산 프리셋
  const applyDatePreset = (days, defaultTitle) => {
    const base = new Date(date || getTodayDateString());
    base.setDate(base.getDate() + days);
    const y = base.getFullYear();
    const m = String(base.getMonth() + 1).padStart(2, '0');
    const d = String(base.getDate()).padStart(2, '0');
    setHasNextSchedule(true);
    setNextScheduleDate(`${y}-${m}-${d}`);
    if (defaultTitle) {
      setNextScheduleTitle(defaultTitle);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (!selectedEntityId) {
      setErrorMsg('관리 대상(개체 또는 농장 공통)을 선택해주세요.');
      return;
    }

    if (!category) {
      setErrorMsg('관리 분류를 선택해주세요.');
      return;
    }

    if (!title.trim()) {
      setErrorMsg('관리 작업명을 입력해주세요.');
      return;
    }

    let targetEntity = null;
    if (!isFarmCommon) {
      targetEntity = entities.find(e => e.id === selectedEntityId);
      if (!targetEntity) {
        setErrorMsg('선택한 개체 정보를 찾을 수 없습니다.');
        return;
      }
    }

    const trimmedOperator = operator.trim();

    const logData = {
      id: logToEdit?.id || `LOG-${Date.now()}`,
      entityId: isFarmCommon ? null : targetEntity.id,
      tagNumber: isFarmCommon ? null : targetEntity.tagNumber,
      entityName: isFarmCommon ? '농장 공통' : targetEntity.name,
      isFarmCommon: isFarmCommon,
      date,
      time,
      category,
      title: title.trim(),
      details: details.trim(),
      operator: trimmedOperator,
      cost: cost ? Number(cost) : 0,
      nextScheduleDate: hasNextSchedule ? nextScheduleDate : null,
      nextScheduleTime: hasNextSchedule ? (nextScheduleTime || null) : null,
      nextScheduleTitle: hasNextSchedule ? nextScheduleTitle.trim() : null,
      completed: true,
      linkedScheduleId: initialValues?.linkedScheduleId || null,
      linkedReminderLogId: initialValues?.linkedReminderLogId || null,
      createdAt: logToEdit?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    onSave(logData, isFarmCommon ? null : {
      entityId: targetEntity.id,
      weight: updateWeight ? Number(updateWeight) : null,
      status: updateStatus || null,
    });
  };

  // 개체 변경 시 거세/수소인데 번식 카테고리가 선택되어 있었다면 안전하게 초기화
  useEffect(() => {
    const normCurrentCat = normalizeCategoryId(category);
    if (BREEDING_CATEGORY_IDS.has(normCurrentCat)) {
      const isMaleOrCastrated = currentSelectedEntity && (currentSelectedEntity.gender === 'castrated' || currentSelectedEntity.gender === 'male');
      if (isMaleOrCastrated) {
        setCategory('');
        setTitle('');
      }
    }
  }, [currentSelectedEntity, category]);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <form 
        className="modal-content modal-content-lg" 
        onClick={(e) => e.stopPropagation()} 
        onSubmit={handleSubmit}
      >
        {/* 모달 헤더 (신규 개체 등록 모달 표준 규격 일체화) */}
        <div className="modal-header">
          <div className="modal-header-title">
            <span style={{ fontWeight: 800, fontSize: '1.25rem' }}>
              {isEditing ? '관리 내역 수정' : '관리 내역 추가'}
            </span>
          </div>
          <button type="button" className="modal-close-btn" onClick={onClose} aria-label="닫기">
            <X size={20} />
          </button>
        </div>

        {/* 폼 본문 (스크롤 영역) */}
        <div className="modal-body">
            {errorMsg && (
              <div style={{
                background: 'rgba(239, 68, 68, 0.12)',
                border: '1px solid var(--color-danger)',
                color: 'var(--color-danger)',
                padding: '0.75rem 1rem',
                borderRadius: 'var(--radius-md)',
                marginBottom: '1.25rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                fontSize: '0.875rem'
              }}>
                <AlertCircle size={18} />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* 대상 개체: 개체 상세정보와 100% 동일한 규격으로 인라인 표시 (불필요한 라벨 및 박스 제거) */}
            {preselectedEntity || isEditing || initialValues?.isFarmCommon || isFarmCommon ? (
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '0.65rem', 
                marginBottom: '1.25rem',
                minWidth: 0,
                overflow: 'hidden'
              }}>
                {isFarmCommon ? (
                  <>
                    <span style={{ 
                      fontSize: '0.88rem', 
                      fontWeight: 800, 
                      color: 'var(--text-main)', 
                      background: 'var(--bg-card-subtle)',
                      padding: '0.2rem 0.6rem',
                      borderRadius: 'var(--radius-sm)',
                      border: '1px solid var(--border-color)',
                      flexShrink: 0 
                    }}>
                      🚜 농장 공통
                    </span>
                    <span style={{ 
                      fontSize: '0.92rem', 
                      fontWeight: 700, 
                      color: 'var(--text-muted)', 
                      overflow: 'hidden', 
                      textOverflow: 'ellipsis', 
                      whiteSpace: 'nowrap' 
                    }}>
                      (축사 소독, 방역, 시설 청소, 사료 관리)
                    </span>
                  </>
                ) : (
                  <>
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
                      {currentSelectedEntity?.tagNumber}
                    </span>
                    <span style={{ 
                      fontSize: '1.05rem', 
                      fontWeight: 700, 
                      color: 'var(--text-main)', 
                      overflow: 'hidden', 
                      textOverflow: 'ellipsis', 
                      whiteSpace: 'nowrap' 
                    }}>
                      {currentSelectedEntity?.name}
                    </span>
                  </>
                )}
              </div>
            ) : (
              /* 미지정 진입 시 (예: 메인 FAB 등): 기존 개체 선택 드롭다운 유지 */
              <div className="form-group" style={{ marginBottom: '1.25rem' }}>
                <label className="form-label">
                  관리 대상 선택 <span className="required">*</span>
                </label>
                <select
                  className="form-select"
                  value={selectedEntityId}
                  onChange={(e) => setSelectedEntityId(e.target.value)}
                  required
                >
                  <option value="">-- 관리 대상을 선택하세요 --</option>
                  <option value="FARM_COMMON">🚜 [농장 공통] (축사 소독, 방역, 시설 점검, 사료 등)</option>
                  {activeEntities.length > 0 && (
                    <optgroup label="사육 중인 개체">
                      {activeEntities.map(ent => (
                        <option key={ent.id} value={ent.id}>
                          {ent.tagNumber} {ent.name}
                        </option>
                      ))}
                    </optgroup>
                  )}
                  {historyEntities.length > 0 && (
                    <optgroup label="사육 이력 개체 (출하·기타)">
                      {historyEntities.map(ent => (
                        <option key={ent.id} value={ent.id}>
                          {ent.status === 'deceased' ? '🪦 [폐사] ' : '🏷️ [출하] '}{ent.tagNumber} {ent.name}
                        </option>
                      ))}
                    </optgroup>
                  )}
                </select>

                {currentSelectedEntity && (currentSelectedEntity.status === 'shipped' || currentSelectedEntity.status === 'deceased') && (
                  <div style={{ 
                    marginTop: '0.5rem', 
                    fontSize: '0.825rem', 
                    color: 'var(--color-accent)', 
                    fontWeight: 600,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem'
                  }}>
                    {currentSelectedEntity.status === 'shipped' ? (
                      <span>🏷️ 출하 완료된 개체입니다. (과거 관리 이력 보강용)</span>
                    ) : (
                      <span>🪦 폐사/도태된 개체입니다. (과거 관리 이력 보강용)</span>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* 2. 작업 일시 (상단에서 일시 먼저 확정하여, 아래 분류~제목 흐름이 끊기지 않도록 배치) */}
            <div className="form-group" style={{ marginBottom: '1.15rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1.15fr 0.85fr', gap: '0.65rem' }}>
                <div>
                  <label className="form-label" style={{ fontWeight: 700, marginBottom: '0.35rem' }}>작업 일자 <span className="required">*</span></label>
                  <input
                    type="date"
                    className="form-input"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    required
                  />
                </div>
                <div>
                  <label className="form-label" style={{ fontWeight: 700, marginBottom: '0.35rem' }}>작업 시간</label>
                  <input
                    type="time"
                    className="form-input"
                    value={time}
                    onChange={(e) => setTime(e.target.value)}
                  />
                </div>
              </div>
            </div>

            {/* 관리 분류 선택기 (3열 가로폭 균등 통일 알약 칩) */}
            <div className="form-group" style={{ marginBottom: '1.25rem' }}>
              <label className="form-label" style={{ marginBottom: '0.45rem', fontWeight: 700 }}>관리 분류 선택</label>

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
                      onClick={() => handleCategorySelect(cat.id)}
                      style={{
                        position: 'relative',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '0.3rem',
                        padding: '0.45rem 0.35rem',
                        borderRadius: '9999px',
                        border: isSelected ? '1.5px solid #10b981' : '1px solid var(--border-color)',
                        background: isSelected ? 'rgba(16, 185, 129, 0.12)' : 'var(--bg-card)',
                        color: isSelected ? '#059669' : 'var(--text-main)',
                        fontWeight: isSelected ? 700 : 600,
                        fontSize: '0.82rem',
                        cursor: 'pointer',
                        boxShadow: isSelected ? '0 1px 4px rgba(16, 185, 129, 0.2)' : 'none',
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

                {/* 새 분류 추가 버튼 (3열 균등 알약 칩 형태) */}
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
                    border: isAddingCategory ? '1.5px solid var(--color-primary)' : '1px dashed var(--border-color)',
                    background: isAddingCategory ? 'var(--color-primary-light)' : 'transparent',
                    color: 'var(--color-primary)',
                    fontWeight: 700,
                    fontSize: '0.82rem',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                    whiteSpace: 'nowrap',
                    width: '100%'
                  }}
                  title="새 관리 분류 직접 만들기"
                >
                  <Plus size={15} />
                  <span>분류 추가</span>
                </button>
              </div>

              {/* 인라인 새 분류 생성 폼 (이모지 없이 이름만 간결하게 등록) */}
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
                      새 관리 분류명 입력
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
                      className="btn btn-sm"
                      onClick={handleCreateCategory}
                      style={{
                        height: '36px',
                        padding: '0 0.85rem',
                        fontSize: '0.88rem',
                        fontWeight: 700,
                        whiteSpace: 'nowrap',
                        background: 'rgba(16, 185, 129, 0.14)',
                        border: '1px solid #10b981',
                        color: '#065f46'
                      }}
                    >
                      추가
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* 작업 내용 (빠른 추천, 제목, 상세) */}
            <div className="form-grid">
              {/* 빠른 제목 추천 프리셋 뱃지 (직접 추가/삭제 지원) */}
              {currentCategoryKey && (
                <div className="form-group full-width" style={{ marginBottom: '0.45rem' }}>
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
                            background: isSelected ? '#10b981' : 'var(--bg-card-subtle)',
                            color: isSelected ? '#ffffff' : 'var(--text-main)',
                            border: isSelected ? '1px solid #10b981' : '1px solid var(--border-color)',
                            borderRadius: '9999px',
                            padding: '0.2rem 0.5rem 0.2rem 0.65rem',
                            fontSize: '0.76rem',
                            fontWeight: isSelected ? 800 : 700,
                            boxShadow: isSelected ? '0 1px 3px rgba(16, 185, 129, 0.3)' : '0 1px 2px rgba(0, 0, 0, 0.03)',
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
                      <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', background: 'var(--bg-card)', padding: '0.15rem 0.35rem', borderRadius: '9999px', border: '1px solid #10b981' }}>
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
                          style={{ height: '20px', padding: '0 0.4rem', fontSize: '0.72rem', background: '#10b981', color: '#fff', border: 'none', borderRadius: '9999px', cursor: 'pointer', fontWeight: 700 }}
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

              <div className="form-group full-width">
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.45rem' }}>
                  <label className="form-label" style={{ margin: 0 }}>관리 작업명 <span className="required">*</span></label>
                  {/* 1안 앰버 골드 북마크 인라인 버튼: 작업명 입력 시 우측에 쏙 노출 */}
                  {title.trim() && !currentQuickTitles.includes(title.trim()) && (
                    <button
                      type="button"
                      onClick={() => handleAddQuickTitle(title.trim())}
                      style={{
                        background: 'rgba(245, 158, 11, 0.1)',
                        border: '1px solid rgba(245, 158, 11, 0.4)',
                        borderRadius: 'var(--radius-sm)',
                        color: '#b45309',
                        fontSize: '0.74rem',
                        fontWeight: 700,
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.25rem',
                        padding: '0.15rem 0.5rem',
                        lineHeight: 1.2,
                        transition: 'all 0.15s ease'
                      }}
                      title="현재 입력한 제목을 이 분류의 빠른 추천 목록에 추가"
                    >
                      <BookmarkPlus size={12} color="#b45309" strokeWidth={2.2} />
                      <span>추천에 저장</span>
                    </button>
                  )}
                </div>
                <input
                  type="text"
                  className="form-input"
                  placeholder="예: 구제역 백신 2차 접종, 1차 인공수정 (KPN-1422)"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                />
              </div>

              <div className="form-group full-width">
                <label className="form-label">상세 관리 내역 / 처방 / 투약 정보</label>
                <textarea
                  className="form-textarea"
                  placeholder="약품명, 주사 부위 및 용량(ml), 수정사 이름, 분만 상황, 섭취 반응 등을 상세히 기록하세요."
                  value={details}
                  onChange={(e) => setDetails(e.target.value)}
                  rows={3}
                />
              </div>

              <div className="form-group">
                <label className="form-label">작업자 / 담당 수의사</label>
                <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                  <input
                    type="text"
                    className="form-input"
                    value={operator}
                    onChange={(e) => setOperator(e.target.value)}
                    placeholder={`예: ${defaultOwnerName} (선택사항)`}
                    style={{ paddingRight: operator ? '30px' : '10px' }}
                  />
                  {operator && (
                    <button
                      type="button"
                      onClick={() => setOperator('')}
                      title="입력 내용 지우기"
                      style={{
                        position: 'absolute',
                        right: '8px',
                        background: 'transparent',
                        border: 'none',
                        cursor: 'pointer',
                        color: 'var(--text-muted)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: '2px'
                      }}
                    >
                      <X size={14} />
                    </button>
                  )}
                </div>

                {/* 환경설정에 등록된 농장 인원만 노출되는 작업자 선택 칩 (일반명칭 수의사/수정사 제외) */}
                {operatorSuggestions.length > 0 && (
                  <div style={{ display: 'flex', gap: '0.4rem', marginTop: '0.45rem', flexWrap: 'wrap', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-muted)', marginRight: '0.2rem' }}>작업자:</span>
                    {operatorSuggestions.map((chipName) => (
                      <button
                        key={chipName}
                        type="button"
                        onClick={() => setOperator(chipName)}
                        style={{
                          fontSize: '0.78rem',
                          padding: '0.22rem 0.65rem',
                          borderRadius: 'var(--radius-full)',
                          background: operator === chipName ? 'var(--color-primary-light)' : 'var(--bg-card-subtle)',
                          border: `1px solid ${operator === chipName ? 'var(--color-primary)' : 'var(--border-color)'}`,
                          color: operator === chipName ? 'var(--color-primary)' : 'var(--text-main)',
                          cursor: 'pointer',
                          fontWeight: operator === chipName ? 700 : 500,
                          transition: 'all 0.15s ease'
                        }}
                      >
                        {chipName}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className="form-group">
                <label className="form-label">비용 (원, 선택사항)</label>
                <input
                  type="number"
                  className="form-input"
                  placeholder="예: 30000"
                  value={cost}
                  onChange={(e) => setCost(e.target.value)}
                />
              </div>
            </div>

            {/* 차기 예정일 (일정 다이어리 자동 연동) 섹션 */}
            <div 
              ref={nextScheduleRef}
              className="card" 
              style={{ 
                marginTop: '1.25rem', 
                background: initialValues?.focusNextSchedule ? 'rgba(245, 158, 11, 0.08)' : (hasNextSchedule ? 'rgba(2, 132, 199, 0.04)' : 'var(--bg-card-subtle)'), 
                border: initialValues?.focusNextSchedule ? '2px dashed var(--color-accent)' : (hasNextSchedule ? '1px dashed rgba(2, 132, 199, 0.45)' : '1px dashed var(--border-color)'),
                borderRadius: 'var(--radius-md)',
                transition: 'all 0.3s ease'
              }}
            >
              <div className="card-body" style={{ padding: '1rem 1.25rem' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', cursor: 'pointer', fontWeight: 700 }}>
                  <input
                    type="checkbox"
                    checked={hasNextSchedule}
                    onChange={(e) => setHasNextSchedule(e.target.checked)}
                    style={{ width: '18px', height: '18px', accentColor: '#0284c7', cursor: 'pointer' }}
                  />
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.45rem' }}>
                    <Calendar size={21} color="#0284c7" strokeWidth={2.3} />
                    <span style={{ fontSize: '0.98rem' }}>다음 일정 등록</span>
                  </span>
                </label>

                {hasNextSchedule && (
                  <div style={{ marginTop: '1rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    {/* 빠른 계산 프리셋 */}
                    <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', alignItems: 'center' }}>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>빠른 설정:</span>
                      <button 
                        type="button" 
                        className="btn btn-outline btn-sm"
                        onClick={() => applyDatePreset(7, '경과 확인 및 추가 점검')}
                      >
                        +7일 (일주일 뒤)
                      </button>
                      <button 
                        type="button" 
                        className="btn btn-outline btn-sm"
                        onClick={() => applyDatePreset(21, '재발정 관찰 / 1차 임신 감정')}
                      >
                        +21일 (발정주기)
                      </button>
                      <button 
                        type="button" 
                        className="btn btn-outline btn-sm"
                        onClick={() => applyDatePreset(60, '임신 초음파 확진')}
                      >
                        +60일 (임신확진)
                      </button>
                      <button 
                        type="button" 
                        className="btn btn-outline btn-sm"
                        onClick={() => applyDatePreset(180, '차기 보강 예방접종')}
                      >
                        +180일 (백신주기)
                      </button>
                      <button 
                        type="button" 
                        className="btn btn-outline btn-sm"
                        onClick={() => applyDatePreset(285, '분만 예정일 (태아 출산)')}
                      >
                        +285일 (분만예정)
                      </button>
                    </div>

                    <div className="form-grid">
                      <div className="form-group full-width" style={{ marginBottom: 0 }}>
                        <div style={{ display: 'grid', gridTemplateColumns: '1.15fr 0.85fr', gap: '0.65rem' }}>
                          <div>
                            <label className="form-label">예정 날짜</label>
                            <input
                              ref={nextScheduleDateInputRef}
                              type="date"
                              className="form-input"
                              value={nextScheduleDate}
                              onChange={(e) => setNextScheduleDate(e.target.value)}
                              required={hasNextSchedule}
                            />
                          </div>
                          <div>
                            <label className="form-label">예정 시간 (선택)</label>
                            <input
                              type="time"
                              className="form-input"
                              value={nextScheduleTime}
                              onChange={(e) => setNextScheduleTime(e.target.value)}
                            />
                          </div>
                        </div>
                      </div>
                      <div className="form-group full-width">
                        <label className="form-label">예정 작업명</label>
                        <input
                          type="text"
                          className="form-input"
                          placeholder="예: 2차 보강 접종, 임신감정 확인"
                          value={nextScheduleTitle}
                          onChange={(e) => setNextScheduleTitle(e.target.value)}
                          required={hasNextSchedule}
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>
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
                onClick={() => {
                  if (window.confirm('정말 이 관리 기록을 삭제하시겠습니까?')) {
                    onDelete(logToEdit.id);
                    onClose();
                  }
                }}
                style={{
                  border: '1px solid rgba(239, 68, 68, 0.4)',
                  color: 'var(--color-danger)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                  fontWeight: 700
                }}
              >
                <Trash2 size={16} color="var(--color-danger)" />
                <span>기록 삭제</span>
              </button>
            )}

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
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
                  fontWeight: 700,
                  background: 'rgba(16, 185, 129, 0.14)',
                  border: '1px solid #10b981',
                  color: '#065f46',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  borderRadius: 'var(--radius-sm)',
                  boxShadow: 'var(--shadow-sm)'
                }}
              >
                <Save size={16} color={isEditing ? 'currentColor' : '#065f46'} strokeWidth={isEditing ? 2 : 2.2} />
                <span>{isEditing ? '수정 사항 저장' : '관리 기록 저장'}</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    );
  }
