import React, { useState, useMemo } from 'react';
import { 
  Search, 
  Plus, 
  Printer, 
  ClipboardList, 
  History, 
  Edit3, 
  Trash2,
  Calendar,
  Sparkles,
  Activity,
  Stethoscope,
  Heart,
  CheckCircle,
  RotateCcw
} from 'lucide-react';
import { 
  ENTITY_STATUSES, 
  GENDER_OPTIONS, 
  HANWOO_BREEDS,
  calculateAge, 
  getKoreanChoseong 
} from '../../lib/types.js';

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

  // 축사 고유 목록 추출 (현재 사육 중인 개체의 축사 기준 정제)
  const uniqueBarns = useMemo(() => {
    const set = new Set();
    entities.forEach(e => {
      if (e.status !== 'shipped' && e.barn) {
        const trimmed = e.barn.trim();
        if (trimmed && !trimmed.includes('출하') && !trimmed.includes('퇴농')) {
          set.add(trimmed);
        }
      }
    });
    return Array.from(set).sort();
  }, [entities]);

  // 상태 변경 핸들러: '출하 완료' 선택 시 축사 필터를 자동으로 'all'로 리셋하여 0건 노출 함정 방지
  const handleStatusChange = (newStatus) => {
    setSelectedStatus(newStatus);
    if (newStatus === 'shipped') {
      setSelectedBarn('all');
    }
  };

  // 통계 계산: 출하 완료 개체는 사육 두수에서 제외하여 실제 축사 사육 두수만 집계
  const stats = useMemo(() => {
    const activeEntities = entities.filter(e => e.status !== 'shipped');
    const total = activeEntities.length;
    const pregnant = activeEntities.filter(e => e.status === 'pregnant').length;
    const treatment = activeEntities.filter(e => e.status === 'treatment').length;
    const inHeat = activeEntities.filter(e => e.status === 'in_heat').length;
    const shippedCount = entities.filter(e => e.status === 'shipped').length;
    return { total, pregnant, treatment, inHeat, shippedCount, logsCount: careLogs.length };
  }, [entities, careLogs]);

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
      
      // 상태 필터: 'active'(사육 중 전체), 'all'(출하 포함 전체), 또는 개별 상태('shipped', 'pregnant' 등)
      if (selectedStatus === 'active') {
        if (entity.status === 'shipped') return false;
      } else if (selectedStatus !== 'all') {
        if (entity.status !== selectedStatus) return false;
      }

      // 축사 필터
      if (selectedBarn !== 'all' && entity.barn !== selectedBarn) {
        return false;
      }

      // 검색어 필터 (이표번호, 이름, 축사, 메모, 초성)
      if (q) {
        const tag = (entity.tagNumber || '').toLowerCase();
        const name = (entity.name || '').toLowerCase();
        const barn = (entity.barn || '').toLowerCase();
        const memo = (entity.memo || '').toLowerCase();
        const nameChoseong = getKoreanChoseong(entity.name || '');

        const match = 
          tag.includes(q) || 
          name.includes(q) || 
          barn.includes(q) || 
          memo.includes(q) ||
          nameChoseong.includes(choseongQ);

        if (!match) return false;
      }

      return true;
    });
  }, [entities, searchQuery, selectedBreed, selectedStatus, selectedBarn]);

  // 특정 개체의 최근 관리 이력 가져오기
  const getLatestCareLog = (entityId, tagNumber) => {
    const logs = careLogs.filter(l => l.entityId === entityId || l.tagNumber === tagNumber);
    if (!logs || logs.length === 0) return null;
    return logs.sort((a, b) => new Date(b.date) - new Date(a.date))[0];
  };

  // 대시보드 카드 클릭 시 원클릭 필터링 (토글 지원)
  const handleStatusCardClick = (statusKey) => {
    if (statusKey === 'active' || statusKey === 'all') {
      setSelectedStatus('active');
    } else {
      setSelectedStatus(prev => prev === statusKey ? 'active' : statusKey);
    }
  };

  return (
    <div>
      {/* 1. 상단 통계 현황판 (클릭 시 원클릭 리스트업) */}
      <div className="stats-grid">
        <div 
          className={`stat-card stat-card-interactive ${selectedStatus === 'active' ? 'active-all' : ''}`}
          onClick={() => handleStatusCardClick('active')}
          title="클릭 시 현재 사육 중인 한우 목록만 보기"
          role="button"
          tabIndex={0}
        >
          <div className="stat-icon-wrapper" style={{ background: 'rgba(16, 185, 129, 0.15)', color: '#10b981' }}>
            🐂
          </div>
          <div className="stat-info">
            <span className="stat-label">사육 두수</span>
            <span className="stat-value">{stats.total}<small style={{ fontSize: '0.9rem', fontWeight: 500 }}> 두</small></span>
          </div>
        </div>

        <div 
          className={`stat-card stat-card-interactive ${selectedStatus === 'pregnant' ? 'active-pregnant' : ''}`}
          onClick={() => handleStatusCardClick('pregnant')}
          title="클릭 시 임신/수태 개체만 즉시 필터링 (다시 누르면 사육 전체보기)"
          role="button"
          tabIndex={0}
        >
          <div className="stat-icon-wrapper" style={{ background: 'rgba(139, 92, 246, 0.15)', color: '#8b5cf6' }}>
            <Heart size={24} />
          </div>
          <div className="stat-info">
            <span className="stat-label">임신 / 수태 개체</span>
            <span className="stat-value" style={{ color: '#8b5cf6' }}>{stats.pregnant}<small style={{ fontSize: '0.9rem', fontWeight: 500 }}> 두</small></span>
          </div>
        </div>

        <div 
          className={`stat-card stat-card-interactive ${selectedStatus === 'treatment' ? 'active-treatment' : ''}`}
          onClick={() => handleStatusCardClick('treatment')}
          title="클릭 시 치료/집중 관찰 개체만 즉시 필터링 (다시 누르면 사육 전체보기)"
          role="button"
          tabIndex={0}
        >
          <div className="stat-icon-wrapper" style={{ background: 'rgba(239, 68, 68, 0.15)', color: '#ef4444' }}>
            <Stethoscope size={24} />
          </div>
          <div className="stat-info">
            <span className="stat-label">치료 / 집중 관찰</span>
            <span className="stat-value" style={{ color: '#ef4444' }}>{stats.treatment}<small style={{ fontSize: '0.9rem', fontWeight: 500 }}> 두</small></span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon-wrapper" style={{ background: 'rgba(14, 165, 233, 0.15)', color: '#0ea5e9' }}>
            <Activity size={24} />
          </div>
          <div className="stat-info">
            <span className="stat-label">누적 관리 기록</span>
            <span className="stat-value" style={{ color: '#0ea5e9' }}>{stats.logsCount}<small style={{ fontSize: '0.9rem', fontWeight: 500 }}> 건</small></span>
          </div>
        </div>
      </div>

      {/* 2. 검색 및 필터 바 */}
      <div className="filter-bar">
        {/* 검색창 + 신규 등록 버튼 (고정 결합 그룹) */}
        <div className="search-action-wrapper">
          <div className="search-input-group">
            <Search size={18} className="search-input-icon" />
            <input
              type="text"
              className="search-input"
              placeholder="개체번호(이표), 이름, 축사, 초성(예: ㅂㅅㅇ) 검색..."
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

        {/* 우측 3대 필터 드롭다운 그룹 */}
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
          {/* 1. 상태 필터: 사육 두수 / 개별 상태 / 출하 완료 / 모든 이력 */}
          <select 
            className="filter-select"
            value={selectedStatus}
            onChange={(e) => handleStatusChange(e.target.value)}
          >
            <option value="active">사육 두수 ({stats.total}두)</option>
            {ENTITY_STATUSES.filter(st => st.id !== 'shipped').map(st => (
              <option key={st.id} value={st.id}>{st.icon} {st.label}</option>
            ))}
            <option value="shipped">🏷️ 출하 완료 ({stats.shippedCount}두)</option>
            <option value="all">모든 이력 (총 {entities.length}두)</option>
          </select>

          {/* 2. 한우 사육 단계 필터: 사육 구분 */}
          <select 
            className="filter-select"
            value={selectedBreed}
            onChange={(e) => setSelectedBreed(e.target.value)}
          >
            <option value="all">사육 구분</option>
            {HANWOO_BREEDS.map(breed => (
              <option key={breed.id} value={breed.id}>🐂 {breed.label}</option>
            ))}
          </select>

          {/* 3. 축사 위치 필터 (출하 완료 상태 시 딤드 처리) */}
          {uniqueBarns.length > 0 && (
            <select 
              className="filter-select"
              value={selectedBarn}
              onChange={(e) => setSelectedBarn(e.target.value)}
              disabled={selectedStatus === 'shipped'}
              title={selectedStatus === 'shipped' ? "출하 완료된 개체는 축사 위치 필터가 적용되지 않습니다" : "축사 위치 필터"}
            >
              <option value="all">
                {selectedStatus === 'shipped' ? "축사 위치 (해당 없음)" : "축사 위치"}
              </option>
              {uniqueBarns.map(b => (
                <option key={b} value={b}>📍 {b}</option>
              ))}
            </select>
          )}
        </div>
      </div>

      {/* 3. 개체 카드 그리드 (고객등록카드 차용) */}
      {filteredEntities.length === 0 ? (
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
          {filteredEntities.map(entity => {
            const age = calculateAge(entity.birthDate);
            const statusObj = ENTITY_STATUSES.find(s => s.id === entity.status) || ENTITY_STATUSES[0];
            const genderObj = GENDER_OPTIONS.find(g => g.id === entity.gender) || GENDER_OPTIONS[0];
            const latestLog = getLatestCareLog(entity.id, entity.tagNumber);
            const isShipped = entity.status === 'shipped';

            return (
              <div 
                key={entity.id} 
                className="entity-card"
                style={isShipped ? { opacity: 0.92, borderColor: 'rgba(100, 116, 139, 0.3)' } : {}}
              >
                {/* 상단: 개체번호(클릭 시 상세 이동) & 상태 */}
                <div className="entity-card-top">
                  <div className="entity-tag-wrapper">
                    <span 
                      className="entity-ear-tag"
                      onClick={() => onOpenEntityDetail(entity.tagNumber)}
                      title="클릭 시 이 개체의 관리 내역으로 이동"
                    >
                      #{entity.tagNumber}
                    </span>
                  </div>
                  <span className={`badge ${statusObj.colorClass}`}>
                    {statusObj.icon} {statusObj.label}
                  </span>
                </div>

                {/* 개체명 & 뱃지 */}
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem', marginBottom: '0.4rem' }}>
                  <h3 
                    className="entity-name"
                    style={{ cursor: 'pointer' }}
                    onClick={() => onOpenEntityDetail(entity.tagNumber)}
                  >
                    🐂 {entity.name}
                  </h3>
                  <span style={{ fontSize: '0.85rem', color: genderObj.color, fontWeight: 700 }}>
                    {genderObj.symbol} {genderObj.label}
                  </span>
                </div>

                {/* 사육 구분 및 축사 위치 */}
                <div className="entity-meta-row">
                  <span className="badge" style={{ background: 'rgba(16, 185, 129, 0.1)', color: 'var(--color-primary)', fontWeight: 600 }}>
                    {entity.breed || '한우'}
                  </span>
                  <span className="badge" style={{ background: 'var(--bg-card-subtle)', color: 'var(--text-muted)' }}>
                    📍 {entity.barn || '축사 미지정'}
                  </span>
                </div>

                {/* 상세 사양 정보 그리드 */}
                <div className="entity-specs-grid">
                  <div className="spec-item">
                    <span className="spec-item-label">월령(생년월일)</span>
                    <span className="spec-item-value">{age.text}</span>
                  </div>
                  <div className="spec-item">
                    <span className="spec-item-label">{isShipped ? '출하 체중' : '현재 체중'}</span>
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
                  fontSize: '0.8rem', 
                  color: 'var(--text-muted)', 
                  marginBottom: '0.75rem',
                  background: 'var(--bg-hover)',
                  padding: '0.5rem 0.75rem',
                  borderRadius: 'var(--radius-sm)'
                }}>
                  {latestLog ? (
                    <div>
                      <span style={{ fontWeight: 600, color: 'var(--color-primary)' }}>최근 관리 ({latestLog.date}): </span>
                      <span>{latestLog.title}</span>
                    </div>
                  ) : (
                    <span style={{ fontStyle: 'italic', opacity: 0.7 }}>등록된 관리 기록이 없습니다.</span>
                  )}
                </div>

                {/* 액션 버튼 그룹 */}
                <div className="entity-card-actions">
                  {isShipped ? (
                    <button 
                      className="btn btn-secondary btn-sm"
                      disabled
                      title="출하 완료된 개체입니다 (기록 추가 불가)"
                      style={{ flex: 1, opacity: 0.65, cursor: 'not-allowed' }}
                    >
                      <CheckCircle size={14} />
                      <span>출하 완료</span>
                    </button>
                  ) : (
                    <button 
                      className="btn btn-secondary btn-sm"
                      onClick={() => onOpenCareLogModal(entity)}
                      title="이 개체에 관리 기록 추가"
                      style={{ flex: 1 }}
                    >
                      <ClipboardList size={14} />
                      <span>관리 추가</span>
                    </button>
                  )}

                  <button 
                    className="btn btn-outline btn-sm"
                    onClick={() => onOpenEntityDetail(entity.tagNumber)}
                    title="관리 이력 상세 조회"
                  >
                    <History size={14} />
                    <span>이력</span>
                  </button>

                  <button 
                    className="btn btn-outline btn-sm btn-icon-only"
                    onClick={() => onOpenPrintSheet(entity)}
                    title="개체 관리 카드 A4 인쇄"
                  >
                    <Printer size={14} />
                  </button>

                  <button 
                    className="btn btn-outline btn-sm btn-icon-only"
                    onClick={() => onOpenEntityModal(entity)}
                    title="개체 정보 수정"
                  >
                    <Edit3 size={14} />
                  </button>

                  <button 
                    className="btn btn-outline btn-sm btn-icon-only"
                    onClick={() => onDeleteEntity(entity.id, entity.name)}
                    title="개체 삭제"
                  >
                    <Trash2 size={14} color="#ef4444" />
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
