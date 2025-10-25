export interface Project {
  id: string;
  name: string;
  description?: string;
  communityId: string;
  tasks: Task[];
  ownerId: string;
  owner: {
    id: string;
    username: string;
    avatar: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

export interface Story {
  id: string;
  title: string;
  description?: string;
  status: TaskStatus;
  priority: TaskPriority;
  projectId: string;
  tasks: Task[];
  createAt: Date;
  updatedAt: Date;
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  type: TaskType;
  status: TaskStatus;
  priority: TaskPriority;
  startDate?: Date;
  dueDate?: Date;
  markdown?: string;
  assigneeId?: string;
  assignee?: {
    id: string;
    username: string;
    avatar: string;
  };
  comments?: TaskComment[];
  createdAt: Date;
  updatedAt: Date;
}

export interface TaskComment {
  id: string;
  content: string;
  taskId: string;
  authorId: string;
  createdAt: Date;
  updatedAt: Date;
}

export enum TaskStatus {
  TODO = "TODO",
  DOING = "DOING",
  DONE = "DONE",
  BLOCKED = "BLOCKED",
  TESTING = "TESTING",
  REWORK = "REWORK",
}

export enum TaskPriority {
  LOW = "LOW",
  MEDIUM = "MEDIUM",
  HIGH = "HIGH",
  URGENT = "URGENT",
}

export enum TaskType {
  TASK = "TASK",
  BUG = "BUG",
  STORY = "STORY",
}

export interface GetProjectCommunityPayload {
  projects: Project[];
  total: number;
}

export interface CreateTaskPayLoad {
  title: string;
  description?: string;
  type: TaskType;
  status: TaskStatus;
  priority: TaskPriority;
  startDate?: Date;
  dueDate?: Date;
  assigneeId?: string;
  parentId?: string;
}

export interface UpdateTaskPayLoad {
  title?: string;
  description?: string;
  type?: TaskType;
  status?: TaskStatus;
  priority?: TaskPriority;
  startDate?: Date;
  dueDate?: Date;
  assigneeId?: string;
  parentId?: string;
}
