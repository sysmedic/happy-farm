import React, { useMemo } from 'react';
import { 
  Printer, 
  ArrowLeft, 
  Download, 
  FileText, 
  CheckCircle,
  Share2
} from 'lucide-react';
import { 
  ENTITY_STATUSES, 
  GENDER_OPTIONS, 
  CARE_CATEGORIES, 
  calculateAge 
} from '../../lib/types.js';

export default function EntityPrintSheet({
  entity,
  careLogs,
  onClose
}) {
  // 이 개체의 전체 관리 내역 (날짜순 정렬)
  const historyLogs = useMemo(() => {
    if (!entity) return [];
    return careLogs
      .filter(l => l.entityId === entity.id || l.tagNumber === entity.tagNumber)
      .sort((a, b) => new Date(a.date) - new Date(b.date)); // 생애 순서(과거->최신)
  }, [careLogs, entity]);

  if (!entity) return null;

  const age = calculateAge(entity.birthDate);
  const statusObj = ENTITY_STATUSES.find(s => s.id === entity.status) || ENTITY_STATUSES[0];
  const genderObj = GENDER_OPTIONS.find(g => g.id === entity.gender) || GENDER_OPTIONS[0];

  const handlePrint = () => {
    window.print();
  };

  return (
    <div>
      {/* 상단 액션 바 (인쇄 시 숨겨짐) */}
      <div className="filter-bar" style={{ marginBottom: '1.5rem' }}>
        <button className="btn btn-secondary" onClick={onClose}>
          <ArrowLeft size={16} />
          <span>목록으로 돌아가기</span>
        </button>

        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button className="btn btn-primary" onClick={handlePrint}>
            <Printer size={16} />
            <span>개체관리카드 A4 인쇄</span>
          </button>
        </div>
      </div>

      {/* A4 인쇄 규격 개체관리 이력서 */}
      <div className="print-sheet-container card">
        {/* 헤더 */}
        <div className="print-sheet-header">
          <div>
            <div style={{ fontSize: '0.85rem', color: '#059669', fontWeight: 800, textTransform: 'uppercase' }}>
              HAPPY FARM INDIVIDUAL RECORD
            </div>
            <h1 style={{ fontSize: '1.65rem', fontWeight: 900, color: '#0f172a', margin: '4px 0' }}>
              가축 개체관리카드 (개체이력서)
            </h1>
            <div style={{ fontSize: '0.9rem', color: '#64748b', fontWeight: 600 }}>
              행복 농장 개체식별 관리대장 • 발급일자: {new Date().toLocaleDateString()}
            </div>
          </div>

          <div style={{ textAlign: 'right' }}>
            {/* 바코드 그래픽 */}
            <div style={{ 
              fontFamily: 'monospace', 
              fontSize: '1.25rem', 
              letterSpacing: '3px', 
              fontWeight: 900, 
              background: '#0f172a', 
              color: '#ffffff', 
              padding: '0.2rem 0.6rem',
              borderRadius: '4px',
              display: 'inline-block'
            }}>
              ||| | || |||| | |
            </div>
            <div style={{ fontSize: '0.85rem', fontWeight: 800, color: '#0f172a', marginTop: '2px' }}>
              #{entity.tagNumber}
            </div>
          </div>
        </div>

        {/* 1. 개체 기본 인적/스펙 정보 테이블 */}
        <table className="print-table" style={{ marginBottom: '1.5rem' }}>
          <tbody>
            <tr>
              <th style={{ width: '15%' }}>개체번호 (이표)</th>
              <td style={{ width: '35%', fontWeight: 800, fontSize: '1.05rem', color: '#059669' }}>
                {entity.tagNumber}
              </td>
              <th style={{ width: '15%' }}>개체명 (애칭)</th>
              <td style={{ width: '35%', fontWeight: 700 }}>
                🐂 {entity.name}
              </td>
            </tr>
            <tr>
              <th>축종 / 사육구분</th>
              <td>한우 / {entity.breed || '한우'}</td>
              <th>성별 / 상태</th>
              <td>
                <span style={{ fontWeight: 700 }}>{genderObj.label} ({genderObj.symbol})</span>
                <span style={{ marginLeft: '0.5rem', color: '#059669', fontWeight: 600 }}>[{statusObj.label}]</span>
              </td>
            </tr>
            <tr>
              <th>생년월일 (월령)</th>
              <td>{entity.birthDate || '미상'} ({age.text})</td>
              <th>현재 체중 / 축사</th>
              <td>
                <span style={{ fontWeight: 700 }}>{entity.weight ? `${entity.weight} kg` : '미측정'}</span>
                <span style={{ marginLeft: '0.5rem' }}>📍 {entity.barn || '미지정'}</span>
              </td>
            </tr>
            <tr>
              <th>모체 식별번호</th>
              <td>{entity.motherTag || '미상'}</td>
              <th>부체 (KPN/종모우)</th>
              <td>{entity.fatherTag || '미상'}</td>
            </tr>
            {entity.memo && (
              <tr>
                <th>사양 특이사항</th>
                <td colSpan="3" style={{ lineHeight: 1.5 }}>
                  {entity.memo}
                </td>
              </tr>
            )}
          </tbody>
        </table>

        {/* 2. 전 생애 관리 및 진료 이력 테이블 */}
        <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#0f172a', marginBottom: '0.5rem' }}>
          생애 관리 및 진료/방역 이력 대장 (총 {historyLogs.length}건)
        </h3>

        {historyLogs.length === 0 ? (
          <div style={{ 
            textAlign: 'center', 
            padding: '2rem', 
            background: '#f8fafc', 
            border: '1px dashed #cbd5e1', 
            borderRadius: '6px',
            color: '#64748b' 
          }}>
            등록된 생애 관리 이력이 없습니다.
          </div>
        ) : (
          <table className="print-table">
            <thead>
              <tr>
                <th style={{ width: '40px' }}>No</th>
                <th style={{ width: '85px' }}>일자</th>
                <th style={{ width: '90px' }}>관리 분류</th>
                <th style={{ width: '160px' }}>작업명</th>
                <th>세부 처치 / 투약 / 사양 내용</th>
                <th style={{ width: '85px' }}>차기 예정일</th>
                <th style={{ width: '75px' }}>담당자</th>
              </tr>
            </thead>
            <tbody>
              {historyLogs.map((log, index) => {
                const catObj = CARE_CATEGORIES.find(c => c.id === log.category) || CARE_CATEGORIES[0];

                return (
                  <tr key={log.id}>
                    <td style={{ textAlign: 'center', fontWeight: 600 }}>{index + 1}</td>
                    <td style={{ fontWeight: 600 }}>{log.date}</td>
                    <td>
                      <span className={`badge ${catObj.badgeClass}`} style={{ fontSize: '0.7rem' }}>
                        {catObj.label}
                      </span>
                    </td>
                    <td style={{ fontWeight: 700 }}>{log.title}</td>
                    <td style={{ fontSize: '0.8rem', lineHeight: 1.4 }}>
                      {log.details || '-'}
                    </td>
                    <td style={{ fontSize: '0.75rem', color: '#d97706', fontWeight: 600 }}>
                      {log.nextScheduleDate || '-'}
                    </td>
                    <td style={{ fontSize: '0.8rem' }}>{log.operator || '-'}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}

        {/* 하단 관리자 직인 서명란 */}
        <div style={{ 
          marginTop: '2.5rem', 
          paddingTop: '1.25rem', 
          borderTop: '2px solid #0f172a',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div style={{ fontSize: '0.8rem', color: '#64748b' }}>
            본 개체관리카드는 행복 농장 사양관리 데이터베이스로부터 출력되었습니다.
          </div>
          <div style={{ 
            border: '1px solid #0f172a', 
            padding: '0.5rem 1.25rem', 
            borderRadius: '4px',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '0.75rem', color: '#64748b' }}>농장 대표 관리자</div>
            <div style={{ fontWeight: 800, fontSize: '0.95rem', marginTop: '2px' }}>홍 길 동 (인)</div>
          </div>
        </div>
      </div>
    </div>
  );
}
