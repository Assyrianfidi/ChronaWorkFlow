import { ReportFormValues } from '../types/reportForm';

const API_BASE_URL = '/api/reports';

/**
 * Fetches a report by its ID
 */
export const getReport = async (id: string) => {
  const response = await fetch(`${API_BASE_URL}/${id}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to fetch report');
  }

  return response.json();
};

/**
 * Creates a new report
 */
export const createReport = async (data: ReportFormValues) => {
  const formData = new FormData();
  
  // Append all form fields to FormData
  Object.entries(data).forEach(([key, value]) => {
    if (key === 'attachments') {
      // Handle file uploads
      (value as File[]).forEach((file) => {
        formData.append('attachments', file);
      });
    } else if (Array.isArray(value)) {
      // Handle arrays (like tags)
      value.forEach((item) => {
        formData.append(key, item);
      });
    } else if (value !== undefined && value !== null) {
      // Handle all other fields
      formData.append(key, value as string | Blob);
    }
  });

  const response = await fetch(API_BASE_URL, {
    method: 'POST',
    body: formData,
    credentials: 'include',
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to create report');
  }

  return response.json();
};

/**
 * Updates an existing report
 */
export const updateReport = async (id: string, data: Partial<ReportFormValues>) => {
  const formData = new FormData();
  
  // Append all form fields to FormData
  Object.entries(data).forEach(([key, value]) => {
    if (key === 'attachments') {
      // Handle file uploads
      (value as File[]).forEach((file) => {
        formData.append('attachments', file);
      });
    } else if (Array.isArray(value)) {
      // Handle arrays (like tags)
      value.forEach((item) => {
        formData.append(key, item);
      });
    } else if (value !== undefined && value !== null) {
      // Handle all other fields
      formData.append(key, value as string | Blob);
    }
  });

  const response = await fetch(`${API_BASE_URL}/${id}`, {
    method: 'PATCH',
    body: formData,
    credentials: 'include',
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to update report');
  }

  return response.json();
};

/**
 * Deletes a report
 */
export const deleteReport = async (id: string) => {
  const response = await fetch(`${API_BASE_URL}/${id}`, {
    method: 'DELETE',
    credentials: 'include',
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to delete report');
  }

  return response.json();
};

/**
 * Uploads an attachment to a report
 */
export const uploadAttachment = async (reportId: string, file: File) => {
  const formData = new FormData();
  formData.append('file', file);

  const response = await fetch(`${API_BASE_URL}/${reportId}/attachments`, {
    method: 'POST',
    body: formData,
    credentials: 'include',
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to upload attachment');
  }

  return response.json();
};

/**
 * Deletes an attachment from a report
 */
export const deleteAttachment = async (reportId: string, attachmentId: string) => {
  const response = await fetch(`${API_BASE_URL}/${reportId}/attachments/${attachmentId}`, {
    method: 'DELETE',
    credentials: 'include',
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to delete attachment');
  }

  return response.json();
};
