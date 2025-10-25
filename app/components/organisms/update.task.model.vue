<script setup lang="ts">
import type { AvatarProps, SelectItem } from "@nuxt/ui";
import { useCommunityStore } from "~/stores/community/community.store";
import { useProjectStore } from "~/stores/project/project.store";
import {
  TaskPriority,
  TaskStatus,
  TaskType,
  type Task,
  type UpdateTaskPayLoad,
} from "~/stores/project/project.type";

const props = defineProps<{
  modelValue: boolean;
  taskId: string;
}>();

const emit = defineEmits(["update:modelValue", "updated"]);

const isOpen = computed({
  get: () => props.modelValue,
  set: (val) => emit("update:modelValue", val),
});

const communityStore = useCommunityStore();
const projectStore = useProjectStore();
const { currentCommunity } = storeToRefs(communityStore);

const route = useRoute();
const projectId = route.params.project_id as string;
const guildId = route.params.guild_id as string;

// ---------- Select Data ----------
const itemsType = [
  {
    label: "Task",
    value: TaskType.TASK,
    icon: "i-lucide-clipboard-list",
    color: "text-blue-500",
  },
  {
    label: "Bug",
    value: TaskType.BUG,
    icon: "i-lucide-bug",
    color: "text-red-500",
  },
];

const itemStatus = [
  {
    label: "To Do",
    value: TaskStatus.TODO,
    icon: "i-lucide-list-todo",
    color: "text-gray-500",
  },
  {
    label: "Doing",
    value: TaskStatus.DOING,
    icon: "i-lucide-loader",
    color: "text-blue-500",
  },
  {
    label: "Done",
    value: TaskStatus.DONE,
    icon: "i-lucide-check-circle",
    color: "text-green-500",
  },
  {
    label: "Blocked",
    value: TaskStatus.BLOCKED,
    icon: "i-lucide-ban",
    color: "text-red-500",
  },
  {
    label: "Testing",
    value: TaskStatus.TESTING,
    icon: "i-lucide-flask-conical",
    color: "text-yellow-500",
  },
  {
    label: "Rework",
    value: TaskStatus.REWORK,
    icon: "i-lucide-rotate-cw",
    color: "text-purple-500",
  },
];

const itemPriority = [
  {
    label: "Low",
    value: TaskPriority.LOW,
    icon: "i-lucide-arrow-down",
    color: "text-gray-500",
  },
  {
    label: "Medium",
    value: TaskPriority.MEDIUM,
    icon: "i-lucide-arrow-up",
    color: "text-yellow-500",
  },
  {
    label: "High",
    value: TaskPriority.HIGH,
    icon: "i-lucide-alert-triangle",
    color: "text-orange-500",
  },
  {
    label: "Urgent",
    value: TaskPriority.URGENT,
    icon: "i-lucide-zap",
    color: "text-red-500",
  },
];

// ---------- Form ----------
const form = ref({
  title: "",
  description: "",
  type: TaskType.TASK,
  status: TaskStatus.TODO,
  priority: TaskPriority.MEDIUM,
  startDate: "",
  dueDate: "",
  assigneeId: "",
});

// ---------- Fetch task ----------
async function fetchTask() {
  const task = await projectStore.getTaskById(guildId, projectId, props.taskId);
  if (task) {
    form.value = {
      title: task.title ?? "",
      description: task.description ?? "",
      type: task.type ?? TaskType.TASK,
      status: task.status ?? TaskStatus.TODO,
      priority: task.priority ?? TaskPriority.MEDIUM,
      startDate:
        (task.startDate
          ? new Date(task.startDate).toISOString().split("T")[0]
          : "") ?? "",
      dueDate:
        (task.dueDate
          ? new Date(task.dueDate).toISOString().split("T")[0]
          : "") ?? "",
      assigneeId: task.assignee?.id ?? "",
    };
  }
}

watch(
  () => props.taskId,
  (newId) => {
    if (newId) fetchTask();
  },
  { immediate: true }
);

// ---------- Select members ----------
const members = computed(() => currentCommunity.value?.members ?? []);
const selectItems = computed<SelectItem[]>(() =>
  members.value.map((member) => {
    const username = member?.user?.username ?? "Unknown";
    return {
      label: username,
      value: member?.user?.id ?? "",
      avatar: member?.user?.avatar
        ? ({ src: member.user.avatar } as AvatarProps)
        : ({ alt: username[0] } as AvatarProps),
    };
  })
);

// ---------- Actions ----------
function handleCancel() {
  isOpen.value = false;
}

