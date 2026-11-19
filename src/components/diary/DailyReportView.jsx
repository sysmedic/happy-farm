import React, { useState, useMemo } from 'react';
import { 
  Printer, 
  Share2, 
  Calendar, 
  Clock, 
  CheckCircle2, 
  FileText, 
  Sparkles,
  ArrowRight
} from 'lucide-react';
import { 
  CARE_CATEGORIES, 
  getTodayDateString,
  getCategoryById
} from '../../lib/types.js';
import { shareFarmReport } from '../../lib/googleDriveService.js';

// 고화질 JPG 이미지 보고서 캔버스 생성기
function createReportImageBlob({ reportDate, dailyLogs, totalCost, categoryStats, farmNotes }) {
  return new Promise((resolve) => {
    const width = 760;
    // 대략적인 높이 계산
    let height = 280;
    dailyLogs.forEach(l => {
      height += 105;
      if (l.details) height += 25;
      if (l.nextScheduleDate) height += 25;
    });
    if (farmNotes) height += 120;
    height += 70;

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');

    // 1. 배경 흰색
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, width, height);

    // 2. 상단 브랜드 헤더 바
    ctx.fillStyle = '#059669';
    ctx.fillRect(0, 0, width, 75);

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 24px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.fillText('행복 농장 일일 관리 보고서', 30, 46);

    ctx.font = '13px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.fillStyle = '#e2e8f0';
    ctx.fillText('HAPPY FARM DAILY REPORT', width - 210, 46);

    let y = 110;

    // 3. 일자 및 정보 서브바
    ctx.fillStyle = '#0f172a';
    ctx.font = 'bold 17px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.fillText(`일자: ${reportDate}`, 30, y);

    ctx.fillStyle = '#64748b';
    ctx.font = '14px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.fillText('작성자: 홍길동 대표', 210, y);

    y += 22;

    // 4. 요약 통계 박스
    ctx.fillStyle = '#f8fafc';
    ctx.strokeStyle = '#e2e8f0';
    ctx.lineWidth = 1;
    ctx.beginPath();
    if (ctx.roundRect) {
      ctx.roundRect(30, y, width - 60, 58, 8);
    } else {
      ctx.rect(30, y, width - 60, 58);
    }
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#0f172a';
    ctx.font = 'bold 15px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.fillText(`총 처치: ${dailyLogs.length}건`, 50, y + 35);

    if (categoryStats.vaccine > 0) {
      ctx.fillStyle = '#059669';
      ctx.fillText(`백신: ${categoryStats.vaccine}건`, 180, y + 35);
    }
    if (categoryStats.treatment > 0) {
      ctx.fillStyle = '#dc2626';
      ctx.fillText(`치료: ${categoryStats.treatment}건`, 290, y + 35);
    }
    ctx.fillStyle = '#0284c7';
    ctx.fillText(`비용: ${totalCost.toLocaleString()}원`, width - 210, y + 35);

    y += 85;

    // 5. 세부 관리 내역 타이틀
    ctx.fillStyle = '#0f172a';
    ctx.font = 'bold 17px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.fillText(`세부 관리 내역 (${dailyLogs.length}건)`, 30, y);

    y += 18;

    // 6. 개체별 카드 렌더링
    if (dailyLogs.length === 0) {
      ctx.fillStyle = '#94a3b8';
      ctx.font = '14px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
      ctx.fillText('등록된 관리 내역이 없습니다.', 50, y + 35);
      y += 60;
    } else {
      dailyLogs.forEach((log) => {
        let cardH = 80;
        if (log.operator) cardH += 18;
        if (log.details) cardH += 22;
        if (log.nextScheduleDate) cardH += 22;

        ctx.fillStyle = '#ffffff';
        ctx.strokeStyle = '#cbd5e1';
        ctx.beginPath();
        if (ctx.roundRect) {
          ctx.roundRect(30, y, width - 60, cardH, 8);
        } else {
          ctx.rect(30, y, width - 60, cardH);
        }
        ctx.fill();
        ctx.stroke();

        let cardY = y + 25;

        // 1행: 시간 + 개체번호 + 이름
        ctx.fillStyle = '#64748b';
        ctx.font = 'bold 14px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
        const timeStr = log.time ? `${log.time}  ` : '';
        ctx.fillText(timeStr, 48, cardY);

        const timeW = log.time ? ctx.measureText(timeStr).width : 0;
        ctx.fillStyle = '#0284c7';
        ctx.font = 'bold 15px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
        ctx.fillText(log.tagNumber, 48 + timeW, cardY);

        const tagW = ctx.measureText(log.tagNumber).width;
        ctx.fillStyle = '#0f172a';
        ctx.fillText(`  ${log.entityName}`, 48 + timeW + tagW, cardY);

        // 2행: 담당
        if (log.operator) {
          cardY += 19;
          ctx.fillStyle = '#64748b';
          ctx.font = '13px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
          ctx.fillText(`담당: ${log.operator}`, 48, cardY);
        }

        // 3행: 작업 제목
        cardY += 23;
        ctx.fillStyle = '#0f172a';
        ctx.font = 'bold 15px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
        ctx.fillText(`• ${log.title}`, 48, cardY);

        // 4행: 상세 처치
        if (log.details) {
          cardY += 19;
          ctx.fillStyle = '#475569';
          ctx.font = '13px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
          const truncatedDetails = log.details.length > 55 ? `${log.details.slice(0, 55)}...` : log.details;
          ctx.fillText(`  ${truncatedDetails}`, 48, cardY);
        }

        // 5행: 다음 일정
        if (log.nextScheduleDate) {
          cardY += 20;
          ctx.fillStyle = '#d97706';
          ctx.font = 'bold 13px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
          ctx.fillText(`  다음 일정: ${log.nextScheduleDate} (${log.nextScheduleTitle || '예정'})`, 48, cardY);
        }

        y += cardH + 10;
      });
    }

    y += 10;

    // 7. 영농 특이사항 박스
    if (farmNotes) {
      ctx.fillStyle = '#0f172a';
      ctx.font = 'bold 16px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
      ctx.fillText('영농 총평 및 특이사항', 30, y);
      y += 15;

      ctx.fillStyle = '#f8fafc';
      ctx.strokeStyle = '#e2e8f0';
      ctx.beginPath();
      if (ctx.roundRect) {
        ctx.roundRect(30, y, width - 60, 58, 8);
      } else {
        ctx.rect(30, y, width - 60, 58);
      }
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#334155';
      ctx.font = '14px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
      ctx.fillText(farmNotes.length > 55 ? `${farmNotes.slice(0, 55)}...` : farmNotes, 48, y + 34);
      y += 75;
    }

    // 8. 하단 푸터
    ctx.fillStyle = '#94a3b8';
    ctx.font = '12px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.fillText('행복 농장 (Happy Farm System) • 고객등록카드 기반 개체식별 관리', 30, y + 20);

    canvas.toBlob((blob) => {
      resolve(blob);
    }, 'image/jpeg', 0.95);
  });
}

