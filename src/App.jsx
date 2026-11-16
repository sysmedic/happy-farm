import React, { useState, useEffect } from 'react';
import TopBar from './components/layout/TopBar.jsx';
import MobileNavBar from './components/layout/MobileNavBar.jsx';
import EntityList from './components/entities/EntityList.jsx';
import EntityDetailModal from './components/entities/EntityDetailModal.jsx';
import EntityFormModal from './components/entities/EntityFormModal.jsx';
import EntityPrintSheet from './components/entities/EntityPrintSheet.jsx';
import CareLogFormModal from './components/care/CareLogFormModal.jsx';
import DailyDiaryView from './components/diary/DailyDiaryView.jsx';
import DailyReportView from './components/diary/DailyReportView.jsx';
import GoogleDriveView from './components/backup/GoogleDriveView.jsx';
import { 
  loadEntities, 
  saveEntities, 
  loadCareLogs, 
  saveCareLogs, 
  resetToSampleData 
} from './lib/storage.js';
import { getTodayDateString } from './lib/types.js';

export default function App() {
  const [entities, setEntities] = useState(() => loadEntities());
  const [careLogs, setCareLogs] = useState(() => loadCareLogs());

  // 현재 활성화된 탭 ('entities' | 'diary' | 'report' | 'cloud')
  const [activeTab, setActiveTab] = useState('entities');

  // 테마 ('light' | 'dark')
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('happy_farm_theme') || 'light';
  });

  // 모달 및 뷰 제어 상태
  const [selectedEntityForDetail, setSelectedEntityForDetail] = useState(null);
  const [isEntityModalOpen, setIsEntityModalOpen] = useState(false);
  const [entityToEdit, setEntityToEdit] = useState(null);

  const [isCareLogModalOpen, setIsCareLogModalOpen] = useState(false);
  const [careLogPreselectedEntity, setCareLogPreselectedEntity] = useState(null);

  const [printSheetEntity, setPrintSheetEntity] = useState(null);
  const [targetReportDate, setTargetReportDate] = useState(getTodayDateString());

  // 토스트 피드백
  const [toastMessage, setToastMessage] = useState(null);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('happy_farm_theme', theme);
  }, [theme]);

  const showToast = (text) => {
    setToastMessage(text);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleToggleTheme = () => {
    setTheme(prev => {
      const next = prev === 'dark' ? 'light' : 'dark';
      showToast(next === 'dark' ? '다크(나이트) 모드로 전환되었습니다 🌙' : '라이트 모드로 전환되었습니다 ☀️');
      return next;
    });
  };

  // ⚡ 요구사항 3: 보고서나 일정 다이어리에서 개체번호를 클릭하면 해당 개체 관리 내역으로 이동!
  const handleOpenEntityDetail = (tagNumberOrId) => {
    if (!tagNumberOrId) return;
    const found = entities.find(
      e => e.tagNumber.toLowerCase() === tagNumberOrId.toLowerCase() || e.id === tagNumberOrId
    );
    if (found) {
      setSelectedEntityForDetail(found);
      // 만약 인쇄 시트가 열려있었다면 닫고 상세 모달 오픈
      setPrintSheetEntity(null);
    } else {
      showToast(`개체번호 [${tagNumberOrId}]에 해당하는 등록 정보를 찾을 수 없습니다.`);
    }
  };

  // 개체 신규 등록 또는 수정 저장
  const handleSaveEntity = (savedEntity) => {
    let updated;
    const exists = entities.some(e => e.id === savedEntity.id);
    if (exists) {
      updated = entities.map(e => e.id === savedEntity.id ? savedEntity : e);
      showToast(`개체 [${savedEntity.name}]의 정보가 수정되었습니다.`);
    } else {
      updated = [savedEntity, ...entities];
      showToast(`신규 개체 [${savedEntity.name}]가 성공적으로 등록되었습니다.`);
    }

    setEntities(updated);
    saveEntities(updated);
    setIsEntityModalOpen(false);
    setEntityToEdit(null);

    // 상세 모달이 열려있다면 최신 정보 반영
    if (selectedEntityForDetail && selectedEntityForDetail.id === savedEntity.id) {
      setSelectedEntityForDetail(savedEntity);
    }
  };

  // 개체 삭제
  const handleDeleteEntity = (id, name) => {
    if (!window.confirm(`정말 개체 [${name}]을(를) 삭제하시겠습니까? 관련된 관리 기록은 보존됩니다.`)) {
      return;
    }
    const updated = entities.filter(e => e.id !== id);
    setEntities(updated);
    saveEntities(updated);
    showToast(`개체 [${name}]이(가) 삭제되었습니다.`);
    if (selectedEntityForDetail && selectedEntityForDetail.id === id) {
      setSelectedEntityForDetail(null);
    }
  };

  // 관리 내역 추가 저장
  const handleSaveCareLog = (newLog, updates) => {
    const updatedLogs = [newLog, ...careLogs];
    setCareLogs(updatedLogs);
    saveCareLogs(updatedLogs);

    // 개체의 체중이나 상태 변경이 있는 경우 개체 마스터도 업데이트
    if (updates && (updates.weight || updates.status)) {
      const updatedEntities = entities.map(ent => {
        if (ent.id === updates.entityId) {
          return {
            ...ent,
            ...(updates.weight ? { weight: updates.weight } : {}),
            ...(updates.status ? { status: updates.status } : {}),
            updatedAt: new Date().toISOString(),
          };
        }
        return ent;
      });
      setEntities(updatedEntities);
      saveEntities(updatedEntities);
    }

    setIsCareLogModalOpen(false);
    setCareLogPreselectedEntity(null);
    showToast(`개체 [${newLog.entityName}]의 관리 내역이 등록되었습니다.`);
  };

  // 관리 내역 삭제
  const handleDeleteCareLog = (logId) => {
    if (!window.confirm('이 관리 기록을 삭제하시겠습니까?')) return;
    const updated = careLogs.filter(l => l.id !== logId);
    setCareLogs(updated);
    saveCareLogs(updated);
    showToast('관리 기록이 삭제되었습니다.');
  };

  // 초기 샘플 데이터로 복구
  const handleResetSample = () => {
    if (!window.confirm('초기 데모 샘플 데이터로 복구하시겠습니까? 현재 작업 내용이 대체됩니다.')) {
      return;
    }
    const res = resetToSampleData();
    setEntities(res.entities);
    setCareLogs(res.careLogs);
    setSelectedEntityForDetail(null);
    setPrintSheetEntity(null);
    showToast('초기 행복 농장 샘플 데이터가 복구되었습니다.');
  };

  // 데이터베이스 복원 시 상태 동기화
  const handleDatabaseRestored = () => {
    setEntities(loadEntities());
    setCareLogs(loadCareLogs());
    setSelectedEntityForDetail(null);
  };

  return (
    <div className="app-container">
      {/* 상단 네비게이션 헤더 */}
      <TopBar
        activeTab={activeTab}
        onSelectTab={(tab) => {
          setActiveTab(tab);
          setPrintSheetEntity(null);
        }}
        theme={theme}
        onToggleTheme={handleToggleTheme}
      />

      {/* 토스트 알림 */}
      {toastMessage && (
        <div 
          className="toast-notification"
          style={{
            position: 'fixed',
            bottom: '24px',
            right: '24px',
          zIndex: 9999,
          background: 'var(--text-main)',
          color: 'var(--bg-page)',
          padding: '0.85rem 1.4rem',
          borderRadius: 'var(--radius-lg)',
          boxShadow: 'var(--shadow-xl)',
          fontWeight: 700,
          fontSize: '0.9rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.6rem',
          animation: 'slideUp 0.2s ease-out'
        }}>
          <span>🌱</span>
          <span>{toastMessage}</span>
        </div>
      )}

      {/* 메인 콘텐츠 영역 */}
      <main className="main-content">
        {printSheetEntity ? (
          <EntityPrintSheet
            entity={printSheetEntity}
            careLogs={careLogs}
            onClose={() => setPrintSheetEntity(null)}
          />
        ) : (
          <>
            {activeTab === 'entities' && (
              <EntityList
                entities={entities}
                careLogs={careLogs}
                onOpenEntityDetail={handleOpenEntityDetail}
                onOpenEntityModal={(entity = null) => {
                  setEntityToEdit(entity);
                  setIsEntityModalOpen(true);
                }}
                onOpenCareLogModal={(entity) => {
                  setCareLogPreselectedEntity(entity);
                  setIsCareLogModalOpen(true);
                }}
                onOpenPrintSheet={(entity) => setPrintSheetEntity(entity)}
                onDeleteEntity={handleDeleteEntity}
              />
            )}

            {activeTab === 'diary' && (
              <DailyDiaryView
                entities={entities}
                careLogs={careLogs}
                onOpenEntityDetail={handleOpenEntityDetail}
                onOpenCareLogModal={(entity = null, date = null) => {
                  setCareLogPreselectedEntity(entity);
                  setIsCareLogModalOpen(true);
                }}
                onNavigateToReport={(date) => {
                  setTargetReportDate(date);
                  setActiveTab('report');
                }}
              />
            )}

            {activeTab === 'report' && (
              <DailyReportView
                targetDate={targetReportDate}
                entities={entities}
                careLogs={careLogs}
                onOpenEntityDetail={handleOpenEntityDetail}
                onOpenCareLogModal={(entity = null) => {
                  setCareLogPreselectedEntity(entity);
                  setIsCareLogModalOpen(true);
                }}
                onNavigateToCloud={() => setActiveTab('cloud')}
              />
            )}

            {activeTab === 'cloud' && (
              <GoogleDriveView
                entities={entities}
                careLogs={careLogs}
                onDatabaseRestored={handleDatabaseRestored}
              />
            )}
          </>
        )}
      </main>

      {/* 모바일 환경 전용 터치 네비게이션 바 */}
      <MobileNavBar
        activeTab={activeTab}
        onSelectTab={(tab) => {
          setActiveTab(tab);
          setPrintSheetEntity(null);
        }}
        onOpenCareLogModal={(preselected = null) => {
          setCareLogPreselectedEntity(preselected);
          setIsCareLogModalOpen(true);
        }}
      />

      {/* 개체 상세 관리 내역 모달 (타임라인 & 처치 기록) */}
      {selectedEntityForDetail && (
        <EntityDetailModal
          entity={selectedEntityForDetail}
          careLogs={careLogs}
          onClose={() => setSelectedEntityForDetail(null)}
          onOpenCareLogModal={(entity) => {
            setCareLogPreselectedEntity(entity);
            setIsCareLogModalOpen(true);
          }}
          onOpenEntityModal={(entity) => {
            setEntityToEdit(entity);
            setIsEntityModalOpen(true);
          }}
          onOpenPrintSheet={(entity) => {
            setSelectedEntityForDetail(null);
            setPrintSheetEntity(entity);
          }}
          onDeleteCareLog={handleDeleteCareLog}
        />
      )}

      {/* 개체 등록 및 수정 폼 모달 */}
      {isEntityModalOpen && (
        <EntityFormModal
          entityToEdit={entityToEdit}
          existingEntities={entities}
          onClose={() => {
            setIsEntityModalOpen(false);
            setEntityToEdit(null);
          }}
          onSave={handleSaveEntity}
        />
      )}

      {/* 개체별 관리 내역 추가 폼 모달 */}
      {isCareLogModalOpen && (
        <CareLogFormModal
          preselectedEntity={careLogPreselectedEntity}
          entities={entities}
          onClose={() => {
            setIsCareLogModalOpen(false);
            setCareLogPreselectedEntity(null);
          }}
          onSave={handleSaveCareLog}
        />
      )}
    </div>
  );
}
