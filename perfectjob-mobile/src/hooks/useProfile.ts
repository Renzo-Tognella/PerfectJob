import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { profileApi, type ResumeFile } from '@/services/api/profileApi';
import type { ProfileResponse, UpdateProfilePayload } from '@/types/profile';

const PROFILE_KEY = ['profile', 'me'];

export function useProfile() {
  return useQuery({
    queryKey: PROFILE_KEY,
    queryFn: profileApi.getMe,
  });
}

export function useUpdateProfile() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: UpdateProfilePayload) => profileApi.update(payload),
    onSuccess: (data: ProfileResponse) => {
      queryClient.setQueryData(PROFILE_KEY, data);
    },
  });
}

export function useUploadResume() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (file: ResumeFile) => profileApi.uploadResume(file),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PROFILE_KEY });
    },
  });
}
