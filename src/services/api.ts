import {
  Employe,
  TypeConge,
  Demande,
  DemandeWithDetails,
  Settings,
  AuditLog,
  FicheRecap,
  RankingAbsenteeism,
  DashboardStats,
} from '../types';

class ApiService {
  private currentUserName = 'Administrateur';

  public setUserName(name: string) {
    this.currentUserName = name;
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const headers = {
      'Content-Type': 'application/json',
      'x-user-name': this.currentUserName,
      ...(options.headers || {}),
    };

    const res = await fetch(endpoint, {
      ...options,
      headers,
    });

    if (!res.ok) {
      let errorMessage = `Erreur HTTP ${res.status}`;
      try {
        const body = await res.json();
        if (body.error) errorMessage = body.error;
      } catch (e) {
        // Fallback to text
        const text = await res.text();
        if (text) errorMessage = text;
      }
      throw new Error(errorMessage);
    }

    return res.json();
  }

  // Settings
  public async getSettings(): Promise<Settings> {
    return this.request<Settings>('/api/settings');
  }

  public async updateSettings(settings: Partial<Settings>): Promise<Settings> {
    return this.request<Settings>('/api/settings', {
      method: 'PUT',
      body: JSON.stringify(settings),
    });
  }

  // Reset demo data
  public async resetDemo(): Promise<{ success: boolean; message: string }> {
    return this.request<{ success: boolean; message: string }>('/api/demo/reset', {
      method: 'POST',
    });
  }

  // Employees
  public async getEmployees(filter?: {
    search?: string;
    direction?: string;
    sexe?: string;
    categorie?: string;
  }): Promise<Employe[]> {
    const params = new URLSearchParams();
    if (filter?.search) params.append('search', filter.search);
    if (filter?.direction) params.append('direction', filter.direction);
    if (filter?.sexe) params.append('sexe', filter.sexe);
    if (filter?.categorie) params.append('categorie', filter.categorie);
    const qs = params.toString();
    return this.request<Employe[]>(`/api/employees${qs ? `?${qs}` : ''}`);
  }

  public async getEmployeeByMatricule(matricule: string): Promise<Employe> {
    return this.request<Employe>(`/api/employees/${encodeURIComponent(matricule)}`);
  }

