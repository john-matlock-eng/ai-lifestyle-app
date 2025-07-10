import { describe, it, expect, vi, beforeEach, afterEach, type Mock } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useTemplateRegistry } from '../useTemplateRegistry';

describe('useTemplateRegistry', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    (global as unknown as { fetch: unknown }).fetch = vi.fn();
    (global as unknown as Record<string, unknown>).__USE_FETCH_TEMPLATES__ = true;
  });

  afterEach(() => {
    delete (global as unknown as Record<string, unknown>).__USE_FETCH_TEMPLATES__;
  });

  it('skips invalid templates', async () => {
    const fetchMock = global.fetch as unknown as Mock;
    fetchMock.mockResolvedValueOnce({ ok: true, json: async () => ['/bad.json'] });
    fetchMock.mockResolvedValueOnce({ ok: true, json: async () => ({ foo: 'bar' }) });

    const { result } = renderHook(() => useTemplateRegistry());
    await waitFor(() => !result.current.loading);
    expect(result.current.templates.length).toBe(0);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('skips template with invalid privacy', async () => {
    const fetchMock = global.fetch as unknown as Mock;
    fetchMock.mockResolvedValueOnce({ ok: true, json: async () => ['/bad.json'] });
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        id: 't1',
        name: 'Bad',
        version: 1,
        sections: [
          { id: 's1', title: 'S1', placeholder: 'x', defaultPrivacy: 'invalid' },
        ],
      }),
    });

    const { result } = renderHook(() => useTemplateRegistry());
    await waitFor(() => !result.current.loading);
    expect(result.current.templates.length).toBe(0);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('migrates template when version differs', async () => {
    const fetchMock = global.fetch as unknown as Mock;
    fetchMock.mockResolvedValueOnce({ ok: true, json: async () => ['/v2.json'] });
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ id: 't2', name: 'Two', version: 2, sections: [] }),
    });

    const { result } = renderHook(() => useTemplateRegistry());
    await waitFor(() => !result.current.loading);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });
});
