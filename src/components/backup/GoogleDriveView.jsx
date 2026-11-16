import React, { useState, useEffect } from 'react';
import { 
  Cloud, 
  CloudUpload, 
  CloudDownload, 
  CheckCircle2, 
  AlertCircle, 
  Settings, 
  Download, 
  Upload, 
  Share2, 
  FileSpreadsheet, 
  RotateCcw,
  ExternalLink,
  ShieldCheck,
  RefreshCw
} from 'lucide-react';
import { 
  getStoredGoogleCredentials, 
  saveGoogleCredentials, 
  isGoogleSignedIn, 
  signInGoogle, 
  signOutGoogle, 
  uploadBackupToGoogleDrive, 
  listGoogleDriveBackups, 
  downloadGoogleDriveBackup,
  downloadJsonFile,
  shareFarmReport
} from '../../lib/googleDriveService.js';
import { exportFullDatabase, importFullDatabase } from '../../lib/storage.js';

export default function GoogleDriveView({
  entities,
  careLogs,
  onDatabaseRestored
}) {
  const [credentials, setCredentials] = useState(getStoredGoogleCredentials());
  const [showConfig, setShowConfig] = useState(false);
  const [isSignedIn, setIsSignedIn] = useState(isGoogleSignedIn());
  const [cloudBackups, setCloudBackups] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState(null);

  useEffect(() => {
    setIsSignedIn(isGoogleSignedIn());
    if (isGoogleSignedIn()) {
      fetchCloudBackups();
    }
  }, []);

  const showStatus = (type, text) => {
    setStatusMessage({ type, text });
    setTimeout(() => setStatusMessage(null), 5000);
  };

  // 구글 드라이브 백업 목록 가져오기
  const fetchCloudBackups = async () => {
    try {
      setIsLoading(true);
      const files = await listGoogleDriveBackups();
      setCloudBackups(files);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  // 구글 로그인
  const handleSignIn = async () => {
    try {
      setIsLoading(true);
      await signInGoogle();
      setIsSignedIn(true);
      showStatus('success', '구글 계정과 성공적으로 연결되었습니다!');
      await fetchCloudBackups();
    } catch (err) {
      showStatus('error', err.message || '구글 로그인에 실패했습니다. API 키 설정을 확인해주세요.');
    } finally {
      setIsLoading(false);
    }
  };

  // 구글 로그아웃
  const handleSignOut = () => {
    signOutGoogle();
    setIsSignedIn(false);
    setCloudBackups([]);
    showStatus('info', '구글 계정 연결이 해제되었습니다.');
  };

  // 구글 드라이브로 즉시 업로드 백업
  const handleUploadToDrive = async () => {
    try {
      setIsLoading(true);
      const fullJson = exportFullDatabase(entities, careLogs);
      const result = await uploadBackupToGoogleDrive(fullJson);
      showStatus('success', `구글 드라이브에 [${result.fileName}] 업로드가 완료되었습니다!`);
      await fetchCloudBackups();
    } catch (err) {
      showStatus('error', err.message || '업로드 중 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  // 구글 드라이브 백업 복원
  const handleRestoreFromDrive = async (fileId, fileName) => {
    if (!window.confirm(`[${fileName}] 백업 파일로 복원하시겠습니까? 현재 데이터가 덮어씌워집니다.`)) {
      return;
    }

    try {
      setIsLoading(true);
      const jsonContent = await downloadGoogleDriveBackup(fileId);
      const res = importFullDatabase(jsonContent);
      if (res.success) {
        showStatus('success', `복원 성공! 개체 ${res.entityCount}두, 관리기록 ${res.logCount}건이 복구되었습니다.`);
        onDatabaseRestored();
      } else {
        showStatus('error', `복원 실패: ${res.error}`);
      }
    } catch (err) {
      showStatus('error', err.message || '백업 복원 중 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  // 로컬 JSON 백업 파일 다운로드
  const handleDownloadLocalJson = () => {
    const fullJson = exportFullDatabase(entities, careLogs);
    const dateStr = new Date().toISOString().slice(0, 10);
    downloadJsonFile(fullJson, `happy_farm_backup_${dateStr}.json`);
    showStatus('success', '행복 농장 백업 파일(JSON)이 다운로드되었습니다. 구글 드라이브에 직접 업로드하여 공유할 수도 있습니다.');
  };

  // 로컬 JSON 백업 파일 불러오기
  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result;
      if (typeof content === 'string') {
        const res = importFullDatabase(content);
        if (res.success) {
          showStatus('success', `파일 복원 성공! 개체 ${res.entityCount}두, 관리기록 ${res.logCount}건이 반영되었습니다.`);
          onDatabaseRestored();
        } else {
          showStatus('error', `복원 실패: ${res.error}`);
        }
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  // 엑셀/스프레드시트용 CSV 다운로드
  const handleExportCsv = () => {
    let csv = '\uFEFF'; // UTF-8 BOM
    csv += '개체식별번호,이름,축종,품종,성별,생년월일,축사위치,체중,상태,모체번호,부체,메모\n';
    entities.forEach(e => {
      csv += `"${e.tagNumber}","${e.name}","${e.category}","${e.breed}","${e.gender}","${e.birthDate}","${e.barn}","${e.weight}","${e.status}","${e.motherTag}","${e.fatherTag}","${(e.memo || '').replace(/"/g, '""')}"\n`;
    });

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `happy_farm_entities_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    showStatus('success', '구글 시트/엑셀 호환 CSV 파일이 다운로드되었습니다.');
  };

  // 구글 자격증명 저장
  const handleSaveCredentials = (e) => {
    e.preventDefault();
    saveGoogleCredentials(credentials.clientId, credentials.apiKey);
    setShowConfig(false);
    showStatus('success', 'Google API 설정이 저장되었습니다.');
  };

  return (
    <div>
      {/* 상태 메시지 알림 */}
      {statusMessage && (
        <div style={{
          background: statusMessage.type === 'error' ? 'rgba(239, 68, 68, 0.15)' : 'rgba(16, 185, 129, 0.15)',
          border: `1px solid ${statusMessage.type === 'error' ? 'var(--color-danger)' : 'var(--color-primary)'}`,
          color: statusMessage.type === 'error' ? 'var(--color-danger)' : 'var(--color-primary)',
          padding: '0.85rem 1.15rem',
          borderRadius: 'var(--radius-md)',
          marginBottom: '1.25rem',
          fontWeight: 600,
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem'
        }}>
          {statusMessage.type === 'error' ? <AlertCircle size={18} /> : <CheckCircle2 size={18} />}
          <span>{statusMessage.text}</span>
        </div>
      )}

      {/* 1. 구글 드라이브 클라우드 동기화 카드 */}
      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <div className="card-header">
          <div className="card-title">
            <Cloud size={20} color="var(--color-secondary)" />
            <span>구글 드라이브 클라우드 백업 및 공유 (Google Drive)</span>
          </div>
          <button 
            className="btn btn-outline btn-sm"
            onClick={() => setShowConfig(!showConfig)}
          >
            <Settings size={15} />
            <span>API 키 설정</span>
          </button>
        </div>

        <div className="card-body">
          {/* 구글 계정 상태 바 */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '1.1rem 1.3rem',
            background: 'var(--bg-card-subtle)',
            borderRadius: 'var(--radius-lg)',
            marginBottom: '1.25rem',
            flexWrap: 'wrap',
            gap: '1rem'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
              <div style={{
                width: '42px',
                height: '42px',
                borderRadius: '50%',
                background: isSignedIn ? 'rgba(16, 185, 129, 0.2)' : 'rgba(100, 116, 139, 0.2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: isSignedIn ? 'var(--color-primary)' : 'var(--text-muted)'
              }}>
                <ShieldCheck size={22} />
              </div>
              <div>
                <div style={{ fontWeight: 800, fontSize: '1rem' }}>
                  {isSignedIn ? '구글 드라이브 연결 완료' : '구글 계정 미연동'}
                </div>
                <div style={{ fontSize: '0.825rem', color: 'var(--text-muted)' }}>
                  {isSignedIn 
                    ? '농장 데이터를 구글 드라이브에 안전하게 동기화하고 팀원과 공유할 수 있습니다.' 
                    : '구글 계정에 로그인하여 클라우드 백업 및 복원 기능을 활성화하세요.'}
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '0.6rem' }}>
              {isSignedIn ? (
                <>
                  <button 
                    className="btn btn-primary"
                    onClick={handleUploadToDrive}
                    disabled={isLoading}
                  >
                    <CloudUpload size={16} />
                    <span>구글 드라이브에 지금 백업</span>
                  </button>
                  <button 
                    className="btn btn-outline btn-sm"
                    onClick={handleSignOut}
                  >
                    로그아웃
                  </button>
                </>
              ) : (
                <button 
                  className="btn btn-primary"
                  onClick={handleSignIn}
                  disabled={isLoading}
                >
                  <Cloud size={16} />
                  <span>Google 계정으로 로그인</span>
                </button>
              )}
            </div>
          </div>

          {/* API 설정 접기/펼치기 패널 */}
          {showConfig && (
            <div style={{
              background: 'var(--bg-card)',
              border: '1px solid var(--border-color)',
              borderRadius: 'var(--radius-md)',
              padding: '1.25rem',
              marginBottom: '1.5rem'
            }}>
              <h4 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '0.5rem' }}>
                Google Cloud Console API 설정
              </h4>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
                Google Cloud Console(GCP)에서 발급받은 OAuth Client ID와 API Key를 입력하세요.
              </p>

              <form onSubmit={handleSaveCredentials} className="form-grid">
                <div className="form-group full-width">
                  <label className="form-label">Google Client ID</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="예: xxxxx.apps.googleusercontent.com"
                    value={credentials.clientId}
                    onChange={(e) => setCredentials({ ...credentials, clientId: e.target.value })}
                  />
                </div>
                <div className="form-group full-width">
                  <label className="form-label">Google API Key</label>
                  <input
                    type="password"
                    className="form-input"
                    placeholder="예: AIzaSyxxxxxx"
                    value={credentials.apiKey}
                    onChange={(e) => setCredentials({ ...credentials, apiKey: e.target.value })}
                  />
                </div>
                <div style={{ gridColumn: '1 / -1', display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                  <button type="button" className="btn btn-secondary btn-sm" onClick={() => setShowConfig(false)}>
                    닫기
                  </button>
                  <button type="submit" className="btn btn-primary btn-sm">
                    저장하기
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* 클라우드 백업 스냅샷 목록 */}
          {isSignedIn && (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                <h4 style={{ fontSize: '0.95rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <span>구글 드라이브 저장된 백업 목록 ({cloudBackups.length}개)</span>
                </h4>
                <button className="btn btn-outline btn-sm" onClick={fetchCloudBackups} disabled={isLoading}>
                  <RefreshCw size={13} className={isLoading ? 'spin' : ''} />
                  <span>새로고침</span>
                </button>
              </div>

              {cloudBackups.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '2rem', background: 'var(--bg-card-subtle)', borderRadius: 'var(--radius-md)', color: 'var(--text-muted)' }}>
                  드라이브에 저장된 백업 파일이 없습니다. 상단의 [구글 드라이브에 지금 백업]을 눌러보세요.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {cloudBackups.map(file => (
                    <div 
                      key={file.id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '0.75rem 1rem',
                        background: 'var(--bg-card-subtle)',
                        borderRadius: 'var(--radius-md)',
                        fontSize: '0.85rem'
                      }}
                    >
                      <div>
                        <div style={{ fontWeight: 700 }}>{file.name}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                          업로드: {new Date(file.createdTime).toLocaleString()} • 크기: {file.size ? `${Math.round(file.size / 1024)} KB` : '알 수 없음'}
                        </div>
                      </div>
                      <button 
                        className="btn btn-outline btn-sm"
                        onClick={() => handleRestoreFromDrive(file.id, file.name)}
                      >
                        <CloudDownload size={14} />
                        <span>이 버전으로 복원</span>
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* 2. 간편 로컬 파일 공유 & 엑셀/구글 시트 연동 */}
      <div className="card">
        <div className="card-header">
          <div className="card-title">
            <Share2 size={20} color="var(--color-primary)" />
            <span>원클릭 자료 공유 및 파일 백업/복원</span>
          </div>
        </div>

        <div className="card-body">
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginBottom: '1.25rem' }}>
            API 설정 없이도 전체 농장 데이터베이스를 파일로 내려받아 <strong>구글 드라이브 폴더에 직접 업로드</strong>하거나,
            카카오톡/이메일로 전송하고 다른 기기에서 즉시 불러올 수 있습니다.
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem' }}>
            {/* 전체 JSON 백업 다운로드 */}
            <div style={{
              background: 'var(--bg-card-subtle)',
              border: '1px solid var(--border-color)',
              borderRadius: 'var(--radius-md)',
              padding: '1.25rem',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between'
            }}>
              <div>
                <h4 style={{ fontWeight: 700, marginBottom: '0.35rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <Download size={16} color="var(--color-primary)" />
                  <span>전체 백업 파일 다운로드</span>
                </h4>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
                  개체 마스터 데이터 및 모든 생애 관리 기록을 JSON 파일로 저장합니다.
                </p>
              </div>
              <button className="btn btn-primary btn-sm" onClick={handleDownloadLocalJson}>
                JSON 백업 파일 내려받기
              </button>
            </div>

            {/* 백업 파일 불러오기 / 복원 */}
            <div style={{
              background: 'var(--bg-card-subtle)',
              border: '1px solid var(--border-color)',
              borderRadius: 'var(--radius-md)',
              padding: '1.25rem',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between'
            }}>
              <div>
                <h4 style={{ fontWeight: 700, marginBottom: '0.35rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <Upload size={16} color="var(--color-secondary)" />
                  <span>백업 파일 복원 (가져오기)</span>
                </h4>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
                  구글 드라이브나 PC에 보관 중인 JSON 백업 파일을 선택하여 복원합니다.
                </p>
              </div>
              <label className="btn btn-secondary btn-sm" style={{ textAlign: 'center', cursor: 'pointer' }}>
                <input
                  type="file"
                  accept=".json"
                  style={{ display: 'none' }}
                  onChange={handleFileUpload}
                />
                백업 파일 선택 (.json)
              </label>
            </div>

            {/* 엑셀 / 구글 스프레드시트 호환 CSV */}
            <div style={{
              background: 'var(--bg-card-subtle)',
              border: '1px solid var(--border-color)',
              borderRadius: 'var(--radius-md)',
              padding: '1.25rem',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between'
            }}>
              <div>
                <h4 style={{ fontWeight: 700, marginBottom: '0.35rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <FileSpreadsheet size={16} color="#10b981" />
                  <span>구글 시트/엑셀용 CSV</span>
                </h4>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
                  개체 목록 및 관리 정보를 구글 스프레드시트나 엑셀에서 바로 열 수 있습니다.
                </p>
              </div>
              <button className="btn btn-outline btn-sm" onClick={handleExportCsv}>
                CSV 파일로 내보내기
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
