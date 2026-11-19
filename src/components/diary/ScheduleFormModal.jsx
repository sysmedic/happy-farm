import React, { useState, useEffect, useMemo } from 'react';
import { 
  X, 
  Calendar, 
  Clock, 
  Sparkles, 
  Check, 
  AlertCircle 
} from 'lucide-react';
import { getTodayDateString } from '../../lib/types.js';

// 일정 전용 카테고리 프리셋
export const SCHEDULE_CATEGORIES = [
  { id: 'vaccine', label: '백신접종', icon: '💉', color: '#0ea5e9' },
  { id: 'breeding', label: '인공수정', icon: '🧬', color: '#8b5cf6' },
  { id: 'heat_check', label: '재발정 관찰', icon: '🔥', color: '#f97316' },
  { id: 'pregnancy_check', label: '임신감정', icon: '💖', color: '#ec4899' },
  { id: 'calving', label: '분만예정', icon: '🐮', color: '#10b981' },
  { id: 'treatment', label: '진료·치료', icon: '💊', color: '#ef4444' },
  { id: 'feed', label: '사료·영양', icon: '🌾', color: '#d97706' },
  { id: 'routine', label: '방역점검', icon: '🛡️', color: '#14b8a6' },
  { id: 'other', label: '기타 일정', icon: '📋', color: '#64748b' },
];

// 카테고리별 빠른 제목 추천 목록
const QUICK_TITLES = {
  vaccine: ['구제역 일제 정기 백신', '소 호흡기 5종 혼합 백신', '아까바네 백신 접종', '기생충 구충제 투약'],
  breeding: ['인공수정 시술 (수정사 방문)', '종모우 정액 준비 및 확인', '배란 유도제 투약'],
  heat_check: ['수정 후 21일차 재발정 관찰', '초발정 징후 관찰', '승가 행위 및 점액 확인'],
  pregnancy_check: ['수정 후 60일차 초음파 임신감정', '직장검사 임신 확인'],
  calving: ['분만 대기 및 분만사 이동', '초유 급여 준비 및 분만 관찰'],
  treatment: ['호흡기 치료 경과 확인', '소화기/설사 투약 2차', '외과 처치 및 드레싱'],
  feed: ['배합사료 정기 입고 및 적재', '조사료(볏짚/알팔파) 공급', '미네랄/비타민 블록 교체'],
  routine: ['축사 내외부 안개분무 일제 소독', '환풍기 및 급수조 청소', '전기 시설 및 보온등 점검'],
  other: ['축협 조합 방문', '가축공제 보험 갱신', '농장 시설 보수'],
};