async function handleUpdateTask() {
  const payload: UpdateTaskPayLoad = {
    title: form.value.title,
    description: form.value.description || undefined,
    type: form.value.type,
    status: form.value.status,
    priority: form.value.priority,
    startDate: form.value.startDate
      ? new Date(form.value.startDate)
      : undefined,
    dueDate: form.value.dueDate ? new Date(form.value.dueDate) : undefined,
    assigneeId: form.value.assigneeId || undefined,
  };

  await projectStore.updateTask(guildId, projectId, props.taskId, payload);
  emit("updated");
  isOpen.value = false;
}
</script>

<template>
  <UModal v-model:open="isOpen">
    <template #header>
      <div class="flex items-center gap-3">
        <div class="p-2 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
          <UIcon name="i-lucide-pencil" class="w-5 h-5 text-yellow-500" />
        </div>
        <div>
          <h3 class="text-lg font-semibold">Update Task</h3>
          <p class="text-sm text-gray-500 dark:text-gray-400">
            Edit task details and save changes
          </p>
        </div>
      </div>
    </template>

    <template #body>
      <div class="space-y-6 p-6">
        <UFormField label="Task Name" required>
          <UInput
            v-model="form.title"
            size="lg"
            icon="i-lucide-file-text"
            class="w-full"
          />
        </UFormField>

        <UFormField label="Description">
          <UTextarea
            v-model="form.description"
            :rows="3"
            resize
            class="w-full"
          />
        </UFormField>

        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <UFormField label="Type" required>
            <USelect
              v-model="form.type"
              :items="itemsType"
              option-attribute="label"
              size="lg"
            >
              <template #item="{ item }">
                <div class="flex items-center gap-2">
                  <UIcon :name="item.icon" :class="item.color" />
                  <span>{{ item.label }}</span>
                </div>
              </template>

              <template #leading>
                <UIcon
                  :name="itemsType.find((i) => i.value === form.type)?.icon!"
                  :class="itemsType.find((i) => i.value === form.type)?.color"
                />
              </template>
            </USelect>
          </UFormField>

          <UFormField label="Status" required>
            <USelect
              v-model="form.status"
              :items="itemStatus"
              option-attribute="label"
              size="lg"
            >
              <template #item="{ item }">
                <div class="flex items-center gap-2">
                  <UIcon :name="item.icon" :class="item.color" />
                  <span>{{ item.label }}</span>
                </div>
              </template>

              <template #leading>
                <UIcon
                  :name="itemStatus.find((i) => i.value === form.status)?.icon!"
                  :class="
                    itemStatus.find((i) => i.value === form.status)?.color
                  "
                />
              </template>
            </USelect>
          </UFormField>

          <UFormField label="Priority" required>
            <USelect
              v-model="form.priority"
              :items="itemPriority"
              option-attribute="label"
              size="lg"
            >
              <template #item="{ item }">
                <div class="flex items-center gap-2">
                  <UIcon :name="item.icon" :class="item.color" />
                  <span>{{ item.label }}</span>
                </div>
              </template>

              <template #leading>
                <UIcon
                  :name="itemPriority.find((i) => i.value === form.priority)?.icon!"
                  :class="
                    itemPriority.find((i) => i.value === form.priority)?.color
                  "
                />
              </template>
            </USelect>
          </UFormField>
        </div>

        <div class="space-y-4">
          <div
            class="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300"
          >
            <UIcon name="i-lucide-calendar" class="w-4 h-4" />
            <span>Timeline</span>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <UFormField label="Start Date">
              <UInput
                v-model="form.startDate"
                type="date"
                size="lg"
                icon="i-lucide-calendar-arrow-up"
              />
            </UFormField>

            <UFormField label="Due Date">
              <UInput
                v-model="form.dueDate"
                type="date"
                size="lg"
                icon="i-lucide-calendar-check"
              />
            </UFormField>
          </div>
        </div>

        <UFormField label="Assignee" required>
          <USelect
            v-model="form.assigneeId"
            :items="selectItems"
            option-attribute="label"
            size="lg"
            class="w-full"
          />
        </UFormField>
      </div>
    </template>

    <template #footer>
      <div class="flex gap-3">
        <UButton
          color="neutral"
          variant="ghost"
          size="lg"
          icon="i-lucide-x"
          @click="handleCancel"
        >
          Cancel
        </UButton>
        <UButton
          color="primary"
          size="lg"
          icon="i-lucide-save"
          class="ml-auto"
          :disabled="!form.title"
          @click="handleUpdateTask"
        >
          Update Task
        </UButton>
      </div>
    </template>
  </UModal>
</template>
