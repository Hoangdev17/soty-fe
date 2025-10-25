import { defineStore } from "pinia";
import type { Project, Task } from "./project.type";
import { projectAction } from "./project.action";

export const useProjectStore = defineStore("project", {
  state: () => ({
    projects: [] as Project[],
    projectCount: null as number | null,
    currentProject: null as Project | null,
    currentTask: null as Task | null,
  }),

  actions: {
    ...projectAction,
  },
});
