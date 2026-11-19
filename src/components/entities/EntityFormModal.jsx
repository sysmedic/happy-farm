import React, { useState, useEffect } from 'react';
import { X, AlertCircle, Save } from 'lucide-react';
import { 
  ENTITY_STATUSES, 
  GENDER_OPTIONS, 
  HANWOO_BREEDS,
  calculateAge, 
  getTodayDateString,
  formatDisplayBreed,
  formatTagNumber,
  getAvailableStatuses,
  isStatusAllowed
} from '../../lib/types.js';

export default function EntityFormModal({
  entityToEdit,
  existingEntities,
  onClose,
  onSave,
  onDelete
}) {
  const isEditing = Boolean(entityToEdit && entityToEdit.id);

  const [formData, setFormData] = useState({
    tagNumber: '',
    name: '',
    category: 'hanwoo',
    breed: '번식우 - 암',
    gender: 'female',
    birthDate: getTodayDateString(),
    barn: '',
    motherTag: '',
    fatherTag: '',
    weight: '',
    status: 'healthy',
    memo: '',
  });

  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (entityToEdit) {
      setFormData({
        tagNumber: entityToEdit.tagNumber || '',
        name: entityToEdit.name || '',
        category: entityToEdit.category || 'hanwoo',
        breed: formatDisplayBreed(entityToEdit.breed),
        gender: entityToEdit.gender || 'female',
        birthDate: entityToEdit.birthDate || getTodayDateString(),
        barn: entityToEdit.barn || '',
        motherTag: entityToEdit.motherTag || '',
        fatherTag: entityToEdit.fatherTag || '',
        weight: entityToEdit.weight !== undefined ? entityToEdit.weight : '',
        status: entityToEdit.status || 'healthy',
        memo: entityToEdit.memo || '',
      });
    }
  }, [entityToEdit]);

  // 문자열에서 사육 단계(번식우, 비육우, 송아지, 육성우, 씨수소) 추출
  const extractStage = (breedStr) => {
    const s = (breedStr || '').toLowerCase();
    if (s.includes('번식') || s.includes('암소')) return '번식우';
    if (s.includes('비육') || s.includes('거세')) return '비육우';
    if (s.includes('씨수소') || s.includes('종모우')) return '씨수소';
    if (s.includes('송아지')) return '송아지';
    if (s.includes('육성')) return '육성우';
    return '번식우';
  };

  // 사육 단계별 성별 확정/가변 판별
  const getGenderLockInfo = (breedString) => {
    const b = (breedString || '').toLowerCase();
    if (b.includes('번식') || b.includes('암소')) {
      return { isFixed: true, fixedGender: 'female', message: '번식우는 암컷으로 성별이 자동 확정됩니다.' };
    }
    if (b.includes('비육') || b.includes('거세')) {
      return { isFixed: true, fixedGender: 'castrated', message: '비육우는 거세로 성별이 자동 확정됩니다.' };
    }
    if (b.includes('씨수소') || b.includes('종모우')) {
      return { isFixed: true, fixedGender: 'male', message: '씨수소(종모우)는 수컷으로 성별이 자동 확정됩니다.' };
    }
    if (b.includes('송아지')) {
      return { isFixed: false, fixedGender: null, message: '송아지의 성별(암컷 / 수컷)을 선택하세요.' };
    }
    if (b.includes('육성')) {
      return { isFixed: false, fixedGender: null, message: '육성우의 성별을 선택하세요.' };
    }
    return { isFixed: false, fixedGender: null, message: null };
  };

  const genderLockInfo = getGenderLockInfo(formData.breed);

  // 사육 단계 버튼 클릭 시 '사육단계 - 성별' 표준 포맷으로 자동 완성 및 상태 안전 검증
  const handleBreedSelect = (item) => {
    const stage = item.shortLabel || item.label;
    let gender = formData.gender;
    if (item.isGenderFixed) {
      gender = item.defaultGender;
    } else {
      if (gender === 'castrated') {
        gender = 'female';
      }
    }
    const genderLabel = gender === 'female' ? '암' : gender === 'male' ? '수' : '거세';
    const newBreed = `${stage} - ${genderLabel}`;
    // 송아지이거나 수컷/거세우인 경우 번식 상태 불가능 -> '건강/양호'로 자동 안전 전환
    const safeStatus = isStatusAllowed(formData.status, newBreed, gender) ? formData.status : 'healthy';

    setFormData(prev => ({
      ...prev,
      category: 'hanwoo',
      breed: newBreed,
      gender: gender,
      status: safeStatus
    }));
  };

  // 성별 버튼 클릭 시 '사육단계 - 성별' 실시간 동적 연동 및 상태 안전 검증
  const handleGenderSelect = (genderId) => {
    if (genderLockInfo.isFixed) return;
    const stage = extractStage(formData.breed);
    const genderLabel = genderId === 'female' ? '암' : genderId === 'male' ? '수' : '거세';
    const newBreed = `${stage} - ${genderLabel}`;
    const safeStatus = isStatusAllowed(formData.status, newBreed, genderId) ? formData.status : 'healthy';

    setFormData(prev => ({
      ...prev,
      gender: genderId,
      breed: newBreed,
      status: safeStatus
    }));
  };

  const handleBreedInputChange = (value) => {
    const lockInfo = getGenderLockInfo(value);
    let newGender = formData.gender;
    if (lockInfo.isFixed) {
      newGender = lockInfo.fixedGender;
    }
    const safeStatus = isStatusAllowed(formData.status, value, newGender) ? formData.status : 'healthy';
    setFormData(prev => ({
      ...prev,
      breed: value,
      gender: newGender,
      status: safeStatus
    }));
  };

  const agePreview = calculateAge(formData.birthDate);

  const handleSubmit = (e) => {
    e.preventDefault();
    setErrorMsg('');

    const trimmedTag = formData.tagNumber.trim();
    const trimmedName = formData.name.trim();

    if (!trimmedTag) {
      setErrorMsg('개체번호(이표번호)를 입력해주세요.');
      return;
    }

    if (!trimmedName) {
      setErrorMsg('개체 이름 또는 애칭을 입력해주세요.');
      return;
    }

    // 중복 개체번호 검사 (수정 모드가 아닐 때)
    if (!isEditing && existingEntities) {
      const duplicate = existingEntities.some(
        ent => ent.tagNumber.toLowerCase() === trimmedTag.toLowerCase()
      );
      if (duplicate) {
        setErrorMsg(`개체번호 [${trimmedTag}]는 이미 등록되어 있습니다. 다른 번호를 입력해주세요.`);
        return;
      }
    }

    const payload = {
      ...(entityToEdit || {}),
      id: entityToEdit?.id || `ENT-${Date.now()}`,
      tagNumber: trimmedTag,
      name: trimmedName,
      category: formData.category,
      breed: formData.breed.trim(),
      gender: formData.gender,
      birthDate: formData.birthDate,
      barn: formData.barn.trim(),
      motherTag: formData.motherTag.trim(),
      fatherTag: formData.fatherTag.trim(),
      weight: formData.weight !== '' ? Number(formData.weight) : 0,
      status: formData.status,
      memo: formData.memo.trim(),
      updatedAt: new Date().toISOString(),
      createdAt: entityToEdit?.createdAt || new Date().toISOString(),
    };

    onSave(payload);
  };

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
            <span style={{ fontWeight: 800, fontSize: '1.25rem' }}>{isEditing ? '개체 정보 수정' : '신규 개체 등록'}</span>
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

            <div className="form-grid">
              {/* 개체번호 (이표번호) */}
              <div className="form-group">
                <label className="form-label">
                  개체식별번호 (이표번호) <span className="required">*</span>
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  className="form-input"
                  placeholder="예: 002-1234-5678-9 (숫자 12자리만 입력)"
                  value={formData.tagNumber}
                  onChange={(e) => setFormData({ ...formData, tagNumber: formatTagNumber(e.target.value) })}
                  maxLength={15}
                  required
                />
              </div>

              {/* 개체 이름/애칭 */}
              <div className="form-group">
                <label className="form-label">
                  개체 이름 / 애칭 <span className="required">*</span>
                </label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="예: 복순이, 102호, 금동이"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>

              {/* 사육 단계 선택 (박스 제거, 다른 필드와 100% 동일한 톤의 표준 form-group) */}
              <div className="form-group full-width">
                <label className="form-label">
                  사육 단계 <span className="required">*</span>
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '0.45rem' }}>
                  {HANWOO_BREEDS.map(item => {
                    const isSelected = extractStage(formData.breed) === item.shortLabel;
                    return (
                      <button
                        key={item.id}
                        type="button"
                        className={`btn btn-sm ${isSelected ? 'btn-primary' : 'btn-outline'}`}
                        onClick={() => handleBreedSelect(item)}
                        style={{
                          fontWeight: isSelected ? 800 : 600,
                          padding: '0.5rem 0.2rem',
                          fontSize: '0.875rem',
                          textAlign: 'center',
                          whiteSpace: 'nowrap'
                        }}
                      >
                        {item.shortLabel}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 성별 선택 (박스 제거, 사육 단계 바로 밑에 표준 톤으로 배치) */}
              <div className="form-group full-width">
                <label className="form-label" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span>성별 <span className="required">*</span></span>
                  {genderLockInfo.isFixed && (
                    <span style={{ fontSize: '0.8rem', color: 'var(--color-primary)', fontWeight: 700 }}>
                      🔒 성별 자동 확정
                    </span>
                  )}
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.45rem' }}>
                  {GENDER_OPTIONS.map(g => {
                    const isSelected = formData.gender === g.id;
                    const isDisabled = genderLockInfo.isFixed && !isSelected;

                    return (
                      <button
                        key={g.id}
                        type="button"
                        className={`btn btn-sm ${isSelected ? 'active-gender-btn' : 'btn-outline'}`}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '0.35rem',
                          padding: '0.5rem 0.3rem',
                          fontWeight: 700,
                          fontSize: '0.875rem',
                          ...(isSelected ? {
                            background: g.id === 'female' 
                              ? 'linear-gradient(135deg, #ec4899 0%, #db2777 100%)' 
                              : g.id === 'male' 
                              ? 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)' 
                              : 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
                            color: '#ffffff',
                            borderColor: 'transparent',
                            boxShadow: '0 2px 6px rgba(0,0,0,0.18)'
                          } : isDisabled ? {
                            opacity: 0.35,
                            cursor: 'not-allowed',
                            background: 'var(--bg-card-subtle)',
                            color: 'var(--text-muted)'
                          } : {
                            color: g.color,
                            borderColor: 'var(--border-color)'
                          })
                        }}
                        disabled={genderLockInfo.isFixed}
                        onClick={() => handleGenderSelect(g.id)}
                        title={genderLockInfo.isFixed ? genderLockInfo.message : `${g.label} 선택`}
                      >
                        <span style={{ fontSize: '1rem', lineHeight: 1 }}>{g.symbol}</span>
                        <span>{g.label}</span>
                      </button>
                    );
                  })}
                </div>
                {genderLockInfo.message && (
                  <span className="form-hint" style={{ 
                    marginTop: '0.2rem', 
                    color: genderLockInfo.isFixed ? 'var(--text-muted)' : 'var(--color-primary)',
                    fontWeight: genderLockInfo.isFixed ? 500 : 700,
                    display: 'block'
                  }}>
                    {genderLockInfo.isFixed ? `ℹ️ ${genderLockInfo.message}` : `👉 ${genderLockInfo.message}`}
                  </span>
                )}
              </div>

              {/* 사육구분 명칭 (직접 수정 가능) */}
              <div className="form-group full-width">
                <label className="form-label">
                  사육구분 명칭 (직접 수정 가능) <span className="required">*</span>
                </label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="예: 번식우 - 암, 비육우 - 거세"
                  value={formData.breed}
                  onChange={(e) => handleBreedInputChange(e.target.value)}
                  required
                />
              </div>

              {/* 현재 상태 (사육단계 및 성별에 따라 번식 상태 자동 필터링) */}
              <div className="form-group">
                <label className="form-label">현재 상태</label>
                <select
                  className="form-select"
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                >
                  {getAvailableStatuses(formData.breed, formData.gender).map(st => (
                    <option key={st.id} value={st.id}>
                      {st.icon} {st.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* 생년월일 & 월령 프리뷰 */}
              <div className="form-group">
                <label className="form-label">
                  생년월일 (월령 자동 계산)
                </label>
                <input
                  type="date"
                  className="form-input"
                  value={formData.birthDate}
                  onChange={(e) => setFormData({ ...formData, birthDate: e.target.value })}
                />
                <span className="form-hint" style={{ color: 'var(--color-primary)', fontWeight: 600 }}>
                  현재 {agePreview.text}
                </span>
              </div>

              {/* 현재 체중 (kg) */}
              <div className="form-group">
                <label className="form-label">현재 체중 (kg)</label>
                <input
                  type="number"
                  step="0.1"
                  className="form-input"
                  placeholder="예: 480"
                  value={formData.weight}
                  onChange={(e) => setFormData({ ...formData, weight: e.target.value })}
                />
              </div>

              {/* 축사 및 방 위치 (기본값 없이 직접 입력, 예시 플레이스홀더 제공) */}
              <div className="form-group">
                <label className="form-label">축사 위치 및 방 번호</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="예: 제1축사 1번방, 분만사 2호실 (직접 입력)"
                  value={formData.barn}
                  onChange={(e) => setFormData({ ...formData, barn: e.target.value })}
                />
              </div>

              {/* 모체 번호 (자동 하이픈 포맷팅 적용) */}
              <div className="form-group">
                <label className="form-label">모체 개체번호 (선택)</label>
                <input
                  type="text"
                  inputMode="numeric"
                  className="form-input"
                  placeholder="예: 002-1100-3411-2 (숫자 12자리 입력)"
                  value={formData.motherTag}
                  onChange={(e) => setFormData({ ...formData, motherTag: formatTagNumber(e.target.value) })}
                  maxLength={15}
                />
              </div>

              {/* 부체(KPN) */}
              <div className="form-group">
                <label className="form-label">부체 식별 / 씨수소 (KPN)</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="예: KPN-1422"
                  value={formData.fatherTag}
                  onChange={(e) => setFormData({ ...formData, fatherTag: e.target.value })}
                />
              </div>

              {/* 특이사항 메모 */}
              <div className="form-group full-width">
                <label className="form-label">특이사항 / 사양 관리 메모</label>
                <textarea
                  className="form-textarea"
                  placeholder="성격, 과거 병력, 백신 반응, 사료 기호도 등 특이사항을 기록하세요."
                  value={formData.memo}
                  onChange={(e) => setFormData({ ...formData, memo: e.target.value })}
                />
              </div>
            </div>
          </div>

          {/* 모달 푸터 */}
          <div className="modal-footer" style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.6rem' }}>
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              취소
            </button>
            {isEditing && onDelete && (
              <button
                type="button"
                className="btn btn-outline"
                onClick={() => onDelete(entityToEdit.id, entityToEdit.name)}
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
            <button type="submit" className="btn btn-primary">
              <Save size={16} />
              <span>{isEditing ? '변경사항 저장' : '개체 등록 완료'}</span>
            </button>
          </div>
        </form>
      </div>
    );
  }
