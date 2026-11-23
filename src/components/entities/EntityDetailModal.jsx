import React, { useState, useMemo, useRef, useEffect } from 'react';
import { 
  X, 
  Plus, 
  Printer, 
  Edit3, 
  Save,
  ClipboardList,
  Clock,
  Trash2,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { 
  ENTITY_STATUSES, 
  GENDER_OPTIONS, 
  CARE_CATEGORIES, 
  calculateAge,
  formatDisplayBreed,
  getAvailableStatuses,
  getCategoryById,
  getTodayDateString,
  normalizeCategoryId
} from '../../lib/types.js';

export default function EntityDetailModal({
  entity,
  careLogs,
  careCategories,
  schedules = [],
  initialViewMode = 'summary',
  onClose,
  onOpenEntityDetail,
  onOpenCareLogModal,
  onOpenEntityModal,
  onOpenPrintSheet,
  onDeleteCareLog,
  onEditCareLog,
  onEditSchedule,
  onUpdateEntityStatus,
  onUpdateEntityMemo
}) {
  const categoriesToDisplay = careCategories || CARE_CATEGORIES;
  const [viewMode, setViewMode] = useState(initialViewMode); // 'summary' | 'fullHistory'
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [isStatusMenuOpen, setIsStatusMenuOpen] = useState(false);
  const [isEditingMemo, setIsEditingMemo] = useState(false);
  const [memoDraft, setMemoDraft] = useState(entity?.memo || '');
  const statusMenuRef = useRef(null);

  // 모달 오픈 시 또는 initialViewMode 변경 시 초기 뷰 모드 동기화
  useEffect(() => {
    setViewMode(initialViewMode || 'summary');
  }, [initialViewMode, entity?.id]);

  // 개체 정보가 변경되거나 모달 열릴 때 메모 초기화
  useEffect(() => {
    setMemoDraft(entity?.memo || '');
    setIsEditingMemo(false);
  }, [entity?.id, entity?.memo]);

  // 상태 변경 드롭다운 바깥 클릭 감지
  useEffect(() => {
    if (!isStatusMenuOpen) return;
    const handleClickOutside = (e) => {
      if (statusMenuRef.current && !statusMenuRef.current.contains(e.target)) {
        setIsStatusMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [isStatusMenuOpen]);

  const handleStatusSelect = (statusId) => {
    setIsStatusMenuOpen(false);
    if (onUpdateEntityStatus && statusId !== entity.status) {
      onUpdateEntityStatus(entity.id, statusId);
    }
  };

  // 이 개체에 속한 전체 관리 기록 (최신순 정렬)
  const allEntityLogs = useMemo(() => {
    if (!entity) return [];
    return careLogs
      .filter(l => l.entityId === entity.id || l.tagNumber === entity.tagNumber)
      .sort((a, b) => new Date(b.date + ' ' + (b.time || '00:00')) - new Date(a.date + ' ' + (a.time || '00:00')));
  }, [careLogs, entity]);

  // 최근 10개 처리 내역 (기본 요약 뷰용)
  const recent10Logs = useMemo(() => {
    return allEntityLogs.slice(0, 10);
  }, [allEntityLogs]);

  // 카테고리 필터링된 전체 내역 (전면 생애관리내역 뷰용: 레거시 영문 카테고리도 완벽하게 표준 ID로 정규화하여 매칭)
  const filteredLogs = useMemo(() => {
    if (selectedCategory === 'all') return allEntityLogs;
    return allEntityLogs.filter(l => normalizeCategoryId(l.category) === selectedCategory);
  }, [allEntityLogs, selectedCategory]);

  const today = useMemo(() => getTodayDateString(), []);

  // 이 개체에 연결된 미완료 미래 일정 목록 (관리기록 다음일정 + 다이어리 스케줄 통합)
  const upcomingSchedules = useMemo(() => {
    if (!entity) return [];
    const list = [];

    // 1) 관리기록에서 지정된 다음 일정
    if (careLogs && careLogs.length > 0) {
      careLogs.forEach(log => {
        const isMatch = log.entityId === entity.id || log.tagNumber === entity.tagNumber;
        if (!isMatch || !log.nextScheduleDate || log.nextScheduleDate < today || log.nextScheduleCompleted) {
          return;
        }

        // 이미 공식 일정으로 승격/등록되었거나 연결된 일정이 있는 경우 schedules 쪽에서 처리하도록 건너뜀 (중복 방지)
        if (log.nextSchedulePromotedScheduleId) {
          const hasLinkedSchedule = (schedules || []).some(s => s.id === log.nextSchedulePromotedScheduleId);
          if (hasLinkedSchedule) return;
        }
        const hasPointedSchedule = (schedules || []).some(s => s.originReminderLogId === log.id);
        if (hasPointedSchedule) return;

        // 이미 동일 날짜에 해당 개체의 완료 관리기록이 등록되어 있는 경우 차기 일정에서 제외
        const alreadyDoneInLogs = allEntityLogs.some(al => al.date === log.nextScheduleDate && al.id !== log.id);
        if (alreadyDoneInLogs) return;

        // 해당 개체에 대해 동일/유사한 작업명(출하, 분만 등)의 최신 관리기록이 이미 완료된 경우 차기 일정에서 제외
        const isAlreadyAccomplished = allEntityLogs.some(al => 
          al.date >= log.date && 
          al.id !== log.id && 
          log.nextScheduleTitle && al.title && (
            al.title.includes(log.nextScheduleTitle) || 
            log.nextScheduleTitle.includes(al.title) ||
            (log.nextScheduleTitle.includes('출하') && al.title.includes('출하')) ||
            (log.nextScheduleTitle.includes('분만') && al.title.includes('분만'))
          )
        );
        if (isAlreadyAccomplished) return;

        list.push({
          id: `CARE-${log.id}`,
          type: 'careLog',
          date: log.nextScheduleDate,
          time: log.nextScheduleTime || '',
          title: log.nextScheduleTitle || '예정 작업',
          sourceLog: log
        });
      });
    }

    // 2) 다이어리 스케줄에서 지정된 일정
    if (schedules && schedules.length > 0) {
      schedules.forEach(sc => {
        const isMatch = sc.entityId === entity.id || sc.tagNumber === entity.tagNumber || sc.targetEntityId === entity.id;
        if (isMatch && sc.date && sc.date >= today && !sc.completed) {
          // 이미 관리기록에 해당 일정이 기록 처리되어 있다면(당일 완료 로그 존재) 차기 일정에서 제외
          const schedDoneInLogs = allEntityLogs.some(al => 
            al.linkedScheduleId === sc.id || 
            (al.date === sc.date && sc.title && al.title && (al.title.includes(sc.title) || sc.title.includes(al.title)))
          );
          if (schedDoneInLogs) return;

          list.push({
            id: `SCHED-${sc.id}`,
            type: 'schedule',
            date: sc.date,
            time: sc.time || '',
            title: sc.title || '예정 일정',
            sourceSchedule: sc
          });
        }
      });
    }

    // 날짜 및 시간 오름차순(가까운 미래 순) 정렬
    return list.sort((a, b) => {
      const cmp = a.date.localeCompare(b.date);
      if (cmp !== 0) return cmp;
      return (a.time || '').localeCompare(b.time || '');
    });
  }, [entity, careLogs, schedules, today, allEntityLogs]);

  // D-Day 계산 함수
  const getDdayBadge = (targetDate) => {
    const tDate = new Date(today + 'T00:00:00');
    const dDate = new Date(targetDate + 'T00:00:00');
    const diffDays = Math.round((dDate - tDate) / (1000 * 60 * 60 * 24));
    if (diffDays === 0) return 'D-Day (오늘)';
    if (diffDays > 0) return `D-${diffDays}`;
    return `D+${Math.abs(diffDays)}`;
  };

  if (!entity) return null;

  const age = calculateAge(entity.birthDate);
  const statusObj = ENTITY_STATUSES.find(s => s.id === entity.status) || ENTITY_STATUSES[0];
  const genderObj = GENDER_OPTIONS.find(g => g.id === entity.gender) || GENDER_OPTIONS[0];

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content modal-content-lg" onClick={(e) => e.stopPropagation()}>
        {/* 표준 모달 헤더: 신규 개체 등록 모달과 100% 동일한 헤더 규격 적용 */}
        <div className="modal-header">
          <div className="modal-header-title">
            <span style={{ fontWeight: 800, fontSize: '1.25rem' }}>
              {viewMode === 'fullHistory' ? '생애 관리 내역' : '개체 상세 정보'}
            </span>
          </div>
          <button 
            type="button" 
            className="modal-close-btn" 
            onClick={onClose}
            title="창 닫기"
            aria-label="닫기"
          >
            <X size={20} />
          </button>
        </div>

        {/* 생애 관리 내역 전면 뷰 전용 서브 헤더 바 (2단 개체정보/전체캡슐 + 3단 3열 균등 종목캡슐) */}
        {viewMode === 'fullHistory' && (
          <div className="fullhistory-header-bar">
            {/* 2단: 개체 식별 프로필 (좌측) <──────────────> 전체 기록 캡슐 (우측 3열 끝선 칼정렬) */}
            <div className="fullhistory-header-identity-row" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem', width: '100%' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', minWidth: 0, flex: 1, overflow: 'hidden' }}>
                <span style={{ 
                  fontSize: '1.18rem', 
                  fontWeight: 800, 
                  color: 'var(--text-main)', 
                  fontFamily: 'var(--font-family)',
                  fontVariantNumeric: 'tabular-nums',
                  fontFeatureSettings: '"tnum" 1',
                  letterSpacing: '-0.025em',
                  whiteSpace: 'nowrap',
                  flexShrink: 0 
                }}>
                  {entity.tagNumber}
                </span>
                <h2 style={{ 
                  margin: 0, 
                  fontSize: '1.05rem', 
                  fontWeight: 700, 
                  color: 'var(--text-main)', 
                  overflow: 'hidden', 
                  textOverflow: 'ellipsis', 
                  whiteSpace: 'nowrap' 
                }}>
                  {entity.name}
                </h2>
              </div>

              {/* 우측 3열 끝선에 수직 칼정렬되는 전체 기록 캡슐 */}
              <button
                type="button"
                className={`fullhistory-tab-btn ${selectedCategory === 'all' ? 'active' : ''}`}
                onClick={() => setSelectedCategory('all')}
                title="전체 관리 기록 보기"
                style={{
                  width: 'auto',
                  flexShrink: 0,
                  padding: '0 0.85rem'
                }}
              >
                <span>전체</span>
                <span className="tab-count">{allEntityLogs.length}</span>
              </button>
            </div>

            {/* 3단: 세부 종목 캡슐 3열 균등 바둑판 배치 (레거시 영문 카테고리도 표준 ID로 완벽 집계) */}
            <div className="fullhistory-filter-bar">
              {categoriesToDisplay.map(cat => {
                const count = allEntityLogs.filter(l => normalizeCategoryId(l.category) === cat.id).length;
                if (count === 0 && selectedCategory !== cat.id) return null;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    className={`fullhistory-tab-btn ${selectedCategory === cat.id ? 'active' : ''}`}
                    onClick={() => setSelectedCategory(cat.id)}
                    title={`${cat.label} 관리 기록 보기`}
                  >
                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{cat.label}</span>
                    <span className="tab-count">{count}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* 모달 본문 */}
        <div className="modal-body">
          {viewMode === 'summary' ? (
            /* [기본 뷰]: 개체 프로필 섹션 + 4대 스펙 박스 + 특이사항 + 최근 10건 요약 리스트 */
            <>
              {/* 개체 핵심 프로필 섹션 (이표번호, 상태, 정보 수정 버튼, 이름 및 월령) */}
              <div className="detail-entity-profile-card">
                {/* 1행: 이표번호 (좌측) <───────────────> 상태 배너 & 출력 액션 (우측) 대칭 배치 (개체 카드와 동일 규격) */}
                <div className="detail-header-top-row" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem' }}>
                  {/* 좌측: 개체 고유 이표번호 (박스 없는 시원하고 굵은 텍스트) */}
                  <h3 
                    style={{ 
                      margin: 0, 
                      fontSize: '1.28rem', 
                      fontWeight: 800, 
                      fontFamily: 'var(--font-family)',
                      fontVariantNumeric: 'tabular-nums',
                      fontFeatureSettings: '"tnum" 1',
                      color: 'var(--text-main)', 
                      letterSpacing: '-0.025em',
                      whiteSpace: 'nowrap',
                      flexShrink: 0
                    }}
                  >
                    {entity.tagNumber}
                  </h3>

                  {/* 우측 끝: 출력 버튼(데스크톱) & 상태 변경 뱃지 드롭다운 */}
                  <div className="entity-detail-header-actions" style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', flexShrink: 0 }}>
                    <button 
                      className="btn btn-outline btn-sm detail-print-btn"
                      onClick={() => onOpenPrintSheet(entity)}
                      title="이 개체의 전체 관리 이력 A4 인쇄"
                    >
                      <Printer size={15} />
                      <span>출력</span>
                    </button>

                    {/* 상태 배너 (우측 끝 정렬) */}
                    <div style={{ position: 'relative', display: 'inline-flex', alignItems: 'center' }} ref={statusMenuRef}>
                      <button
                        type="button"
                        className={`badge ${statusObj.colorClass} status-banner-btn`}
                        onClick={(e) => {
                          e.stopPropagation();
                          setIsStatusMenuOpen(prev => !prev);
                        }}
                        title="클릭하여 개체 상태 즉시 변경"
                        style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}
                      >
                        {statusObj.icon && <span style={{ fontSize: '1.05rem', lineHeight: 1 }}>{statusObj.icon}</span>}
                        <span>{statusObj.label}</span>
                        <span style={{ fontSize: '0.75rem', opacity: 0.8, marginLeft: '0.1rem' }}>▾</span>
                      </button>

                      {/* 상태 선택 팝오버 메뉴 (우측 기준 안쪽으로 오픈) */}
                      {isStatusMenuOpen && (
                        <div className="status-picker-dropdown">
                          <div className="status-picker-header">상태 변경 선택</div>
                          <div className="status-picker-list">
                            {getAvailableStatuses(entity.breed, entity.gender).map(st => {
                              const isCurrent = st.id === entity.status;
                              return (
                                <button
                                  key={st.id}
                                  type="button"
                                  className={`status-picker-item ${isCurrent ? 'active' : ''}`}
                                  onClick={() => handleStatusSelect(st.id)}
                                >
                                  <span style={{ fontSize: '1.05rem', lineHeight: 1 }}>{st.icon}</span>
                                  <span style={{ fontWeight: isCurrent ? 800 : 600, flex: 1, textAlign: 'left' }}>
                                    {st.label}
                                  </span>
                                  {isCurrent && (
                                    <span style={{ fontSize: '0.75rem', color: 'var(--color-primary)', fontWeight: 800 }}>선택됨</span>
                                  )}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* 2행: 소 이름(호칭) + 사육단계 · 월령 · 축사 위치 (소 고유 정보 우선 정렬) */}
                <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '0.45rem', marginTop: '0.35rem', fontSize: '0.92rem' }}>
                  <span style={{ fontWeight: 700, fontSize: '1.05rem', color: 'var(--text-main)' }}>
                    {entity.name}
                  </span>
                  <span style={{ fontWeight: 600, color: 'var(--text-muted)' }}>
                    ({formatDisplayBreed(entity.breed)})
                  </span>
                  <span style={{ color: 'var(--border-color)', fontWeight: 300, margin: '0 0.1rem' }}>•</span>
                  <span style={{ fontWeight: 600, color: 'var(--text-muted)' }}>
                    {age.text}
                  </span>
                  <span style={{ color: 'var(--border-color)', fontWeight: 300, margin: '0 0.1rem' }}>•</span>
                  <span style={{ fontWeight: 600, color: 'var(--text-muted)' }}>
                    {entity.barn || '축사 미지정'}
                  </span>
                </div>
              </div>

              {/* 1. 4대 중요 정보 2x2 균등 카드 그리드 */}
              <div className="modal-specs-grid">
                <div className="modal-spec-card">
                  <span className="modal-spec-label">축사 및 구역</span>
                  <span className="modal-spec-value" title={entity.barn || '미지정'}>
                    {entity.status === 'shipped' 
                      ? `${entity.barn || '미지정'} (출하 완료)` 
                      : entity.status === 'deceased'
                      ? `${entity.barn || '미지정'} (폐사/도태)`
                      : (entity.barn || '미지정')}
                  </span>
                </div>

                <div className="modal-spec-card">
                  <span className="modal-spec-label">
                    {entity.status === 'shipped' ? '출하 체중' : entity.status === 'deceased' ? '최종 체중' : '현재 체중'}
                  </span>
                  <span className="modal-spec-value">
                    {entity.weight ? (
                      <>
                        {entity.weight} <small style={{ fontSize: '0.82rem', fontWeight: 600 }}>kg</small>
                      </>
                    ) : (
                      '미측정'
                    )}
                  </span>
                </div>

                <div className="modal-spec-card">
                  <span className="modal-spec-label">모체 번호</span>
                  {entity.motherTag ? (
                    <span 
                      className="modal-spec-value tag-number-font spec-link-mother" 
                      title="클릭 시 모체(어미소) 정보로 이동"
                      onClick={() => onOpenEntityDetail && onOpenEntityDetail(entity.motherTag)}
                      style={{ cursor: onOpenEntityDetail ? 'pointer' : 'default' }}
                    >
                      {entity.motherTag}
                    </span>
                  ) : (
                    <span className="modal-spec-value" style={{ color: 'var(--text-muted)' }}>
                      -
                    </span>
                  )}
                </div>

                <div className="modal-spec-card">
                  <span className="modal-spec-label">부체 (KPN)</span>
                  <span className="modal-spec-value tag-number-font" title={entity.fatherTag || '미상'}>
                    {entity.fatherTag || <span style={{ color: 'var(--text-muted)' }}>-</span>}
                  </span>
                </div>
              </div>

              {/* 특이사항 / 사양 관리 메모 (클릭 투 에딧: 버튼 삭제, 타이틀 및 본문 터치 시 인플레이스 수정) */}
              <div 
                className={`modal-spec-memo-card ${!isEditingMemo ? 'clickable-memo' : ''}`} 
                style={{ position: 'relative' }}
                onClick={() => {
                  if (!isEditingMemo) {
                    setMemoDraft(entity.memo || '');
                    setIsEditingMemo(true);
                  }
                }}
                title={!isEditingMemo ? "여기를 터치하여 특이사항 메모를 바로 수정합니다" : undefined}
              >
                {!isEditingMemo ? (
                  <div>
                    <div style={{ 
                      fontSize: '0.8rem', 
                      color: 'var(--color-primary)', 
                      fontWeight: 700, 
                      marginBottom: '0.2rem', 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'space-between'
                    }}>
                      <span style={{ display: 'flex', alignItems: 'center' }}>
                        <span>특이사항 / 사양 관리 메모</span>
                      </span>
                      <button
                        type="button"
                        className="btn btn-outline btn-sm btn-icon-only"
                        onClick={(e) => {
                          e.stopPropagation();
                          setMemoDraft(entity.memo || '');
                          setIsEditingMemo(true);
                        }}
                        title="특이사항 메모 수정"
                        style={{
                          width: '24px',
                          height: '24px',
                          padding: 0,
                          flexShrink: 0,
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          border: '1px solid rgba(16, 185, 129, 0.4)',
                          color: 'var(--color-primary)',
                          background: 'var(--bg-card)',
                          borderRadius: 'var(--radius-sm)'
                        }}
                      >
                        <Edit3 size={12} />
                      </button>
                    </div>
                    <div style={{ 
                      color: entity.memo ? 'var(--text-main)' : 'var(--text-muted)', 
                      fontStyle: entity.memo ? 'normal' : 'italic',
                      whiteSpace: 'pre-wrap',
                      lineHeight: 1.55
                    }}>
                      {entity.memo || '등록된 특이사항 메모가 없습니다. (여기를 터치하여 메모 입력)'}
                    </div>
                  </div>
                ) : (
                  <div>
                    <div style={{ 
                      fontSize: '0.8rem', 
                      color: 'var(--color-primary)', 
                      fontWeight: 700, 
                      marginBottom: '0.45rem',
                      display: 'flex',
                      alignItems: 'center'
                    }}>
                      <span>특이사항 / 사양 관리 메모 직접 수정</span>
                    </div>
                    <textarea
                      className="form-textarea"
                      value={memoDraft}
                      onChange={(e) => setMemoDraft(e.target.value)}
                      placeholder="성격, 과거 병력, 백신 반응, 사료 기호도 등 특이사항을 기록하세요."
                      style={{ 
                        minHeight: '85px', 
                        width: '100%', 
                        fontSize: '0.88rem', 
                        padding: '0.65rem 0.75rem', 
                        marginBottom: '0.6rem',
                        lineHeight: 1.5,
                        borderRadius: 'var(--radius-sm)'
                      }}
                      autoFocus
                    />
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.45rem' }}>
                      <button
                        type="button"
                        className="btn btn-secondary btn-sm"
                        onClick={() => {
                          setMemoDraft(entity.memo || '');
                          setIsEditingMemo(false);
                        }}
                      >
                        취소
                      </button>
                      <button
                        type="button"
                        className="btn btn-outline btn-sm"
                        onClick={() => {
                          if (onUpdateEntityMemo) {
                            onUpdateEntityMemo(entity.id, memoDraft);
                          }
                          setIsEditingMemo(false);
                        }}
                        style={{ 
                          border: '1px solid var(--text-muted)', 
                          color: 'var(--text-main)', 
                          fontWeight: 700, 
                          background: 'var(--bg-card)', 
                          display: 'flex', 
                          alignItems: 'center', 
                          gap: '0.3rem' 
                        }}
                      >
                        <Save size={13} />
                        <span>메모 저장</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* 다가올 다음 예정 일정 미니 배너 (가장 빠른 1개) */}
              {upcomingSchedules.length > 0 && (
                <div 
                  style={{ 
                    padding: '0.55rem 0.85rem',
                    background: 'rgba(245, 158, 11, 0.08)',
                    border: '1px solid rgba(245, 158, 11, 0.3)',
                    borderRadius: 'var(--radius-md)',
                    marginBottom: '1rem',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.2rem',
                    boxShadow: 'var(--shadow-sm)'
                  }}
                >
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
                        color: 'var(--color-accent)',
                        fontWeight: 700,
                        letterSpacing: '-0.01em',
                        whiteSpace: 'nowrap'
                      }}>
                        다음 일정: {upcomingSchedules[0].date}{upcomingSchedules[0].time ? ` - ${upcomingSchedules[0].time}` : ''}
                      </span>
                      <span style={{
                        fontSize: '0.72rem',
                        background: 'var(--color-accent)',
                        color: '#ffffff',
                        padding: '0.1rem 0.4rem',
                        borderRadius: '4px',
                        fontWeight: 800,
                        whiteSpace: 'nowrap'
                      }}>
                        {getDdayBadge(upcomingSchedules[0].date)}
                      </span>
                    </div>

                    <button
                      type="button"
                      className="btn btn-outline btn-sm btn-icon-only"
                      onClick={() => {
                        if (upcomingSchedules[0].type === 'careLog' && onEditCareLog) {
                          onEditCareLog(upcomingSchedules[0].sourceLog, { focusNextSchedule: true });
                        } else if (upcomingSchedules[0].type === 'schedule' && onEditSchedule) {
                          onEditSchedule(upcomingSchedules[0].sourceSchedule);
                        }
                      }}
                      title="이 예정 일정 수정"
                      style={{
                        width: '24px',
                        height: '24px',
                        padding: 0,
                        flexShrink: 0,
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        border: '1px solid rgba(245, 158, 11, 0.4)',
                        color: 'var(--color-accent)',
                        background: 'var(--bg-card)',
                        borderRadius: 'var(--radius-sm)'
                      }}
                    >
                      <Edit3 size={12} />
                    </button>
                  </div>

                  <div style={{
                    fontSize: '0.88rem',
                    fontWeight: 600,
                    color: 'var(--text-main)',
                    opacity: 0.7,
                    lineHeight: 1.35,
                    wordBreak: 'break-word'
                  }}>
                    {upcomingSchedules[0].title}
                  </div>
                </div>
              )}

              {/* 2. 생애 관리 내역 (최근 10개 요약 리스트 & 전체보기 통합) */}
              <div className="recent-logs-section">
                <div className="recent-logs-header">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                    <ClipboardList size={17} style={{ color: 'var(--color-primary)' }} />
                    <span className="recent-logs-title" style={{ fontSize: '0.95rem' }}>생애 관리 내역</span>
                  </div>

                  {allEntityLogs.length > 0 ? (
                    <button
                      type="button"
                      onClick={() => setViewMode('fullHistory')}
                      title="클릭 시 전체 생애 관리 내역 타임라인으로 이동"
                      style={{
                        background: 'transparent',
                        border: 'none',
                        cursor: 'pointer',
                        padding: '0.2rem 0.3rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.2rem',
                        color: 'var(--color-primary)',
                        fontWeight: 700,
                        fontSize: '0.8rem',
                        borderRadius: 'var(--radius-sm)'
                      }}
                    >
                      <span>
                        {allEntityLogs.length <= 10 
                          ? `총 ${allEntityLogs.length}건` 
                          : `최근 ${recent10Logs.length}건 / 전체 ${allEntityLogs.length}건`}
                      </span>
                      <ChevronRight size={15} style={{ opacity: 0.8 }} />
                    </button>
                  ) : (
                    <span className="recent-logs-count">0건</span>
                  )}
                </div>

                {recent10Logs.length === 0 ? (
                  <div className="recent-logs-empty">
                    등록된 관리 기록이 없습니다.
                  </div>
                ) : (
                  <div className="recent-logs-list">
                    {recent10Logs.map((log) => {
                      const catObj = getCategoryById(log.category, careCategories);
                      // 스마트 컴팩트 날짜 (2026-09-05 -> 26.09.05로 여백을 확보하여 제목 잘림 완화)
                      const displayDate = log.date ? log.date.slice(2).replace(/-/g, '.') : '';
                      return (
                        <div 
                          key={log.id} 
                          className="recent-log-item"
                          onClick={() => setViewMode('fullHistory')}
                          title={`클릭 시 생애 관리 내역 전체보기로 이동 (${log.date})`}
                        >
                          <div className="recent-log-date" title={log.date}>{displayDate}</div>
                          <span 
                            className={`badge ${catObj.badgeClass}`} 
                            style={{ 
                              fontSize: '0.74rem', 
                              padding: '0.15rem 0.52rem', 
                              borderRadius: '9999px',
                              flexShrink: 0, 
                              fontWeight: 700,
                              lineHeight: 1.2
                            }}
                          >
                            {catObj.label}
                          </span>
                          <div className="recent-log-title" title={log.title}>{log.title}</div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </>
          ) : (
            /* [생애 관리 내역 전면 뷰]: 타임라인 전체 (카테고리 필터는 상단 탑바에 고정 탑재) */
            <>
              {/* 타임라인 리스트 */}
              {filteredLogs.length === 0 ? (
                <div style={{ 
                  textAlign: 'center', 
                  padding: '3rem 1rem', 
                  color: 'var(--text-muted)',
                  background: 'var(--bg-card-subtle)',
                  borderRadius: 'var(--radius-lg)'
                }}>
                  <ClipboardList size={40} style={{ opacity: 0.3, marginBottom: '0.75rem' }} />
                  <div style={{ fontWeight: 600 }}>해당 분류의 관리 기록이 없습니다.</div>
                  <p style={{ fontSize: '0.85rem', marginTop: '0.25rem' }}>
                    하단의 [관리 기록 추가] 버튼을 눌러 새 관리 기록을 등록해보세요.
                  </p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                  {/* 상단 스마트 배너: 가장 가까운 차기 예정 일정 1개 단독 노출 (중복 배너 스크롤 낭비 차단) */}
                  {upcomingSchedules.length > 0 && (
                    <div 
                      style={{ 
                        padding: '0.52rem 0.75rem',
                        background: 'rgba(245, 158, 11, 0.08)',
                        border: '1px solid rgba(245, 158, 11, 0.3)',
                        borderRadius: 'var(--radius-md)',
                        marginBottom: '0.45rem',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '0.15rem',
                        boxShadow: 'var(--shadow-sm)'
                      }}
                    >
                      {/* 1단: 다음 일정: 날짜 - 시간 & D-day + 원클릭 수정 버튼 */}
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
                            color: 'var(--color-accent)',
                            fontWeight: 700,
                            letterSpacing: '-0.01em',
                            whiteSpace: 'nowrap'
                          }}>
                            다음 일정: {upcomingSchedules[0].date}{upcomingSchedules[0].time ? ` - ${upcomingSchedules[0].time}` : ''}
                          </span>
                          <span style={{
                            fontSize: '0.72rem',
                            background: 'var(--color-accent)',
                            color: '#ffffff',
                            padding: '0.1rem 0.4rem',
                            borderRadius: '4px',
                            fontWeight: 800,
                            whiteSpace: 'nowrap'
                          }}>
                            {getDdayBadge(upcomingSchedules[0].date)}
                          </span>
                        </div>

                        <button
                          type="button"
                          className="btn btn-outline btn-sm btn-icon-only"
                          onClick={() => {
                            if (upcomingSchedules[0].type === 'careLog' && onEditCareLog) {
                              onEditCareLog(upcomingSchedules[0].sourceLog, { focusNextSchedule: true });
                            } else if (upcomingSchedules[0].type === 'schedule' && onEditSchedule) {
                              onEditSchedule(upcomingSchedules[0].sourceSchedule);
                            }
                          }}
                          title="이 예정 일정 수정"
                          style={{
                            width: '24px',
                            height: '24px',
                            padding: 0,
                            flexShrink: 0,
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            border: '1px solid rgba(245, 158, 11, 0.4)',
                            color: 'var(--color-accent)',
                            background: 'var(--bg-card)',
                            borderRadius: 'var(--radius-sm)'
                          }}
                        >
                          <Edit3 size={12} />
                        </button>
                      </div>

                      {/* 2단: 작업 내용 */}
                      <div style={{
                        fontSize: '0.86rem',
                        fontWeight: 600,
                        color: 'var(--text-main)',
                        opacity: 0.8,
                        lineHeight: 1.35,
                        wordBreak: 'break-word'
                      }}>
                        {upcomingSchedules[0].title}
                      </div>
                    </div>
                  )}

                  {filteredLogs.map(log => {
                    const catObj = getCategoryById(log.category, careCategories);

                    return (
                      <div 
                        key={log.id} 
                        style={{
                          background: 'var(--bg-card)',
                          border: '1px solid var(--border-color)',
                          borderRadius: 'var(--radius-md)',
                          padding: '0.52rem 0.75rem',
                          boxShadow: 'var(--shadow-sm)',
                          transition: 'all 0.15s ease'
                        }}
                      >
                        {/* 1행: [관리분류 뱃지] + [날짜] (좌측) & [✏️ 수정] 액션 버튼 (우측 끝, 삭제는 수정창 내 격리) */}
                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          gap: '0.5rem',
                          marginBottom: '0.3rem',
                          width: '100%'
                        }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.55rem', minWidth: 0, flex: 1 }}>
                            <span className={`badge ${catObj.badgeClass}`} style={{ flexShrink: 0, borderRadius: '9999px', padding: '0.18rem 0.55rem', fontSize: '0.78rem', fontWeight: 700 }}>
                              {catObj.icon} {catObj.label}
                            </span>
                            <span style={{
                              fontWeight: 700,
                              fontSize: '0.88rem',
                              whiteSpace: 'nowrap',
                              flexShrink: 0,
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '0.35rem'
                            }}>
                              <span style={{ color: 'var(--text-main)', opacity: 0.85 }}>
                                {log.date}
                              </span>
                              {log.time && (
                                <span style={{ fontWeight: 700, fontSize: '0.84rem', color: 'var(--text-muted)' }}>
                                  {log.time}
                                </span>
                              )}
                            </span>
                          </div>

                          <div style={{ display: 'flex', alignItems: 'center', flexShrink: 0 }}>
                            {onEditCareLog && (
                              <button
                                type="button"
                                className="btn btn-outline btn-sm btn-icon-only"
                                onClick={() => onEditCareLog(log)}
                                title="관리 기록 수정 및 삭제"
                                style={{
                                  width: '24px',
                                  height: '24px',
                                  padding: 0,
                                  flexShrink: 0,
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  border: '1px solid rgba(0, 0, 0, 0.15)',
                                  color: 'var(--text-main)',
                                  background: 'var(--bg-card)',
                                  borderRadius: 'var(--radius-sm)'
                                }}
                              >
                                <Edit3 size={12} />
                              </button>
                            )}
                          </div>
                        </div>

                        {/* 2행: [100% 진한 블랙 작업명 (가로 100% 전체 폭 시원하게 활용)] */}
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

                        {/* 3행: 상세 내용 */}
                        {log.details && (
                          <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: 1.5, marginBottom: '0.45rem', whiteSpace: 'pre-wrap' }}>
                            {log.details}
                          </div>
                        )}

                        {/* 하단 기록자 / 비용 (비어있으면 전체 영역 숨김) */}
                        {((log.operator && log.operator.trim()) || (log.cost && Number(log.cost) > 0)) ? (
                          <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.75rem',
                            flexWrap: 'wrap',
                            fontSize: '0.775rem',
                            color: 'var(--text-subtle)',
                            borderTop: '1px solid var(--border-color)',
                            paddingTop: '0.45rem',
                            marginTop: '0.45rem'
                          }}>
                            {log.operator && log.operator.trim() ? <span>작업자: {log.operator.trim()}</span> : null}
                            {log.cost && Number(log.cost) > 0 ? <span>비용: {Number(log.cost).toLocaleString()}원</span> : null}
                          </div>
                        ) : null}
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          )}
        </div>

        {/* 모달 푸터: 좌측에 개체 정보 수정, 우측에 닫기/돌아가기 및 관리 기록 추가 */}
        <div className="modal-footer detail-modal-footer">
          {/* 좌측: 개체 정보 수정 버튼 (기본 뷰일 때 상시 노출) */}
          <div className="modal-footer-left">
            {viewMode === 'summary' && onOpenEntityModal && (
              <button
                type="button"
                className="btn btn-outline detail-footer-edit-btn"
                onClick={() => onOpenEntityModal(entity)}
                title="개체 기본 정보 수정"
              >
                <Edit3 size={15} />
                <span>정보 수정</span>
              </button>
            )}
          </div>

          {/* 우측: 닫기/돌아가기 + 관리 기록 추가 */}
          <div className="modal-footer-right">
            {viewMode === 'fullHistory' ? (
              <button 
                type="button"
                className="btn btn-secondary" 
                onClick={() => {
                  if (initialViewMode === 'fullHistory') {
                    onClose();
                  } else {
                    setViewMode('summary');
                  }
                }} 
                title={initialViewMode === 'fullHistory' ? "개체 목록으로 돌아가기" : "요약 정보로 돌아가기"}
              >
                <ChevronLeft size={16} />
                <span>돌아가기</span>
              </button>
            ) : (
              <button 
                type="button" 
                className="btn btn-secondary" 
                onClick={onClose} 
                title="창 닫기"
              >
                <span>닫기</span>
              </button>
            )}

            {(entity.status === 'shipped' || entity.status === 'deceased') ? (
              <button 
                type="button"
                className="btn btn-sm" 
                onClick={() => onOpenCareLogModal(entity)}
                style={{
                  fontWeight: 800,
                  background: 'rgba(14, 165, 233, 0.12)',
                  border: '1px solid #0ea5e9',
                  color: '#0369a1',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.35rem'
                }}
              >
                <Plus size={16} color="#0369a1" strokeWidth={2.3} />
                <span>과거 기록 추가</span>
              </button>
            ) : (
              <button 
                type="button"
                className="btn btn-sm" 
                onClick={() => onOpenCareLogModal(entity)}
                style={{
                  fontWeight: 800,
                  background: 'rgba(16, 185, 129, 0.14)',
                  border: '1px solid #10b981',
                  color: '#065f46',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.35rem'
                }}
              >
                <Plus size={16} color="#065f46" strokeWidth={2.3} />
                <span>관리 기록 추가</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
