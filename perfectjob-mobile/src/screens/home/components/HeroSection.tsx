import React from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
} from 'react-native';
import { colors } from '../../../design-system/tokens/colors';
import { typography } from '../../../design-system/tokens/typography';
import { spacing } from '../../../design-system/tokens/spacing';
import Icon from '../../../components/ui/Icon';

interface HeroSectionProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onSearchSubmit?: () => void;
}

const HeroSection: React.FC<HeroSectionProps> = ({
  searchQuery,
  onSearchChange,
  onSearchSubmit,
}) => {
  return (
    <View style={styles.container}>
      <Text style={styles.headline}>Encontre a vaga dos seus sonhos</Text>
      <Text style={styles.subtitle}>
        Milhares de oportunidades esperando por você
      </Text>

      <View style={styles.searchContainer}>
        <Icon
          family="Feather"
          name="search"
          size={20}
          color={colors.neutral[400]}
          style={styles.searchIcon}
        />
        <TextInput
          style={styles.searchInput}
          placeholder="Cargo, habilidade ou empresa..."
          placeholderTextColor={colors.neutral[400]}
          value={searchQuery}
          onChangeText={onSearchChange}
          onSubmitEditing={onSearchSubmit}
          returnKeyType="search"
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[6],
    backgroundColor: colors.white,
  },
  headline: {
    fontSize: 32,
    fontWeight: typography.fontWeight.bold as '700',
    color: colors.neutral[900],
    lineHeight: 40,
    marginBottom: spacing[2],
  },
  subtitle: {
    fontSize: typography.fontSize.body,
    color: colors.neutral[600],
    marginBottom: spacing[5],
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: 9999,
    borderWidth: 1.5,
    borderColor: colors.neutral[200],
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 3,
  },
  searchIcon: {
    marginRight: spacing[3],
  },
  searchInput: {
    flex: 1,
    fontSize: typography.fontSize.body,
    color: colors.neutral[900],
    padding: 0,
  },
});

export default HeroSection;
