import { create } from 'zustand';

interface FilterState {
  keyword: string;
  workModel: string | null;
  experienceLevel: string | null;
  minSalary: number | null;
  skills: string[];
  setFilter: (key: keyof Omit<FilterState, 'setFilter' | 'reset'>, value: any) => void;
  reset: () => void;
}

const initialState = {
  keyword: '',
  workModel: null,
  experienceLevel: null,
  minSalary: null,
  skills: [] as string[],
};

export const useFilterStore = create<FilterState>((set) => ({
  ...initialState,

  setFilter: (key, value) => set((state) => ({ ...state, [key]: value })),

  reset: () => set(initialState),
}));
