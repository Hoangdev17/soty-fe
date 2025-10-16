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

      // Update member count for each role
      for (const role of roles) {
        if (role.members) {
          role.memberCount = role.members.length;
        } else {
          // If members array is not included, fetch member count separately
          try {
            const members = await this.fetchRoleMembers(guildId, role.id);
            role.memberCount = members.length;
          } catch (error) {
            
            role.memberCount = 0;
          }
        }
      }

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

      // Initialize member count for new role
      newRole.memberCount = 0;

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
        `/community/${guildId}/roles/positions/update`,
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
  async assignMemberRoles(guildId: string, memberId: string, roleId: string) {
    const { fetchWithAuth } = useFetchWithAuth();
    const roleStore = useRoleStore();

    try {
      await fetchWithAuth(`/community/${guildId}/roles/assign`, {
        method: "POST",
        body: JSON.stringify({ memberId, roleId }),
      });

      // Update role members in store and member count
      if (roleStore.roles[guildId]) {
        const roleIndex = roleStore.roles[guildId].findIndex(
          (role) => role.id === roleId
        );
        if (roleIndex !== -1 && roleStore.roles[guildId][roleIndex]) {
          // Add member to role's members array if not already present
          if (!roleStore.roles[guildId][roleIndex].members) {
            roleStore.roles[guildId][roleIndex].members = [];
          }
          // Note: In a real app, you'd fetch the member data here
          // For now, we'll just trigger a refetch of role members
          await this.fetchRoleMembers(guildId, roleId);

          // Update member count
          const role = roleStore.roles[guildId][roleIndex];
          role.memberCount = role.members ? role.members.length : 0;
        }
      }

      return true;
    } catch (error) {
      roleStore.error =
        error instanceof Error ? error.message : "Failed to assign roles";
      throw error;
    }
  },

  // Remove a single role from a member
  async removeMemberRole(guildId: string, memberId: string, roleId: string) {
    const { fetchWithAuth } = useFetchWithAuth();
    const roleStore = useRoleStore();

    try {
      await fetchWithAuth(`/community/${guildId}/roles/remove`, {
        method: "DELETE",
        body: JSON.stringify({ memberId, roleId }),
      });

      // Update role members in store
      if (roleStore.roles[guildId]) {
        const roleIndex = roleStore.roles[guildId].findIndex(
          (role) => role.id === roleId
        );
        if (roleIndex !== -1 && roleStore.roles[guildId][roleIndex]?.members) {
          // Remove member from role's members array
          roleStore.roles[guildId][roleIndex].members = roleStore.roles[
            guildId
          ][roleIndex].members!.filter((member) => member.id !== memberId);

          // Update member count
          const role = roleStore.roles[guildId][roleIndex];
          role.memberCount = role.members ? role.members.length : 0;
        }
      }

      return true;
    } catch (error) {
      roleStore.error =
        error instanceof Error ? error.message : "Failed to remove role";
      throw error;
    }
  },

  async fetchRoleMembers(
    guildId: string,
    roleId: string
  ): Promise<
    {
      user: {
        id: string;
        username: string;
        globalName: string;
        avatar?: string;
      };
    }[]
  > {
    const { fetchWithAuth } = useFetchWithAuth();
    const roleStore = useRoleStore();

    try {
      const members = await fetchWithAuth<
        {
          user: {
            id: string;
            username: string;
            globalName: string;
            avatar?: string;
          };
          id: string;
        }[]
      >(`/community/${guildId}/roles/members?roleId=${roleId}`, {
        method: "GET",
      });

      // Update role with members data and member count
      if (roleStore.roles[guildId]) {
        const roleIndex = roleStore.roles[guildId].findIndex(
          (role) => role.id === roleId
        );
        if (roleIndex !== -1 && roleStore.roles[guildId][roleIndex]) {
          roleStore.roles[guildId][roleIndex].members = members;
          roleStore.roles[guildId][roleIndex].memberCount = members.length;
        }
      }

      return members;
    } catch (error) {
      roleStore.error =
        error instanceof Error ? error.message : "Failed to fetch role members";
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
