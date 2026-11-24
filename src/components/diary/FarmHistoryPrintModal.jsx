import React, { useRef } from 'react';
import { Printer, X, FileText, CheckCircle2 } from 'lucide-react';
import { getCategoryById } from '../../lib/types.js';

/**
 * 농장 관리 기록 대장 (내부 보관용) A4 세로 인쇄 및 PDF 저장 모달
 */
export default function FarmHistoryPrintModal({
  isOpen,
  onClose,
  logs = [],
  farmSettings = {},
  startDate = '',
  endDate = ''
}) {
  const printAreaRef = useRef(null);

  if (!isOpen) return null;

  // 인쇄 및 PDF 저장 실행
  const handlePrint = () => {
    const originalTitle = document.title;
    const farmNameClean = (farmSettings.farmName || '행복농장').replace(/\s+/g, '_');
    const periodText = startDate && endDate 
      ? `${startDate.replace(/-/g, '')}-${endDate.replace(/-/g, '')}` 
      : '전체';
    
    // PDF 저장 시 브라우저가 기본 파일명으로 제안하도록 document.title 임시 변경
    document.title = `${farmNameClean}_농장관리기록대장_${periodText}`;
    
    window.print();

    // 인쇄 창 호출 후 원래 페이지 타이틀 복원
    setTimeout(() => {
      document.title = originalTitle;
    }, 1000);
  };

  // 날짜순(오름차순 또는 내림차순): 보관용 일지는 과거부터 순서대로(오름차순) 정렬하여 시간 흐름 파악 용이
  const displayLogs = [...logs].sort((a, b) => new Date(a.date) - new Date(b.date));

  // 오늘 날짜 한글 표기
  const today = new Date();
  const printDateStr = `${today.getFullYear()}년 ${today.getMonth() + 1}월 ${today.getDate()}일`;

  const farmName = farmSettings.farmName || '행복농장';

  // 카테고리별 읽기 쉬운 레이블 및 연한 틴트 색상
  const getCategoryBadge = (catId) => {
    const cat = getCategoryById(catId);
    const label = cat ? cat.label : (catId || '일반관리');
    return label;
  };

  const thStyle = {
    padding: '0.55rem 0.6rem',
    background: '#f8fafc',
    border: '1px solid #cbd5e1',
    fontWeight: 700,
    color: '#1e293b',
    fontSize: '0.82rem'
  };

  const tdStyle = {
    padding: '0.55rem 0.65rem',
    border: '1px solid #cbd5e1',
    color: '#0f172a',
    fontSize: '0.82rem',
    verticalAlign: 'middle'
  };

  return (
    <div 
      className="modal-overlay print-modal-overlay" 
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.65)',
        zIndex: 2000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1rem'
      }}
    >
      <div 
        className="modal-content print-preview-container"
        onClick={(e) => e.stopPropagation()}
        style={{
          background: '#ffffff',
          color: '#111827',
          width: '100%',
          maxWidth: '860px',
          maxHeight: '92vh',
          borderRadius: '12px',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.25)',
          overflow: 'hidden'
        }}
      >
        {/* 상단 컨트롤 바 (화면 전용, 인쇄 시 자동 숨김) */}
        <div 
          className="no-print"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0.85rem 1.25rem',
            background: '#f8fafc',
            borderBottom: '1px solid #e2e8f0',
            flexWrap: 'wrap',
            gap: '0.5rem'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ fontSize: '1.1rem' }}>🖨️</span>
            <span style={{ fontWeight: 800, fontSize: '0.98rem', color: '#0f172a' }}>
              농장 관리 기록 대장 (내부 보관용) 미리보기
            </span>
            <span style={{ fontSize: '0.8rem', color: '#64748b', marginLeft: '0.2rem' }}>
              (총 {displayLogs.length}건)
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <button
              type="button"
              onClick={handlePrint}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.4rem',
                background: '#0284c7',
                color: '#ffffff',
                border: 'none',
                padding: '0.5rem 1.1rem',
                borderRadius: '6px',
                fontWeight: 700,
                fontSize: '0.85rem',
                cursor: 'pointer',
                boxShadow: '0 1px 2px rgba(2, 132, 199, 0.3)'
              }}
            >
              <Printer size={16} />
              <span>PDF 저장 / 인쇄</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              style={{
                background: '#e2e8f0',
                color: '#475569',
                border: 'none',
                padding: '0.5rem 0.85rem',
                borderRadius: '6px',
                fontWeight: 600,
                fontSize: '0.85rem',
                cursor: 'pointer'
              }}
            >
              닫기
            </button>
          </div>
        </div>

        {/* 인쇄 팁 배너 (화면 전용) */}
        <div 
          className="no-print"
          style={{
            background: '#eff6ff',
            borderBottom: '1px solid #bfdbfe',
            padding: '0.55rem 1.25rem',
            fontSize: '0.8rem',
            color: '#1e40af',
            display: 'flex',
            alignItems: 'center',
            gap: '0.4rem'
          }}
        >
          <span>💡</span>
          <span>
            <strong>PDF로 저장하는 방법:</strong> [PDF 저장 / 인쇄] 버튼을 누른 후, 인쇄 창에서 <strong>대상(프린터)</strong>을 <strong>'PDF로 저장'</strong>으로 선택하시면 파일로 깔끔하게 저장됩니다.
          </span>
        </div>

        {/* 인쇄 영역 (A4 세로 규격 서식) */}
        <div 
          ref={printAreaRef}
          className="print-page-body"
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: '2.2rem 2.5rem',
            background: '#ffffff',
            fontFamily: "'Pretendard', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
          }}
        >
          {/* 인쇄 전용 CSS */}
          <style dangerouslySetInnerHTML={{ __html: `
            @media print {
              body * {
                visibility: hidden !important;
              }
              .print-modal-overlay,
              .print-preview-container,
              .print-page-body,
              .print-page-body * {
                visibility: visible !important;
              }
              .print-modal-overlay {
                position: absolute !important;
                inset: 0 !important;
                padding: 0 !important;
                background: #ffffff !important;
              }
              .print-preview-container {
                box-shadow: none !important;
                max-width: 100% !important;
                max-height: none !important;
                border-radius: 0 !important;
                border: none !important;
              }
              .print-page-body {
                padding: 0 !important;
                overflow: visible !important;
              }
              .no-print {
                display: none !important;
              }
              @page {
                size: A4 portrait;
                margin: 14mm 12mm 14mm 12mm;
              }
              table {
                page-break-inside: auto;
              }
              tr {
                page-break-inside: avoid;
                break-inside: avoid;
              }
            }
          `}} />

          {/* 1. 상단 제목 (내부 보관용 실용 헤더) */}
          <div style={{ textAlign: 'center', marginBottom: '1.25rem' }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.35rem' }}>
              <h1 style={{ 
                margin: 0, 
                fontSize: '1.65rem', 
                fontWeight: 800, 
                letterSpacing: '0.06em',
                color: '#0f172a'
              }}>
                농장 관리 기록 대장
              </h1>
              <span style={{
                fontSize: '0.75rem',
                fontWeight: 700,
                color: '#475569',
                background: '#f1f5f9',
                border: '1px solid #cbd5e1',
                borderRadius: '4px',
                padding: '0.15rem 0.5rem',
                letterSpacing: '0.02em'
              }}>
                내부 보관용
              </span>
            </div>
          </div>

          {/* 2. 농장 정보 및 조회 기간 요약 박스 (언제부터 언제까지 기간 강조) */}
          <div style={{
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            justifyContent: 'space-between',
            border: '1.5px solid #0f172a',
            background: '#f8fafc',
            padding: '0.65rem 1rem',
            marginBottom: '1rem',
            borderRadius: '4px',
            gap: '0.5rem 1rem'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', flexWrap: 'wrap' }}>
              <div style={{ fontSize: '0.88rem' }}>
                <span style={{ color: '#475569', fontWeight: 600 }}>농장명: </span>
                <strong style={{ color: '#0f172a', fontWeight: 800 }}>{farmName}</strong>
              </div>
              <div style={{ fontSize: '0.88rem' }}>
                <span style={{ color: '#475569', fontWeight: 600 }}>기록 기간: </span>
                <strong style={{ 
                  color: '#0284c7', 
                  fontWeight: 800,
                  background: '#e0f2fe',
                  padding: '0.15rem 0.55rem',
                  borderRadius: '4px'
                }}>
                  {startDate && endDate ? `${startDate} ~ ${endDate}` : '전체 등록 기간'}
                </strong>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', fontSize: '0.82rem', color: '#475569' }}>
              <div>출력일: <strong>{printDateStr}</strong></div>
              <div>출력 건수: <strong>{displayLogs.length}건</strong></div>
            </div>
          </div>

          {/* 3. 농장 관리 내역 본문 테이블 (A4 세로 맞춤 최적 열 배분) */}
          <table style={{
            width: '100%',
            borderCollapse: 'collapse',
            marginBottom: '1.25rem',
            fontSize: '0.82rem'
          }}>
            <thead>
              <tr style={{ background: '#f1f5f9' }}>
                <th style={{ ...thStyle, width: '40px', textAlign: 'center' }}>No</th>
                <th style={{ ...thStyle, width: '95px', textAlign: 'center' }}>관리 일자</th>
                <th style={{ ...thStyle, width: '85px', textAlign: 'center' }}>구분</th>
                <th style={{ ...thStyle, textAlign: 'center' }}>관리 작업 세부 내용</th>
                <th style={{ ...thStyle, width: '80px', textAlign: 'center' }}>작업자</th>
              </tr>
            </thead>
            <tbody>
              {displayLogs.length === 0 ? (
                <tr>
                  <td colSpan={5} style={{ ...tdStyle, textAlign: 'center', padding: '2.5rem 1rem', color: '#64748b' }}>
                    지정된 기간 내에 등록된 농장 관리 기록이 없습니다.
                  </td>
                </tr>
              ) : (
                displayLogs.map((log, index) => {
                  const categoryLabel = getCategoryBadge(log.category);
                  const hasDetails = log.details && log.details.trim() && log.details.trim() !== log.title?.trim();

                  return (
                    <tr key={log.id || index}>
                      <td style={{ ...tdStyle, textAlign: 'center', color: '#64748b' }}>
                        {index + 1}
                      </td>
                      <td style={{ ...tdStyle, textAlign: 'center', whiteSpace: 'nowrap', fontWeight: 600 }}>
                        {log.date}
                      </td>
                      <td style={{ ...tdStyle, textAlign: 'center' }}>
                        <span style={{
                          display: 'inline-block',
                          padding: '0.15rem 0.45rem',
                          borderRadius: '3px',
                          background: '#f1f5f9',
                          border: '1px solid #cbd5e1',
                          fontSize: '0.76rem',
                          fontWeight: 700,
                          color: '#334155',
                          whiteSpace: 'nowrap'
                        }}>
                          {categoryLabel}
                        </span>
                      </td>
                      <td style={{ ...tdStyle, lineHeight: 1.45 }}>
                        <div style={{ fontWeight: 700, color: '#0f172a' }}>
                          {log.title || '농장 관리 작업'}
                        </div>
                        {hasDetails && (
                          <div style={{ 
                            fontSize: '0.78rem', 
                            color: '#475569', 
                            marginTop: '0.2rem',
                            whiteSpace: 'pre-wrap'
                          }}>
                            {log.details}
                          </div>
                        )}
                      </td>
                      <td style={{ ...tdStyle, textAlign: 'center', whiteSpace: 'nowrap', color: '#334155' }}>
                        {log.operator || '농장주'}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>

          {/* 4. 내부 보관용 풋노트 (관공서 서명란 대신 영농 기록철 꼬리말) */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingTop: '0.65rem',
            borderTop: '1px dashed #cbd5e1',
            fontSize: '0.78rem',
            color: '#64748b'
          }}>
            <div>* 본 문서는 농장 내부 일상 관리 및 영농 이력 보관용 기록장입니다.</div>
            <div>{farmName} 영농기록철</div>
          </div>
        </div>
      </div>
    </div>
  );
}
