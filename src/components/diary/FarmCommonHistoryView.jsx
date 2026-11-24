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
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);

  // 오늘 날짜 및 최근 1달 전 기본값 (모달과 100% 동일 규격)
  const todayStr = useMemo(() => {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    const d = String(now.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }, []);

  const defaultStartDate = useMemo(() => {
    const now = new Date();
    now.setDate(now.getDate() - 30);
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    const d = String(now.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }, []);

  // 기본값: 최근 1달 (30일 전 ~ 오늘)
  const [startDate, setStartDate] = useState(defaultStartDate);
  const [endDate, setEndDate] = useState(todayStr);

  const allCategories = careCategories || CARE_CATEGORIES;

  // 전체 관리기록 중 '농장 공통' 관리기록만 추출 (최신순 정렬)
  const farmCommonLogs = useMemo(() => {
    return (careLogs || [])
      .filter(l => l.isFarmCommon || (!l.entityId && l.entityName === '농장 공통') || (!l.tagNumber && !l.entityId))
      .sort((a, b) => new Date(b.date + ' ' + (b.time || '00:00')) - new Date(a.date + ' ' + (a.time || '00:00')));
  }, [careLogs]);

  // 1. 선택된 조회 기간(startDate ~ endDate)에 해당하는 농장 관리기록 추출
  const periodFilteredLogs = useMemo(() => {
    return farmCommonLogs.filter(log => {
      if (startDate && log.date < startDate) return false;
      if (endDate && log.date > endDate) return false;
      return true;
    });
  }, [farmCommonLogs, startDate, endDate]);

  // 2. 기간 + 카테고리 + 검색어까지 모두 적용된 최종 표시 목록
  const filteredLogs = useMemo(() => {
    return periodFilteredLogs.filter(log => {
      // 카테고리 필터
      if (selectedCategory !== 'all') {
        const normCat = normalizeCategoryId(log.category);
        if (normCat !== selectedCategory) return false;
      }

      // 검색어 필터 (제목, 세부내용, 작업자, 날짜)
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
  }, [periodFilteredLogs, selectedCategory, searchQuery]);

  // 상단 요약 통계 (최근 소독일 + 이번 달 방역 횟수, 중복 건수 삭제)
  const stats = useMemo(() => {
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

    return { latestDate, latestDisinfectionDate, thisMonthDisinfections };
  }, [farmCommonLogs]);

  // 최근 1달 기본값 여부 확인
  const isDefaultPeriod = startDate === defaultStartDate && endDate === todayStr;

  // 퀵 태그 클릭 토글 핸들러
  const handleTagClick = (tag) => {
    if (searchQuery.trim() === tag) {
      setSearchQuery('');
    } else {
      setSearchQuery(tag);
    }
  };

  // 모든 필터 초기화
  const hasActiveFilters = searchQuery.trim() !== '' || selectedCategory !== 'all' || !isDefaultPeriod;
  const handleResetFilters = () => {
    setSearchQuery('');
    setSelectedCategory('all');
    setStartDate(defaultStartDate);
    setEndDate(todayStr);
  };

  return (
    <div className="farm-common-history-view" style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', paddingBottom: '85px' }}>
      {/* 1. 상단 슬림 방역 지표 바 (중복 건수 제거: 최근 소독일 & 이번 달 방역 횟수 2대 핵심 지표) */}
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between', 
        background: 'var(--bg-card)', 
        border: '1px solid var(--border-color)', 
        borderRadius: 'var(--radius-md)', 
        padding: '0.45rem 1rem',
        boxShadow: '0 1px 2px rgba(0,0,0,0.03)',
        gap: '0.75rem'
      }}>
        {/* 최근 소독일 */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', minWidth: 0 }}>
          <Droplets size={15} style={{ color: '#0284c7', flexShrink: 0 }} />
          <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)', fontWeight: 600, whiteSpace: 'nowrap' }}>
            최근 소독:
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

        {/* 이번 달 방역 횟수 (주 1회 법정 권장 지표) */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', minWidth: 0 }}>
          <ShieldCheck size={15} style={{ color: '#059669', flexShrink: 0 }} />
          <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)', fontWeight: 600, whiteSpace: 'nowrap' }}>
            이달 방역:
          </span>
          <strong style={{ fontSize: '0.92rem', color: '#059669', fontWeight: 800, whiteSpace: 'nowrap' }}>
            {stats.thisMonthDisinfections}회
          </strong>
        </div>
      </div>

      {/* 2. 전폭 검색창 (버튼 하단 이동으로 가로 100% 확보) */}
      <div className="search-input-group" style={{ position: 'relative', width: '100%' }}>
        <Search size={18} className="search-input-icon" />
        <input
          type="text"
          className="search-input"
          placeholder="작업명, 소독약품, 작업자 검색 (예: 안개분무, 생석회, 환풍기)"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={{ width: '100%', height: '42px', fontSize: '0.9rem' }}
        />
        {searchQuery && (
          <button
            type="button"
            onClick={() => setSearchQuery('')}
            style={{
              position: 'absolute',
              right: '0.85rem',
              top: '50%',
              transform: 'translateY(-50%)',
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              color: 'var(--text-muted)'
            }}
            title="검색어 지우기"
          >
            <X size={16} />
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

      {/* 4. 날짜 직접 선택 바 (모달과 100% 동일: 📅 클릭 시 1달 리셋, 시작일 ~ 종료일 지정) */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '0.45rem',
        padding: '0.4rem 0.65rem',
        background: 'var(--bg-card)',
        border: '1px solid var(--border-color)',
        borderRadius: 'var(--radius-md)'
      }}>
        {/* 좌측 📅 이모지 버튼: 클릭 시 최근 1달 기본값으로 복귀 */}
        <button
          type="button"
          onClick={() => {
            setStartDate(defaultStartDate);
            setEndDate(todayStr);
          }}
          title="클릭 시 기본 조회기간(최근 1달)으로 재설정"
          style={{
            background: 'none',
            border: 'none',
            padding: '0.2rem',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            borderRadius: 'var(--radius-sm)',
            color: isDefaultPeriod ? 'var(--text-muted)' : '#0284c7',
            transition: 'all 0.15s ease',
            flexShrink: 0
          }}
          onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.15)'}
          onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
        >
          <Calendar size={16} strokeWidth={isDefaultPeriod ? 2 : 2.5} />
        </button>

        <input 
          type="date"
          value={startDate}
          onChange={(e) => setStartDate(e.target.value)}
          style={{
            flex: '1 1 0px',
            minWidth: '105px',
            maxWidth: '140px',
            height: '30px',
            padding: '0.2rem 0.35rem',
            borderRadius: 'var(--radius-sm)',
            border: '1px solid var(--border-color)',
            background: 'var(--bg-page)',
            color: 'var(--text-main)',
            fontSize: '0.82rem',
            fontFamily: 'inherit',
            textAlign: 'center'
          }}
        />
        <span style={{ color: 'var(--text-muted)', fontSize: '0.82rem', flexShrink: 0 }}>~</span>
        <input 
          type="date"
          value={endDate}
          onChange={(e) => setEndDate(e.target.value)}
          style={{
            flex: '1 1 0px',
            minWidth: '105px',
            maxWidth: '140px',
            height: '30px',
            padding: '0.2rem 0.35rem',
            borderRadius: 'var(--radius-sm)',
            border: '1px solid var(--border-color)',
            background: 'var(--bg-page)',
            color: 'var(--text-main)',
            fontSize: '0.82rem',
            fontFamily: 'inherit',
            textAlign: 'center'
          }}
        />
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
          전체 ({periodFilteredLogs.length})
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
            const count = periodFilteredLogs.filter(l => normalizeCategoryId(l.category) === normId).length;
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
            {hasActiveFilters
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

      {/* 7. 하단 고정 액션 푸터 (방역대장 인쇄 & 관리 기록 추가) */}
      <div style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 100,
        background: 'var(--bg-card)',
        borderTop: '1px solid var(--border-color)',
        boxShadow: '0 -4px 14px rgba(0, 0, 0, 0.08)',
        padding: '0.65rem 1rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <div style={{
          maxWidth: '680px',
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          gap: '0.65rem'
        }}>
          {/* 🖨️ 방역대장 인쇄 버튼 (가축전염병예방법 별지 제6호서식 소독실시기록부 A4/PDF 인쇄) */}
          <button
            type="button"
            onClick={() => setIsPrintModalOpen(true)}
            title="가축전염병예방법 별지 제6호서식 소독실시기록부 A4 인쇄 / PDF 저장"
            style={{
              flex: 1,
              height: '44px',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.4rem',
              background: 'rgba(2, 132, 199, 0.08)',
              color: '#0284c7',
              border: '1.5px solid rgba(2, 132, 199, 0.3)',
              borderRadius: 'var(--radius-md)',
              fontWeight: 700,
              fontSize: '0.88rem',
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              transition: 'all 0.15s ease'
            }}
          >
            <Printer size={17} />
            <span>방역대장 인쇄</span>
          </button>

          {/* + 관리 기록 추가 버튼 */}
          {onOpenCareLogModal && (
            <button 
              type="button"
              onClick={() => onOpenCareLogModal('FARM_COMMON', todayStr, {
                isFarmCommon: true,
                entityId: 'FARM_COMMON',
                entityName: '농장 공통',
                category: selectedCategory !== 'all' ? selectedCategory : 'routine',
                date: todayStr
              })}
              style={{ 
                flex: 1,
                height: '44px',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.4rem',
                background: 'rgba(16, 185, 129, 0.14)',
                border: '1.5px solid #10b981',
                color: '#065f46',
                borderRadius: 'var(--radius-md)',
                fontWeight: 800,
                fontSize: '0.9rem',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                transition: 'all 0.15s ease'
              }}
              title="새로운 농장 관리 기록 등록"
            >
              <Plus size={18} color="#065f46" strokeWidth={2.5} />
              <span>관리 기록 추가</span>
            </button>
          )}
        </div>
      </div>

      {/* 8. 정부·HACCP 제출용 축사 소독·방역 관리대장 A4 인쇄 미리보기 모달 */}
      <FarmDisinfectionPrintModal
        isOpen={isPrintModalOpen}
        onClose={() => setIsPrintModalOpen(false)}
        logs={filteredLogs}
        farmSettings={farmSettings}
        startDate={startDate}
        endDate={endDate}
      />
    </div>
  );
}
