import React, { useState } from 'react';
import { 
  X, 
  Settings, 
  Building2, 
  User, 
  MapPin, 
  Compass, 
  Cloud, 
  Check, 
  Sparkles,
  Calendar
} from 'lucide-react';
import GoogleDriveView from '../backup/GoogleDriveView.jsx';

// 한우 벡터 라인 아이콘 (모달 내부 카드용)
function ModalCowIcon({ size = 24, strokeWidth = 1.35, className = '' }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M6.5 6.5L5.5 3.5 7.8 5" />
      <path d="M17.5 6.5L18.5 3.5 16.2 5" />
      <path d="M7.8 5c1.2-.8 2.6-1.2 4.2-1.2s3 .4 4.2 1.2" />
      <path d="M6 7c-2.8-.5-4.5.5-5 2.8 1.8 1.2 3.8.7 5-1" />
      <path d="M18 7c2.8-.5 4.5.5 5 2.8-1.8 1.2-3.8.7-5-1" />
      <path d="M6 8v3.5c0 1.5.8 2.5 1.5 3" />
      <path d="M18 8v3.5c0 1.5-.8 2.5-1.5 3" />
      <path d="M7.5 14.5c0-1.2 2-1.8 4.5-1.8s4.5.6 4.5 1.8v2.5c0 1.5-2 2.2-4.5 2.2s-4.5-.7-4.5-2.2v-2.5z" />
      <circle cx="9" cy="10" r="1.1" fill="currentColor" stroke="none" />
      <circle cx="15" cy="10" r="1.1" fill="currentColor" stroke="none" />
      <circle cx="10.2" cy="16.5" r="0.75" fill="currentColor" stroke="none" />
      <circle cx="13.8" cy="16.5" r="0.75" fill="currentColor" stroke="none" />
    </svg>
  );
}