export default function ScheduleFormModal({
  initialDate,
  scheduleToEdit,
  entities = [],
  onClose,
  onSave,
  onDelete
}) {
  const isEditing = Boolean(scheduleToEdit);

  const [date, setDate] = useState(scheduleToEdit?.date || initialDate || getTodayDateString());
  const [time, setTime] = useState(scheduleToEdit?.time || '');
  const [targetType, setTargetType] = useState(scheduleToEdit?.entityId ? 'entity' : 'farm');
  const [selectedEntityId, setSelectedEntityId] = useState(scheduleToEdit?.entityId || '');
  const [category, setCategory] = useState(scheduleToEdit?.category || 'routine');
  const [title, setTitle] = useState(scheduleToEdit?.title || '');
  const [memo, setMemo] = useState(scheduleToEdit?.memo || '');
  const [errorMsg, setErrorMsg] = useState('');

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

  const currentSelectedEntity = useMemo(() => {
    return entities.find(e => e.id === selectedEntityId) || null;
  }, [entities, selectedEntityId]);

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
      completed: scheduleToEdit ? scheduleToEdit.completed : false,
      completedAt: scheduleToEdit ? scheduleToEdit.completedAt : null,
      createdAt: scheduleToEdit?.createdAt || new Date().toISOString()
    };

    onSave(payload);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div 
        className="modal-content modal-content-md"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: '540px' }}
      >
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Calendar size={20} color="var(--color-primary)" />
            <h3 style={{ fontSize: '1.15rem', fontWeight: 800 }}>
              {isEditing ? '일정 수정' : '새 일정 추가'}
            </h3>
          </div>
          <button 
            type="button" 
            className="btn btn-outline btn-sm btn-icon-only" 
            onClick={onClose}
          >
            <X size={18} />
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

            {/* 2. 대상 구분 (농장 공통 vs 특정 개체 지정) */}
            <div className="form-group" style={{ marginBottom: '1.15rem' }}>
              <label className="form-label" style={{ fontWeight: 700 }}>
                일정 대상
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', marginBottom: '0.6rem' }}>
                <button
                  type="button"
                  className={`btn ${targetType === 'farm' ? 'btn-primary' : 'btn-outline'}`}
                  onClick={() => setTargetType('farm')}
                  style={{ padding: '0.6rem 0.5rem', fontSize: '0.9rem' }}
                >
                  🌾 농장 공통 일정
                </button>
                <button
                  type="button"
                  className={`btn ${targetType === 'entity' ? 'btn-primary' : 'btn-outline'}`}
                  onClick={() => setTargetType('entity')}
                  style={{ padding: '0.6rem 0.5rem', fontSize: '0.9rem' }}
                >
                  🐂 개체 개별 일정
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

                  {currentSelectedEntity && (
                    <div style={{
                      marginTop: '0.45rem',
                      fontSize: '0.8rem',
                      color: 'var(--color-primary)',
                      fontWeight: 600,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem'
                    }}>
                      <span>선택된 개체: {currentSelectedEntity.tagNumber}{currentSelectedEntity.name ? ` (${currentSelectedEntity.name})` : ''}</span>
                      <span>• 축사: {currentSelectedEntity.barn || '미지정'}</span>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* 3. 일정 분류 선택 */}
            <div className="form-group" style={{ marginBottom: '1.15rem' }}>
              <label className="form-label" style={{ fontWeight: 700 }}>
                일정 분류
              </label>
              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(3, 1fr)', 
                gap: '0.45rem' 
              }}>
                {SCHEDULE_CATEGORIES.map(cat => {
                  const isSelected = category === cat.id;
                  return (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => handleCategoryChange(cat.id)}
                      style={{
                        padding: '0.55rem 0.3rem',
                        borderRadius: 'var(--radius-md)',
                        border: isSelected ? `2px solid ${cat.color}` : '1px solid var(--border-color)',
                        background: isSelected ? 'rgba(16, 185, 129, 0.12)' : 'var(--bg-card-subtle)',
                        color: isSelected ? 'var(--color-primary)' : 'var(--text-main)',
                        fontWeight: isSelected ? 800 : 500,
                        fontSize: '0.8rem',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '0.35rem',
                        transition: 'all 0.15s ease'
                      }}
                    >
                      <span>{cat.icon}</span>
                      <span>{cat.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 4. 빠른 제목 추천 프리셋 뱃지 */}
            {QUICK_TITLES[category] && (
              <div style={{ marginBottom: '0.85rem' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.35rem' }}>
                  빠른 제목 추천 (클릭 시 자동 입력):
                </span>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
                  {QUICK_TITLES[category].map((presetTitle, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setTitle(presetTitle)}
                      style={{
                        background: title === presetTitle ? 'var(--color-primary)' : 'var(--bg-card-subtle)',
                        color: title === presetTitle ? '#fff' : 'var(--text-muted)',
                        border: '1px solid var(--border-color)',
                        borderRadius: '9999px',
                        padding: '0.25rem 0.55rem',
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        cursor: 'pointer'
                      }}
                    >
                      {presetTitle}
                    </button>
                  ))}
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

          <div className="modal-footer" style={{ justifyContent: 'flex-end', gap: '0.6rem' }}>
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
            {isEditing && onDelete && (
              <button 
                type="button" 
                className="btn btn-outline"
                onClick={handleDelete}
                style={{
                  border: '1px solid var(--color-danger)',
                  color: 'var(--color-danger)',
                  fontWeight: 600,
                  background: 'var(--bg-card)'
                }}
              >
                삭제
              </button>
            )}
            <button 
              type="submit" 
              className={`btn ${isEditing ? 'btn-outline' : 'btn-primary'}`}
              style={{
                fontWeight: 700,
                minWidth: '100px',
                ...(isEditing ? {
                  border: '1px solid var(--text-muted)',
                  color: 'var(--text-main)',
                  background: 'var(--bg-card)'
                } : {})
              }}
            >
              <Check size={16} />
              <span>{isEditing ? '수정 사항 저장' : '일정 등록'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
