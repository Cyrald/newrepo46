import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { authApi } from "@/lib/api";
import { useAuthStore } from "@/stores/authStore";
import type { LoginInput, RegisterInput, User } from "@shared/schema";

export function useLogin() {
  const queryClient = useQueryClient();
  const login = useAuthStore((state) => state.login);

  return useMutation({
    mutationFn: (data: LoginInput) => authApi.login(data),
    onSuccess: async (response) => {
      login(response.user);
      
      // CSRF token is already set by server in response
      // No need to fetch it separately
      
      queryClient.refetchQueries({ queryKey: ["cart"] });
      queryClient.refetchQueries({ queryKey: ["wishlist"] });
    },
  });
}

export function useRegister() {
  const queryClient = useQueryClient();
  const login = useAuthStore((state) => state.login);

  return useMutation({
    mutationFn: (data: RegisterInput) => authApi.register(data),
    onSuccess: async (response) => {
      login(response.user);
      
      // CSRF token is already set by server in response
      // No need to fetch it separately
      
      queryClient.refetchQueries({ queryKey: ["cart"] });
      queryClient.refetchQueries({ queryKey: ["wishlist"] });
    },
  });
}

export function useVerifyEmail() {
  return useMutation({
    mutationFn: (token: string) => authApi.verifyEmail(token),
  });
}

export function useMe() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const setUser = useAuthStore((state) => state.setUser);

  const query = useQuery({
    queryKey: ["user", "me"],
    queryFn: authApi.me,
    enabled: isAuthenticated,
  });

  useEffect(() => {
    if (query.data) {
      setUser(query.data.user);
    }
  }, [query.data, setUser]);

  return query;
}

export function useUpdateProfile() {
  const queryClient = useQueryClient();
  const setUser = useAuthStore((state) => state.setUser);

  return useMutation({
    mutationFn: (data: {
      firstName?: string;
      lastName?: string;
      patronymic?: string;
      phone?: string;
    }) => authApi.updateProfile(data),
    onSuccess: (response) => {
      setUser(response.user);
      queryClient.invalidateQueries({ queryKey: ["user", "me"] });
    },
  });
}

export function useUpdatePassword() {
  return useMutation({
    mutationFn: (data: { currentPassword: string; newPassword: string }) =>
      authApi.updatePassword(data),
  });
}
