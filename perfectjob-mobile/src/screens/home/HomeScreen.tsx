import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import HeroSection from './components/HeroSection';
import CategoryGrid from './components/CategoryGrid';
import FeaturedJobs from './components/FeaturedJobs';
import JobCard from '../../components/shared/JobCard';
import { Job, Category, Company } from '../../types';
import { colors } from '../../design-system/tokens/colors';
import { typography } from '../../design-system/tokens/typography';
import { spacing } from '../../design-system/tokens/spacing';
import Icon from '../../components/ui/Icon';

const TRENDING_SKILLS = ['React', 'Python', 'UX', 'Data', 'DevOps'];

const CATEGORIES: Category[] = [
  { id: '1', name: 'Tecnologia', jobCount: 1240, icon: { family: 'MaterialIcons', name: 'computer' } },
  { id: '2', name: 'Dados', jobCount: 856, icon: { family: 'Ionicons', name: 'bar-chart' } },
  { id: '3', name: 'Design', jobCount: 643, icon: { family: 'MaterialIcons', name: 'palette' } },
  { id: '4', name: 'Marketing', jobCount: 521, icon: { family: 'MaterialIcons', name: 'campaign' } },
  { id: '5', name: 'Vendas', jobCount: 489, icon: { family: 'MaterialIcons', name: 'handshake' } },
  { id: '6', name: 'RH', jobCount: 312, icon: { family: 'MaterialIcons', name: 'groups' } },
];

const FEATURED_JOBS: Job[] = [
  {
    id: '1', title: 'Desenvolvedor React Native', company: 'TechCorp',
    location: 'São Paulo, SP', salaryRange: 'R$ 8.000 - R$ 12.000',
    skills: ['React Native', 'TypeScript', 'Node.js'], postedAt: '2 dias atrás', matchPercentage: 95,
  },
  {
    id: '2', title: 'Product Designer', company: 'DesignStudio',
    location: 'Remoto', salaryRange: 'R$ 7.000 - R$ 10.000',
    skills: ['Figma', 'UI/UX', 'Design System'], postedAt: '1 dia atrás', matchPercentage: 88,
  },
  {
    id: '3', title: 'Cientista de Dados', company: 'DataDriven',
    location: 'Rio de Janeiro, RJ', salaryRange: 'R$ 10.000 - R$ 15.000',
    skills: ['Python', 'SQL', 'Machine Learning'], postedAt: '3 dias atrás', matchPercentage: 92,
  },
];

const RECENT_JOBS: Job[] = [
  {
    id: '4', title: 'Desenvolvedor Backend Java', company: 'FinTech Solutions',
    location: 'São Paulo, SP', salaryRange: 'R$ 9.000 - R$ 14.000',
    skills: ['Java', 'Spring Boot', 'PostgreSQL'], postedAt: '5 horas atrás', matchPercentage: 85,
  },
  {
    id: '5', title: 'Analista de Marketing Digital', company: 'Growth Agency',
    location: 'Remoto', salaryRange: 'R$ 5.000 - R$ 7.500',
    skills: ['SEO', 'Google Ads', 'Analytics'], postedAt: '1 dia atrás', matchPercentage: 78,
  },
];

const COMPANIES: Company[] = [
  { id: '1', name: 'TechCorp' }, { id: '2', name: 'DesignStudio' },
  { id: '3', name: 'DataDriven' }, { id: '4', name: 'FinTech' },
  { id: '5', name: 'Growth' },
];

const HomeScreen: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const navigation = useNavigation<any>();

  const handleJobPress = (job: Job) => {
    navigation.navigate('JobDetail', { slug: job.id });
  };

  const handleCategoryPress = (category: Category) => {
    navigation.navigate('Search', { category: category.name });
  };

  const handleSearchSubmit = () => {
    if (searchQuery.trim()) {
      navigation.navigate('Search', { query: searchQuery.trim() });
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        style={styles.container}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.logo}>PerfectJob</Text>
          <TouchableOpacity activeOpacity={0.8} style={styles.bellBtn}>
            <Icon name="bell" size={24} color={colors.neutral[700]} />
          </TouchableOpacity>
        </View>

        {/* Hero */}
        <HeroSection
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          onSearchSubmit={handleSearchSubmit}
        />

        {/* Trending Chips */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.trendingContainer}
        >
          {TRENDING_SKILLS.map((skill) => (
            <TouchableOpacity key={skill} activeOpacity={0.8} style={styles.chip}>
              <Text style={styles.chipText}>{skill}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Categories */}
        <CategoryGrid
          categories={CATEGORIES}
          onCategoryPress={handleCategoryPress}
        />

        {/* Featured Jobs */}
        <FeaturedJobs jobs={FEATURED_JOBS} onJobPress={handleJobPress} />

        {/* Recent Jobs */}
        <View style={styles.recentSection}>
          <Text style={styles.sectionTitle}>Vagas Recentes</Text>
          {RECENT_JOBS.map((job) => (
            <JobCard key={job.id} job={job} onPress={handleJobPress} />
          ))}
        </View>

        {/* Company List */}
        <View style={styles.companySection}>
          <Text style={styles.sectionTitle}>Empresas em Destaque</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.companyList}
          >
            {COMPANIES.map((company) => (
              <View key={company.id} style={styles.companyCard}>
                <View style={styles.companyLogo}>
                  <Text style={styles.companyLogoText}>
                    {company.name.charAt(0).toUpperCase()}
                  </Text>
                </View>
                <Text style={styles.companyName}>{company.name}</Text>
              </View>
            ))}
          </ScrollView>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.white },
  container: { flex: 1, backgroundColor: colors.neutral[50] },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: spacing[4], paddingVertical: spacing[3],
    backgroundColor: colors.white,
  },
  logo: {
    fontSize: typography.fontSize.h4,
    fontWeight: typography.fontWeight.bold as '700',
    color: colors.primary[500],
  },
  bellBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: colors.neutral[50],
    alignItems: 'center', justifyContent: 'center',
  },
  trendingContainer: {
    paddingHorizontal: spacing[4], paddingVertical: spacing[3], gap: spacing[2],
  },
  chip: {
    backgroundColor: colors.primary[50], borderRadius: 9999,
    paddingVertical: spacing[2], paddingHorizontal: spacing[4],
    marginRight: spacing[2],
  },
  chipText: {
    fontSize: typography.fontSize.bodySm,
    color: colors.primary[700],
    fontWeight: typography.fontWeight.medium as '500',
  },
  recentSection: { paddingHorizontal: spacing[4], paddingVertical: spacing[4] },
  sectionTitle: {
    fontSize: typography.fontSize.h4,
    fontWeight: typography.fontWeight.semibold as '600',
    color: colors.neutral[900], marginBottom: spacing[4],
  },
  companySection: { paddingVertical: spacing[4], paddingBottom: spacing[8] },
  companyList: { paddingHorizontal: spacing[4], gap: spacing[3] },
  companyCard: { alignItems: 'center', marginRight: spacing[4] },
  companyLogo: {
    width: 64, height: 64, borderRadius: 16,
    backgroundColor: colors.neutral[100],
    alignItems: 'center', justifyContent: 'center', marginBottom: spacing[2],
  },
  companyLogoText: {
    fontSize: typography.fontSize.h3,
    fontWeight: typography.fontWeight.bold as '700',
    color: colors.neutral[500],
  },
  companyName: {
    fontSize: typography.fontSize.caption,
    color: colors.neutral[700],
    fontWeight: typography.fontWeight.medium as '500',
  },
});

export default HomeScreen;
