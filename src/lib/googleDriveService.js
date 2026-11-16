// ==========================================================================
// Google Drive Integration & Cloud Sharing Service
// 행복 농장 구글 드라이브 클라우드 동기화 및 백업/공유 서비스
// (프로드릴앱 googleDriveBackup.js 차용 및 발전)
// ==========================================================================

/* global gapi, google */

const CLIENT_ID_STORAGE_KEY = 'happy_farm_google_client_id';
const API_KEY_STORAGE_KEY = 'happy_farm_google_api_key';
const TOKEN_STORAGE_KEY = 'happy_farm_google_token';
const TOKEN_EXPIRY_STORAGE_KEY = 'happy_farm_google_token_expiry';
const LINKED_EMAIL_STORAGE_KEY = 'happy_farm_linked_email';

const SCOPES = 'https://www.googleapis.com/auth/drive.file https://www.googleapis.com/auth/userinfo.email';

let tokenClient = null;
let gapiInitialized = false;

// Google API 키 및 Client ID 관리
export function getStoredGoogleCredentials() {
  return {
    clientId: localStorage.getItem(CLIENT_ID_STORAGE_KEY) || '',
    apiKey: localStorage.getItem(API_KEY_STORAGE_KEY) || '',
  };
}

export function saveGoogleCredentials(clientId, apiKey) {
  localStorage.setItem(CLIENT_ID_STORAGE_KEY, clientId.trim());
  localStorage.setItem(API_KEY_STORAGE_KEY, apiKey.trim());
}

// 구글 GIS & GAPI 동적 스크립트 로더
export function ensureGoogleScriptsLoaded() {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined') {
      return reject(new Error('Browser environment required'));
    }

    if (typeof gapi !== 'undefined' && typeof google !== 'undefined' && google?.accounts?.oauth2) {
      return resolve(true);
    }

    let loadedCount = 0;
    const checkComplete = () => {
      loadedCount++;
      if (typeof gapi !== 'undefined' && typeof google !== 'undefined' && google?.accounts?.oauth2) {
        resolve(true);
      } else if (loadedCount >= 2) {
        setTimeout(() => {
          if (typeof gapi !== 'undefined' && typeof google !== 'undefined') {
            resolve(true);
          } else {
            reject(new Error('구글 SDK 로드에 실패했습니다. 네트워크 연결을 확인해주세요.'));
          }
        }, 300);
      }
    };

    if (typeof gapi === 'undefined') {
      const gapiScript = document.createElement('script');
      gapiScript.src = 'https://apis.google.com/js/api.js';
      gapiScript.async = true;
      gapiScript.defer = true;
      gapiScript.onload = checkComplete;
      gapiScript.onerror = () => checkComplete();
      document.body.appendChild(gapiScript);
    } else {
      checkComplete();
    }

    if (typeof google === 'undefined' || !google?.accounts?.oauth2) {
      const gisScript = document.createElement('script');
      gisScript.src = 'https://accounts.google.com/gsi/client';
      gisScript.async = true;
      gisScript.defer = true;
      gisScript.onload = checkComplete;
      gisScript.onerror = () => checkComplete();
      document.body.appendChild(gisScript);
    } else {
      checkComplete();
    }
  });
}

// 구글 API 초기화
export async function initGoogleApi() {
  const { clientId, apiKey } = getStoredGoogleCredentials();
  if (!clientId || !apiKey) {
    throw new Error('Google Client ID 및 API Key가 설정되지 않았습니다.');
  }

  await ensureGoogleScriptsLoaded();

  await new Promise((resolve, reject) => {
    gapi.load('client', {
      callback: resolve,
      onerror: reject,
      timeout: 5000,
      ontimeout: () => reject(new Error('GAPI client 로드 시간 초과'))
    });
  });

  await gapi.client.init({
    apiKey: apiKey,
    discoveryDocs: ['https://www.googleapis.com/discovery/v1/apis/drive/v3/rest'],
  });

  gapiInitialized = true;

  tokenClient = google.accounts.oauth2.initTokenClient({
    client_id: clientId,
    scope: SCOPES,
    callback: (resp) => {
      if (resp.error) {
        console.error('Google Auth Error:', resp);
        return;
      }
      const expiresIn = resp.expires_in || 3599;
      const expiryTime = Date.now() + (expiresIn * 1000);
      localStorage.setItem(TOKEN_STORAGE_KEY, resp.access_token);
      localStorage.setItem(TOKEN_EXPIRY_STORAGE_KEY, String(expiryTime));
      gapi.client.setToken({ access_token: resp.access_token });
    }
  });

  return true;
}

