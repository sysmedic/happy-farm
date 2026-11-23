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
  Tag
} from 'lucide-react';
import { 
  CARE_CATEGORIES, 
  getCategoryById, 
  normalizeCategoryId 
} from '../../lib/types.js';

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

// 자주 찾는 농장 공통 작업 퀵 태그 추천
const QUICK_SEARCH_TAGS = [
  '안개분무',
  '생석회',
  '일제소독',
  '환풍기',
  '톱밥',
  '사료',
  '구충'
];

export default function FarmCommonHistoryView({
  careLogs = [],
  careCategories,
  onOpenCareLogModal,
  onEditCareLog,
  onDeleteCareLog
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [periodFilter, setPeriodFilter] = useState('all'); // 'all', '1m', '3m', 'year'

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

  // 상단 요약 통계
  const stats = useMemo(() => {
    const totalCount = farmCommonLogs.length;
    const latestDate = farmCommonLogs.length > 0 ? farmCommonLogs[0].date : '-';
    
    // 올해 누적 비용 계산
    const currentYear = new Date().getFullYear().toString();
    const yearlyCost = farmCommonLogs
      .filter(l => l.date && l.date.startsWith(currentYear))
      .reduce((acc, cur) => acc + (Number(cur.cost) || 0), 0);

    return { totalCount, latestDate, yearlyCost };
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

  return (
    <div className="farm-common-history-view" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      {/* 1. 상단 3단 미니 통계 대시보드 */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(3, 1fr)', 
        gap: '0.75rem' 
      }}>
        <div style={{ 
          background: 'var(--bg-card)', 
          border: '1px solid var(--border-color)', 
          borderRadius: 'var(--radius-md)', 
          padding: '0.85rem 1rem',
          boxShadow: 'var(--shadow-sm)'
        }}>
          <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600 }}>총 공통 작업</span>
          <div style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--text-main)', marginTop: '0.2rem' }}>
            {stats.totalCount} <span style={{ fontSize: '0.88rem', fontWeight: 600 }}>건</span>
          </div>
        </div>

        <div style={{ 
          background: 'var(--bg-card)', 
          border: '1px solid var(--border-color)', 
          borderRadius: 'var(--radius-md)', 
          padding: '0.85rem 1rem',
          boxShadow: 'var(--shadow-sm)'
        }}>
          <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600 }}>최근 소독·작업일</span>
          <div style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-main)', marginTop: '0.3rem' }}>
            {stats.latestDate}
          </div>
        </div>

        <div style={{ 
          background: 'var(--bg-card)', 
          border: '1px solid var(--border-color)', 
          borderRadius: 'var(--radius-md)', 
          padding: '0.85rem 1rem',
          boxShadow: 'var(--shadow-sm)'
        }}>
          <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600 }}>올해 소요 비용</span>
          <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#059669', marginTop: '0.25rem' }}>
            {stats.yearlyCost.toLocaleString()} <span style={{ fontSize: '0.88rem', fontWeight: 600 }}>원</span>
          </div>
        </div>
      </div>

      {/* 2. 검색창 및 [+ 공통 기록 추가] 액션 바 */}
      <div className="search-action-wrapper" style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
        <div className="search-input-group" style={{ flex: 1, position: 'relative' }}>
          <Search size={18} className="search-input-icon" />
          <input
            type="text"
            className="search-input"
            placeholder="작업명, 소독약품명, 작업자 또는 날짜 검색 (예: 안개분무, 생석회, 환풍기)"
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
            title="새로운 농장 공통 관리 기록 등록"
          >
            <Plus size={16} color="#065f46" strokeWidth={2.5} />
            <span>공통 기록 추가</span>
          </button>
        )}
      </div>

      {/* 3. 🏷️ 원터치 퀵 검색 추천 태그 칩 바 */}
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        gap: '0.35rem', 
        overflowX: 'auto', 
        paddingBottom: '0.15rem' 
      }}>
        <span style={{ 
          fontSize: '0.78rem', 
          fontWeight: 700, 
          color: 'var(--text-muted)', 
          display: 'inline-flex', 
          alignItems: 'center', 
          gap: '0.2rem',
          flexShrink: 0,
          marginRight: '0.2rem'
        }}>
          <Tag size={13} />
          추천 검색:
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
                background: isSelected ? 'rgba(2, 132, 199, 0.12)' : 'var(--bg-card-subtle)',
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

      {/* 4. 기간 필터 & 카테고리 필터 통합 툴바 */}
      <div style={{ 
        display: 'flex', 
        flexDirection: 'column', 
        gap: '0.5rem',
        background: 'var(--bg-card)',
        padding: '0.65rem 0.75rem',
        borderRadius: 'var(--radius-md)',
        border: '1px solid var(--border-color)'
      }}>
        {/* 상단: 기간 필터 탭 */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)', marginRight: '0.2rem' }}>
              조회 기간:
            </span>
            {[
              { id: 'all', label: '전체' },
              { id: '1m', label: '최근 1개월' },
              { id: '3m', label: '최근 3개월' },
              { id: 'year', label: `${new Date().getFullYear()}년 전체` }
            ].map(p => {
              const isSelected = periodFilter === p.id;
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setPeriodFilter(p.id)}
                  style={{
                    padding: '0.25rem 0.65rem',
                    fontSize: '0.8rem',
                    fontWeight: isSelected ? 800 : 600,
                    borderRadius: 'var(--radius-sm)',
                    border: isSelected ? '1px solid #10b981' : '1px solid transparent',
                    background: isSelected ? 'rgba(16, 185, 129, 0.12)' : 'transparent',
                    color: isSelected ? '#065f46' : 'var(--text-muted)',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease'
                  }}
                >
                  {p.label}
                </button>
              );
            })}
          </div>

          {/* 활성 필터 초기화 버튼 */}
          {hasActiveFilters && (
            <button
              type="button"
              onClick={handleResetFilters}
              style={{
                fontSize: '0.78rem',
                fontWeight: 700,
                color: '#dc2626',
                background: 'rgba(239, 68, 68, 0.08)',
                border: '1px solid rgba(239, 68, 68, 0.25)',
                padding: '0.2rem 0.55rem',
                borderRadius: 'var(--radius-sm)',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.25rem'
              }}
              title="검색어 및 모든 필터 초기화"
            >
              <RotateCcw size={12} />
              필터 초기화
            </button>
          )}
        </div>

        {/* 하단: 카테고리 필터 칩 바 */}
        <div style={{ display: 'flex', gap: '0.35rem', overflowX: 'auto', paddingTop: '0.2rem', borderTop: '1px dashed var(--border-color)' }}>
          <button
            type="button"
            onClick={() => setSelectedCategory('all')}
            style={{
              padding: '0.25rem 0.75rem',
              fontSize: '0.8rem',
              fontWeight: selectedCategory === 'all' ? 800 : 600,
              borderRadius: '9999px',
              border: selectedCategory === 'all' ? '1.5px solid #10b981' : '1px solid var(--border-color)',
              background: selectedCategory === 'all' ? 'rgba(16, 185, 129, 0.12)' : 'var(--bg-card-subtle)',
              color: selectedCategory === 'all' ? '#065f46' : 'var(--text-main)',
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              transition: 'all 0.15s ease'
            }}
          >
            전체 분류 ({farmCommonLogs.length})
          </button>
          {allCategories
            .filter(cat => ['routine', 'treatment', 'feed', 'etc'].includes(cat.id) || cat.isCustom)
            .map(cat => {
              const isSelected = selectedCategory === cat.id;
              const count = farmCommonLogs.filter(l => normalizeCategoryId(l.category) === cat.id).length;
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setSelectedCategory(cat.id)}
                  style={{
                    padding: '0.25rem 0.75rem',
                    fontSize: '0.8rem',
                    fontWeight: isSelected ? 800 : 600,
                    borderRadius: '9999px',
                    border: isSelected ? '1.5px solid #10b981' : '1px solid var(--border-color)',
                    background: isSelected ? 'rgba(16, 185, 129, 0.12)' : 'var(--bg-card-subtle)',
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
            })}
        </div>
      </div>

      {/* 5. 검색 결과 건수 안내 */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 0.2rem' }}>
        <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-muted)' }}>
          조회된 농장 기록 <strong style={{ color: 'var(--text-main)' }}>{filteredLogs.length}</strong>건
          {searchQuery && (
            <span style={{ marginLeft: '0.4rem', color: '#0284c7' }}>
              ("{searchQuery}" 검색 일치)
            </span>
          )}
        </span>
      </div>

      {/* 6. 타임라인 카드 목록 */}
      {filteredLogs.length === 0 ? (
        <div className="empty-state card" style={{ padding: '3.5rem 1.5rem', textAlign: 'center', background: 'var(--bg-card)' }}>
          <ClipboardList size={40} strokeWidth={1.5} style={{ opacity: 0.45, marginBottom: '0.65rem', color: 'var(--text-muted)' }} />
          <p style={{ margin: 0, fontWeight: 700, fontSize: '0.98rem', color: 'var(--text-main)' }}>
            {searchQuery || periodFilter !== 'all' || selectedCategory !== 'all'
              ? '조건에 맞는 농장 공통 관리 기록이 없습니다.' 
              : '등록된 농장 공통 관리 기록이 없습니다.'}
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
                <span>새 공통 기록 작성</span>
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

                {/* 4행: 작업자 및 소요 비용 메타 정보 */}
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
                  {log.operator && (
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
                      <User size={13} />
                      작업자: <strong><HighlightText text={log.operator} query={searchQuery} /></strong>
                    </span>
                  )}
                  {log.cost ? (
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', color: '#059669', fontWeight: 700 }}>
                      <DollarSign size={13} />
                      소요 비용: {Number(log.cost).toLocaleString()}원
                    </span>
                  ) : null}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
