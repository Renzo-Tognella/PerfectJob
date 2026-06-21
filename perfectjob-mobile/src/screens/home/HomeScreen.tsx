import React, { useState } from 'react'
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ActivityIndicator,
} from 'react-native'
import { useNavigation } from '@react-navigation/native'
import HeroSection from './components/HeroSection'
import CategoryGrid from './components/CategoryGrid'
import FeaturedJobs from './components/FeaturedJobs'
import JobCard from '../../components/shared/JobCard'
import { Job, Category } from '../../types'
import { colors } from '../../design-system/tokens/colors'
import { typography } from '../../design-system/tokens/typography'
import { spacing } from '../../design-system/tokens/spacing'
import { useFeaturedJobs, useSearchJobs, useTrendingSkills } from '../../hooks/useJobs'
import { useCompanies } from '../../hooks/useCompanies'
import { buildCategoriesFromSkills } from '../../services/home/categories'
import Icon from '../../components/ui/Icon'

const HomeScreen: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('')
  const navigation = useNavigation<any>()

  const { data: featuredJobs, isLoading: featuredLoading } = useFeaturedJobs()
  const { data: recentData, isLoading: recentLoading } = useSearchJobs({ size: 4 })
  const { data: trendingSkills, isLoading: trendingLoading } = useTrendingSkills(8)
  const { data: companies, isLoading: companiesLoading } = useCompanies()

  const recentJobs = recentData?.pages?.[0]?.jobs || []
  const displayedFeatured = featuredJobs?.slice(0, 3) || []
  const trending = trendingSkills ?? []
  const categories: Category[] = buildCategoriesFromSkills(trending, 6)

  const handleJobPress = (job: Job) => {
    navigation.navigate('JobDetail', { slug: (job as any).slug })
  }

  const handleCategoryPress = (category: Category) => {
    navigation.navigate('Search', { query: category.name })
  }

  const handleSkillPress = (skill: string) => {
    navigation.navigate('Search', { query: skill })
  }

  const handleCompanyPress = (companyName: string) => {
    navigation.navigate('Search', { query: companyName })
  }

  const handleSearchSubmit = () => {
    if (searchQuery.trim()) {
      navigation.navigate('Search', { query: searchQuery.trim() })
    }
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.logo}>PerfectJob</Text>
          <TouchableOpacity activeOpacity={0.8} style={styles.bellBtn}>
            <Icon name="bell" size={24} color={colors.neutral[700]} />
          </TouchableOpacity>
        </View>

        <HeroSection
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          onSearchSubmit={handleSearchSubmit}
        />

        {trending.length > 0 ? (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.trendingContainer}
          >
            {trending.map((item) => (
              <TouchableOpacity
                key={item.skill}
                activeOpacity={0.8}
                style={styles.chip}
                onPress={() => handleSkillPress(item.skill)}
              >
                <Text style={styles.chipText}>{item.skill}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        ) : null}

        {trendingLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="small" color={colors.primary[500]} />
          </View>
        ) : categories.length > 0 ? (
          <CategoryGrid categories={categories} onCategoryPress={handleCategoryPress} />
        ) : null}

        {featuredLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="small" color={colors.primary[500]} />
          </View>
        ) : displayedFeatured.length > 0 ? (
          <FeaturedJobs jobs={displayedFeatured} onJobPress={handleJobPress} />
        ) : null}

        <View style={styles.recentSection}>
          <Text style={styles.sectionTitle}>Vagas Recentes</Text>
          {recentLoading ? (
            <ActivityIndicator size="small" color={colors.primary[500]} />
          ) : recentJobs.length > 0 ? (
            recentJobs.map((job) => (
              <JobCard key={job.id} job={job} onPress={handleJobPress} isSaved={false} />
            ))
          ) : (
            <Text style={styles.emptyText}>Nenhuma vaga disponível no momento.</Text>
          )}
        </View>

        {companiesLoading ? null : (companies && companies.length > 0) ? (
          <View style={styles.companySection}>
            <Text style={styles.sectionTitle}>Empresas em Destaque</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.companyList}
            >
              {companies.slice(0, 10).map((company) => (
                <TouchableOpacity
                  key={company.id}
                  style={styles.companyCard}
                  activeOpacity={0.8}
                  onPress={() => handleCompanyPress(company.name)}
                >
                  <View style={styles.companyLogo}>
                    <Text style={styles.companyLogoText}>
                      {company.name.charAt(0).toUpperCase()}
                    </Text>
                  </View>
                  <Text style={styles.companyName} numberOfLines={1}>{company.name}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  )
}

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
  loadingContainer: {
    paddingVertical: spacing[6],
    alignItems: 'center',
  },
  recentSection: { paddingHorizontal: spacing[4], paddingVertical: spacing[4] },
  sectionTitle: {
    fontSize: typography.fontSize.h4,
    fontWeight: typography.fontWeight.semibold as '600',
    color: colors.neutral[900], marginBottom: spacing[4],
  },
  emptyText: { fontSize: typography.fontSize.bodySm, color: colors.neutral[500] },
  companySection: { paddingVertical: spacing[4], paddingBottom: spacing[8] },
  companyList: { paddingHorizontal: spacing[4], gap: spacing[3] },
  companyCard: { alignItems: 'center', marginRight: spacing[4], width: 80 },
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
})

export default HomeScreen
