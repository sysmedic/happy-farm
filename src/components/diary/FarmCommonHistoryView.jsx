import React, { useState, useMemo } from 'react';
import { 
  Search, 
  Plus, 
  Edit3, 
  Trash2, 
  Calendar, 
  Clock, 
  User, 
  DollarSign, 
  X,
  ClipboardList,
  RotateCcw,
  Sparkles,
  Tag,
  Droplets,
  Printer,
  ShieldCheck
} from 'lucide-react';
import { 
  CARE_CATEGORIES, 
  getCategoryById, 
  normalizeCategoryId 
} from '../../lib/types.js';
import FarmDisinfectionPrintModal from './FarmDisinfectionPrintModal.jsx';

// 텍스트 내 검색어 형광펜 하이라이트 컴포넌트
function HighlightText({ text, query }) {
  if (!text) return null;
  if (!query || !query.trim()) return <>{text}</>;

  const q = query.trim();
  const escaped = q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const parts = String(text).split(new RegExp(`(${escaped})`, 'gi'));

  return (
    <>
      {parts.map((part, i) => 
        part.toLowerCase() === q.toLowerCase() ? (
          <mark
            key={i}
            style={{
              background: '#fef08a',
              color: '#854d0e',
              padding: '0.05rem 0.25rem',
              borderRadius: '3px',
              fontWeight: 800
            }}
          >
            {part}
          </mark>
        ) : (
          part
        )
      )}
    </>
  );
}

// 자주 찾는 농장 관리 작업 퀵 태그 추천
const QUICK_SEARCH_TAGS = [
  '안개분무',
  '생석회',
  '톱밥교체',
  '급수조',
  '환풍기',
  '사료입고',
  '퇴비교반'
];

