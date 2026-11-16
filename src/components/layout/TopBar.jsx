import React from 'react';
import { 
  Sprout, 
  Calendar, 
  FileText, 
  Cloud, 
  PlusCircle, 
  Sun, 
  Moon, 
  ListPlus,
  RotateCcw
} from 'lucide-react';

export default function TopBar({ 
  activeTab, 
  onSelectTab, 
  theme, 
  onToggleTheme, 
  onOpenEntityModal, 
  onOpenCareLogModal,
  onResetSample
}) {
  return (
    <header className="topbar">
      {/* Brand Logo & Name */}
      <div className="brand-section" onClick={() => onSelectTab('entities')}>
        <div className="brand-logo-icon">
          <Sprout size={24} />
        </div>
        <div>
          <div className="brand-title">
            행복 농장 <span style={{ fontSize: '0.8rem', opacity: 0.8, fontWeight: 500 }}>관리 프로그램</span>
          </div>
          <div className="brand-subtitle">Smart Happy Farm Management</div>
        </div>
      </div>

      {/* Main Navigation Tabs */}
      <nav className="nav-tabs" aria-label="메인 메뉴">
        <button
          className={`nav-tab-item ${activeTab === 'entities' ? 'active' : ''}`}
          onClick={() => onSelectTab('entities')}
        >
          <span style={{ fontSize: '1rem' }}>🐂</span>
          <span>개체 관리</span>
        </button>

        <button
          className={`nav-tab-item ${activeTab === 'diary' ? 'active' : ''}`}
          onClick={() => onSelectTab('diary')}
        >
          <Calendar size={16} />
          <span>일정 다이어리</span>
        </button>

        <button
          className={`nav-tab-item ${activeTab === 'report' ? 'active' : ''}`}
          onClick={() => onSelectTab('report')}
        >
          <FileText size={16} />
          <span>일일 보고서</span>
        </button>

        <button
          className={`nav-tab-item ${activeTab === 'cloud' ? 'active' : ''}`}
          onClick={() => onSelectTab('cloud')}
        >
          <Cloud size={16} />
          <span>구글 드라이브</span>
        </button>
      </nav>

      {/* Quick Action Buttons */}
      <div className="topbar-actions">
        <button 
          className="btn btn-secondary btn-sm"
          onClick={onOpenEntityModal}
          title="새 가축/개체 등록"
        >
          <PlusCircle size={15} />
          <span>개체 등록</span>
        </button>

        <button 
          className="btn btn-primary btn-sm"
          onClick={() => onOpenCareLogModal()}
          title="개체별 관리 내역 추가"
        >
          <ListPlus size={15} />
          <span>관리 추가</span>
        </button>

        <button
          className="btn btn-outline btn-icon-only"
          onClick={onToggleTheme}
          title={theme === 'dark' ? '라이트 모드로 전환' : '다크 모드로 전환'}
        >
          {theme === 'dark' ? <Sun size={17} color="#f59e0b" /> : <Moon size={17} />}
        </button>

        <button
          className="btn btn-outline btn-icon-only"
          onClick={onResetSample}
          title="초기 샘플 데이터 복구"
        >
          <RotateCcw size={15} />
        </button>
      </div>
    </header>
  );
}
