<script setup lang="ts">
import { h, resolveComponent, computed } from "vue";
import type { ContextMenuItem, TableColumn, TableRow } from "@nuxt/ui";
import { useClipboard } from "@vueuse/core";
import {
  TaskPriority,
  TaskStatus,
  TaskType,
  type Task,
} from "~/stores/project/project.type";
import { useProjectStore } from "~/stores/project/project.store";
import { useCommunityStore } from "~/stores/community/community.store";
import { useMemberStore } from "~/stores/member/member.store";
import CreateTaskModal from "~/components/organisms/create.task.modal.vue";

definePageMeta({
  layout: "community-layout",
  middleware: "required-auth",
});

const projectStore = useProjectStore();
const { currentProject } = storeToRefs(projectStore);
const communityStore = useCommunityStore();
const memberStore = useMemberStore();
const { currentCommunity } = storeToRefs(useCommunityStore());

const route = useRoute();

const projectId = route.params.project_id as string;
const guildId = route.params.guild_id as string;

const isOpenCreateTaskModal = ref(false);

onMounted(async () => {
  if (!currentCommunity.value) {
    await communityStore.fetchCommunityById(guildId);
    await memberStore.fetchMembersViaWebSocket(guildId);
  }
  await projectStore.getDetailProject(guildId, projectId);
});

const UBadge = resolveComponent("UBadge");
const UCheckbox = resolveComponent("UCheckbox");
const UAvatar = resolveComponent("UAvatar");

const isOpenEditModal = ref(false);
const taskEditId = ref("");

const toast = useToast();
const { copy } = useClipboard();

// Computed statistics
const statistics = computed(() => {
  const tasks = currentProject.value?.tasks || [];

  return {
    total: tasks.length,
    byStatus: {
      todo: tasks.filter((t) => t.status === TaskStatus.TODO).length,
      inProgress: tasks.filter((t) => t.status === TaskStatus.DOING).length,
      done: tasks.filter((t) => t.status === TaskStatus.DONE).length,
    },
    byPriority: {
      high: tasks.filter((t) => t.priority === TaskPriority.HIGH).length,
      medium: tasks.filter((t) => t.priority === TaskPriority.MEDIUM).length,
      low: tasks.filter((t) => t.priority === TaskPriority.LOW).length,
    },
    byType: {
      bug: tasks.filter((t) => t.type === TaskType.BUG).length,
      task: tasks.filter((t) => t.type === TaskType.TASK).length,
      story: tasks.filter((t) => t.type === TaskType.STORY).length,
    },
  };
});

const columns: TableColumn<Task>[] = [
  {
    id: "select",
    header: ({ table }) =>
      h(UCheckbox, {
        modelValue: table.getIsSomePageRowsSelected()
          ? "indeterminate"
          : table.getIsAllPageRowsSelected(),
        "onUpdate:modelValue": (value: boolean | "indeterminate") =>
          table.toggleAllPageRowsSelected(!!value),
        "aria-label": "Select all",
      }),
    cell: ({ row }) =>
      h(UCheckbox, {
        modelValue: row.getIsSelected(),
        "onUpdate:modelValue": (value: boolean | "indeterminate") =>
          row.toggleSelected(!!value),
        "aria-label": "Select row",
      }),
  },
  {
    accessorKey: "title",
    header: "Title",
    cell: ({ row }) => {
      const title = row.getValue("title") as string;
      return h(
        "div",
        {
          class:
            "max-w-[200px] truncate text-ellipsis overflow-hidden whitespace-nowrap",
          title,
        },
        title
      );
    },
  },
  {
    accessorKey: "type",
    header: "Issue Type",
    cell: ({ row }) => {
      const type = row.getValue("type") as string;

      const color =
        {
          TASK: "info",
          BUG: "error",
          STORY: "primary",
        }[type] || "neutral";

      return h(
        UBadge,
        {
          class: "capitalize",
          variant: "subtle",
          color,
        },
        () => type.toLowerCase()
      );
    },
  },
  {
    accessorKey: "priority",
    header: "Priority",
    cell: ({ row }) => {
      const priority = row.getValue("priority") as string;

      const color =
        {
          LOW: "neutral",
          MEDIUM: "primary",
          HIGH: "warning",
          URGENT: "error",
        }[priority] || "neutral";

      return h(
        UBadge,
        {
          class: "capitalize",
          variant: "subtle",
          color,
        },
        () => priority.toLowerCase()
      );
    },
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => {
      const status = row.getValue("status") as string;

      const color =
        {
          TODO: "neutral",
          DOING: "info",
          DONE: "success",
          BLOCKED: "error",
          TESTING: "warning",
          REWORK: "secondary",
        }[status] || "neutral";

      return h(
        UBadge,
        {
          class: "capitalize",
          variant: "subtle",
          color,
        },
        () => status.toLowerCase()
      );
    },
  },
  {
    accessorKey: "assignee",
    header: "Assignee",
    cell: ({ row }) => {
      const assignee = row.getValue("assignee") as {
        username: string;
        avatar?: string;
      };

      if (!assignee)
        return h("span", { class: "text-gray-400 italic" }, "Unassigned");

      return h("div", { class: "flex items-center gap-2" }, [
        h(UAvatar, {
          src: assignee.avatar,
          alt: assignee.username,
          text: assignee.username?.charAt(0).toUpperCase(),
          size: "sm",
        }),
        h("span", { class: "font-medium" }, assignee.username),
      ]);
    },
  },
  {
    accessorKey: "startDate",
    header: "Start Date",
    cell: ({ row }) => {
      return new Date(row.getValue("startDate")).toLocaleString("en-US", {
        day: "numeric",
        month: "short",
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      });
    },
  },
  {
    accessorKey: "dueDate",
    header: "Due Date",
    cell: ({ row }) => {
      return new Date(row.getValue("dueDate")).toLocaleString("en-US", {
        day: "numeric",
        month: "short",
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      });
    },
  },
];

