import { describe, it, expect, vi, beforeEach } from 'vitest';
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
    const fetchMock = global.fetch as unknown as vi.Mock;
    fetchMock.mockResolvedValueOnce({ ok: true, json: async () => ['/bad.json'] });
    fetchMock.mockResolvedValueOnce({ ok: true, json: async () => ({ foo: 'bar' }) });

    const { result } = renderHook(() => useTemplateRegistry());
    await waitFor(() => result.current.length === 0);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });
});
