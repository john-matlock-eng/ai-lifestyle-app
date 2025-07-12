import { useQuery } from '@tanstack/react-query';

export function useActiveRoutines() {
  return useQuery({
    queryKey: ['active-routines'],
    queryFn: async () => Math.floor(Math.random() * 5),
    staleTime: 1000 * 60 * 5,
  });
}
