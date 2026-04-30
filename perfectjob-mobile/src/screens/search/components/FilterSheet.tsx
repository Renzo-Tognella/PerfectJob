import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Modal,
  Pressable,
} from 'react-native';
import { colors } from '@/design-system/tokens/colors';
import { typography } from '@/design-system/tokens/typography';
import { spacing } from '@/design-system/tokens/spacing';
import Icon from '@/components/ui/Icon';

export interface Filters {
  workModel: string[];
  level: string[];
  salaryMin: string;
  salaryMax: string;
  location: string;
}

interface FilterSheetProps {
  visible: boolean;
  initialFilters: Filters;
  onClose: () => void;
  onApply: (filters: Filters) => void;
}

const WORK_MODELS = ['Remoto', 'Híbrido', 'Presencial'];
const LEVELS = ['Júnior', 'Pleno', 'Sênior'];

const EMPTY_FILTERS: Filters = {
  workModel: [],
  level: [],
  salaryMin: '',
  salaryMax: '',
  location: '',
};

const FilterSheet: React.FC<FilterSheetProps> = ({
  visible,
  initialFilters,
  onClose,
  onApply,
}) => {
  const [filters, setFilters] = useState<Filters>(initialFilters);

  useEffect(() => {
    if (visible) {
      setFilters(initialFilters);
    }
  }, [visible]);

  const toggleArray = useCallback(
    (key: 'workModel' | 'level', value: string) => {
      setFilters((prev) => {
        const arr = prev[key];
        const exists = arr.includes(value);
        return {
          ...prev,
          [key]: exists ? arr.filter((v) => v !== value) : [...arr, value],
        };
      });
    },
    []
  );

  const handleClear = useCallback(() => {
    setFilters(EMPTY_FILTERS);
  }, []);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <Pressable style={styles.overlay} onPress={onClose}>
        <View style={styles.sheet}>
          <View style={styles.handleBar} />

          <View style={styles.header}>
            <Text style={styles.headerTitle}>Filtros</Text>
            <TouchableOpacity onPress={handleClear}>
              <Text style={styles.clearText}>Limpar</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Modalidade</Text>
            <View style={styles.checkboxRow}>
              {WORK_MODELS.map((m) => (
                <TouchableOpacity
                  key={m}
                  style={styles.checkboxItem}
                  onPress={() => toggleArray('workModel', m)}
                  activeOpacity={0.8}
                >
                  <View
                    style={[
                      styles.checkbox,
                      filters.workModel.includes(m) && styles.checkboxActive,
                    ]}
                  >
                    {filters.workModel.includes(m) && (
                      <Icon family="MaterialIcons" name="check" size={14} color={colors.white} />
                    )}
                  </View>
                  <Text style={styles.checkboxLabel}>{m}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Nível</Text>
            <View style={styles.checkboxRow}>
              {LEVELS.map((l) => (
                <TouchableOpacity
                  key={l}
                  style={styles.checkboxItem}
                  onPress={() => toggleArray('level', l)}
                  activeOpacity={0.8}
                >
                  <View
                    style={[
                      styles.checkbox,
                      filters.level.includes(l) && styles.checkboxActive,
                    ]}
                  >
                    {filters.level.includes(l) && (
                      <Icon family="MaterialIcons" name="check" size={14} color={colors.white} />
                    )}
                  </View>
                  <Text style={styles.checkboxLabel}>{l}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Salário</Text>
            <View style={styles.rangeRow}>
              <TextInput
                style={styles.rangeInput}
                placeholder="Mínimo"
                placeholderTextColor={colors.neutral[400]}
                keyboardType="numeric"
                value={filters.salaryMin}
                onChangeText={(v) =>
                  setFilters((prev) => ({ ...prev, salaryMin: v }))
                }
              />
              <Text style={styles.rangeDash}>—</Text>
              <TextInput
                style={styles.rangeInput}
                placeholder="Máximo"
                placeholderTextColor={colors.neutral[400]}
                keyboardType="numeric"
                value={filters.salaryMax}
                onChangeText={(v) =>
                  setFilters((prev) => ({ ...prev, salaryMax: v }))
                }
              />
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Localização</Text>
            <TextInput
              style={styles.textInput}
              placeholder="Cidade, estado ou país"
              placeholderTextColor={colors.neutral[400]}
              value={filters.location}
              onChangeText={(v) =>
                setFilters((prev) => ({ ...prev, location: v }))
              }
            />
          </View>

          <TouchableOpacity
            style={styles.applyBtn}
            onPress={() => onApply(filters)}
            activeOpacity={0.9}
          >
            <Text style={styles.applyBtnText}>Aplicar filtros</Text>
          </TouchableOpacity>
        </View>
      </Pressable>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: colors.white,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: spacing[5],
    paddingBottom: spacing[6],
    paddingTop: spacing[3],
  },
  handleBar: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.neutral[300],
    alignSelf: 'center',
    marginBottom: spacing[3],
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing[4],
  },
  headerTitle: {
    fontSize: typography.fontSize.h4,
    fontWeight: typography.fontWeight.bold as any,
    color: colors.neutral[900],
  },
  clearText: {
    fontSize: typography.fontSize.body,
    color: colors.primary[500],
    fontWeight: typography.fontWeight.medium as any,
  },
  section: {
    marginBottom: spacing[5],
  },
  sectionTitle: {
    fontSize: typography.fontSize.body,
    fontWeight: typography.fontWeight.semibold as any,
    color: colors.neutral[800],
    marginBottom: spacing[3],
  },
  checkboxRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing[4],
  },
  checkboxItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing[2],
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: colors.neutral[300],
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing[2],
  },
  checkboxActive: {
    backgroundColor: colors.primary[500],
    borderColor: colors.primary[500],
  },
  checkboxLabel: {
    fontSize: typography.fontSize.body,
    color: colors.neutral[700],
  },
  rangeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
  },
  rangeInput: {
    flex: 1,
    height: 44,
    borderWidth: 1,
    borderColor: colors.neutral[300],
    borderRadius: 8,
    paddingHorizontal: spacing[3],
    fontSize: typography.fontSize.body,
    color: colors.neutral[900],
    backgroundColor: colors.neutral[50],
  },
  rangeDash: {
    fontSize: typography.fontSize.body,
    color: colors.neutral[500],
  },
  textInput: {
    height: 44,
    borderWidth: 1,
    borderColor: colors.neutral[300],
    borderRadius: 8,
    paddingHorizontal: spacing[3],
    fontSize: typography.fontSize.body,
    color: colors.neutral[900],
    backgroundColor: colors.neutral[50],
  },
  applyBtn: {
    backgroundColor: colors.primary[500],
    borderRadius: 8,
    height: 50,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing[2],
  },
  applyBtnText: {
    color: colors.white,
    fontSize: typography.fontSize.body,
    fontWeight: typography.fontWeight.semibold as any,
  },
});

export default FilterSheet;
