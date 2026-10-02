import {
  getCurrentUser,
  userLogin,
  userLogout,
  type CurrentUserResponse,
  type LoginCredentials,
} from "@/api/adminApi/adminApi"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

export const currentUserQueryKey = ["currentUser"] as const

export const useCurrentUser = () =>
  useQuery({
    queryKey: currentUserQueryKey,
    queryFn: getCurrentUser,
    retry: false,
    staleTime: 60_000,
  })

export const useLogin = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (credentials: LoginCredentials) => userLogin(credentials),
    onSuccess: (currentUser) => {
      queryClient.setQueryData<CurrentUserResponse>(currentUserQueryKey, currentUser)
    },
  })
}

export const useLogout = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: userLogout,
    onSuccess: () => {
      // Do not retain data fetched for the previous account after logout.
      queryClient.clear()
    },
  })
}

export const useProfile = () => {
  const currentUserQuery = useCurrentUser()

  return {
    ...currentUserQuery,
    // `null` means this authenticated account has no student profile.
    data: currentUserQuery.data?.profile ?? null,
    user: currentUserQuery.data?.user ?? null,
    role: currentUserQuery.data?.role ?? null,
  }
}
