import { useProjectStore } from "./project.store";
import type {
  CreateTaskPayLoad,
  GetProjectCommunityPayload,
  Project,
  Task,
  UpdateTaskPayLoad,
} from "./project.type";

export const projectAction = {
  async getProjectListByCommunity(guildId: string) {
    const { fetchWithAuth } = useFetchWithAuth();
    const projectStore = useProjectStore();
    const { projects, projectCount } = storeToRefs(projectStore);

    const res = await fetchWithAuth<GetProjectCommunityPayload>(
      `/community/${guildId}/projects`,
      {
        method: "GET",
      }
    );

    projects.value = res.projects;
    projectCount.value = res.total;

    return res;
  },

  async createProject(
    guildId: string,
    dto: {
      name: string;
      description: string;
    }
  ) {
    const { fetchWithAuth } = useFetchWithAuth();
    const projectStore = useProjectStore();

    const res = await fetchWithAuth<Project>(`/community/${guildId}/projects`, {
      method: "POST",
      body: JSON.stringify(dto),
    });

    projectStore.projects.push(res);
    projectStore.projectCount = (projectStore.projectCount ?? 0) + 1;

    return res;
  },

  async getDetailProject(guildId: string, projectId: string) {
    const { fetchWithAuth } = useFetchWithAuth();
    const projectStore = useProjectStore();

    const res = await fetchWithAuth<Project>(
      `/community/${guildId}/projects/${projectId}`,
      {
        method: "GET",
      }
    );

    projectStore.currentProject = res;

    return res;
  },

  async createTask(
    guildId: string,
    projectId: string,
    dto?: CreateTaskPayLoad
  ) {
    const { fetchWithAuth } = useFetchWithAuth();
    const projectStore = useProjectStore();

    try {
      const res = await fetchWithAuth<Task>(
        `/community/${guildId}/projects/${projectId}/tasks`,
        {
          method: "POST",
          body: JSON.stringify(dto),
        }
      );

      if (!projectStore.currentProject) return res;

      if (!Array.isArray(projectStore.currentProject.tasks)) {
        projectStore.currentProject.tasks = [];
      }

      projectStore.currentProject.tasks.push(res);

      return res;
    } catch (error) {
      console.error("❌ Lỗi khi tạo task:", error);
      throw error;
    }
  },

  async updateTask(
    guildId: string,
    projectId: string,
    taskId: string,
    dto?: UpdateTaskPayLoad
  ) {
    const { fetchWithAuth } = useFetchWithAuth();
    const projectStore = useProjectStore();

    try {
      const res = await fetchWithAuth<Task>(
        `/community/${guildId}/projects/${projectId}/tasks/${taskId}`,
        {
          method: "PATCH",
          body: JSON.stringify(dto),
        }
      );

      if (!projectStore.currentProject) return res;

      if (!Array.isArray(projectStore.currentProject.tasks)) {
        projectStore.currentProject.tasks = [];
      }

      const index = projectStore.currentProject.tasks.findIndex(
        (t) => t.id === taskId
      );

      if (index !== -1) {
        projectStore.currentProject.tasks[index] = res;
      } else {
        projectStore.currentProject.tasks.unshift(res);
      }

      return res;
    } catch (error) {
      console.error("❌ Lỗi khi tạo task:", error);
      throw error;
    }
  },

  async getTaskById(guildId: string, projectId: string, taskId: string) {
    const { fetchWithAuth } = useFetchWithAuth();
    const projectStore = useProjectStore();

    try {
      const res = await fetchWithAuth<Task>(
        `/community/${guildId}/projects/${projectId}/tasks/${taskId}`,
        {
          method: "GET",
        }
      );

      return res;
    } catch (error) {
      console.error("❌ Lỗi khi tạo task:", error);
      throw error;
    }
  },

  async deleteTask(guildId: string, projectId: string, taskId: string) {
    const { fetchWithAuth } = useFetchWithAuth();
    const projectStore = useProjectStore();

    try {
      // Gửi request DELETE
      const res = await fetchWithAuth<Task>(
        `/community/${guildId}/projects/${projectId}/tasks/${taskId}`,
        {
          method: "DELETE",
        }
      );

      if (projectStore.currentProject?.tasks) {
        projectStore.currentProject.tasks =
          projectStore.currentProject.tasks.filter((t) => t.id !== taskId);
      }

      return res;
    } catch (error) {
      console.error("❌ Lỗi khi xóa task:", error);
      throw error;
    }
  },
};
