import React from 'react';

/**
 * 정감 있는 제각(除角) 한우 벡터 라인 아이콘
 * (뾰족한 제각 뿔 흔적 + 턱선 정리된 비경 하단 핏)
 */
export default function CowIcon({ 
  size = 26, 
  strokeWidth = 1.35, 
  className = '', 
  color = 'currentColor' 
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      {/* 뾰족한 제각 뿔 흔적 (양쪽 귀 위 날렵한 짧은 뿔) */}
      <path d="M6.5 6.5L5.5 3.5 7.8 5" />
      <path d="M17.5 6.5L18.5 3.5 16.2 5" />
      {/* 둥근 이마선 */}
      <path d="M7.8 5c1.2-.8 2.6-1.2 4.2-1.2s3 .4 4.2 1.2" />
      {/* 부드러운 양쪽 귀 */}
      <path d="M6 7c-2.8-.5-4.5.5-5 2.8 1.8 1.2 3.8.7 5-1" />
      <path d="M18 7c2.8-.5 4.5.5 5 2.8-1.8 1.2-3.8.7-5-1" />
      {/* 볼선 (이중 턱선 제거하고 비경으로 단정하게 연결) */}
      <path d="M6 8v3.5c0 1.5.8 2.5 1.5 3" />
      <path d="M18 8v3.5c0 1.5-.8 2.5-1.5 3" />
      {/* 듬직하고 넓은 한우 비경 (얼굴 하단 형성) */}
      <path d="M7.5 14.5c0-1.2 2-1.8 4.5-1.8s4.5.6 4.5 1.8v2.5c0 1.5-2 2.2-4.5 2.2s-4.5-.7-4.5-2.2v-2.5z" />
      {/* 또렷하고 순한 두 눈 */}
      <circle cx="9" cy="10" r="1.1" fill={color} stroke="none" />
      <circle cx="15" cy="10" r="1.1" fill={color} stroke="none" />
      {/* 콧구멍 2개 */}
      <circle cx="10.2" cy="16.5" r="0.75" fill={color} stroke="none" />
      <circle cx="13.8" cy="16.5" r="0.75" fill={color} stroke="none" />
    </svg>
  );
}
