import React, { useState, useMemo } from 'react';
import { 
  X, 
  Plus, 
  Printer, 
  Edit3, 
  ClipboardList,
  Clock,
  Trash2,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { 
  ENTITY_STATUSES, 
  GENDER_OPTIONS, 
  CARE_CATEGORIES, 
  calculateAge 
} from '../../lib/types.js';

export default function EntityDetailModal({
  entity,
  careLogs,
  onClose,
  onOpenCareLogModal,
  onOpenEntityModal,
  onOpenPrintSheet,
  onDeleteCareLog,
  onEditCareLog
}) {
  const [viewMode, setViewMode] = useState('summary'); // 'summary' | 'fullHistory'
  const [selectedCategory, setSelectedCategory] = useState('all');

  // 이 개체에 속한 전체 관리 기록 (최신순 정렬)
  const allEntityLogs = useMemo(() => {
    if (!entity) return [];
    return careLogs
      .filter(l => l.entityId === entity.id || l.tagNumber === entity.tagNumber)
      .sort((a, b) => new Date(b.date + ' ' + (b.time || '00:00')) - new Date(a.date + ' ' + (a.time || '00:00')));
  }, [careLogs, entity]);

  // 최근 10개 처리 내역 (기본 요약 뷰용)
  const recent10Logs = useMemo(() => {
    return allEntityLogs.slice(0, 10);
  }, [allEntityLogs]);

  // 카테고리 필터링된 전체 내역 (전면 생애관리내역 뷰용)
  const filteredLogs = useMemo(() => {
    if (selectedCategory === 'all') return allEntityLogs;
    return allEntityLogs.filter(l => l.category === selectedCategory);
  }, [allEntityLogs, selectedCategory]);

  if (!entity) return null;

  const age = calculateAge(entity.birthDate);
  const statusObj = ENTITY_STATUSES.find(s => s.id === entity.status) || ENTITY_STATUSES[0];
  const genderObj = GENDER_OPTIONS.find(g => g.id === entity.gender) || GENDER_OPTIONS[0];

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content modal-content-lg" onClick={(e) => e.stopPropagation()}>
        {/* 모달 상단 헤더: viewMode에 따른 분기 */}
        {viewMode === 'fullHistory' ? (
          <div className="modal-header entity-detail-header fullhistory-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
              <button 
                className="btn btn-outline btn-sm" 
                onClick={() => setViewMode('summary')}
                style={{ padding: '0.35rem 0.65rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}
                title="기본 정보로 돌아가기"
              >
                <ChevronLeft size={16} />
                <span>기본정보</span>
              </button>
              <h2 style={{ fontSize: '1.05rem', fontWeight: 800, margin: 0, display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                <span>생애 관리 내역</span>
                <span className="badge" style={{ background: 'var(--color-primary-light)', color: 'var(--color-primary)', fontWeight: 700 }}>
                  {allEntityLogs.length}건
                </span>
              </h2>
            </div>
            <button className="modal-close-btn" onClick={onClose} title="닫기">
              <X size={20} />
            </button>
          </div>
        ) : (
          <div className="modal-header entity-detail-header">
            <div className="detail-header-top-row">
              <div className="entity-detail-header-info">
                {/* 1줄: 이표번호 */}
                <div className="detail-header-tag">
                  <span style={{ fontSize: '1.15rem', marginRight: '0.35rem' }}>🐂</span>
                  <span className="entity-ear-tag">#{entity.tagNumber}</span>
                </div>

                {/* 2줄: 애칭 & 상태 한 행 나란히 배치 */}
                <div className="detail-header-name-row">
                  <h2 className="detail-header-name">{entity.name}</h2>
                  <span className={`badge ${statusObj.colorClass}`}>
                    {statusObj.icon} {statusObj.label}
                  </span>
                </div>
              </div>

              {/* 우측 상단 액션 버튼 그룹 (수정, 출력, 닫기 - 간섭 방지 안전거리 확보) */}
              <div className="entity-detail-header-actions">
                <button 
                  className="btn btn-outline btn-sm detail-print-btn"
                  onClick={() => onOpenPrintSheet(entity)}
                  title="이 개체의 전체 관리 이력 A4 인쇄"
                >
                  <Printer size={14} />
                  <span>출력</span>
                </button>
                <button 
                  className="btn btn-outline btn-sm detail-edit-btn"
                  onClick={() => onOpenEntityModal(entity)}
                  title="개체 기본 정보 수정"
                >
                  <Edit3 size={14} />
                  <span>수정</span>
                </button>
                <button className="modal-close-btn" onClick={onClose} title="닫기">
                  <X size={20} />
                </button>
              </div>
            </div>

            {/* 3줄: 설명 (하단 100% 전폭 독립 배치 & 폰트 크기 확대) */}
            <div className="detail-header-desc">
              {entity.breed?.startsWith('한우') ? entity.breed : `한우 • ${entity.breed}`} • {genderObj.symbol} {genderObj.label} • {age.text}
            </div>
          </div>
        )}

        {/* 모달 본문 */}
        <div className="modal-body">
          {viewMode === 'summary' ? (
            /* [기본 뷰]: 4대 스펙 박스 + 특이사항 + 생애내역 전체보기 버튼 + 최근 10건 요약 리스트 */
            <>
              {/* 1. 4대 중요 정보 2x2 균등 카드 그리드 */}
              <div className="modal-specs-grid">
                <div className="modal-spec-card">
                  <span className="modal-spec-label">축사 및 구역</span>
                  <span className="modal-spec-value" title={entity.barn || '미지정'}>
                    {entity.barn || '미지정'}
                  </span>
                </div>

                <div className="modal-spec-card">
                  <span className="modal-spec-label">{entity.status === 'shipped' ? '출하 체중' : '현재 체중'}</span>
                  <span className="modal-spec-value">
                    {entity.weight ? (
                      <>
                        {entity.weight} <small style={{ fontSize: '0.82rem', fontWeight: 600 }}>kg</small>
                      </>
                    ) : (
                      '미측정'
                    )}
                  </span>
                </div>

                <div className="modal-spec-card">
                  <span className="modal-spec-label">모체 번호</span>
                  <span className="modal-spec-value" title={entity.motherTag || '정보 없음'}>
                    {entity.motherTag || '정보 없음'}
                  </span>
                </div>

                <div className="modal-spec-card">
                  <span className="modal-spec-label">부체 (KPN)</span>
                  <span className="modal-spec-value" title={entity.fatherTag || '정보 없음'}>
                    {entity.fatherTag || '정보 없음'}
                  </span>
                </div>
              </div>

              {/* 특이사항 메모 (있는 경우 표시) */}
              {entity.memo && (
                <div className="modal-spec-memo-card">
                  {entity.memo}
                </div>
              )}

              {/* 2. 생애 관리 내역 전체보기 액션 버튼 카드 */}
              <div className="detail-history-action-box">
                <button 
                  type="button"
                  className="detail-view-all-history-btn"
                  onClick={() => setViewMode('fullHistory')}
                  title="클릭 시 전체 생애 관리 내역과 분류 필터를 상세 조회합니다"
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.55rem' }}>
                    <ClipboardList size={18} style={{ color: 'var(--color-primary)' }} />
                    <span style={{ fontWeight: 800, fontSize: '0.95rem' }}>생애 관리 내역 전체보기</span>
                    <span className="badge" style={{ background: 'var(--color-primary-light)', color: 'var(--color-primary)', fontWeight: 800, fontSize: '0.78rem' }}>
                      총 {allEntityLogs.length}건
                    </span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', color: 'var(--text-muted)' }}>
                    <span style={{ fontSize: '0.8rem', marginRight: '0.25rem', fontWeight: 600 }}>전체보기</span>
                    <ChevronRight size={18} />
                  </div>
                </button>
              </div>

              {/* 3. 최근 처리 내역 (최대 10개) 요약 리스트 */}
              <div className="recent-logs-section">
                <div className="recent-logs-header">
                  <span className="recent-logs-title">최근 처리 내역</span>
                  <span className="recent-logs-count">최근 {recent10Logs.length}건 / 전체 {allEntityLogs.length}건</span>
                </div>

                {recent10Logs.length === 0 ? (
                  <div className="recent-logs-empty">
                    등록된 관리 기록이 없습니다.
                  </div>
                ) : (
                  <div className="recent-logs-list">
                    {recent10Logs.map((log) => {
                      const catObj = CARE_CATEGORIES.find(c => c.id === log.category) || CARE_CATEGORIES[0];
                      return (
                        <div 
                          key={log.id} 
                          className="recent-log-item"
                          onClick={() => setViewMode('fullHistory')}
                          title="클릭 시 생애 관리 내역 전체보기로 이동"
                        >
                          <div className="recent-log-date">{log.date}</div>
                          <div className="recent-log-cat-badge">{catObj.icon}</div>
                          <div className="recent-log-title" title={log.title}>{log.title}</div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </>
          ) : (
            /* [생애 관리 내역 전면 뷰]: 카테고리 필터 + 타임라인 전체 */
            <>
              {/* 카테고리 필터 탭 */}
              <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', marginBottom: '1.25rem' }}>
                <button
                  className={`btn btn-sm ${selectedCategory === 'all' ? 'btn-primary' : 'btn-outline'}`}
                  onClick={() => setSelectedCategory('all')}
                >
                  전체 내역 ({allEntityLogs.length})
                </button>
                {CARE_CATEGORIES.map(cat => {
                  const count = allEntityLogs.filter(l => l.category === cat.id).length;
                  if (count === 0 && selectedCategory !== cat.id) return null;
                  return (
                    <button
                      key={cat.id}
                      className={`btn btn-sm ${selectedCategory === cat.id ? 'btn-primary' : 'btn-outline'}`}
                      onClick={() => setSelectedCategory(cat.id)}
                    >
                      {cat.icon} {cat.label} ({count})
                    </button>
                  );
                })}
              </div>

              {/* 타임라인 리스트 */}
              {filteredLogs.length === 0 ? (
                <div style={{ 
                  textAlign: 'center', 
                  padding: '3rem 1rem', 
                  color: 'var(--text-muted)',
                  background: 'var(--bg-card-subtle)',
                  borderRadius: 'var(--radius-lg)'
                }}>
                  <ClipboardList size={40} style={{ opacity: 0.3, marginBottom: '0.75rem' }} />
                  <div style={{ fontWeight: 600 }}>해당 분류의 관리 기록이 없습니다.</div>
                  <p style={{ fontSize: '0.85rem', marginTop: '0.25rem' }}>
                    하단의 [관리 기록 추가] 버튼을 눌러 새 관리 기록을 등록해보세요.
                  </p>
                </div>
              ) : (
                <div className="timeline">
                  {filteredLogs.map(log => {
                    const catObj = CARE_CATEGORIES.find(c => c.id === log.category) || CARE_CATEGORIES[0];

                    return (
                      <div key={log.id} className="timeline-item">
                        {/* 타임라인 원형 뱃지 */}
                        <div className="timeline-dot">
                          <span style={{ fontSize: '0.75rem' }}>{catObj.icon}</span>
                        </div>

                        <div className="timeline-header">
                          <div className="timeline-title">
                            <span>{log.title}</span>
                            <span className={`badge ${catObj.badgeClass}`}>
                              {catObj.label}
                            </span>
                          </div>
                          <div style={{ fontSize: '0.825rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                            📅 {log.date} {log.time && `• ${log.time}`}
                          </div>
                        </div>

                        {/* 상세 내용 */}
                        <div className="timeline-details">
                          {log.details}
                        </div>

                        {/* 차기 예정일 (D-day) */}
                        {log.nextScheduleDate && (
                          <div style={{ 
                            marginTop: '0.65rem',
                            padding: '0.45rem 0.75rem',
                            background: 'rgba(245, 158, 11, 0.1)',
                            border: '1px solid rgba(245, 158, 11, 0.25)',
                            borderRadius: 'var(--radius-sm)',
                            fontSize: '0.8rem',
                            color: 'var(--color-accent)',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.4rem',
                            fontWeight: 600
                          }}>
                            <Clock size={14} />
                            <span>차기 예정일: {log.nextScheduleDate} ({log.nextScheduleTitle || '예정 작업'})</span>
                          </div>
                        )}

                        {/* 하단 담당자 및 삭제 액션 */}
                        <div className="timeline-footer">
                          <div>
                            {log.operator && <span>기록자/담당: {log.operator}</span>}
                            {log.cost ? <span style={{ marginLeft: '0.75rem' }}>비용: {Number(log.cost).toLocaleString()}원</span> : null}
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                            <button 
                              className="btn btn-outline btn-sm btn-icon-only"
                              onClick={() => onEditCareLog && onEditCareLog(log)}
                              title="기록 수정"
                              style={{ border: 'none', padding: '0.2rem' }}
                            >
                              <Edit3 size={13} color="var(--color-primary)" />
                            </button>
                            <button 
                              className="btn btn-outline btn-sm btn-icon-only"
                              onClick={() => onDeleteCareLog(log.id)}
                              title="기록 삭제"
                              style={{ border: 'none', padding: '0.2rem' }}
                            >
                              <Trash2 size={13} color="var(--color-danger)" />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          )}
        </div>

        {/* 모달 푸터 */}
        <div className="modal-footer">
          {viewMode === 'fullHistory' ? (
            <button className="btn btn-secondary" onClick={() => setViewMode('summary')}>
              <ChevronLeft size={16} />
              <span>기본 정보로 돌아가기</span>
            </button>
          ) : (
            <button className="btn btn-secondary" onClick={onClose}>
              닫기
            </button>
          )}
          {entity.status === 'shipped' ? (
            <button className="btn btn-outline" onClick={() => onOpenCareLogModal(entity)}>
              <Plus size={16} />
              <span>과거 관리 기록 추가</span>
            </button>
          ) : (
            <button className="btn btn-primary" onClick={() => onOpenCareLogModal(entity)}>
              <Plus size={16} />
              <span>이 개체에 관리 기록 추가</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
