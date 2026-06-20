import type { NavigatorScreenParams } from '@react-navigation/native';
import type { MainStackParamList, TabParamList } from './MainNavigator';
import type { AuthStackParamList } from './AuthNavigator';

export type { MainStackParamList, TabParamList, AuthStackParamList };

export type RootStackParamList = {
  Auth: NavigatorScreenParams<AuthStackParamList> | undefined;
  Main: NavigatorScreenParams<MainStackParamList> | undefined;
};
