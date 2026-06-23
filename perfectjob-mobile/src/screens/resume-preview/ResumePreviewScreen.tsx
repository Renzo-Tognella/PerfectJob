import React from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, SafeAreaView, StatusBar,
} from 'react-native';
import { useRoute, useNavigation, RouteProp } from '@react-navigation/native';
import { colors } from '@/design-system/tokens/colors';
import { typography } from '@/design-system/tokens/typography';
import { spacing } from '@/design-system/tokens/spacing';
import Icon from '@/components/ui/Icon';
import PdfViewer from '@/components/shared/PdfViewer';
import type { MainStackParamList } from '@/navigation/types';

export default function ResumePreviewScreen() {
  const route = useRoute<RouteProp<MainStackParamList, 'ResumePreview'>>();
  const navigation = useNavigation<any>();
  const { resumeId } = route.params;

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

      <View style={styles.viewerContainer}>
        <PdfViewer resumeId={resumeId} />
      </View>
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
    fontWeight: typography.fontWeight.semibold as any,
    color: colors.neutral[900],
  },
  headerSpacer: { width: 40, height: 40 },
  backBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: colors.neutral[100],
    alignItems: 'center', justifyContent: 'center',
  },
  viewerContainer: { flex: 1 },
});
