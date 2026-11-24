import React, { useState, useMemo } from 'react';
import { 
  Plus, 
  Edit3, 
  ChevronLeft, 
  Calendar, 
  ClipboardList
} from 'lucide-react';
import { 
  CARE_CATEGORIES, 
  getCategoryById, 
  normalizeCategoryId,
  FARM_COMMON_CATEGORY_IDS,
  ENTITY_ONLY_CATEGORY_IDS
} from '../../lib/types.js';

export default function FarmCommonHistoryModal({
  isOpen,
  onClose,
  careLogs = [],
  schedules = [],
  careCategories,
  onOpenCareLogModal,
  onEditCareLog,
  onDeleteCareLog,
  onEditSchedule
}) {
  // 기본 선택: 전체 분류
  const [selectedCategory, setSelectedCategory] = useState('all');

  // 오늘 날짜 및 최근 1달 전 기본값
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

  // 1. 전체 관리기록 중 '농장 공통' 관리기록만 추출 (최신순 정렬)
  const farmCommonLogs = useMemo(() => {
    return (careLogs || [])
      .filter(l => l.isFarmCommon || (!l.entityId && l.entityName === '농장 공통') || (!l.tagNumber && !l.entityId))
      .sort((a, b) => new Date(b.date + ' ' + (b.time || '00:00')) - new Date(a.date + ' ' + (a.time || '00:00')));
  }, [careLogs]);

  // 2. 농장 공통 차기 예정 일정 1건 추출 (미완료 + 오늘 이후 가장 빠른 일정)
  const upcomingSchedule = useMemo(() => {
    const list = (schedules || [])
      .filter(s => {
        const isCommon = s.isFarmCommon || (!s.entityId && s.entityName === '농장 공통') || (!s.tagNumber && !s.entityId);
        return isCommon && !s.completed;
      })
      .sort((a, b) => new Date(a.date + ' ' + (a.time || '00:00')) - new Date(b.date + ' ' + (b.time || '00:00')));

    return list.length > 0 ? list[0] : null;
  }, [schedules]);

  // D-day 계산 함수
  const getDdayBadge = (dateStr) => {
    if (!dateStr) return '';
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const target = new Date(dateStr);
    target.setHours(0, 0, 0, 0);
    const diff = Math.ceil((target - today) / (1000 * 60 * 60 * 24));
    if (diff === 0) return 'D-Day';
    if (diff > 0) return `D-${diff}`;
    return `D+${Math.abs(diff)}`;
  };

  // 3. 선택된 조회 기간(startDate ~ endDate)에 해당하는 농장 관리기록 추출
  const periodFilteredLogs = useMemo(() => {
    return farmCommonLogs.filter(log => {
      if (startDate && log.date < startDate) return false;
      if (endDate && log.date > endDate) return false;
      return true;
    });
  }, [farmCommonLogs, startDate, endDate]);

  // 4. 기간 + 카테고리까지 모두 적용된 최종 표시 목록
  const filteredLogs = useMemo(() => {
    if (selectedCategory === 'all') return periodFilteredLogs;
    return periodFilteredLogs.filter(log => {
      const normCat = normalizeCategoryId(log.category);
      return normCat === selectedCategory;
    });
  }, [periodFilteredLogs, selectedCategory]);

  // 5. 대시보드 칩에 표시할 '선택 조회 기간 내' 카테고리별 건수 집계
  const categoryCounts = useMemo(() => {
    const counts = {};
    allCategories.forEach(cat => {
      counts[cat.id] = 0;
    });
    periodFilteredLogs.forEach(log => {
      const normCat = normalizeCategoryId(log.category);
      if (counts[normCat] !== undefined) {
        counts[normCat]++;
      }
    });
    return counts;
  }, [periodFilteredLogs, allCategories]);

  // 6. 농장 관리 카테고리 칩 목록:
  // - 개체 전용 분류(진료치료 treatment, 백신 vaccine 등)는 완전 제외!
  // - 농장 4대 표준 분류(방역소독 routine, 시설환경 facility, 사료자재 feed, 퇴비기타 other) 기본 노출
  // - 농장 관리 신규 칩(커스텀 카테고리 등)이 추가될 경우 자동으로 칩에 배치!
  const activeCategories = useMemo(() => {
    return allCategories.filter(cat => {
      // 개체 전용 분류(진료치료, 백신, 체중, 번식 관련 등)는 농장 관리 칩에서 제외
      if (ENTITY_ONLY_CATEGORY_IDS && ENTITY_ONLY_CATEGORY_IDS.has(cat.id)) {
        return false;
      }
      // 농장 4대 표준 분류 또는 신규 추가된 커스텀 카테고리 또는 농장 기록이 있는 카테고리
      const isFarmStandard = FARM_COMMON_CATEGORY_IDS 
        ? FARM_COMMON_CATEGORY_IDS.has(cat.id) 
        : ['routine', 'facility', 'feed', 'other'].includes(cat.id);
      const isCustom = Boolean(cat.isCustom);
      const hasLogs = (categoryCounts[cat.id] || 0) > 0;
      return isFarmStandard || isCustom || hasLogs;
    }).sort((a, b) => {
      // 농장 관리 핵심 순서: 방역소독(1) -> 시설환경(2) -> 사료자재(3) -> 퇴비기타(4), 이후 추가 칩은 순서대로 배치
      const standardOrder = { routine: 1, facility: 2, feed: 3, other: 4 };
      const orderA = standardOrder[a.id] || 99;
      const orderB = standardOrder[b.id] || 99;
      return orderA - orderB;
    });
  }, [allCategories, categoryCounts]);

  // 최근 1달 기본값 여부 확인
  const isDefaultPeriod = startDate === defaultStartDate && endDate === todayStr;

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose} role="dialog" aria-modal="true">
      <div 
        className="modal-content modal-content-lg" 
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: '640px', width: '100%', maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}
      >
        {/* 1. 모달 헤더: X버튼 제거, '농장 관리 내역' 타이틀 단독 배치 */}
        <div className="modal-header" style={{ justifyContent: 'center', position: 'relative', padding: '0.95rem 1rem' }}>
          <div className="modal-header-title" style={{ textAlign: 'center', width: '100%' }}>
            <span style={{ fontWeight: 800, fontSize: '1.2rem', color: 'var(--text-main)', letterSpacing: '-0.02em' }}>
              농장 관리 내역
            </span>
          </div>
        </div>

        {/* 2. 서브 헤더 필터 바 (1단: 조회기간 상시 노출, 2단: 관리 내역 뱃지 3열 그리드) */}
        <div style={{
          padding: '0.65rem 1rem',
          background: 'var(--bg-card-subtle)',
          borderBottom: '1px solid var(--border-color)',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.55rem'
        }}>
          {/* 1단: 기간 선택창 (좌측 📅 클릭 시 최근 1달 리셋, 우측 텍스트/박스 제거) */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.4rem',
            padding: '0.35rem 0.6rem',
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
                minWidth: '100px',
                maxWidth: '135px',
                padding: '0.2rem 0.3rem',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--border-color)',
                background: 'var(--bg-page)',
                color: 'var(--text-main)',
                fontSize: '0.78rem',
                fontFamily: 'inherit',
                textAlign: 'center'
              }}
            />
            <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem', flexShrink: 0 }}>~</span>
            <input 
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              style={{
                flex: '1 1 0px',
                minWidth: '100px',
                maxWidth: '135px',
                padding: '0.2rem 0.3rem',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--border-color)',
                background: 'var(--bg-page)',
                color: 'var(--text-main)',
                fontSize: '0.78rem',
                fontFamily: 'inherit',
                textAlign: 'center'
              }}
            />
          </div>

          {/* 2단: 종목별 대시보드 칩 (관리분류 선택과 동일한 알약 캡슐 & 에메랄드 틴트 컬러 적용) */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: '0.45rem'
          }}>
            {/* 전체 캡슐 (선택 기간 내 건수) */}
            {(() => {
              const isSelected = selectedCategory === 'all';
              return (
                <button
                  type="button"
                  onClick={() => setSelectedCategory('all')}
                  title="전체 분류 보기"
                  style={{
                    position: 'relative',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.3rem',
                    padding: '0.45rem 0.35rem',
                    height: '38px',
                    borderRadius: '9999px',
                    border: isSelected ? '1.5px solid #10b981' : '1px solid var(--border-color)',
                    background: isSelected ? 'rgba(16, 185, 129, 0.12)' : 'var(--bg-card)',
                    color: isSelected ? '#059669' : 'var(--text-main)',
                    fontWeight: isSelected ? 700 : 600,
                    fontSize: '0.82rem',
                    cursor: 'pointer',
                    boxShadow: isSelected ? '0 1px 4px rgba(16, 185, 129, 0.2)' : 'none',
                    transition: 'all 0.15s ease',
                    whiteSpace: 'nowrap',
                    minWidth: 0,
                    width: '100%'
                  }}
                >
                  <span>전체</span>
                  <span style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '0.1rem 0.4rem',
                    borderRadius: '9999px',
                    fontSize: '0.74rem',
                    fontWeight: isSelected ? 800 : 600,
                    background: isSelected ? 'rgba(16, 185, 129, 0.25)' : 'rgba(0, 0, 0, 0.06)',
                    color: isSelected ? '#047857' : 'var(--text-muted)',
                    marginLeft: '0.15rem'
                  }}>
                    {periodFilteredLogs.length}
                  </span>
                </button>
              );
            })()}

            {/* 개별 카테고리 칩 (선택 기간 내 건수) */}
            {activeCategories.map(cat => {
              const count = categoryCounts[cat.id] || 0;
              const isSelected = selectedCategory === cat.id;

              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setSelectedCategory(cat.id)}
                  title={`${cat.label} 관리 내역만 보기`}
                  style={{
                    position: 'relative',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.25rem',
                    padding: '0.45rem 0.35rem',
                    height: '38px',
                    borderRadius: '9999px',
                    border: isSelected ? '1.5px solid #10b981' : '1px solid var(--border-color)',
                    background: isSelected ? 'rgba(16, 185, 129, 0.12)' : 'var(--bg-card)',
                    color: isSelected ? '#059669' : 'var(--text-main)',
                    fontWeight: isSelected ? 700 : 600,
                    fontSize: '0.82rem',
                    cursor: 'pointer',
                    boxShadow: isSelected ? '0 1px 4px rgba(16, 185, 129, 0.2)' : 'none',
                    transition: 'all 0.15s ease',
                    whiteSpace: 'nowrap',
                    minWidth: 0,
                    width: '100%'
                  }}
                >
                  {cat.icon && <span style={{ fontSize: '0.88rem' }}>{cat.icon}</span>}
                  <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{cat.label}</span>
                  <span style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '0.1rem 0.4rem',
                    borderRadius: '9999px',
                    fontSize: '0.74rem',
                    fontWeight: isSelected ? 800 : 600,
                    background: isSelected ? 'rgba(16, 185, 129, 0.25)' : 'rgba(0, 0, 0, 0.06)',
                    color: isSelected ? '#047857' : 'var(--text-muted)',
                    marginLeft: '0.15rem'
                  }}>
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* 3. 모달 본문 (스크롤 영역) */}
        <div className="modal-body" style={{ padding: '0.85rem 1rem', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
          
          {/* ⭐ 다음 예정 일정 스마트 배너 (농장 공통 예정 일정이 있을 때 최상단 노출) */}
          {upcomingSchedule && (
            <div 
              style={{ 
                padding: '0.55rem 0.75rem',
                background: 'rgba(245, 158, 11, 0.08)',
                border: '1px solid rgba(245, 158, 11, 0.3)',
                borderRadius: 'var(--radius-md)',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.2rem',
                boxShadow: 'var(--shadow-sm)'
              }}
            >
              {/* 1단: 다음 일정 날짜/시간 + D-day + 틴트 수정 버튼 */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '0.5rem',
                width: '100%'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', minWidth: 0, flex: 1 }}>
                  <span style={{
                    fontSize: '0.78rem',
                    color: '#d97706',
                    fontWeight: 700,
                    letterSpacing: '-0.01em',
                    whiteSpace: 'nowrap'
                  }}>
                    다음 일정: {upcomingSchedule.date}{upcomingSchedule.time ? ` - ${upcomingSchedule.time}` : ''}
                  </span>
                  <span style={{
                    fontSize: '0.72rem',
                    background: '#f59e0b',
                    color: '#ffffff',
                    padding: '0.1rem 0.4rem',
                    borderRadius: '4px',
                    fontWeight: 800,
                    whiteSpace: 'nowrap'
                  }}>
                    {getDdayBadge(upcomingSchedule.date)}
                  </span>
                </div>

                {onEditSchedule && (
                  <button
                    type="button"
                    onClick={() => onEditSchedule(upcomingSchedule)}
                    title="이 예정 일정 변경"
                    style={{
                      width: '26px',
                      height: '26px',
                      padding: 0,
                      flexShrink: 0,
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      border: '1px solid rgba(2, 132, 199, 0.3)',
                      color: '#0284c7',
                      background: 'rgba(2, 132, 199, 0.08)',
                      borderRadius: 'var(--radius-sm)',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    <Edit3 size={13} />
                  </button>
                )}
              </div>

              {/* 2단: 예정 작업명 */}
              <div style={{
                fontSize: '0.88rem',
                fontWeight: 700,
                color: 'var(--text-main)',
                opacity: 0.9,
                lineHeight: 1.35,
                wordBreak: 'break-word'
              }}>
                {upcomingSchedule.title}
              </div>
            </div>
          )}

          {/* 타임라인 카드 목록 */}
          {filteredLogs.length === 0 ? (
            <div style={{ 
              textAlign: 'center', 
              padding: '3rem 1rem', 
              color: 'var(--text-muted)',
              background: 'var(--bg-card-subtle)',
              borderRadius: 'var(--radius-lg)'
            }}>
              <ClipboardList size={38} style={{ opacity: 0.3, marginBottom: '0.65rem' }} />
              <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>
                선택하신 기간 내 등록된 농장 관리 기록이 없습니다.
              </div>
              <p style={{ fontSize: '0.825rem', marginTop: '0.35rem' }}>
                <button 
                  type="button" 
                  onClick={() => {
                    setStartDate('');
                    setEndDate('');
                  }}
                  style={{ 
                    background: 'none', 
                    border: 'none', 
                    color: '#0284c7', 
                    textDecoration: 'underline', 
                    cursor: 'pointer',
                    fontWeight: 700,
                    fontSize: '0.825rem'
                  }}
                >
                  전체 기간 기록 보기
                </button>
              </p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
              {filteredLogs.map(log => {
                const catObj = getCategoryById(log.category, careCategories);

                return (
                  <div 
                    key={log.id} 
                    style={{
                      background: 'var(--bg-card)',
                      border: '1px solid var(--border-color)',
                      borderRadius: 'var(--radius-md)',
                      padding: '0.55rem 0.75rem',
                      boxShadow: 'var(--shadow-sm)',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    {/* 1행: [관리분류 뱃지] + [날짜 시간] (좌측) & [✏️ 틴트 수정] 액션 버튼 (우측) */}
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: '0.5rem',
                      marginBottom: '0.3rem',
                      width: '100%'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.55rem', minWidth: 0, flex: 1, height: '24px' }}>
                        <span 
                          className={`badge ${catObj.badgeClass}`} 
                          style={{ 
                            flexShrink: 0, 
                            borderRadius: '9999px', 
                            padding: '0 0.55rem', 
                            height: '24px',
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '0.28rem',
                            fontSize: '0.76rem', 
                            fontWeight: 700,
                            lineHeight: 1,
                            boxSizing: 'border-box'
                          }}
                        >
                          {catObj.icon && <span style={{ fontSize: '0.8rem', lineHeight: 1, display: 'inline-flex', alignItems: 'center' }}>{catObj.icon}</span>}
                          <span style={{ lineHeight: 1, display: 'inline-flex', alignItems: 'center' }}>{catObj.label}</span>
                        </span>
                        <span style={{
                          fontWeight: 700,
                          fontSize: '0.88rem',
                          whiteSpace: 'nowrap',
                          flexShrink: 0,
                          display: 'inline-flex',
                          alignItems: 'center',
                          height: '24px',
                          gap: '0.35rem',
                          lineHeight: 1
                        }}>
                          <span style={{ color: 'var(--text-main)', opacity: 0.85, lineHeight: 1 }}>
                            {log.date}
                          </span>
                          {log.time && (
                            <span style={{ fontWeight: 700, fontSize: '0.84rem', color: 'var(--text-muted)', lineHeight: 1 }}>
                              {log.time}
                            </span>
                          )}
                        </span>
                      </div>

                      {/* 에메랄드 틴트 수정 버튼: 터치 시 바로 수정 모달 오픈 */}
                      <div style={{ display: 'flex', alignItems: 'center', flexShrink: 0 }}>
                        {onEditCareLog && (
                          <button
                            type="button"
                            onClick={() => onEditCareLog(log)}
                            title="관리 기록 수정"
                            style={{
                              width: '26px',
                              height: '26px',
                              padding: 0,
                              flexShrink: 0,
                              display: 'inline-flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              border: '1px solid rgba(16, 185, 129, 0.3)',
                              color: '#059669',
                              background: 'rgba(16, 185, 129, 0.08)',
                              borderRadius: 'var(--radius-sm)',
                              cursor: 'pointer',
                              transition: 'all 0.15s ease'
                            }}
                          >
                            <Edit3 size={13} />
                          </button>
                        )}
                      </div>
                    </div>

                    {/* 2행: 핵심 작업 제목 (굵은 글씨) */}
                    <div 
                      style={{ 
                        fontWeight: 700, 
                        fontSize: '0.93rem', 
                        color: 'var(--text-main)',
                        lineHeight: 1.35,
                        marginBottom: log.details ? '0.25rem' : '0.05rem',
                        width: '100%',
                        wordBreak: 'break-word'
                      }}
                      title={log.title}
                    >
                      {log.title}
                    </div>

                    {/* 3행: 상세 내용 (있을 때만) */}
                    {log.details && (
                      <div style={{ fontSize: '0.84rem', color: 'var(--text-muted)', lineHeight: 1.45, marginBottom: '0.35rem', whiteSpace: 'pre-wrap' }}>
                        {log.details}
                      </div>
                    )}

                    {/* 4행: 하단 메타 정보 (작업자 / 비용) */}
                    {((log.operator && log.operator.trim()) || (log.cost && Number(log.cost) > 0)) && (
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.75rem',
                        flexWrap: 'wrap',
                        fontSize: '0.76rem',
                        color: 'var(--text-subtle)',
                        paddingTop: '0.25rem',
                        borderTop: '1px solid rgba(0,0,0,0.05)'
                      }}>
                        {log.operator && log.operator.trim() && (
                          <span>작업자: {log.operator}</span>
                        )}
                        {log.cost && Number(log.cost) > 0 && (
                          <span>비용: {Number(log.cost).toLocaleString()}원</span>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* 4. 모달 푸터 (좌측: 돌아가기, 우측: 에메랄드 틴트 관리 기록 추가) */}
        <div className="modal-footer detail-modal-footer" style={{ borderTop: '1px solid var(--border-color)', padding: '0.75rem 1rem' }}>
          <div className="modal-footer-left">
            <button 
              type="button"
              className="btn btn-secondary" 
              onClick={onClose} 
              title="원래 화면으로 돌아가기"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', fontWeight: 700 }}
            >
              <ChevronLeft size={16} />
              <span>돌아가기</span>
            </button>
          </div>

          <div className="modal-footer-right">
            {onOpenCareLogModal && (
              <button
                type="button"
                onClick={() => {
                  onOpenCareLogModal(
                    'FARM_COMMON',
                    todayStr,
                    {
                      isFarmCommon: true,
                      entityId: 'FARM_COMMON',
                      entityName: '농장 공통',
                      category: selectedCategory !== 'all' ? selectedCategory : 'routine',
                      date: todayStr
                    }
                  );
                }}
                title="농장 관리 기록 등록"
                style={{
                  background: 'rgba(16, 185, 129, 0.12)',
                  color: '#059669',
                  border: '1px solid rgba(16, 185, 129, 0.3)',
                  fontWeight: 800,
                  borderRadius: 'var(--radius-md)',
                  padding: '0.45rem 0.9rem',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                  cursor: 'pointer',
                  fontSize: '0.88rem',
                  transition: 'all 0.15s ease'
                }}
              >
                <Plus size={16} />
                <span>관리 기록 추가</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
