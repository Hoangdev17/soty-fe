<script setup lang="ts">
import type { AvatarProps, SelectItem } from "@nuxt/ui";
import { useCommunityStore } from "~/stores/community/community.store";
import { useProjectStore } from "~/stores/project/project.store";
import {
  TaskPriority,
  TaskStatus,
  TaskType,
  type CreateTaskPayLoad,
} from "~/stores/project/project.type";

const props = defineProps<{
  modelValue: boolean;
}>();

const emit = defineEmits(["update:modelValue"]);

const isOpen = computed({
  get: () => props.modelValue,
  set: (val) => emit("update:modelValue", val),
});

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

const form = ref({
  title: "",
  description: "",
  type: itemsType[0]!.value,
  status: itemStatus[0]!.value,
  priority: itemPriority[0]!.value,
  startDate: "",
  dueDate: "",
  assigneeId: "",
});

const communityStore = useCommunityStore();
const projectStore = useProjectStore();
const { currentCommunity } = storeToRefs(communityStore);
const route = useRoute();

const projectId = route.params.project_id as string;
const guildId = route.params.guild_id as string;

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

function handleCancel() {
  resetForm();
  isOpen.value = false;
}

function resetForm() {
  form.value = {
    title: "",
    description: "",
    type: TaskType.TASK,
    status: TaskStatus.TODO,
    priority: TaskPriority.MEDIUM,
    startDate: "",
    dueDate: "",
    assigneeId: "Assignee",
  };
}

async function handleCreateTask() {
  const payload: CreateTaskPayLoad = {
    ...form.value,
    startDate: form.value.startDate
      ? new Date(form.value.startDate + "T00:00:00Z")
      : undefined,
    dueDate: form.value.dueDate
      ? new Date(form.value.dueDate + "T00:00:00Z")
      : undefined,
  };
  await projectStore.createTask(guildId, projectId, payload);

  resetForm();
  isOpen.value = false;
}
</script>

<template>
  <UModal v-model:open="isOpen">
    <!-- Header -->
    <template #header>
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-3">
          <div class="p-2 bg-primary-50 dark:bg-primary-900/20 rounded-lg">
            <UIcon
              name="i-lucide-plus-circle"
              class="w-5 h-5 text-primary-500"
            />
          </div>
          <div>
            <h3 class="text-lg font-semibold text-gray-900 dark:text-white">
              Create New Task
            </h3>
            <p class="text-sm text-gray-500 dark:text-gray-400">
              Add a new task to your project
            </p>
          </div>
        </div>
      </div>
    </template>

    <template #body>
      <div class="space-y-6 p-6">
        <!-- Task Name & Description -->
        <div class="space-y-4">
          <UFormField label="Task Name" required>
            <UInput
              v-model="form.title"
              placeholder="Enter task name"
              size="lg"
              icon="i-lucide-file-text"
              class="w-full"
            />
          </UFormField>

          <UFormField label="Description">
            <UTextarea
              v-model="form.description"
              placeholder="Describe your task in detail..."
              :rows="3"
              resize
              class="w-full"
            />
          </UFormField>
        </div>

        <!-- Type, Status, Priority Grid -->
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

        <!-- Date Range -->
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
            placeholder="Assignee"
            size="lg"
            class="w-full"
          />
        </UFormField>
      </div>
    </template>

    <!-- Footer -->
    <template #footer>
      <div class="flex gap-3">
        <UButton
          color="neutral"
          variant="ghost"
          size="lg"
          icon="i-lucide-x"
          @click="handleCancel()"
        >
          Cancel
        </UButton>

        <UButton
          color="primary"
          size="lg"
          icon="i-lucide-plus-circle"
          :disabled="!form.title"
          class="ml-auto"
          @click="handleCreateTask()"
        >
          Create Task
        </UButton>
      </div>
    </template>
  </UModal>
</template>
