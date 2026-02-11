/**
 * Migration Service
 * Handles QuickBooks migration API calls
 */

const API_BASE = "/api";

interface MigrationResult {
  migrationId: string;
  durationMinutes: number;
  summary: {
    accountsImported: number;
    transactionsImported: number;
    customersImported: number;
    vendorsImported: number;
    invoicesImported: number;
    categorizedTransactions: number;
    categorizationAccuracy: number;
  };
  errors: string[];
  warnings: string[];
}

interface MigrationStatus {
  migrationId: string;
  status: "pending" | "processing" | "completed" | "failed";
  progress: number;
  currentStep: string;
  startedAt: string;
  completedAt?: string;
  summary?: MigrationResult["summary"];
  errors: string[];
}

class MigrationService {
  private getAuthHeaders(): HeadersInit {
    const token = localStorage.getItem("token");
    return {
      Authorization: token ? `Bearer ${token}` : "",
    };
  }

  async importQBO(
    file: File,
  ): Promise<{ success: boolean; data: MigrationResult }> {
    const formData = new FormData();
    formData.append("file", file);

    const response = await fetch(`${API_BASE}/migration/qbo`, {
      method: "POST",
      headers: {
        Authorization: localStorage.getItem("token")
          ? `Bearer ${localStorage.getItem("token")}`
          : "",
      },
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Failed to import QBO file");
    }

    return response.json();
  }

  async importIIF(
    file: File,
  ): Promise<{ success: boolean; data: MigrationResult }> {
    const formData = new FormData();
    formData.append("file", file);

    const response = await fetch(`${API_BASE}/migration/iif`, {
      method: "POST",
      headers: {
        Authorization: localStorage.getItem("token")
          ? `Bearer ${localStorage.getItem("token")}`
          : "",
      },
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Failed to import IIF file");
    }

    return response.json();
  }

  async getMigrationStatus(
    migrationId: string,
  ): Promise<{ success: boolean; data: MigrationStatus }> {
    const response = await fetch(
      `${API_BASE}/migration/${migrationId}/status`,
      {
        headers: this.getAuthHeaders(),
      },
    );

    if (!response.ok) {
      throw new Error("Failed to get migration status");
    }

    return response.json();
  }

  async getSupportedFormats(): Promise<{
    success: boolean;
    data: { formats: string[]; descriptions: Record<string, string> };
  }> {
    const response = await fetch(`${API_BASE}/migration/supported-formats`, {
      headers: this.getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error("Failed to get supported formats");
    }

    return response.json();
  }

  validateFile(file: File): { valid: boolean; error?: string } {
    const allowedExtensions = [".qbo", ".iif", ".ofx", ".qfx"];
    const maxSize = 50 * 1024 * 1024; // 50MB

    const ext = file.name.toLowerCase().slice(file.name.lastIndexOf("."));

    if (!allowedExtensions.includes(ext)) {
      return {
        valid: false,
        error: `Invalid file type. Allowed: ${allowedExtensions.join(", ")}`,
      };
    }

    if (file.size > maxSize) {
      return {
        valid: false,
        error: "File size exceeds 50MB limit",
      };
    }

    return { valid: true };
  }

  getFileType(file: File): "qbo" | "iif" | "ofx" | "qfx" | null {
    const ext = file.name.toLowerCase().slice(file.name.lastIndexOf("."));
    if ([".qbo", ".ofx", ".qfx"].includes(ext)) return "qbo";
    if (ext === ".iif") return "iif";
    return null;
  }
}

export const migrationService = new MigrationService();
export default migrationService;