const items = ref<ContextMenuItem[]>([]);

function getRowItems(row: TableRow<Task>) {
  return [
    {
      label: "Copy ID",
      icon: "i-lucide-copy",
      onSelect() {
        copy(row.original.id);

        toast.add({
          title: "Task ID copied to clipboard!",
          color: "success",
          icon: "i-lucide-circle-check",
        });
      },
    },
    {
      label: "Edit",
      icon: "i-lucide-pencil",
      onSelect() {
        isOpenEditModal.value = true;
        taskEditId.value = row.original.id;
      },
    },
    {
      label: "Delete",
      icon: "i-lucide-trash-2",
      color: "error" as const,
      onSelect: async () => {
        if (confirm("Are you sure you want to delete this task?")) {
          await projectStore.deleteTask(guildId, projectId, row.original.id);
          toast.add({
            title: "Task deleted successfully!",
            color: "error",
            icon: "i-lucide-trash",
          });
        }
      },
    },
  ];
}

function onContextmenu(_e: Event, row: TableRow<Task>) {
  items.value = getRowItems(row);
}

const daysSinceCreated = computed(() => {
  if (!currentProject?.value?.createdAt) return null;

  const now = new Date();
  const createdAt = new Date(currentProject.value.createdAt);
  const diffTime = now.getTime() - createdAt.getTime();
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

  return diffDays;
});

function handleOpenCreateTaskModel() {
  isOpenCreateTaskModal.value = true;
}
</script>

