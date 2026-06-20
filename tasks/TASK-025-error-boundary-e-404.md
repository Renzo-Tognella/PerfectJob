# TASK-025: ErrorBoundary e Página 404

**Prioridade:** MEDIA
**Estimativa:** 1.5h
**Dependências:** TASK-022
**Status:** Pendente

## Objetivo

Adicionar ErrorBoundary global para capturar erros de render. Adicionar página 404 customizada. Melhorar resiliência da aplicação.

## Escopo

### A. ErrorBoundary
**Arquivos:**
- `src/components/ErrorBoundary.tsx` (criar)
- `src/App.tsx` (modificar)

**Ações:**
1. Criar ErrorBoundary como class component (única forma):
```typescript
interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<{ children: ReactNode }, State> {
  state: State = { hasError: false, error: null };
  
  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }
  
  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught:', error, errorInfo);
    // TODO: enviar para Sentry/etc
  }
  
  render() {
    if (this.state.hasError) {
      return <ErrorFallback error={this.state.error} />;
    }
    return this.props.children;
  }
}
```

2. Criar `ErrorFallback` component
3. Embrulhar `<App />` no `main.tsx`

### B. NotFoundPage
**Arquivos:**
- `src/pages/NotFoundPage.tsx` (criar)
- `src/App.tsx` (modificar — adicionar rota `*`)

**Ações:**
1. Layout amigável
2. Botão para voltar ao Dashboard
3. Link de suporte

### C. useErrorHandler Hook
**Arquivos:**
- `src/hooks/useErrorHandler.ts` (criar)

**Ações:**
1. Hook para capturar erros em event handlers e async code
2. Mostra toast de erro

### D. Tests
**Arquivos:**
- `src/components/ErrorBoundary.test.tsx` (criar)

## Critérios de Aceite

- [ ] Erro de render não derruba o app
- [ ] ErrorFallback é mostrado
- [ ] `/rota-inexistente` renderiza NotFoundPage
- [ ] Em DEV, ErrorFallback mostra stack trace
- [ ] Em PROD, ErrorFallback mostra mensagem amigável

## Como Testar

### Manual
```bash
# 1. Provocar erro de render (e.g., acessar propriedade de undefined)
# 2. App deve mostrar ErrorFallback
# 3. Botão "Tentar novamente" deve voltar a funcionar
# 4. Acessar /rota-inexistente: deve mostrar 404
```

### Automatizado
```typescript
test('ErrorBoundary catches render error', () => {
  const ThrowError = () => { throw new Error('Test error'); };
  const { getByText } = render(
    <ErrorBoundary>
      <ThrowError />
    </ErrorBoundary>
  );
  expect(getByText(/Algo deu errado/i)).toBeInTheDocument();
});
```

## Arquivos Criados/Modificados

- `src/components/ErrorBoundary.tsx` (criar)
- `src/components/ErrorFallback.tsx` (criar)
- `src/pages/NotFoundPage.tsx` (criar)
- `src/hooks/useErrorHandler.ts` (criar)
- `src/main.tsx` (modificar — embrulhar com ErrorBoundary)
- `src/App.tsx` (modificar — adicionar rota *)
- `src/components/ErrorBoundary.test.tsx` (criar)
