import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
} from 'react-native';
import { Category } from '../../../types';
import { colors } from '../../../design-system/tokens/colors';
import { typography } from '../../../design-system/tokens/typography';
import { spacing } from '../../../design-system/tokens/spacing';

interface CategoryGridProps {
  categories: Category[];
  onCategoryPress?: (category: Category) => void;
}

const CategoryGrid: React.FC<CategoryGridProps> = ({
  categories,
  onCategoryPress,
}) => {
  const renderItem = ({ item }: { item: Category }) => (
    <TouchableOpacity
      activeOpacity={0.9}
      onPress={() => onCategoryPress?.(item)}
      style={styles.card}
    >
      <View style={styles.iconPlaceholder}>
        <Text style={styles.iconText}>{item.icon}</Text>
      </View>
      <Text style={styles.name}>{item.name}</Text>
      <Text style={styles.jobCount}>{item.jobCount} vagas</Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>Categorias</Text>
      <FlatList
        data={categories}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        numColumns={2}
        columnWrapperStyle={styles.row}
        scrollEnabled={false}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[4],
  },
  sectionTitle: {
    fontSize: typography.fontSize.h4,
    fontWeight: typography.fontWeight.semibold as '600',
    color: colors.neutral[900],
    marginBottom: spacing[4],
  },
  row: {
    justifyContent: 'space-between',
    marginBottom: spacing[3],
  },
  card: {
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: spacing[4],
    width: '48%',
    alignItems: 'center',
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  iconPlaceholder: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: colors.primary[50],
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing[2],
  },
  iconText: {
    fontSize: typography.fontSize.h4,
  },
  name: {
    fontSize: typography.fontSize.body,
    fontWeight: typography.fontWeight.semibold as '600',
    color: colors.neutral[900],
    marginBottom: spacing[1],
    textAlign: 'center',
  },
  jobCount: {
    fontSize: typography.fontSize.caption,
    color: colors.neutral[500],
  },
});

export default CategoryGrid;