<template>
  <div class="flex justify-center mt-3">
    <div class="max-w-5xl w-full space-y-6 flex flex-col">
      <UCard class="p-4 shadow-lg rounded-xl">
        <!-- Header: Icon + Project Name -->
        <div class="flex items-center gap-3 mb-3">
          <UIcon name="i-lucide-book" class="w-8 h-8 text-blue-500" />
          <h2 class="text-2xl font-bold">
            {{ currentProject?.name }}
          </h2>
        </div>

        <!-- Owner Info -->
        <div class="flex items-center gap-2 text-gray-600">
          <UIcon name="i-lucide-user" class="w-5 h-5 text-gray-500" />
          <span class="font-medium text-gray-500">Owner:</span>
          <span class="text-white"
            ><UAvatar
              :src="currentProject?.owner.avatar"
              :alt="currentProject?.owner.username"
              class="w-6 h-6 mr-1 ml-2"
            ></UAvatar>
            {{ currentProject?.owner.username }}</span
          >
        </div>

        <div class="flex items-center gap-2 text-gray-600 mt-1.5">
          <div class="flex font-medium text-gray-500">
            <UIcon
              name="i-lucide-loader"
              class="w-5 h-5 text-gray-500 mt-0.5"
            />
            <span class="ml-2"> Status:</span>
          </div>
          <UBadge color="info" variant="soft" class="ml-3">Active</UBadge>
        </div>

        <div class="flex items-center gap-2 text-gray-600 mt-1.5">
          <div class="flex font-medium text-gray-500">
            <UIcon
              name="i-lucide-calendar-days"
              class="w-5 h-5 text-gray-500 mt-0.5"
            />
            <span class="ml-2"> Start Date :</span>
          </div>
          <span class="text-white">
            {{
              currentProject?.createdAt
                ? new Date(currentProject.createdAt).toLocaleDateString("vi-VN")
                : ""
            }}
          </span>
        </div>

        <div class="flex items-center gap-2 text-gray-600 mt-1.5">
          <div class="flex font-medium text-gray-500">
            <UIcon
              name="i-lucide-calendar-days"
              class="w-5 h-5 text-gray-500 mt-0.5"
            />
            <span class="ml-2">Remaining Created:</span>
          </div>
          <span class="text-white">
            {{
              daysSinceCreated !== null
                ? daysSinceCreated + " Days Remaining"
                : ""
            }}
          </span>
        </div>
      </UCard>

      <!-- Statistics Cards -->
      <div class="grid grid-cols-1 md:grid-cols-4 gap-4 mt-3">
        <!-- Total Tasks -->
        <UCard>
          <div class="space-y-2">
            <p class="text-sm text-gray-500 dark:text-gray-400">Total Tasks</p>
            <p class="text-3xl font-bold">{{ statistics.total }}</p>
          </div>
        </UCard>

        <!-- By Status -->
        <UCard>
          <div class="space-y-2">
            <p class="text-sm text-gray-500 dark:text-gray-400">Status</p>
            <div class="space-y-1">
              <div class="flex justify-between text-sm">
                <span>To Do</span>
                <span class="font-semibold">{{
                  statistics.byStatus.todo
                }}</span>
              </div>
              <div class="flex justify-between text-sm">
                <span>In Progress</span>
                <span class="font-semibold">{{
                  statistics.byStatus.inProgress
                }}</span>
              </div>
              <div class="flex justify-between text-sm">
                <span>Done</span>
                <span class="font-semibold">{{
                  statistics.byStatus.done
                }}</span>
              </div>
            </div>
          </div>
        </UCard>

        <!-- By Priority -->
        <UCard>
          <div class="space-y-2">
            <p class="text-sm text-gray-500 dark:text-gray-400">Priority</p>
            <div class="space-y-1">
              <div class="flex justify-between text-sm">
                <span class="flex items-center gap-1">
                  <span class="w-2 h-2 rounded-full bg-red-500"></span>
                  High
                </span>
                <span class="font-semibold">{{
                  statistics.byPriority.high
                }}</span>
              </div>
              <div class="flex justify-between text-sm">
                <span class="flex items-center gap-1">
                  <span class="w-2 h-2 rounded-full bg-yellow-500"></span>
                  Medium
                </span>
                <span class="font-semibold">{{
                  statistics.byPriority.medium
                }}</span>
              </div>
              <div class="flex justify-between text-sm">
                <span class="flex items-center gap-1">
                  <span class="w-2 h-2 rounded-full bg-green-500"></span>
                  Low
                </span>
                <span class="font-semibold">{{
                  statistics.byPriority.low
                }}</span>
              </div>
            </div>
          </div>
        </UCard>

        <!-- By Type -->
        <UCard>
          <div class="space-y-2">
            <p class="text-sm text-gray-500 dark:text-gray-400">Type</p>
            <div class="space-y-1">
              <div class="flex justify-between text-sm">
                <span>Bug</span>
                <span class="font-semibold">{{ statistics.byType.bug }}</span>
              </div>
              <div class="flex justify-between text-sm">
                <span>Task</span>
                <span class="font-semibold">{{ statistics.byType.task }}</span>
              </div>
              <div class="flex justify-between text-sm">
                <span>Story</span>
                <span class="font-semibold">{{ statistics.byType.story }}</span>
              </div>
            </div>
          </div>
        </UCard>
      </div>

      <div class="flex justify-end">
        <UButton @click="handleOpenCreateTaskModel()">+ New Task</UButton>
      </div>

      <!-- Table -->
      <UContextMenu :items="items">
        <UTable
          :data="currentProject?.tasks"
          :columns="columns"
          @contextmenu="onContextmenu"
        >
          <template #expanded="{ row }">
            <pre>{{ row.original }}</pre>
          </template>
        </UTable>
      </UContextMenu>
    </div>
  </div>

  <CreateTaskModal v-model="isOpenCreateTaskModal" />
  <OrganismsUpdateTaskModel v-model="isOpenEditModal" :task-id="taskEditId" />
</template>
