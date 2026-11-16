import React, { useState, useMemo } from 'react';
import { 
  Printer, 
  Share2, 
  Calendar, 
  Clock, 
  CheckCircle2, 
  FileText, 
  Sparkles,
  ArrowRight,
  CloudUpload
} from 'lucide-react';
import { 
  CARE_CATEGORIES, 
  getTodayDateString 
} from '../../lib/types.js';
import { shareFarmReport } from '../../lib/googleDriveService.js';

export default function DailyReportView({
  targetDate,
  entities,
  careLogs,
  onOpenEntityDetail,
  onOpenCareLogModal,
  onNavigateToCloud
}) {
  const [reportDate, setReportDate] = useState(targetDate || getTodayDateString());
  const [farmNotes, setFarmNotes] = useState('특이 동태 및 전반적인 사육 상태 양호. 온습도 정상 유지.');
  const [shareFeedback, setShareFeedback] = useState('');

  // 해당 일자 작업 로그 필터링
  const dailyLogs = useMemo(() => {
    return careLogs
      .filter(l => l.date === reportDate)
      .sort((a, b) => (a.time || '').localeCompare(b.time || ''));
  }, [careLogs, reportDate]);

  // 카테고리별 집계
  const categoryStats = useMemo(() => {
    const counts = {};
    CARE_CATEGORIES.forEach(c => { counts[c.id] = 0; });
    dailyLogs.forEach(l => {
      if (counts[l.category] !== undefined) {
        counts[l.category]++;
      }
    });
    return counts;
  }, [dailyLogs]);

  // 총 비용
  const totalCost = useMemo(() => {
    return dailyLogs.reduce((acc, l) => acc + (Number(l.cost) || 0), 0);
  }, [dailyLogs]);

  // 엔티티 정보 매핑 헬퍼 (축사, 품종 등)
  const getEntityInfo = (entityId, tagNumber) => {
    return entities.find(e => e.id === entityId || e.tagNumber === tagNumber);
  };

  const handlePrint = () => {
    window.print();
  };

  const handleShare = async () => {
    let summaryText = `[행복 농장 일일 관리 보고서]\n일자: ${reportDate}\n총 관리 작업: ${dailyLogs.length}건\n총 비용: ${totalCost.toLocaleString()}원\n\n[작업 내역]\n`;
    dailyLogs.forEach((l, idx) => {
      summaryText += `${idx + 1}. [${l.tagNumber}] ${l.entityName} - ${l.title} (${l.time || '시간미지정'})\n`;
    });
    summaryText += `\n특이사항: ${farmNotes}`;

    const res = await shareFarmReport(`행복 농장 일일 보고서 (${reportDate})`, summaryText);
    if (res.clipboard) {
      setShareFeedback('보고서 내용이 클립보드에 복사되었습니다! (원하는 곳에 붙여넣기 하세요)');
      setTimeout(() => setShareFeedback(''), 4000);
    } else if (res.success) {
      setShareFeedback('보고서 공유가 완료되었습니다.');
      setTimeout(() => setShareFeedback(''), 3000);
    }
  };

  return (
    <div>
      {/* 상단 컨트롤 툴바 (인쇄 시 숨겨짐) */}
      <div className="filter-bar" style={{ marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
          <label style={{ fontSize: '0.875rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <Calendar size={16} />
            <span>보고서 기준 일자:</span>
          </label>
          <input
            type="date"
            className="form-input"
            style={{ width: 'auto' }}
            value={reportDate}
            onChange={(e) => setReportDate(e.target.value)}
          />
        </div>

        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          <button className="btn btn-secondary" onClick={handleShare}>
            <Share2 size={15} />
            <span>스마트 공유 / 복사</span>
          </button>
          <button className="btn btn-primary" onClick={handlePrint}>
            <Printer size={15} />
            <span>A4 보고서 인쇄</span>
          </button>
          <button className="btn btn-outline" onClick={onNavigateToCloud}>
            <CloudUpload size={15} />
            <span>구글 드라이브 백업</span>
          </button>
        </div>
      </div>

      {shareFeedback && (
        <div style={{
          background: 'rgba(16, 185, 129, 0.15)',
          border: '1px solid var(--color-primary)',
          color: 'var(--color-primary)',
          padding: '0.75rem 1rem',
          borderRadius: 'var(--radius-md)',
          marginBottom: '1.25rem',
          fontSize: '0.875rem',
          fontWeight: 600
        }}>
          ✨ {shareFeedback}
        </div>
      )}

      {/* A4 인쇄 규격 영농 보고서 양식 */}
      <div className="print-sheet-container card">
        {/* 보고서 공식 헤더 */}
        <div className="print-sheet-header">
          <div>
            <div style={{ fontSize: '0.85rem', color: '#059669', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              HAPPY FARM DAILY REPORT
            </div>
            <h1 style={{ fontSize: '1.65rem', fontWeight: 900, color: '#0f172a', margin: '4px 0' }}>
              행복 농장 일일 관리 보고서
            </h1>
            <div style={{ fontSize: '0.9rem', color: '#64748b', fontWeight: 600 }}>
              일자: {reportDate} • 작성자: 홍길동 대표
            </div>
          </div>

          <div style={{ textAlign: 'right' }}>
            <div style={{ 
              border: '2px solid #10b981', 
              color: '#059669', 
              padding: '0.35rem 0.8rem', 
              borderRadius: '6px', 
              fontWeight: 800, 
              fontSize: '0.85rem',
              display: 'inline-block' 
            }}>
              영농 확인 필 (印)
            </div>
            <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '4px' }}>
              출력일시: {new Date().toLocaleString()}
            </div>
          </div>
        </div>

        {/* 요약 통계 지표 */}
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', 
          gap: '0.75rem', 
          marginBottom: '1.5rem',
          background: '#f8fafc',
          padding: '1rem',
          borderRadius: '8px',
          border: '1px solid #e2e8f0'
        }}>
          <div>
            <span style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>당일 총 처치/작업</span>
            <div style={{ fontSize: '1.35rem', fontWeight: 800, color: '#0f172a' }}>{dailyLogs.length}건</div>
          </div>
          <div>
            <span style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>예방접종(백신)</span>
            <div style={{ fontSize: '1.35rem', fontWeight: 800, color: '#059669' }}>{categoryStats.vaccine}건</div>
          </div>
          <div>
            <span style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>진료 및 투약</span>
            <div style={{ fontSize: '1.35rem', fontWeight: 800, color: '#dc2626' }}>{categoryStats.treatment}건</div>
          </div>
          <div>
            <span style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>번식 / 인공수정</span>
            <div style={{ fontSize: '1.35rem', fontWeight: 800, color: '#0284c7' }}>{categoryStats.breeding}건</div>
          </div>
          <div>
            <span style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>집행 비용 합계</span>
            <div style={{ fontSize: '1.35rem', fontWeight: 800, color: '#0f172a' }}>{totalCost.toLocaleString()}원</div>
          </div>
        </div>

        {/* ⚡ 요구사항 3: 보고서의 개체번호를 클릭하면 개체번호의 관리 내역으로 이동! */}
        <div style={{ marginBottom: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#0f172a' }}>
              1. 세부 관리 및 처치 내역
            </h3>
            <span style={{ fontSize: '0.8rem', color: '#64748b' }}>
              💡 파란색 개체번호 클릭 시 개체별 전체 이력으로 즉시 이동합니다.
            </span>
          </div>

          {dailyLogs.length === 0 ? (
            <div style={{ 
              textAlign: 'center', 
              padding: '2.5rem', 
              background: '#f8fafc', 
              border: '1px dashed #cbd5e1', 
              borderRadius: '8px',
              color: '#64748b' 
            }}>
              {reportDate}에 등록된 영농 관리 내역이 없습니다.
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table className="print-table">
                <thead>
                  <tr>
                    <th style={{ width: '65px' }}>시간</th>
                    <th style={{ width: '135px' }}>개체번호 (이표)</th>
                    <th style={{ width: '85px' }}>개체명</th>
                    <th style={{ width: '90px' }}>축사위치</th>
                    <th style={{ width: '90px' }}>분류</th>
                    <th>작업 내용 및 처치 상세</th>
                    <th style={{ width: '75px' }}>담당자</th>
                  </tr>
                </thead>
                <tbody>
                  {dailyLogs.map(log => {
                    const catObj = CARE_CATEGORIES.find(c => c.id === log.category) || CARE_CATEGORIES[0];
                    const ent = getEntityInfo(log.entityId, log.tagNumber);

                    return (
                      <tr key={log.id}>
                        <td style={{ fontWeight: 600 }}>{log.time || '-'}</td>
                        {/* ⚡ 클릭 시 해당 개체의 전체 관리 내역으로 이동하는 관계형 링크 */}
                        <td>
                          <span 
                            className="badge badge-tag"
                            onClick={() => onOpenEntityDetail(log.tagNumber)}
                            title="클릭 시 이 개체의 관리 내역으로 이동"
                            style={{ cursor: 'pointer' }}
                          >
                            #{log.tagNumber}
                          </span>
                        </td>
                        <td style={{ fontWeight: 700 }}>{log.entityName}</td>
                        <td style={{ fontSize: '0.8rem', color: '#475569' }}>{ent?.barn || '-'}</td>
                        <td>
                          <span className={`badge ${catObj.badgeClass}`} style={{ fontSize: '0.7rem' }}>
                            {catObj.label}
                          </span>
                        </td>
                        <td>
                          <div style={{ fontWeight: 700, color: '#0f172a', marginBottom: '2px' }}>{log.title}</div>
                          {log.details && (
                            <div style={{ fontSize: '0.785rem', color: '#475569', lineHeight: 1.4 }}>
                              {log.details}
                            </div>
                          )}
                          {log.nextScheduleDate && (
                            <div style={{ fontSize: '0.75rem', color: '#d97706', marginTop: '2px', fontWeight: 600 }}>
                              👉 차기 예정: {log.nextScheduleDate} ({log.nextScheduleTitle || '예정'})
                            </div>
                          )}
                        </td>
                        <td style={{ fontSize: '0.8rem' }}>{log.operator || '-'}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* 2. 관리자 총평 및 특이사항 */}
        <div style={{ marginTop: '1.5rem' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#0f172a', marginBottom: '0.5rem' }}>
            2. 영농 총평 및 일일 특이사항
          </h3>
          <div style={{ 
            background: '#f8fafc', 
            border: '1px solid #e2e8f0', 
            borderRadius: '8px', 
            padding: '1rem',
            fontSize: '0.875rem',
            lineHeight: 1.6,
            color: '#334155'
          }}>
            <textarea
              className="form-textarea"
              style={{ background: 'transparent', border: 'none', padding: 0, minHeight: '60px' }}
              value={farmNotes}
              onChange={(e) => setFarmNotes(e.target.value)}
              placeholder="당일 기상, 사료 섭취 상태, 이상 증상 개체 등 일일 총평을 입력하세요."
            />
          </div>
        </div>

        {/* 인쇄용 하단 서명부 */}
        <div style={{ 
          marginTop: '2.5rem', 
          paddingTop: '1.5rem', 
          borderTop: '2px solid #0f172a',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div style={{ fontSize: '0.85rem', color: '#475569' }}>
            행복 농장 (Happy Farm System) • 고객등록카드 기반 개체식별 관리
          </div>
          <div style={{ fontSize: '0.9rem', fontWeight: 700 }}>
            관리 책임자: 홍길동 (서명 또는 인)
          </div>
        </div>
      </div>
    </div>
  );
}
