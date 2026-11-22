import React from 'react';
import { 
  Sprout, 
  Calendar, 
  FileText, 
  Cloud, 
  Plus
} from 'lucide-react';

// 한우 벡터 라인 아이콘 (끝이 뾰족한 뿔 & 턱선 정리된 단일 주둥이 하단 핏)
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
      {/* 뾰족한 좌측 뿔 */}
      <path d="M7 5.5L5.5 1.5 8 3.8" />
      {/* 뾰족한 우측 뿔 */}
      <path d="M17 5.5l1.5-4L16 3.8" />
      {/* 이마선 */}
      <path d="M7 5.5h10" />
      {/* 좌측 귀 */}
      <path d="M7 5.5C4.8 6 2 5.5 1.5 7.5c2.2 2 4 2 5.5 3" />
      {/* 우측 귀 */}
      <path d="M17 5.5c2.2.5 5 0 5.5 2-2.2 2-4 2-5.5 3" />
      {/* 얼굴 외곽 (이중 턱선 제거하고 볼에서 주둥이로 자연스럽게 연결) */}
      <path d="M7 11v1.5c0 4.5 2.2 7.5 5 7.5s5-3 5-7.5V11" />
      {/* 주둥이 상단 돔 라인 */}
      <path d="M7 13.5c1.5-1.8 3.2-2.5 5-2.5s3.5.7 5 2.5" />
      {/* 앙증맞은 콧구멍 2개 */}
      <ellipse cx="10.5" cy="16.5" rx="0.75" ry="1.1" transform="rotate(-20 10.5 16.5)" fill="currentColor" stroke="none" />
      <ellipse cx="13.5" cy="16.5" rx="0.75" ry="1.1" transform="rotate(20 13.5 16.5)" fill="currentColor" stroke="none" />
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
