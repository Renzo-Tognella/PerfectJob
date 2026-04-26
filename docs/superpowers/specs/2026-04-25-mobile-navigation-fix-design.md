# Design: Mobile Navigation Fix — PerfectJob

**Date:** 2026-04-25
**Status:** Approved

## Problem

All 5 tabs in the bottom tab navigator render `PlaceholderScreen` (returns `null`), so the app shows an empty screen with broken/default tab bar buttons that appear as triangles. The `HomeScreen` component exists but is never imported. No tab bar icons are configured. The `@expo/vector-icons` library is not in dependencies. Navigation callbacks are stubbed with `console.log`.

## Changes

### 1. Dependencies — Install Icon Library
- Ensure `@expo/vector-icons` is available (built-in with Expo SDK 54)
- Use `Ionicons` for tab bar icons

### 2. TabNavigator — Wire Screens & Icons
**File:** `src/navigation/TabNavigator.tsx`
- Import `Ionicons` from `@expo/vector-icons`
- Import `HomeScreen` from `@/screens/home/HomeScreen`
- Replace `PlaceholderScreen` on Home tab with `HomeScreen`
- Add `tabBarIcon` to each tab:
  - Home: `home` / `home-outline`
  - Search: `search` / `search-outline`
  - Saved: `bookmark` / `bookmark-outline`
  - Applications: `document-text` / `document-text-outline`
  - Profile: `person` / `person-outline`
- Import shared `PlaceholderScreen` instead of local definition

### 3. Shared PlaceholderScreen
**New file:** `src/components/shared/PlaceholderScreen.tsx`
- Extract `() => null` to shared location
- Remove duplicated definitions from `TabNavigator.tsx:8` and `RootNavigator.tsx:18`

### 4. RootNavigator — Fix Reference
**File:** `src/navigation/RootNavigator.tsx`
- Import `PlaceholderScreen` from shared location
- Move definition before usage (currently used at line 12-13, defined at line 18)

### 5. Navigation Types — Search Params
**File:** `src/navigation/types.ts`
- Update `Search` in `TabParamList` to accept optional params:
  ```ts
  Search: { query?: string; category?: string } | undefined;
  ```

### 6. HomeScreen — Navigation Integration
**File:** `src/screens/home/HomeScreen.tsx`
- Import `useNavigation` from `@react-navigation/native`
- Import `NativeStackNavigationProp` from `@react-navigation/native-stack`
- Import `RootStackParamList` and `TabParamList` from types
- `handleJobPress(job)` → navigate to `JobDetail` with `{ slug: job.id }`
- `handleCategoryPress(category)` → navigate to Search tab with `{ category: category.name }`
- `handleSearchSubmit()` → navigate to Search tab with `{ query: searchQuery }`

## Files Modified

| File | Action |
|------|--------|
| `perfectjob-mobile/src/components/shared/PlaceholderScreen.tsx` | **Create** |
| `perfectjob-mobile/src/navigation/TabNavigator.tsx` | Modify |
| `perfectjob-mobile/src/navigation/RootNavigator.tsx` | Modify |
| `perfectjob-mobile/src/navigation/types.ts` | Modify |
| `perfectjob-mobile/src/screens/home/HomeScreen.tsx` | Modify |

## Out of Scope
- Building Search, Saved, Applications, Profile screens
- Building JobDetail and Login screens
- Replacing inline TouchableOpacity with design system Button component (separate task)
