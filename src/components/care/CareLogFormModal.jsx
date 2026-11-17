import React, { useState, useEffect, useMemo } from 'react';
import { 
  X, 
  Save, 
  AlertCircle
} from 'lucide-react';
import { 
  CARE_CATEGORIES, 
  getTodayDateString, 
  getCurrentTimeString 
} from '../../lib/types.js';

export default function CareLogFormModal({
  preselectedEntity,
  logToEdit,
  entities,
  onClose,
  onSave
}) {
  const isEditing = Boolean(logToEdit);
  const [selectedEntityId, setSelectedEntityId] = useState(logToEdit?.entityId || preselectedEntity?.id || '');
  const [date, setDate] = useState(logToEdit?.date || getTodayDateString());
  const [time, setTime] = useState(logToEdit?.time || getCurrentTimeString());
  const [category, setCategory] = useState(logToEdit?.category || 'vaccine');
  const [title, setTitle] = useState(logToEdit?.title || '');
  const [details, setDetails] = useState(logToEdit?.details || '');
  const [operator, setOperator] = useState(logToEdit?.operator || '홍길동 대표');
  const [cost, setCost] = useState(logToEdit?.cost ? String(logToEdit.cost) : '');
  
  // 차기 일정 등록 (일정 다이어리 자동 연동)
  const [hasNextSchedule, setHasNextSchedule] = useState(Boolean(logToEdit?.nextScheduleDate));
  const [nextScheduleDate, setNextScheduleDate] = useState(logToEdit?.nextScheduleDate || '');
  const [nextScheduleTitle, setNextScheduleTitle] = useState(logToEdit?.nextScheduleTitle || '');

  // 체중 또는 상태 즉시 업데이트
  const [updateWeight, setUpdateWeight] = useState('');
  const [updateStatus, setUpdateStatus] = useState('');

  const [errorMsg, setErrorMsg] = useState('');

  const activeEntities = useMemo(() => entities ? entities.filter(e => e.status !== 'shipped') : [], [entities]);
  const shippedEntities = useMemo(() => entities ? entities.filter(e => e.status === 'shipped') : [], [entities]);

  useEffect(() => {
    if (logToEdit) {
      setSelectedEntityId(logToEdit.entityId);
      setDate(logToEdit.date);
      setTime(logToEdit.time || getCurrentTimeString());
      setCategory(logToEdit.category);
      setTitle(logToEdit.title);
      setDetails(logToEdit.details || '');
      setOperator(logToEdit.operator || '홍길동 대표');
      setCost(logToEdit.cost ? String(logToEdit.cost) : '');
      setHasNextSchedule(Boolean(logToEdit.nextScheduleDate));
      setNextScheduleDate(logToEdit.nextScheduleDate || '');
      setNextScheduleTitle(logToEdit.nextScheduleTitle || '');
    } else if (preselectedEntity) {
      setSelectedEntityId(preselectedEntity.id);
    } else if (entities && entities.length > 0 && !selectedEntityId) {
      const firstActive = entities.find(e => e.status !== 'shipped') || entities[0];
      setSelectedEntityId(firstActive.id);
    }
  }, [logToEdit, preselectedEntity, entities, selectedEntityId]);

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

    if (!title.trim()) {
      setErrorMsg('관리 작업명을 입력해주세요.');
      return;
    }

    const targetEntity = entities.find(e => e.id === selectedEntityId);
    if (!targetEntity) {
      setErrorMsg('선택한 개체 정보를 찾을 수 없습니다.');
      return;
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
      operator: operator.trim(),
      cost: cost ? Number(cost) : 0,
      nextScheduleDate: hasNextSchedule ? nextScheduleDate : null,
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

  const currentSelectedEntity = entities.find(e => e.id === selectedEntityId);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <form 
        className="modal-content modal-content-lg" 
        onClick={(e) => e.stopPropagation()} 
        onSubmit={handleSubmit}
      >
        {/* 모달 헤더 */}
        <div className="modal-header">
          <div className="modal-header-title">
            <span style={{ fontSize: '1.4rem' }}>📋</span>
            <span>{isEditing ? '개체 관리 내역 수정' : '개체별 관리 내역 추가'}</span>
          </div>
          <button type="button" className="modal-close-btn" onClick={onClose}>
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

            {/* 대상 개체 선택기 */}
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
                        #{ent.tagNumber} {ent.name}
                      </option>
                    ))}
                  </optgroup>
                )}
                {shippedEntities.length > 0 && (
                  <optgroup label="출하 완료 개체">
                    {shippedEntities.map(ent => (
                      <option key={ent.id} value={ent.id}>
                        🏷️ [출하] #{ent.tagNumber} {ent.name}
                      </option>
                    ))}
                  </optgroup>
                )}
              </select>

              {currentSelectedEntity && (
                <div style={{ 
                  marginTop: '0.5rem', 
                  fontSize: '0.825rem', 
                  color: currentSelectedEntity.status === 'shipped' ? 'var(--color-accent)' : 'var(--color-primary)', 
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}>
                  {currentSelectedEntity.status === 'shipped' ? (
                    <span>🏷️ 출하 완료된 개체입니다. (과거 관리 이력 보강용)</span>
                  ) : (
                    <>
                      <span>선택된 개체: #{currentSelectedEntity.tagNumber} ({currentSelectedEntity.name})</span>
                      <span>• 축사: {currentSelectedEntity.barn || '미지정'}</span>
                    </>
                  )}
                </div>
              )}
            </div>

            {/* 관리 분류 선택기 (버튼 칩 그리드) */}
            <div className="form-group" style={{ marginBottom: '1.25rem' }}>
              <label className="form-label">관리 분류 선택</label>
              <div className="category-picker-grid">
                {CARE_CATEGORIES.map(cat => (
                  <button
                    key={cat.id}
                    type="button"
                    className={`category-picker-btn ${category === cat.id ? 'selected' : ''}`}
                    onClick={() => handleCategorySelect(cat.id)}
                  >
                    <span style={{ fontSize: '1.3rem' }}>{cat.icon}</span>
                    <span>{cat.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* 작업 일시 및 작업명 */}
            <div className="form-grid">
              <div className="form-group">
                <label className="form-label">작업 일자 <span className="required">*</span></label>
                <input
                  type="date"
                  className="form-input"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">작업 시간</label>
                <input
                  type="time"
                  className="form-input"
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                />
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
                <input
                  type="text"
                  className="form-input"
                  value={operator}
                  onChange={(e) => setOperator(e.target.value)}
                />
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
            <div className="card" style={{ marginTop: '1.25rem', background: 'var(--bg-card-subtle)', borderStyle: 'dashed' }}>
              <div className="card-body" style={{ padding: '1rem 1.25rem' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', cursor: 'pointer', fontWeight: 700 }}>
                  <input
                    type="checkbox"
                    checked={hasNextSchedule}
                    onChange={(e) => setHasNextSchedule(e.target.checked)}
                    style={{ width: '18px', height: '18px', accentColor: 'var(--color-primary)' }}
                  />
                  <span>📅 차기 관리 예정일 등록 (일정 다이어리에 자동 추가)</span>
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
                      <div className="form-group">
                        <label className="form-label">차기 예정 날짜</label>
                        <input
                          type="date"
                          className="form-input"
                          value={nextScheduleDate}
                          onChange={(e) => setNextScheduleDate(e.target.value)}
                          required={hasNextSchedule}
                        />
                      </div>
                      <div className="form-group">
                        <label className="form-label">차기 예정 작업명</label>
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

          {/* 모달 푸터 */}
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              취소
            </button>
            <button type="submit" className="btn btn-primary">
              <Save size={16} />
              <span>{isEditing ? '수정 사항 저장' : '관리 기록 저장'}</span>
            </button>
          </div>
        </form>
      </div>
    );
  }
