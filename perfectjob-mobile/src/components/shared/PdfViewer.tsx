import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, ActivityIndicator, TouchableOpacity,
} from 'react-native';
import { WebView } from 'react-native-webview';
import { colors } from '@/design-system/tokens/colors';
import { typography } from '@/design-system/tokens/typography';
import { spacing } from '@/design-system/tokens/spacing';
import { radius } from '@/design-system/tokens/radius';
import { resumeApi } from '@/services/api/resumeApi';

type Status = 'idle' | 'downloading' | 'ready' | 'error';

interface Props {
  resumeId: number;
  onError?: (error: unknown) => void;
}

export default function PdfViewer({ resumeId, onError }: Props) {
  const [status, setStatus] = useState<Status>('idle');
  const [localUri, setLocalUri] = useState<string | null>(null);

  const download = React.useCallback(async () => {
    setStatus('downloading');
    try {
      const uri = await resumeApi.getPdfUri(resumeId);
      setLocalUri(uri);
      setStatus('ready');
    } catch (e) {
      setStatus('error');
      onError?.(e);
    }
  }, [resumeId, onError]);

  useEffect(() => {
    download();
  }, [download]);

  if (status === 'downloading' || status === 'idle') {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={colors.primary[500]} />
        <Text style={styles.loadingText}>Carregando currículo...</Text>
      </View>
    );
  }

  if (status === 'error') {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorTitle}>Não foi possível carregar o currículo</Text>
        <TouchableOpacity style={styles.retryBtn} onPress={download}>
          <Text style={styles.retryBtnText}>Tentar novamente</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <WebView
      source={{ uri: localUri ?? '' }}
      style={styles.webview}
      originWhitelist={['*']}
      allowFileAccess
      mixedContentMode="always"
    />
  );
}

const styles = StyleSheet.create({
  webview: { flex: 1, backgroundColor: colors.neutral[100] },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing[6],
    backgroundColor: colors.neutral[50],
  },
  loadingText: {
    marginTop: spacing[3],
    fontSize: typography.fontSize.body,
    color: colors.neutral[600],
  },
  errorTitle: {
    fontSize: typography.fontSize.h4,
    fontWeight: typography.fontWeight.semibold as any,
    color: colors.neutral[800],
    textAlign: 'center',
    marginBottom: spacing[4],
  },
  retryBtn: {
    backgroundColor: colors.primary[500],
    paddingHorizontal: spacing[6],
    paddingVertical: spacing[3],
    borderRadius: radius.md,
  },
  retryBtnText: {
    color: colors.white,
    fontSize: typography.fontSize.body,
    fontWeight: typography.fontWeight.semibold as any,
  },
});
