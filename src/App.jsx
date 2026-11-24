import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Plus } from 'lucide-react';
import TopBar from './components/layout/TopBar.jsx';
import EntityList from './components/entities/EntityList.jsx';
import EntityDetailModal from './components/entities/EntityDetailModal.jsx';
import EntityFormModal from './components/entities/EntityFormModal.jsx';
import EntityPrintSheet from './components/entities/EntityPrintSheet.jsx';
import CareLogFormModal from './components/care/CareLogFormModal.jsx';
import DailyDiaryView from './components/diary/DailyDiaryView.jsx';
import DailyReportView from './components/diary/DailyReportView.jsx';
import FarmCommonHistoryView from './components/diary/FarmCommonHistoryView.jsx';
import GoogleDriveView from './components/backup/GoogleDriveView.jsx';
import ScheduleFormModal from './components/diary/ScheduleFormModal.jsx';
import FarmSettingsModal from './components/settings/FarmSettingsModal.jsx';
import FarmCommonHistoryModal from './components/care/FarmCommonHistoryModal.jsx';
import { 
  loadEntities, 
  saveEntities, 
  loadCareLogs, 
  saveCareLogs, 
  loadSchedules,
  saveSchedules,
  resetToSampleData,
  loadFarmSettings,
  saveFarmSettings
} from './lib/storage.js';
import { 
  getTodayDateString, 
  ENTITY_STATUSES,
  DEFAULT_CARE_CATEGORIES,
  loadCustomCareCategories,
  saveCustomCareCategories
} from './lib/types.js';

