import { useFetchWithAuth } from "~/composables/useFetchWithAuth";
import type {
  Role,
  CreateRoleData,
  UpdateRoleData,
  RoleAssignment,
} from "./role.type";
import { useRoleStore } from "./role.store";

export const roleActions = {
  // Fetch all roles for a guild
  async fetchRoles(guildId: string) {
    const { fetchWithAuth } = useFetchWithAuth();
    const roleStore = useRoleStore();

    roleStore.loading = true;
    roleStore.error = null;

    try {
      const roles = await fetchWithAuth<Role[]>(`/community/${guildId}/roles`, {
        method: "GET",
      });

      // Sort roles by position (highest first)
      roles.sort((a, b) => b.position - a.position);

      roleStore.roles[guildId] = roles;
      return roles;
    } catch (error) {
      roleStore.error =
        error instanceof Error ? error.message : "Failed to fetch roles";
      throw error;
    } finally {
      roleStore.loading = false;
    }
  },

  // Create a new role
  async createRole(guildId: string, data: CreateRoleData) {
    const { fetchWithAuth } = useFetchWithAuth();
    const roleStore = useRoleStore();

    roleStore.loading = true;
    roleStore.error = null;

    try {
      const newRole = await fetchWithAuth<Role>(`/community/${guildId}/roles`, {
        method: "POST",
        body: JSON.stringify(data),
      });

      // Add to store
      if (!roleStore.roles[guildId]) {
        roleStore.roles[guildId] = [];
      }
      roleStore.roles[guildId].push(newRole);

      // Re-sort by position
      roleStore.roles[guildId].sort((a, b) => b.position - a.position);

      return newRole;
    } catch (error) {
      roleStore.error =
        error instanceof Error ? error.message : "Failed to create role";
      throw error;
    } finally {
      roleStore.loading = false;
    }
  },

  // Update an existing role
  async updateRole(guildId: string, roleId: string, data: UpdateRoleData) {
    const { fetchWithAuth } = useFetchWithAuth();
    const roleStore = useRoleStore();

    roleStore.loading = true;
    roleStore.error = null;

    try {
      const updatedRole = await fetchWithAuth<Role>(
        `/community/${guildId}/roles/${roleId}`,
        {
          method: "PATCH",
          body: JSON.stringify(data),
        }
      );

      // Update in store
      if (roleStore.roles[guildId]) {
        const index = roleStore.roles[guildId].findIndex(
          (role) => role.id === roleId
        );
        if (index !== -1) {
          roleStore.roles[guildId][index] = updatedRole;
          // Re-sort by position
          roleStore.roles[guildId].sort((a, b) => b.position - a.position);
        }
      }

      return updatedRole;
    } catch (error) {
      roleStore.error =
        error instanceof Error ? error.message : "Failed to update role";
      throw error;
    } finally {
      roleStore.loading = false;
    }
  },

  // Delete a role
  async deleteRole(guildId: string, roleId: string) {
    const { fetchWithAuth } = useFetchWithAuth();
    const roleStore = useRoleStore();

    roleStore.loading = true;
    roleStore.error = null;

    try {
      await fetchWithAuth(`/community/${guildId}/roles/${roleId}`, {
        method: "DELETE",
      });

      // Remove from store
      if (roleStore.roles[guildId]) {
        roleStore.roles[guildId] = roleStore.roles[guildId].filter(
          (role) => role.id !== roleId
        );
      }

      return true;
    } catch (error) {
      roleStore.error =
        error instanceof Error ? error.message : "Failed to delete role";
      throw error;
    } finally {
      roleStore.loading = false;
    }
  },

  // Update role positions (for drag & drop reordering)
  async updateRolePositions(
    guildId: string,
    rolePositions: { id: string; position: number }[]
  ) {
    const { fetchWithAuth } = useFetchWithAuth();
    const roleStore = useRoleStore();

    roleStore.loading = true;
    roleStore.error = null;

    try {
      const updatedRoles = await fetchWithAuth<Role[]>(
        `/community/${guildId}/roles/positions`,
        {
          method: "PATCH",
          body: JSON.stringify({ roles: rolePositions }),
        }
      );

      // Update store with new positions
      roleStore.roles[guildId] = updatedRoles.sort(
        (a, b) => b.position - a.position
      );

      return updatedRoles;
    } catch (error) {
      roleStore.error =
        error instanceof Error
          ? error.message
          : "Failed to update role positions";
      throw error;
    } finally {
      roleStore.loading = false;
    }
  },

  // Assign roles to a member
  async assignMemberRoles(
    guildId: string,
    memberId: string,
    roleIds: string[]
  ) {
    const { fetchWithAuth } = useFetchWithAuth();
    const roleStore = useRoleStore();

    try {
      await fetchWithAuth(`/community/${guildId}/members/${memberId}/roles`, {
        method: "PUT",
        body: JSON.stringify({ roleIds }),
      });

      return true;
    } catch (error) {
      roleStore.error =
        error instanceof Error ? error.message : "Failed to assign roles";
      throw error;
    }
  },

  // Add a single role to a member
  async addMemberRole(guildId: string, memberId: string, roleId: string) {
    const { fetchWithAuth } = useFetchWithAuth();
    const roleStore = useRoleStore();

    try {
      await fetchWithAuth(
        `/community/${guildId}/members/${memberId}/roles/${roleId}`,
        {
          method: "PUT",
        }
      );

      return true;
    } catch (error) {
      roleStore.error =
        error instanceof Error ? error.message : "Failed to add role";
      throw error;
    }
  },

  // Remove a single role from a member
  async removeMemberRole(guildId: string, memberId: string, roleId: string) {
    const { fetchWithAuth } = useFetchWithAuth();
    const roleStore = useRoleStore();

    try {
      await fetchWithAuth(
        `/community/${guildId}/members/${memberId}/roles/${roleId}`,
        {
          method: "DELETE",
        }
      );

      return true;
    } catch (error) {
      roleStore.error =
        error instanceof Error ? error.message : "Failed to remove role";
      throw error;
    }
  },

  // Clear roles for a guild
  clearRoles(guildId: string) {
    const roleStore = useRoleStore();
    delete roleStore.roles[guildId];
  },

  // Clear all roles
  clearAllRoles() {
    const roleStore = useRoleStore();
    roleStore.roles = {};
    roleStore.loading = false;
    roleStore.error = null;
  },
};
