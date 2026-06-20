# TASK-014: Auth Gate e Hidratação no Mobile

**Prioridade:** 🔴 CRÍTICA
**Estimativa:** 3h
**Dependências:** TASK-013
**Status:** ⬜ Pendente

## Objetivo

Implementar auth gate com root navigator condicional. Garantir que o token é hidratado no boot antes de renderizar a árvore. Eliminar race conditions e estado inconsistente.

## Escopo

### A. Hidratação
**Arquivos:**
- `perfectjob-mobile/App.tsx`
- `perfectjob-mobile/src/store/useAuthStore.ts`
- `perfectjob-mobile/src/components/SplashScreen.tsx` (criar)

**Ações:**
1. Atualizar `useAuthStore.loadToken()`:
   - Ler token do SecureStore
   - Se token existe, decodificar JWT para extrair expiração
   - Se expirado, deletar e setar `isAuthenticated: false`
   - Se válido, setar `isAuthenticated: true` (e `user` decodificado)
   - Opcionalmente, fazer `GET /v1/auth/me` para validar com backend

2. Criar `SplashScreen`:
```typescript
export function SplashScreen() {
  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color={colors.primary[500]} />
    </View>
  );
}
```

3. Atualizar `App.tsx`:
```typescript
export default function App() {
  const loadToken = useAuthStore(s => s.loadToken);
  const [isReady, setIsReady] = useState(false);
  
  useEffect(() => {
    loadToken().finally(() => setIsReady(true));
  }, [loadToken]);
  
  if (!isReady) return <SplashScreen />;
  
  return (
    <QueryClientProvider client={queryClient}>
      <NavigationContainer>
        <RootNavigator />
      </NavigationContainer>
    </QueryClientProvider>
  );
}
```

### B. Auth Gate
**Arquivos:**
- `perfectjob-mobile/src/navigation/RootNavigator.tsx`
- `perfectjob-mobile/src/navigation/AuthNavigator.tsx` (criar)
- `perfectjob-mobile/src/navigation/MainNavigator.tsx` (criar)

**Ações:**
1. Refatorar `RootNavigator`:
```typescript
export function RootNavigator() {
  const isAuthenticated = useAuthStore(s => s.isAuthenticated);
  
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {isAuthenticated ? (
        <Stack.Screen name="Main" component={MainNavigator} />
      ) : (
        <Stack.Screen name="Auth" component={AuthNavigator} />
      )}
    </Stack.Navigator>
  );
}
```

2. Criar `AuthNavigator`:
```typescript
export function AuthNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Register" component={RegisterScreen} />
    </Stack.Navigator>
  );
}
```

3. Criar `MainNavigator` (substitui o antigo `RootNavigator.Main`):
```typescript
export function MainNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Tabs" component={TabNavigator} />
      <Stack.Screen name="JobDetail" component={JobDetailScreen} />
    </Stack.Navigator>
  );
}
```

4. Atualizar tipos:
```typescript
export type RootStackParamList = {
  Auth: undefined;
  Main: undefined;
};

export type MainStackParamList = {
  Tabs: NavigatorScreenParams<TabParamList> | undefined;
  JobDetail: { slug: string };
};

export type AuthStackParamList = {
  Login: undefined;
  Register: undefined;
};
```

### C. Logout Limpo
**Arquivos:**
- `perfectjob-mobile/src/screens/profile/ProfileScreen.tsx`
- `perfectjob-mobile/src/store/useAuthStore.ts`

**Ações:**
1. Garantir que `logout()` limpa tudo:
   - SecureStore.removeItemAsync
   - Reset Zustand state
   - Limpar cache do TanStack Query (`queryClient.clear()`)
2. `navigation.reset` não é mais necessário (RootNavigator detecta mudança)

### D. JobDetail Fluxo de Auth
**Arquivos:**
- `perfectjob-mobile/src/screens/job-detail/JobDetailScreen.tsx`

**Ações:**
1. Se `!isAuthenticated` e user tenta candidatar-se:
   - Navegar para `Auth` (que é Login)
   - Após login, voltar para JobDetail (deep link)
2. Em vez de modal, redirecionar

### E. Tests
**Arquivos:**
- `perfectjob-mobile/__tests__/store/useAuthStore.test.ts` (criar)
- `perfectjob-mobile/__tests__/navigation/RootNavigator.test.tsx` (criar)

**Ações:**
1. Mockar SecureStore
2. Testar que `loadToken` lê do storage
3. Testar que token expirado deleta
4. Testar que RootNavigator renderiza AuthStack quando deslogado
5. Testar que RootNavigator renderiza MainStack quando logado

## Critérios de Aceite

- [ ] App reabre logado (se token ainda válido)
- [ ] App reabre deslogado (se token expirou ou não existe)
- [ ] Splash screen aparece durante hidratação
- [ ] Não há flicker de Login → Main (decisão única no boot)
- [ ] Não há como acessar Main sem login
- [ ] Login navega para Main (sem stack confuso)
- [ ] Logout volta para Login (sem stack confuso)
- [ ] 401 mid-session faz logout + volta para Login
- [ ] Cache do TanStack Query é limpo no logout
- [ ] Testes de auth passam

## Como Testar

### Manual
```bash
# 1. Login no app
# 2. Fechar app completamente
# 3. Reabrir app
# 4. Deve ir direto para Home (logado)

# 5. Logout
# 6. Fechar app
# 7. Reabrir
# 8. Deve ir para Login

# 9. Login → fechar app → esperar 16 min (token expira) → reabrir
# 10. Deve ir para Login
```

### Automatizado
```typescript
test('RootNavigator renders Auth when not authenticated', () => {
  useAuthStore.setState({ isAuthenticated: false });
  const { getByText } = render(<RootNavigator />);
  expect(getByText('Entrar')).toBeTruthy();
});

test('RootNavigator renders Main when authenticated', () => {
  useAuthStore.setState({ isAuthenticated: true });
  const { getByText } = render(<RootNavigator />);
  expect(getByText('Início')).toBeTruthy();
});

test('loadToken reads from SecureStore', async () => {
  (SecureStore.getItemAsync as jest.Mock).mockResolvedValue('valid.token.here');
  await useAuthStore.getState().loadToken();
  expect(useAuthStore.getState().isAuthenticated).toBe(true);
});
```

## Arquivos Criados/Modificados

- `App.tsx` (modificar)
- `src/components/SplashScreen.tsx` (criar)
- `src/store/useAuthStore.ts` (modificar)
- `src/navigation/RootNavigator.tsx` (modificar)
- `src/navigation/AuthNavigator.tsx` (criar)
- `src/navigation/MainNavigator.tsx` (criar)
- `src/navigation/TabNavigator.tsx` (verificar)
- `src/navigation/types.ts` (modificar)
- `src/screens/auth/LoginScreen.tsx` (modificar — não usa mais reset)
- `src/screens/auth/RegisterScreen.tsx` (modificar)
- `src/screens/profile/ProfileScreen.tsx` (modificar)
- `src/screens/job-detail/JobDetailScreen.tsx` (modificar)
- `__tests__/store/useAuthStore.test.ts` (criar)
- `__tests__/navigation/RootNavigator.test.tsx` (criar)

## Notas

- Decodificar JWT no client não substitui validação no server (mas é útil para UX)
- Para refresh tokens, considerar mover para uma task futura
- `queryClient.clear()` no logout evita dados de usuário anterior vazarem
- RootNavigator deve ser `useMemo` ou apenas renderizar condicional simples (evitar re-renders)
