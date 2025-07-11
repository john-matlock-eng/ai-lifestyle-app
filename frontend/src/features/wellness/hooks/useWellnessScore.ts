import { useQuery } from '@tanstack/react-query';

export function useWellnessScore() {
  return useQuery({
    queryKey: ['wellness-score'],
    queryFn: async () => Math.floor(Math.random() * 101),
    staleTime: 1000 * 60 * 5,
  });
}
