jest.mock('@tanstack/react-query', () => ({
  useMutation: jest.fn(),
}));

jest.mock('@/services/api/authApi', () => ({
  authApi: {
    login: jest.fn(),
    register: jest.fn(),
  },
}));

jest.mock('@/store/useAuthStore', () => ({
  useAuthStore: jest.fn((selector) =>
    selector({ setAuth: jest.fn(), clearAuth: jest.fn() }),
  ),
}));

// Re-export the real extractErrorMessage — no mock needed for these tests
// because the hook's only contract is "null when no error, message when error".
jest.mock('@/services/api/client', () => jest.requireActual('@/services/api/client'));

import { useMutation } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { AxiosError } from 'axios';

const useMutationMock = useMutation as unknown as jest.Mock;

const buildMutationResult = (overrides: Partial<ReturnType<typeof useMutation>> = {}) =>
  ({
    mutate: jest.fn(),
    mutateAsync: jest.fn(),
    reset: jest.fn(),
    data: undefined,
    error: null,
    failureCount: 0,
    failureReason: null,
    isError: false,
    isIdle: true,
    isPending: false,
    isPaused: false,
    isSuccess: false,
    status: 'idle',
    variables: undefined,
    context: undefined,
    ...overrides,
  } as unknown as ReturnType<typeof useMutation>);

const installMutation = (...results: ReturnType<typeof useMutation>[]) => {
  useMutationMock.mockImplementation(() => {
    const next = results.shift();
    if (!next) throw new Error('not enough mocked mutations');
    return next;
  });
};

const makeAxiosErr = (status: number, body: any) =>
  new AxiosError(
    'Request failed',
    String(status),
    undefined,
    undefined,
    { status, data: body, statusText: '', headers: {}, config: {} as any } as any,
  );

describe('useAuth error surfacing', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns null error on initial render (no phantom banner)', () => {
    installMutation(buildMutationResult(), buildMutationResult());

    const result = useAuth();
    expect(result.error).toBeNull();
    expect(result.isLoading).toBe(false);
  });

  it('surfaces the API error message after failed login', () => {
    installMutation(
      buildMutationResult({
        error: makeAxiosErr(401, { message: 'Email ou senha incorretos.' }),
        isError: true,
      }),
      buildMutationResult(),
    );

    const result = useAuth();
    expect(result.error).toBe('Email ou senha incorretos.');
  });

  it('falls back to a status-code message when API returns no body', () => {
    installMutation(
      buildMutationResult({
        error: makeAxiosErr(500, {}),
        isError: true,
      }),
      buildMutationResult(),
    );

    const result = useAuth();
    expect(result.error).toBe('Erro interno do servidor. Tente novamente.');
  });

  it('prefers login error over register error', () => {
    installMutation(
      buildMutationResult({
        error: makeAxiosErr(401, { message: 'Email ou senha incorretos.' }),
        isError: true,
      }),
      buildMutationResult({
        error: makeAxiosErr(409, { message: 'Este email já está cadastrado.' }),
        isError: true,
      }),
    );

    const result = useAuth();
    expect(result.error).toBe('Email ou senha incorretos.');
  });
});
