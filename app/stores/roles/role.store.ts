import { defineStore } from "pinia";
import type { RoleState, Role, Permission } from "./role.type";
import { DEFAULT_PERMISSIONS } from "./role.type";
import { roleActions } from "./role.action";

export const useRoleStore = defineStore("role", {
  state: (): RoleState => ({
    roles: {},
    permissions: DEFAULT_PERMISSIONS,
    loading: false,
    error: null,
  }),

  getters: {
    getRolesByGuild:
      (state) =>
      (guildId: string): Role[] => {
        return state.roles[guildId] || [];
      },

    getRoleById:
      (state) =>
      (guildId: string, roleId: string): Role | undefined => {
        const roles = state.roles[guildId] || [];
        return roles.find((role) => role.id === roleId);
      },

    getHighestRole:
      (state) =>
      (guildId: string): Role | undefined => {
        const roles = state.roles[guildId] || [];
        return roles.length > 0 ? roles[0] : undefined; // Already sorted by position desc
      },

    getMemberRoles:
      (state) =>
      (guildId: string, memberRoleIds: string[]): Role[] => {
        const roles = state.roles[guildId] || [];
        return roles.filter((role) => memberRoleIds.includes(role.id));
      },

    getPermissionsByCategory:
      (state) =>
      (category: string): Permission[] => {
        return state.permissions.filter(
          (permission) => permission.category === category
        );
      },

    getAllPermissions: (state): Permission[] => {
      return state.permissions;
    },

    getPermissionById:
      (state) =>
      (permissionId: string): Permission | undefined => {
        return state.permissions.find(
          (permission) => permission.id === permissionId
        );
      },

    isLoading: (state) => state.loading,
    getError: (state) => state.error,
  },

  actions: {
    ...roleActions,

    // Add a role locally (for optimistic updates)
    addRoleLocally(guildId: string, role: Role) {
      if (!this.roles[guildId]) {
        this.roles[guildId] = [];
      }
      this.roles[guildId].push(role);
      this.roles[guildId].sort((a: Role, b: Role) => b.position - a.position);
    },

    // Update a role locally
    updateRoleLocally(guildId: string, roleId: string, updates: Partial<Role>) {
      if (this.roles[guildId]) {
        const index = this.roles[guildId].findIndex(
          (role: Role) => role.id === roleId
        );
        if (index !== -1) {
          this.roles[guildId][index] = {
            ...this.roles[guildId][index],
            ...updates,
          } as Role;
          this.roles[guildId].sort(
            (a: Role, b: Role) => b.position - a.position
          );
        }
      }
    },

    // Remove a role locally
    removeRoleLocally(guildId: string, roleId: string) {
      if (this.roles[guildId]) {
        this.roles[guildId] = this.roles[guildId].filter(
          (role: Role) => role.id !== roleId
        );
      }
    },

    // Clear all roles
    clearAllRoles() {
      this.roles = {};
      this.loading = false;
      this.error = null;
    },
  },
});
