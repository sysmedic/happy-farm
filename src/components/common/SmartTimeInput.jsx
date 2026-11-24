import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Clock, X } from 'lucide-react';

// HH:mm 유효성 검사 (24시간제 00:00 ~ 23:59)
function isValidTimeStr(str) {
  if (!/^\d{2}:\d{2}$/.test(str)) return false;
  const [h, m] = str.split(':').map(Number);
  return h >= 0 && h <= 23 && m >= 0 && m <= 59;
}

// 인텔리전트 시간 입력 포맷터 (시 3~9, 분 6~9, 24+ 등 자동 0 채움)
function formatIntelligentTime(raw) {
  const digits = String(raw || '').replace(/\D/g, '').slice(0, 4);
  if (digits.length === 0) return '';

  let hour = '';
  let minDigits = '';

  const h1 = digits[0];
  if (h1 >= '3' && h1 <= '9') {
    // 30~99시는 없으므로 즉시 03~09시로 자동 보정
    hour = `0${h1}`;
    minDigits = digits.slice(1);
  } else {
    // h1 is 0, 1, 2
    if (digits.length === 1) return h1;
    const h2 = digits[1];
    if (h1 === '2' && h2 >= '4') {
      // 24~29시는 없으므로 02시 + h2는 분 첫 자리로 자동 추론
      hour = '02';
      minDigits = digits.slice(1);
    } else {
      hour = `${h1}${h2}`;
      minDigits = digits.slice(2);
    }
  }

  if (minDigits.length === 0) {
    return `${hour}:`;
  }

  const m1 = minDigits[0];
  if (m1 >= '6' && m1 <= '9') {
    // 60~99분은 없으므로 즉시 06~09분으로 자동 보정
    return `${hour}:0${m1}`;
  }

  if (minDigits.length === 1) {
    return `${hour}:${m1}`;
  }

  return `${hour}:${m1}${minDigits[1]}`;
}

// 완료 시점 최종 보정 (예: 09: -> 09:00, 09:5 -> 09:05, 2 -> 02:00)
function resolveFinalTime(text) {
  if (isValidTimeStr(text)) return text;
  const singleMin = text.match(/^(\d{2}):(\d)$/);
  if (singleMin) {
    const candidate = `${singleMin[1]}:0${singleMin[2]}`;
    if (isValidTimeStr(candidate)) return candidate;
  }
  const hourOnly = text.match(/^(\d{2}):?$/);
  if (hourOnly) {
    const candidate = `${hourOnly[1]}:00`;
    if (isValidTimeStr(candidate)) return candidate;
  }
  const singleHour = text.match(/^(\d)$/);
  if (singleHour) {
    const candidate = `0${singleHour[1]}:00`;
    if (isValidTimeStr(candidate)) return candidate;
  }
  return null;
}

// 24시간 HH:mm -> { period: 'AM'|'PM', hour12: 1..12, minute: 0..59 }
function parse24To12(timeStr) {
  if (!isValidTimeStr(timeStr)) {
    const now = new Date();
    const h24 = now.getHours();
    const min = Math.floor(now.getMinutes() / 10) * 10;
    return {
      period: h24 < 12 ? 'AM' : 'PM',
      hour12: h24 % 12 === 0 ? 12 : h24 % 12,
      minute: min
    };
  }
  const [h24, m] = timeStr.split(':').map(Number);
  return {
    period: h24 < 12 ? 'AM' : 'PM',
    hour12: h24 % 12 === 0 ? 12 : h24 % 12,
    minute: m
  };
}

// { period, hour12, minute } -> 24시간 HH:mm 문자열
function to24TimeStr(period, hour12, minute) {
  let h24 = hour12 % 12;
  if (period === 'PM') h24 += 12;
  return `${String(h24).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
}

// 현재 시각 HH:mm 반환
function getCurrentTimeStr() {
  const now = new Date();
  return `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
}

/**
 * 현장 최적화 공통 시간 입력 컴포넌트 (SmartTimeInput)
 * - 불편한 아날로그 시계 바늘 돌리기 완전 제거
 * - 숫자 4자리(예: 0930, 1430) 직접 입력 시 HH:mm 자동 변환
 * - 우측 🕒 버튼 터치 시 [오전/오후] + [시] + [분] 대형 터치 선택창 제공
 */
