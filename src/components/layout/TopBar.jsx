import React from 'react';
import { 
  Sprout, 
  Calendar, 
  FileText, 
  Cloud, 
  Plus
} from 'lucide-react';

// 정갈한 한우(소) 정면 라인 아이콘 (선 뭉침 제거 & 시원한 뿔/귀 강조, Lucide 스타일 호환)
function CowIcon({ size = 20, className = '' }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      {/* 위로 힘차게 솟은 양쪽 뿔 */}
      <path d="M7 6C5 2 2 3 2 5.5c2 1 3.5 1.5 5 1.5" />
      <path d="M17 6c2-4 5-3 5-.5-2 1-3.5 1.5-5 1.5" />
      {/* 단정한 얼굴 턱선 */}
      <path d="M6 8.5v4.5c0 3.3 2.7 6 6 6s6-2.7 6-6V8.5" />
      {/* 양쪽 귀 */}
      <path d="M6 10H3a1.5 1.5 0 0 0 0 3h3" />
      <path d="M18 10h3a1.5 1.5 0 0 1 0 3h-3" />
      {/* 또렷한 두 눈 */}
      <circle cx="9.5" cy="12" r="1" fill="currentColor" stroke="none" />
      <circle cx="14.5" cy="12" r="1" fill="currentColor" stroke="none" />
      {/* 하단 미니멀 코 라인 */}
      <path d="M10 16c1 .7 3 .7 4 0" />
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
          <CowIcon size={20} className="nav-tab-icon" />
          <span className="nav-tab-text">개체관리</span>
        </button>

        <button
          className={`nav-tab-item ${activeTab === 'diary' ? 'active' : ''}`}
          onClick={() => onSelectTab('diary')}
          title="다이어리 (일정 및 타임라인)"
          aria-label="다이어리"
        >
          <Calendar size={17} className="nav-tab-icon" />
          <span className="nav-tab-text">다이어리</span>
        </button>

        {/* 일일보고: 다이어리와 드라이브 사이 배치 */}
        <button
          className={`nav-tab-item nav-tab-report ${activeTab === 'report' ? 'active' : ''}`}
          onClick={() => onSelectTab('report')}
          title="일일보고 (영농일지 및 모바일 보고서)"
          aria-label="일일보고"
        >
          <FileText size={17} className="nav-tab-icon" />
          <span className="nav-tab-text">일일보고</span>
        </button>

        <button
          className={`nav-tab-item ${activeTab === 'cloud' ? 'active' : ''}`}
          onClick={() => onSelectTab('cloud')}
          title="드라이브 (구글 드라이브 백업/복원)"
          aria-label="드라이브"
        >
          <Cloud size={17} className="nav-tab-icon" />
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