export default function FarmSettingsModal({
  isOpen,
  onClose,
  farmSettings,
  onSaveSettings,
  entities,
  careLogs,
  onDatabaseRestored,
  onShowToast
}) {
  if (!isOpen) return null;

  const [activeTab, setActiveTab] = useState('info'); // 'info' | 'startView' | 'backup'

  // 농장 정보 로컬 폼 상태
  const [formValues, setFormValues] = useState({
    farmName: farmSettings?.farmName || '행복농장',
    ownerName: farmSettings?.ownerName || '관리자',
    address: farmSettings?.address || '',
    startTab: farmSettings?.startTab || 'entities'
  });

  const [isSavedRecently, setIsSavedRecently] = useState(false);

  const handleInputChange = (field, value) => {
    setFormValues(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSaveInfo = (e) => {
    if (e) e.preventDefault();
    onSaveSettings(formValues);
    setIsSavedRecently(true);
    if (onShowToast) onShowToast('농장 환경 설정이 성공적으로 저장되었습니다.');
    setTimeout(() => setIsSavedRecently(false), 2000);
  };

  const handleSelectStartTab = (tabId) => {
    const updated = { ...formValues, startTab: tabId };
    setFormValues(updated);
    onSaveSettings(updated);
    if (onShowToast) {
      const tabName = tabId === 'diary' ? '캘린더' : '개체 관리';
      onShowToast(`시작 화면이 [${tabName}]로 설정되었습니다. 탑바 순서가 자동 변경됩니다.`);
    }
  };

  return (
    <div className="modal-overlay settings-modal-overlay" onClick={onClose}>
      <div 
        className="modal-content modal-content-lg settings-modal-content"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="settings-modal-title"
      >
        {/* 모달 헤더 */}
        <div className="modal-header settings-modal-header">
          <div className="settings-header-title-box">
            <div className="settings-header-icon-wrap">
              <Settings size={20} className="settings-header-icon" />
            </div>
            <div>
              <h2 id="settings-modal-title" className="settings-modal-title">농장 환경 설정</h2>
              <p className="settings-modal-desc">기본 정보 등록, 시작 화면 선택 및 데이터 백업 관리</p>
            </div>
          </div>
          <button 
            type="button" 
            className="modal-close-btn" 
            onClick={onClose}
            aria-label="닫기"
          >
            <X size={20} />
          </button>
        </div>

        {/* 설정 상단 네비게이션 탭 */}
        <div className="settings-nav-tabs">
          <button
            type="button"
            className={`settings-nav-tab-btn ${activeTab === 'info' ? 'active' : ''}`}
            onClick={() => setActiveTab('info')}
          >
            <Building2 size={16} />
            <span>농장 정보</span>
          </button>
          <button
            type="button"
            className={`settings-nav-tab-btn ${activeTab === 'startView' ? 'active' : ''}`}
            onClick={() => setActiveTab('startView')}
          >
            <Compass size={16} />
            <span>시작 화면</span>
          </button>
          <button
            type="button"
            className={`settings-nav-tab-btn ${activeTab === 'backup' ? 'active' : ''}`}
            onClick={() => setActiveTab('backup')}
          >
            <Cloud size={16} />
            <span>백업</span>
          </button>
        </div>

        {/* 탭 본문 영역 */}
        <div className="settings-modal-body">
          {/* 1. 농장 정보 탭 */}
          {activeTab === 'info' && (
            <form onSubmit={handleSaveInfo} className="settings-form-section">
              <div className="settings-field-group">
                <label className="settings-label" htmlFor="farm-name-input">
                  <Building2 size={16} />
                  <span>농장 이름 <span className="required-star">*</span></span>
                </label>
                <input
                  id="farm-name-input"
                  type="text"
                  className="settings-input"
                  placeholder="예: 행복한우농장, 대박목장"
                  value={formValues.farmName}
                  onChange={(e) => handleInputChange('farmName', e.target.value)}
                  required
                />
              </div>

              <div className="settings-field-group">
                <label className="settings-label" htmlFor="owner-name-input">
                  <User size={16} />
                  <span>농장 대표자 성명 <span className="required-star">*</span></span>
                </label>
                <input
                  id="owner-name-input"
                  type="text"
                  className="settings-input"
                  placeholder="예: 홍길동"
                  value={formValues.ownerName}
                  onChange={(e) => handleInputChange('ownerName', e.target.value)}
                  required
                />
              </div>

              <div className="settings-field-group">
                <label className="settings-label" htmlFor="farm-address-input">
                  <MapPin size={16} />
                  <span>농장 소재지 (선택 사항)</span>
                </label>
                <input
                  id="farm-address-input"
                  type="text"
                  className="settings-input"
                  placeholder="예: 경북 칠곡군 기산면 영리 123"
                  value={formValues.address}
                  onChange={(e) => handleInputChange('address', e.target.value)}
                />
                <span className="field-hint">보고서 출력 시 농장 주소 표기에 활용됩니다.</span>
              </div>

              <div className="settings-action-bar">
                <button
                  type="submit"
                  className="btn-settings-save"
                >
                  <Check size={16} />
                  <span>{isSavedRecently ? '저장 완료!' : '농장 정보 저장'}</span>
                </button>
              </div>
            </form>
          )}

          {/* 2. 시작 화면 & 탑바 탭 정렬 탭 */}
          {activeTab === 'startView' && (
            <div className="settings-start-view-section">
              <div className="start-tab-choice-grid">
                {/* 1) 개체 관리 옵션 */}
                <div 
                  className={`start-tab-card ${formValues.startTab === 'entities' ? 'selected' : ''}`}
                  onClick={() => handleSelectStartTab('entities')}
                  role="button"
                  tabIndex={0}
                >
                  <div className="start-tab-card-header">
                    <div className="start-tab-icon-wrap cow">
                      <ModalCowIcon size={26} strokeWidth={1.35} />
                    </div>
                    <div className="start-tab-check">
                      {formValues.startTab === 'entities' && <Check size={16} strokeWidth={3} />}
                    </div>
                  </div>
                  <h3 className="start-tab-title">🐮 개체 관리 (기본 추천)</h3>
                  <p className="start-tab-desc">
                    사육 중인 한우 목록과 상세 이력, 월령, 계통, 번식 상태를 한눈에 먼저 확인합니다.
                  </p>
                  <div className="start-tab-preview-badge">
                    탑바 순서: <strong>[ 개체관리 ]</strong> ➔ [ 캘린더 ] ➔ [ 일일보고 ]
                  </div>
                </div>

                {/* 2) 캘린더 옵션 */}
                <div 
                  className={`start-tab-card ${formValues.startTab === 'diary' ? 'selected' : ''}`}
                  onClick={() => handleSelectStartTab('diary')}
                  role="button"
                  tabIndex={0}
                >
                  <div className="start-tab-card-header">
                    <div className="start-tab-icon-wrap calendar">
                      <Calendar size={24} strokeWidth={1.7} />
                    </div>
                    <div className="start-tab-check">
                      {formValues.startTab === 'diary' && <Check size={16} strokeWidth={3} />}
                    </div>
                  </div>
                  <h3 className="start-tab-title">📅 캘린더 (일정 중심)</h3>
                  <p className="start-tab-desc">
                    오늘 및 이번 달의 분만·수정·백신 일정과 타임라인 일정을 가장 먼저 체크합니다.
                  </p>
                  <div className="start-tab-preview-badge">
                    탑바 순서: <strong>[ 캘린더 ]</strong> ➔ [ 개체관리 ] ➔ [ 일일보고 ]
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 3. 구글 드라이브 백업 및 복원 탭 */}
          {activeTab === 'backup' && (
            <div className="settings-backup-section">
              <GoogleDriveView
                entities={entities}
                careLogs={careLogs}
                onDatabaseRestored={onDatabaseRestored}
              />
            </div>
          )}
        </div>

        {/* 모달 푸터 */}
        <div className="modal-footer settings-modal-footer">
          <button 
            type="button" 
            className="btn-settings-close" 
            onClick={onClose}
          >
            닫기
          </button>
        </div>
      </div>
    </div>
  );
}
