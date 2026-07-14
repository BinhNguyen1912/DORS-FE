import React from 'react';

export const ROLES = [
  { key: 'leader', label: 'Leader đội cứu hộ' },
  { key: 'admin', label: 'Admin tỉnh' },
  { key: 'citizen', label: 'Người dân' },
  { key: 'volunteer', label: 'Tình nguyện viên' },
  { key: 'dispatcher', label: 'Điều phối viên' }
];

export const isUserInRole = (user: any, roleKey: string): boolean => {
  const userRole = (user.role || '').toUpperCase();
  if (roleKey === 'leader') {
    return userRole.includes('LEADER') || user.userRoles?.some((ur: any) => (ur.role?.name || '').toUpperCase().includes('LEADER'));
  }
  if (roleKey === 'admin') {
    return userRole.includes('ADMIN') || user.userRoles?.some((ur: any) => (ur.role?.name || '').toUpperCase().includes('ADMIN'));
  }
  if (roleKey === 'citizen') {
    return user.needsHelp === true || userRole === 'CITIZEN' || userRole === 'USER' || userRole === '';
  }
  if (roleKey === 'volunteer') {
    return user.isVolunteer === true || userRole.includes('VOLUNTEER');
  }
  if (roleKey === 'dispatcher') {
    return userRole.includes('DISPATCH') || user.userRoles?.some((ur: any) => (ur.role?.name || '').toUpperCase().includes('DISPATCHER'));
  }
  return false;
};

export const renderFormattedText = (text: string): React.ReactElement | string => {
  if (!text) return '';
  const parsed = text
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/__(.*?)__/g, '<strong>$1</strong>')
    .replace(/_(.*?)_/g, '<em>$1</em>');
  return React.createElement('span', { dangerouslySetInnerHTML: { __html: parsed } });
};
