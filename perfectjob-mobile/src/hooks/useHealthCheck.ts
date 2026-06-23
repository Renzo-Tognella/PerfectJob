import { useQuery } from '@tanstack/react-query';
import { ENV } from '@/config/env';

const HEALTH_PROBE_TIMEOUT_MS = 5_000;
const HEALTH_STALE_TIME_MS = 30_000;

async function probeHealth(): Promise<boolean> {
  const base = ENV.API_URL.replace(/\/api\/?$/, '');
  const url = `${base}/actuator/health`;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), HEALTH_PROBE_TIMEOUT_MS);
  try {
    const res = await fetch(url, { signal: controller.signal });
    return res.ok;
  } catch {
    return false;
  } finally {
    clearTimeout(timer);
  }
}

export function useHealthCheck() {
  return useQuery({
    queryKey: ['health'],
    queryFn: probeHealth,
    staleTime: HEALTH_STALE_TIME_MS,
    refetchOnWindowFocus: true,
    retry: 1,
  });
}

export function useIsBackendReachable(): boolean {
  const { data } = useHealthCheck();
  return data !== false;
}
