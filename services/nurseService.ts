import apiClient from '@/api/client';
import { API_CONFIG } from '@/api/config/api.config';

export interface NurseChatResponse {
  reply: string;
  sessionId: string;
}

export interface PrescriptionUploadResult {
  success: boolean;
  message: string;
  docId: string;
}

export interface PrescriptionFile {
  uri: string;
  name: string;
  mimeType?: string;
}

/**
 * AI Nurse ("Aria") API. The nurse already has the patient's vitals, alerts and
 * prescriptions server-side — the client only sends the message text.
 */
export const nurseService = {
  /** Send a chat message. Omit sessionId on the first call; pass it thereafter. */
  chat: async (message: string, sessionId?: string): Promise<NurseChatResponse> => {
    const body: { message: string; sessionId?: string } = { message };
    if (sessionId) body.sessionId = sessionId;

    const res = await apiClient.post(API_CONFIG.ENDPOINTS.NURSE.CHAT, body);
    // Tolerate either a direct body or one wrapped in { data: ... }.
    const payload = res.data?.data ?? res.data ?? {};
    return {
      reply: typeof payload.reply === 'string' ? payload.reply : '',
      sessionId: payload.sessionId ?? sessionId ?? '',
    };
  },

  /** Upload a prescription document (multipart, field name "file"). */
  uploadPrescription: async (file: PrescriptionFile): Promise<PrescriptionUploadResult> => {
    const form = new FormData();
    form.append('file', {
      uri: file.uri,
      name: file.name,
      type: file.mimeType || 'application/octet-stream',
    } as any);

    const res = await apiClient.post(API_CONFIG.ENDPOINTS.NURSE.UPLOAD_PRESCRIPTION, form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    const payload = res.data?.data ?? res.data ?? {};
    return {
      success: payload.success ?? true,
      message: payload.message ?? 'Prescription uploaded',
      docId: payload.docId ?? '',
    };
  },
};
