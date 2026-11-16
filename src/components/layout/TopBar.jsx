import React from 'react';
import { 
  Sprout, 
  Calendar, 
  FileText, 
  Cloud, 
  Sun, 
  Moon
} from 'lucide-react';

export default function TopBar({ 
  activeTab, 
  onSelectTab, 
  theme, 
  onToggleTheme
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
          <span>개체관리</span>
        </button>

        <button
          className={`nav-tab-item ${activeTab === 'diary' ? 'active' : ''}`}
          onClick={() => onSelectTab('diary')}
        >
          <Calendar size={16} />
          <span>다이어리</span>
        </button>

        <button
          className={`nav-tab-item ${activeTab === 'report' ? 'active' : ''}`}
          onClick={() => onSelectTab('report')}
        >
          <FileText size={16} />
          <span>일일보고</span>
        </button>

        <button
          className={`nav-tab-item ${activeTab === 'cloud' ? 'active' : ''}`}
          onClick={() => onSelectTab('cloud')}
        >
          <Cloud size={16} />
          <span>드라이브</span>
        </button>
      </nav>

      {/* Quick Action Buttons */}
      <div className="topbar-actions">
        <button
          className="btn btn-outline btn-icon-only"
          onClick={onToggleTheme}
          title={theme === 'dark' ? '라이트 모드로 전환' : '다크 모드로 전환'}
        >
          {theme === 'dark' ? <Sun size={17} color="#f59e0b" /> : <Moon size={17} />}
        </button>
      </div>
    </header>
  );
}
