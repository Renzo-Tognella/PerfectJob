import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import JobDetailScreen from '@/screens/job-detail/JobDetailScreen';
import HomeScreen from '@/screens/home/HomeScreen';
import SearchScreen from '@/screens/search/SearchScreen';
import SavedJobsScreen from '@/screens/saved-jobs/SavedJobsScreen';
import ApplicationsScreen from '@/screens/applications/ApplicationsScreen';
import ProfileScreen from '@/screens/profile/ProfileScreen';
import EditProfileScreen from '@/screens/profile/EditProfileScreen';
import Icon from '@/components/ui/Icon';
import { colors } from '@/design-system/tokens/colors';

export type MainStackParamList = {
  Tabs: undefined;
  JobDetail: { slug: string };
  EditProfile: undefined;
};

export type TabParamList = {
  Home: undefined;
  Search: { query?: string; category?: string } | undefined;
  Saved: undefined;
  Applications: undefined;
  Profile: undefined;
};

const Stack = createNativeStackNavigator<MainStackParamList>();
const Tab = createBottomTabNavigator<TabParamList>();

const TAB_ICONS: Record<keyof TabParamList, [string, string]> = {
  Home: ['home', 'home-outline'],
  Search: ['search', 'search-outline'],
  Saved: ['bookmark', 'bookmark-outline'],
  Applications: ['document-text', 'document-text-outline'],
  Profile: ['person', 'person-outline'],
};

function getTabIcon(routeName: string, focused: boolean): string {
  const pair = TAB_ICONS[routeName as keyof TabParamList];
  if (!pair) return 'help-outline';
  return focused ? pair[0] : pair[1];
}

function TabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => (
          <Icon name={getTabIcon(route.name, focused)} size={size} color={color} />
        ),
        tabBarActiveTintColor: colors.primary[500],
        tabBarInactiveTintColor: colors.neutral[500],
        headerShown: false,
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} options={{ tabBarLabel: 'Início' }} />
      <Tab.Screen name="Search" component={SearchScreen} options={{ tabBarLabel: 'Buscar' }} />
      <Tab.Screen name="Saved" component={SavedJobsScreen} options={{ tabBarLabel: 'Salvas' }} />
      <Tab.Screen name="Applications" component={ApplicationsScreen} options={{ tabBarLabel: 'Candidaturas' }} />
      <Tab.Screen name="Profile" component={ProfileScreen} options={{ tabBarLabel: 'Perfil' }} />
    </Tab.Navigator>
  );
}

export function MainNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Tabs" component={TabNavigator} />
      <Stack.Screen name="JobDetail" component={JobDetailScreen} options={{ headerShown: false }} />
      <Stack.Screen
        name="EditProfile"
        component={EditProfileScreen}
        options={{ headerShown: true, title: 'Editar perfil' }}
      />
    </Stack.Navigator>
  );
}
