import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, SafeAreaView, StatusBar, ActivityIndicator,
} from 'react-native';
import { useRoute, useNavigation, RouteProp, CommonActions } from '@react-navigation/native';
import { colors } from '@/design-system/tokens/colors';
import { typography } from '@/design-system/tokens/typography';
import { spacing } from '@/design-system/tokens/spacing';
import Icon from '@/components/ui/Icon';
import PdfViewer from '@/components/shared/PdfViewer';
import { resumeApi, isResumePdfError } from '@/services/api/resumeApi';
import { useAuthStore } from '@/store/useAuthStore';
import type { MainStackParamList } from '@/navigation/types';

interface PdfErrorState {
  status?: number;
  reason?: 'http' | 'content-type' | 'empty-body' | 'download';
  message: string;
}

export default function ResumePreviewScreen() {
  const route = useRoute<RouteProp<MainStackParamList, 'ResumePreview'>>();
  const navigation = useNavigation<any>();
  const { resumeId } = route.params;
  const clearAuth = useAuthStore((s) => s.clearAuth);
  const [pdfError, setPdfError] = useState<PdfErrorState | null>(null);

  const handlePdfError = (error: unknown) => {
    if (isResumePdfError(error)) {
      const status = error.status;
      if (status === 401) {
        clearAuth();
        navigation.dispatch(
          CommonActions.reset({
            index: 0,
            routes: [{ name: 'Auth', params: { screen: 'Login' } }],
          }),
        );
        return;
      }
      if (status === 403) {
        setPdfError({
          status,
          reason: error.reason,
          message: 'Você não tem permissão para visualizar este currículo.',
        });
        return;
      }
      if (status === 404) {
        setPdfError({
          status,
          reason: error.reason,
          message: 'Currículo não encontrado.',
        });
        return;
      }
      if (status >= 500) {
        setPdfError({
          status,
          reason: error.reason,
          message: 'Erro no servidor ao carregar o currículo. Tente novamente.',
        });
        return;
      }
      if (error.reason === 'content-type') {
        setPdfError({ status, reason: error.reason, message: error.message });
        return;
      }
      if (error.reason === 'empty-body') {
        setPdfError({ status, reason: error.reason, message: error.message });
        return;
      }
      setPdfError({ status, reason: error.reason, message: error.message });
      return;
    }
    setPdfError({
      message: 'Não foi possível carregar o currículo. Verifique sua conexão.',
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />

      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backBtn}
          accessibilityRole="button"
          accessibilityLabel="Voltar"
        >
          <Icon family="MaterialIcons" name="arrow-back" size={22} color={colors.neutral[800]} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Currículo</Text>
        <View style={styles.headerSpacer} />
      </View>

      {pdfError ? (
        <View style={styles.errorWrap}>
          <Icon family="MaterialIcons" name="error-outline" size={48} color={colors.error.DEFAULT} />
          <Text style={styles.errorTitle}>{pdfError.message}</Text>
          <TouchableOpacity
            style={styles.errorBtn}
            onPress={() => {
              if (pdfError.status === 403 || pdfError.status === 404) {
                navigation.goBack();
              } else {
                setPdfError(null);
              }
            }}
          >
            <Text style={styles.errorBtnText}>
              {pdfError.status === 403 || pdfError.status === 404 ? 'Voltar' : 'Tentar novamente'}
            </Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.viewerContainer}>
          <PdfViewer resumeId={resumeId} onError={handlePdfError} />
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.white },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[2],
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral[200],
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: typography.fontSize.h5,
    fontWeight: typography.fontWeight.semibold as '600',
    color: colors.neutral[900],
  },
  headerSpacer: { width: 40, height: 40 },
  backBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: colors.neutral[100],
    alignItems: 'center', justifyContent: 'center',
  },
  viewerContainer: { flex: 1 },
  errorWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing[6],
    gap: spacing[4],
  },
  errorTitle: {
    fontSize: typography.fontSize.h5,
    color: colors.neutral[800],
    textAlign: 'center',
    fontWeight: typography.fontWeight.semibold as '600',
  },
  errorBtn: {
    backgroundColor: colors.primary[500],
    paddingHorizontal: spacing[6],
    paddingVertical: spacing[3],
    borderRadius: 12,
  },
  errorBtnText: {
    color: colors.white,
    fontSize: typography.fontSize.body,
    fontWeight: typography.fontWeight.semibold as '600',
  },
});
