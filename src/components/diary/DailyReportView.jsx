import React, { useState, useMemo, useEffect } from 'react';
import { 
  Printer, 
  Share2, 
  Calendar, 
  Clock, 
  CheckCircle2, 
  FileText, 
  Sparkles,
  ArrowRight,
  Edit3,
  ChevronLeft
} from 'lucide-react';
import { 
  CARE_CATEGORIES, 
  getTodayDateString,
  getCategoryById,
  normalizeCategoryId
} from '../../lib/types.js';
import { shareFarmReport } from '../../lib/googleDriveService.js';

// 일일 영농 특이사항 로컬스토리지 영구 보존 키 및 도우미 함수
const STORAGE_DAILY_NOTES_KEY = 'happy_farm_daily_notes_v1';

function loadDailyNotes() {
  try {
    const raw = localStorage.getItem(STORAGE_DAILY_NOTES_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch (e) {
    return {};
  }
}

function saveDailyNotes(notesMap) {
  try {
    localStorage.setItem(STORAGE_DAILY_NOTES_KEY, JSON.stringify(notesMap));
  } catch (e) {
    console.error('Failed to save daily notes:', e);
  }
}

// 고화질 스마트폰 비율(모바일 카드형) JPG 이미지 보고서 캔버스 생성기 (화면 양식과 100% 동일 규격)
function createReportImageBlob({ 
  reportDate, 
  dailyLogs, 
  totalCost, 
  categoryStats, 
  activeCategories = [], 
  farmNotes,
  entities = [],
  careCategories = []
}) {
  return new Promise((resolve) => {
    // 모바일 스마트폰 화면 기준 가로폭 (370px) & 선명한 레티나 2배수 렌더링 (740px 해상도)
    const viewWidth = 370;
    const scale = 2;
    const padding = 14;
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

    // 1안 레이아웃에 따른 각 카드별 높이 사전 계산
    const cardHeights = dailyLogs.map(log => {
      let h = 12; // 상단 내부 여백
      h += 20; // 1행 (사각 모노 귀표 + 소 이름 + 타원 종목 뱃지)
      h += 20; // 2행 (작업 제목 굵은 글씨)
      const detailText = log.details || log.description || '';
      if (detailText) {
        const lines = getWrappedLines(mCtx, detailText, contentWidth - 24);
        h += lines.length * 16 + 2; // 3행 (상세 처치 내용 각 줄당 16px)
      }
      h += 18; // 4행 (시간 • 담당자 • 비용 메타 행)
      if (log.nextScheduleDate) {
        const scheduleTitle = log.nextScheduleTitle ? ` (${log.nextScheduleTitle})` : '';
        const fullScheduleText = `다음 일정: ${log.nextScheduleDate}${scheduleTitle}`;
        mCtx.font = 'bold 11.5px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
        const sLines = getWrappedLines(mCtx, fullScheduleText, contentWidth - 24);
        h += 17 + (sLines.length - 1) * 15; // 5행 (다음 일정)
      }
      h += 10; // 하단 내부 여백 밸런싱
      return h;
    });

    // 캡슐 행 수 계산 (3개 단위로 자동 줄바꿈)
    const capsuleRows = Math.ceil((activeCategories.length || 0) / 3);

    // 특이사항 높이 계산
    let farmNotesLines = [];
    let farmNotesHeight = 0;
    if (farmNotes && farmNotes.trim()) {
      farmNotesLines = getWrappedLines(mCtx, farmNotes.trim(), contentWidth - 24);
      farmNotesHeight = 24 + (farmNotesLines.length * 17);
    }

    // 전체 세로 높이 동적 계산 (화면과 100% 동일한 비례)
    let totalHeight = 54; // 1. 상단 그린 헤더 (대안 2 슬림 헤더)
    totalHeight += 12; // 상단 여백
    totalHeight += 36; // 1단: 총작업 & 총비용 2열 반반 카드 (36px)

    if (capsuleRows > 0) {
      totalHeight += 8 + (capsuleRows * 32) + ((capsuleRows - 1) * 6); // 2단: 3열 알약 캡슐 그리드
    }
    totalHeight += 14; // 카드 리스트 시작 전 여백

    if (dailyLogs.length === 0) {
      totalHeight += 70;
    } else {
      cardHeights.forEach(ch => {
        totalHeight += ch + 10; // 카드 높이 + 간격
      });
    }

    if (farmNotesHeight > 0) {
      totalHeight += farmNotesHeight + 30; // 카드와 특이사항 간 시원한 분리 여백 반영
    }

    totalHeight += 40; // 하단 푸터 여백

    // 실제 캔버스 생성 (2배수 스케일)
    const canvas = document.createElement('canvas');
    canvas.width = viewWidth * scale;
    canvas.height = totalHeight * scale;
    const ctx = canvas.getContext('2d');
    ctx.scale(scale, scale);

    // 1. 전체 배경 (부드러운 그레이)
    ctx.fillStyle = '#f8fafc';
    ctx.fillRect(0, 0, viewWidth, totalHeight);

    // 2. 상단 헤더 (산뜻한 그린 - 대안 2: 좌우 양끝 대칭형 1줄 헤더)
    ctx.fillStyle = '#059669';
    ctx.fillRect(0, 0, viewWidth, 54);

    // 좌측: 영농보고서 타이틀
    ctx.textAlign = 'left';
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 15.5px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.fillText('🌱 행복농장 일일 영농보고서', padding + 2, 33);

    // 우측: 날짜 (2026. 03. 10. 세련된 점 포맷)
    const formattedDate = reportDate ? reportDate.replace(/-/g, '. ') + '.' : '';
    ctx.textAlign = 'right';
    ctx.font = '600 12.5px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.fillStyle = '#d1fae5';
    ctx.fillText(formattedDate, viewWidth - padding - 2, 33);
    ctx.textAlign = 'left';

    let y = 66;

    // 3. 1단: 총 작업 & 총 비용 2열 반반 카드
    const halfGap = 6;
    const halfW = Math.floor((contentWidth - halfGap) / 2);
    const stat1X = padding;
    const stat2X = padding + halfW + halfGap;
    const statH = 36;

    // 좌측: 총 작업 카드
    ctx.fillStyle = '#ffffff';
    ctx.strokeStyle = '#e2e8f0';
    ctx.lineWidth = 1;
    ctx.beginPath();
    if (ctx.roundRect) ctx.roundRect(stat1X, y, halfW, statH, 6);
    else ctx.rect(stat1X, y, halfW, statH);
    ctx.fill();
    ctx.stroke();

    ctx.font = '600 11.5px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.fillStyle = '#64748b';
    ctx.fillText('총 작업', stat1X + 10, y + 22);

    ctx.textAlign = 'right';
    ctx.font = 'bold 13.5px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.fillStyle = '#059669';
    ctx.fillText(`${dailyLogs.length}건`, stat1X + halfW - 10, y + 22);
    ctx.textAlign = 'left';

    // 우측: 총 비용 카드
    ctx.fillStyle = '#ffffff';
    ctx.strokeStyle = '#e2e8f0';
    ctx.beginPath();
    if (ctx.roundRect) ctx.roundRect(stat2X, y, halfW, statH, 6);
    else ctx.rect(stat2X, y, halfW, statH);
    ctx.fill();
    ctx.stroke();

    ctx.font = '600 11.5px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.fillStyle = '#64748b';
    ctx.fillText('총 비용', stat2X + 10, y + 22);

    ctx.textAlign = 'right';
    ctx.font = 'bold 13.5px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.fillStyle = '#0f172a';
    ctx.fillText(`${totalCost.toLocaleString()}원`, stat2X + halfW - 10, y + 22);
    ctx.textAlign = 'left';

    y += statH;

    // 4. 2단: 당일 실제로 발생한 종목 3열 알약 캡슐 그리드 (3개 초과 시 자동 줄바꿈)
    if (activeCategories.length > 0) {
      y += 8;
      const colGap = 5;
      const colW = Math.floor((contentWidth - (colGap * 2)) / 3);
      const rowH = 32;

      activeCategories.forEach((cat, idx) => {
        const col = idx % 3;
        const row = Math.floor(idx / 3);
        const cX = padding + col * (colW + colGap);
        const cY = y + row * (rowH + 6);
        const count = categoryStats[cat.id] || 0;

        // 알약 캡슐 배경
        ctx.fillStyle = '#ffffff';
        ctx.strokeStyle = '#e2e8f0';
        ctx.lineWidth = 1;
        ctx.beginPath();
        if (ctx.roundRect) ctx.roundRect(cX, cY, colW, rowH, 16);
        else ctx.rect(cX, cY, colW, rowH);
        ctx.fill();
        ctx.stroke();

        // 캡슐 텍스트
        ctx.textAlign = 'center';
        ctx.font = 'bold 11px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
        ctx.fillStyle = '#0f172a';
        const labelStr = `${cat.icon ? cat.icon + ' ' : ''}${cat.label} ${count}`;
        ctx.fillText(labelStr, cX + colW / 2, cY + 20);
        ctx.textAlign = 'left';
      });

      y += (capsuleRows * rowH) + ((capsuleRows - 1) * 6);
    }

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
        const catObj = getCategoryById(log.category, careCategories);
        const entityObj = entities?.find(e => e.id === log.entityId || e.tagNumber === log.tagNumber);
        const entityName = log.entityName || entityObj?.name || '';

        // 카드 외곽
        ctx.fillStyle = '#ffffff';
        ctx.strokeStyle = '#e2e8f0';
        ctx.lineWidth = 1;
        ctx.beginPath();
        if (ctx.roundRect) ctx.roundRect(padding, y, contentWidth, cardH, 8);
        else ctx.rect(padding, y, contentWidth, cardH);
        ctx.fill();
        ctx.stroke();

        let cardY = y + 12;
        let rX = padding + 12;

        // 1행: [사각 모노 귀표] + 소 이름 + [타원 종목 뱃지]
        // 1) 사각 귀표 박스 (모노톤)
        ctx.font = 'bold 11px monospace, -apple-system, sans-serif';
        const tagText = log.tagNumber || '';
        const tagW = ctx.measureText(tagText).width + 8;
        ctx.fillStyle = '#f1f5f9';
        ctx.strokeStyle = '#cbd5e1';
        ctx.beginPath();
        if (ctx.roundRect) ctx.roundRect(rX, cardY - 1, tagW, 18, 4);
        else ctx.rect(rX, cardY - 1, tagW, 18);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = '#0f172a';
        ctx.fillText(tagText, rX + 4, cardY + 12);
        rX += tagW + 7;

        // 2) 소 이름
        if (entityName) {
          ctx.font = 'bold 12.5px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
          ctx.fillStyle = '#0f172a';
          ctx.fillText(entityName, rX, cardY + 12);
          rX += ctx.measureText(entityName).width + 7;
        }

        // 3) 타원 종목 뱃지
        ctx.font = 'bold 11px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
        const catText = `${catObj.icon ? catObj.icon + ' ' : ''}${catObj.label}`;
        const catW = ctx.measureText(catText).width + 10;
        ctx.fillStyle = 'rgba(16, 185, 129, 0.08)';
        ctx.strokeStyle = 'rgba(16, 185, 129, 0.25)';
        ctx.beginPath();
        if (ctx.roundRect) ctx.roundRect(rX, cardY - 1, catW, 18, 9);
        else ctx.rect(rX, cardY - 1, catW, 18);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = '#059669';
        ctx.fillText(catText, rX + 5, cardY + 12);

        // 2행: 핵심 작업 제목 (굵은 글씨)
        cardY += 21;
        ctx.font = 'bold 13.5px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
        ctx.fillStyle = '#0f172a';
        ctx.fillText(log.title, padding + 12, cardY + 12);

        // 3행: 상세 처치 내용 (있을 때만)
        const detailText = log.details || log.description || '';
        if (detailText) {
          ctx.font = '12px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
          ctx.fillStyle = '#475569';
          const detailLines = getWrappedLines(ctx, detailText, contentWidth - 24);
          detailLines.forEach(line => {
            cardY += 16;
            ctx.fillText(line, padding + 12, cardY + 12);
          });
        }

        // 4행: 시간 • 담당자 • 비용 메타 행
        cardY += 18;
        ctx.font = '11.5px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
        let metaParts = [];
        if (log.time) metaParts.push(log.time);
        if (log.operator) metaParts.push(`담당: ${log.operator}`);
        if (log.cost > 0) metaParts.push(`비용: ${Number(log.cost).toLocaleString()}원`);
        ctx.fillStyle = '#64748b';
        ctx.fillText(metaParts.join('  •  '), padding + 12, cardY + 11);

        // 5행: 다음 일정
        if (log.nextScheduleDate) {
          cardY += 17;
          ctx.fillStyle = '#d97706';
          ctx.font = 'bold 11.5px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
          const scheduleTitle = log.nextScheduleTitle ? ` (${log.nextScheduleTitle})` : '';
          const fullScheduleText = `다음 일정: ${log.nextScheduleDate}${scheduleTitle}`;
          const sLines = getWrappedLines(ctx, fullScheduleText, contentWidth - 24);
          sLines.forEach((line, sIdx) => {
            if (sIdx > 0) cardY += 15;
            ctx.fillText(line, padding + 12, cardY + 11);
          });
        }

        y += cardH + 10;
      });
    }

    // 6. 일일 영농 특이사항 (내용 있을 때만 표시)
    if (farmNotesHeight > 0) {
      y += 18; // 이전 카드와의 여백을 시원하게 확보 (총 28px 분리)
      ctx.fillStyle = '#0f172a';
      ctx.font = 'bold 13.5px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
      ctx.fillText('📄 일일 영농 특이사항', padding, y);
      y += 12; // 타이틀과 박스 사이 간격 정돈

      ctx.fillStyle = '#ffffff';
      ctx.strokeStyle = '#e2e8f0';
      ctx.beginPath();
      if (ctx.roundRect) {
        ctx.roundRect(padding, y, contentWidth, farmNotesHeight, 8);
      } else {
        ctx.rect(padding, y, contentWidth, farmNotesHeight);
      }
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#334155';
      ctx.font = '12px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
      let noteY = y + 12;
      farmNotesLines.forEach(line => {
        ctx.fillText(line, padding + 12, noteY + 11);
        noteY += 17;
      });
      y += farmNotesHeight;
    }

    // 7. 하단 푸터 워터마크
    ctx.textAlign = 'center';
    ctx.fillStyle = '#94a3b8';
    ctx.font = '11px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.fillText('행복 농장 • 고객등록카드 기반 개체식별 관리시스템', viewWidth / 2, totalHeight - 16);
    ctx.textAlign = 'left';

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
  onEditCareLog,
  onNavigateToDiary,
  onNavigateToCloud
}) {
  const [reportDate, setReportDate] = useState(targetDate || getTodayDateString());
  
  // 날짜별 일일 특이사항 영구 로드
  const [farmNotes, setFarmNotes] = useState(() => {
    const allNotes = loadDailyNotes();
    return allNotes[targetDate || getTodayDateString()] || '';
  });

  // 날짜가 바뀔 때 해당 날짜의 영농 특이사항 동기화
  useEffect(() => {
    const allNotes = loadDailyNotes();
    setFarmNotes(allNotes[reportDate] || '');
  }, [reportDate]);

  // 특이사항 변경 시 실시간 로컬스토리지 영구 보존
  const handleFarmNotesChange = (val) => {
    setFarmNotes(val);
    const allNotes = loadDailyNotes();
    allNotes[reportDate] = val;
    saveDailyNotes(allNotes);
  };

  const [shareFeedback, setShareFeedback] = useState('');
  const categoriesToUse = careCategories || CARE_CATEGORIES;

  // 해당 일자 작업 로그 필터링
  const dailyLogs = useMemo(() => {
    return careLogs
      .filter(l => l.date === reportDate)
      .sort((a, b) => (a.time || '').localeCompare(b.time || ''));
  }, [careLogs, reportDate]);

  // 카테고리별 집계 (레거시 영문 카테고리도 표준 ID로 안전 정규화 집계)
  const categoryStats = useMemo(() => {
    const counts = {};
    categoriesToUse.forEach(c => { counts[c.id] = 0; });
    dailyLogs.forEach(l => {
      const normCat = normalizeCategoryId(l.category);
      if (counts[normCat] !== undefined) {
        counts[normCat]++;
      }
    });
    return counts;
  }, [dailyLogs, categoriesToUse]);

  // 당일 실제로 1건 이상 발생한 작업 종목 목록 (0건 낭비 방지 및 동적 추출)
  const activeCategories = useMemo(() => {
    return categoriesToUse.filter(cat => (categoryStats[cat.id] || 0) > 0);
  }, [categoriesToUse, categoryStats]);

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
        activeCategories,
        farmNotes,
        entities,
        careCategories
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

      let summaryText = `[행복 농장 일일 관리 보고서]\n일자: ${reportDate}\n총 관리 작업: ${dailyLogs.length}건 | 총 비용: ${totalCost.toLocaleString()}원\n\n[작업 내역]\n`;
      dailyLogs.forEach((l, idx) => {
        const catObj = getCategoryById(l.category, careCategories);
        const ent = entities?.find(e => e.id === l.entityId || e.tagNumber === l.tagNumber);
        const eName = l.entityName || ent?.name || '';
        let meta = [catObj.label];
        if (l.time) meta.push(l.time);
        if (l.operator) meta.push(`담당: ${l.operator}`);
        if (l.cost > 0) meta.push(`비용: ${Number(l.cost).toLocaleString()}원`);
        summaryText += `${idx + 1}. [${l.tagNumber}] ${eName ? eName + ' - ' : ''}${l.title} (${meta.join(', ')})\n`;
        const itemDetail = l.details || l.description;
        if (itemDetail) {
          summaryText += `   내용: ${itemDetail}\n`;
        }
      });
      if (farmNotes.trim()) {
        summaryText += `\n특이사항:\n${farmNotes}`;
      }

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
        {/* 1. 슬림 1줄 상단 헤더: 뒤로가기(관리내역) & 날짜 선택 & 심플 아이콘 버튼(공유/인쇄) */}
        <div className="card" style={{ padding: '0.55rem 0.75rem', marginBottom: '0.75rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.45rem' }}>
            {/* 좌측: 다이어리 관리내역 복귀 뒤로가기 버튼 */}
            {onNavigateToDiary && (
              <button
                type="button"
                className="btn btn-outline btn-sm"
                onClick={() => onNavigateToDiary(reportDate)}
                title="관리 내역으로 돌아가기"
                aria-label="관리 내역으로 돌아가기"
                style={{
                  width: '32px',
                  height: '32px',
                  padding: 0,
                  flexShrink: 0,
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: '1px solid var(--border-color)',
                  background: 'var(--bg-card)',
                  color: 'var(--text-main)'
                }}
              >
                <ChevronLeft size={18} />
              </button>
            )}

            {/* 중앙: 오늘 복귀 캘린더 아이콘 + 날짜 인풋 */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', minWidth: 0, flex: 1 }}>
              <button
                type="button"
                onClick={() => setReportDate(getTodayDateString())}
                title={reportDate === getTodayDateString() ? "오늘 날짜를 보고 있습니다" : "터치 시 오늘 날짜로 즉시 복귀"}
                aria-label="오늘 날짜로 이동"
                style={{
                  background: reportDate !== getTodayDateString() ? 'rgba(16, 185, 129, 0.12)' : 'transparent',
                  border: reportDate !== getTodayDateString() ? '1px solid rgba(16, 185, 129, 0.4)' : 'none',
                  borderRadius: 'var(--radius-sm)',
                  padding: '0.2rem',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  flexShrink: 0,
                  transition: 'all 0.2s ease'
                }}
              >
                <Calendar size={18} color="var(--color-primary)" />
              </button>
              <input
                type="date"
                className="form-input"
                style={{ width: '100%', maxWidth: '145px', padding: '0.25rem 0.4rem', fontSize: '0.9rem', fontWeight: 700, minWidth: 0 }}
                value={reportDate}
                onChange={(e) => setReportDate(e.target.value)}
              />
            </div>

            {/* 우측: 텍스트 제거된 심플 아이콘 버튼 (공유 / 인쇄) */}
            <div style={{ display: 'flex', gap: '0.35rem', flexShrink: 0 }}>
              <button 
                type="button" 
                className="btn btn-outline btn-sm" 
                onClick={handleShare}
                title="스마트폰 고해상도 이미지 공유 및 텍스트 복사"
                aria-label="보고서 공유"
                style={{ 
                  width: '32px',
                  height: '32px',
                  padding: 0,
                  border: '1px solid var(--border-color)',
                  color: 'var(--text-main)',
                  background: 'var(--bg-card)',
                  display: 'inline-flex', 
                  alignItems: 'center', 
                  justifyContent: 'center'
                }}
              >
                <Share2 size={15} />
              </button>
              <button 
                type="button" 
                className="btn btn-outline btn-sm" 
                onClick={handlePrint}
                title="A4 규격 인쇄"
                aria-label="보고서 인쇄"
                style={{ 
                  width: '32px',
                  height: '32px',
                  padding: 0,
                  border: '1px solid var(--border-color)',
                  color: 'var(--text-main)',
                  background: 'var(--bg-card)',
                  display: 'inline-flex', 
                  alignItems: 'center', 
                  justifyContent: 'center'
                }}
              >
                <Printer size={15} />
              </button>
            </div>
          </div>
        </div>

        {/* 2. 상단 2단 구조 통계 요약 (1단: 총작업&총비용 반반 카드 / 2단: 당일 발생 종목 3열 균등 캡슐) */}
        <div style={{ marginBottom: '0.85rem' }}>
          {/* 1단: 총 작업 & 총 비용 2열 반반 카드 */}
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(2, 1fr)', 
            gap: '0.45rem', 
            marginBottom: activeCategories.length > 0 ? '0.45rem' : '0' 
          }}>
            <div className="card" style={{ 
              height: '36px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '0 0.85rem', 
              borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--border-color)',
              background: 'var(--bg-card)',
              boxSizing: 'border-box'
            }}>
              <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600 }}>총 작업</span>
              <span style={{ fontSize: '0.92rem', fontWeight: 800, color: 'var(--color-primary)' }}>{dailyLogs.length}건</span>
            </div>

            <div className="card" style={{ 
              height: '36px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '0 0.85rem', 
              borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--border-color)',
              background: 'var(--bg-card)',
              boxSizing: 'border-box'
            }}>
              <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600 }}>총 비용</span>
              <span style={{ fontSize: '0.92rem', fontWeight: 800, color: 'var(--text-main)' }}>{totalCost.toLocaleString()}원</span>
            </div>
          </div>

          {/* 2단: 당일 실제로 발생한 종목 3열 균등 알약 캡슐 바둑판 (0건 종목 낭비 방지) */}
          {activeCategories.length > 0 && (
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(3, 1fr)', 
              gap: '0.4rem' 
            }}>
              {activeCategories.map(cat => {
                const count = categoryStats[cat.id] || 0;
                return (
                  <div
                    key={cat.id}
                    className="card"
                    style={{
                      height: '34px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '0.35rem',
                      padding: '0 0.35rem',
                      borderRadius: '9999px',
                      border: '1px solid var(--border-color)',
                      background: 'var(--bg-card-subtle)',
                      boxSizing: 'border-box'
                    }}
                  >
                    {cat.icon && <span style={{ fontSize: '0.85rem', lineHeight: 1 }}>{cat.icon}</span>}
                    <span style={{ fontSize: '0.76rem', color: 'var(--text-main)', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {cat.label}
                    </span>
                    <span style={{ 
                      fontSize: '0.75rem', 
                      fontWeight: 800, 
                      color: 'var(--color-primary)',
                      background: 'rgba(16, 185, 129, 0.12)',
                      padding: '0.05rem 0.35rem',
                      borderRadius: '9999px',
                      flexShrink: 0
                    }}>
                      {count}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* 3. 일일 영농 작업 내역 카드 리스트 */}
        <div style={{ marginBottom: '1.25rem', marginTop: '0.15rem' }}>
          {dailyLogs.length === 0 ? (
            <div className="card" style={{ 
              textAlign: 'center', 
              padding: '2.5rem 1rem', 
              color: 'var(--text-muted)',
              fontSize: '0.88rem'
            }}>
              {reportDate}에 등록된 영농 관리 내역이 없습니다.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
              {dailyLogs.map(log => {
                const catObj = getCategoryById(log.category, careCategories);
                // 개체 이름(애칭) 매핑: log.entityName이 없을 때 entities에서 자동 조회
                const entityObj = entities?.find(e => e.id === log.entityId || e.tagNumber === log.tagNumber);
                const entityName = log.entityName || entityObj?.name || '';

                return (
                  <div key={`m-card-${log.id}`} className="card" style={{ padding: '0.75rem 0.85rem' }}>
                    {/* 1행: [이표번호] [소 이름] [분류 뱃지] <──────────> [✏️ 수정 버튼] */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.45rem', width: '100%' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap', minWidth: 0, flex: 1 }}>
                        <span 
                          className="badge badge-tag"
                          onClick={() => onOpenEntityDetail(log.tagNumber)}
                          title="클릭 시 이 개체의 관리 내역으로 이동"
                          style={{ 
                            cursor: 'pointer', 
                            fontSize: '0.78rem', 
                            padding: '0.18rem 0.5rem', 
                            borderRadius: 'var(--radius-sm)',
                            flexShrink: 0 
                          }}
                        >
                          {log.tagNumber}
                        </span>
                        {entityName && (
                          <span style={{ fontWeight: 800, fontSize: '0.88rem', color: 'var(--text-main)', flexShrink: 0 }}>
                            {entityName}
                          </span>
                        )}
                        <span 
                          className={`badge ${catObj.badgeClass}`}
                          style={{
                            fontSize: '0.72rem',
                            padding: '0.12rem 0.45rem',
                            borderRadius: '9999px',
                            fontWeight: 700,
                            lineHeight: 1.2,
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.2rem',
                            flexShrink: 0
                          }}
                        >
                          {catObj.icon && <span style={{ fontSize: '0.75rem' }}>{catObj.icon}</span>}
                          <span>{catObj.label}</span>
                        </span>
                      </div>

                      {/* 우측 끝: 24x24 미니 수정 버튼 */}
                      {onEditCareLog && (
                        <button
                          type="button"
                          className="btn btn-outline btn-sm btn-icon-only"
                          onClick={() => onEditCareLog(log)}
                          title="이 작업 기록 수정"
                          style={{
                            width: '24px',
                            height: '24px',
                            padding: 0,
                            flexShrink: 0,
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            border: '1px solid var(--border-color)',
                            color: 'var(--text-muted)',
                            background: 'var(--bg-card)',
                            borderRadius: 'var(--radius-sm)'
                          }}
                        >
                          <Edit3 size={12} />
                        </button>
                      )}
                    </div>

                    {/* 2행: 핵심 작업 제목 (굵은 글씨) */}
                    <div style={{ fontWeight: 800, fontSize: '0.95rem', color: 'var(--text-main)', marginTop: '0.35rem', lineHeight: 1.35 }}>
                      {log.title}
                    </div>

                    {/* 3행: 상세 처치 내용 (있을 때만) */}
                    {(log.details || log.description) && (
                      <div style={{ fontSize: '0.825rem', color: 'var(--text-subtle)', lineHeight: 1.45, marginTop: '0.2rem' }}>
                        {log.details || log.description}
                      </div>
                    )}

                    {/* 4행: 시간 • 담당자 • 비용 메타 정보 묶음 (3행 이동으로 1행 수정버튼 안정 확보) */}
                    <div style={{ 
                      fontSize: '0.78rem', 
                      color: 'var(--text-muted)', 
                      fontWeight: 500, 
                      marginTop: '0.35rem', 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: '0.45rem',
                      flexWrap: 'wrap'
                    }}>
                      {log.time && (
                        <span style={{ fontWeight: 700, color: 'var(--text-main)' }}>
                          {log.time}
                        </span>
                      )}
                      {log.time && log.operator && <span style={{ opacity: 0.4 }}>•</span>}
                      {log.operator && <span>담당: {log.operator}</span>}
                      {log.cost > 0 && (
                        <>
                          <span style={{ opacity: 0.4 }}>•</span>
                          <span>비용: {Number(log.cost).toLocaleString()}원</span>
                        </>
                      )}
                    </div>

                    {/* 5행: 다음 일정 */}
                    {log.nextScheduleDate && (
                      <div style={{ fontSize: '0.78rem', color: '#d97706', marginTop: '0.35rem', fontWeight: 700, wordBreak: 'break-all', lineHeight: 1.4 }}>
                        다음 일정: {log.nextScheduleDate} {log.nextScheduleTime ? `(${log.nextScheduleTime}) ` : ''}({log.nextScheduleTitle || '예정'})
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* 4. 모바일 영농 특이사항 (실시간 스토리지 저장 연동) */}
        <div className="card" style={{ padding: '0.85rem 1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', marginBottom: '0.45rem' }}>
            <FileText size={16} style={{ color: 'var(--color-primary)' }} />
            <h4 style={{ fontSize: '0.92rem', fontWeight: 800, margin: 0, color: 'var(--text-main)' }}>
              일일 영농 특이사항
            </h4>
          </div>
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
            onChange={(e) => handleFarmNotesChange(e.target.value)}
            placeholder="당일 기상, 사료 섭취 상태, 이상 증상 개체 등 일일 총평을 입력하세요."
          />
        </div>
      </div>

      {/* 🖨️ 2. PC 및 A4 인쇄 전용 공식 뷰 (모바일에서는 숨김, A4 인쇄 시 100% 무결 출력) */}
      <div className="report-desktop-view">
        {/* 상단 컨트롤 툴바 (A4 규격 820px & 시원한 1열 가로 양끝 정렬) */}
        <div 
          className="filter-bar" 
          style={{ 
            maxWidth: '820px', 
            margin: '0 auto 1.5rem auto',
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '1rem',
            padding: '0.75rem 1.15rem'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            {onNavigateToDiary && (
              <button
                type="button"
                className="btn btn-outline btn-sm"
                onClick={() => onNavigateToDiary(reportDate)}
                title="다이어리 관리 내역으로 돌아가기"
                style={{ 
                  display: 'inline-flex', 
                  alignItems: 'center', 
                  gap: '0.3rem', 
                  fontWeight: 600,
                  padding: '0.35rem 0.65rem'
                }}
              >
                <ChevronLeft size={16} />
                <span>관리 내역</span>
              </button>
            )}
            <label style={{ fontSize: '0.875rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--text-main)', whiteSpace: 'nowrap' }}>
              <button
                type="button"
                onClick={() => setReportDate(getTodayDateString())}
                title={reportDate === getTodayDateString() ? "오늘 날짜를 보고 있습니다" : "클릭 시 오늘 날짜로 즉시 복귀"}
                style={{
                  background: 'transparent',
                  border: 'none',
                  padding: 0,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center'
                }}
              >
                <Calendar size={16} color="var(--color-primary)" />
              </button>
              <span>보고서 기준 일자:</span>
            </label>
            <input
              type="date"
              className="form-input"
              style={{ width: 'auto', padding: '0.35rem 0.65rem', fontWeight: 700 }}
              value={reportDate}
              onChange={(e) => setReportDate(e.target.value)}
            />
          </div>

          <div style={{ display: 'flex', gap: '0.5rem', flexShrink: 0 }}>
            <button className="btn btn-secondary" onClick={handleShare} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
              <Share2 size={15} />
              <span>스마트 공유 / 복사</span>
            </button>
            <button className="btn btn-primary" onClick={handlePrint} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
              <Printer size={15} />
              <span>A4 보고서 인쇄</span>
            </button>
          </div>
        </div>

        {/* A4 인쇄 규격 영농 보고서 양식 */}
        <div className="print-sheet-container card">
          {/* 1안: 모던 레포트 헤더 (도장 박스 삭제, 좌측 타이틀 & 우측 출력일시, 구분선) */}
          <div className="print-sheet-header" style={{ borderBottom: '2px solid #e2e8f0', paddingBottom: '0.95rem', marginBottom: '1.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', width: '100%' }}>
            <div style={{ display: 'inline-flex', flexDirection: 'column' }}>
              <h1 style={{ fontSize: '1.5rem', fontWeight: 900, color: '#0f172a', margin: '0 0 0.35rem 0', display: 'flex', alignItems: 'center', gap: '0.45rem', whiteSpace: 'nowrap' }}>
                <span style={{ fontSize: '1.35rem' }}>🌱</span>
                <span>행복 농장 일일 관리 보고서</span>
              </h1>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', fontSize: '0.88rem', color: '#64748b', fontWeight: 600 }}>
                <span>기준 일자: <strong style={{ color: '#0f172a' }}>{reportDate}</strong></span>
                <span>작성: 홍길동 대표</span>
              </div>
            </div>

            <div style={{ textAlign: 'right', paddingBottom: '2px', flexShrink: 0 }}>
              <div style={{ fontSize: '0.78rem', color: '#94a3b8', whiteSpace: 'nowrap' }}>
                출력일시: {new Date().toLocaleString()}
              </div>
            </div>
          </div>

          {/* 요약 통계 지표 (A4 인쇄 및 웹 화면 5열 1줄 완전 일치) */}
          <div 
            className="report-summary-grid"
            style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(5, 1fr)', 
              gap: '0.65rem', 
              marginBottom: '1.5rem',
              background: '#f8fafc',
              padding: '0.85rem 1rem',
              borderRadius: '8px',
              border: '1px solid #e2e8f0'
            }}
          >
            <div>
              <span style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 600, display: 'block', whiteSpace: 'nowrap' }}>당일 총 처치/작업</span>
              <div style={{ fontSize: '1.3rem', fontWeight: 800, color: '#0f172a' }}>{dailyLogs.length}건</div>
            </div>
            <div>
              <span style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 600, display: 'block', whiteSpace: 'nowrap' }}>예방접종(백신)</span>
              <div style={{ fontSize: '1.3rem', fontWeight: 800, color: '#059669' }}>{categoryStats.vaccine}건</div>
            </div>
            <div>
              <span style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 600, display: 'block', whiteSpace: 'nowrap' }}>진료 및 투약</span>
              <div style={{ fontSize: '1.3rem', fontWeight: 800, color: '#dc2626' }}>{categoryStats.treatment}건</div>
            </div>
            <div>
              <span style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 600, display: 'block', whiteSpace: 'nowrap' }}>번식 / 인공수정</span>
              <div style={{ fontSize: '1.3rem', fontWeight: 800, color: '#0284c7' }}>{categoryStats.breeding}건</div>
            </div>
            <div>
              <span style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 600, display: 'block', whiteSpace: 'nowrap' }}>집행 비용 합계</span>
              <div style={{ fontSize: '1.3rem', fontWeight: 800, color: '#0f172a' }}>{totalCost.toLocaleString()}원</div>
            </div>
          </div>

          {/* 세부 관리 및 처치 내역 테이블 */}
          <div style={{ marginBottom: '1.5rem' }}>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#0f172a', margin: '0 0 0.45rem 0' }}>
              1. 세부 관리 및 처치 내역
            </h3>

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
                <table className="print-table" style={{ margin: '0.25rem 0 0 0' }}>
                  <thead>
                    <tr>
                      <th style={{ width: '65px' }}>시간</th>
                      <th style={{ width: '155px' }}>개체 (이표 · 이름)</th>
                      <th style={{ width: '75px' }}>분류</th>
                      <th>작업 내용 및 처치 상세</th>
                      <th style={{ width: '115px' }}>담당자</th>
                    </tr>
                  </thead>
                  <tbody>
                    {dailyLogs.map(log => {
                      const catObj = getCategoryById(log.category, careCategories);

                      return (
                        <tr key={log.id}>
                          <td style={{ fontWeight: 600 }}>{log.time || '-'}</td>
                          {/* ⚡ 박스 없는 단정한 블랙 텍스트: 이표번호(클릭 이동) + 개체명 */}
                          <td>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap' }}>
                              <span 
                                onClick={() => onOpenEntityDetail(log.tagNumber)}
                                title="클릭 시 이 개체의 관리 내역으로 이동"
                                style={{ 
                                  cursor: 'pointer', 
                                  fontFamily: 'var(--font-mono)', 
                                  fontWeight: 700, 
                                  color: '#0f172a',
                                  fontSize: '0.85rem',
                                  textDecoration: 'underline',
                                  textUnderlineOffset: '2px',
                                  textDecorationColor: '#cbd5e1'
                                }}
                              >
                                {log.tagNumber}
                              </span>
                              {log.entityName && (
                                <span style={{ fontWeight: 600, color: '#334155', fontSize: '0.825rem' }}>
                                  ({log.entityName})
                                </span>
                              )}
                            </div>
                          </td>
                          {/* 박스 없는 단정한 블랙 텍스트 분류 */}
                          <td style={{ textAlign: 'center', fontWeight: 600, color: '#0f172a', fontSize: '0.825rem' }}>
                            {catObj.label}
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
                          <td style={{ fontSize: '0.85rem', fontWeight: 600, color: '#334155' }}>{log.operator || '-'}</td>
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
