import React, { useState, useEffect, useMemo, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Calendar, ChevronLeft, ChevronRight, X, Check } from 'lucide-react';

// 날짜 문자열(YYYY-MM-DD) 유효성 검사
function isValidDateStr(str) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(str)) return false;
  const [y, m, d] = str.split('-').map(Number);
  if (m < 1 || m > 12 || d < 1 || d > 31) return false;
  const dt = new Date(y, m - 1, d);
  return dt.getFullYear() === y && dt.getMonth() === m - 1 && dt.getDate() === d;
}

// Date 객체 -> YYYY-MM-DD 변환
function toDateStr(dt) {
  const y = dt.getFullYear();
  const m = String(dt.getMonth() + 1).padStart(2, '0');
  const d = String(dt.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

// 인텔리전트 날짜 입력 포맷터 (월 2~9, 일 4~9, 2월의 일 3, 1월+3~9 등 자동 0 채움)
function formatIntelligentDate(raw) {
  const digits = String(raw || '').replace(/\D/g, '').slice(0, 8);
  if (digits.length <= 4) return digits;

  const year = digits.slice(0, 4);
  const rest = digits.slice(4);
  let month = '';
  let dayDigits = '';

  const m1 = rest[0];
  if (m1 >= '2' && m1 <= '9') {
    // 20~99월은 없으므로 즉시 02~09월로 자동 보정
    month = `0${m1}`;
    dayDigits = rest.slice(1);
  } else if (m1 === '0') {
    if (rest.length === 1) return `${year}-0`;
    const m2 = rest[1];
    if (m2 === '0') return `${year}-0`; // 00월 차단
    month = `0${m2}`;
    dayDigits = rest.slice(2);
  } else {
    // m1 === '1'
    if (rest.length === 1) return `${year}-1`;
    const m2 = rest[1];
    if (m2 >= '3' && m2 <= '9') {
      // 13~19월은 없으므로 01월 + m2는 일(Day) 첫 자리로 자동 추론
      month = '01';
      dayDigits = rest.slice(1);
    } else {
      month = `1${m2}`; // 10, 11, 12월
      dayDigits = rest.slice(2);
    }
  }

  if (dayDigits.length === 0) {
    return `${year}-${month}-`;
  }

  const d1 = dayDigits[0];
  if ((month === '02' && d1 >= '3') || d1 >= '4') {
    // 40~99일(2월은 30일+)은 없으므로 즉시 03~09일로 자동 보정
    return `${year}-${month}-0${d1}`;
  }

  if (dayDigits.length === 1) {
    return `${year}-${month}-${d1}`;
  }

  const candidateDay = `${d1}${dayDigits[1]}`;
  if (isValidDateStr(`${year}-${month}-${candidateDay}`)) {
    return `${year}-${month}-${candidateDay}`;
  }

  // 해당 월에 존재하지 않는 날짜(예: 02-29 비윤년, 04-31, 03-35 등)는 마지막 자리 무시
  return `${year}-${month}-${d1}`;
}

// 완료 시점 최종 보정 (예: 2026-03-2 -> 2026-03-02)
function resolveFinalDate(text) {
  if (isValidDateStr(text)) return text;
  const singleDayMatch = text.match(/^(\d{4})-(\d{2})-(\d)$/);
  if (singleDayMatch) {
    const candidate = `${singleDayMatch[1]}-${singleDayMatch[2]}-0${singleDayMatch[3]}`;
    if (isValidDateStr(candidate)) return candidate;
  }
  return null;
}

/**
 * 현장 최적화 공통 날짜 입력 컴포넌트 (SmartDateInput)
 * - 숫자 8자리(예: 20230415) 직접 입력 시 YYYY-MM-DD 자동 변환
 * - 우측 📅 버튼 터치 시 기기 무관 동일한 대형 커스텀 달력 팝업 제공
 * - 연/월 빠른 선택 드롭다운 및 어제/오늘/내일 원터치 버튼 지원
 */
export default function SmartDateInput({
  value = '',
  onChange,
  required = false,
  placeholder = 'YYYY-MM-DD',
  compact = false,
  quickPresets = ['yesterday', 'today', 'tomorrow'],
  accentColor = 'var(--color-primary)',
  inputRef = null,
  className = '',
  style = {}
}) {
  const [textValue, setTextValue] = useState(value || '');
  const [isOpen, setIsOpen] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const backupValueRef = useRef(value || '');
  const internalInputRef = useRef(null);

  // 외부 inputRef와 내부 ref 동시 연결
  const setMergedRef = (el) => {
    internalInputRef.current = el;
    if (typeof inputRef === 'function') {
      inputRef(el);
    } else if (inputRef && typeof inputRef === 'object') {
      inputRef.current = el;
    }
  };

  // 오늘/어제/내일 날짜 문자열
  const todayStr = useMemo(() => toDateStr(new Date()), []);
  const yesterdayStr = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    return toDateStr(d);
  }, []);
  const tomorrowStr = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return toDateStr(d);
  }, []);

  // 달력 팝업 현재 보고 있는 연/월 상태
  const [viewYear, setViewYear] = useState(() => {
    if (isValidDateStr(value)) return Number(value.slice(0, 4));
    return new Date().getFullYear();
  });
  const [viewMonth, setViewMonth] = useState(() => {
    if (isValidDateStr(value)) return Number(value.slice(5, 7)) - 1;
    return new Date().getMonth();
  });

  // 외부 value 변경 시 입력창 텍스트 동기화 (타이핑 중이 아닐 때만)
  useEffect(() => {
    if (!isFocused) {
      setTextValue(value || '');
    }
  }, [value, isFocused]);

  // 입력칸 포커스 시: 기존 값 임시 보관 후 즉시 비워서 백스페이스 없이 바로 입력 가능
  const handleFocus = () => {
    backupValueRef.current = value || '';
    setIsFocused(true);
    setTextValue('');
  };

  // 입력 완료 확정 또는 원래 값 복귀 처리
  const finalizeInput = () => {
    const resolved = resolveFinalDate(textValue);
    if (resolved) {
      if (onChange && resolved !== value) {
        onChange(resolved);
      }
      setTextValue(resolved);
    } else {
      // 아무것도 입력하지 않았거나 미완성 날짜인 경우 기존 값으로 안전 복귀
      const restored = backupValueRef.current || value || '';
      setTextValue(restored);
      if (onChange && restored !== value) {
        onChange(restored);
      }
    }
    setIsFocused(false);
  };

  // [완료] 버튼 또는 Enter 키 클릭 시 확정 + 키패드 내리기
  const handleCompleteClick = () => {
    finalizeInput();
    if (internalInputRef.current) {
      internalInputRef.current.blur();
    }
  };

  // 달력 팝업 열 때 현재 선택 날짜(또는 오늘)의 연/월로 이동
  const openCalendar = () => {
    if (isValidDateStr(value)) {
      setViewYear(Number(value.slice(0, 4)));
      setViewMonth(Number(value.slice(5, 7)) - 1);
    } else {
      const now = new Date();
      setViewYear(now.getFullYear());
      setViewMonth(now.getMonth());
    }
    setIsOpen(true);
  };

  // 숫자 직접 입력 핸들러 (입력 시 인텔리전트 자동 0 채움, 삭제 시 자연스러운 백스페이스)
  const handleTextChange = (e) => {
    const raw = e.target.value;
    // 백스페이스로 지우는 중에는 자동 0 채움을 적용하지 않고 자연스럽게 삭제
    if (raw.length < textValue.length) {
      const cleaned = raw.endsWith('-') ? raw.slice(0, -1) : raw;
      setTextValue(cleaned);
      return;
    }

    const formatted = formatIntelligentDate(raw);
    setTextValue(formatted);

    if (formatted.length === 10 && isValidDateStr(formatted)) {
      if (onChange) onChange(formatted);
    }
  };

  // 포커스 해제 시 확정/복귀 처리
  const handleBlur = () => {
    finalizeInput();
  };

  // Enter 키 입력 시 상위 폼 제출을 막고 날짜 입력만 완료 처리
  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleCompleteClick();
    }
  };

  // 달력에서 날짜 선택 시 즉시 반영 후 닫기
  const handleSelectDate = (dateStr) => {
    setTextValue(dateStr);
    if (onChange) onChange(dateStr);
    setIsOpen(false);
  };

  // 이전/다음 달 이동
  const handlePrevMonth = () => {
    if (viewMonth === 0) {
      setViewYear(y => y - 1);
      setViewMonth(11);
    } else {
      setViewMonth(m => m - 1);
    }
  };

  const handleNextMonth = () => {
    if (viewMonth === 11) {
      setViewYear(y => y + 1);
      setViewMonth(0);
    } else {
      setViewMonth(m => m + 1);
    }
  };

  // 달력 그리드 날짜 생성 (42칸 또는 필요한 주)
  const calendarDays = useMemo(() => {
    const firstDay = new Date(viewYear, viewMonth, 1).getDay();
    const lastDate = new Date(viewYear, viewMonth + 1, 0).getDate();
    const prevLastDate = new Date(viewYear, viewMonth, 0).getDate();

    const days = [];
    for (let i = firstDay - 1; i >= 0; i--) {
      const d = prevLastDate - i;
      const dt = new Date(viewYear, viewMonth - 1, d);
      days.push({ day: d, dateStr: toDateStr(dt), isCurrentMonth: false });
    }
    for (let d = 1; d <= lastDate; d++) {
      const dt = new Date(viewYear, viewMonth, d);
      days.push({ day: d, dateStr: toDateStr(dt), isCurrentMonth: true });
    }
    const remaining = (7 - (days.length % 7)) % 7;
    for (let d = 1; d <= remaining; d++) {
      const dt = new Date(viewYear, viewMonth + 1, d);
      days.push({ day: d, dateStr: toDateStr(dt), isCurrentMonth: false });
    }
    return days;
  }, [viewYear, viewMonth]);

  // 연도 선택 드롭다운 범위 (현재 연도 기준 과거 15년 ~ 미래 5년)
  const yearOptions = useMemo(() => {
    const cur = new Date().getFullYear();
    const minY = Math.min(cur - 15, viewYear - 2);
    const maxY = Math.max(cur + 5, viewYear + 2);
    const arr = [];
    for (let y = maxY; y >= minY; y--) arr.push(y);
    return arr;
  }, [viewYear]);

  const presetItems = [
    { id: 'yesterday', label: '어제', dateStr: yesterdayStr },
    { id: 'today', label: '오늘', dateStr: todayStr },
    { id: 'tomorrow', label: '내일', dateStr: tomorrowStr }
  ].filter(p => quickPresets.includes(p.id));

  return (
    <>
      <div
        className={`smart-date-input-wrap ${compact ? 'is-compact' : ''} ${className}`}
        style={{
          position: 'relative',
          display: 'flex',
          alignItems: 'center',
          width: '100%',
          ...style
        }}
      >
        <input
          ref={setMergedRef}
          type="text"
          inputMode="numeric"
          enterKeyHint="done"
          className={compact ? '' : 'form-input'}
          value={textValue}
          onFocus={handleFocus}
          onChange={handleTextChange}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          placeholder={isFocused ? (backupValueRef.current || placeholder) : placeholder}
          maxLength={10}
          required={required}
          style={compact ? {
            width: '100%',
            height: '30px',
            padding: isFocused ? '0.2rem 1.85rem 0.2rem 0.45rem' : '0.2rem 1.75rem 0.2rem 0.45rem',
            borderRadius: 'var(--radius-sm)',
            border: isFocused ? `1.5px solid ${accentColor}` : '1px solid var(--border-color)',
            background: 'var(--bg-page)',
            color: 'var(--text-main)',
            fontSize: '0.82rem',
            fontFamily: 'inherit',
            textAlign: 'center',
            boxSizing: 'border-box',
            outline: 'none'
          } : {
            width: '100%',
            paddingRight: isFocused ? '3.6rem' : '2.45rem',
            letterSpacing: '0.02em',
            fontVariantNumeric: 'tabular-nums'
          }}
        />
        {isFocused ? (
          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={handleCompleteClick}
            title="날짜 입력 완료"
            aria-label="날짜 입력 완료"
            style={{
              position: 'absolute',
              right: compact ? '3px' : '5px',
              top: '50%',
              transform: 'translateY(-50%)',
              height: compact ? '24px' : '28px',
              padding: compact ? '0 0.35rem' : '0 0.6rem',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: accentColor,
              color: '#ffffff',
              border: 'none',
              borderRadius: '6px',
              fontSize: compact ? '0.72rem' : '0.78rem',
              fontWeight: 800,
              cursor: 'pointer',
              whiteSpace: 'nowrap'
            }}
          >
            {compact ? <Check size={14} strokeWidth={2.8} /> : '완료'}
          </button>
        ) : (
          <button
            type="button"
            onClick={openCalendar}
            title="달력에서 날짜 선택"
            aria-label="달력에서 날짜 선택"
            style={{
              position: 'absolute',
              right: compact ? '2px' : '4px',
              top: '50%',
              transform: 'translateY(-50%)',
              width: compact ? '26px' : '34px',
              height: compact ? '26px' : '34px',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'transparent',
              border: 'none',
              borderRadius: 'var(--radius-sm)',
              color: accentColor,
              cursor: 'pointer',
              padding: 0
            }}
          >
            <Calendar size={compact ? 14 : 18} strokeWidth={2.2} />
          </button>
        )}
      </div>

      {/* 자체 커스텀 대형 달력 팝업 (Portal로 최상위 레이어 렌더링) */}
      {isOpen && createPortal(
        <div
          onClick={() => setIsOpen(false)}
          role="dialog"
          aria-modal="true"
          aria-label="날짜 선택 달력"
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 23, 42, 0.55)',
            backdropFilter: 'blur(2px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 3500,
            padding: '1rem'
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: '100%',
              maxWidth: '340px',
              background: 'var(--bg-card)',
              color: 'var(--text-main)',
              borderRadius: '16px',
              border: '1px solid var(--border-color)',
              boxShadow: '0 20px 35px -10px rgba(0, 0, 0, 0.3)',
              padding: '1rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.75rem'
            }}
          >
            {/* 1. 상단 타이틀 + 닫기 */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              paddingBottom: '0.55rem',
              borderBottom: '1px solid var(--border-color)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                <Calendar size={18} color={accentColor} />
                <span style={{ fontSize: '0.98rem', fontWeight: 800 }}>날짜 선택</span>
              </div>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                aria-label="닫기"
                style={{
                  width: '30px',
                  height: '30px',
                  borderRadius: '8px',
                  border: '1px solid var(--border-color)',
                  background: 'var(--bg-page)',
                  color: 'var(--text-muted)',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer'
                }}
              >
                <X size={16} />
              </button>
            </div>

            {/* 2. 연도 / 월 빠른 이동 헤더 */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '0.35rem'
            }}>
              <button
                type="button"
                onClick={handlePrevMonth}
                aria-label="이전 달"
                style={{
                  width: '34px',
                  height: '34px',
                  borderRadius: '8px',
                  border: '1px solid var(--border-color)',
                  background: 'var(--bg-page)',
                  color: 'var(--text-main)',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  flexShrink: 0
                }}
              >
                <ChevronLeft size={18} />
              </button>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', flex: 1, justifyContent: 'center' }}>
                <select
                  value={viewYear}
                  onChange={(e) => setViewYear(Number(e.target.value))}
                  aria-label="연도 선택"
                  style={{
                    height: '34px',
                    padding: '0 0.45rem',
                    borderRadius: '8px',
                    border: '1px solid var(--border-color)',
                    background: 'var(--bg-page)',
                    color: 'var(--text-main)',
                    fontSize: '0.92rem',
                    fontWeight: 700,
                    cursor: 'pointer'
                  }}
                >
                  {yearOptions.map(y => (
                    <option key={y} value={y}>{y}년</option>
                  ))}
                </select>
                <select
                  value={viewMonth}
                  onChange={(e) => setViewMonth(Number(e.target.value))}
                  aria-label="월 선택"
                  style={{
                    height: '34px',
                    padding: '0 0.45rem',
                    borderRadius: '8px',
                    border: '1px solid var(--border-color)',
                    background: 'var(--bg-page)',
                    color: 'var(--text-main)',
                    fontSize: '0.92rem',
                    fontWeight: 700,
                    cursor: 'pointer'
                  }}
                >
                  {Array.from({ length: 12 }, (_, idx) => (
                    <option key={idx} value={idx}>{idx + 1}월</option>
                  ))}
                </select>
              </div>

              <button
                type="button"
                onClick={handleNextMonth}
                aria-label="다음 달"
                style={{
                  width: '34px',
                  height: '34px',
                  borderRadius: '8px',
                  border: '1px solid var(--border-color)',
                  background: 'var(--bg-page)',
                  color: 'var(--text-main)',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  flexShrink: 0
                }}
              >
                <ChevronRight size={18} />
              </button>
            </div>

            {/* 3. 원터치 퀵 버튼 (어제 / 오늘 / 내일) */}
            {presetItems.length > 0 && (
              <div style={{ display: 'flex', gap: '0.4rem' }}>
                {presetItems.map(item => {
                  const isActive = value === item.dateStr;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => handleSelectDate(item.dateStr)}
                      style={{
                        flex: 1,
                        height: '32px',
                        borderRadius: '8px',
                        border: isActive ? `1.5px solid ${accentColor}` : '1px solid var(--border-color)',
                        background: isActive ? 'rgba(16, 185, 129, 0.14)' : 'var(--bg-page)',
                        color: isActive ? accentColor : 'var(--text-main)',
                        fontSize: '0.82rem',
                        fontWeight: 700,
                        cursor: 'pointer'
                      }}
                    >
                      {item.label}
                    </button>
                  );
                })}
              </div>
            )}

            {/* 4. 요일 헤더 */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(7, 1fr)',
              textAlign: 'center',
              fontSize: '0.78rem',
              fontWeight: 700
            }}>
              {['일', '월', '화', '수', '목', '금', '토'].map((d, idx) => (
                <div
                  key={d}
                  style={{
                    color: idx === 0 ? '#ef4444' : idx === 6 ? '#3b82f6' : 'var(--text-muted)',
                    padding: '0.2rem 0'
                  }}
                >
                  {d}
                </div>
              ))}
            </div>

            {/* 5. 날짜 격자 버튼 */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(7, 1fr)',
              gap: '4px'
            }}>
              {calendarDays.map((item, idx) => {
                const isSelected = value === item.dateStr;
                const isToday = todayStr === item.dateStr;
                const colIdx = idx % 7;
                return (
                  <button
                    key={item.dateStr}
                    type="button"
                    onClick={() => handleSelectDate(item.dateStr)}
                    style={{
                      height: '38px',
                      borderRadius: '10px',
                      border: isToday && !isSelected ? `1.5px solid ${accentColor}` : '1px solid transparent',
                      background: isSelected ? accentColor : 'transparent',
                      color: isSelected
                        ? '#ffffff'
                        : !item.isCurrentMonth
                          ? 'var(--text-muted)'
                          : colIdx === 0
                            ? '#ef4444'
                            : colIdx === 6
                              ? '#3b82f6'
                              : 'var(--text-main)',
                      opacity: !item.isCurrentMonth && !isSelected ? 0.42 : 1,
                      fontSize: '0.9rem',
                      fontWeight: isSelected || isToday ? 800 : 600,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    {item.day}
                  </button>
                );
              })}
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  );
}
