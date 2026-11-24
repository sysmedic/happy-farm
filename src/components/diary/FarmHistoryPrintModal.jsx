import React, { useRef } from 'react';
import { Printer, X } from 'lucide-react';
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

  // 인쇄 및 PDF 저장 실행 (숨김 iframe 방식으로 메인 화면의 CSS/구조 간섭을 100% 원천 차단)
  const handlePrint = () => {
    const printElement = printAreaRef.current;
    if (!printElement) {
      window.print();
      return;
    }

    const farmNameClean = (farmSettings.farmName || '행복농장').replace(/\s+/g, '_');
    const periodText = startDate && endDate 
      ? `${startDate.replace(/-/g, '')}-${endDate.replace(/-/g, '')}` 
      : '전체';
    const documentTitle = `${farmNameClean}_농장관리기록대장_${periodText}`;

    // 기존 프레임 정리
    const oldIframe = document.getElementById('farm-history-print-frame');
    if (oldIframe) {
      oldIframe.remove();
    }

    // 격리된 오프스크린 iframe 생성 (A4 실제 크기 부여로 브라우저 렌더링 엔진 정상 활성화)
    const iframe = document.createElement('iframe');
    iframe.id = 'farm-history-print-frame';
    iframe.style.position = 'fixed';
    iframe.style.top = '-9999px';
    iframe.style.left = '-9999px';
    iframe.style.width = '210mm';
    iframe.style.height = '297mm';
    iframe.style.border = 'none';
    document.body.appendChild(iframe);

    const doc = iframe.contentWindow.document;
    doc.open();
    doc.write(`
      <!DOCTYPE html>
      <html lang="ko">
        <head>
          <meta charset="utf-8" />
          <title>${documentTitle}</title>
          <style>
            @page {
              size: A4 portrait;
              margin: 15mm 12mm 15mm 12mm;
            }
            * {
              box-sizing: border-box;
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }
            html, body {
              margin: 0;
              padding: 0;
              background: #ffffff !important;
              color: #0f172a !important;
              font-family: 'Pretendard', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Noto Sans KR', sans-serif;
              font-size: 12px;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              page-break-inside: auto;
            }
            tr {
              page-break-inside: avoid;
              break-inside: avoid;
            }
            th, td {
              border: 1px solid #cbd5e1;
            }
            .no-print {
              display: none !important;
            }
          </style>
        </head>
        <body>
          <div style="padding: 5px 0;">
            ${printElement.innerHTML}
          </div>
        </body>
      </html>
    `);
    doc.close();

    let hasPrinted = false;
    const executePrint = () => {
      if (hasPrinted) return;
      hasPrinted = true;
      try {
        iframe.contentWindow.focus();
        iframe.contentWindow.print();
      } catch (err) {
        console.error('Iframe print error, fallback to window.print', err);
        window.print();
      }
    };

    setTimeout(executePrint, 250);
  };

  // 날짜순(오름차순): 과거부터 순서대로 정렬하여 시간 흐름 파악 용이
  const displayLogs = [...logs].sort((a, b) => new Date(a.date) - new Date(b.date));

  // 오늘 날짜 한글 표기
  const today = new Date();
  const printDateStr = `${today.getFullYear()}년 ${today.getMonth() + 1}월 ${today.getDate()}일`;

  const farmName = farmSettings.farmName || '행복농장';

  // 카테고리별 읽기 쉬운 레이블
  const getCategoryBadge = (catId) => {
    const cat = getCategoryById(catId);
    return cat ? cat.label : (catId || '일반관리');
  };

  const thStyle = {
    padding: '0.6rem 0.65rem',
    background: '#f8fafc',
    border: '1px solid #cbd5e1',
    fontWeight: 700,
    color: '#1e293b',
    fontSize: '0.85rem'
  };

  const tdStyle = {
    padding: '0.6rem 0.65rem',
    border: '1px solid #cbd5e1',
    color: '#0f172a',
    fontSize: '0.83rem',
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

        {/* 인쇄 팁 안내 바 (화면 전용) */}
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
            <strong>PDF 파일 저장 안내:</strong> [PDF 저장 / 인쇄] 버튼 클릭 후, 프린터 대상을 <strong>'PDF로 저장'</strong>으로 선택하시면 파일로 저장됩니다.
          </span>
        </div>

        {/* 인쇄 영역 (A4 세로 규격 서식) */}
        <div 
          ref={printAreaRef}
          className="print-page-body"
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: '2.5rem 2.8rem',
            background: '#ffffff',
            fontFamily: "'Pretendard', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
          }}
        >
          {/* 1. 상단 제목 (내부 보관용 심플 텍스트 헤더 - 불필요한 테두리 박스 없음) */}
          <div style={{ textAlign: 'center', marginBottom: '1.25rem' }}>
            <h1 style={{ 
              margin: '0 0 0.35rem 0', 
              fontSize: '1.75rem', 
              fontWeight: 800, 
              letterSpacing: '0.04em',
              color: '#0f172a'
            }}>
              농장 관리 기록 대장
            </h1>
            <div style={{
              fontSize: '0.85rem',
              fontWeight: 600,
              color: '#64748b',
              letterSpacing: '0.02em'
            }}>
              (내부 보관용 영농일지)
            </div>
          </div>

          {/* 2. 농장 정보 및 기록 기간 (박스 내 박스 제거 -> 단정한 상하 구분선 라인형) */}
          <div style={{
            borderTop: '2px solid #0f172a',
            borderBottom: '1px solid #0f172a',
            padding: '0.65rem 0.25rem',
            marginBottom: '1.25rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.35rem'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              fontSize: '0.88rem'
            }}>
              <div>
                <span style={{ color: '#475569', fontWeight: 600 }}>농장명 : </span>
                <strong style={{ color: '#0f172a', fontWeight: 800 }}>{farmName}</strong>
              </div>
              <div>
                <span style={{ color: '#475569', fontWeight: 600 }}>출력일자 : </span>
                <strong style={{ color: '#0f172a', fontWeight: 700 }}>{printDateStr}</strong>
              </div>
            </div>

            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              fontSize: '0.88rem'
            }}>
              <div>
                <span style={{ color: '#475569', fontWeight: 600 }}>기록 기간 : </span>
                <strong style={{ color: '#0284c7', fontWeight: 800, fontSize: '0.92rem' }}>
                  {startDate && endDate ? `${startDate} ~ ${endDate}` : '전체 등록 기간'}
                </strong>
              </div>
              <div>
                <span style={{ color: '#475569', fontWeight: 600 }}>기록 건수 : </span>
                <strong style={{ color: '#0f172a', fontWeight: 700 }}>총 {displayLogs.length}건</strong>
              </div>
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
                <th style={{ ...thStyle, width: '42px', textAlign: 'center' }}>No</th>
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
                      {/* 구분 열: 칸 안의 중첩 뱃지 박스 제거 -> 단정한 텍스트 표기 */}
                      <td style={{ 
                        ...tdStyle, 
                        textAlign: 'center', 
                        whiteSpace: 'nowrap', 
                        fontWeight: 600, 
                        color: '#334155' 
                      }}>
                        {categoryLabel}
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

          {/* 4. 내부 보관용 풋노트 */}
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
