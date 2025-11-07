import type { User } from "~/stores/auth/auth.type";

/**
 * Get display name for a user
 * Priority: globalName > username
 */
export const useDisplayName = () => {
  const getUserDisplayName = (
    user: Partial<User> | null | undefined
  ): string => {
    if (!user) return "Unknown";
    return (user as User).globalName || user.username || "Unknown";
  };

  return {
    getUserDisplayName,
  };
};
