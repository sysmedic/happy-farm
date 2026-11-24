import React, { useRef } from 'react';
import { Printer, X, Download } from 'lucide-react';

export default function FarmDisinfectionPrintModal({
  isOpen,
  onClose,
  logs = [],
  farmSettings = {},
  startDate = '',
  endDate = ''
}) {
  const printAreaRef = useRef(null);

  if (!isOpen) return null;

  // 인쇄 실행 함수
  const handlePrint = () => {
    window.print();
  };

  // 소독/방역 및 농장 관리 기록만 필터링 (최신순 또는 날짜순 정렬)
  const displayLogs = [...logs].sort((a, b) => new Date(a.date) - new Date(b.date));

  // 오늘 날짜 한글 표기
  const today = new Date();
  const todayStr = `${today.getFullYear()}년 ${today.getMonth() + 1}월 ${today.getDate()}일`;

  const farmName = farmSettings.farmName || '행복농장';
  const ownerName = farmSettings.ownerName || '농장주';
  const address = farmSettings.address || '소재지 정보 없음';
  const phone = farmSettings.phone || '-';

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
        {/* 상단 액션 바 (화면 전용, 인쇄 시 자동 숨김) */}
        <div 
          className="no-print"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0.85rem 1.25rem',
            background: '#f8fafc',
            borderBottom: '1px solid #e2e8f0'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ fontSize: '1.1rem' }}>🖨️</span>
            <span style={{ fontWeight: 800, fontSize: '1rem', color: '#0f172a' }}>
              축사 소독·방역 실시 기록부 인쇄 미리보기
            </span>
            <span style={{ fontSize: '0.8rem', color: '#64748b', marginLeft: '0.3rem' }}>
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
                padding: '0.45rem 1rem',
                borderRadius: '6px',
                fontWeight: 700,
                fontSize: '0.85rem',
                cursor: 'pointer',
                boxShadow: '0 1px 2px rgba(2, 132, 199, 0.3)'
              }}
            >
              <Printer size={16} />
              <span>인쇄 / PDF 저장</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              style={{
                background: '#e2e8f0',
                color: '#475569',
                border: 'none',
                padding: '0.45rem 0.75rem',
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

        {/* 인쇄 영역 (A4 용지 규격 서식) */}
        <div 
          ref={printAreaRef}
          className="print-page-body"
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: '2rem 2.5rem',
            background: '#ffffff',
            fontFamily: "'Pretendard', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
          }}
        >
          {/* 인쇄용 인라인 스타일 */}
          <style dangerouslySetInnerHTML={{ __html: `
            @media print {
              body * {
                visibility: hidden;
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
                margin: 15mm 12mm 15mm 12mm;
              }
            }
          `}} />

          {/* 1. 공문서 헤더 타이틀 */}
          <div style={{ textAlign: 'center', marginBottom: '1.25rem' }}>
            <h2 style={{ 
              margin: '0 0 0.4rem 0', 
              fontSize: '1.65rem', 
              fontWeight: 800, 
              letterSpacing: '0.08em', 
              textDecoration: 'underline',
              textUnderlineOffset: '6px'
            }}>
              축사 소독·방역 실시 기록부
            </h2>
            <p style={{ margin: 0, fontSize: '0.85rem', color: '#4b5563' }}>
              [가축전염병 예방법 시행규칙 제20조 관련]
            </p>
          </div>

          {/* 2. 농장 기본 정보 테이블 */}
          <table style={{
            width: '100%',
            borderCollapse: 'collapse',
            marginBottom: '1rem',
            fontSize: '0.85rem'
          }}>
            <tbody>
              <tr>
                <th style={thStyle}>농 장 명</th>
                <td style={tdStyle}>{farmName}</td>
                <th style={thStyle}>대 표 자</th>
                <td style={tdStyle}>{ownerName}</td>
              </tr>
              <tr>
                <th style={thStyle}>소 재 지</th>
                <td style={tdStyle}>{address}</td>
                <th style={thStyle}>연 락 처</th>
                <td style={tdStyle}>{phone}</td>
              </tr>
              <tr>
                <th style={thStyle}>기록 기간</th>
                <td colSpan={3} style={tdStyle}>
                  {startDate && endDate ? `${startDate} ~ ${endDate}` : '전체 등록 기록'}
                </td>
              </tr>
            </tbody>
          </table>

          {/* 3. 소독·방역 대장 본문 테이블 (서명 열 제거로 작업내용 열 최대 확보) */}
          <table style={{
            width: '100%',
            borderCollapse: 'collapse',
            marginBottom: '1.5rem',
            fontSize: '0.82rem'
          }}>
            <thead>
              <tr style={{ background: '#f1f5f9' }}>
                <th style={{ ...thStyle, width: '38px', textAlign: 'center' }}>No</th>
                <th style={{ ...thStyle, width: '95px', textAlign: 'center' }}>소독 일자</th>
                <th style={{ ...thStyle, width: '140px', textAlign: 'center' }}>소독 구역 / 대상</th>
                <th style={{ ...thStyle, textAlign: 'center' }}>소독 약품명 및 세부 작업 내용</th>
                <th style={{ ...thStyle, width: '85px', textAlign: 'center' }}>작업자</th>
              </tr>
            </thead>
            <tbody>
              {displayLogs.length === 0 ? (
                <tr>
                  <td colSpan={5} style={{ ...tdStyle, textAlign: 'center', padding: '2rem 1rem', color: '#6b7280' }}>
                    조회 기간 내 등록된 방역·소독 기록이 없습니다.
                  </td>
                </tr>
              ) : (
                displayLogs.map((log, index) => {
                  return (
                    <tr key={log.id || index}>
                      <td style={{ ...tdStyle, textAlign: 'center' }}>{index + 1}</td>
                      <td style={{ ...tdStyle, textAlign: 'center', whiteSpace: 'nowrap' }}>
                        {log.date}
                      </td>
                      <td style={{ ...tdStyle, fontWeight: 700 }}>
                        {log.title || '축사 방역소독'}
                      </td>
                      <td style={{ ...tdStyle, lineHeight: 1.45 }}>
                        {log.details ? log.details : (log.title || '-')}
                      </td>
                      <td style={{ ...tdStyle, textAlign: 'center' }}>
                        {log.operator || ownerName || '-'}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>

          {/* 4. 하단 법정 확인 문구 및 서명란 */}
          <div style={{
            marginTop: '2rem',
            paddingTop: '1.5rem',
            borderTop: '1px solid #cbd5e1',
            textAlign: 'center'
          }}>
            <p style={{ margin: '0 0 1rem 0', fontSize: '0.9rem', color: '#1f2937', lineHeight: 1.6 }}>
              위와 같이 축사 소독 및 방역 조치를 성실히 실시하였음을 확인합니다.
            </p>

            <p style={{ margin: '0 0 1.5rem 0', fontSize: '0.95rem', fontWeight: 600 }}>
              {todayStr}
            </p>

            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '2rem', fontSize: '1rem', fontWeight: 700 }}>
              <span>농장 대표자 : {ownerName}</span>
              <span style={{ 
                border: '1px dashed #94a3b8', 
                borderRadius: '50%', 
                width: '42px', 
                height: '42px', 
                display: 'inline-flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                color: '#64748b',
                fontSize: '0.8rem'
              }}>
                서명
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// 테이블 스타일 규격
const thStyle = {
  border: '1px solid #94a3b8',
  padding: '6px 8px',
  background: '#f8fafc',
  fontWeight: 700,
  color: '#0f172a'
};

const tdStyle = {
  border: '1px solid #94a3b8',
  padding: '6px 8px',
  color: '#1e293b'
};
