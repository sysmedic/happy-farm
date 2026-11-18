import React, { useState, useMemo } from 'react';
import { 
  ChevronLeft, 
  ChevronRight, 
  Calendar as CalendarIcon, 
  Clock, 
  Plus, 
  FileText, 
  AlertCircle, 
  CheckCircle2, 
  Sparkles,
  ArrowRight,
  CheckSquare,
  Square,
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
        <div>
          <div className="calendar-card">
            <div className="calendar-header">
              <h3 style={{ fontSize: '1.05rem', fontWeight: 800 }}>
                {currentYearMonth.year}년 {currentYearMonth.month + 1}월
              </h3>
              <div style={{ display: 'flex', gap: '0.3rem' }}>
                <button className="btn btn-outline btn-sm btn-icon-only" onClick={handlePrevMonth}>
                  <ChevronLeft size={16} />
                </button>
                <button 
                  className="btn btn-outline btn-sm"
                  onClick={() => {
                    const now = new Date();
                    setCurrentYearMonth({ year: now.getFullYear(), month: now.getMonth() });
                    setSelectedDate(todayStr);
                  }}
                >
                  오늘
                </button>
                <button className="btn btn-outline btn-sm btn-icon-only" onClick={handleNextMonth}>
                  <ChevronRight size={16} />
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

        {/* 오른쪽: 선택한 날짜의 다이어리 및 관리 내역 */}
        <div>
          <div className="card" style={{ marginBottom: '1.25rem' }}>
            <div className="card-header" style={{ flexWrap: 'wrap', gap: '0.75rem' }}>
              <div>
                <span style={{ fontSize: '0.8rem', color: 'var(--color-primary)', fontWeight: 700, textTransform: 'uppercase' }}>
                  Daily Farm Diary
                </span>
                <h2 style={{ fontSize: '1.35rem', fontWeight: 800 }}>
                  {getFormattedDateTitle(selectedDate)}
                </h2>
              </div>

              <div className="diary-header-actions" style={{ display: 'flex', gap: '0.45rem', alignItems: 'center' }}>
                <button 
                  className="btn btn-secondary btn-sm diary-action-report"
                  onClick={() => onNavigateToReport(selectedDate)}
                  title="이 날짜의 일일 종합 영농 보고서 보기"
                >
                  <FileText size={15} />
                  <span>일일 보고서 작성</span>
                </button>
                <button 
                  className="btn btn-outline btn-sm diary-action-schedule"
                  onClick={() => onOpenScheduleModal(selectedDate)}
                  title="이 날짜에 새 영농 일정 추가"
                >
                  <Plus size={15} />
                  <span>일정 추가</span>
                </button>
                <button 
                  className="btn btn-primary btn-sm diary-action-record"
                  onClick={() => onOpenCareLogModal(null, selectedDate)}
                  title="이 날짜에 실시된 관리 작업 기록 추가"
                >
                  <Plus size={15} />
                  <span>금일 작업 기록</span>
                </button>
              </div>
            </div>

            <div className="card-body">
              {/* 1. 도래한 예정 일정 (독립 영농 일정 + 개체 D-Day 리마인더 통합) */}
              {(dailySchedules.length > 0 || scheduledTasks.length > 0) && (
                <div style={{ marginBottom: '1.75rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                    <h4 style={{ 
                      fontSize: '0.95rem', 
                      color: 'var(--color-accent)', 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: '0.4rem',
                      margin: 0
                    }}>
                      <Clock size={16} />
                      <span>예정 일정 (총 {dailySchedules.length + scheduledTasks.length}건)</span>
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

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                    {/* A. 직접 등록한 영농 스케줄 */}
                    {dailySchedules.map(sched => {
                      const catDef = SCHEDULE_CATEGORIES.find(c => c.id === sched.category) || SCHEDULE_CATEGORIES[0];
                      const isDone = Boolean(sched.completed);

                      return (
                        <div 
                          key={sched.id}
                          style={{
                            background: isDone ? 'var(--bg-card-subtle)' : 'rgba(245, 158, 11, 0.08)',
                            border: `1px solid ${isDone ? 'var(--border-color)' : 'rgba(245, 158, 11, 0.35)'}`,
                            borderRadius: 'var(--radius-md)',
                            padding: '0.8rem 1rem',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            gap: '0.75rem',
                            opacity: isDone ? 0.7 : 1,
                            transition: 'all 0.2s ease'
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flex: 1, minWidth: 0 }}>
                            {/* 완료 체크박스 버튼 */}
                            <button
                              type="button"
                              onClick={() => onToggleScheduleComplete(sched.id)}
                              style={{
                                background: 'transparent',
                                border: 'none',
                                cursor: 'pointer',
                                padding: 0,
                                color: isDone ? 'var(--color-primary)' : 'var(--text-muted)',
                                display: 'flex',
                                alignItems: 'center',
                                flexShrink: 0
                              }}
                              title={isDone ? '미완료로 변경' : '완료 처리'}
                            >
                              {isDone ? <CheckSquare size={20} color="var(--color-primary)" /> : <Square size={20} />}
                            </button>

                            <div style={{ minWidth: 0, flex: 1 }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', flexWrap: 'wrap', marginBottom: '0.2rem' }}>
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

                                {/* 대상 개체 뱃지 (개체 지정 시) */}
                                {sched.tagNumber ? (
                                  <span 
                                    className="badge badge-tag"
                                    onClick={() => onOpenEntityDetail(sched.tagNumber)}
                                    title="클릭 시 이 개체의 관리 내역으로 이동"
                                    style={{ cursor: 'pointer' }}
                                  >
                                    {sched.tagNumber} ({sched.entityName})
                                  </span>
                                ) : (
                                  <span style={{
                                    fontSize: '0.75rem',
                                    color: 'var(--text-muted)',
                                    background: 'var(--bg-card-subtle)',
                                    padding: '0.1rem 0.4rem',
                                    borderRadius: '4px',
                                    border: '1px solid var(--border-color)'
                                  }}>
                                    🌾 농장 공통
                                  </span>
                                )}
                              </div>

                              {/* 제목 및 메모 */}
                              <div style={{ 
                                fontWeight: 700, 
                                fontSize: '0.925rem',
                                textDecoration: isDone ? 'line-through' : 'none',
                                color: isDone ? 'var(--text-muted)' : 'var(--text-main)',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap'
                              }}>
                                {sched.title}
                              </div>
                              {sched.memo && (
                                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>
                                  {sched.memo}
                                </div>
                              )}
                            </div>
                          </div>

                          {/* 조작 버튼 그룹 */}
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', flexShrink: 0 }}>
                            <button
                              type="button"
                              className="btn btn-outline btn-sm btn-icon-only"
                              onClick={() => onEditSchedule(sched)}
                              title="일정 수정"
                              style={{ width: '28px', height: '28px' }}
                            >
                              <Edit2 size={13} />
                            </button>
                            <button
                              type="button"
                              className="btn btn-outline btn-sm btn-icon-only"
                              onClick={() => onDeleteSchedule(sched.id)}
                              title="일정 삭제"
                              style={{ width: '28px', height: '28px', color: 'var(--color-danger)' }}
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        </div>
                      );
                    })}

                    {/* B. 기존 관리기록에서 자동 파생된 D-Day 차기 예정 작업 */}
                    {scheduledTasks.map(task => (
                      <div 
                        key={`sched-${task.id}`}
                        style={{
                          background: 'rgba(245, 158, 11, 0.08)',
                          border: '1px solid rgba(245, 158, 11, 0.3)',
                          borderRadius: 'var(--radius-md)',
                          padding: '0.75rem 1rem',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          gap: '0.75rem'
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                          <span 
                            className="badge badge-tag"
                            onClick={() => onOpenEntityDetail(task.tagNumber)}
                            title="클릭 시 이 개체의 관리 내역으로 이동"
                          >
                            {task.tagNumber}
                          </span>
                          <div>
                            <span style={{ fontWeight: 700, fontSize: '0.9rem' }}>
                              {task.nextScheduleTitle || '예정 작업'}
                            </span>
                            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginLeft: '0.5rem' }}>
                              (대상: {task.entityName})
                            </span>
                          </div>
                        </div>

                        <button 
                          className="btn btn-outline btn-sm"
                          onClick={() => onOpenEntityDetail(task.tagNumber)}
                          style={{ fontSize: '0.75rem', padding: '0.25rem 0.55rem' }}
                        >
                          <span>개체 이동</span>
                          <ArrowRight size={13} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 2. 오늘 실시한 관리 작업 내역 */}
              <h4 style={{ 
                fontSize: '0.95rem', 
                fontWeight: 700,
                display: 'flex', 
                alignItems: 'center', 
                gap: '0.4rem',
                marginBottom: '0.75rem' 
              }}>
                <CheckCircle2 size={16} color="var(--color-primary)" />
                <span>실시된 영농 관리 작업 ({dailyLogs.length}건)</span>
              </h4>

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
                            {/* ⚡ 요구사항 3: 보고서 및 다이어리의 개체번호를 누르면 해당 개체 관리 내역으로 이동! */}
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

                        <div style={{ 
                          display: 'flex', 
                          alignItems: 'center', 
                          justifyContent: 'space-between', 
                          fontSize: '0.775rem',
                          color: 'var(--text-subtle)',
                          paddingTop: '0.45rem',
                          borderTop: '1px dashed var(--border-color)'
                        }}>
                          <div>
                            {log.operator && <span>작업자: {log.operator}</span>}
                            {log.cost ? <span style={{ marginLeft: '0.65rem' }}>비용: {Number(log.cost).toLocaleString()}원</span> : null}
                          </div>

                          <button 
                            className="btn btn-outline btn-sm"
                            onClick={() => onOpenEntityDetail(log.tagNumber)}
                            style={{ fontSize: '0.75rem', padding: '0.2rem 0.5rem' }}
                          >
                            <span>개체 이력서 보기</span>
                            <ArrowRight size={12} />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
