import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Calendar,
  Calendar as CalendarIcon,
  Clock,
  Plus,
  FileText,
  AlertCircle,
  CheckCircle2,
  Circle,
  Sparkles,
  ArrowRight,
  Trash2,
  Edit2
} from 'lucide-react';
import {
  CARE_CATEGORIES,
  getTodayDateString,
  getCategoryById
} from '../../lib/types.js';
import { SCHEDULE_CATEGORIES } from './ScheduleFormModal.jsx';

export default function DailyDiaryView({
  entities,
  careLogs,
  careCategories,
  schedules = [],
  initialDate,
  initialTab = 'schedules',
  onOpenEntityDetail,
  onOpenCareLogModal,
  onOpenScheduleModal,
  onToggleScheduleComplete,
  onToggleReminderComplete,
  onDeleteSchedule,
  onEditSchedule,
  onEditCareLog,
  onUpdateReminderDate,
  onNavigateToReport
}) {
  const [selectedDate, setSelectedDate] = useState(initialDate || getTodayDateString());
  const [currentYearMonth, setCurrentYearMonth] = useState(() => {
    const base = initialDate ? new Date(initialDate) : new Date();
    return { year: base.getFullYear(), month: base.getMonth() };
  });

  // 다이어리 서브 탭: 'schedules'(일정) 또는 'logs'(관리 내역)
  const [activeDiaryTab, setActiveDiaryTab] = useState(initialTab || 'schedules');
  const dockTabsRef = useRef(null);

  // 탭 클릭 시 서브탭 전환 및 화면 위치 최적 스크롤
  const handleTabClick = (tabKey) => {
    setActiveDiaryTab(tabKey);
    setTimeout(() => {
      if (dockTabsRef.current) {
        dockTabsRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 50);
  };

  // 알람 인라인 날짜 변경 상태
  const [editingReminderDateId, setEditingReminderDateId] = useState(null);
  const [tempReminderDate, setTempReminderDate] = useState('');

  // 외부(보고서 등)에서 날짜나 탭이 변경되어 진입했을 때 실시간 동기화
  useEffect(() => {
    if (initialDate) {
      setSelectedDate(initialDate);
      const parts = initialDate.split('-');
      if (parts.length === 3) {
        setCurrentYearMonth({ year: parseInt(parts[0], 10), month: parseInt(parts[1], 10) - 1 });
      }
    }
  }, [initialDate]);

  useEffect(() => {
    if (initialTab) {
      setActiveDiaryTab(initialTab);
    }
  }, [initialTab]);

  // 완료된 일정 중 상세 내용을 확인하기 위해 사용자가 탭하여 임시로 펼친 일정 ID 목록
  const [expandedCompletedIds, setExpandedCompletedIds] = useState(new Set());

  const toggleExpandCompleted = (id) => {
    setExpandedCompletedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  // 선택한 날짜에 수행된 관리 내역
  const dailyLogs = useMemo(() => {
    return careLogs
      .filter(l => l.date === selectedDate)
      .sort((a, b) => (b.time || '').localeCompare(a.time || ''));
  }, [careLogs, selectedDate]);

  // 선택한 날짜에 도래한 차기 예정 작업 (기존 관리기록 D-day 리마인더)
  const scheduledTasks = useMemo(() => {
    return careLogs
      .filter(l => l.nextScheduleDate === selectedDate)
      .sort((a, b) => (a.nextScheduleTime || a.time || '').localeCompare(b.nextScheduleTime || b.time || ''));
  }, [careLogs, selectedDate]);

  // 선택한 날짜에 등록된 독립 영농 일정
  const dailySchedules = useMemo(() => {
    return (schedules || [])
      .filter(s => s.date === selectedDate)
      .sort((a, b) => (a.time || '').localeCompare(b.time || ''));
  }, [schedules, selectedDate]);

  // 총 일정 건수
  const totalScheduleCount = dailySchedules.length + scheduledTasks.length;

  // 미처리 알람 건수
  const pendingRemindersCount = useMemo(() => {
    return scheduledTasks.filter(t => !t.nextScheduleCompleted).length;
  }, [scheduledTasks]);

  // 미완료 영농 일정 건수
  const pendingDailySchedulesCount = useMemo(() => {
    return dailySchedules.filter(s => !s.completed).length;
  }, [dailySchedules]);

  // 전체 미완료 합계 (달력 뱃지 등 호환성)
  const pendingScheduleCount = pendingDailySchedulesCount + pendingRemindersCount;

  // 알람이 0건이 되었을 때 알람 탭에 머물러 있었다면 일정 탭으로 자동 복원 이동
  useEffect(() => {
    if (activeDiaryTab === 'reminders' && pendingRemindersCount === 0) {
      setActiveDiaryTab('schedules');
    }
  }, [activeDiaryTab, pendingRemindersCount]);

  // 달력에 표시할 이벤트 있는 날짜 집합 (완료 로그 또는 예정 일정 전체)
  const datesWithActivity = useMemo(() => {
    const set = new Set();
    careLogs.forEach(l => {
      if (l.date) set.add(l.date);
      if (l.nextScheduleDate) set.add(l.nextScheduleDate);
    });
    (schedules || []).forEach(s => {
      if (s.date) set.add(s.date);
    });
    return set;
  }, [careLogs, schedules]);

  // 스마트 투톤(제안2)을 위한 관리기록 전용 일자
  const datesWithCareLogs = useMemo(() => {
    const set = new Set();
    careLogs.forEach(l => { if (l.date) set.add(l.date); });
    return set;
  }, [careLogs]);

  // 스마트 투톤(제안2)을 위한 일정(할 일) 전용 일자
  const datesWithSchedules = useMemo(() => {
    const set = new Set();
    careLogs.forEach(l => { if (l.nextScheduleDate) set.add(l.nextScheduleDate); });
    (schedules || []).forEach(s => { if (s.date) set.add(s.date); });
    return set;
  }, [careLogs, schedules]);

  // 달력 날짜 매트릭스 생성
  const calendarDays = useMemo(() => {
    const { year, month } = currentYearMonth;
    const firstDay = new Date(year, month, 1).getDay(); // 0 is Sunday
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const daysInPrevMonth = new Date(year, month, 0).getDate();

    const days = [];

    // 이전 달 일자 채우기
    for (let i = firstDay - 1; i >= 0; i--) {
      const d = daysInPrevMonth - i;
      const prevMonth = month === 0 ? 11 : month - 1;
      const prevYear = month === 0 ? year - 1 : year;
      const dateStr = `${prevYear}-${String(prevMonth + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      days.push({ dayNumber: d, dateStr, isCurrentMonth: false });
    }

    // 이번 달 일자 채우기
    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      days.push({ dayNumber: d, dateStr, isCurrentMonth: true });
    }

    // 다음 달 일자 채우기 (5주 35칸 또는 6주 42칸으로 동적 최적화)
    const totalSlots = days.length <= 35 ? 35 : 42;
    const remaining = totalSlots - days.length;
    for (let d = 1; d <= remaining; d++) {
      const nextMonth = month === 11 ? 0 : month + 1;
      const nextYear = month === 11 ? year + 1 : year;
      const dateStr = `${nextYear}-${String(nextMonth + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      days.push({ dayNumber: d, dateStr, isCurrentMonth: false });
    }

    return days;
  }, [currentYearMonth]);

  // 달력 월 변경 핸들러
  const handlePrevMonth = () => {
    setCurrentYearMonth(prev => {
      if (prev.month === 0) return { year: prev.year - 1, month: 11 };
      return { ...prev, month: prev.month - 1 };
    });
  };

  const handleNextMonth = () => {
    setCurrentYearMonth(prev => {
      if (prev.month === 11) return { year: prev.year + 1, month: 0 };
      return { ...prev, month: prev.month + 1 };
    });
  };

  const todayStr = getTodayDateString();

  // 날짜 한국어 요일 포맷
  const getFormattedDateTitle = (dateStr) => {
    if (!dateStr) return '';
    const dateObj = new Date(dateStr);
    const dayNames = ['일요일', '월요일', '화요일', '수요일', '목요일', '금요일', '토요일'];
    const dayName = dayNames[dateObj.getDay()];
    return `${dateStr} (${dayName})`;
  };

  return (
    <div>
      <div className="diary-container">
        {/* 왼쪽: 캘린더 다이어리 위젯 */}
        <div style={{ width: '100%' }}>
          <div className="calendar-card">
            <div className="calendar-header">
              <h3 style={{ fontSize: '1.25rem', fontWeight: 800, letterSpacing: '-0.02em', margin: 0 }}>
                {currentYearMonth.year}년 {currentYearMonth.month + 1}월
              </h3>
              <div style={{ display: 'flex', gap: '0.35rem', alignItems: 'center' }}>
                <button
                  className="btn btn-outline btn-sm btn-icon-only"
                  onClick={handlePrevMonth}
                  title="이전 달"
                  style={{ width: '32px', height: '32px' }}
                >
                  <ChevronLeft size={18} />
                </button>
                <button
                  className="btn btn-outline btn-sm"
                  onClick={() => {
                    const now = new Date();
                    setCurrentYearMonth({ year: now.getFullYear(), month: now.getMonth() });
                    setSelectedDate(todayStr);
                  }}
                  title="오늘 날짜로 이동"
                  style={{ padding: '0.3rem 0.75rem', fontWeight: 700 }}
                >
                  오늘
                </button>
                <button
                  className="btn btn-outline btn-sm btn-icon-only"
                  onClick={handleNextMonth}
                  title="다음 달"
                  style={{ width: '32px', height: '32px' }}
                >
                  <ChevronRight size={18} />
                </button>
              </div>
            </div>

            {/* 요일 라벨 */}
            <div className="calendar-grid" style={{ marginBottom: '6px' }}>
              {['일', '월', '화', '수', '목', '금', '토'].map((name, idx) => (
                <div key={name} className="calendar-day-label" style={{ color: idx === 0 ? '#ef4444' : idx === 6 ? '#3b82f6' : 'var(--text-muted)' }}>
                  {name}
                </div>
              ))}
            </div>

            {/* 날짜 셀 그리드 (소프트 파스텔 + '오늘' 직관 꼬리표 라벨) */}
            <div className="calendar-grid">
              {calendarDays.map((item, index) => {
                const isSelected = item.dateStr === selectedDate;
                const isToday = item.dateStr === todayStr;
                const hasActivity = datesWithActivity.has(item.dateStr);

                // 소프트 파스텔 배경 및 테두리
                const cellBg = !item.isCurrentMonth 
                  ? 'transparent' 
                  : isSelected 
                    ? 'rgba(16, 185, 129, 0.16)' 
                    : 'var(--bg-card-subtle)';

                const cellBorder = !item.isCurrentMonth
                  ? 'none'
                  : isSelected
                    ? '2px solid var(--color-primary)'
                    : isToday
                      ? '1.5px solid var(--border-color)'
                      : '1px solid var(--border-color)';

                const textColor = isSelected ? '#065f46' : 'var(--text-main)';

                return (
                  <button
                    key={index}
                    type="button"
                    disabled={!item.isCurrentMonth}
                    onClick={() => setSelectedDate(item.dateStr)}
                    style={{
                      aspectRatio: '1',
                      width: '100%',
                      minHeight: '42px',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      borderRadius: 'var(--radius-md)',
                      fontSize: '0.95rem',
                      fontWeight: (isSelected || isToday) ? 800 : 600,
                      cursor: item.isCurrentMonth ? 'pointer' : 'default',
                      position: 'relative',
                      transition: 'all 0.15s ease',
                      opacity: item.isCurrentMonth ? 1 : 0.25,
                      background: cellBg,
                      border: cellBorder,
                      color: textColor,
                      boxSizing: 'border-box',
                      padding: 0
                    }}
                  >
                    {/* 방법 1: 앙증맞은 '오늘' 꼬리표 라벨 (0.1초 만에 오늘 구별) */}
                    {isToday && (
                      <span style={{
                        fontSize: '0.62rem',
                        fontWeight: 800,
                        color: isSelected ? '#047857' : 'var(--color-primary)',
                        lineHeight: 1,
                        marginBottom: '1px'
                      }}>
                        오늘
                      </span>
                    )}

                    <span>{item.dayNumber}</span>

                    {/* 하단 활동 기록 점 */}
                    {hasActivity && (
                      <span style={{
                        width: '4.5px',
                        height: '4.5px',
                        borderRadius: '50%',
                        background: isSelected ? 'var(--color-primary)' : 'var(--color-primary)',
                        position: 'absolute',
                        bottom: '3px'
                      }} />
                    )}
                  </button>
                );
              })}
            </div>

            <div style={{
              marginTop: '1.25rem',
              paddingTop: '0.85rem',
              borderTop: '1px solid var(--border-color)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '0.5rem',
              flexWrap: 'wrap',
              fontSize: '0.75rem',
              color: 'var(--text-muted)'
            }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--color-primary)', display: 'inline-block' }} />
                일정/작업 기록 있음
              </span>
              <button
                className="btn btn-outline btn-sm"
                onClick={() => onOpenScheduleModal(selectedDate)}
                style={{ fontSize: '0.75rem', padding: '0.2rem 0.55rem', display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}
                title="선택한 일자에 새 영농 일정 등록"
              >
                <Plus size={12} />
                <span>일정 추가</span>
              </button>
            </div>
          </div>
        </div>

        {/* 오른쪽: 선택한 날짜의 다이어리 및 관리 내역 (외부 중첩 박스 제거로 시원한 뷰 제공) */}
        <div className="diary-detail-section">
          {/* 상단 날짜 헤더 */}
          <div className="diary-section-header">
            <div>
              <span style={{ fontSize: '0.825rem', color: 'var(--text-subtle)', fontWeight: 700 }}>
                일일 영농 일지
              </span>
              <h2 style={{ fontSize: '1.35rem', fontWeight: 800, margin: '0.15rem 0 0 0' }}>
                {getFormattedDateTitle(selectedDate)}
              </h2>
            </div>
          </div>

          {/* 독(Dock) 세그먼트 탭 바: [알람] -> [일정] -> [관리 내역] (이모지 제거 및 스크롤 타겟 지정) */}
          <div className="diary-dock-tabs" ref={dockTabsRef} style={{ scrollMarginTop: '80px' }}>
            {/* 1. 알람 탭: 미처리 알람(pendingRemindersCount > 0)이 있을 때만 노출, 0건이면 자동 소멸 */}
            {pendingRemindersCount > 0 && (
              <button
                type="button"
                className={`diary-dock-tab tab-reminders ${activeDiaryTab === 'reminders' ? 'active' : ''}`}
                onClick={() => handleTabClick('reminders')}
              >
                <span>알람</span>
                <span className="diary-tab-count" style={{ background: '#f59e0b', color: '#fff' }}>
                  {pendingRemindersCount}
                </span>
              </button>
            )}

            {/* 2. 일정 탭 */}
            <button
              type="button"
              className={`diary-dock-tab tab-schedules ${activeDiaryTab === 'schedules' ? 'active' : ''}`}
              onClick={() => handleTabClick('schedules')}
            >
              <span>일정</span>
              <span className="diary-tab-count">
                {pendingDailySchedulesCount}
              </span>
            </button>

            {/* 3. 관리 내역 탭 */}
            <button
              type="button"
              className={`diary-dock-tab tab-logs ${activeDiaryTab === 'logs' ? 'active' : ''}`}
              onClick={() => handleTabClick('logs')}
            >
              <span>관리 내역</span>
              <span className="diary-tab-count">
                {dailyLogs.length}
              </span>
            </button>
          </div>

          {/* 탭 1: 일정 화면 */}
          {/* 탭 1: 알람 화면 (미처리 알람이 있을 때만 활성화) */}
          {activeDiaryTab === 'reminders' && (
            <div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem', marginBottom: '0.75rem' }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '0.4rem',
                  fontSize: '0.92rem',
                  fontWeight: 700,
                  color: 'var(--color-accent)'
                }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                    <span>🔔</span>
                    <span>도래한 알람 ({scheduledTasks.length}건)</span>
                  </span>
                  <span style={{
                    fontSize: '0.72rem',
                    color: 'var(--color-accent)',
                    background: 'rgba(245, 158, 11, 0.15)',
                    padding: '0.15rem 0.45rem',
                    borderRadius: 'var(--radius-sm)',
                    fontWeight: 700
                  }}>
                    D-Day 오늘
                  </span>
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  ※ 개체 관리기록에서 등록한 도래 예정 작업입니다. [일정으로]를 눌러 공식 일정으로 등록하세요.
                </div>
              </div>

              {scheduledTasks.length === 0 ? (
                <div style={{
                  textAlign: 'center',
                  padding: '2.5rem 1rem',
                  background: 'var(--bg-card-subtle)',
                  borderRadius: 'var(--radius-md)',
                  color: 'var(--text-muted)'
                }}>
                  <Clock size={36} style={{ opacity: 0.3, marginBottom: '0.5rem', color: 'var(--color-accent)' }} />
                  <div style={{ fontWeight: 600 }}>현재 처리할 도래 알람이 없습니다.</div>
                  <p style={{ fontSize: '0.825rem', marginTop: '0.25rem' }}>
                    모든 알람이 처리되었거나 예정된 알람이 없습니다.
                  </p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                      {scheduledTasks.map(task => {
                        const targetEntity = (entities || []).find(e => e.id === task.entityId || e.tagNumber === task.tagNumber);
                        const entityName = task.entityName || targetEntity?.name || '';
                        const reminderCardId = `reminder-${task.id}`;
                        const isDone = Boolean(task.nextScheduleCompleted);
                        const isExpanded = expandedCompletedIds.has(reminderCardId);
                        const isEarlyCompleted = isDone && Boolean(task.nextScheduleCompletedDate) && task.nextScheduleCompletedDate !== task.nextScheduleDate;
                        const earlyDateText = task.nextScheduleCompletedDate 
                          ? `${parseInt(task.nextScheduleCompletedDate.slice(5, 7), 10)}월 ${parseInt(task.nextScheduleCompletedDate.slice(8, 10), 10)}일에 미리 처리됨`
                          : '미리 처리됨';

                      // 1. 완료 상태이면서 접힌 모드: 1행 콤팩트 가로 배치 [체크박스 + 개체번호 + 작업이름(말줄임)]
                      if (isDone && !isExpanded) {
                        return (
                          <div 
                            key={`sched-${task.id}`}
                            className="diary-item-card"
                            onClick={() => toggleExpandCompleted(reminderCardId)}
                            style={{
                              background: 'var(--bg-card)',
                              border: '1px solid var(--border-color)',
                              borderRadius: 'var(--radius-md)',
                              padding: '0.45rem 0.75rem',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              gap: '0.5rem',
                              cursor: 'pointer',
                              transition: 'all 0.2s ease',
                              minHeight: '36px',
                              opacity: 1
                            }}
                            title="클릭하여 상세 내용 펼치기"
                          >
                            <div style={{ 
                              display: 'flex', 
                              alignItems: 'center', 
                              gap: '0.5rem', 
                              minWidth: 0, 
                              flex: 1,
                              overflow: 'hidden'
                            }}>
                              <CheckCircle2 size={16} color="var(--color-primary)" style={{ flexShrink: 0 }} />
                              {/* 개체번호 (클릭 시 원본 관리기록 및 다음 일정 열람 - 대시 밑줄 및 초록색 호버) */}
                              <span 
                                className="spec-link-mother"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (onEditCareLog) onEditCareLog(task, { focusNextSchedule: true });
                                }}
                                title="클릭 시 이 알람이 등록된 원본 관리기록 열람"
                                style={{ 
                                  cursor: 'pointer', 
                                  fontSize: '0.92rem', 
                                  fontWeight: 800, 
                                  letterSpacing: '-0.01em',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  flexShrink: 0 
                                }}
                              >
                                {task.tagNumber}
                              </span>

                              {/* 소 이름: 선명하고 적당한 두께의 텍스트 */}
                              {entityName && (
                                <span style={{ 
                                  fontSize: '0.92rem', 
                                  fontWeight: 600, 
                                  color: 'var(--text-main)',
                                  flexShrink: 0 
                                }}>
                                  {entityName}
                                </span>
                              )}

                              {/* 작업 이름: 원래 선명한 텍스트 컬러 유지 (var(--text-main)), 좁으면 말줄임, 가로줄 없음 */}
                              <span style={{ 
                                fontSize: '0.88rem', 
                                fontWeight: 600,
                                color: 'var(--text-main)', 
                                textDecoration: 'none',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap',
                                minWidth: 0,
                                flex: 1
                              }}>
                                {task.nextScheduleTitle || '예정 작업'}
                              </span>
                            </div>

                            {/* 우측: 미리 처리됨 뱃지 및 펼치기 힌트 아이콘 */}
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexShrink: 0 }}>
                              {isEarlyCompleted && (
                                <span style={{
                                  fontSize: '0.72rem',
                                  color: '#059669',
                                  background: 'rgba(16, 185, 129, 0.12)',
                                  padding: '0.1rem 0.35rem',
                                  borderRadius: 'var(--radius-sm)',
                                  fontWeight: 700,
                                  whiteSpace: 'nowrap'
                                }}>
                                  {earlyDateText}
                                </span>
                              )}
                              <div style={{ color: 'var(--text-subtle)', display: 'flex', alignItems: 'center', paddingLeft: '0.2rem' }} title="상세 내용 펼치기">
                                <ChevronDown size={14} />
                              </div>
                            </div>
                          </div>
                        );
                      }

                      // 2. 미완료 상태이거나 사용자가 클릭하여 펼친 경우 (2행 카드)
                      return (
                        <div 
                          key={`sched-${task.id}`}
                          className="diary-item-card"
                          style={{
                            background: isDone ? 'var(--bg-card)' : 'rgba(245, 158, 11, 0.08)',
                            border: `1px solid ${isDone ? 'var(--border-color)' : 'rgba(245, 158, 11, 0.3)'}`,
                            borderRadius: 'var(--radius-md)',
                            padding: '0.65rem 0.85rem',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '0.35rem',
                            opacity: 1,
                            transition: 'all 0.2s ease'
                          }}
                        >
                          {/* 1행: [체크박스] [개체번호] [별명]   ...   [기록] 버튼 & 접기버튼 (우측 상단) */}
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem', width: '100%' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', flexWrap: 'wrap', minWidth: 0, flex: 1 }}>
                              {/* 개체번호 (클릭 시 원본 관리기록 및 다음 일정 열람 - 대시 밑줄 및 초록색 호버) */}
                              <span 
                                className="spec-link-mother"
                                onClick={() => {
                                  if (onEditCareLog) onEditCareLog(task, { focusNextSchedule: true });
                                }}
                                title="클릭 시 이 알람이 등록된 원본 관리기록 열람"
                                style={{ 
                                  cursor: 'pointer', 
                                  fontSize: '0.95rem', 
                                  fontWeight: 800, 
                                  letterSpacing: '-0.01em',
                                  display: 'inline-flex',
                                  alignItems: 'center'
                                }}
                              >
                                {task.tagNumber}
                              </span>

                              {/* 소 이름: 선명하고 적당한 두께의 텍스트 */}
                              {entityName && (
                                <span style={{ 
                                  fontSize: '0.92rem', 
                                  fontWeight: 600, 
                                  color: 'var(--text-main)' 
                                }}>
                                  {entityName}
                                </span>
                              )}
                            </div>

                            {/* 우측 상단: 미리완료 뱃지 / [일정 등록] 버튼 / 다시 접기 버튼 */}
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', flexShrink: 0 }}>
                              {isEarlyCompleted && (
                                <span style={{
                                  fontSize: '0.72rem',
                                  color: '#059669',
                                  background: 'rgba(16, 185, 129, 0.12)',
                                  padding: '0.15rem 0.45rem',
                                  borderRadius: 'var(--radius-sm)',
                                  fontWeight: 700,
                                  whiteSpace: 'nowrap'
                                }}>
                                  {earlyDateText}
                                </span>
                              )}
                              {isDone && isExpanded && (
                                <button
                                  type="button"
                                  className="btn btn-outline btn-sm btn-icon-only"
                                  onClick={() => toggleExpandCompleted(reminderCardId)}
                                  title="다시 1줄로 접기"
                                  style={{ width: '24px', height: '24px', padding: 0 }}
                                >
                                  <ChevronUp size={13} />
                                </button>
                              )}
                              {!isDone && onOpenScheduleModal && (
                                <button
                                  type="button"
                                  className="btn btn-outline btn-sm"
                                  onClick={() => {
                                    onOpenScheduleModal(task.nextScheduleDate || selectedDate, {
                                      entityId: task.entityId,
                                      tagNumber: task.tagNumber,
                                      category: task.category || 'routine',
                                      title: task.nextScheduleTitle || '',
                                      time: task.nextScheduleTime || '',
                                      memo: task.details || '',
                                      originReminderLogId: task.id
                                    });
                                  }}
                                  title="이 알람을 공식 영농 일정으로 등록 (캘린더에 일정 등록)"
                                  style={{
                                    fontSize: '0.75rem',
                                    fontWeight: 700,
                                    padding: '0.15rem 0.5rem',
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: '0.25rem',
                                    height: '24px',
                                    borderRadius: 'var(--radius-sm)',
                                    color: '#d97706',
                                    border: '1px solid #d97706',
                                    background: 'rgba(217, 119, 6, 0.08)',
                                    boxShadow: '0 1px 2px rgba(217, 119, 6, 0.15)'
                                  }}
                                >
                                  <Calendar size={12} />
                                  <span>일정 등록</span>
                                </button>
                              )}
                            </div>
                          </div>

                          {/* 2행: [시간] [차기 예정 작업명 (말줄임)] (좌측) & [날짜변경] 버튼 (우측) */}
                          <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            gap: '0.6rem',
                            width: '100%',
                            paddingLeft: 0,
                            marginTop: '0.15rem'
                          }}>
                            <div style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '0.45rem',
                              flex: 1,
                              minWidth: 0
                            }}>
                              {task.nextScheduleTime && (
                                <span style={{
                                  fontWeight: 700,
                                  fontSize: '0.92rem',
                                  color: 'var(--text-main)',
                                  opacity: 0.7,
                                  whiteSpace: 'nowrap',
                                  flexShrink: 0
                                }}>
                                  {task.nextScheduleTime.startsWith('0') ? task.nextScheduleTime.slice(1) : task.nextScheduleTime}
                                </span>
                              )}

                              <div 
                                style={{ 
                                  fontWeight: 700, 
                                  fontSize: '0.92rem', 
                                  color: 'var(--text-main)',
                                  textDecoration: isDone ? 'line-through' : 'none',
                                  overflow: 'hidden',
                                  textOverflow: 'ellipsis',
                                  whiteSpace: 'nowrap',
                                  flex: 1,
                                  minWidth: 0
                                }}
                                title={task.nextScheduleTitle || '예정 작업'}
                              >
                                {task.nextScheduleTitle || '예정 작업'}
                              </div>
                            </div>

                            {/* 우측: 수정 버튼 자리에 [날짜변경] 버튼 배치 (수정 버튼과 동일한 외곽선 라인) */}
                            {!isDone && onUpdateReminderDate && (
                              <button
                                type="button"
                                className="btn btn-outline btn-sm"
                                onClick={() => {
                                  if (editingReminderDateId === task.id) {
                                    setEditingReminderDateId(null);
                                  } else {
                                    setEditingReminderDateId(task.id);
                                    setTempReminderDate(task.nextScheduleDate || selectedDate);
                                  }
                                }}
                                title="알람 날짜 변경 (미루기/당기기)"
                                style={{
                                  fontSize: '0.75rem',
                                  fontWeight: 600,
                                  padding: '0.15rem 0.5rem',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  gap: '0.25rem',
                                  height: '24px',
                                  borderRadius: 'var(--radius-sm)',
                                  color: 'var(--text-main)',
                                  border: '1px solid var(--text-muted)',
                                  background: 'var(--bg-card)'
                                }}
                              >
                                <Clock size={12} />
                                <span>날짜 변경</span>
                              </button>
                            )}
                          </div>

                          {/* 3행: 인라인 날짜 변경 폼 (양끝 정렬 & 카드 일체형 스타일) */}
                          {editingReminderDateId === task.id && (
                            <div style={{
                              marginTop: '0.45rem',
                              paddingTop: '0.45rem',
                              borderTop: '1px dashed rgba(245, 158, 11, 0.35)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              gap: '0.5rem',
                              width: '100%'
                            }}>
                              {/* 좌측: 변경일 라벨 & 날짜 선택 인풋 */}
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', flex: 1, minWidth: 0 }}>
                                <span style={{ 
                                  fontSize: '0.78rem', 
                                  fontWeight: 700, 
                                  color: 'var(--text-subtle)',
                                  whiteSpace: 'nowrap',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '0.2rem'
                                }}>
                                  <Calendar size={12} color="var(--color-accent)" />
                                  <span>변경일:</span>
                                </span>
                                <input 
                                  type="date"
                                  className="form-control form-control-sm"
                                  style={{ 
                                    maxWidth: '140px',
                                    height: '24px',
                                    padding: '0.1rem 0.4rem', 
                                    fontSize: '0.78rem',
                                    borderRadius: 'var(--radius-sm)',
                                    border: '1px solid var(--border-color)',
                                    background: 'var(--bg-card)'
                                  }}
                                  value={tempReminderDate}
                                  onChange={(e) => setTempReminderDate(e.target.value)}
                                />
                              </div>

                              {/* 우측: 상단 버튼 라인과 수직 정렬되는 [취소], [적용] 버튼 */}
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', flexShrink: 0 }}>
                                <button
                                  type="button"
                                  className="btn btn-outline btn-sm"
                                  style={{ 
                                    height: '24px',
                                    padding: '0.15rem 0.5rem', 
                                    fontSize: '0.75rem',
                                    fontWeight: 600,
                                    borderRadius: 'var(--radius-sm)',
                                    border: '1px solid var(--text-muted)',
                                    color: 'var(--text-main)',
                                    background: 'var(--bg-card)'
                                  }}
                                  onClick={() => setEditingReminderDateId(null)}
                                >
                                  취소
                                </button>
                                <button
                                  type="button"
                                  className="btn btn-primary btn-sm"
                                  style={{ 
                                    height: '24px',
                                    padding: '0.15rem 0.55rem', 
                                    fontSize: '0.75rem',
                                    fontWeight: 700,
                                    borderRadius: 'var(--radius-sm)',
                                    background: '#047857',
                                    borderColor: '#047857',
                                    color: '#ffffff',
                                    boxShadow: '0 1px 2px rgba(4, 120, 87, 0.2)'
                                  }}
                                  onClick={() => {
                                    if (tempReminderDate && onUpdateReminderDate) {
                                      onUpdateReminderDate(task.id, tempReminderDate);
                                    }
                                    setEditingReminderDateId(null);
                                  }}
                                >
                                  적용
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                      })}
                    </div>
                  )}
                </div>
              )}

          {activeDiaryTab === 'schedules' && (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                <h4 style={{
                  fontSize: '0.92rem',
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                  margin: 0,
                  color: 'var(--text-main)'
                }}>
                  <span>📌</span>
                  <span>등록된 일정 ({dailySchedules.length}건)</span>
                </h4>
                <button
                  className="btn btn-outline btn-sm"
                  onClick={() => onOpenScheduleModal(selectedDate)}
                  style={{ fontSize: '0.75rem', padding: '0.2rem 0.55rem', display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}
                >
                  <Plus size={12} />
                  <span>일정 추가</span>
                </button>
              </div>

              {dailySchedules.length === 0 ? (
                <div style={{
                  textAlign: 'center',
                  padding: '2.5rem 1rem',
                  background: 'var(--bg-card-subtle)',
                  borderRadius: 'var(--radius-md)',
                  color: 'var(--text-muted)'
                }}>
                  <Clock size={36} style={{ opacity: 0.3, marginBottom: '0.5rem', color: 'var(--color-accent)' }} />
                  <div style={{ fontWeight: 600 }}>{selectedDate}에 등록된 일정이 없습니다.</div>
                  <p style={{ fontSize: '0.825rem', marginTop: '0.25rem' }}>
                    새로운 영농 일정이나 진료/사료 계획을 등록해보세요.
                  </p>
                  <button
                    className="btn btn-primary btn-sm"
                    onClick={() => onOpenScheduleModal(selectedDate)}
                    style={{ marginTop: '0.75rem' }}
                  >
                    <Plus size={14} />
                    <span>이 날짜에 새 일정 추가</span>
                  </button>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                  {dailySchedules.map(sched => {
                        const targetEntity = (entities || []).find(e => e.id === sched.entityId || e.tagNumber === sched.tagNumber);
                        const entityName = sched.entityName || targetEntity?.name || '';
                        const isDone = Boolean(sched.completed);
                        const isExpanded = expandedCompletedIds.has(sched.id);
                        const cleanTitle = entityName ? (sched.title || '').replace(new RegExp(`^\\[${entityName}\\]\\s*`), '') : (sched.title || '');

                      // 1. 완료 상태이면서 접힌 모드: 1행 콤팩트 가로 배치 [체크박스 + 개체번호/농장공통 + 일정제목(말줄임)]
                      if (isDone && !isExpanded) {
                        return (
                          <div
                            key={sched.id}
                            className="diary-item-card"
                            onClick={() => toggleExpandCompleted(sched.id)}
                            style={{
                              background: 'var(--bg-card)',
                              border: '1px solid var(--border-color)',
                              borderRadius: 'var(--radius-md)',
                              padding: '0.45rem 0.75rem',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              gap: '0.5rem',
                              cursor: 'pointer',
                              transition: 'all 0.2s ease',
                              minHeight: '36px',
                              overflow: 'hidden',
                              opacity: 1
                            }}
                            title="클릭하여 상세 내용 펼치기"
                          >
                            <div style={{ 
                              display: 'flex', 
                              alignItems: 'center', 
                              gap: '0.5rem', 
                              minWidth: 0, 
                              flex: 1, 
                              overflow: 'hidden' 
                            }}>
                              {/* 완료 체크 원형 토글 버튼 */}
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onToggleScheduleComplete(sched.id);
                                }}
                                style={{
                                  background: 'none',
                                  border: 'none',
                                  cursor: 'pointer',
                                  padding: '4px',
                                  margin: '-4px',
                                  color: 'var(--color-primary)',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  flexShrink: 0,
                                  borderRadius: '50%'
                                }}
                                title="미완료로 변경 (원래 카드로 복원)"
                              >
                                <CheckCircle2 size={19} color="var(--color-primary)" />
                              </button>

                              {/* 개체번호 (캡슐 제거, 굵고 시원한 텍스트) 또는 농장 공통 뱃지 */}
                              {sched.tagNumber ? (
                                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.45rem', flexShrink: 0 }}>
                                  <span 
                                    className="spec-link-mother"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      onOpenEntityDetail(sched.tagNumber);
                                    }}
                                    title="클릭 시 이 개체의 관리 내역으로 이동"
                                    style={{ 
                                      cursor: 'pointer', 
                                      fontSize: '0.92rem', 
                                      fontWeight: 800, 
                                      letterSpacing: '-0.01em',
                                      display: 'inline-flex',
                                      alignItems: 'center'
                                    }}
                                  >
                                    {sched.tagNumber}
                                  </span>
                                  {entityName && (
                                    <span style={{ 
                                      fontSize: '0.92rem', 
                                      fontWeight: 600, 
                                      color: 'var(--text-main)',
                                      flexShrink: 0 
                                    }}>
                                      {entityName}
                                    </span>
                                  )}
                                </div>
                              ) : (
                                <span style={{
                                  fontSize: '0.82rem',
                                  color: 'var(--text-main)',
                                  background: 'var(--bg-card-subtle)',
                                  padding: '0.15rem 0.45rem',
                                  borderRadius: 'var(--radius-sm)',
                                  border: '1px solid var(--border-color)',
                                  fontWeight: 700,
                                  flexShrink: 0
                                }}>
                                  {entityName || '농장 공통'}
                                </span>
                              )}

                              {/* 일정 제목: 원래 선명한 텍스트 컬러 유지 (var(--text-main)), 좁으면 말줄임, 가로줄 없음 */}
                              <span style={{ 
                                fontSize: '0.88rem', 
                                fontWeight: 600,
                                color: 'var(--text-main)', 
                                textDecoration: 'none',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap',
                                minWidth: 0,
                                flex: 1
                              }}>
                                {cleanTitle || sched.title}
                              </span>
                            </div>

                            {/* 우측 펼치기 힌트 아이콘 */}
                            <div style={{ color: 'var(--text-subtle)', display: 'flex', alignItems: 'center', flexShrink: 0, paddingLeft: '0.2rem' }} title="상세 내용 펼치기">
                              <ChevronDown size={14} />
                            </div>
                          </div>
                        );
                      }

                      // 2. 미완료 상태이거나, 사용자가 클릭하여 펼친 경우 (원래 3행 카드)
                      return (
                        <div 
                          key={sched.id}
                          className="diary-item-card"
                          style={{
                            background: isDone ? 'var(--bg-card)' : 'rgba(245, 158, 11, 0.08)',
                            border: `1px solid ${isDone ? 'var(--border-color)' : 'rgba(245, 158, 11, 0.3)'}`,
                            borderRadius: 'var(--radius-md)',
                            padding: '0.65rem 0.85rem',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '0.35rem',
                            opacity: 1,
                            transition: 'all 0.2s ease'
                          }}
                        >
                          {/* 1행: [체크박스] [개체번호 or 농장공통] [별명] [간략한 시간]   ...   [수정][삭제] (우측 상단) */}
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem', width: '100%' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', flexWrap: 'wrap', minWidth: 0, flex: 1 }}>
                              {/* 완료 체크 원형 토글 버튼 */}
                              <button
                                type="button"
                                onClick={() => onToggleScheduleComplete(sched.id)}
                                style={{
                                  background: 'none',
                                  border: 'none',
                                  cursor: 'pointer',
                                  padding: '4px',
                                  margin: '-4px',
                                  color: isDone ? 'var(--color-primary)' : 'var(--text-muted)',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  flexShrink: 0,
                                  borderRadius: '50%'
                                }}
                                title={isDone ? '미완료로 변경' : '완료로 표시'}
                              >
                                {isDone ? (
                                  <CheckCircle2 size={19} color="var(--color-primary)" />
                                ) : (
                                  <Circle size={19} color="var(--text-muted)" />
                                )}
                              </button>

                              {/* 개체번호 (캡슐 제거, 굵고 시원한 텍스트) 또는 농장 공통 뱃지 */}
                              {sched.tagNumber ? (
                                <span 
                                  className="spec-link-mother"
                                  onClick={() => onOpenEntityDetail(sched.tagNumber)}
                                  title="클릭 시 이 개체의 관리 내역으로 이동"
                                  style={{ 
                                    cursor: 'pointer', 
                                    fontSize: '0.95rem', 
                                    fontWeight: 800, 
                                    letterSpacing: '-0.01em',
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    flexShrink: 0 
                                  }}
                                >
                                  {sched.tagNumber}
                                </span>
                              ) : (
                                <span style={{
                                  fontSize: '0.82rem',
                                  color: 'var(--text-main)',
                                  background: 'var(--bg-card-subtle)',
                                  padding: '0.15rem 0.45rem',
                                  borderRadius: 'var(--radius-sm)',
                                  border: '1px solid var(--border-color)',
                                  fontWeight: 700,
                                  flexShrink: 0
                                }}>
                                  {entityName || '농장 공통'}
                                </span>
                              )}

                              {/* 별명 (개체명: 선명하고 적당한 두께의 텍스트) */}
                              {sched.tagNumber && entityName && (
                                <span style={{ 
                                  fontSize: '0.92rem', 
                                  fontWeight: 600, 
                                  color: 'var(--text-main)' 
                                }}>
                                  {entityName}
                                </span>
                              )}
                            </div>

                            {/* 우측 조작 버튼 (펼침 시 다시 접기 버튼, [+ 기록] 또는 [✏️] 버튼) */}
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', flexShrink: 0 }}>
                              {isDone && isExpanded && (
                                <button
                                  type="button"
                                  className="btn btn-outline btn-sm btn-icon-only"
                                  onClick={() => toggleExpandCompleted(sched.id)}
                                  title="다시 1줄로 접기"
                                  style={{ width: '26px', height: '26px', padding: 0 }}
                                >
                                  <ChevronUp size={13} />
                                </button>
                              )}

                              {/* 개체번호가 있는 경우: [+ 기록] 버튼 */}
                              {sched.tagNumber && onOpenCareLogModal && (
                                <button 
                                  type="button" 
                                  className="btn btn-primary btn-sm"
                                  onClick={() => {
                                    const targetEntity = (entities || []).find(e => e.id === sched.entityId || e.tagNumber === sched.tagNumber);
                                    const todayDate = getTodayDateString();
                                    const isFuture = selectedDate > todayDate;
                                    const effectiveDate = isFuture ? todayDate : selectedDate;
                                    onOpenCareLogModal(
                                      targetEntity || { tagNumber: sched.tagNumber, name: entityName, id: sched.entityId },
                                      effectiveDate,
                                      {
                                        category: sched.category || 'routine',
                                        title: cleanTitle || sched.title || '',
                                        date: effectiveDate,
                                        time: sched.time || undefined,
                                        entityId: sched.entityId || (targetEntity ? targetEntity.id : ''),
                                        details: sched.memo || '',
                                        linkedScheduleId: sched.id
                                      }
                                    );
                                  }}
                                  style={{ 
                                    fontSize: '0.75rem', 
                                    padding: '0.2rem 0.55rem', 
                                    flexShrink: 0,
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '0.25rem',
                                    minWidth: '54px',
                                    justifyContent: 'center',
                                    border: '1px solid #047857',
                                    boxShadow: '0 1px 3px rgba(4, 120, 87, 0.3)'
                                  }}
                                  title="이 일정으로 새 관리기록 작성 (분류·작업명·메모 자동 입력)"
                                >
                                  <Plus size={12} />
                                  <span>기록</span>
                                </button>
                              )}

                              {/* 개체번호가 없는 경우: 기록 버튼 대신 해당 위치에 [✏️] 수정 버튼 배치 */}
                              {!sched.tagNumber && onEditSchedule && (
                                <button
                                  type="button"
                                  className="btn btn-outline btn-sm btn-icon-only"
                                  onClick={() => onEditSchedule(sched)}
                                  title="일정 수정"
                                  style={{
                                    width: '24px',
                                    height: '24px',
                                    padding: 0,
                                    flexShrink: 0,
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    border: '1px solid var(--text-muted)',
                                    color: 'var(--text-main)',
                                    background: 'var(--bg-card)',
                                    borderRadius: 'var(--radius-sm)'
                                  }}
                                >
                                  <Edit2 size={12} />
                                </button>
                              )}
                            </div>
                          </div>

                          {/* 2행: [시간] [일정 제목 (말줄임)] (좌측) & [수정] 버튼 (우측) */}
                          <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            gap: '0.6rem',
                            width: '100%',
                            paddingLeft: 0,
                            marginTop: '0.15rem'
                          }}>
                            <div style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '0.45rem',
                              flex: 1,
                              minWidth: 0
                            }}>
                              {sched.time && (
                                <span style={{
                                  fontWeight: 700,
                                  fontSize: '0.92rem',
                                  color: 'var(--text-main)',
                                  opacity: 0.7,
                                  whiteSpace: 'nowrap',
                                  flexShrink: 0
                                }}>
                                  {sched.time.startsWith('0') ? sched.time.slice(1) : sched.time}
                                </span>
                              )}

                              <div 
                                style={{
                                  fontWeight: 700,
                                  fontSize: '0.92rem',
                                  color: 'var(--text-main)',
                                  textDecoration: isDone ? 'line-through' : 'none',
                                  overflow: 'hidden',
                                  textOverflow: 'ellipsis',
                                  whiteSpace: 'nowrap',
                                  flex: 1,
                                  minWidth: 0
                                }}
                                title={cleanTitle || sched.title}
                              >
                                {cleanTitle || sched.title}
                              </div>
                            </div>

                            {/* 개체번호가 있는 경우: 1행의 [+ 기록] 버튼 바로 밑(2행 우측)에 [✏️] 수정 버튼 배치 */}
                            {sched.tagNumber && onEditSchedule && (
                              <button
                                type="button"
                                className="btn btn-outline btn-sm btn-icon-only"
                                onClick={() => onEditSchedule(sched)}
                                title="일정 수정"
                                style={{
                                  width: '24px',
                                  height: '24px',
                                  padding: 0,
                                  flexShrink: 0,
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  border: '1px solid var(--text-muted)',
                                  color: 'var(--text-main)',
                                  background: 'var(--bg-card)',
                                  borderRadius: 'var(--radius-sm)'
                                }}
                              >
                                <Edit2 size={12} />
                              </button>
                            )}
                          </div>

                          {/* 3행: 상세 메모 (메모가 있을 때만 렌더링) */}
                          {sched.memo && (
                            <div style={{
                              fontSize: '0.8rem',
                              color: 'var(--text-muted)',
                              paddingLeft: 0,
                              wordBreak: 'break-word',
                              lineHeight: 1.35
                            }}>
                              ※ {sched.memo}
                            </div>
                          )}
                        </div>
                      );
                    })}
                </div>
              )}
            </div>
          )}

          {/* 탭 2: 관리 내역 화면 */}
          {activeDiaryTab === 'logs' && (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem', gap: '0.5rem', flexWrap: 'wrap' }}>
                <h4 style={{
                  fontSize: '0.95rem',
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  margin: 0
                }}>
                  <CheckCircle2 size={16} color="var(--color-primary)" />
                  <span>관리 내역 ({dailyLogs.length}건)</span>
                </h4>

                <button
                  className="btn btn-secondary btn-sm"
                  onClick={() => onNavigateToReport(selectedDate)}
                  title="이 날짜의 일일 종합 영농 보고서 보기"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', padding: '0.25rem 0.65rem', fontSize: '0.8rem', fontWeight: 600 }}
                >
                  <FileText size={14} />
                  <span>일일 보고서</span>
                </button>
              </div>

              {dailyLogs.length === 0 ? (
                <div style={{
                  textAlign: 'center',
                  padding: '2.5rem 1rem',
                  background: 'var(--bg-card-subtle)',
                  borderRadius: 'var(--radius-md)',
                  color: 'var(--text-muted)'
                }}>
                  <CalendarIcon size={36} style={{ opacity: 0.3, marginBottom: '0.5rem' }} />
                  <div style={{ fontWeight: 600 }}>{selectedDate}에 등록된 관리 내역이 없습니다.</div>
                  <p style={{ fontSize: '0.825rem', marginTop: '0.25rem' }}>
                    작업 내역을 추가하여 당일 영농 다이어리를 작성해보세요.
                  </p>
                  <button
                    className="btn btn-primary btn-sm"
                    onClick={() => onOpenCareLogModal(null, selectedDate)}
                    style={{ marginTop: '0.75rem' }}
                  >
                    <Plus size={14} />
                    <span>이 날짜에 관리 기록 추가</span>
                  </button>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                  {dailyLogs.map(log => {
                    const catObj = getCategoryById(log.category, careCategories);
                    const targetEntity = (entities || []).find(e => e.id === log.entityId || e.tagNumber === log.tagNumber);
                    const entityName = log.entityName || targetEntity?.name || '';
                    const detailText = log.details || log.description || '';

                    return (
                      <div
                        key={log.id}
                        className="card"
                        style={{
                          padding: '0.75rem 0.85rem'
                        }}
                      >
                        {/* 1행: [개체번호] [개체이름] [관리분류] <──────────> [✏️ 수정버튼] */}
                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          gap: '0.45rem',
                          width: '100%'
                        }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', flexWrap: 'wrap', minWidth: 0, flex: 1 }}>
                            {/* 개체번호 (일정 카드와 동일한 대시 밑줄 및 초록색 호버) 또는 농장 공통 뱃지 */}
                            {log.tagNumber ? (
                              <span
                                className="spec-link-mother"
                                onClick={() => onOpenEntityDetail(log.tagNumber)}
                                title="클릭 시 이 개체의 관리 내역으로 이동"
                                style={{ 
                                  cursor: 'pointer',
                                  fontSize: '0.95rem',
                                  fontWeight: 800,
                                  letterSpacing: '-0.01em',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  flexShrink: 0
                                }}
                              >
                                {log.tagNumber}
                              </span>
                            ) : (
                              <span style={{
                                fontSize: '0.82rem',
                                color: 'var(--text-main)',
                                background: 'var(--bg-card-subtle)',
                                padding: '0.15rem 0.45rem',
                                borderRadius: 'var(--radius-sm)',
                                border: '1px solid var(--border-color)',
                                fontWeight: 700,
                                flexShrink: 0
                              }}>
                                {entityName || '농장 공통'}
                              </span>
                            )}

                            {/* 소 이름: 일정 카드와 동일한 선명하고 자연스러운 텍스트 */}
                            {log.tagNumber && entityName && (
                              <span style={{ 
                                fontSize: '0.92rem', 
                                fontWeight: 600, 
                                color: 'var(--text-main)',
                                flexShrink: 0 
                              }}>
                                {entityName}
                              </span>
                            )}

                            <span 
                              className={`badge ${catObj.badgeClass}`}
                              style={{
                                fontSize: '0.72rem',
                                padding: '0.12rem 0.45rem',
                                borderRadius: '9999px',
                                fontWeight: 700,
                                lineHeight: 1.2,
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '0.2rem',
                                flexShrink: 0
                              }}
                            >
                              {catObj.icon && <span style={{ fontSize: '0.75rem' }}>{catObj.icon}</span>}
                              <span>{catObj.label}</span>
                            </span>
                          </div>

                          {onEditCareLog && (
                            <button
                              type="button"
                              className="btn btn-outline btn-sm btn-icon-only"
                              onClick={() => onEditCareLog(log)}
                              title="관리 기록 수정"
                              style={{
                                width: '24px',
                                height: '24px',
                                padding: 0,
                                flexShrink: 0,
                                display: 'inline-flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                border: '1px solid var(--border-color)',
                                color: 'var(--text-muted)',
                                background: 'var(--bg-card)',
                                borderRadius: 'var(--radius-sm)'
                              }}
                            >
                              <Edit2 size={12} />
                            </button>
                          )}
                        </div>

                        {/* 2행: 핵심 작업 제목 (굵은 글씨) */}
                        <div style={{ fontWeight: 800, fontSize: '0.95rem', color: 'var(--text-main)', marginTop: '0.35rem', lineHeight: 1.35 }}>
                          {log.title}
                        </div>

                        {/* 3행: 상세 처치 내용 (있을 때만) */}
                        {detailText && (
                          <div style={{ fontSize: '0.825rem', color: 'var(--text-subtle)', lineHeight: 1.45, marginTop: '0.2rem' }}>
                            {detailText}
                          </div>
                        )}

                        {/* 4행: 시간 • 담당자 • 비용 메타 정보 묶음 (점선 없이 정갈한 1줄) */}
                        <div style={{ 
                          fontSize: '0.78rem', 
                          color: 'var(--text-muted)', 
                          fontWeight: 500, 
                          marginTop: '0.35rem', 
                          display: 'flex', 
                          alignItems: 'center', 
                          gap: '0.45rem',
                          flexWrap: 'wrap'
                        }}>
                          {log.time && (
                            <span style={{ fontWeight: 700, color: 'var(--text-main)' }}>
                              {log.time}
                            </span>
                          )}
                          {log.time && log.operator && <span style={{ opacity: 0.4 }}>•</span>}
                          {log.operator && <span>담당: {log.operator}</span>}
                          {log.cost > 0 && (
                            <>
                              <span style={{ opacity: 0.4 }}>•</span>
                              <span>비용: {Number(log.cost).toLocaleString()}원</span>
                            </>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
