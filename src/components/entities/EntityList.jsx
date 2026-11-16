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
  Heart
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
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [selectedBarn, setSelectedBarn] = useState('all');

  // 축사 고유 목록 추출
  const uniqueBarns = useMemo(() => {
    const set = new Set();
    entities.forEach(e => {
      if (e.barn) set.add(e.barn.trim());
    });
    return Array.from(set);
  }, [entities]);

  // 통계 계산
  const stats = useMemo(() => {
    const total = entities.length;
    const pregnant = entities.filter(e => e.status === 'pregnant').length;
    const treatment = entities.filter(e => e.status === 'treatment').length;
    const inHeat = entities.filter(e => e.status === 'in_heat').length;
    return { total, pregnant, treatment, inHeat, logsCount: careLogs.length };
  }, [entities, careLogs]);

  // 필터링 & 초성 검색
  const filteredEntities = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    const choseongQ = getKoreanChoseong(q);

    return entities.filter(entity => {
      // 한우 사육 구분 필터 (번식우, 비육우, 송아지 등)
      if (selectedBreed !== 'all' && !(entity.breed || '').includes(selectedBreed)) {
        return false;
      }
      // 상태 필터
      if (selectedStatus !== 'all' && entity.status !== selectedStatus) {
        return false;
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
    if (statusKey === 'all') {
      setSelectedStatus('all');
    } else {
      setSelectedStatus(prev => prev === statusKey ? 'all' : statusKey);
    }
  };

  return (
    <div>
      {/* 1. 상단 통계 현황판 (클릭 시 원클릭 리스트업) */}
      <div className="stats-grid">
        <div 
          className={`stat-card stat-card-interactive ${selectedStatus === 'all' ? 'active-all' : ''}`}
          onClick={() => handleStatusCardClick('all')}
          title="클릭 시 전체 한우 목록 보기"
          role="button"
          tabIndex={0}
        >
          <div className="stat-icon-wrapper" style={{ background: 'rgba(16, 185, 129, 0.15)', color: '#10b981' }}>
            🐂
          </div>
          <div className="stat-info">
            <span className="stat-label">전체 사육 두수</span>
            <span className="stat-value">{stats.total}<small style={{ fontSize: '0.9rem', fontWeight: 500 }}> 두</small></span>
          </div>
        </div>

        <div 
          className={`stat-card stat-card-interactive ${selectedStatus === 'pregnant' ? 'active-pregnant' : ''}`}
          onClick={() => handleStatusCardClick('pregnant')}
          title="클릭 시 임신/수태 개체만 즉시 필터링 (다시 누르면 전체보기)"
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
          title="클릭 시 치료/집중 관찰 개체만 즉시 필터링 (다시 누르면 전체보기)"
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

        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          {/* 한우 사육 단계 필터 */}
          <select 
            className="filter-select"
            value={selectedBreed}
            onChange={(e) => setSelectedBreed(e.target.value)}
          >
            <option value="all">전체 사육 구분</option>
            {HANWOO_BREEDS.map(breed => (
              <option key={breed.id} value={breed.shortLabel}>🐂 {breed.label}</option>
            ))}
          </select>

          {/* 상태 필터 */}
          <select 
            className="filter-select"
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
          >
            <option value="all">전체 상태</option>
            {ENTITY_STATUSES.map(st => (
              <option key={st.id} value={st.id}>{st.icon} {st.label}</option>
            ))}
          </select>

          {/* 축사 필터 */}
          {uniqueBarns.length > 0 && (
            <select 
              className="filter-select"
              value={selectedBarn}
              onChange={(e) => setSelectedBarn(e.target.value)}
            >
              <option value="all">전체 축사 위치</option>
              {uniqueBarns.map(b => (
                <option key={b} value={b}>📍 {b}</option>
              ))}
            </select>
          )}

          <button 
            className="btn btn-primary"
            onClick={() => onOpenEntityModal()}
          >
            <Plus size={16} />
            <span>신규 개체 등록</span>
          </button>
        </div>
      </div>

      {/* 2-1. 원클릭 상태 필터 활성 알림 배너 */}
      {selectedStatus !== 'all' && (
        <div className="active-filter-banner">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <span style={{ fontSize: '1.1rem' }}>
              {selectedStatus === 'pregnant' ? '💜' : '❤️'}
            </span>
            <span>
              <strong>{selectedStatus === 'pregnant' ? '임신 / 수태 개체' : '치료 / 집중 관찰 개체'}</strong>
              <span style={{ marginLeft: '0.5rem', color: 'var(--text-muted)', fontSize: '0.825rem', fontWeight: 500 }}>
                ({filteredEntities.length}두 리스트업 완료)
              </span>
            </span>
          </div>
          <button 
            type="button" 
            className="btn-filter-reset" 
            onClick={() => setSelectedStatus('all')}
            title="필터 해제하고 전체 개체 목록 보기"
          >
            전체 개체 보기 ✕
          </button>
        </div>
      )}

      {/* 3. 개체 카드 그리드 (고객등록카드 차용) */}
      {filteredEntities.length === 0 ? (
        <div className="card" style={{ padding: '3.5rem 1.5rem', textAlign: 'center' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🔍</div>
          <h3 style={{ marginBottom: '0.5rem' }}>일치하는 개체가 없습니다</h3>
          <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
            검색어 또는 필터 조건을 변경하거나 새로운 개체를 등록해보세요.
          </p>
          <button className="btn btn-primary" onClick={() => onOpenEntityModal()}>
            <Plus size={16} />
            <span>새 개체 등록하기</span>
          </button>
        </div>
      ) : (
        <div className="entity-cards-grid">
          {filteredEntities.map(entity => {
            const age = calculateAge(entity.birthDate);
            const statusObj = ENTITY_STATUSES.find(s => s.id === entity.status) || ENTITY_STATUSES[0];
            const genderObj = GENDER_OPTIONS.find(g => g.id === entity.gender) || GENDER_OPTIONS[0];
            const latestLog = getLatestCareLog(entity.id, entity.tagNumber);

            return (
              <div key={entity.id} className="entity-card">
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
                    <span className="spec-item-label">현재 체중</span>
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
                  <button 
                    className="btn btn-secondary btn-sm"
                    onClick={() => onOpenCareLogModal(entity)}
                    title="이 개체에 관리 기록 추가"
                    style={{ flex: 1 }}
                  >
                    <ClipboardList size={14} />
                    <span>관리 추가</span>
                  </button>

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
