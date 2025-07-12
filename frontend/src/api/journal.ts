import apiClient from './client';
import type {
  JournalEntry,
  JournalStats,
  CreateJournalEntryRequest,
  UpdateJournalEntryRequest,
  JournalListResponse,
} from '../types/journal';

interface ListJournalEntriesParams {
  page?: number;
  limit?: number;
  goalId?: string;
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

  async listEntries(params?: ListJournalEntriesParams): Promise<JournalListResponse> {
    const { data } = await apiClient.get<JournalListResponse>('/journal', { params });
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
};

export default journalApi;

export const {
  createEntry,
  getEntry,
  listEntries,
  updateEntry,
  deleteEntry,
  getStats,
} = journalApi;