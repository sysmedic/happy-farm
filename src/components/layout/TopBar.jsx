import React from 'react';
import { 
  Sprout, 
  Calendar, 
  FileText, 
  Cloud, 
  Plus
} from 'lucide-react';

// 정감 있는 제각(除角) 한우 벡터 라인 아이콘 (뾰족한 제각 뿔 흔적 + 턱선 정리된 비경 하단 핏)
function CowIcon({ size = 26, strokeWidth = 1.35, className = '' }) {
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
      {/* 뾰족한 제각 뿔 흔적 (양쪽 귀 위 날렵한 짧은 뿔) */}
      <path d="M6.5 6.5L5.5 3.5 7.8 5" />
      <path d="M17.5 6.5L18.5 3.5 16.2 5" />
      {/* 둥근 이마선 */}
      <path d="M7.8 5c1.2-.8 2.6-1.2 4.2-1.2s3 .4 4.2 1.2" />
      {/* 부드러운 양쪽 귀 */}
      <path d="M6 7c-2.8-.5-4.5.5-5 2.8 1.8 1.2 3.8.7 5-1" />
      <path d="M18 7c2.8-.5 4.5.5 5 2.8-1.8 1.2-3.8.7-5-1" />
      {/* 볼선 (이중 턱선 제거하고 비경으로 단정하게 연결) */}
      <path d="M6 8v3.5c0 1.5.8 2.5 1.5 3" />
      <path d="M18 8v3.5c0 1.5-.8 2.5-1.5 3" />
      {/* 듬직하고 넓은 한우 비경 (얼굴 하단 형성) */}
      <path d="M7.5 14.5c0-1.2 2-1.8 4.5-1.8s4.5.6 4.5 1.8v2.5c0 1.5-2 2.2-4.5 2.2s-4.5-.7-4.5-2.2v-2.5z" />
      {/* 또렷하고 순한 두 눈 */}
      <circle cx="9" cy="10" r="1.1" fill="currentColor" stroke="none" />
      <circle cx="15" cy="10" r="1.1" fill="currentColor" stroke="none" />
      {/* 콧구멍 2개 */}
      <circle cx="10.2" cy="16.5" r="0.75" fill="currentColor" stroke="none" />
      <circle cx="13.8" cy="16.5" r="0.75" fill="currentColor" stroke="none" />
    </svg>
  );
}

// 탭별 현재 화면 이름 매핑
const TAB_TITLES = {
  entities: '개체 관리',
  diary: '다이어리',
  report: '일일 보고서',
  cloud: '드라이브'
};

export default function TopBar({ 
  activeTab, 
  onSelectTab, 
  theme, 
  onToggleTheme,
  onOpenCareLogModal
}) {
  const currentTitle = TAB_TITLES[activeTab] || '개체 관리';

  return (
    <header className="topbar">
      {/* Brand Logo & Current View Title (농장 아이콘 터치 시 나이트/라이트 모드 전환) */}
      <div className="brand-section">
        <button
          type="button"
          className="brand-logo-icon brand-theme-toggle-btn"
          onClick={onToggleTheme}
          title={theme === 'dark' ? '라이트 모드로 전환 ☀️' : '다크(나이트) 모드로 전환 🌙'}
          aria-label={theme === 'dark' ? '라이트 모드로 전환' : '다크 모드로 전환'}
        >
          <Sprout size={22} />
        </button>
        <h1 className="topbar-view-title">{currentTitle}</h1>
      </div>

      {/* Main Navigation Tabs (모바일에서는 아이콘만 노출, 데스크톱에서는 텍스트 함께 노출) */}
      <nav className="nav-tabs" aria-label="메인 메뉴">
        <button
          className={`nav-tab-item ${activeTab === 'entities' ? 'active' : ''}`}
          onClick={() => onSelectTab('entities')}
          title="개체관리 (목록 및 상세 정보)"
          aria-label="개체관리"
        >
          <CowIcon size={26} strokeWidth={1.35} className="nav-tab-icon" />
          <span className="nav-tab-text">개체관리</span>
        </button>

        <button
          className={`nav-tab-item ${activeTab === 'diary' ? 'active' : ''}`}
          onClick={() => onSelectTab('diary')}
          title="다이어리 (일정 및 타임라인)"
          aria-label="다이어리"
        >
          <Calendar size={22} strokeWidth={1.5} className="nav-tab-icon" />
          <span className="nav-tab-text">다이어리</span>
        </button>

        {/* 일일보고: 다이어리와 드라이브 사이 배치 */}
        <button
          className={`nav-tab-item nav-tab-report ${activeTab === 'report' ? 'active' : ''}`}
          onClick={() => onSelectTab('report')}
          title="일일보고 (영농일지 및 모바일 보고서)"
          aria-label="일일보고"
        >
          <FileText size={22} strokeWidth={1.5} className="nav-tab-icon" />
          <span className="nav-tab-text">일일보고</span>
        </button>

        <button
          className={`nav-tab-item ${activeTab === 'cloud' ? 'active' : ''}`}
          onClick={() => onSelectTab('cloud')}
          title="드라이브 (구글 드라이브 백업/복원)"
          aria-label="드라이브"
        >
          <Cloud size={22} strokeWidth={1.5} className="nav-tab-icon" />
          <span className="nav-tab-text">드라이브</span>
        </button>
      </nav>

      {/* Quick Action Buttons */}
      <div className="topbar-actions">
        {/* 현장 관리 기록 빠른 추가 (+) 버튼 (데스크톱 전용) */}
        <button
          type="button"
          className="btn-quick-log"
          onClick={() => onOpenCareLogModal && onOpenCareLogModal(null)}
          title="현장 관리 기록 빠른 추가"
          aria-label="현장 관리 기록 빠른 추가"
        >
          <Plus size={16} strokeWidth={2.5} />
          <span className="quick-log-text">기록 추가</span>
        </button>
      </div>
    </header>
  );
}