export default function SmartTimeInput({
  value = '',
  onChange,
  placeholder = '예: 09:30',
  accentColor = 'var(--color-primary)',
  className = '',
  style = {}
}) {
  const [textValue, setTextValue] = useState(value || '');
  const [isOpen, setIsOpen] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const backupValueRef = useRef(value || '');
  const inputRef = useRef(null);

  // 팝업 내부 임시 선택 상태
  const [period, setPeriod] = useState('AM');
  const [hour12, setHour12] = useState(9);
  const [minute, setMinute] = useState(0);
  const [fineMinuteMode, setFineMinuteMode] = useState(false);

  // 외부 value 변경 시 동기화 (타이핑 중이 아닐 때만)
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
    const resolved = resolveFinalTime(textValue);
    if (resolved) {
      if (onChange && resolved !== value) {
        onChange(resolved);
      }
      setTextValue(resolved);
    } else {
      // 아무것도 입력하지 않았거나 미완성 시간인 경우 기존 값으로 안전 복귀
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
    if (inputRef.current) {
      inputRef.current.blur();
    }
  };

  // 시간 선택 팝업 열기
  const openPicker = () => {
    const parsed = parse24To12(value);
    setPeriod(parsed.period);
    setHour12(parsed.hour12);
    setMinute(parsed.minute);
    setFineMinuteMode(parsed.minute % 10 !== 0);
    setIsOpen(true);
  };

  // 숫자 직접 입력 핸들러 (입력 시 인텔리전트 자동 0 채움, 삭제 시 자연스러운 백스페이스)
  const handleTextChange = (e) => {
    const raw = e.target.value;
    // 백스페이스로 지우는 중에는 자동 0 채움을 적용하지 않고 자연스럽게 삭제
    if (raw.length < textValue.length) {
      const cleaned = raw.endsWith(':') ? raw.slice(0, -1) : raw;
      setTextValue(cleaned);
      return;
    }

    const formatted = formatIntelligentTime(raw);
    setTextValue(formatted);

    if (formatted.length === 5 && isValidTimeStr(formatted)) {
      if (onChange) onChange(formatted);
    }
  };

  // 포커스 해제 시 확정/복귀 처리
  const handleBlur = () => {
    finalizeInput();
  };

  // Enter 키 입력 시 상위 폼 제출을 막고 시간 입력만 완료 처리
  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleCompleteClick();
    }
  };

  // [지금] 원터치 적용
  const handleSelectNow = () => {
    const nowStr = getCurrentTimeStr();
    setTextValue(nowStr);
    if (onChange) onChange(nowStr);
    setIsOpen(false);
  };

  // [지우기] 원터치 적용
  const handleClear = () => {
    setTextValue('');
    if (onChange) onChange('');
    setIsOpen(false);
  };

  // [확인] 선택 시간 적용
  const handleConfirm = () => {
    const formatted = to24TimeStr(period, hour12, minute);
    setTextValue(formatted);
    if (onChange) onChange(formatted);
    setIsOpen(false);
  };

  const minuteOptions = fineMinuteMode
    ? [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55]
    : [0, 10, 20, 30, 40, 50];

  const previewLabel = `${period === 'AM' ? '오전' : '오후'} ${String(hour12).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;

  return (
    <>
      <div
        className={`smart-time-input-wrap ${className}`}
        style={{
          position: 'relative',
          display: 'flex',
          alignItems: 'center',
          width: '100%',
          ...style
        }}
      >
        <input
          ref={inputRef}
          type="text"
          inputMode="numeric"
          enterKeyHint="done"
          className="form-input"
          value={textValue}
          onFocus={handleFocus}
          onChange={handleTextChange}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          placeholder={isFocused ? (backupValueRef.current || placeholder) : placeholder}
          maxLength={5}
          style={{
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
            title="시간 입력 완료"
            aria-label="시간 입력 완료"
            style={{
              position: 'absolute',
              right: '5px',
              top: '50%',
              transform: 'translateY(-50%)',
              height: '28px',
              padding: '0 0.6rem',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: accentColor,
              color: '#ffffff',
              border: 'none',
              borderRadius: '6px',
              fontSize: '0.78rem',
              fontWeight: 800,
              cursor: 'pointer',
              whiteSpace: 'nowrap'
            }}
          >
            완료
          </button>
        ) : (
          <button
            type="button"
            onClick={openPicker}
            title="버튼으로 시간 선택"
            aria-label="버튼으로 시간 선택"
            style={{
              position: 'absolute',
              right: '4px',
              top: '50%',
              transform: 'translateY(-50%)',
              width: '34px',
              height: '34px',
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
            <Clock size={18} strokeWidth={2.2} />
          </button>
        )}
      </div>

      {/* 큰 버튼 터치식 시간 선택 팝업 (Portal로 최상위 레이어 렌더링) */}
      {isOpen && createPortal(
        <div
          onClick={() => setIsOpen(false)}
          role="dialog"
          aria-modal="true"
          aria-label="시간 선택"
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
              gap: '0.8rem'
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
                <Clock size={18} color={accentColor} />
                <span style={{ fontSize: '0.98rem', fontWeight: 800 }}>시간 선택</span>
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

            {/* 2. 선택 시간 대형 미리보기 + [지금] / [지움] 원터치 버튼 */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              background: 'var(--bg-page)',
              border: '1px solid var(--border-color)',
              borderRadius: '12px',
              padding: '0.6rem 0.85rem'
            }}>
              <div style={{
                fontSize: '1.2rem',
                fontWeight: 800,
                color: accentColor,
                fontVariantNumeric: 'tabular-nums'
              }}>
                {previewLabel}
              </div>
              <div style={{ display: 'flex', gap: '0.35rem' }}>
                <button
                  type="button"
                  onClick={handleSelectNow}
                  style={{
                    height: '30px',
                    padding: '0 0.65rem',
                    borderRadius: '8px',
                    border: `1px solid ${accentColor}`,
                    background: 'var(--bg-card)',
                    color: accentColor,
                    fontSize: '0.78rem',
                    fontWeight: 700,
                    cursor: 'pointer'
                  }}
                >
                  지금
                </button>
                <button
                  type="button"
                  onClick={handleClear}
                  style={{
                    height: '30px',
                    padding: '0 0.6rem',
                    borderRadius: '8px',
                    border: '1px solid var(--border-color)',
                    background: 'var(--bg-card)',
                    color: 'var(--text-muted)',
                    fontSize: '0.78rem',
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  지움
                </button>
              </div>
            </div>

            {/* 3. 오전 / 오후 깔끔한 2분할 세그먼트 (이모지 없는 클린 1안) */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '0.45rem',
              padding: '0.25rem',
              background: 'var(--bg-page)',
              borderRadius: '10px',
              border: '1px solid var(--border-color)'
            }}>
              {[
                { id: 'AM', label: '오전' },
                { id: 'PM', label: '오후' }
              ].map(p => {
                const isSelected = period === p.id;
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => setPeriod(p.id)}
                    style={{
                      height: '36px',
                      borderRadius: '8px',
                      border: 'none',
                      background: isSelected ? accentColor : 'transparent',
                      color: isSelected ? '#ffffff' : 'var(--text-muted)',
                      fontSize: '0.92rem',
                      fontWeight: 800,
                      cursor: 'pointer',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    {p.label}
                  </button>
                );
              })}
            </div>

            {/* 4. 시 선택 (1 ~ 12시, 4열 x 3행 큰 버튼) */}
            <div>
              <div style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '0.35rem' }}>
                시 (Hour)
              </div>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(4, 1fr)',
                gap: '0.4rem'
              }}>
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(h => {
                  const isSelected = hour12 === h;
                  return (
                    <button
                      key={h}
                      type="button"
                      onClick={() => setHour12(h)}
                      style={{
                        height: '38px',
                        borderRadius: '9px',
                        border: isSelected ? `1.5px solid ${accentColor}` : '1px solid var(--border-color)',
                        background: isSelected ? accentColor : 'var(--bg-page)',
                        color: isSelected ? '#ffffff' : 'var(--text-main)',
                        fontSize: '0.92rem',
                        fontWeight: isSelected ? 800 : 600,
                        cursor: 'pointer'
                      }}
                    >
                      {h}시
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 5. 분 선택 (기본 10분 단위 큰 버튼 + 5분 단위 전환 토글) */}
            <div>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '0.35rem'
              }}>
                <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-muted)' }}>
                  분 (Minute)
                </span>
                <button
                  type="button"
                  onClick={() => setFineMinuteMode(prev => !prev)}
                  style={{
                    background: 'none',
                    border: 'none',
                    padding: 0,
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    color: accentColor,
                    cursor: 'pointer',
                    textDecoration: 'underline'
                  }}
                >
                  {fineMinuteMode ? '10분 단위로 간단히' : '5분 단위로 자세히'}
                </button>
              </div>
              <div style={{
                display: 'grid',
                gridTemplateColumns: fineMinuteMode ? 'repeat(4, 1fr)' : 'repeat(3, 1fr)',
                gap: '0.4rem'
              }}>
                {minuteOptions.map(m => {
                  const isSelected = minute === m;
                  return (
                    <button
                      key={m}
                      type="button"
                      onClick={() => setMinute(m)}
                      style={{
                        height: '36px',
                        borderRadius: '9px',
                        border: isSelected ? `1.5px solid ${accentColor}` : '1px solid var(--border-color)',
                        background: isSelected ? accentColor : 'var(--bg-page)',
                        color: isSelected ? '#ffffff' : 'var(--text-main)',
                        fontSize: '0.88rem',
                        fontWeight: isSelected ? 800 : 600,
                        cursor: 'pointer'
                      }}
                    >
                      {String(m).padStart(2, '0')}분
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 6. 하단 확인 / 취소 버튼 */}
            <div style={{ display: 'flex', gap: '0.5rem', paddingTop: '0.25rem' }}>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                style={{
                  flex: 1,
                  height: '40px',
                  borderRadius: '10px',
                  border: '1px solid var(--border-color)',
                  background: 'var(--bg-page)',
                  color: 'var(--text-muted)',
                  fontSize: '0.9rem',
                  fontWeight: 700,
                  cursor: 'pointer'
                }}
              >
                취소
              </button>
              <button
                type="button"
                onClick={handleConfirm}
                style={{
                  flex: 1.4,
                  height: '40px',
                  borderRadius: '10px',
                  border: 'none',
                  background: accentColor,
                  color: '#ffffff',
                  fontSize: '0.92rem',
                  fontWeight: 800,
                  cursor: 'pointer'
                }}
              >
                확인 ({to24TimeStr(period, hour12, minute)})
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  );
}