export default function DailyReportView({
  targetDate,
  entities,
  careLogs,
  careCategories,
  onOpenEntityDetail,
  onOpenCareLogModal,
  onNavigateToCloud
}) {
  const [reportDate, setReportDate] = useState(targetDate || getTodayDateString());
  const [farmNotes, setFarmNotes] = useState('특이 동태 및 전반적인 사육 상태 양호. 온습도 정상 유지.');
  const [shareFeedback, setShareFeedback] = useState('');
  const categoriesToUse = careCategories || CARE_CATEGORIES;

  // 해당 일자 작업 로그 필터링
  const dailyLogs = useMemo(() => {
    return careLogs
      .filter(l => l.date === reportDate)
      .sort((a, b) => (a.time || '').localeCompare(b.time || ''));
  }, [careLogs, reportDate]);

  // 카테고리별 집계
  const categoryStats = useMemo(() => {
    const counts = {};
    categoriesToUse.forEach(c => { counts[c.id] = 0; });
    dailyLogs.forEach(l => {
      if (counts[l.category] !== undefined) {
        counts[l.category]++;
      }
    });
    return counts;
  }, [dailyLogs, categoriesToUse]);

  // 총 비용
  const totalCost = useMemo(() => {
    return dailyLogs.reduce((acc, l) => acc + (Number(l.cost) || 0), 0);
  }, [dailyLogs]);

  const handlePrint = () => {
    window.print();
  };

  const handleShare = async () => {
    try {
      setShareFeedback('보고서 사진(JPG) 준비 중...');
      const imageBlob = await createReportImageBlob({
        reportDate,
        dailyLogs,
        totalCost,
        categoryStats,
        farmNotes
      });

      const fileName = `행복농장_일일보고서_${reportDate}.jpg`;
      const imageFile = imageBlob ? new File([imageBlob], fileName, { type: 'image/jpeg' }) : null;

      // 1. 스마트폰 navigator.share(파일 공유) 지원 시: 카카오톡/문자 사진 공유 창 오픈
      if (navigator.canShare && imageFile && navigator.canShare({ files: [imageFile] })) {
        await navigator.share({
          files: [imageFile],
          title: `행복 농장 일일 보고서 (${reportDate})`,
          text: `[행복 농장] ${reportDate} 일일 관리 보고서 사진입니다.`
        });
        setShareFeedback('보고서 사진(JPG) 공유가 완료되었습니다!');
        setTimeout(() => setShareFeedback(''), 3000);
        return;
      }

      // 2. 파일 공유 미지원 또는 PC 환경: 고화질 JPG 다운로드 + 텍스트 클립보드 복사
      if (imageBlob) {
        const url = URL.createObjectURL(imageBlob);
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }

      let summaryText = `[행복 농장 일일 관리 보고서]\n일자: ${reportDate}\n총 관리 작업: ${dailyLogs.length}건\n총 비용: ${totalCost.toLocaleString()}원\n\n[작업 내역]\n`;
      dailyLogs.forEach((l, idx) => {
        summaryText += `${idx + 1}. [${l.tagNumber}] ${l.entityName} - ${l.title} (${l.time || '시간미지정'})\n`;
      });
      summaryText += `\n특이사항: ${farmNotes}`;

      if (navigator.clipboard) {
        await navigator.clipboard.writeText(summaryText);
      }

      setShareFeedback('보고서 사진(JPG)이 저장되고 텍스트가 클립보드에 복사되었습니다!');
      setTimeout(() => setShareFeedback(''), 4000);
    } catch (err) {
      if (err.name !== 'AbortError') {
        console.error('Share failed:', err);
        setShareFeedback('공유 중 오류가 발생했습니다.');
        setTimeout(() => setShareFeedback(''), 3000);
      } else {
        setShareFeedback('');
      }
    }
  };

  return (
    <div>
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

      {/* 📱 1. 모바일 전용 독립 폼 (스마트폰 화면에서만 단독 표시) */}
      <div className="report-mobile-view">
        {/* 1. 슬림 1줄 상단 헤더: 날짜 선택 & 공유/인쇄 버튼 */}
        <div className="card" style={{ padding: '0.65rem 0.85rem', marginBottom: '0.75rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', minWidth: 0, flex: 1 }}>
              <Calendar size={18} color="var(--color-primary)" style={{ flexShrink: 0 }} />
              <input
                type="date"
                className="form-input"
                style={{ width: 'auto', padding: '0.25rem 0.5rem', fontSize: '0.95rem', fontWeight: 700, minWidth: 0 }}
                value={reportDate}
                onChange={(e) => setReportDate(e.target.value)}
              />
            </div>

            <div style={{ display: 'flex', gap: '0.35rem', flexShrink: 0 }}>
              <button 
                type="button" 
                className="btn btn-secondary btn-sm" 
                onClick={handleShare}
                title="스마트폰 고해상도 이미지 공유 및 텍스트 복사"
                style={{ padding: '0.3rem 0.6rem', fontSize: '0.8rem', display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}
              >
                <Share2 size={13} />
                <span>공유</span>
              </button>
              <button 
                type="button" 
                className="btn btn-primary btn-sm" 
                onClick={handlePrint}
                title="A4 규격 인쇄"
                style={{ padding: '0.3rem 0.6rem', fontSize: '0.8rem', display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}
              >
                <Printer size={13} />
                <span>인쇄</span>
              </button>
            </div>
          </div>
        </div>

        {/* 2. 슬림 요약 뱃지 바 */}
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: '0.4rem', 
          overflowX: 'auto', 
          paddingBottom: '0.35rem', 
          marginBottom: '0.85rem',
          scrollbarWidth: 'none',
          msOverflowStyle: 'none'
        }}>
          <span style={{ 
            fontSize: '0.78rem', 
            background: 'var(--bg-card)', 
            border: '1px solid var(--border-color)', 
            padding: '0.25rem 0.55rem', 
            borderRadius: 'var(--radius-sm)', 
            fontWeight: 700,
            whiteSpace: 'nowrap',
            color: 'var(--text-main)'
          }}>
            총 작업 {dailyLogs.length}건
          </span>
          {categoryStats.vaccine > 0 && (
            <span style={{ 
              fontSize: '0.78rem', 
              background: 'rgba(5, 150, 105, 0.1)', 
              border: '1px solid rgba(5, 150, 105, 0.25)', 
              color: '#059669', 
              padding: '0.25rem 0.55rem', 
              borderRadius: 'var(--radius-sm)', 
              fontWeight: 700,
              whiteSpace: 'nowrap'
            }}>
              백신 {categoryStats.vaccine}건
            </span>
          )}
          {categoryStats.treatment > 0 && (
            <span style={{ 
              fontSize: '0.78rem', 
              background: 'rgba(220, 38, 38, 0.1)', 
              border: '1px solid rgba(220, 38, 38, 0.25)', 
              color: '#dc2626', 
              padding: '0.25rem 0.55rem', 
              borderRadius: 'var(--radius-sm)', 
              fontWeight: 700,
              whiteSpace: 'nowrap'
            }}>
              진료·치료 {categoryStats.treatment}건
            </span>
          )}
          {categoryStats.breeding > 0 && (
            <span style={{ 
              fontSize: '0.78rem', 
              background: 'rgba(2, 132, 199, 0.1)', 
              border: '1px solid rgba(2, 132, 199, 0.25)', 
              color: '#0284c7', 
              padding: '0.25rem 0.55rem', 
              borderRadius: 'var(--radius-sm)', 
              fontWeight: 700,
              whiteSpace: 'nowrap'
            }}>
              수정 {categoryStats.breeding}건
            </span>
          )}
          <span style={{ 
            fontSize: '0.78rem', 
            background: 'var(--bg-card)', 
            border: '1px solid var(--border-color)', 
            color: 'var(--text-main)', 
            padding: '0.25rem 0.55rem', 
            borderRadius: 'var(--radius-sm)', 
            fontWeight: 700,
            whiteSpace: 'nowrap'
          }}>
            비용 {totalCost.toLocaleString()}원
          </span>
        </div>

        {/* 3. 세부 관리 내역 섹션 */}
        <div style={{ marginBottom: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
            <h4 style={{ fontSize: '0.92rem', fontWeight: 800, margin: 0, color: 'var(--text-main)' }}>
              📋 세부 관리 내역 ({dailyLogs.length}건)
            </h4>
          </div>

          {dailyLogs.length === 0 ? (
            <div className="card" style={{ 
              textAlign: 'center', 
              padding: '2rem 1rem', 
              color: 'var(--text-muted)',
              fontSize: '0.85rem'
            }}>
              {reportDate}에 등록된 영농 관리 내역이 없습니다.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
              {dailyLogs.map(log => (
                <div key={`m-card-${log.id}`} className="card" style={{ padding: '0.75rem 0.85rem' }}>
                  {/* 1행: [시간] [개체번호] [이름] */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', flexWrap: 'wrap', minWidth: 0 }}>
                    {log.time && (
                      <span style={{ fontWeight: 700, fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                        {log.time}
                      </span>
                    )}
                    <span 
                      className="badge badge-tag"
                      onClick={() => onOpenEntityDetail(log.tagNumber)}
                      title="클릭 시 이 개체의 관리 내역으로 이동"
                      style={{ cursor: 'pointer', fontSize: '0.75rem', padding: '0.15rem 0.45rem' }}
                    >
                      {log.tagNumber}
                    </span>
                    <span style={{ fontWeight: 700, fontSize: '0.88rem', color: 'var(--text-main)' }}>
                      {log.entityName}
                    </span>
                  </div>

                  {/* 2행: 담당 */}
                  {log.operator && (
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 500, marginTop: '0.2rem' }}>
                      담당: {log.operator}
                    </div>
                  )}

                  {/* 3행: 작업 제목 */}
                  <div style={{ fontWeight: 800, fontSize: '0.95rem', color: 'var(--text-main)', marginTop: '0.35rem' }}>
                    {log.title}
                  </div>

                  {/* 3행: 상세 처치 내용 */}
                  {log.details && (
                    <div style={{ fontSize: '0.825rem', color: 'var(--text-subtle)', lineHeight: 1.45, marginTop: '0.2rem' }}>
                      {log.details}
                    </div>
                  )}

                  {/* 4행: 다음 일정 */}
                  {log.nextScheduleDate && (
                    <div style={{ fontSize: '0.78rem', color: '#d97706', marginTop: '0.35rem', fontWeight: 700 }}>
                      다음 일정: {log.nextScheduleDate} {log.nextScheduleTime ? `(${log.nextScheduleTime}) ` : ''}({log.nextScheduleTitle || '예정'})
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 4. 모바일 영농 특이사항 */}
        <div className="card" style={{ padding: '0.85rem 1rem' }}>
          <h4 style={{ fontSize: '0.92rem', fontWeight: 800, margin: '0 0 0.45rem 0', color: 'var(--text-main)' }}>
            📝 일일 영농 특이사항
          </h4>
          <textarea
            className="form-textarea"
            style={{ 
              background: 'var(--bg-card-subtle)', 
              border: '1px solid var(--border-color)', 
              borderRadius: 'var(--radius-sm)',
              padding: '0.65rem 0.75rem', 
              fontSize: '0.85rem',
              lineHeight: 1.5,
              width: '100%',
              minHeight: '75px' 
            }}
            value={farmNotes}
            onChange={(e) => setFarmNotes(e.target.value)}
            placeholder="당일 기상, 사료 섭취 상태, 이상 증상 개체 등 일일 총평을 입력하세요."
          />
        </div>
      </div>

      {/* 🖨️ 2. PC 및 A4 인쇄 전용 공식 뷰 (모바일에서는 숨김, A4 인쇄 시 100% 무결 출력) */}
      <div className="report-desktop-view">
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
          </div>
        </div>

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
                      <th style={{ width: '75px' }}>분류</th>
                      <th>작업 내용 및 처치 상세</th>
                      <th style={{ width: '90px' }}>담당자</th>
                    </tr>
                  </thead>
                  <tbody>
                    {dailyLogs.map(log => {
                      const catObj = getCategoryById(log.category, careCategories);

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
                              {log.tagNumber}
                            </span>
                          </td>
                          <td style={{ fontWeight: 700 }}>{log.entityName}</td>
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
                                다음 일정: {log.nextScheduleDate} {log.nextScheduleTime ? `(${log.nextScheduleTime}) ` : ''}({log.nextScheduleTitle || '예정'})
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
    </div>
  );
}
