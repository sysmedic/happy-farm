import React, { useState, useEffect } from 'react';
import { X, Sparkles, AlertCircle, Save } from 'lucide-react';
import { 
  ENTITY_STATUSES, 
  GENDER_OPTIONS, 
  HANWOO_BREEDS,
  calculateAge, 
  getTodayDateString 
} from '../../lib/types.js';

export default function EntityFormModal({
  entityToEdit,
  existingEntities,
  onClose,
  onSave
}) {
  const isEditing = Boolean(entityToEdit && entityToEdit.id);

  const [formData, setFormData] = useState({
    tagNumber: '',
    name: '',
    category: 'hanwoo',
    breed: '한우(번식우)',
    gender: 'female',
    birthDate: getTodayDateString(),
    barn: '제1축사 1번방',
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
        breed: entityToEdit.breed || '한우(번식우)',
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

  // 한우 사육 단계 선택 시 성별 자동 매핑 및 설정
  const handleBreedSelect = (breedLabel) => {
    let gender = formData.gender;
    if (breedLabel.includes('암소') || breedLabel.includes('번식우')) gender = 'female';
    else if (breedLabel.includes('거세')) gender = 'castrated';
    else if (breedLabel.includes('씨수소') || breedLabel.includes('종모우')) gender = 'male';

    setFormData(prev => ({
      ...prev,
      category: 'hanwoo',
      breed: breedLabel,
      gender: gender
    }));
  };

  // 개체번호 자동 채번 (이표번호 12자리 형식: 002-XXXX-XXXX)
  const handleAutoGenerateTag = () => {
    const prefix = '002';
    const mid = String(Math.floor(1000 + Math.random() * 9000));
    const suffix = String(Math.floor(1000 + Math.random() * 9000));
    const newTag = `${prefix}-${mid}-${suffix}`;
    setFormData(prev => ({ ...prev, tagNumber: newTag }));
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
            <span style={{ fontSize: '1.4rem' }}>{isEditing ? '✏️' : '🐂'}</span>
            <span>{isEditing ? '개체 정보 수정' : '신규 개체 등록 (개체등록카드)'}</span>
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
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="예: 002-1402-9851"
                    value={formData.tagNumber}
                    onChange={(e) => setFormData({ ...formData, tagNumber: e.target.value })}
                    required
                  />
                  {!isEditing && (
                    <button
                      type="button"
                      className="btn btn-secondary btn-sm"
                      onClick={handleAutoGenerateTag}
                      title="랜덤 이표번호 자동 생성"
                    >
                      <Sparkles size={14} />
                      <span>자동 채번</span>
                    </button>
                  )}
                </div>
                <span className="form-hint">축산물이력제 12자리 또는 농장 관리번호</span>
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

              {/* 한우 사육 단계 및 구분 (타 축종 숨김 및 한우 전용) */}
              <div className="form-group full-width">
                <label className="form-label">
                  한우 사육 단계 및 구분 <span className="required">*</span>
                </label>
                <div style={{ display: 'flex', gap: '0.45rem', flexWrap: 'wrap', marginBottom: '0.5rem' }}>
                  {HANWOO_BREEDS.map(item => (
                    <button
                      key={item.id}
                      type="button"
                      className={`btn btn-sm ${formData.breed === item.label ? 'btn-primary' : 'btn-outline'}`}
                      onClick={() => handleBreedSelect(item.label)}
                    >
                      {item.shortLabel}
                    </button>
                  ))}
                </div>
                <input
                  type="text"
                  className="form-input"
                  placeholder="예: 한우(번식우 - 암소), 직접 수정 가능"
                  value={formData.breed}
                  onChange={(e) => setFormData({ ...formData, breed: e.target.value })}
                  required
                />
              </div>

              {/* 성별 */}
              <div className="form-group">
                <label className="form-label">성별</label>
                <select
                  className="form-select"
                  value={formData.gender}
                  onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                >
                  {GENDER_OPTIONS.map(g => (
                    <option key={g.id} value={g.id}>
                      {g.symbol} {g.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* 현재 상태 */}
              <div className="form-group">
                <label className="form-label">현재 상태</label>
                <select
                  className="form-select"
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                >
                  {ENTITY_STATUSES.map(st => (
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

              {/* 축사 및 방 위치 */}
              <div className="form-group">
                <label className="form-label">축사 위치 및 방 번호</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="예: 제1축사 2번방, 분만사 A-1"
                  value={formData.barn}
                  onChange={(e) => setFormData({ ...formData, barn: e.target.value })}
                />
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

              {/* 모체 번호 */}
              <div className="form-group">
                <label className="form-label">모체 개체번호 (선택)</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="예: 002-1100-3411"
                  value={formData.motherTag}
                  onChange={(e) => setFormData({ ...formData, motherTag: e.target.value })}
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
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              취소
            </button>
            <button type="submit" className="btn btn-primary">
              <Save size={16} />
              <span>{isEditing ? '변경사항 저장' : '개체 등록 완료'}</span>
            </button>
          </div>
        </form>
      </div>
    );
  }
