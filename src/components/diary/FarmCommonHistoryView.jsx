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
  ClipboardList
} from 'lucide-react';
import { 
  CARE_CATEGORIES, 
  getCategoryById, 
  normalizeCategoryId 
} from '../../lib/types.js';

export default function FarmCommonHistoryView({
  careLogs = [],
  careCategories,
  onOpenCareLogModal,
  onEditCareLog,
  onDeleteCareLog
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  const allCategories = careCategories || CARE_CATEGORIES;

  // 전체 관리기록 중 '농장 공통' 관리기록만 추출 (최신순 정렬)
  const farmCommonLogs = useMemo(() => {
    return (careLogs || [])
      .filter(l => l.isFarmCommon || (!l.entityId && l.entityName === '농장 공통') || (!l.tagNumber && !l.entityId))
      .sort((a, b) => new Date(b.date + ' ' + (b.time || '00:00')) - new Date(a.date + ' ' + (a.time || '00:00')));
  }, [careLogs]);

  // 검색어 및 카테고리 필터링
  const filteredLogs = useMemo(() => {
    return farmCommonLogs.filter(log => {
      // 1. 카테고리 필터
      if (selectedCategory !== 'all') {
        const normCat = normalizeCategoryId(log.category);
        if (normCat !== selectedCategory) return false;
      }

      // 2. 검색어 필터 (제목, 세부내용, 작업자, 날짜)
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
  }, [farmCommonLogs, selectedCategory, searchQuery]);

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

  return (
    <div className="farm-common-history-view" style={{ display: 'flex', flexDirection: 'column', gap: '1.15rem' }}>
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

      {/* 2. 검색 및 [+ 공통 기록 추가] 액션 바 */}
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

      {/* 3. 카테고리 필터 칩 바 */}
      <div style={{ display: 'flex', gap: '0.4rem', overflowX: 'auto', paddingBottom: '0.25rem' }}>
        <button
          type="button"
          onClick={() => setSelectedCategory('all')}
          style={{
            padding: '0.35rem 0.85rem',
            fontSize: '0.82rem',
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
          전체 ({farmCommonLogs.length})
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
                  padding: '0.35rem 0.85rem',
                  fontSize: '0.82rem',
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
          })}
      </div>

      {/* 4. 타임라인 카드 목록 */}
      {filteredLogs.length === 0 ? (
        <div className="empty-state card" style={{ padding: '3.5rem 1.5rem', textAlign: 'center', background: 'var(--bg-card)' }}>
          <ClipboardList size={40} strokeWidth={1.5} style={{ opacity: 0.45, marginBottom: '0.65rem', color: 'var(--text-muted)' }} />
          <p style={{ margin: 0, fontWeight: 700, fontSize: '0.98rem', color: 'var(--text-main)' }}>
            {searchQuery ? `"${searchQuery}" 검색 결과가 없습니다.` : '등록된 농장 공통 관리 기록이 없습니다.'}
          </p>
          <p style={{ margin: '0.45rem 0 0 0', fontSize: '0.84rem', color: 'var(--text-muted)' }}>
            축사 소독, 방역, 생석회 살포, 시설 청소 내역을 영농일지에 등록해보세요.
          </p>
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
                marginTop: '1.15rem',
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
                      {log.date}
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

                {/* 2행: 작업명 (굵고 선명한 텍스트) */}
                <div style={{ fontSize: '1.02rem', fontWeight: 800, color: 'var(--text-main)' }}>
                  {log.title}
                </div>

                {/* 3행: 세부 내용 (소독약품명, 살포량 등) */}
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
                    {log.details}
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
                      작업자: <strong>{log.operator}</strong>
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
