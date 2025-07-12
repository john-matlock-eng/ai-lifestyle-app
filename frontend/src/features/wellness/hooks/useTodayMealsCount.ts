import { useQuery } from '@tanstack/react-query';

export function useTodayMealsCount() {
  return useQuery({
    queryKey: ['today-meals-count'],
    queryFn: async () => Math.floor(Math.random() * 4),
    staleTime: 1000 * 60 * 5,
  });
}
