import apiClient from './client';
import type {
  JournalEntry,
  JournalStats,
  CreateJournalEntryRequest,
  UpdateJournalEntryRequest,
  SharedJournalsResponse,
  SharedJournalItem,
} from '../types/journal';

interface ListJournalEntriesParams {
  page?: number;
  limit?: number;
  goalId?: string;
  filter?: 'owned' | 'shared-with-me' | 'shared-by-me' | 'all';
}

const journalApi = {
  async createEntry(data: CreateJournalEntryRequest): Promise<JournalEntry> {
    const { data: response } = await apiClient.post<JournalEntry>('/journal', data);
    return response;
  },

  async getEntry(entryId: string): Promise<JournalEntry> {
    const { data } = await apiClient.get<JournalEntry>(`/journal/${entryId}`);
    return data;
  },

  async listEntries(params?: ListJournalEntriesParams): Promise<SharedJournalsResponse> {
    const { data } = await apiClient.get<SharedJournalsResponse>('/journal', { params });
    return data;
  },

  async updateEntry(entryId: string, data: UpdateJournalEntryRequest): Promise<JournalEntry> {
    const { data: response } = await apiClient.put<JournalEntry>(`/journal/${entryId}`, data);
    return response;
  },

  async deleteEntry(entryId: string): Promise<void> {
    await apiClient.delete(`/journal/${entryId}`);
  },

  async getStats(): Promise<JournalStats> {
    const { data } = await apiClient.get<JournalStats>('/journal/stats');
    return data;
  },

  // Deprecated - use listEntries with filter parameter instead
  async getSharedJournals(filter?: string): Promise<SharedJournalItem[]> {
    const response = await listEntries({ filter: (filter as 'owned' | 'shared-with-me' | 'shared-by-me' | 'all') || 'all' });
    return response.entries.filter((e): e is SharedJournalItem => 
      'shareInfo' in e && e.shareInfo !== undefined
    );
  },

  async shareJournal(entryId: string, recipientEmail: string, permissions: string[], expiresInHours: number): Promise<{ shareId: string }> {
    const { data } = await apiClient.post<{ shareId: string }>(`/journal/${entryId}/share`, {
      recipientEmail,
      permissions,
      expiresInHours
    });
    return data;
  },

  async revokeShare(shareId: string): Promise<void> {
    await apiClient.delete(`/journal/shares/${shareId}`);
  },
};

export default journalApi;

export const {
  createEntry,
  getEntry,
  listEntries,
  updateEntry,
  deleteEntry,
  getStats,
  getSharedJournals,
  shareJournal,
  revokeShare,
} = journalApi;