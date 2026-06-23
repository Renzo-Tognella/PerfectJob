jest.mock('@tanstack/react-query', () => ({
  useQuery: jest.fn(),
}));

jest.mock('@/config/env', () => ({
  ENV: { API_URL: 'http://example.test/api' },
}));

import { useQuery } from '@tanstack/react-query';
import { useHealthCheck, useIsBackendReachable } from '@/hooks/useHealthCheck';

const useQueryMock = useQuery as unknown as jest.Mock;

describe('useHealthCheck', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  function installResult(data: boolean | undefined) {
    useQueryMock.mockReturnValue({
      data,
      isLoading: data === undefined,
      isError: false,
      refetch: jest.fn(),
    });
  }

  it('returns false when the query data is false (backend unreachable)', () => {
    installResult(false);
    expect(useIsBackendReachable()).toBe(false);
  });

  it('returns true when the query data is true (backend reachable)', () => {
    installResult(true);
    expect(useIsBackendReachable()).toBe(true);
  });

  it('returns true during loading (data is undefined) — do not block UI before first probe', () => {
    installResult(undefined);
    expect(useIsBackendReachable()).toBe(true);
  });

  it('uses the correct query key, 30s staleTime, retry 1, refetchOnWindowFocus', () => {
    useQueryMock.mockReturnValue({ data: true });
    useHealthCheck();
    expect(useQueryMock).toHaveBeenCalledWith(
      expect.objectContaining({
        queryKey: ['health'],
        staleTime: 30_000,
        retry: 1,
        refetchOnWindowFocus: true,
      }),
    );
  });
});
