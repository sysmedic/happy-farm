import React from 'react';
import { 
  Calendar, 
  FileText, 
  Cloud, 
  Plus, 
  ListPlus
} from 'lucide-react';

export default function MobileNavBar({
  activeTab,
  onSelectTab,
  onOpenCareLogModal
}) {
  return (
    <nav className="mobile-bottom-bar" aria-label="모바일 하단 네비게이션">
      <button
        className={`mobile-nav-btn ${activeTab === 'entities' ? 'active' : ''}`}
        onClick={() => onSelectTab('entities')}
      >
        <span style={{ fontSize: '1.25rem', lineHeight: 1 }}>🐂</span>
        <span className="mobile-nav-label">개체관리</span>
      </button>

      <button
        className={`mobile-nav-btn ${activeTab === 'diary' ? 'active' : ''}`}
        onClick={() => onSelectTab('diary')}
      >
        <Calendar size={20} />
        <span className="mobile-nav-label">다이어리</span>
      </button>

      {/* 중앙 빠른 현장 등록 버튼 (플로팅 액션) */}
      <button
        className="mobile-fab-btn"
        onClick={() => onOpenCareLogModal()}
        title="현장 관리 기록 빠른 추가"
      >
        <Plus size={22} color="#ffffff" strokeWidth={2.5} />
      </button>

      <button
        className={`mobile-nav-btn ${activeTab === 'report' ? 'active' : ''}`}
        onClick={() => onSelectTab('report')}
      >
        <FileText size={20} />
        <span className="mobile-nav-label">일일보고</span>
      </button>

      <button
        className={`mobile-nav-btn ${activeTab === 'cloud' ? 'active' : ''}`}
        onClick={() => onSelectTab('cloud')}
      >
        <Cloud size={20} />
        <span className="mobile-nav-label">드라이브</span>
      </button>
    </nav>
  );
}
