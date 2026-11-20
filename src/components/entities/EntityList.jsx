import React, { useState, useMemo } from 'react';
import { 
  Search, 
  Plus, 
  ClipboardList, 
  History, 
  Calendar,
  Sparkles,
  Activity,
  Stethoscope,
  Heart,
  CheckCircle,
  RotateCcw,
  Settings,
  X,
  Check,
  ArrowUpDown,
  ChevronUp,
  ChevronDown
} from 'lucide-react';
import { 
  ENTITY_STATUSES, 
  GENDER_OPTIONS, 
  HANWOO_BREEDS,
  calculateAge, 
  getKoreanChoseong,
  formatDisplayBreed,
  isHistoricalStatus
} from '../../lib/types.js';

const DASHBOARD_CARDS_STORAGE_KEY = 'happy_farm_active_dashboard_cards_v4';

// 기본적인 배치는 중요 관리 대상 우선 (치료 💊 -> 발정 🔥 -> 임신 💖 -> 수정 🧬 -> 건강 💚)
const DEFAULT_DASHBOARD_CARDS = ['total', 'treatment', 'in_heat', 'pregnant', 'inseminated', 'healthy'];

// 중요 관리 대상 우선 순서 정의
const ALL_DASHBOARD_CARDS = [
  { id: 'total', label: '전체', icon: '🐂', color: '#10b981', bg: 'rgba(16, 185, 129, 0.15)', isFixed: true, desc: '현재 축사에서 사육 중인 전체 한우' },
  { id: 'treatment', label: '치료/투약중', icon: '💊', color: '#ef4444', bg: 'rgba(239, 68, 68, 0.15)', desc: '치료 투약 및 집중 관리 개체 (최우선 관리)' },
  { id: 'in_heat', label: '발정 관찰', icon: '🔥', color: '#f97316', bg: 'rgba(249, 115, 22, 0.15)', desc: '발정 징후 관찰 및 적기 인공수정 대상' },
  { id: 'pregnant', label: '임신/수태', icon: '💖', color: '#8b5cf6', bg: 'rgba(139, 92, 246, 0.15)', desc: '임신 감정 완료 및 출산 대기 개체' },
  { id: 'inseminated', label: '수정 완료', icon: '🧬', color: '#0ea5e9', bg: 'rgba(14, 165, 233, 0.15)', desc: '인공수정 후 임신 확인 대기 (21일 재발정 관찰)' },
  { id: 'nursing', label: '포유/육아', icon: '🐄', color: '#14b8a6', bg: 'rgba(20, 184, 166, 0.15)', desc: '분만 후 젖먹이는 어미소 및 자우' },
  { id: 'scheduled_ship', label: '출하 예정', icon: '🚛', color: '#3b82f6', bg: 'rgba(59, 130, 246, 0.15)', desc: '도축 및 경매 출하 예정 개체' },
  { id: 'healthy', label: '건강/양호', icon: '💚', color: '#10b981', bg: 'rgba(16, 185, 129, 0.15)', desc: '특이 질환 없이 건강한 정상 개체' },
  { id: 'shipped', label: '출하 완료', icon: '🏷️', color: '#64748b', bg: 'rgba(100, 116, 139, 0.15)', desc: '농장에서 출하 완료된 종료 개체' },
  { id: 'deceased', label: '폐사/도태', icon: '🪦', color: '#475569', bg: 'rgba(71, 85, 105, 0.15)', desc: '질병 또는 사고로 폐사된 종료 개체' },
];

