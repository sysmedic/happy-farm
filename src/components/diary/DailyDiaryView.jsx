import React, { useState, useMemo } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronUp,
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
  onOpenEntityDetail,
  onOpenCareLogModal,
  onOpenScheduleModal,
  onToggleScheduleComplete,
  onToggleReminderComplete,
  onDeleteSchedule,
  onEditSchedule,
  onEditCareLog,
  onNavigateToReport
}) {
  const [selectedDate, setSelectedDate] = useState(getTodayDateString());
  const [currentYearMonth, setCurrentYearMonth] = useState(() => {
    const today = new Date();
    return { year: today.getFullYear(), month: today.getMonth() };
  });

  // 다이어리 서브 탭: 'schedules'(일정) 또는 'logs'(관리 내역)
  const [activeDiaryTab, setActiveDiaryTab] = useState('schedules');

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

  // 미완료 일정 건수 (체크 해제된 일정 + 차기 예정 작업 중 미완료)
  const pendingScheduleCount = useMemo(() => {
    const uncompletedDaily = dailySchedules.filter(s => !s.completed).length;
    const uncompletedReminders = scheduledTasks.filter(t => !t.nextScheduleCompleted).length;
    return uncompletedDaily + uncompletedReminders;
  }, [dailySchedules, scheduledTasks]);

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

    // 다음 달 일자 채우기 (42칸 6주 맞춤)
    const remaining = 42 - days.length;
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

            {/* 날짜 셀 그리드 */}
            <div className="calendar-grid">
              {calendarDays.map((item, index) => {
                const isSelected = item.dateStr === selectedDate;
                const isToday = item.dateStr === todayStr;
                const hasActivity = datesWithActivity.has(item.dateStr);

                return (
                  <button
                    key={index}
                    className={`calendar-cell ${!item.isCurrentMonth ? 'other-month' : ''} ${isSelected ? 'selected' : ''} ${isToday ? 'is-today' : ''} ${hasActivity ? 'has-logs' : ''}`}
                    onClick={() => setSelectedDate(item.dateStr)}
                  >
                    <span>{item.dayNumber}</span>
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
                style={{ fontSize: '0.75rem', padding: '0.2rem 0.5rem' }}
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
              <span style={{ fontSize: '0.8rem', color: 'var(--color-primary)', fontWeight: 700, textTransform: 'uppercase' }}>
                Daily Farm Diary
              </span>
              <h2 style={{ fontSize: '1.35rem', fontWeight: 800, margin: '0.15rem 0 0 0' }}>
                {getFormattedDateTitle(selectedDate)}
              </h2>
            </div>
          </div>

          {/* 독(Dock) 세그먼트 탭 바 */}
          <div className="diary-dock-tabs">
            <button
              type="button"
              className={`diary-dock-tab tab-schedules ${activeDiaryTab === 'schedules' ? 'active' : ''}`}
              onClick={() => setActiveDiaryTab('schedules')}
            >
              <span>일정</span>
              <span className="diary-tab-count">
                {pendingScheduleCount}
              </span>
            </button>

            <button
              type="button"
              className={`diary-dock-tab tab-logs ${activeDiaryTab === 'logs' ? 'active' : ''}`}
              onClick={() => setActiveDiaryTab('logs')}
            >
              <span>관리 내역</span>
              <span className="diary-tab-count">
                {dailyLogs.length}
              </span>
            </button>
          </div>

          {/* 탭 1: 일정 화면 */}
          {activeDiaryTab === 'schedules' && (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                <h4 style={{
                  fontSize: '0.95rem',
                  color: 'var(--color-accent)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  margin: 0,
                  fontWeight: 700
                }}>
                  <Clock size={16} />
                  <span>
                    일정 {totalScheduleCount > 0 ? (
                      pendingScheduleCount === 0
                        ? '(모두 완료됨! 🎉)'
                        : pendingScheduleCount < totalScheduleCount
                          ? `(${pendingScheduleCount}건 남음 / 총 ${totalScheduleCount}건)`
                          : `(총 ${totalScheduleCount}건)`
                    ) : '(0건)'}
                  </span>
                </h4>
                <button
                  className="btn btn-outline btn-sm"
                  onClick={() => onOpenScheduleModal(selectedDate)}
                  style={{ fontSize: '0.75rem', padding: '0.2rem 0.5rem' }}
                >
                  <Plus size={12} />
                  <span>일정 추가</span>
                </button>
              </div>

              {dailySchedules.length === 0 && scheduledTasks.length === 0 ? (
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
                  {/* A. 직접 등록한 영농 스케줄 영역 */}
                  {dailySchedules.length > 0 && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                      {scheduledTasks.length > 0 && (
                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.35rem',
                          fontSize: '0.85rem',
                          fontWeight: 700,
                          color: 'var(--text-main)',
                          marginBottom: '0.1rem'
                        }}>
                          <span>📌</span>
                          <span>등록된 일정 ({dailySchedules.length}건)</span>
                        </div>
                      )}
                      {dailySchedules.map(sched => {
                        const isDone = Boolean(sched.completed);
                        const isExpanded = expandedCompletedIds.has(sched.id);

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

                              {/* 개체번호 뱃지 또는 농장 공통 뱃지 */}
                              {sched.tagNumber ? (
                                <span 
                                  className="badge badge-tag"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    onOpenEntityDetail(sched.tagNumber);
                                  }}
                                  title="클릭 시 이 개체의 관리 내역으로 이동"
                                  style={{ cursor: 'pointer', fontSize: '0.75rem', padding: '0.15rem 0.45rem', flexShrink: 0 }}
                                >
                                  {sched.tagNumber}
                                </span>
                              ) : (
                                <span style={{
                                  fontSize: '0.75rem',
                                  color: 'var(--text-main)',
                                  background: 'var(--bg-card-subtle)',
                                  padding: '0.15rem 0.45rem',
                                  borderRadius: '4px',
                                  border: '1px solid var(--border-color)',
                                  fontWeight: 600,
                                  flexShrink: 0
                                }}>
                                  {sched.entityName || '농장 공통'}
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
                                flex: 1,
                                overflow: 'hidden'
                              }}>
                                {sched.title}
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

                              {/* 개체번호 뱃지 또는 농장 공통 뱃지 */}
                              {sched.tagNumber ? (
                                <span 
                                  className="badge badge-tag"
                                  onClick={() => onOpenEntityDetail(sched.tagNumber)}
                                  title="클릭 시 이 개체의 관리 내역으로 이동"
                                  style={{ cursor: 'pointer', fontSize: '0.75rem', padding: '0.15rem 0.45rem', flexShrink: 0 }}
                                >
                                  {sched.tagNumber}
                                </span>
                              ) : (
                                <span style={{
                                  fontSize: '0.75rem',
                                  color: 'var(--text-main)',
                                  background: 'var(--bg-card-subtle)',
                                  padding: '0.15rem 0.45rem',
                                  borderRadius: '4px',
                                  border: '1px solid var(--border-color)',
                                  fontWeight: 600,
                                  flexShrink: 0
                                }}>
                                  {sched.entityName || '농장 공통'}
                                </span>
                              )}

                              {/* 별명 (개체명) */}
                              {sched.tagNumber && sched.entityName && (
                                <span style={{ 
                                  fontSize: '0.825rem', 
                                  fontWeight: 600, 
                                  color: 'var(--text-main)' 
                                }}>
                                  {sched.entityName}
                                </span>
                              )}
                            </div>

                            {/* 우측 조작 버튼 (펼침 시 다시 접기 버튼, 수정/삭제 버튼은 임시 비노출) */}
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
                              {/* 수정, 삭제 버튼 임시 가림
                              <button
                                type="button"
                                className="btn btn-outline btn-sm btn-icon-only"
                                onClick={() => onEditSchedule(sched)}
                                title="일정 수정"
                                style={{ width: '26px', height: '26px', padding: 0 }}
                              >
                                <Edit2 size={12} />
                              </button>
                              <button
                                type="button"
                                className="btn btn-outline btn-sm btn-icon-only"
                                onClick={() => onDeleteSchedule(sched.id)}
                                title="일정 삭제"
                                style={{ width: '26px', height: '26px', padding: 0, color: 'var(--color-danger)' }}
                              >
                                <Trash2 size={12} />
                              </button>
                              */}
                            </div>
                          </div>

                          {/* 2행: 일정 제목 및 시간 (등록된 시간은 제목 뒤에 무조건 노출) */}
                          <div style={{
                            fontWeight: 700,
                            fontSize: '0.92rem',
                            wordBreak: 'break-word',
                            paddingLeft: 0,
                            color: 'var(--text-main)',
                            textDecoration: isDone ? 'line-through' : 'none',
                            lineHeight: 1.35
                          }}>
                            <span>{sched.title}</span>
                            {sched.time && (
                              <span style={{
                                paddingLeft: '0.35rem',
                                whiteSpace: 'nowrap',
                                display: 'inline-block'
                              }}>
                                ({sched.time.startsWith('0') ? sched.time.slice(1) : sched.time})
                              </span>
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

                  {/* B. 기존 관리기록에서 자동 파생된 D-Day 차기 예정 작업 (리마인더 분리 영역) */}
                  {scheduledTasks.length > 0 && (
                    <div style={{
                      marginTop: dailySchedules.length > 0 ? '1rem' : '0',
                      paddingTop: dailySchedules.length > 0 ? '1rem' : '0',
                      borderTop: dailySchedules.length > 0 ? '1px dashed var(--border-color)' : 'none',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '0.65rem'
                    }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem', marginBottom: '0.1rem' }}>
                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          gap: '0.4rem',
                          fontSize: '0.85rem',
                          fontWeight: 700,
                          color: 'var(--color-accent)'
                        }}>
                          <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                            <span>🔔</span>
                            <span>개체 연동 알림 ({scheduledTasks.length}건)</span>
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
                          ※ 개체 관리기록에서 지정한 차기 예정일 작업입니다.
                        </div>
                      </div>

                      {scheduledTasks.map(task => {
                        const targetEntity = (entities || []).find(e => e.id === task.entityId || e.tagNumber === task.tagNumber);
                        const reminderCardId = `reminder-${task.id}`;
                        const isDone = Boolean(task.nextScheduleCompleted);
                        const isExpanded = expandedCompletedIds.has(reminderCardId);

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
                              {/* 완료 체크 원형 토글 버튼 */}
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onToggleReminderComplete?.(task.id);
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

                              {/* 개체번호 뱃지 */}
                              <span 
                                className="badge badge-tag"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onOpenEntityDetail(task.tagNumber);
                                }}
                                title="클릭 시 이 개체의 관리 내역으로 이동"
                                style={{ cursor: 'pointer', fontSize: '0.75rem', padding: '0.15rem 0.45rem', flexShrink: 0 }}
                              >
                                {task.tagNumber}
                              </span>

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

                            {/* 우측 펼치기 힌트 아이콘 */}
                            <div style={{ color: 'var(--text-subtle)', display: 'flex', alignItems: 'center', flexShrink: 0, paddingLeft: '0.2rem' }} title="상세 내용 펼치기">
                              <ChevronDown size={14} />
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
                              {/* 완료 체크박스 버튼 */}
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onToggleReminderComplete?.(task.id);
                                }}
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

                              {/* 개체번호 뱃지 */}
                              <span 
                                className="badge badge-tag"
                                onClick={() => onOpenEntityDetail(task.tagNumber)}
                                title="클릭 시 이 개체의 관리 내역으로 이동"
                                style={{ cursor: 'pointer', fontSize: '0.75rem', padding: '0.15rem 0.45rem' }}
                              >
                                {task.tagNumber}
                              </span>

                              {/* 별명 (소 이름) */}
                              <span style={{ 
                                fontSize: '0.825rem', 
                                fontWeight: 600, 
                                color: 'var(--text-main)' 
                              }}>
                                {task.entityName}
                              </span>
                            </div>

                            {/* 우측 상단: [기록] 버튼 및 다시 접기 버튼 */}
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', flexShrink: 0 }}>
                              {isDone && isExpanded && (
                                <button
                                  type="button"
                                  className="btn btn-outline btn-sm btn-icon-only"
                                  onClick={() => toggleExpandCompleted(reminderCardId)}
                                  title="다시 1줄로 접기"
                                  style={{ width: '26px', height: '26px', padding: 0 }}
                                >
                                  <ChevronUp size={13} />
                                </button>
                              )}
                              {onOpenCareLogModal && (
                                <button 
                                  type="button"
                                  className="btn btn-primary btn-sm"
                                  onClick={() => onOpenCareLogModal(
                                    targetEntity || { tagNumber: task.tagNumber, name: task.entityName, id: task.entityId },
                                    selectedDate,
                                    {
                                      category: task.category || 'treatment',
                                      title: task.nextScheduleTitle || '',
                                      date: selectedDate,
                                      time: task.nextScheduleTime || undefined,
                                      entityId: task.entityId || (targetEntity ? targetEntity.id : '')
                                    }
                                  )}
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
                                  title="이 예정 작업으로 새 관리기록 작성 (분류·작업명 자동 입력)"
                                >
                                  <Plus size={12} />
                                  <span>기록</span>
                                </button>
                              )}
                            </div>
                          </div>

                          {/* 2행: 차기 예정 작업명 및 시간 (좌측) & [수정] 버튼 (우측, 기록 버튼 바로 밑에 수직 정렬) */}
                          <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            gap: '0.5rem',
                            width: '100%',
                            paddingLeft: 0,
                            marginTop: '0.15rem'
                          }}>
                            <div style={{ 
                              fontWeight: 700, 
                              fontSize: '0.92rem', 
                              wordBreak: 'break-word',
                              color: 'var(--text-main)',
                              textDecoration: isDone ? 'line-through' : 'none',
                              lineHeight: 1.35,
                              flex: 1,
                              minWidth: 0
                            }}>
                              <span>{task.nextScheduleTitle || '예정 작업'}</span>
                              {task.nextScheduleTime && (
                                <span style={{
                                  paddingLeft: '0.35rem',
                                  whiteSpace: 'nowrap',
                                  display: 'inline-block'
                                }}>
                                  ({task.nextScheduleTime.startsWith('0') ? task.nextScheduleTime.slice(1) : task.nextScheduleTime})
                                </span>
                              )}
                            </div>

                            {onEditCareLog && (
                              <button
                                type="button"
                                className="btn btn-outline btn-sm btn-icon-only"
                                onClick={() => onEditCareLog(task, { focusNextSchedule: true })}
                                title="이 차기 예정 작업의 원본 관리기록(예정일/작업명 등) 수정"
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
                      );
                      })}
                    </div>
                  )}
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
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                  {dailyLogs.map(log => {
                    const catObj = getCategoryById(log.category, careCategories);

                    return (
                      <div
                        key={log.id}
                        className="diary-item-card"
                        style={{
                          background: 'var(--bg-card)',
                          border: '1px solid var(--border-color)',
                          borderRadius: 'var(--radius-md)',
                          padding: '1rem',
                          boxShadow: 'var(--shadow-sm)',
                          transition: 'all 0.15s ease'
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.4rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                            <span
                              className="badge badge-tag"
                              onClick={() => onOpenEntityDetail(log.tagNumber)}
                              title="클릭 시 이 개체의 관리 내역으로 즉시 이동"
                            >
                              {log.tagNumber}
                            </span>
                            <span style={{ fontWeight: 700, fontSize: '0.95rem' }}>
                              {log.entityName}
                            </span>
                            <span className={`badge ${catObj.badgeClass}`}>
                              {catObj.icon} {catObj.label}
                            </span>
                          </div>

                          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                            {log.time ? `⏰ ${log.time}` : '시간 미지정'}
                          </div>
                        </div>

                        <div style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--text-main)', marginBottom: '0.35rem' }}>
                          {log.title}
                        </div>

                        {log.details && (
                          <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: 1.5, marginBottom: '0.5rem' }}>
                            {log.details}
                          </div>
                        )}

                        {(log.operator || log.cost) && (
                          <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.75rem',
                            flexWrap: 'wrap',
                            fontSize: '0.775rem',
                            color: 'var(--text-subtle)',
                            paddingTop: '0.45rem',
                            marginTop: '0.45rem',
                            borderTop: '1px dashed var(--border-color)'
                          }}>
                            {log.operator && <span>작업자: {log.operator}</span>}
                            {log.cost ? <span>비용: {Number(log.cost).toLocaleString()}원</span> : null}
                          </div>
                        )}
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
