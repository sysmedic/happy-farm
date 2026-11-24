import React from 'react';
import { 
  Sprout, 
  Calendar, 
  FileText, 
  Plus,
  Moon,
  Sun
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

// 한국형 한우 우사(축사 건물) 벡터 라인 아이콘 (단정한 24px 핏, 외곽선 정돈)
function CattleBarnIcon({ size = 24, strokeWidth = 1.35, className = '' }) {
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
      {/* 상단 용마루 환기탑 (벤틸레이터 배기 루프) */}
      <path d="M9.5 3.5h5l.7 2h-6.4z" />
      {/* 완만한 우사 맞배지붕 (처마 끝 돌출부 선명화) */}
      <path d="M2.5 9.2L12 5.5l9.5 3.7" />
      {/* 우사 외곽 기둥과 바닥 (단단한 하부 프레임) */}
      <path d="M4.8 9.5v10.5a1 1 0 0 0 1 1h12.4a1 1 0 0 0 1-1V9.5" />
      {/* 우사 파이프 펜스 레일 (가로 2줄) */}
      <path d="M4.8 13.5h14.4" />
      <path d="M4.8 17.5h14.4" />
      {/* 중앙 우방 분할 세로 기둥 */}
      <path d="M12 9.5v11.5" />
    </svg>
  );
}

// 탭별 현재 화면 이름 매핑
const TAB_TITLES = {
  entities: '개체 관리',
  diary: '캘린더',
  report: '일일 보고서',
  farm: '농장 관리대장'
};

export default function TopBar({ 
  activeTab, 
  onSelectTab, 
  theme, 
  onToggleTheme,
  onOpenCareLogModal,
  onOpenSettingsModal,
  startTab = 'entities'
}) {
  const currentTitle = TAB_TITLES[activeTab] || '개체 관리';

  // 시작 화면 설정에 따라 탭 순서 동적 결정 (보고서는 3번째, 농장 일지는 4번째)
  const tabOrder = startTab === 'diary'
    ? ['diary', 'entities', 'report', 'farm']
    : ['entities', 'diary', 'report', 'farm'];

  const tabConfigs = {
    entities: {
      id: 'entities',
      title: '개체관리 (목록 및 상세 정보)',
      label: '개체관리',
      icon: <CowIcon size={26} strokeWidth={1.35} className="nav-tab-icon" />
    },
    diary: {
      id: 'diary',
      title: '캘린더 (월간 일정 및 타임라인)',
      label: '캘린더',
      icon: <Calendar size={22} strokeWidth={1.5} className="nav-tab-icon" />
    },
    report: {
      id: 'report',
      title: '일일보고 (영농일지 및 모바일 보고서)',
      label: '일일보고',
      icon: <FileText size={22} strokeWidth={1.5} className="nav-tab-icon" />
    },
    farm: {
      id: 'farm',
      title: '농장 관리대장 (축사 소독, 방역, 시설 전체 이력)',
      label: '농장 관리대장',
      icon: <CattleBarnIcon size={24} strokeWidth={1.35} className="nav-tab-icon" />
    }
  };

  return (
    <header className="topbar">
      {/* 1. 좌측: 농장 브랜드 버튼 (독립된 은은한 원형 틴트 버튼 스타일, 터치 시 환경설정 모달 열림) */}
      <div className="brand-section">
        <button
          type="button"
          className="farm-brand-btn"
          onClick={onOpenSettingsModal}
          title="농장 환경 설정 (농장 정보, 시작화면, 구글 드라이브 백업)"
          aria-label="농장 환경 설정"
        >
          <Sprout size={20} strokeWidth={2.2} className="farm-brand-icon" />
        </button>
      </div>

      {/* 2. 중앙: 농장 아이콘과 우측 탭 메뉴 사이 여백의 정중앙에 위치하는 현재 화면명 */}
      <div className="topbar-center-title-box">
        <h1 className="topbar-view-title">{currentTitle}</h1>
      </div>

      {/* 3. 우측: 3대 핵심 메뉴 탭바 + 독립 분리된 나이트/라이트 모드 버튼 + 기록추가 액션 */}
      <div className="topbar-right-group">
        <nav className="nav-tabs" aria-label="메인 메뉴">
          {tabOrder.map((tabId) => {
            const config = tabConfigs[tabId];
            if (!config) return null;
            const isActive = activeTab === tabId;
            return (
              <button
                key={config.id}
                className={`nav-tab-item ${config.id === 'report' ? 'nav-tab-report' : ''} ${isActive ? 'active' : ''}`}
                onClick={() => onSelectTab(config.id)}
                title={config.title}
                aria-label={config.label}
              >
                {config.icon}
                <span className="nav-tab-text">{config.label}</span>
              </button>
            );
          })}
        </nav>

        {/* 나이트/라이트 모드 독립 원형 버튼 */}
        <button
          type="button"
          className="theme-toggle-btn"
          onClick={onToggleTheme}
          title={theme === 'dark' ? '라이트 모드로 전환 ☀️' : '다크(나이트) 모드로 전환 🌙'}
          aria-label={theme === 'dark' ? '라이트 모드로 전환' : '다크 모드로 전환'}
        >
          {theme === 'dark' ? (
            <Sun size={17} strokeWidth={2.2} className="theme-toggle-icon sun" />
          ) : (
            <Moon size={17} strokeWidth={2.2} className="theme-toggle-icon moon" />
          )}
        </button>

        {/* Quick Action Buttons (데스크톱 전용 기록 추가) */}
        <div className="topbar-actions">
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
      </div>
    </header>
  );
}
