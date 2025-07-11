import { useQuery } from '@tanstack/react-query';

export function useWeekWorkoutsCount() {
  return useQuery({
    queryKey: ['week-workouts-count'],
    queryFn: async () => Math.floor(Math.random() * 6),
    staleTime: 1000 * 60 * 5,
  });
}
