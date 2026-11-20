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

// 고화질 스마트폰 비율(모바일 카드형) JPG 이미지 보고서 캔버스 생성기
function createReportImageBlob({ reportDate, dailyLogs, totalCost, categoryStats, farmNotes }) {
  return new Promise((resolve) => {
    // 모바일 스마트폰 화면 기준 가로폭 (420px) & 선명한 레티나 2배수 렌더링 (840px 해상도)
    const viewWidth = 420;
    const scale = 2;
    const padding = 16;
    const contentWidth = viewWidth - (padding * 2);

    // 텍스트 줄바꿈 헬퍼
    function getWrappedLines(ctx, text, maxWidth) {
      if (!text) return [];
      const tokens = text.split(' ');
      const lines = [];
      let currentLine = '';

      for (let i = 0; i < tokens.length; i++) {
        const testLine = currentLine ? `${currentLine} ${tokens[i]}` : tokens[i];
        if (ctx.measureText(testLine).width > maxWidth && currentLine) {
          lines.push(currentLine);
          currentLine = tokens[i];
        } else {
          currentLine = testLine;
        }
      }
      if (currentLine) lines.push(currentLine);
      return lines;
    }

    // 임시 측정용 캔버스
    const measureCanvas = document.createElement('canvas');
    const mCtx = measureCanvas.getContext('2d');
    mCtx.font = '12.5px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';

    // 각 카드별 높이 사전 계산
    const cardHeights = dailyLogs.map(log => {
      let h = 14; // 상단 내부 여백
      h += 20; // 1행 (시간, 이표, 이름)
      if (log.operator) h += 17; // 2행 (담당)
      h += 20; // 3행 (제목)
      if (log.details) {
        const lines = getWrappedLines(mCtx, log.details, contentWidth - 24);
        h += Math.max(1, lines.length) * 17 + 4; // 4행 (상세 내용 줄바꿈)
      }
      if (log.nextScheduleDate) h += 22; // 5행 (다음 일정)
      h += 12; // 하단 내부 여백
      return h;
    });

    // 특이사항 높이 계산
    let farmNotesLines = [];
    let farmNotesHeight = 0;
    if (farmNotes && farmNotes.trim()) {
      farmNotesLines = getWrappedLines(mCtx, farmNotes.trim(), contentWidth - 24);
      farmNotesHeight = 30 + (Math.max(1, farmNotesLines.length) * 18) + 20;
    }

    // 전체 세로 높이 동적 계산 (모바일 세로 비율)
    let totalHeight = 70; // 상단 헤더
    totalHeight += 50; // 요약 뱃지 바
    totalHeight += 32; // 세부 관리 내역 제목

    if (dailyLogs.length === 0) {
      totalHeight += 70;
    } else {
      cardHeights.forEach(ch => {
        totalHeight += ch + 10; // 카드 높이 + 카드 간격
      });
    }

    if (farmNotesHeight > 0) {
      totalHeight += farmNotesHeight + 14;
    }

    totalHeight += 45; // 푸터 여백

    // 실제 캔버스 생성 (2배수 스케일)
    const canvas = document.createElement('canvas');
    canvas.width = viewWidth * scale;
    canvas.height = totalHeight * scale;
    const ctx = canvas.getContext('2d');
    ctx.scale(scale, scale);

    // 1. 전체 배경 (모바일 앱 배경색 느낌의 부드러운 그레이)
    ctx.fillStyle = '#f8fafc';
    ctx.fillRect(0, 0, viewWidth, totalHeight);

    // 2. 상단 헤더 (산뜻한 그린)
    ctx.fillStyle = '#059669';
    ctx.fillRect(0, 0, viewWidth, 68);

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 17px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.fillText('🌿 행복농장 일일 영농보고서', padding, 32);

    ctx.font = '12px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.fillStyle = '#d1fae5';
    ctx.fillText(`일자: ${reportDate}`, padding, 52);
    ctx.fillText('작성: 홍길동 대표', viewWidth - padding - 95, 52);

    let y = 80;

    // 3. 요약 통계 뱃지 바 (가로 칩 스타일)
    ctx.fillStyle = '#ffffff';
    ctx.strokeStyle = '#e2e8f0';
    ctx.lineWidth = 1;
    ctx.beginPath();
    if (ctx.roundRect) {
      ctx.roundRect(padding, y, contentWidth, 38, 8);
    } else {
      ctx.rect(padding, y, contentWidth, 38);
    }
    ctx.fill();
    ctx.stroke();

    ctx.font = 'bold 12px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.fillStyle = '#0f172a';
    ctx.fillText(`총 처치 ${dailyLogs.length}건`, padding + 12, y + 23);

    let badgeX = padding + 85;
    if (categoryStats.vaccine > 0) {
      ctx.fillStyle = '#059669';
      ctx.fillText(`백신 ${categoryStats.vaccine}`, badgeX, y + 23);
      badgeX += 50;
    }
    if (categoryStats.treatment > 0) {
      ctx.fillStyle = '#dc2626';
      ctx.fillText(`치료 ${categoryStats.treatment}`, badgeX, y + 23);
      badgeX += 50;
    }
    if (categoryStats.breeding > 0) {
      ctx.fillStyle = '#0284c7';
      ctx.fillText(`수정 ${categoryStats.breeding}`, badgeX, y + 23);
      badgeX += 50;
    }

    ctx.fillStyle = '#475569';
    const costText = `${totalCost.toLocaleString()}원`;
    const costW = ctx.measureText(costText).width;
    ctx.fillText(costText, viewWidth - padding - costW - 12, y + 23);

    y += 50;

    // 4. 세부 관리 내역 섹션 타이틀
    ctx.fillStyle = '#0f172a';
    ctx.font = 'bold 14px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.fillText(`📋 세부 관리 내역 (${dailyLogs.length}건)`, padding, y);

    y += 14;

    // 5. 개체별 관리 카드
    if (dailyLogs.length === 0) {
      ctx.fillStyle = '#ffffff';
      ctx.strokeStyle = '#e2e8f0';
      ctx.beginPath();
      if (ctx.roundRect) ctx.roundRect(padding, y, contentWidth, 60, 8);
      else ctx.rect(padding, y, contentWidth, 60);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#94a3b8';
      ctx.font = '13px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
      ctx.fillText('등록된 관리 내역이 없습니다.', padding + 16, y + 35);
      y += 70;
    } else {
      dailyLogs.forEach((log, idx) => {
        const cardH = cardHeights[idx];

        // 카드 배경 (흰색 + 둥근 테두리)
        ctx.fillStyle = '#ffffff';
        ctx.strokeStyle = '#e2e8f0';
        ctx.lineWidth = 1;
        ctx.beginPath();
        if (ctx.roundRect) {
          ctx.roundRect(padding, y, contentWidth, cardH, 8);
        } else {
          ctx.rect(padding, y, contentWidth, cardH);
        }
        ctx.fill();
        ctx.stroke();

        let cardY = y + 15;

        // 1행: [시간] [개체번호 뱃지] [개체이름]
        let row1X = padding + 12;
        if (log.time) {
          ctx.fillStyle = '#64748b';
          ctx.font = 'bold 12px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
          ctx.fillText(log.time, row1X, cardY + 9);
          row1X += ctx.measureText(log.time).width + 8;
        }

        // 개체번호 뱃지 박스
        ctx.font = 'bold 11px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
        const tagText = log.tagNumber || '';
        const tagW = ctx.measureText(tagText).width + 10;
        ctx.fillStyle = '#e0f2fe';
        ctx.strokeStyle = '#bae6fd';
        ctx.beginPath();
        if (ctx.roundRect) ctx.roundRect(row1X, cardY - 2, tagW, 17, 4);
        else ctx.rect(row1X, cardY - 2, tagW, 17);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = '#0369a1';
        ctx.fillText(tagText, row1X + 5, cardY + 10);
        row1X += tagW + 7;

        // 개체 이름
        ctx.fillStyle = '#0f172a';
        ctx.font = 'bold 13px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
        ctx.fillText(log.entityName || '', row1X, cardY + 10);

        // 2행: 담당
        if (log.operator) {
          cardY += 20;
          ctx.fillStyle = '#64748b';
          ctx.font = '11.5px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
          ctx.fillText(`담당: ${log.operator}`, padding + 12, cardY + 8);
        }

        // 3행: 작업 제목
        cardY += 19;
        ctx.fillStyle = '#0f172a';
        ctx.font = 'bold 13.5px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
        ctx.fillText(log.title, padding + 12, cardY + 9);

        // 4행: 상세 처치 내용 (줄바꿈 지원)
        if (log.details) {
          ctx.fillStyle = '#475569';
          ctx.font = '12px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
          const detailLines = getWrappedLines(ctx, log.details, contentWidth - 24);
          detailLines.forEach(line => {
            cardY += 17;
            ctx.fillText(line, padding + 12, cardY + 8);
          });
        }

        // 5행: 다음 일정
        if (log.nextScheduleDate) {
          cardY += 21;
          ctx.fillStyle = '#d97706';
          ctx.font = 'bold 11.5px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
          const scheduleTitle = log.nextScheduleTitle ? ` (${log.nextScheduleTitle})` : '';
          ctx.fillText(`다음 일정: ${log.nextScheduleDate}${scheduleTitle}`, padding + 12, cardY + 7);
        }

        y += cardH + 10;
      });
    }

    // 6. 일일 영농 특이사항 (내용 있을 때만 표시)
    if (farmNotesHeight > 0) {
      y += 4;
      ctx.fillStyle = '#0f172a';
      ctx.font = 'bold 14px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
      ctx.fillText('📝 일일 영농 특이사항', padding, y);
      y += 12;

      ctx.fillStyle = '#ffffff';
      ctx.strokeStyle = '#e2e8f0';
      ctx.beginPath();
      if (ctx.roundRect) {
        ctx.roundRect(padding, y, contentWidth, farmNotesHeight - 20, 8);
      } else {
        ctx.rect(padding, y, contentWidth, farmNotesHeight - 20);
      }
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#334155';
      ctx.font = '12.5px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
      let noteY = y + 16;
      farmNotesLines.forEach(line => {
        ctx.fillText(line, padding + 12, noteY);
        noteY += 18;
      });

      y += farmNotesHeight;
    }

    // 7. 하단 안내 푸터
    ctx.fillStyle = '#94a3b8';
    ctx.font = '11px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.fillText('행복 농장 • 고객등록카드 기반 개체식별 관리시스템', padding, y + 16);

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
  
  // 날짜별 영농 특이사항 로컬스토리지 영구 보관 (기본 빈칸 시작으로 터치 즉시 타이핑 지원)
  const [farmNotes, setFarmNotes] = useState(() => {
    const initialDate = targetDate || getTodayDateString();
    const saved = localStorage.getItem(`happy_farm_report_note_${initialDate}`);
    return saved !== null ? saved : '';
  });

  // 날짜 변경 시 해당 일자의 특이사항 동기화
  React.useEffect(() => {
    const saved = localStorage.getItem(`happy_farm_report_note_${reportDate}`);
    setFarmNotes(saved !== null ? saved : '');
  }, [reportDate]);

  // 특이사항 변경 시 실시간 자동 저장
  const handleFarmNotesChange = (newVal) => {
    setFarmNotes(newVal);
    try {
      localStorage.setItem(`happy_farm_report_note_${reportDate}`, newVal);
    } catch (e) {
      console.warn('특이사항 저장 실패:', e);
    }
  };

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
      <div className="report-mobile-view" style={{ paddingBottom: '4rem' }}>
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

        {/* 2. 슬림 1단 모바일 타일 카드 그리드 (3열 균일 높이/너비 대칭 규격) */}
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(3, 1fr)', 
          gap: '0.4rem', 
          marginBottom: '0.85rem' 
        }}>
          {/* 1. 총 작업 */}
          <div className="card" style={{ 
            height: '34px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.3rem',
            padding: '0 0.35rem', 
            borderRadius: 'var(--radius-sm)',
            border: '1px solid var(--border-color)',
            background: 'var(--bg-card)',
            boxSizing: 'border-box'
          }}>
            <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)', fontWeight: 600 }}>총작업</span>
            <span style={{ fontSize: '0.86rem', fontWeight: 800, color: 'var(--text-main)' }}>{dailyLogs.length}건</span>
          </div>

          {/* 2. 백신 */}
          <div className="card" style={{ 
            height: '34px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.3rem',
            padding: '0 0.35rem', 
            borderRadius: 'var(--radius-sm)',
            border: '1px solid rgba(5, 150, 105, 0.25)',
            background: 'rgba(5, 150, 105, 0.06)',
            boxSizing: 'border-box'
          }}>
            <span style={{ fontSize: '0.74rem', color: '#059669', fontWeight: 600 }}>백신</span>
            <span style={{ fontSize: '0.86rem', fontWeight: 800, color: '#059669' }}>{categoryStats.vaccine || 0}건</span>
          </div>

          {/* 3. 진료·치료 */}
          <div className="card" style={{ 
            height: '34px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.25rem',
            padding: '0 0.25rem', 
            borderRadius: 'var(--radius-sm)',
            border: '1px solid rgba(220, 38, 38, 0.25)',
            background: 'rgba(220, 38, 38, 0.06)',
            boxSizing: 'border-box'
          }}>
            <span style={{ fontSize: '0.72rem', color: '#dc2626', fontWeight: 600 }}>진료·치료</span>
            <span style={{ fontSize: '0.86rem', fontWeight: 800, color: '#dc2626' }}>{categoryStats.treatment || 0}건</span>
          </div>

          {/* 4. 수정 */}
          <div className="card" style={{ 
            height: '34px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.3rem',
            padding: '0 0.35rem', 
            borderRadius: 'var(--radius-sm)',
            border: '1px solid rgba(2, 132, 199, 0.25)',
            background: 'rgba(2, 132, 199, 0.06)',
            boxSizing: 'border-box'
          }}>
            <span style={{ fontSize: '0.74rem', color: '#0284c7', fontWeight: 600 }}>수정</span>
            <span style={{ fontSize: '0.86rem', fontWeight: 800, color: '#0284c7' }}>{categoryStats.breeding || 0}건</span>
          </div>

          {/* 5. 총 비용 (2칸 차지) */}
          <div className="card" style={{ 
            gridColumn: 'span 2',
            height: '34px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0 0.75rem', 
            borderRadius: 'var(--radius-sm)',
            border: '1px solid var(--border-color)',
            background: 'var(--bg-card)',
            boxSizing: 'border-box'
          }}>
            <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)', fontWeight: 600 }}>총 비용</span>
            <span style={{ fontSize: '0.88rem', fontWeight: 800, color: 'var(--text-main)' }}>{totalCost.toLocaleString()}원</span>
          </div>
        </div>

        {/* 1안: 상단 타일과 개체 카드 목록 사이 은은한 구분선 */}
        <div style={{ 
          height: '1px', 
          background: 'var(--border-color)', 
          margin: '0.85rem 0 0.75rem 0',
          opacity: 0.85
        }} />

        {/* 3. 개체별 관리 내역 카드 목록 */}
        <div style={{ marginBottom: '1.25rem' }}>
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

        {/* 4. 모바일 영농 특이사항 (안드로이드 16px 줌 튕김 방지 및 날짜별 로컬스토리지 자동 저장) */}
        <div className="card" style={{ padding: '0.85rem 1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.45rem' }}>
            <h4 style={{ fontSize: '0.92rem', fontWeight: 800, margin: 0, color: 'var(--text-main)' }}>
              📝 일일 영농 특이사항
            </h4>
            <span style={{ fontSize: '0.72rem', color: farmNotes ? '#10b981' : 'var(--text-muted)', fontWeight: 600 }}>
              {farmNotes ? '✓ 실시간 저장됨' : '미작성'}
            </span>
          </div>
          <textarea
            id="mobile-farm-notes"
            name="mobileFarmNotes"
            rows={3}
            className="form-textarea"
            style={{ 
              background: 'var(--bg-card)', 
              border: '1.5px solid var(--border-color)', 
              borderRadius: 'var(--radius-sm)',
              padding: '0.65rem 0.75rem', 
              fontSize: '16px', // 모바일 브라우저 자동 확대 튕김 방지 (반드시 16px 이상)
              lineHeight: 1.5,
              width: '100%',
              minHeight: '80px',
              touchAction: 'manipulation',
              userSelect: 'text',
              WebkitUserSelect: 'text',
              boxSizing: 'border-box'
            }}
            value={farmNotes}
            onChange={(e) => handleFarmNotesChange(e.target.value)}
            onFocus={(e) => {
              // 안드로이드 키보드 오픈 시 키보드 위 중앙으로 부드럽게 스크롤
              setTimeout(() => {
                e.target.scrollIntoView({ behavior: 'smooth', block: 'center' });
              }, 300);
            }}
            placeholder="당일 기상, 사료 섭취 상태, 이상 증상 개체 등 특이사항을 터치하여 입력하세요."
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
                onChange={(e) => handleFarmNotesChange(e.target.value)}
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