  public async addEmployee(
    data: Omit<Employe, 'id' | 'DateCreation'>
  ): Promise<Employe> {
    return this.request<Employe>('/api/employees', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  public async updateEmployee(id: string, data: Partial<Employe>): Promise<Employe> {
    return this.request<Employe>(`/api/employees/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  public async deleteEmployee(id: string): Promise<{ success: boolean; message: string }> {
    return this.request<{ success: boolean; message: string }>(`/api/employees/${id}`, {
      method: 'DELETE',
    });
  }

  // Leave types
  public async getLeaveTypes(search?: string): Promise<TypeConge[]> {
    const qs = search ? `?search=${encodeURIComponent(search)}` : '';
    return this.request<TypeConge[]>(`/api/leave-types${qs}`);
  }

  public async addLeaveType(data: Omit<TypeConge, 'id'>): Promise<TypeConge> {
    return this.request<TypeConge>('/api/leave-types', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  public async updateLeaveType(id: string, data: Partial<TypeConge>): Promise<TypeConge> {
    return this.request<TypeConge>(`/api/leave-types/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  public async deleteLeaveType(id: string): Promise<{ success: boolean; message: string }> {
    return this.request<{ success: boolean; message: string }>(`/api/leave-types/${id}`, {
      method: 'DELETE',
    });
  }

  // Leave requests
  public async getRequests(filter?: {
    matricule?: string;
    search?: string;
    direction?: string;
    annee?: number;
    codeType?: string;
    statut?: string;
  }): Promise<DemandeWithDetails[]> {
    const params = new URLSearchParams();
    if (filter?.matricule) params.append('matricule', filter.matricule);
    if (filter?.search) params.append('search', filter.search);
    if (filter?.direction) params.append('direction', filter.direction);
    if (filter?.annee) params.append('annee', String(filter.annee));
    if (filter?.codeType) params.append('codeType', filter.codeType);
    if (filter?.statut) params.append('statut', filter.statut);
    const qs = params.toString();
    return this.request<DemandeWithDetails[]>(`/api/requests${qs ? `?${qs}` : ''}`);
  }

  public async createRequest(data: any): Promise<DemandeWithDetails> {
    return this.request<DemandeWithDetails>('/api/requests', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  public async updateRequest(id: string, data: any): Promise<DemandeWithDetails> {
    return this.request<DemandeWithDetails>(`/api/requests/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  public async deleteRequest(id: string): Promise<{ success: boolean; message: string }> {
    return this.request<{ success: boolean; message: string }>(`/api/requests/${id}`, {
      method: 'DELETE',
    });
  }

  public async processValidation(
    id: string,
    action: 'ACCORDER' | 'REFUSER',
    validePar: string,
    observation?: string
  ): Promise<{
    demande: DemandeWithDetails;
    soldeDetails: any;
    alertMessage?: string;
  }> {
    return this.request<{
      demande: DemandeWithDetails;
      soldeDetails: any;
      alertMessage?: string;
    }>(`/api/requests/${id}/validate`, {
      method: 'POST',
      body: JSON.stringify({ action, validePar, observation }),
    });
  }

  // Individual recap
  public async getIndividualRecap(matricule: string, annee: number): Promise<FicheRecap> {
    return this.request<FicheRecap>(
      `/api/recap/${encodeURIComponent(matricule)}/${annee}`
    );
  }

  // All balances
  public async getAllBalances(
    annee: number,
    filter?: { direction?: string; categorie?: string; search?: string }
  ): Promise<any[]> {
    const params = new URLSearchParams();
    if (filter?.direction) params.append('direction', filter.direction);
    if (filter?.categorie) params.append('categorie', filter.categorie);
    if (filter?.search) params.append('search', filter.search);
    const qs = params.toString();
    return this.request<any[]>(`/api/balances/all/${annee}${qs ? `?${qs}` : ''}`);
  }

  // Dashboard Stats
  public async getDashboardStats(filter?: {
    annee?: number;
    direction?: string;
    categorie?: string;
  }): Promise<DashboardStats> {
    const params = new URLSearchParams();
    if (filter?.annee) params.append('annee', String(filter.annee));
    if (filter?.direction) params.append('direction', filter.direction);
    if (filter?.categorie) params.append('categorie', filter.categorie);
    const qs = params.toString();
    return this.request<DashboardStats>(`/api/stats/dashboard${qs ? `?${qs}` : ''}`);
  }

  // Absenteeism Ranking
  public async getAbsenteeismRanking(filter?: {
    annee?: number;
    direction?: string;
    categorie?: string;
  }): Promise<{
    ranking: RankingAbsenteeism[];
    totalJoursAbsenceCumules: number;
    totalEmployesConcernes: number;
    moyenneJoursParEmploye: number;
  }> {
    const params = new URLSearchParams();
    if (filter?.annee) params.append('annee', String(filter.annee));
    if (filter?.direction) params.append('direction', filter.direction);
    if (filter?.categorie) params.append('categorie', filter.categorie);
    const qs = params.toString();
    return this.request<{
      ranking: RankingAbsenteeism[];
      totalJoursAbsenceCumules: number;
      totalEmployesConcernes: number;
      moyenneJoursParEmploye: number;
    }>(`/api/stats/absenteeism${qs ? `?${qs}` : ''}`);
  }

  // Audit logs
  public async getAuditLogs(): Promise<AuditLog[]> {
    return this.request<AuditLog[]>('/api/audit-logs');
  }
}

export const api = new ApiService();