// 로그인 상태 확인
export function isGoogleSignedIn() {
  const token = localStorage.getItem(TOKEN_STORAGE_KEY);
  const expiry = localStorage.getItem(TOKEN_EXPIRY_STORAGE_KEY);
  if (!token || !expiry) return false;
  return Date.now() < Number(expiry);
}

// 구글 로그인 요청
export async function signInGoogle() {
  await initGoogleApi();
  return new Promise((resolve, reject) => {
    try {
      tokenClient.callback = (resp) => {
        if (resp.error) {
          reject(new Error(resp.error_description || resp.error));
          return;
        }
        const expiresIn = resp.expires_in || 3599;
        const expiryTime = Date.now() + (expiresIn * 1000);
        localStorage.setItem(TOKEN_STORAGE_KEY, resp.access_token);
        localStorage.setItem(TOKEN_EXPIRY_STORAGE_KEY, String(expiryTime));
        gapi.client.setToken({ access_token: resp.access_token });
        resolve(resp);
      };
      tokenClient.requestAccessToken({ prompt: 'consent' });
    } catch (err) {
      reject(err);
    }
  });
}

// 로그아웃
export function signOutGoogle() {
  const token = localStorage.getItem(TOKEN_STORAGE_KEY);
  if (token && typeof google !== 'undefined' && google?.accounts?.oauth2) {
    google.accounts.oauth2.revoke(token, () => {});
  }
  localStorage.removeItem(TOKEN_STORAGE_KEY);
  localStorage.removeItem(TOKEN_EXPIRY_STORAGE_KEY);
  localStorage.removeItem(LINKED_EMAIL_STORAGE_KEY);
  if (typeof gapi !== 'undefined' && gapi.client) {
    gapi.client.setToken(null);
  }
}

// 구글 드라이브에 행복 농장 백업 파일 업로드
export async function uploadBackupToGoogleDrive(jsonBackupData) {
  if (!isGoogleSignedIn()) {
    throw new Error('구글 드라이브에 로그인되어 있지 않습니다.');
  }

  const token = localStorage.getItem(TOKEN_STORAGE_KEY);
  const now = new Date();
  const dateStr = now.toISOString().replace(/[:.]/g, '-').slice(0, 16);
  const fileName = `HappyFarm_Backup_${dateStr}.json`;

  const metadata = {
    name: fileName,
    mimeType: 'application/json',
    description: '행복 농장 관리 프로그램 자동 데이터 백업',
  };

  const form = new FormData();
  form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
  form.append('file', new Blob([jsonBackupData], { type: 'application/json' }));

  const res = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: form,
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`구글 드라이브 업로드 실패: ${errorText}`);
  }

  const result = await res.json();
  return {
    success: true,
    fileId: result.id,
    fileName: fileName,
    timestamp: now.toISOString(),
  };
}

// 구글 드라이브 백업 파일 목록 조회
export async function listGoogleDriveBackups() {
  if (!isGoogleSignedIn()) {
    throw new Error('구글 드라이브에 로그인되어 있지 않습니다.');
  }

  const token = localStorage.getItem(TOKEN_STORAGE_KEY);
  const query = "name contains 'HappyFarm_Backup_' and trashed = false";
  const url = `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(query)}&orderBy=createdTime desc&fields=files(id,name,createdTime,size)`;

  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!res.ok) {
    throw new Error('구글 드라이브 백업 목록을 가져올 수 없습니다.');
  }

  const data = await res.json();
  return data.files || [];
}

// 구글 드라이브 백업 파일 내용 다운로드
export async function downloadGoogleDriveBackup(fileId) {
  if (!isGoogleSignedIn()) {
    throw new Error('구글 드라이브에 로그인되어 있지 않습니다.');
  }

  const token = localStorage.getItem(TOKEN_STORAGE_KEY);
  const url = `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`;

  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!res.ok) {
    throw new Error('구글 드라이브 파일 다운로드 실패');
  }

  return await res.text();
}

// 즉시 파일 다운로드 (구글 드라이브 웹 또는 로컬 저장용 JSON)
export function downloadJsonFile(content, fileName = 'happy_farm_backup.json') {
  const blob = new Blob([content], { type: 'application/json;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

// 모바일/PC 스마트 공유 (Web Share API)
export async function shareFarmReport(title, text) {
  if (navigator.share) {
    try {
      await navigator.share({
        title: title,
        text: text,
      });
      return { success: true };
    } catch (err) {
      if (err.name !== 'AbortError') {
        console.error('공유 실패:', err);
      }
      return { success: false, cancelled: true };
    }
  } else {
    // 클립보드 복사 폴백
    try {
      await navigator.clipboard.writeText(`${title}\n\n${text}`);
      return { success: true, clipboard: true };
    } catch {
      return { success: false, clipboard: false };
    }
  }
}