export default function App() {
  const [entities, setEntities] = useState(() => loadEntities());
  const [careLogs, setCareLogs] = useState(() => loadCareLogs());
  const [schedules, setSchedules] = useState(() => loadSchedules());
  const [customCategories, setCustomCategories] = useState(() => loadCustomCareCategories());

  // 기본 + 사용자 직접 추가 관리 분류 통합
  const allCareCategories = useMemo(() => {
    return [...DEFAULT_CARE_CATEGORIES, ...customCategories];
  }, [customCategories]);

  // 농장 환경 설정 (농장명, 대표자명, 시작화면 등)
  const [farmSettings, setFarmSettings] = useState(() => loadFarmSettings());

  // 현재 활성화된 탭 ('entities' | 'diary' | 'report' | 'cloud')
  // 시작 화면 설정(farmSettings.startTab)에 따라 초기 탭 자동 결정
  const [activeTab, setActiveTab] = useState(() => {
    const settings = loadFarmSettings();
    return settings.startTab === 'diary' ? 'diary' : 'entities';
  });

  // 테마 ('light' | 'dark')
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('happy_farm_theme') || 'light';
  });

  // 환경 설정 모달 상태
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  // 농장 관리 내역 모달 상태
  const [isFarmCommonModalOpen, setIsFarmCommonModalOpen] = useState(false);

  // 모달 및 뷰 제어 상태
  const [selectedEntityForDetail, setSelectedEntityForDetail] = useState(null);
  const [entityDetailInitialView, setEntityDetailInitialView] = useState('summary');
  const [isEntityModalOpen, setIsEntityModalOpen] = useState(false);
  const [entityToEdit, setEntityToEdit] = useState(null);

  const [isCareLogModalOpen, setIsCareLogModalOpen] = useState(false);
  const [careLogPreselectedEntity, setCareLogPreselectedEntity] = useState(null);
  const [careLogToEdit, setCareLogToEdit] = useState(null);
  const [careLogInitialValues, setCareLogInitialValues] = useState(null);

  // 영농 일정 모달 상태
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const [scheduleTargetDate, setScheduleTargetDate] = useState(getTodayDateString());
  const [scheduleToEdit, setScheduleToEdit] = useState(null);
  const [scheduleInitialData, setScheduleInitialData] = useState(null);

  const [printSheetEntity, setPrintSheetEntity] = useState(null);
  const [returnToDetailEntity, setReturnToDetailEntity] = useState(null);
  const [targetReportDate, setTargetReportDate] = useState(getTodayDateString());
  const [targetDiaryDate, setTargetDiaryDate] = useState(null);
  const [initialDiaryTab, setInitialDiaryTab] = useState('schedules');

  // 토스트 피드백 (2초 자동 소멸 및 타이머 안정화)
  const [toastMessage, setToastMessage] = useState(null);
  const toastTimerRef = useRef(null);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('happy_farm_theme', theme);
  }, [theme]);

  // 모달이 열려 있을 때 뒷배경(body/html) 스크롤 잠금 및 닫힐 때 마지막 스크롤 위치 100% 복원
  const isAnyModalOpen = Boolean(
    selectedEntityForDetail || 
    isEntityModalOpen || 
    isCareLogModalOpen || 
    isScheduleModalOpen ||
    isSettingsModalOpen ||
    isFarmCommonModalOpen
  );
  const savedScrollYRef = useRef(0);

  useEffect(() => {
    if (isAnyModalOpen) {
      // 1. 모달이 열리기 직전의 스크롤 위치 저장
      const currentScrollY = window.scrollY || document.documentElement.scrollTop || 0;
      savedScrollYRef.current = currentScrollY;

      const originalBodyOverflow = document.body.style.overflow;
      const originalHtmlOverflow = document.documentElement.style.overflow;
      document.body.style.overflow = 'hidden';
      document.documentElement.style.overflow = 'hidden';

      return () => {
        document.body.style.overflow = originalBodyOverflow;
        document.documentElement.style.overflow = originalHtmlOverflow;

        // 2. 모달 닫힘/저장 후 원래 보고 있던 스크롤 위치로 즉시 복원
        requestAnimationFrame(() => {
          window.scrollTo({ top: currentScrollY, behavior: 'instant' });
          setTimeout(() => {
            window.scrollTo({ top: currentScrollY, behavior: 'instant' });
          }, 30);
        });
      };
    }
  }, [isAnyModalOpen]);

  const showToast = (text) => {
    if (toastTimerRef.current) {
      clearTimeout(toastTimerRef.current);
    }
    setToastMessage(text);
    toastTimerRef.current = setTimeout(() => {
      setToastMessage(null);
      toastTimerRef.current = null;
    }, 2000);
  };

  // 농장 환경 설정 저장 처리
  const handleSaveFarmSettings = (newSettings) => {
    setFarmSettings(newSettings);
    saveFarmSettings(newSettings);
  };

  const handleToggleTheme = () => {
    setTheme(prev => {
      const next = prev === 'dark' ? 'light' : 'dark';
      showToast(next === 'dark' ? '다크(나이트) 모드로 전환되었습니다 🌙' : '라이트 모드로 전환되었습니다 ☀️');
      return next;
    });
  };

  // ⚡ 요구사항 3: 보고서나 일정 다이어리에서 개체번호를 클릭하면 해당 개체 관리 내역으로 이동!
  const handleOpenEntityDetail = (tagNumberOrId, initialView = 'summary') => {
    if (!tagNumberOrId) return;
    const found = entities.find(
      e => e.tagNumber.toLowerCase() === tagNumberOrId.toLowerCase() || e.id === tagNumberOrId
    );
    if (found) {
      setSelectedEntityForDetail(found);
      setEntityDetailInitialView(initialView);
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

  // 개체 삭제 (2중 경고 적용)
  const handleDeleteEntity = (id, name) => {
    // 1차 경고: 대상 개체 확인
    if (!window.confirm(`정말 개체 [${name}]을(를) 삭제하시겠습니까?`)) {
      return;
    }
    // 2차 재확인: 영구 삭제 경고
    if (!window.confirm(`⚠️ [최종 확인]\n개체 [${name}] 정보가 완전히 삭제됩니다.\n정말 삭제를 진행하시겠습니까?`)) {
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

  // 개체 상태 원클릭 변경 저장
  const handleUpdateEntityStatus = (entityId, newStatus) => {
    const target = entities.find(e => e.id === entityId);
    if (!target) return;
    const statusObj = ENTITY_STATUSES.find(s => s.id === newStatus);
    const updatedEntity = { ...target, status: newStatus };
    const updatedList = entities.map(e => e.id === entityId ? updatedEntity : e);
    setEntities(updatedList);
    saveEntities(updatedList);
    showToast(`개체 [${target.name || target.tagNumber}] 상태가 [${statusObj ? statusObj.label : newStatus}](으)로 변경되었습니다.`);
    if (selectedEntityForDetail && selectedEntityForDetail.id === entityId) {
      setSelectedEntityForDetail(updatedEntity);
    }
  };

  // 개체 특이사항/사양관리 메모 직접 수정 저장
  const handleUpdateEntityMemo = (entityId, newMemo) => {
    const target = entities.find(e => e.id === entityId);
    if (!target) return;
    const updatedEntity = { ...target, memo: newMemo, updatedAt: new Date().toISOString() };
    const updatedList = entities.map(e => e.id === entityId ? updatedEntity : e);
    setEntities(updatedList);
    saveEntities(updatedList);
    showToast(`개체 [${target.name || target.tagNumber}]의 특이사항 메모가 저장되었습니다.`);
    if (selectedEntityForDetail && selectedEntityForDetail.id === entityId) {
      setSelectedEntityForDetail(updatedEntity);
    }
  };

  // 관리 내역 추가 또는 수정 저장
  const handleSaveCareLog = (savedLog, updates) => {
    const exists = careLogs.some(l => l.id === savedLog.id);
    let updatedLogs;
    if (exists) {
      updatedLogs = careLogs.map(l => l.id === savedLog.id ? savedLog : l);
      showToast(`개체 [${savedLog.entityName}]의 관리 내역이 수정되었습니다.`);
    } else {
      updatedLogs = [savedLog, ...careLogs];
      showToast(`개체 [${savedLog.entityName}]의 관리 내역이 등록되었습니다.`);
    }

    // 1. 등록된 일정에서 [+ 기록]을 작성한 경우:
    // ⚠️ 비동기 상태 갱신 타이밍 문제를 방지하기 위해 현재 schedules 상태에서 대상 일정을 즉시 조회
    const targetSched = savedLog.linkedScheduleId 
      ? (schedules || []).find(s => s.id === savedLog.linkedScheduleId) 
      : null;
    
    // 연결된 원본 알람 ID 추출 (명시적 originReminderLogId 우선, 없으면 지능형 매칭 추적)
    let linkedOriginReminderLogId = targetSched?.originReminderLogId || null;
    if (!linkedOriginReminderLogId && targetSched) {
      const matchReminder = (careLogs || []).find(l => 
        (l.entityId === targetSched.entityId || l.tagNumber === targetSched.tagNumber) &&
        !l.nextScheduleCompleted &&
        (l.nextScheduleDate === targetSched.date || l.nextSchedulePromotedScheduleId === targetSched.id)
      );
      if (matchReminder) {
        linkedOriginReminderLogId = matchReminder.id;
      }
    }

    if (savedLog.linkedScheduleId) {
      setSchedules(prev => {
        const next = prev.map(s => {
          if (s.id === savedLog.linkedScheduleId) {
            return {
              ...s,
              completed: true,
              completedAt: new Date().toISOString(),
              date: savedLog.date, // 실제 기록 처리일(오늘)로 이동
              updatedAt: new Date().toISOString()
            };
          }
          return s;
        });
        saveSchedules(next);
        return next;
      });
    }

    // 2. 알람(차기 예정 작업)에서 [+ 기록]을 작성했거나, 일정의 원본 알람이 있는 경우:
    // 원본 알람 로그를 찾아 완료 처리하고, 실제 처리일(savedLog.date)을 기록
    const targetReminderId = savedLog.linkedReminderLogId || linkedOriginReminderLogId;
    if (targetReminderId) {
      updatedLogs = updatedLogs.map(l => {
        if (l.id === targetReminderId) {
          return {
            ...l,
            nextScheduleCompleted: true,
            nextScheduleCompletedDate: savedLog.date, // 실제 처리일(오늘)
            nextScheduleCompletedAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          };
        }
        return l;
      });
    }

    // 3. 지능형 안전장치: 같은 개체에 대해 미완료 차기 예정 작업이 있는 경우
    // (a) 동일 날짜이거나 (b) 동일/유사한 작업명(출하, 백신, 체중 등)이 당일 수행된 경우 자동 완료 처리
    if (savedLog.entityId || savedLog.tagNumber) {
      updatedLogs = updatedLogs.map(l => {
        const isSameEntity = (savedLog.entityId && l.entityId === savedLog.entityId) || 
                             (savedLog.tagNumber && l.tagNumber === savedLog.tagNumber);
        if (!isSameEntity || l.nextScheduleCompleted) return l;

        const isSameDate = l.nextScheduleDate === savedLog.date;
        const isTitleMatch = l.nextScheduleTitle && savedLog.title && (
          savedLog.title.includes(l.nextScheduleTitle) || 
          l.nextScheduleTitle.includes(savedLog.title) ||
          (l.nextScheduleTitle.includes('출하') && savedLog.title.includes('출하')) ||
          (l.nextScheduleTitle.includes('분만') && savedLog.title.includes('분만'))
        );

        if (isSameDate || isTitleMatch) {
          return {
            ...l,
            nextScheduleCompleted: true,
            nextScheduleCompletedDate: savedLog.date,
            nextScheduleCompletedAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          };
        }
        return l;
      });
    }

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
    setCareLogToEdit(null);
  };

  // 관리 내역 수정 모달 오픈 (options: { focusNextSchedule?: boolean })
  const handleOpenEditCareLog = (log, options = null) => {
    const ent = entities.find(e => e.id === log.entityId || e.tagNumber === log.tagNumber);
    setCareLogPreselectedEntity(ent || null);
    setCareLogToEdit(log);
    setCareLogInitialValues(options ? { focusNextSchedule: Boolean(options.focusNextSchedule) } : null);
    setIsCareLogModalOpen(true);
  };

  // 관리 내역 삭제 (2중 경고 적용)
  const handleDeleteCareLog = (logId) => {
    const targetLog = careLogs.find(l => l.id === logId);
    const logDesc = targetLog ? `[${targetLog.date}] ${targetLog.title}` : '이 관리 기록';

    // 1차 경고: 대상 기록 정보 확인
    if (!window.confirm(`${logDesc} 관리 기록을 삭제하시겠습니까?`)) {
      return;
    }

    // 2차 재확인: 영구 삭제 및 복구 불가 최종 경고
    if (!window.confirm(`⚠️ [최종 확인]\n삭제된 관리 기록은 다시 복구할 수 없습니다.\n정말 완전히 삭제하시겠습니까?`)) {
      return;
    }

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

  // 사용자 직접 추가 커스텀 분류 추가
  const handleAddCustomCategory = (newCat) => {
    setCustomCategories(prev => {
      const next = [...prev, newCat];
      saveCustomCareCategories(next);
      return next;
    });
    showToast(`새 관리 분류 [${newCat.label}]이(가) 추가되었습니다! ✨`);
  };

  // 사용자 커스텀 분류 삭제
  const handleDeleteCustomCategory = (catId) => {
    setCustomCategories(prev => {
      const next = prev.filter(c => c.id !== catId);
      saveCustomCareCategories(next);
      return next;
    });
    showToast('관리 분류가 삭제되었습니다.');
  };

  // 영농 일정 모달 열기 (initialData 지원: 개체/제목/메모/알람ID 등 자동 채움)
  const handleOpenScheduleModal = (dateStr, initialData = null) => {
    setScheduleTargetDate(dateStr || getTodayDateString());
    setScheduleToEdit(null);
    setScheduleInitialData(initialData || null);
    setIsScheduleModalOpen(true);
  };

  // 영농 일정 수정 모달 열기
  const handleEditSchedule = (sched) => {
    setScheduleToEdit(sched);
    setScheduleTargetDate(sched.date);
    setScheduleInitialData(null);
    setIsScheduleModalOpen(true);
  };

  // 영농 일정 저장 (신규 등록 및 수정)
  const handleSaveSchedule = (scheduleData) => {
    setSchedules(prev => {
      let next;
      const exists = prev.some(s => s.id === scheduleData.id);
      if (exists) {
        next = prev.map(s => s.id === scheduleData.id ? scheduleData : s);
      } else {
        next = [scheduleData, ...prev];
      }
      saveSchedules(next);
      return next;
    });

    // 알람에서 공식 일정으로 승격/등록했거나, 기존 일정이 수정된 경우 원본 알람과 양방향 동기화
    const targetReminderId = scheduleData.originReminderLogId || 
      (scheduleToEdit ? (careLogs || []).find(l => l.nextSchedulePromotedScheduleId === scheduleData.id)?.id : null);

    if (targetReminderId) {
      setCareLogs(prev => {
        const next = prev.map(l => {
          if (l.id === targetReminderId) {
            return {
              ...l,
              nextScheduleDate: scheduleData.date, // 일정 날짜 수정 시 알람 날짜도 실시간 동기화
              nextScheduleCompleted: true,
              nextScheduleCompletedDate: scheduleData.date,
              nextSchedulePromotedScheduleId: scheduleData.id,
              updatedAt: new Date().toISOString()
            };
          }
          return l;
        });
        saveCareLogs(next);
        return next;
      });
    }

    setIsScheduleModalOpen(false);
    setScheduleToEdit(null);
    setScheduleInitialData(null);
    showToast(scheduleToEdit ? '영농 일정이 수정되었습니다 📅' : '새 영농 일정이 등록되었습니다 📅');
  };

  // 영농 일정 완료/미완료 토글 (알람과 100% 양방향 동기화)
  const handleToggleScheduleComplete = (scheduleId) => {
    let linkedReminderId = null;
    let nextComp = false;
    setSchedules(prev => {
      const next = prev.map(s => {
        if (s.id === scheduleId) {
          nextComp = !s.completed;
          linkedReminderId = s.originReminderLogId;
          return {
            ...s,
            completed: nextComp,
            completedAt: nextComp ? new Date().toISOString() : null
          };
        }
        return s;
      });
      saveSchedules(next);
      return next;
    });

    if (linkedReminderId) {
      setCareLogs(prev => {
        const next = prev.map(l => {
          if (l.id === linkedReminderId) {
            return {
              ...l,
              nextScheduleCompleted: nextComp,
              nextScheduleCompletedDate: nextComp ? getTodayDateString() : null,
              nextScheduleCompletedAt: nextComp ? new Date().toISOString() : null,
              updatedAt: new Date().toISOString()
            };
          }
          return l;
        });
        saveCareLogs(next);
        return next;
      });
    }

    showToast('일정 완료 상태가 변경되었습니다 ✅');
  };

  // 알람(차기 예정 작업) 완료/미완료 토글 (승격된 일정과 100% 양방향 동기화)
  const handleToggleReminderComplete = (logId) => {
    let promotedSchedId = null;
    let nextCompleted = false;
    setCareLogs(prev => {
      const next = prev.map(log => {
        if (log.id === logId) {
          nextCompleted = !log.nextScheduleCompleted;
          promotedSchedId = log.nextSchedulePromotedScheduleId;
          return {
            ...log,
            nextScheduleCompleted: nextCompleted,
            nextScheduleCompletedDate: nextCompleted ? (log.nextScheduleCompletedDate || getTodayDateString()) : null,
            nextScheduleCompletedAt: nextCompleted ? new Date().toISOString() : null,
            updatedAt: new Date().toISOString()
          };
        }
        return log;
      });
      saveCareLogs(next);
      return next;
    });

    if (promotedSchedId) {
      setSchedules(prev => {
        const next = prev.map(s => {
          if (s.id === promotedSchedId) {
            return {
              ...s,
              completed: nextCompleted,
              completedAt: nextCompleted ? new Date().toISOString() : null,
              updatedAt: new Date().toISOString()
            };
          }
          return s;
        });
        saveSchedules(next);
        return next;
      });
    }

    showToast('알람 완료 상태가 변경되었습니다 ✅');
  };

  // 알람(차기 예정 작업) 날짜 변경 (연결된 일정과 양방향 실시간 동기화)
  const handleUpdateReminderDate = (logId, newDate) => {
    if (!newDate) return;
    let promotedSchedId = null;

    setCareLogs(prev => {
      const next = prev.map(log => {
        if (log.id === logId) {
          promotedSchedId = log.nextSchedulePromotedScheduleId || null;
          return {
            ...log,
            nextScheduleDate: newDate,
            updatedAt: new Date().toISOString()
          };
        }
        return log;
      });
      saveCareLogs(next);
      return next;
    });

    // 해당 알람에 연결된 공식 일정이 있거나, originReminderLogId로 가리키는 일정이 있다면 그 일정 날짜도 함께 동기화
    setSchedules(prev => {
      let changed = false;
      const next = prev.map(s => {
        if (s.id === promotedSchedId || s.originReminderLogId === logId) {
          changed = true;
          return {
            ...s,
            date: newDate,
            updatedAt: new Date().toISOString()
          };
        }
        return s;
      });
      if (changed) {
        saveSchedules(next);
        return next;
      }
      return prev;
    });

    showToast(`알람 날짜가 ${newDate}로 변경되었습니다 📅`);
  };

  // 영농 일정 삭제
  const handleDeleteSchedule = (scheduleId, skipConfirm = false) => {
    if (!skipConfirm && !window.confirm('정말 이 일정을 삭제하시겠습니까?\n삭제된 일정은 복구할 수 없습니다.')) return;
    setSchedules(prev => {
      const next = prev.filter(s => s.id !== scheduleId);
      saveSchedules(next);
      return next;
    });
    showToast('일정이 삭제되었습니다.');
  };

  // 데이터베이스 복원 시 상태 동기화
  const handleDatabaseRestored = () => {
    setEntities(loadEntities());
    setCareLogs(loadCareLogs());
    setSchedules(loadSchedules());
    setCustomCategories(loadCustomCareCategories());
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
        onOpenCareLogModal={(preselected = null) => {
          setCareLogPreselectedEntity(preselected);
          setCareLogInitialValues(null);
          setIsCareLogModalOpen(true);
        }}
        onOpenSettingsModal={() => setIsSettingsModalOpen(true)}
        startTab={farmSettings.startTab}
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
            careCategories={allCareCategories}
            onClose={() => {
              const returnEnt = returnToDetailEntity;
              setPrintSheetEntity(null);
              setReturnToDetailEntity(null);
              if (returnEnt) {
                const latest = entities.find(e => e.id === returnEnt.id) || returnEnt;
                setSelectedEntityForDetail(latest);
              }
            }}
          />
        ) : (
          <>
            {activeTab === 'entities' && (
              <EntityList
                entities={entities}
                careLogs={careLogs}
                careCategories={allCareCategories}
                onOpenEntityDetail={handleOpenEntityDetail}
                onOpenFarmCommonHistory={() => setIsFarmCommonModalOpen(true)}
                onOpenEntityModal={(entity = null) => {
                  setEntityToEdit(entity);
                  setIsEntityModalOpen(true);
                }}
                onOpenCareLogModal={(entity) => {
                  setCareLogPreselectedEntity(entity);
                  setCareLogInitialValues(null);
                  setIsCareLogModalOpen(true);
                }}
                onOpenScheduleModal={(entity) => {
                  setScheduleTargetDate(getTodayDateString());
                  setScheduleToEdit(null);
                  setScheduleInitialData({
                    entityId: entity.id,
                    targetType: 'entity',
                    date: getTodayDateString(),
                    preselectedEntity: entity
                  });
                  setIsScheduleModalOpen(true);
                }}
                onOpenPrintSheet={(entity) => {
                  setReturnToDetailEntity(null);
                  setPrintSheetEntity(entity);
                }}
                onDeleteEntity={handleDeleteEntity}
                onEditCareLog={handleOpenEditCareLog}
                onDeleteCareLog={handleDeleteCareLog}
              />
            )}

            {activeTab === 'diary' && (
              <DailyDiaryView
                entities={entities}
                careLogs={careLogs}
                careCategories={allCareCategories}
                schedules={schedules}
                initialDate={targetDiaryDate}
                initialTab={initialDiaryTab}
                onOpenEntityDetail={handleOpenEntityDetail}
                onOpenFarmCommonHistory={() => setIsFarmCommonModalOpen(true)}
                onOpenCareLogModal={(entity = null, date = null, initialValues = null) => {
                  setCareLogPreselectedEntity(entity);
                  setCareLogInitialValues(initialValues);
                  setIsCareLogModalOpen(true);
                }}
                onOpenScheduleModal={handleOpenScheduleModal}
                onSaveSchedule={handleSaveSchedule}
                onToggleScheduleComplete={handleToggleScheduleComplete}
                onToggleReminderComplete={handleToggleReminderComplete}
                onDeleteSchedule={handleDeleteSchedule}
                onEditSchedule={handleEditSchedule}
                onEditCareLog={handleOpenEditCareLog}
                onUpdateReminderDate={handleUpdateReminderDate}
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
                schedules={schedules}
                careCategories={allCareCategories}
                farmSettings={farmSettings}
                onOpenEntityDetail={handleOpenEntityDetail}
                onOpenFarmCommonHistory={() => setIsFarmCommonModalOpen(true)}
                onOpenCareLogModal={(entity = null) => {
                  setCareLogPreselectedEntity(entity);
                  setCareLogInitialValues(null);
                  setIsCareLogModalOpen(true);
                }}
                onEditCareLog={handleOpenEditCareLog}
                onNavigateToDiary={(date) => {
                  if (date) setTargetDiaryDate(date);
                  setInitialDiaryTab('logs');
                  setActiveTab('diary');
                }}
                onNavigateToCloud={() => setIsSettingsModalOpen(true)}
              />
            )}

            {activeTab === 'farm' && (
              <FarmCommonHistoryView
                careLogs={careLogs}
                careCategories={allCareCategories}
                farmSettings={farmSettings}
                onOpenCareLogModal={(entity = null, date = null, initialValues = null) => {
                  setCareLogPreselectedEntity(entity);
                  setCareLogInitialValues(initialValues);
                  setIsCareLogModalOpen(true);
                }}
                onEditCareLog={handleOpenEditCareLog}
                onDeleteCareLog={handleDeleteCareLog}
              />
            )}

            {/* 레거시 클라우드 탭 직접 접근 시에도 환경설정 모달과 호환 지원 */}
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

      {/* 개체 상세 관리 내역 모달 (타임라인 & 처치 기록) */}
      {selectedEntityForDetail && (
        <EntityDetailModal
          entity={selectedEntityForDetail}
          careLogs={careLogs}
          careCategories={allCareCategories}
          schedules={schedules}
          initialViewMode={entityDetailInitialView}
          onClose={() => {
            setSelectedEntityForDetail(null);
            setEntityDetailInitialView('summary');
          }}
          onOpenEntityDetail={handleOpenEntityDetail}
          onOpenCareLogModal={(entity) => {
            setCareLogPreselectedEntity(entity);
            setCareLogInitialValues(null);
            setIsCareLogModalOpen(true);
          }}
          onOpenEntityModal={(entity) => {
            setEntityToEdit(entity);
            setIsEntityModalOpen(true);
          }}
          onOpenPrintSheet={(entity) => {
            setReturnToDetailEntity(entity);
            setSelectedEntityForDetail(null);
            setPrintSheetEntity(entity);
          }}
          onDeleteCareLog={handleDeleteCareLog}
          onEditCareLog={handleOpenEditCareLog}
          onEditSchedule={handleEditSchedule}
          onUpdateEntityStatus={handleUpdateEntityStatus}
          onUpdateEntityMemo={handleUpdateEntityMemo}
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
          onDelete={(id, name) => {
            handleDeleteEntity(id, name);
            setIsEntityModalOpen(false);
            setEntityToEdit(null);
            if (selectedEntityForDetail && selectedEntityForDetail.id === id) {
              setSelectedEntityForDetail(null);
            }
          }}
        />
      )}

      {/* 농장 관리 이력 모달 (축사 소독, 방역, 시설 점검 전체 이력 및 검색) */}
      {isFarmCommonModalOpen && (
        <FarmCommonHistoryModal
          isOpen={isFarmCommonModalOpen}
          onClose={() => setIsFarmCommonModalOpen(false)}
          careLogs={careLogs}
          schedules={schedules}
          careCategories={allCareCategories}
          onOpenCareLogModal={(entity = null, date = null, initialValues = null) => {
            setCareLogPreselectedEntity(entity);
            setCareLogInitialValues(initialValues);
            setIsCareLogModalOpen(true);
          }}
          onEditCareLog={handleOpenEditCareLog}
          onDeleteCareLog={handleDeleteCareLog}
          onEditSchedule={handleEditSchedule}
          onNavigateToFarm={() => {
            setIsFarmCommonModalOpen(false);
            setActiveTab('farm');
          }}
        />
      )}

      {/* 농장 환경 설정 모달 (농장 기본정보, 시작화면 선택, 구글 드라이브 백업) */}
      {isSettingsModalOpen && (
        <FarmSettingsModal
          isOpen={isSettingsModalOpen}
          onClose={() => setIsSettingsModalOpen(false)}
          farmSettings={farmSettings}
          onSaveSettings={handleSaveFarmSettings}
          entities={entities}
          careLogs={careLogs}
          onDatabaseRestored={handleDatabaseRestored}
          onShowToast={showToast}
        />
      )}

      {/* 개체별 및 농장 공통 관리 내역 추가 및 수정 폼 모달 (최상위 레이어) */}
      {isCareLogModalOpen && (
        <CareLogFormModal
          preselectedEntity={careLogPreselectedEntity}
          logToEdit={careLogToEdit}
          initialValues={careLogInitialValues}
          entities={entities}
          careLogs={careLogs}
          careCategories={allCareCategories}
          farmSettings={farmSettings}
          onAddCustomCategory={handleAddCustomCategory}
          onDeleteCustomCategory={handleDeleteCustomCategory}
          onClose={() => {
            setIsCareLogModalOpen(false);
            setCareLogPreselectedEntity(null);
            setCareLogToEdit(null);
            setCareLogInitialValues(null);
          }}
          onSave={handleSaveCareLog}
          onDelete={handleDeleteCareLog}
        />
      )}

      {/* 영농 일정 추가 및 수정 폼 모달 (최상위 레이어) */}
      {isScheduleModalOpen && (
        <ScheduleFormModal
          initialDate={scheduleTargetDate}
          scheduleToEdit={scheduleToEdit}
          initialData={scheduleInitialData}
          entities={entities}
          careCategories={allCareCategories}
          onAddCustomCategory={handleAddCustomCategory}
          onDeleteCustomCategory={handleDeleteCustomCategory}
          onClose={() => {
            setIsScheduleModalOpen(false);
            setScheduleToEdit(null);
            setScheduleInitialData(null);
          }}
          onSave={handleSaveSchedule}
          onDelete={handleDeleteSchedule}
        />
      )}

      {/* 모바일 전용 우측 하단 플로팅 액션 버튼 (FAB): 개체 관리 탭에서만 노출 (다이어리, 보고서, 드라이브 탭에서는 가림 방지) */}
      {activeTab === 'entities' && (
        <button
          type="button"
          className="mobile-fab"
          onClick={() => {
            setCareLogPreselectedEntity(null);
            setIsCareLogModalOpen(true);
          }}
          title="현장 관리 기록 빠른 추가"
          aria-label="현장 관리 기록 빠른 추가"
        >
          <Plus size={26} color="#ffffff" strokeWidth={2.5} />
        </button>
      )}
    </div>
  );
}
