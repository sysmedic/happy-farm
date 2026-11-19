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
  onDeleteSchedule,
  onEditSchedule,
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
      .sort((a, b) => (a.time || '').localeCompare(b.time || ''));
  }, [careLogs, selectedDate]);

  // 선택한 날짜에 등록된 독립 영농 일정
  const dailySchedules = useMemo(() => {
    return (schedules || [])
      .filter(s => s.date === selectedDate)
      .sort((a, b) => (a.time || '').localeCompare(b.time || ''));
  }, [schedules, selectedDate]);

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
                className="btn btn-primary btn-sm"
                onClick={() => onOpenScheduleModal(selectedDate)}
                style={{ fontSize: '0.75rem', padding: '0.25rem 0.6rem' }}
                title="선택한 일자에 새 영농 일정 등록"
              >
                <Plus size={13} />
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
                {dailySchedules.length + scheduledTasks.length}
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
                  <span>일정 (총 {dailySchedules.length + scheduledTasks.length}건)</span>
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
                    {/* A. 직접 등록한 영농 스케줄 (완료 시 접힘 지원 & 수직 3행 모바일 최적화 레이아웃) */}
                    {dailySchedules.map(sched => {
                      const catDef = SCHEDULE_CATEGORIES.find(c => c.id === sched.category) || SCHEDULE_CATEGORIES[0];
                      const isDone = Boolean(sched.completed);
                      const isExpanded = expandedCompletedIds.has(sched.id);

                      // 1. 완료 상태이면서 접힌 모드인 경우: 가로 한 줄로 콤팩트하게 표시 [체크박스 + 개체번호 + 카테고리아이콘]
                      if (isDone && !isExpanded) {
                        return (
                          <div 
                            key={sched.id}
                            className="diary-item-card"
                            onClick={() => toggleExpandCompleted(sched.id)}
                            style={{
                              background: 'var(--bg-card-subtle)',
                              border: '1px solid var(--border-color)',
                              borderRadius: 'var(--radius-md)',
                              padding: '0.45rem 0.75rem',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              gap: '0.5rem',
                              opacity: 0.8,
                              cursor: 'pointer',
                              transition: 'all 0.2s ease',
                              minHeight: '36px'
                            }}
                            title="클릭하여 상세 일정 내용 펼치기"
                          >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap', minWidth: 0, flex: 1 }}>
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
                                  style={{ cursor: 'pointer', fontSize: '0.75rem', padding: '0.15rem 0.45rem' }}
                                >
                                  {sched.tagNumber} ({sched.entityName})
                                </span>
                              ) : (
                                <span style={{
                                  fontSize: '0.75rem',
                                  color: 'var(--text-muted)',
                                  background: 'var(--bg-card)',
                                  padding: '0.15rem 0.45rem',
                                  borderRadius: '4px',
                                  border: '1px solid var(--border-color)',
                                  fontWeight: 600
                                }}>
                                  🌾 농장 공통
                                </span>
                              )}

                              {/* 카테고리 아이콘 */}
                              <span style={{ fontSize: '0.95rem' }} title={catDef.label}>
                                {catDef.icon}
                              </span>
                            </div>

                            {/* 우측 펼치기 힌트 아이콘 */}
                            <div style={{ color: 'var(--text-subtle)', display: 'flex', alignItems: 'center', flexShrink: 0 }} title="상세 내용 펼치기">
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
                            background: isDone ? 'var(--bg-card-subtle)' : 'rgba(245, 158, 11, 0.08)',
                            border: `1px solid ${isDone ? 'var(--border-color)' : 'rgba(245, 158, 11, 0.35)'}`,
                            borderRadius: 'var(--radius-md)',
                            padding: '0.75rem 0.85rem',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '0.45rem',
                            opacity: isDone ? 0.75 : 1,
                            transition: 'all 0.2s ease',
                            overflow: 'hidden'
                          }}
                        >
                          {/* 1단 헤더: [원형 완료 체크 토글 + 카테고리 뱃지 + 시간] <---> (우측) [수정/삭제/접기] */}
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap', minWidth: 0 }}>
                              {/* 완료 체크 원형 토글 버튼 (글자 제거, 원형 아이콘) */}
                              <button
                                type="button"
                                onClick={() => onToggleScheduleComplete(sched.id)}
                                style={{
                                  background: 'none',
                                  border: 'none',
                                  cursor: 'pointer',
                                  padding: '4px',
                                  margin: '-4px',
                                  color: isDone ? 'var(--color-primary)' : 'var(--text-subtle)',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  flexShrink: 0,
                                  borderRadius: '50%',
                                  transition: 'all 0.15s ease'
                                }}
                                title={isDone ? '미완료로 변경' : '완료 처리 (카드 접힘)'}
                              >
                                {isDone ? (
                                  <CheckCircle2 size={19} color="var(--color-primary)" />
                                ) : (
                                  <Circle size={19} strokeWidth={1.8} />
                                )}
                              </button>

                              {/* 카테고리 뱃지 */}
                              <span style={{
                                fontSize: '0.75rem',
                                fontWeight: 700,
                                padding: '0.15rem 0.45rem',
                                borderRadius: 'var(--radius-sm)',
                                background: isDone ? 'var(--bg-card)' : 'rgba(245, 158, 11, 0.15)',
                                color: isDone ? 'var(--text-muted)' : catDef.color,
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '0.25rem'
                              }}>
                                <span>{catDef.icon}</span>
                                <span>{catDef.label}</span>
                              </span>

                              {/* 시간 뱃지 */}
                              {sched.time && (
                                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                                  ⏰ {sched.time}
                                </span>
                              )}
                            </div>

                            {/* 우측 조작 버튼 (수정, 삭제 및 완료 시 접기 버튼) */}
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
                            </div>
                          </div>

                          {/* 2단 본문: 모바일 최적화 세로 3행 레이아웃 */}
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', minWidth: 0, marginTop: '0.1rem' }}>
                            {/* 1행: 대상 뱃지 */}
                            <div>
                              {sched.tagNumber ? (
                                <span 
                                  className="badge badge-tag"
                                  onClick={() => onOpenEntityDetail(sched.tagNumber)}
                                  title="클릭 시 이 개체의 관리 내역으로 이동"
                                  style={{ cursor: 'pointer', fontSize: '0.75rem', padding: '0.15rem 0.45rem', display: 'inline-flex', alignItems: 'center' }}
                                >
                                  {sched.tagNumber} ({sched.entityName})
                                </span>
                              ) : (
                                <span style={{
                                  fontSize: '0.75rem',
                                  color: 'var(--text-muted)',
                                  background: 'var(--bg-card-subtle)',
                                  padding: '0.15rem 0.45rem',
                                  borderRadius: '4px',
                                  border: '1px solid var(--border-color)',
                                  fontWeight: 600,
                                  display: 'inline-flex',
                                  alignItems: 'center'
                                }}>
                                  🌾 농장 공통
                                </span>
                              )}
                            </div>

                            {/* 2행: 일정 제목 (가로 100% 온전히 사용) */}
                            <div style={{ 
                              fontWeight: 700, 
                              fontSize: '0.95rem',
                              textDecoration: isDone ? 'line-through' : 'none',
                              color: isDone ? 'var(--text-muted)' : 'var(--text-main)',
                              wordBreak: 'break-word',
                              lineHeight: 1.4
                            }}>
                              {sched.title}
                            </div>

                            {/* 3행: 상세 메모 (메모가 있을 때만 렌더링) */}
                            {sched.memo && (
                              <div style={{ 
                                fontSize: '0.8rem', 
                                color: 'var(--text-muted)', 
                                marginTop: '0.05rem',
                                paddingLeft: '0.15rem',
                                wordBreak: 'break-word',
                                lineHeight: 1.35
                              }}>
                                ※ {sched.memo}
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}

                    {/* B. 기존 관리기록에서 자동 파생된 D-Day 차기 예정 작업 */}
                    {scheduledTasks.map(task => (
                      <div 
                        key={`sched-${task.id}`}
                        className="diary-item-card"
                        style={{
                          background: 'rgba(245, 158, 11, 0.08)',
                          border: '1px solid rgba(245, 158, 11, 0.3)',
                          borderRadius: 'var(--radius-md)',
                          padding: '0.75rem 0.85rem',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          gap: '0.5rem',
                          flexWrap: 'wrap',
                          overflow: 'hidden'
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap', minWidth: 0, flex: 1 }}>
                          <span 
                            className="badge badge-tag"
                            onClick={() => onOpenEntityDetail(task.tagNumber)}
                            title="클릭 시 이 개체의 관리 내역으로 이동"
                            style={{ cursor: 'pointer', fontSize: '0.75rem', padding: '0.15rem 0.45rem' }}
                          >
                            {task.tagNumber}
                          </span>
                          <span style={{ fontWeight: 700, fontSize: '0.9rem', wordBreak: 'break-word' }}>
                            {task.nextScheduleTitle || '예정 작업'}
                          </span>
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                            ({task.entityName})
                          </span>
                        </div>

                        <button 
                          className="btn btn-outline btn-sm"
                          onClick={() => onOpenEntityDetail(task.tagNumber)}
                          style={{ fontSize: '0.75rem', padding: '0.2rem 0.5rem', flexShrink: 0 }}
                        >
                          <span>개체 이동</span>
                          <ArrowRight size={12} />
                        </button>
                      </div>
                    ))}
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