export default function EntityList({
  entities,
  careLogs,
  onOpenEntityDetail,
  onOpenEntityModal,
  onOpenCareLogModal,
  onOpenPrintSheet,
  onDeleteEntity
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBreed, setSelectedBreed] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('active'); // 'active': 사육 중인 전체 개체 기본값
  const [selectedBarn, setSelectedBarn] = useState('all');
  const [sortBy, setSortBy] = useState('latest'); // 'latest' | 'tag_asc' | 'age_asc' | 'age_desc' | 'barn_asc'

  // 대시보드 맞춤 활성 카드 ID 목록
  const [activeCardIds, setActiveCardIds] = useState(() => {
    try {
      const saved = localStorage.getItem(DASHBOARD_CARDS_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          if (!parsed.includes('total')) parsed.unshift('total');
          return parsed;
        }
      }
    } catch (e) {
      // ignore
    }
    return DEFAULT_DASHBOARD_CARDS;
  });

  const [isCustomizeOpen, setIsCustomizeOpen] = useState(false);

  // 1단계: 현재 선택된 상태(selectedStatus)에 해당하는 개체군 추출
  const statusFilteredEntities = useMemo(() => {
    return entities.filter(entity => {
      if (selectedStatus === 'active') {
        return !isHistoricalStatus(entity.status);
      } else if (selectedStatus === 'history') {
        return isHistoricalStatus(entity.status);
      } else if (selectedStatus === 'all') {
        return true;
      } else {
        return entity.status === selectedStatus;
      }
    });
  }, [entities, selectedStatus]);

  // 2단계: 1단계 상태 개체군에 실제로 존재하는 사육 구분(품종) 목록만 동적 추출
  const availableBreeds = useMemo(() => {
    return HANWOO_BREEDS.filter(breed => {
      return statusFilteredEntities.some(e => {
        const b = e.breed || '';
        if (breed.id === 'steer_beef') return b.includes('거세') || b.includes('비육');
        if (breed.id === 'breeding_cow') return b.includes('번식') || b.includes('암소');
        if (breed.id === 'calf') return b.includes('송아지') || b.includes('자우');
        if (breed.id === 'growing') return b.includes('육성');
        if (breed.id === 'bull') return b.includes('씨수소') || b.includes('종모우');
        return b.includes(breed.id);
      });
    });
  }, [statusFilteredEntities]);

  // 3단계: 1단계 상태 + 2단계 사육 구분에 실제로 존재하는 축사 위치만 동적 추출
  const availableBarns = useMemo(() => {
    const set = new Set();
    statusFilteredEntities.forEach(e => {
      if (selectedBreed !== 'all') {
        const b = e.breed || '';
        let match = false;
        if (selectedBreed === 'steer_beef') match = b.includes('거세') || b.includes('비육');
        else if (selectedBreed === 'breeding_cow') match = b.includes('번식') || b.includes('암소');
        else if (selectedBreed === 'calf') match = b.includes('송아지') || b.includes('자우');
        else if (selectedBreed === 'growing') match = b.includes('육성');
        else if (selectedBreed === 'bull') match = b.includes('씨수소') || b.includes('종모우');
        else match = b.includes(selectedBreed);
        if (!match) return;
      }

      if (e.barn) {
        const trimmed = e.barn.trim();
        if (trimmed && !trimmed.includes('출하') && !trimmed.includes('퇴농') && !trimmed.includes('폐사')) {
          set.add(trimmed);
        }
      }
    });
    return Array.from(set).sort();
  }, [statusFilteredEntities, selectedBreed]);

  // 1단계 상태 변경 핸들러 (상태 변경 시 하위 사육구분 및 축사 위치 연쇄 자동 리셋)
  const handleStatusChange = (newStatus) => {
    setSelectedStatus(newStatus);
    setSelectedBreed('all');
    setSelectedBarn('all');
  };

  // 2단계 사육 구분 변경 핸들러 (사육 구분 변경 시 하위 축사 위치 자동 기본값 복귀)
  const handleBreedChange = (newBreed) => {
    setSelectedBreed(newBreed);
    setSelectedBarn('all');
  };

  // 통계 계산: 출하 및 폐사 개체는 사육 두수에서 제외하여 실제 축사 사육 두수만 집계
  const stats = useMemo(() => {
    const activeEntities = entities.filter(e => !isHistoricalStatus(e.status));
    const total = activeEntities.length;
    const healthy = activeEntities.filter(e => e.status === 'healthy').length;
    const pregnant = activeEntities.filter(e => e.status === 'pregnant').length;
    const treatment = activeEntities.filter(e => e.status === 'treatment').length;
    const inHeat = activeEntities.filter(e => e.status === 'in_heat').length;
    const inseminated = activeEntities.filter(e => e.status === 'inseminated').length;
    const nursing = activeEntities.filter(e => e.status === 'nursing').length;
    const scheduledShip = activeEntities.filter(e => e.status === 'scheduled_ship').length;

    // 사육 이력(출하 및 폐사)
    const shippedCount = entities.filter(e => e.status === 'shipped').length;
    const deceasedCount = entities.filter(e => e.status === 'deceased').length;
    const historyCount = shippedCount + deceasedCount;

    return { 
      total, 
      healthy,
      pregnant, 
      treatment, 
      inHeat, 
      inseminated, 
      nursing, 
      scheduledShip,
      shippedCount, 
      deceasedCount, 
      historyCount 
    };
  }, [entities]);

  // 특정 카드의 두수/값 산출
  const getCardValue = (cardId) => {
    switch (cardId) {
      case 'total': return stats.total;
      case 'healthy': return stats.healthy;
      case 'pregnant': return stats.pregnant;
      case 'treatment': return stats.treatment;
      case 'in_heat': return stats.inHeat;
      case 'inseminated': return stats.inseminated;
      case 'nursing': return stats.nursing;
      case 'scheduled_ship': return stats.scheduledShip;
      case 'shipped': return stats.shippedCount;
      case 'deceased': return stats.deceasedCount;
      default: return 0;
    }
  };

  // 필터링 & 초성 검색
  const filteredEntities = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    const choseongQ = getKoreanChoseong(q);

    return entities.filter(entity => {
      // 한우 사육 구분 필터 (번식우, 비육우, 송아지 등)
      if (selectedBreed !== 'all') {
        const breed = entity.breed || '';
        let match = false;
        if (selectedBreed === 'steer_beef') {
          match = breed.includes('거세') || breed.includes('비육');
        } else if (selectedBreed === 'breeding_cow') {
          match = breed.includes('번식') || breed.includes('암소');
        } else if (selectedBreed === 'calf') {
          match = breed.includes('송아지') || breed.includes('자우');
        } else if (selectedBreed === 'growing') {
          match = breed.includes('육성');
        } else if (selectedBreed === 'bull') {
          match = breed.includes('씨수소') || breed.includes('종모우');
        } else {
          match = breed.includes(selectedBreed);
        }
        if (!match) return false;
      }
      
      // 상태 필터: 'active'(사육 중 전체), 'history'(사육 이력 전체), 'all'(전체), 또는 개별 상태
      if (selectedStatus === 'active') {
        if (isHistoricalStatus(entity.status)) return false;
      } else if (selectedStatus === 'history') {
        if (!isHistoricalStatus(entity.status)) return false;
      } else if (selectedStatus !== 'all') {
        if (entity.status !== selectedStatus) return false;
      }

      // 축사 필터
      if (selectedBarn !== 'all' && entity.barn !== selectedBarn) {
        return false;
      }

      // 검색어 필터 (이표번호, 이름, 축사, 메모, 초성, 숫자만 입력 시 이표 매칭)
      if (q) {
        const tag = (entity.tagNumber || '').toLowerCase();
        const cleanTag = tag.replace(/[^0-9]/g, '');
        const cleanQ = q.replace(/[^0-9]/g, '');
        const name = (entity.name || '').toLowerCase();
        const barn = (entity.barn || '').toLowerCase();
        const memo = (entity.memo || '').toLowerCase();
        const nameChoseong = getKoreanChoseong(entity.name || '');

        const match = 
          tag.includes(q) || 
          (cleanQ.length > 0 && cleanTag.includes(cleanQ)) ||
          name.includes(q) || 
          barn.includes(q) || 
          memo.includes(q) ||
          nameChoseong.includes(choseongQ);

        if (!match) return false;
      }

      return true;
    });
  }, [entities, searchQuery, selectedBreed, selectedStatus, selectedBarn]);

  // 정렬 순서 적용
  const sortedEntities = useMemo(() => {
    const list = [...filteredEntities];
    switch (sortBy) {
      case 'tag_asc':
        return list.sort((a, b) => (a.tagNumber || '').localeCompare(b.tagNumber || '', undefined, { numeric: true }));
      case 'age_asc':
        // 월령 어린순 = 출생일이 최근인 순서 (2026 -> 2025 -> ...)
        return list.sort((a, b) => new Date(b.birthDate || 0) - new Date(a.birthDate || 0));
      case 'age_desc':
        // 월령 많은순 = 출생일이 오래된 순서 (2020 -> 2021 -> ...)
        return list.sort((a, b) => new Date(a.birthDate || 0) - new Date(b.birthDate || 0));
      case 'barn_asc':
        return list.sort((a, b) => (a.barn || 'zzz').localeCompare(b.barn || 'zzz', undefined, { numeric: true }));
      case 'latest':
      default:
        return list;
    }
  }, [filteredEntities, sortBy]);

  // 특정 개체의 최근 관리 이력 가져오기
  const getLatestCareLog = (entityId, tagNumber) => {
    const logs = careLogs.filter(l => l.entityId === entityId || l.tagNumber === tagNumber);
    if (!logs || logs.length === 0) return null;
    return logs.sort((a, b) => new Date(b.date) - new Date(a.date))[0];
  };

  // 대시보드 카드 클릭 시 원클릭 필터링 (토글 지원 및 하위 필터 연쇄 자동 리셋)
  const handleCardClick = (cardId) => {
    if (cardId === 'total') {
      setSelectedStatus('active');
    } else if (['healthy', 'pregnant', 'treatment', 'in_heat', 'inseminated', 'nursing', 'scheduled_ship'].includes(cardId)) {
      setSelectedStatus(prev => prev === cardId ? 'active' : cardId);
    } else if (cardId === 'shipped') {
      setSelectedStatus(prev => prev === 'shipped' ? 'active' : 'shipped');
    } else if (cardId === 'deceased') {
      setSelectedStatus(prev => prev === 'deceased' ? 'active' : 'deceased');
    }
    // 1단계 상태 칩 변경 시 하위 사육구분 및 축사 위치 연쇄 자동 리셋
    setSelectedBreed('all');
    setSelectedBarn('all');
  };

  // 대시보드 카드 활성화 여부 판정
  const isCardActive = (cardId) => {
    if (cardId === 'total') return selectedStatus === 'active';
    if (['healthy', 'pregnant', 'treatment', 'in_heat', 'inseminated', 'nursing', 'scheduled_ship', 'shipped', 'deceased'].includes(cardId)) {
      return selectedStatus === cardId;
    }
    return false;
  };

  // 지표 토글 (체크 / 체크해제)
  const handleToggleCard = (cardId) => {
    if (cardId === 'total') return;
    setActiveCardIds(prev => {
      let next;
      if (prev.includes(cardId)) {
        next = prev.filter(id => id !== cardId);
      } else {
        next = [...prev, cardId];
      }
      try {
        localStorage.setItem(DASHBOARD_CARDS_STORAGE_KEY, JSON.stringify(next));
      } catch (e) {}
      return next;
    });
  };

  // 기본 지표로 초기화
  const handleResetCards = () => {
    setActiveCardIds(DEFAULT_DASHBOARD_CARDS);
    try {
      localStorage.setItem(DASHBOARD_CARDS_STORAGE_KEY, JSON.stringify(DEFAULT_DASHBOARD_CARDS));
    } catch (e) {}
  };

  // 칩 순서 앞으로 이동 (위로 이동)
  const moveCardUp = (cardId) => {
    setActiveCardIds(prev => {
      const idx = prev.indexOf(cardId);
      if (idx <= 1) return prev; // 사육 두수(0) 다음인 1번 인덱스는 더 위로 못 감
      const next = [...prev];
      const temp = next[idx - 1];
      next[idx - 1] = next[idx];
      next[idx] = temp;
      try {
        localStorage.setItem(DASHBOARD_CARDS_STORAGE_KEY, JSON.stringify(next));
      } catch (e) {}
      return next;
    });
  };

  // 칩 순서 뒤로 이동 (아래로 이동)
  const moveCardDown = (cardId) => {
    setActiveCardIds(prev => {
      const idx = prev.indexOf(cardId);
      if (idx < 1 || idx >= prev.length - 1) return prev;
      const next = [...prev];
      const temp = next[idx + 1];
      next[idx + 1] = next[idx];
      next[idx] = temp;
      try {
        localStorage.setItem(DASHBOARD_CARDS_STORAGE_KEY, JSON.stringify(next));
      } catch (e) {}
      return next;
    });
  };

  // 모달에 보여줄 지표 리스트: 활성화된 칩들을 순서대로 상단에 배치
  const modalDisplayItems = useMemo(() => {
    const activeItems = activeCardIds
      .map(id => ALL_DASHBOARD_CARDS.find(c => c.id === id))
      .filter(Boolean);
    const inactiveItems = ALL_DASHBOARD_CARDS.filter(c => !activeCardIds.includes(c.id));
    return [...activeItems, ...inactiveItems];
  }, [activeCardIds]);

  const isHistoryMode = selectedStatus === 'history' || selectedStatus === 'shipped' || selectedStatus === 'deceased';

  return (
    <div>
      {/* 1. 상단 맞춤형 통계 현황판 (원클릭 필터링 + 지표 추가) */}
      <div className="stats-grid">
        {activeCardIds.map(cardId => {
          const cardDef = ALL_DASHBOARD_CARDS.find(c => c.id === cardId);
          if (!cardDef) return null;
          const active = isCardActive(cardDef.id);
          const val = getCardValue(cardDef.id);

          return (
            <div 
              key={cardDef.id}
              className={`stat-card stat-card-interactive ${active ? 'active-custom' : ''}`}
              style={active ? {
                borderColor: cardDef.color,
                background: cardDef.bg,
                boxShadow: `0 0 0 1.5px ${cardDef.color}`
              } : {}}
              onClick={() => handleCardClick(cardDef.id)}
              title={`클릭 시 ${cardDef.label} 개체 필터링 (다시 누르면 해제)`}
              role="button"
              tabIndex={0}
            >
              <div 
                className="stat-icon-wrapper" 
                style={{ background: cardDef.bg, color: cardDef.color }}
              >
                {cardDef.icon}
              </div>
              <div className="stat-info">
                <span className="stat-label">{cardDef.label}</span>
                <span className="stat-value" style={{ color: cardDef.color }}>
                  {val}
                </span>
              </div>
            </div>
          );
        })}

        {/* 대시보드 지표 추가 점선 버튼 */}
        <div 
          className="stat-card stat-card-add"
          onClick={() => setIsCustomizeOpen(true)}
          title="대시보드 지표 추가 및 설정"
          role="button"
          tabIndex={0}
        >
          <Plus size={18} strokeWidth={2.5} />
          <span>지표 추가</span>
        </div>
      </div>

      {/* 2. 검색 및 필터 바 */}
      <div className="filter-bar">
        {/* 1행: 검색창 + 신규 등록 버튼 (가로 100% 점유) */}
        <div className="search-action-wrapper">
          <div className="search-input-group">
            <Search size={18} className="search-input-icon" />
            <input
              type="text"
              className="search-input"
              placeholder={isHistoryMode ? "출하/폐사 개체번호(이표), 이름, 초성 검색..." : "개체번호(이표), 이름, 축사, 초성(예: ㅂㅅㅇ) 검색..."}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <button 
            className="btn btn-primary"
            onClick={() => onOpenEntityModal()}
            style={{ whiteSpace: 'nowrap', flexShrink: 0 }}
            title="신규 개체 등록"
          >
            <Plus size={16} />
            <span>신규 등록</span>
          </button>
        </div>

        {/* 2행: 3대 필터 드롭다운 (항시 정확한 3분할 33.3% 유지) */}
        <div className="filter-dropdowns-row">
          {/* 1. 상태 필터: 사육 두수 / 개별 상태 / 출하 완료 / 폐사 / 사육 이력 전체 */}
          <select 
            className="filter-select"
            value={selectedStatus}
            onChange={(e) => handleStatusChange(e.target.value)}
          >
            <option value="active">사육 두수 ({stats.total}두)</option>
            {ENTITY_STATUSES.filter(st => !isHistoricalStatus(st.id)).map(st => (
              <option key={st.id} value={st.id}>{st.icon} {st.label}</option>
            ))}
            <option value="history">📜 사육 이력 전체 ({stats.historyCount}두)</option>
            <option value="shipped">🏷️ 출하 완료 ({stats.shippedCount}두)</option>
            <option value="deceased">🪦 폐사 / 도태 ({stats.deceasedCount}두)</option>
            <option value="all">모든 개체 (총 {entities.length}두)</option>
          </select>

          {/* 2. 한우 사육 단계 필터: 사육 구분 (1단계 상태에 해당하는 품종만 동적 노출 & 변경 시 축사 자동 리셋) */}
          <select 
            className="filter-select"
            value={selectedBreed}
            onChange={(e) => handleBreedChange(e.target.value)}
          >
            <option value="all">사육 구분</option>
            {availableBreeds.map(breed => (
              <option key={breed.id} value={breed.id}>{breed.label}</option>
            ))}
          </select>

          {/* 3. 축사 위치 필터 (1·2단계 조건에 해당하는 축사만 동적 노출) */}
          <select 
            className="filter-select"
            value={selectedBarn}
            onChange={(e) => setSelectedBarn(e.target.value)}
            disabled={isHistoryMode || availableBarns.length === 0}
            title={isHistoryMode ? "사육 종료된 개체는 축사 위치 필터가 적용되지 않습니다" : "축사 위치 필터"}
          >
            <option value="all">
              {isHistoryMode ? "축사 위치 (사육 종료)" : "축사 위치"}
            </option>
            {availableBarns.map(b => (
              <option key={b} value={b}>{b}</option>
            ))}
          </select>
        </div>
      </div>

      {/* 4. 대시보드 지표 설정 모달 */}
      {isCustomizeOpen && (
        <div className="modal-overlay" onClick={() => setIsCustomizeOpen(false)}>
          <div 
            className="modal-content" 
            style={{ maxWidth: '480px' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <div className="modal-header-title">
                <Settings size={20} color="var(--color-primary)" />
                <span>대시보드 지표 설정</span>
              </div>
              <button 
                type="button" 
                className="modal-close-btn" 
                onClick={() => setIsCustomizeOpen(false)}
              >
                <X size={20} />
              </button>
            </div>

            <div className="modal-body" style={{ maxHeight: '60vh', overflowY: 'auto' }}>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
                상단 대시보드에 표시할 지표를 선택하고, <strong>[▲] [▼] 버튼</strong>으로 노출 순서를 자유롭게 변경하세요.
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {modalDisplayItems.map(item => {
                  const isChecked = activeCardIds.includes(item.id);
                  const activeIdx = activeCardIds.indexOf(item.id);
                  const count = getCardValue(item.id);

                  return (
                    <div 
                      key={item.id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '0.65rem 0.85rem',
                        borderRadius: 'var(--radius-md)',
                        background: isChecked ? 'var(--color-primary-light)' : 'var(--bg-card-subtle)',
                        border: `1px solid ${isChecked ? 'var(--color-primary)' : 'var(--border-color)'}`,
                        transition: 'all 0.15s ease'
                      }}
                    >
                      {/* 좌측: 체크박스 + 라벨 + 설명 */}
                      <label 
                        style={{ 
                          display: 'flex', 
                          alignItems: 'center', 
                          gap: '0.75rem', 
                          cursor: item.isFixed ? 'default' : 'pointer',
                          flex: 1,
                          minWidth: 0
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          disabled={item.isFixed}
                          onChange={() => handleToggleCard(item.id)}
                          style={{ width: '18px', height: '18px', accentColor: 'var(--color-primary)', cursor: item.isFixed ? 'default' : 'pointer' }}
                        />
                        <div style={{ minWidth: 0, overflow: 'hidden' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontWeight: 700, fontSize: '0.92rem' }}>
                            <span>{item.icon}</span>
                            <span>{item.label}</span>
                            {item.isFixed && (
                              <span style={{ fontSize: '0.72rem', color: 'var(--color-primary)', background: 'rgba(16, 185, 129, 0.15)', padding: '1px 5px', borderRadius: '4px' }}>
                                필수
                              </span>
                            )}
                          </div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {item.desc}
                          </div>
                        </div>
                      </label>

                      {/* 우측: 순서 이동 버튼 그룹 + 두수 카운트 */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexShrink: 0 }}>
                        {isChecked && !item.isFixed && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '2px' }}>
                            <button
                              type="button"
                              disabled={activeIdx <= 1}
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                moveCardUp(item.id);
                              }}
                              style={{
                                padding: '3px 5px',
                                borderRadius: '4px',
                                border: '1px solid var(--border-color)',
                                background: 'var(--bg-card)',
                                color: activeIdx <= 1 ? 'var(--text-subtle)' : 'var(--text-main)',
                                opacity: activeIdx <= 1 ? 0.3 : 1,
                                cursor: activeIdx <= 1 ? 'not-allowed' : 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                              }}
                              title="앞(위)으로 순서 이동"
                            >
                              <ChevronUp size={15} />
                            </button>
                            <button
                              type="button"
                              disabled={activeIdx >= activeCardIds.length - 1}
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                moveCardDown(item.id);
                              }}
                              style={{
                                padding: '3px 5px',
                                borderRadius: '4px',
                                border: '1px solid var(--border-color)',
                                background: 'var(--bg-card)',
                                color: activeIdx >= activeCardIds.length - 1 ? 'var(--text-subtle)' : 'var(--text-main)',
                                opacity: activeIdx >= activeCardIds.length - 1 ? 0.3 : 1,
                                cursor: activeIdx >= activeCardIds.length - 1 ? 'not-allowed' : 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                              }}
                              title="뒤(아래)로 순서 이동"
                            >
                              <ChevronDown size={15} />
                            </button>
                          </div>
                        )}

                        <span style={{ fontWeight: 800, fontSize: '0.95rem', color: item.color, minWidth: '32px', textAlign: 'right' }}>
                          {count}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="modal-footer" style={{ display: 'flex', justifyContent: 'space-between' }}>
              <button 
                type="button" 
                className="btn btn-outline" 
                onClick={handleResetCards}
              >
                <RotateCcw size={15} />
                <span>기본값 복원</span>
              </button>

              <button 
                type="button" 
                className="btn btn-primary" 
                onClick={() => setIsCustomizeOpen(false)}
              >
                완료
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 3. 목록 통계 카운터 & 정렬 컨트롤 서브헤더 바 */}
      <div className="list-subheader-bar">
        <div className="list-count-info">
          {sortedEntities.length !== (selectedStatus === 'all' ? entities.length : isHistoryMode ? stats.historyCount : stats.total) ? (
            <span>
              총 <strong>{selectedStatus === 'all' ? entities.length : isHistoryMode ? stats.historyCount : stats.total}</strong>두 중 <strong>{sortedEntities.length}</strong>두
            </span>
          ) : (
            <span>
              총 <strong>{selectedStatus === 'all' ? entities.length : isHistoryMode ? stats.historyCount : stats.total}</strong>두
            </span>
          )}
        </div>

        <div className="sort-control-group">
          <ArrowUpDown size={14} className="sort-icon" />
          <select 
            className="sort-select"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            aria-label="개체 정렬 순서 선택"
          >
            <option value="latest">최신 등록순</option>
            <option value="tag_asc">개체번호순 (오름차순)</option>
            <option value="age_asc">월령 어린순 (송아지 먼저)</option>
            <option value="age_desc">월령 많은순 (성우 먼저)</option>
            <option value="barn_asc">축사 위치순 (1축사부터)</option>
          </select>
        </div>
      </div>

      {/* 4. 개체 카드 그리드 (고객등록카드 차용) */}
      {sortedEntities.length === 0 ? (
        <div className="card" style={{ padding: '3.5rem 1.5rem', textAlign: 'center' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🔍</div>
          <h3 style={{ marginBottom: '0.5rem' }}>일치하는 개체가 없습니다</h3>
          <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
            검색어 또는 필터 조건을 변경하세요.
          </p>
          {(selectedStatus !== 'active' || selectedBreed !== 'all' || selectedBarn !== 'all' || searchQuery) && (
            <div style={{ display: 'flex', justifyContent: 'center' }}>
              <button 
                type="button"
                className="btn btn-secondary"
                onClick={() => {
                  setSelectedStatus('active');
                  setSelectedBreed('all');
                  setSelectedBarn('all');
                  setSearchQuery('');
                }}
                style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}
              >
                <RotateCcw size={15} />
                <span>필터 조건 초기화</span>
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className="entity-cards-grid">
          {sortedEntities.map(entity => {
            const age = calculateAge(entity.birthDate);
            const statusObj = ENTITY_STATUSES.find(s => s.id === entity.status) || ENTITY_STATUSES[0];
            const genderObj = GENDER_OPTIONS.find(g => g.id === entity.gender) || GENDER_OPTIONS[0];
            const latestLog = getLatestCareLog(entity.id, entity.tagNumber);
            const isShipped = entity.status === 'shipped';
            const isDeceased = entity.status === 'deceased';
            const isHistory = isHistoricalStatus(entity.status);

            return (
              <div 
                key={entity.id} 
                className="entity-card"
                style={isHistory ? { opacity: 0.92, borderColor: 'rgba(100, 116, 139, 0.3)' } : {}}
              >
                {/* 상단: 개체번호(클릭 시 상세 이동) & 상태 */}
                <div className="entity-card-top">
                  <div className="entity-tag-wrapper">
                    <span 
                      className="entity-ear-tag"
                      onClick={() => onOpenEntityDetail(entity.tagNumber)}
                      title="클릭 시 이 개체의 관리 내역으로 이동"
                    >
                      {entity.tagNumber}
                    </span>
                  </div>
                  <span className={`badge ${statusObj.colorClass}`}>
                    {statusObj.icon} {statusObj.label}
                  </span>
                </div>

                {/* 개체명, 사육단계, 축사 위치 1열 통합 배치 (동일한 폰트 크기 & 컬러 구분) */}
                <div className="entity-card-identity-row">
                  <h3 
                    className="entity-name"
                    style={{ margin: 0, cursor: 'pointer' }}
                    onClick={() => onOpenEntityDetail(entity.tagNumber)}
                  >
                    {entity.name}
                  </h3>
                  <span className="entity-card-breed">
                    {formatDisplayBreed(entity.breed)}
                  </span>
                  <span className="entity-card-dot">•</span>
                  <span className="entity-card-barn">
                    {entity.barn || '축사 미지정'}
                  </span>
                </div>

                {/* 상세 사양 정보 그리드 */}
                <div className="entity-specs-grid">
                  <div className="spec-item">
                    <span className="spec-item-label">월령(생년월일)</span>
                    <span className="spec-item-value">{age.text}</span>
                  </div>
                  <div className="spec-item">
                    <span className="spec-item-label">{isShipped ? '출하 체중' : isDeceased ? '최종 체중' : '현재 체중'}</span>
                    <span className="spec-item-value">{entity.weight ? `${entity.weight} kg` : '미측정'}</span>
                  </div>
                  <div className="spec-item">
                    <span className="spec-item-label">모체 번호</span>
                    <span className="spec-item-value">
                      {entity.motherTag ? (
                        <span 
                          style={{ color: 'var(--color-primary)', cursor: 'pointer', textDecoration: 'underline' }}
                          onClick={() => onOpenEntityDetail(entity.motherTag)}
                        >
                          {entity.motherTag}
                        </span>
                      ) : '-'}
                    </span>
                  </div>
                  <div className="spec-item">
                    <span className="spec-item-label">부체(씨수소)</span>
                    <span className="spec-item-value">{entity.fatherTag || '-'}</span>
                  </div>
                </div>

                {/* 최근 관리 이력 미니 프리뷰 */}
                <div style={{ 
                  fontSize: '0.82rem', 
                  marginBottom: '0.75rem',
                  background: 'var(--bg-hover)',
                  padding: '0.5rem 0.75rem',
                  borderRadius: 'var(--radius-sm)',
                  width: '100%',
                  minWidth: 0,
                  boxSizing: 'border-box',
                  overflow: 'hidden'
                }}>
                  {latestLog ? (
                    <div style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: '0.45rem', 
                      width: '100%',
                      minWidth: 0,
                      overflow: 'hidden'
                    }}>
                      <span style={{ 
                        fontWeight: 600, 
                        color: 'var(--text-main)', 
                        opacity: 0.7, 
                        flexShrink: 0 
                      }}>
                        {latestLog.date}
                      </span>
                      <div 
                        className="recent-log-title"
                        style={{ 
                          fontWeight: 600, 
                          color: 'var(--text-main)', 
                          overflow: 'hidden', 
                          textOverflow: 'ellipsis', 
                          whiteSpace: 'nowrap',
                          flex: 1,
                          minWidth: 0
                        }}
                        title={latestLog.title}
                      >
                        {latestLog.title}
                      </div>
                    </div>
                  ) : (
                    <span style={{ fontStyle: 'italic', opacity: 0.7, color: 'var(--text-muted)' }}>등록된 관리 기록이 없습니다.</span>
                  )}
                </div>

                {/* 액션 버튼 그룹 */}
                {/* 액션 버튼 그룹: 상세 이력(좌) & 관리 추가(우) 배치 */}
                <div className="entity-card-actions">
                  <button 
                    className="btn btn-outline btn-sm"
                    onClick={() => onOpenEntityDetail(entity.tagNumber)}
                    title="관리 이력 및 상세 프로필 조회"
                    style={{ 
                      flex: 1, 
                      height: '36px', 
                      fontWeight: 600, 
                      gap: '0.4rem',
                      border: '1px solid var(--text-muted)',
                      color: 'var(--text-main)',
                      background: 'var(--bg-card)'
                    }}
                  >
                    <History size={15} />
                    <span>상세 이력</span>
                  </button>

                  <button 
                    className={`btn ${isHistory ? 'btn-secondary' : 'btn-primary'} btn-sm`}
                    onClick={() => onOpenCareLogModal(entity)}
                    title={isShipped ? "출하 완료된 개체 (과거 이력 추가)" : isDeceased ? "폐사/도태된 개체 (과거 이력 추가)" : "이 개체에 관리 기록 추가"}
                    style={{ flex: 1, height: '36px', fontWeight: 700, gap: '0.4rem' }}
                  >
                    <ClipboardList size={15} />
                    <span>{isHistory ? '이력 추가' : '관리 추가'}</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