export default function FarmCommonHistoryView({
  careLogs = [],
  careCategories,
  farmSettings = {},
  onOpenCareLogModal,
  onEditCareLog,
  onDeleteCareLog
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [periodFilter, setPeriodFilter] = useState('all'); // 'all', '1m', '3m', 'year'
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);

  const allCategories = careCategories || CARE_CATEGORIES;

  // 전체 관리기록 중 '농장 공통' 관리기록만 추출 (최신순 정렬)
  const farmCommonLogs = useMemo(() => {
    return (careLogs || [])
      .filter(l => l.isFarmCommon || (!l.entityId && l.entityName === '농장 공통') || (!l.tagNumber && !l.entityId))
      .sort((a, b) => new Date(b.date + ' ' + (b.time || '00:00')) - new Date(a.date + ' ' + (a.time || '00:00')));
  }, [careLogs]);

  // 기간 필터 판단 헬퍼
  const isDateInPeriod = (dateStr, period) => {
    if (!dateStr || period === 'all') return true;
    const logDate = new Date(dateStr);
    if (isNaN(logDate.getTime())) return true;
    
    const now = new Date();
    if (period === '1m') {
      const oneMonthAgo = new Date(now);
      oneMonthAgo.setDate(now.getDate() - 30);
      return logDate >= oneMonthAgo;
    }
    if (period === '3m') {
      const threeMonthsAgo = new Date(now);
      threeMonthsAgo.setDate(now.getDate() - 90);
      return logDate >= threeMonthsAgo;
    }
    if (period === 'year') {
      const currentYear = now.getFullYear().toString();
      return dateStr.startsWith(currentYear);
    }
    return true;
  };

  // 검색어, 카테고리, 기간 필터링
  const filteredLogs = useMemo(() => {
    return farmCommonLogs.filter(log => {
      // 1. 기간 필터
      if (!isDateInPeriod(log.date, periodFilter)) {
        return false;
      }

      // 2. 카테고리 필터
      if (selectedCategory !== 'all') {
        const normCat = normalizeCategoryId(log.category);
        if (normCat !== selectedCategory) return false;
      }

      // 3. 검색어 필터 (제목, 세부내용, 작업자, 날짜)
      if (searchQuery.trim()) {
        const q = searchQuery.trim().toLowerCase();
        const matchTitle = (log.title || '').toLowerCase().includes(q);
        const matchDetails = (log.details || '').toLowerCase().includes(q);
        const matchOperator = (log.operator || '').toLowerCase().includes(q);
        const matchDate = (log.date || '').toLowerCase().includes(q);
        return matchTitle || matchDetails || matchOperator || matchDate;
      }

      return true;
    });
  }, [farmCommonLogs, periodFilter, selectedCategory, searchQuery]);

  // 상단 요약 통계 (총 건수 + 최근 소독일 + 이번 달 방역 횟수)
  const stats = useMemo(() => {
    const totalCount = farmCommonLogs.length;
    const latestDate = farmCommonLogs.length > 0 ? farmCommonLogs[0].date : '-';
    
    // 소독/방역 관련 기록 필터링
    const disinfectionLogs = farmCommonLogs.filter(l => {
      const text = `${l.title || ''} ${l.details || ''}`.toLowerCase();
      return text.includes('소독') || text.includes('방역') || text.includes('생석회') || text.includes('안개분무') || text.includes('버콘') || normalizeCategoryId(l.category) === 'routine';
    });
    const latestDisinfectionLog = disinfectionLogs[0];
    const latestDisinfectionDate = latestDisinfectionLog ? latestDisinfectionLog.date : latestDate;

    // 이번 달 방역 횟수 (주 1회 법정 방역 권장 지표)
    const now = new Date();
    const currentMonthPrefix = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    const thisMonthDisinfections = disinfectionLogs.filter(l => (l.date || '').startsWith(currentMonthPrefix)).length;

    return { totalCount, latestDate, latestDisinfectionDate, thisMonthDisinfections };
  }, [farmCommonLogs]);

  // 퀵 태그 클릭 토글 핸들러
  const handleTagClick = (tag) => {
    if (searchQuery.trim() === tag) {
      setSearchQuery('');
    } else {
      setSearchQuery(tag);
    }
  };

  // 모든 필터 초기화
  const hasActiveFilters = searchQuery.trim() !== '' || selectedCategory !== 'all' || periodFilter !== 'all';
  const handleResetFilters = () => {
    setSearchQuery('');
    setSelectedCategory('all');
    setPeriodFilter('all');
  };

  // 조회 기간 옵션 (순서: 1개월 -> 3개월 -> 올해 -> 전체, 기본 선택값은 '전체')
  const PERIOD_OPTIONS = [
    { id: '1m', label: '1개월' },
    { id: '3m', label: '3개월' },
    { id: 'year', label: `${new Date().getFullYear()}년` },
    { id: 'all', label: '전체' }
  ];

  return (
    <div className="farm-common-history-view" style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
      {/* 1. 상단 초슬림 방역·관리 통계 바 (비용 제외, 총건수·최근소독·이번달방역 3대 지표) */}
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between', 
        background: 'var(--bg-card)', 
        border: '1px solid var(--border-color)', 
        borderRadius: 'var(--radius-md)', 
        padding: '0.45rem 0.85rem',
        boxShadow: '0 1px 2px rgba(0,0,0,0.03)',
        gap: '0.4rem',
        overflowX: 'auto'
      }}>
        {/* 1) 관리기록 건수 */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', minWidth: 0 }}>
          <ClipboardList size={14} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600, whiteSpace: 'nowrap' }}>
            관리 기록
          </span>
          <strong style={{ fontSize: '0.92rem', color: 'var(--text-main)', fontWeight: 800 }}>
            {stats.totalCount}건
          </strong>
        </div>

        {/* 미니 구분선 */}
        <div style={{ width: '1px', height: '14px', background: 'var(--border-color)', flexShrink: 0 }} />

        {/* 2) 최근 소독일 */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', minWidth: 0 }}>
          <Droplets size={14} style={{ color: '#0284c7', flexShrink: 0 }} />
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600, whiteSpace: 'nowrap' }}>
            최근 소독
          </span>
          <strong style={{ 
            fontSize: '0.92rem', 
            color: '#0284c7', 
            fontWeight: 800,
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis'
          }}>
            {stats.latestDisinfectionDate}
          </strong>
        </div>

        {/* 미니 구분선 */}
        <div style={{ width: '1px', height: '14px', background: 'var(--border-color)', flexShrink: 0 }} />

        {/* 3) 이번 달 방역 횟수 (주 1회 법정 방역 점검 지표) */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', minWidth: 0 }}>
          <ShieldCheck size={14} style={{ color: '#059669', flexShrink: 0 }} />
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600, whiteSpace: 'nowrap' }}>
            이달 방역
          </span>
          <strong style={{ fontSize: '0.92rem', color: '#059669', fontWeight: 800, whiteSpace: 'nowrap' }}>
            {stats.thisMonthDisinfections}회
          </strong>
        </div>
      </div>

      {/* 2. 검색창 및 [방역대장 인쇄] / [+ 관리 기록 추가] 액션 바 */}
      <div className="search-action-wrapper" style={{ display: 'flex', gap: '0.45rem', alignItems: 'center', flexWrap: 'wrap' }}>
        <div className="search-input-group" style={{ flex: '1 1 200px', position: 'relative', minWidth: '180px' }}>
          <Search size={18} className="search-input-icon" />
          <input
            type="text"
            className="search-input"
            placeholder="작업명, 소독약품, 작업자 검색 (예: 안개분무, 생석회, 환풍기)"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              style={{
                position: 'absolute',
                right: '0.75rem',
                top: '50%',
                transform: 'translateY(-50%)',
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                color: 'var(--text-muted)'
              }}
              title="검색어 지우기"
            >
              <X size={15} />
            </button>
          )}
        </div>

        {/* 🖨️ 방역대장 인쇄 버튼 (HACCP/정부 점검 제출용 공식 서식 출력) */}
        <button
          type="button"
          onClick={() => setIsPrintModalOpen(true)}
          title="축사 소독·방역 관리대장 A4 규격 인쇄 / PDF 저장"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.35rem',
            background: 'rgba(2, 132, 199, 0.08)',
            color: '#0284c7',
            border: '1px solid rgba(2, 132, 199, 0.28)',
            borderRadius: 'var(--radius-md)',
            height: '40px',
            padding: '0 0.85rem',
            fontWeight: 700,
            fontSize: '0.85rem',
            cursor: 'pointer',
            whiteSpace: 'nowrap',
            flexShrink: 0,
            transition: 'all 0.15s ease'
          }}
        >
          <Printer size={16} />
          <span>방역대장 인쇄</span>
        </button>

        {onOpenCareLogModal && (
          <button 
            type="button"
            className="btn"
            onClick={() => onOpenCareLogModal('FARM_COMMON', null, {
              isFarmCommon: true,
              entityId: 'FARM_COMMON',
              entityName: '농장 공통'
            })}
            style={{ 
              whiteSpace: 'nowrap', 
              flexShrink: 0,
              fontWeight: 700,
              background: 'rgba(16, 185, 129, 0.14)',
              border: '1.5px solid #10b981',
              color: '#065f46',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.35rem',
              borderRadius: 'var(--radius-sm)',
              boxShadow: 'var(--shadow-sm)',
              height: '40px',
              padding: '0 0.95rem'
            }}
            title="새로운 농장 관리 기록 등록"
          >
            <Plus size={16} color="#065f46" strokeWidth={2.5} />
            <span>관리 기록 추가</span>
          </button>
        )}
      </div>

      {/* 3. 🏷️ 추천 검색 퀵 태그 바 (무박스 슬림 가로 스크롤) */}
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        gap: '0.35rem', 
        overflowX: 'auto', 
        paddingBottom: '0.1rem' 
      }}>
        <span style={{ 
          fontSize: '0.78rem', 
          fontWeight: 700, 
          color: 'var(--text-muted)', 
          display: 'inline-flex', 
          alignItems: 'center', 
          gap: '0.2rem',
          flexShrink: 0,
          marginRight: '0.15rem'
        }}>
          <Tag size={13} />
          추천:
        </span>
        {QUICK_SEARCH_TAGS.map(tag => {
          const isSelected = searchQuery.trim() === tag;
          return (
            <button
              key={tag}
              type="button"
              onClick={() => handleTagClick(tag)}
              style={{
                fontSize: '0.78rem',
                fontWeight: isSelected ? 800 : 600,
                padding: '0.2rem 0.55rem',
                borderRadius: 'var(--radius-sm)',
                border: isSelected ? '1px solid #0284c7' : '1px solid var(--border-color)',
                background: isSelected ? 'rgba(2, 132, 199, 0.12)' : 'var(--bg-card)',
                color: isSelected ? '#0284c7' : 'var(--text-muted)',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                transition: 'all 0.15s ease'
              }}
            >
              #{tag}
            </button>
          );
        })}
      </div>

      {/* 4. 조회 기간 세그먼트 (순서: 1개월 ➔ 3개월 ➔ 올해 ➔ 전체, 4등분 균등 핏, 줄바꿈 없음) */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(4, 1fr)', 
        gap: '0.25rem',
        background: 'var(--bg-card-subtle)',
        padding: '0.25rem',
        borderRadius: 'var(--radius-sm)',
        border: '1px solid var(--border-color)'
      }}>
        {PERIOD_OPTIONS.map(p => {
          const isSelected = periodFilter === p.id;
          return (
            <button
              key={p.id}
              type="button"
              onClick={() => setPeriodFilter(p.id)}
              style={{
                padding: '0.4rem 0.2rem',
                fontSize: '0.82rem',
                fontWeight: isSelected ? 800 : 600,
                borderRadius: 'var(--radius-sm)',
                border: isSelected ? '1px solid #10b981' : '1px solid transparent',
                background: isSelected ? '#10b981' : 'transparent',
                color: isSelected ? '#ffffff' : 'var(--text-muted)',
                boxShadow: isSelected ? '0 1px 3px rgba(16, 185, 129, 0.25)' : 'none',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                textAlign: 'center',
                transition: 'all 0.15s ease'
              }}
            >
              {p.label}
            </button>
          );
        })}
      </div>

      {/* 5. 카테고리 필터 칩 바 (가로 스크롤) */}
      <div style={{ display: 'flex', gap: '0.35rem', overflowX: 'auto', paddingBottom: '0.15rem' }}>
        <button
          type="button"
          onClick={() => setSelectedCategory('all')}
          style={{
            padding: '0.25rem 0.75rem',
            fontSize: '0.8rem',
            fontWeight: selectedCategory === 'all' ? 800 : 600,
            borderRadius: '9999px',
            border: selectedCategory === 'all' ? '1.5px solid #10b981' : '1px solid var(--border-color)',
            background: selectedCategory === 'all' ? 'rgba(16, 185, 129, 0.12)' : 'var(--bg-card)',
            color: selectedCategory === 'all' ? '#065f46' : 'var(--text-main)',
            cursor: 'pointer',
            whiteSpace: 'nowrap',
            transition: 'all 0.15s ease'
          }}
        >
          전체 분류 ({farmCommonLogs.length})
        </button>
        {/* 농장 공통 4대 표준 분류 (방역소독, 시설환경, 사료자재, 퇴비기타) 및 커스텀 분류 */}
        {(() => {
          const standardOrder = ['routine', 'facility', 'feed', 'other'];
          const filtered = allCategories.filter(cat => {
            const norm = normalizeCategoryId(cat.id);
            return standardOrder.includes(norm) || cat.isCustom;
          });
          // 표준 4대 분류 우선 순위 정렬
          filtered.sort((a, b) => {
            const idxA = standardOrder.indexOf(normalizeCategoryId(a.id));
            const idxB = standardOrder.indexOf(normalizeCategoryId(b.id));
            if (idxA !== -1 && idxB !== -1) return idxA - idxB;
            if (idxA !== -1) return -1;
            if (idxB !== -1) return 1;
            return 0;
          });

          return filtered.map(cat => {
            const normId = normalizeCategoryId(cat.id);
            const isSelected = selectedCategory === normId || selectedCategory === cat.id;
            const count = farmCommonLogs.filter(l => normalizeCategoryId(l.category) === normId).length;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => setSelectedCategory(isSelected ? 'all' : normId)}
                style={{
                  padding: '0.25rem 0.75rem',
                  fontSize: '0.8rem',
                  fontWeight: isSelected ? 800 : 600,
                  borderRadius: '9999px',
                  border: isSelected ? '1.5px solid #10b981' : '1px solid var(--border-color)',
                  background: isSelected ? 'rgba(16, 185, 129, 0.12)' : 'var(--bg-card)',
                  color: isSelected ? '#065f46' : 'var(--text-main)',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.3rem',
                  transition: 'all 0.15s ease'
                }}
              >
                {cat.icon && <span>{cat.icon}</span>}
                <span>{cat.label} ({count})</span>
              </button>
            );
          });
        })()}
      </div>

      {/* 6. 검색 결과 건수 안내 및 우측 [필터 초기화] 링크 */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 0.2rem' }}>
        <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-muted)' }}>
          조회된 농장 기록 <strong style={{ color: 'var(--text-main)' }}>{filteredLogs.length}</strong>건
          {searchQuery && (
            <span style={{ marginLeft: '0.35rem', color: '#0284c7' }}>
              ("{searchQuery}" 검색 일치)
            </span>
          )}
        </span>

        {hasActiveFilters && (
          <button
            type="button"
            onClick={handleResetFilters}
            style={{
              fontSize: '0.78rem',
              fontWeight: 700,
              color: '#dc2626',
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.25rem',
              padding: '0.2rem 0.35rem'
            }}
            title="검색어 및 모든 필터 초기화"
          >
            <RotateCcw size={12} />
            <span>필터 초기화</span>
          </button>
        )}
      </div>

      {/* 6. 타임라인 카드 목록 */}
      {filteredLogs.length === 0 ? (
        <div className="empty-state card" style={{ padding: '3.5rem 1.5rem', textAlign: 'center', background: 'var(--bg-card)' }}>
          <ClipboardList size={40} strokeWidth={1.5} style={{ opacity: 0.45, marginBottom: '0.65rem', color: 'var(--text-muted)' }} />
          <p style={{ margin: 0, fontWeight: 700, fontSize: '0.98rem', color: 'var(--text-main)' }}>
            {searchQuery || periodFilter !== 'all' || selectedCategory !== 'all'
              ? '조건에 맞는 농장 관리 기록이 없습니다.' 
              : '등록된 농장 관리 기록이 없습니다.'}
          </p>
          <p style={{ margin: '0.45rem 0 0 0', fontSize: '0.84rem', color: 'var(--text-muted)' }}>
            축사 소독, 방역, 생석회 살포, 시설 청소 내역을 등록하여 관리해보세요.
          </p>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem', marginTop: '1.15rem' }}>
            {hasActiveFilters && (
              <button
                type="button"
                className="btn btn-sm btn-outline"
                onClick={handleResetFilters}
                style={{ fontWeight: 700 }}
              >
                필터 초기화
              </button>
            )}
            {onOpenCareLogModal && (
              <button
                type="button"
                className="btn btn-sm"
                onClick={() => onOpenCareLogModal('FARM_COMMON', null, {
                  isFarmCommon: true,
                  entityId: 'FARM_COMMON',
                  entityName: '농장 공통'
                })}
                style={{
                  background: 'rgba(16, 185, 129, 0.14)',
                  border: '1.5px solid #10b981',
                  color: '#065f46',
                  fontWeight: 700,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                  padding: '0.5rem 1rem'
                }}
              >
                <Plus size={15} />
                <span>새 관리 기록 작성</span>
              </button>
            )}
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {filteredLogs.map(log => {
            const catObj = getCategoryById(log.category, careCategories);
            return (
              <div 
                key={log.id}
                className="card"
                style={{
                  padding: '0.95rem 1.15rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.5rem',
                  background: 'var(--bg-card)',
                  border: '1px solid var(--border-color)',
                  borderRadius: 'var(--radius-md)',
                  boxShadow: 'var(--shadow-sm)'
                }}
              >
                {/* 1행: 날짜 & 시간, 카테고리 뱃지 <──────────> 수정/삭제 버튼 */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.55rem', flexWrap: 'wrap' }}>
                    <span style={{ 
                      fontSize: '0.92rem', 
                      fontWeight: 800, 
                      color: 'var(--text-main)', 
                      display: 'inline-flex', 
                      alignItems: 'center', 
                      gap: '0.3rem' 
                    }}>
                      <Calendar size={14} style={{ opacity: 0.7 }} />
                      <HighlightText text={log.date} query={searchQuery} />
                    </span>
                    {log.time && (
                      <span style={{ fontSize: '0.84rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                        {log.time}
                      </span>
                    )}
                    <span 
                      className={`badge ${catObj.badgeClass}`}
                      style={{
                        fontSize: '0.72rem',
                        padding: '0.15rem 0.55rem',
                        borderRadius: '9999px',
                        fontWeight: 700,
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.2rem'
                      }}
                    >
                      {catObj.icon && <span>{catObj.icon}</span>}
                      <span>{catObj.label}</span>
                    </span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', flexShrink: 0 }}>
                    {onEditCareLog && (
                      <button
                        type="button"
                        className="btn btn-outline btn-sm btn-icon-only"
                        onClick={() => onEditCareLog(log)}
                        title="이 기록 수정"
                        style={{ width: '28px', height: '28px', padding: 0 }}
                      >
                        <Edit3 size={13} />
                      </button>
                    )}
                    {onDeleteCareLog && (
                      <button
                        type="button"
                        className="btn btn-outline btn-sm btn-icon-only"
                        onClick={() => onDeleteCareLog(log.id)}
                        title="이 기록 삭제"
                        style={{ width: '28px', height: '28px', padding: 0, color: 'var(--color-danger)' }}
                      >
                        <Trash2 size={13} />
                      </button>
                    )}
                  </div>
                </div>

                {/* 2행: 작업명 (굵고 선명한 텍스트 + 하이라이트) */}
                <div style={{ fontSize: '1.02rem', fontWeight: 800, color: 'var(--text-main)' }}>
                  <HighlightText text={log.title} query={searchQuery} />
                </div>

                {/* 3행: 세부 내용 (소독약품명, 살포량 등 + 하이라이트) */}
                {log.details && (
                  <div style={{ 
                    fontSize: '0.86rem', 
                    color: 'var(--text-main)', 
                    background: 'var(--bg-card-subtle)', 
                    padding: '0.5rem 0.75rem', 
                    borderRadius: 'var(--radius-sm)',
                    lineHeight: 1.5,
                    whiteSpace: 'pre-wrap'
                  }}>
                    <HighlightText text={log.details} query={searchQuery} />
                  </div>
                )}

                {/* 4행: 작업자 메타 정보 (비용 제외) */}
                {log.operator && (
                  <div style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '1rem', 
                    fontSize: '0.8rem', 
                    color: 'var(--text-muted)',
                    borderTop: '1px solid var(--border-color)',
                    paddingTop: '0.45rem',
                    marginTop: '0.2rem',
                    flexWrap: 'wrap'
                  }}>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
                      <User size={13} />
                      작업자: <strong><HighlightText text={log.operator} query={searchQuery} /></strong>
                    </span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* 7. 정부·HACCP 제출용 축사 소독·방역 관리대장 A4 인쇄 미리보기 모달 */}
      <FarmDisinfectionPrintModal
        isOpen={isPrintModalOpen}
        onClose={() => setIsPrintModalOpen(false)}
        logs={filteredLogs}
        farmSettings={farmSettings}
      />
    </div>
  );
}
