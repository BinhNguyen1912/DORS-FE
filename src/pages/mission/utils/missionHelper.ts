import type { SosRequestItem } from '../../sos-request/components/mockData';

/**
 * Maps raw backend SOS request entity/DTO structure to frontend SosRequestItem format
 * consumed by RequestList and RequestDetail components.
 */
export function mapSosRequestToItem(item: any): SosRequestItem {
  return {
    id: item.id,
    code: `SOS-2026-${String(item.id).padStart(4, '0')}`,
    title: `Cứu hộ khẩn cấp: ${
      item.requestType === 'FLOOD'
        ? 'Ngập lụt'
        : item.requestType === 'MEDICAL'
        ? 'Y tế khẩn cấp'
        : item.requestType === 'FOOD'
        ? 'Tiếp tế lương thực'
        : item.requestType
    }`,
    requesterName: item.requesterName || 'Người dân ẩn danh',
    requesterPhone: item.requesterPhone || 'Không có',
    createdAt: new Date(item.createdAt),
    locationName: item.description || 'Hiện trường SOS',
    addressDetail: item.description || 'Hiện trường SOS',
    severity: item.severity,
    status: item.status,
    description: item.description || '',
    lat: item.latitude || item.location?.coordinates?.[1] || 10.7989,
    lng: item.longitude || item.location?.coordinates?.[0] || 106.6804,
    floodDepth: '0 cm',
    estimatedArea: '0 ha',
    impact: 'Nguy hiểm',
    roadType: 'Không rõ',
    source:
      item.source === 'APP'
        ? 'Ứng dụng di động'
        : item.source === 'WEB'
        ? 'Cổng thông tin Web'
        : item.source || 'Không rõ',
    device: 'Không rõ',
    weather: 'Không rõ',
    notes: item.resolutionNotes || '',
    imageUrls: Array.isArray(item.imageUrls) ? item.imageUrls : [],
    purpose: 'REQUEST_SUPPORT' as const,
    isApprovedForMap: true,
    assignedTeamId: item.assignedTeamId,
    assignedTeam: item.assignedTeam,
  } as any;
}
