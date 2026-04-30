export type RootStackParamList = {
  Main: undefined;
  JobDetail: { slug: string };
  Login: undefined;
  Register: undefined;
};

export type TabParamList = {
  Home: undefined;
  Search: { query?: string; category?: string } | undefined;
  Saved: undefined;
  Applications: undefined;
  Profile: undefined;
};
