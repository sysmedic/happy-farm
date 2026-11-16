import React, { useState, useMemo } from 'react';
import { 
  X, 
  Plus, 
  Printer, 
  Edit3, 
  Calendar, 
  MapPin, 
  Weight, 
  Sparkles,
  ClipboardList,
  CheckCircle,
  Clock,
  Trash2,
  Share2
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
  onDeleteCareLog
}) {
  const [selectedCategory, setSelectedCategory] = useState('all');

  if (!entity) return null;

  const age = calculateAge(entity.birthDate);
  const statusObj = ENTITY_STATUSES.find(s => s.id === entity.status) || ENTITY_STATUSES[0];
  const genderObj = GENDER_OPTIONS.find(g => g.id === entity.gender) || GENDER_OPTIONS[0];

  // 이 개체에 속한 관리 기록 필터링 & 정렬
  const filteredLogs = useMemo(() => {
    let logs = careLogs.filter(l => l.entityId === entity.id || l.tagNumber === entity.tagNumber);
    if (selectedCategory !== 'all') {
      logs = logs.filter(l => l.category === selectedCategory);
    }
    return logs.sort((a, b) => new Date(b.date + ' ' + (b.time || '00:00')) - new Date(a.date + ' ' + (a.time || '00:00')));
  }, [careLogs, entity, selectedCategory]);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content modal-content-lg" onClick={(e) => e.stopPropagation()}>
        {/* 모달 상단 헤더 */}
        <div className="modal-header">
          <div className="modal-header-title">
            <span style={{ fontSize: '1.4rem' }}>🐂</span>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <span className="entity-ear-tag">#{entity.tagNumber}</span>
                <span style={{ fontSize: '1.25rem', fontWeight: 800 }}>{entity.name}</span>
                <span className={`badge ${statusObj.colorClass}`}>
                  {statusObj.icon} {statusObj.label}
                </span>
              </div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 500, marginTop: '2px' }}>
                한우 • {entity.breed} • {genderObj.symbol} {genderObj.label} • {age.text}
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <button 
              className="btn btn-outline btn-sm"
              onClick={() => onOpenPrintSheet(entity)}
              title="이 개체의 전체 관리 이력 A4 인쇄"
            >
              <Printer size={15} />
              <span>출력</span>
            </button>
            <button 
              className="btn btn-outline btn-sm"
              onClick={() => onOpenEntityModal(entity)}
              title="개체 기본 정보 수정"
            >
              <Edit3 size={15} />
              <span>수정</span>
            </button>
            <button className="modal-close-btn" onClick={onClose} title="닫기">
              <X size={20} />
            </button>
          </div>
        </div>

        {/* 모달 본문 */}
        <div className="modal-body">
          {/* 1. 개체 기본 스펙 카드 */}
          <div className="card" style={{ marginBottom: '1.5rem', background: 'var(--bg-card-subtle)' }}>
            <div className="card-body" style={{ padding: '1.1rem 1.3rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '0.85rem' }}>
                <div>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>📍 축사 및 구역</span>
                  <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>{entity.barn || '미지정'}</div>
                </div>
                <div>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>⚖️ 현재 체중</span>
                  <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>{entity.weight ? `${entity.weight} kg` : '미측정'}</div>
                </div>
                <div>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>🧬 모체 번호</span>
                  <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>{entity.motherTag || '정보 없음'}</div>
                </div>
                <div>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>🧬 부체(KPN)</span>
                  <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>{entity.fatherTag || '정보 없음'}</div>
                </div>
              </div>

              {entity.memo && (
                <div style={{ 
                  marginTop: '0.85rem', 
                  paddingTop: '0.75rem', 
                  borderTop: '1px solid var(--border-color)',
                  fontSize: '0.85rem',
                  color: 'var(--text-main)',
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '0.4rem'
                }}>
                  <span style={{ fontWeight: 600, color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>특이사항 메모:</span>
                  <span>{entity.memo}</span>
                </div>
              )}
            </div>
          </div>

          {/* 2. 관리 이력 섹션 헤더 및 카테고리 필터 */}
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'space-between', 
            marginBottom: '1rem',
            flexWrap: 'wrap',
            gap: '0.75rem'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 800 }}>
                📋 생애 관리 내역 ({filteredLogs.length}건)
              </h3>
            </div>

            <button 
              className="btn btn-primary btn-sm"
              onClick={() => onOpenCareLogModal(entity)}
            >
              <Plus size={15} />
              <span>새 관리 기록 추가</span>
            </button>
          </div>

          {/* 카테고리 필터 탭 */}
          <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', marginBottom: '1.25rem' }}>
            <button
              className={`btn btn-sm ${selectedCategory === 'all' ? 'btn-primary' : 'btn-outline'}`}
              onClick={() => setSelectedCategory('all')}
            >
              전체 내역
            </button>
            {CARE_CATEGORIES.map(cat => (
              <button
                key={cat.id}
                className={`btn btn-sm ${selectedCategory === cat.id ? 'btn-primary' : 'btn-outline'}`}
                onClick={() => setSelectedCategory(cat.id)}
              >
                {cat.icon} {cat.label}
              </button>
            ))}
          </div>

          {/* 3. 타임라인 리스트 */}
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
                상단의 [+ 새 관리 기록 추가] 버튼을 눌러 첫 관리 기록을 등록해보세요.
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
                );
              })}
            </div>
          )}
        </div>

        {/* 모달 푸터 */}
        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose}>
            닫기
          </button>
          <button className="btn btn-primary" onClick={() => onOpenCareLogModal(entity)}>
            <Plus size={16} />
            <span>이 개체에 관리 기록 추가</span>
          </button>
        </div>
      </div>
    </div>
  );
}
