import React, { useRef } from 'react';
import { 
  Calendar, 
  FileText, 
  Cloud, 
  Plus
} from 'lucide-react';

export default function MobileNavBar({
  activeTab,
  onSelectTab,
  onOpenCareLogModal,
  onToggleTheme
}) {
  const timerRef = useRef(null);
  const isLongPressRef = useRef(false);
  const touchStartPos = useRef({ x: 0, y: 0 });

  // 롱프레스 타이머 시작 (1.0초 이상 꾹 누르고 있을 시 테마 토글)
  const startPress = (clientX, clientY) => {
    isLongPressRef.current = false;
    touchStartPos.current = { x: clientX, y: clientY };

    if (timerRef.current) clearTimeout(timerRef.current);

    timerRef.current = setTimeout(() => {
      isLongPressRef.current = true;
      // 진동 햅틱 피드백 (모바일 지원 기기)
      if (typeof navigator !== 'undefined' && navigator.vibrate) {
        try {
          navigator.vibrate(50);
        } catch (e) {
          // ignore
        }
      }
      if (onToggleTheme) {
        onToggleTheme();
      }
    }, 1000);
  };

  // 손가락 또는 마우스 뗐을 때
  const endPress = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    // 롱프레스가 아니었던 일반 탭(짧은 터치)일 때만 관리 기록 모달 오픈
    if (!isLongPressRef.current) {
      onOpenCareLogModal();
    }
    // 중복 클릭 이벤트 방지용 플래그 리셋 지연
    setTimeout(() => {
      isLongPressRef.current = false;
    }, 150);
  };

  // 터치 취소 (스크롤 또는 영역 벗어남)
  const cancelPress = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  };

  // 스크롤 시 오작동 방지
  const handleTouchMove = (e) => {
    if (!timerRef.current) return;
    const touch = e.touches[0];
    const dx = Math.abs(touch.clientX - touchStartPos.current.x);
    const dy = Math.abs(touch.clientY - touchStartPos.current.y);
    if (dx > 10 || dy > 10) {
      cancelPress();
    }
  };

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

      {/* 중앙 플로팅 버튼: 탭 시 관리추가 / 0.55초 롱프레스 시 나이트모드 전환 */}
      <button
        type="button"
        className="mobile-fab-btn"
        title="탭: 관리 기록 추가 / 0.6초 꾹 누름: 나이트 모드 전환"
        onTouchStart={(e) => startPress(e.touches[0].clientX, e.touches[0].clientY)}
        onTouchEnd={(e) => {
          e.preventDefault();
          endPress();
        }}
        onTouchMove={handleTouchMove}
        onTouchCancel={cancelPress}
        onMouseDown={(e) => startPress(e.clientX, e.clientY)}
        onMouseUp={() => endPress()}
        onMouseLeave={cancelPress}
        onContextMenu={(e) => e.preventDefault()}
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
