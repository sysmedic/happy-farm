import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  X, 
  Save, 
  AlertCircle,
  Plus,
  Trash2
} from 'lucide-react';
import { 
  CARE_CATEGORIES, 
  getTodayDateString, 
  getCurrentTimeString,
  normalizeCategoryId
} from '../../lib/types.js';

const LAST_OPERATOR_STORAGE_KEY = 'happy_farm_last_operator';

const getInitialOperator = (logToEdit, careLogs) => {
  if (logToEdit?.operator) return logToEdit.operator;
  try {
    const saved = localStorage.getItem(LAST_OPERATOR_STORAGE_KEY);
    if (saved && saved.trim()) return saved.trim();
  } catch (e) {
    // ignore
  }
  if (careLogs && careLogs.length > 0) {
    const latestWithOp = careLogs.find(l => l.operator && l.operator.trim());
    if (latestWithOp) return latestWithOp.operator;
  }
  return '';
};

export default function CareLogFormModal({
  preselectedEntity,
  logToEdit,
  initialValues = null,
  entities,
  careLogs,
  careCategories,
  onAddCustomCategory,
  onDeleteCustomCategory,
  onClose,
  onSave,
  onDelete
}) {
  const isEditing = Boolean(logToEdit);
  const categoriesToDisplay = careCategories || CARE_CATEGORIES;
  const [selectedEntityId, setSelectedEntityId] = useState(logToEdit?.entityId || initialValues?.entityId || preselectedEntity?.id || '');
  const [date, setDate] = useState(logToEdit?.date || initialValues?.date || getTodayDateString());
  const [time, setTime] = useState(logToEdit?.time || getCurrentTimeString());
  const [category, setCategory] = useState(normalizeCategoryId(logToEdit?.category || initialValues?.category) || '');
  const [title, setTitle] = useState(logToEdit?.title || initialValues?.title || '');
  const [details, setDetails] = useState(logToEdit?.details || '');
  const [operator, setOperator] = useState(() => getInitialOperator(logToEdit, careLogs));
  const [cost, setCost] = useState(logToEdit?.cost ? String(logToEdit.cost) : '');

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
      setSelectedEntityId(logToEdit.entityId);
      setDate(logToEdit.date);
      setTime(logToEdit.time || getCurrentTimeString());
      setCategory(normalizeCategoryId(logToEdit.category));
      setTitle(logToEdit.title);
      setDetails(logToEdit.details || '');
      setOperator(logToEdit.operator || getInitialOperator(null, careLogs));
      setCost(logToEdit.cost ? String(logToEdit.cost) : '');
      setHasNextSchedule(Boolean(logToEdit.nextScheduleDate));
      setNextScheduleDate(logToEdit.nextScheduleDate || '');
      setNextScheduleTime(logToEdit.nextScheduleTime || '');
      setNextScheduleTitle(logToEdit.nextScheduleTitle || '');
    } else {
      setOperator(getInitialOperator(null, careLogs));
      if (initialValues) {
        if (initialValues.category) setCategory(normalizeCategoryId(initialValues.category));
        else setCategory('');
        if (initialValues.title) setTitle(initialValues.title);
        if (initialValues.date) setDate(initialValues.date);
        if (initialValues.time) setTime(initialValues.time);
        if (initialValues.entityId) setSelectedEntityId(initialValues.entityId);
      } else {
        setCategory('');
      }
      if (preselectedEntity) {
        setSelectedEntityId(preselectedEntity.id);
      } else if (entities && entities.length > 0 && !selectedEntityId) {
        const firstActive = entities.find(e => e.status !== 'shipped' && e.status !== 'deceased') || entities[0];
        setSelectedEntityId(firstActive.id);
      }
    }
  }, [logToEdit, preselectedEntity, initialValues, entities, selectedEntityId, careLogs]);

  // 카테고리 선택 시 권장 작업명 자동 추천
  const handleCategorySelect = (catId) => {
    setCategory(catId);
    if (!title) {
      if (catId === 'vaccine') setTitle('구제역 정기 백신 접종');
      else if (catId === 'breeding') setTitle('인공수정 시술');
      else if (catId === 'treatment') setTitle('진료 및 처방 투약');
      else if (catId === 'calving') setTitle('자연 분만 출산');
      else if (catId === 'feed') setTitle('특수 영양제 및 미네랄 급여');
      else if (catId === 'weight') setTitle('정기 체중 측정');
      else if (catId === 'routine') setTitle('축사 소독 및 환경 점검');
      else {
        const found = categoriesToDisplay.find(c => c.id === catId);
        if (found) setTitle(found.label);
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
      setErrorMsg('대상 개체를 선택해주세요.');
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

    const targetEntity = entities.find(e => e.id === selectedEntityId);
    if (!targetEntity) {
      setErrorMsg('선택한 개체 정보를 찾을 수 없습니다.');
      return;
    }

    const trimmedOperator = operator.trim();
    if (trimmedOperator) {
      try {
        localStorage.setItem(LAST_OPERATOR_STORAGE_KEY, trimmedOperator);
      } catch (err) {
        // ignore storage quota error
      }
    }

    const logData = {
      id: logToEdit?.id || `LOG-${Date.now()}`,
      entityId: targetEntity.id,
      tagNumber: targetEntity.tagNumber,
      entityName: targetEntity.name,
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
      createdAt: logToEdit?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    onSave(logData, {
      entityId: targetEntity.id,
      weight: updateWeight ? Number(updateWeight) : null,
      status: updateStatus || null,
    });
  };

  const currentSelectedEntity = entities.find(e => e.id === selectedEntityId) || preselectedEntity;

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

            {/* 대상 개체: 상세 모달 등에서 진입 시 외부 박스 없이 개체번호 + 별명만 심플 표시 */}
            {preselectedEntity || isEditing ? (
              <div className="form-group" style={{ marginBottom: '1.25rem' }}>
                <label className="form-label">관리 대상 개체</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', flexWrap: 'wrap' }}>
                  <span className="entity-ear-tag" style={{ height: '34px', fontSize: '1.05rem', padding: '0 0.65rem', cursor: 'default' }}>
                    {currentSelectedEntity?.tagNumber}
                  </span>
                  <span style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-main)', lineHeight: 1.2 }}>
                    {currentSelectedEntity?.name}
                  </span>
                </div>
              </div>
            ) : (
              /* 미지정 진입 시 (예: 메인 FAB 등): 기존 개체 선택 드롭다운 유지 */
              <div className="form-group" style={{ marginBottom: '1.25rem' }}>
                <label className="form-label">
                  관리 대상 개체 선택 <span className="required">*</span>
                </label>
                <select
                  className="form-select"
                  value={selectedEntityId}
                  onChange={(e) => setSelectedEntityId(e.target.value)}
                  required
                >
                  <option value="">-- 개체를 선택하세요 --</option>
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
                    <optgroup label="사육 이력 개체 (출하·폐사)">
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
                      className="btn btn-primary"
                      onClick={handleCreateCategory}
                      style={{ height: '36px', padding: '0 0.95rem', fontSize: '0.88rem', fontWeight: 700, whiteSpace: 'nowrap' }}
                    >
                      등록 및 선택
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* 작업 일시 및 작업명 */}
            <div className="form-grid">
              <div className="form-group full-width" style={{ marginBottom: 0 }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1.15fr 0.85fr', gap: '0.65rem' }}>
                  <div>
                    <label className="form-label">작업 일자 <span className="required">*</span></label>
                    <input
                      type="date"
                      className="form-input"
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                      required
                    />
                  </div>
                  <div>
                    <label className="form-label">작업 시간</label>
                    <input
                      type="time"
                      className="form-input"
                      value={time}
                      onChange={(e) => setTime(e.target.value)}
                    />
                  </div>
                </div>
              </div>

              <div className="form-group full-width">
                <label className="form-label">관리 작업명 <span className="required">*</span></label>
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
                    onClick={() => {
                      if (operator) setOperator('');
                    }}
                    placeholder="예: 홍길동, 김수의사 (선택)"
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
                background: initialValues?.focusNextSchedule ? 'rgba(245, 158, 11, 0.08)' : 'var(--bg-card-subtle)', 
                border: initialValues?.focusNextSchedule ? '2px dashed var(--color-accent)' : '1px dashed var(--border-color)',
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
                    style={{ width: '18px', height: '18px', accentColor: 'var(--color-primary)' }}
                  />
                  <span>📅 다음 일정 등록</span>
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
                className={`btn ${isEditing ? 'btn-outline' : 'btn-primary'}`}
                style={isEditing ? {
                  border: '1px solid var(--text-muted)',
                  color: 'var(--text-main)',
                  fontWeight: 700,
                  background: 'var(--bg-card)'
                } : {}}
              >
                <Save size={16} />
                <span>{isEditing ? '수정 사항 저장' : '관리 기록 저장'}</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    );
  }
