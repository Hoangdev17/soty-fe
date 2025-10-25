<script setup lang="ts">
import { useCommunityStore } from "~/stores/community/community.store";
import { useMemberStore } from "~/stores/member/member.store";
import { useProjectStore } from "~/stores/project/project.store";

definePageMeta({
  layout: "community-layout",
  middleware: "required-auth",
});

const projectStore = useProjectStore();
const { currentCommunity } = storeToRefs(useCommunityStore());
const { projects, projectCount } = storeToRefs(projectStore);
const communityStore = useCommunityStore();
const memberStore = useMemberStore();
const route = useRoute();

const guildId = route.params.guild_id as string;

async function fetchProject() {
  await projectStore.getProjectListByCommunity(guildId);
}

onMounted(async () => {
  if (!currentCommunity.value) {
    await communityStore.fetchCommunityById(guildId);
    await memberStore.fetchMembersViaWebSocket(guildId);
  }
  fetchProject();
});

const view = ref("grid");
const searchTerm = ref("");
const isCreateModalOpen = ref(false);

const filteredProjects = computed(() => {
  return projects.value.filter(
    (project) =>
      project.name.toLowerCase().includes(searchTerm.value.toLowerCase()) ||
      project.description
        ?.toLowerCase()
        .includes(searchTerm.value.toLowerCase())
  );
});

const getProjectItems = (project: any) => [
  [
    {
      label: "Add to favorites",
      icon: "i-heroicons-star",
    },
  ],
  [
    {
      label: "Delete",
      icon: "i-heroicons-trash",
    },
  ],
];
</script>

<template>
  <div class="min-h-screen bg-gray-50 dark:bg-gray-900">
    <!-- Header -->
    <div class="dark:border-gray-800 dark:bg-gray-950">
      <div class="max-w-7xl mx-auto px-6 py-4">
        <div class="flex items-center justify-between mb-4">
          <div>
            <h1 class="text-2xl font-semibold text-gray-900 dark:text-white">
              Projects
            </h1>
            <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">
              {{ projectCount ?? 0 }}
            </p>
          </div>

          <UButton
            icon="i-heroicons-plus"
            size="lg"
            label="New Project"
            @click="isCreateModalOpen = true"
          />
        </div>

        <!-- Search and View Toggle -->
        <div class="flex items-center gap-3">
          <UInput
            v-model="searchTerm"
            icon="i-heroicons-magnifying-glass"
            size="lg"
            placeholder="Search projects..."
            class="flex-1"
          />

          <UButtonGroup size="lg">
            <UButton
              :color="view === 'grid' ? 'primary' : 'neutral'"
              variant="soft"
              icon="i-heroicons-squares-2x2"
              @click="view = 'grid'"
            />
            <UButton
              :color="view === 'list' ? 'primary' : 'neutral'"
              variant="soft"
              icon="i-heroicons-list-bullet"
              @click="view = 'list'"
            />
          </UButtonGroup>
        </div>
      </div>
    </div>

    <!-- Content -->
    <div class="max-w-7xl mx-auto px-6 py-8">
      <!-- All Projects Section -->
      <div>
        <h2
          class="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide mb-4"
        >
          All Projects
        </h2>

        <!-- Grid View -->
        <div
          v-if="view === 'grid'"
          class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
        >
          <div
            v-for="project in projects"
            :key="project.id"
            @click="
              () => {
                navigateTo(
                  `/community/@${currentCommunity?.name}-${currentCommunity?.id}/project/${project.id}`
                );
              }
            "
            class="cursor-pointer"
          >
            <UCard class="hover:shadow-lg transition-shadow group">
              <template #header>
                <div class="flex items-start justify-between">
                  <div class="flex items-center gap-3">
                    <div class="flex min-w-0">
                      <UIcon
                        name="i-lucide-book"
                        class="w-6 h-6 text-blue-500 mt-1.5"
                      />
                      <h3
                        class="font-semibold text-gray-900 dark:text-white truncate ml-1 text-2xl"
                      >
                        {{ project.name }}
                      </h3>
                    </div>
                  </div>

                  <UDropdown :items="getProjectItems(project)">
                    <UButton
                      color="neutral"
                      variant="ghost"
                      icon="i-heroicons-ellipsis-horizontal"
                      size="xs"
                      class="opacity-0 group-hover:opacity-100"
                      @click.stop
                    />
                  </UDropdown>
                </div>
              </template>

              <div class="space-y-3">
                <!-- Description -->
                <p
                  class="text-sm text-gray-600 dark:text-gray-400 line-clamp-2"
                >
                  {{ project.description || "No description provided." }}
                </p>

                <!-- Owner -->
                <div
                  class="flex items-center gap-2 text-gray-600 dark:text-gray-400"
                >
                  <UIcon name="i-lucide-user" class="w-4 h-4 text-gray-500" />
                  <span class="text-sm font-medium">Owner:</span>
                  <div class="flex items-center gap-2">
                    <UAvatar
                      :src="project?.owner.avatar"
                      :alt="project?.owner.username"
                      size="xs"
                    />
                    <span class="text-sm text-gray-800 dark:text-gray-200">
                      {{ project?.owner.username }}
                    </span>
                  </div>
                </div>

                <!-- Status -->
                <div
                  class="flex items-center gap-2 text-gray-600 dark:text-gray-400"
                >
                  <UIcon
                    name="i-lucide-activity"
                    class="w-4 h-4 text-gray-500"
                  />
                  <span class="text-sm font-medium">Status:</span>
                  <UBadge
                    color="success"
                    variant="soft"
                    size="xs"
                    class="ml-1 capitalize"
                  >
                    Active
                  </UBadge>
                </div>

                <!-- Start Date -->
                <div
                  class="flex items-center gap-2 text-gray-600 dark:text-gray-400"
                >
                  <UIcon
                    name="i-lucide-calendar-days"
                    class="w-4 h-4 text-gray-500"
                  />
                  <span class="text-sm font-medium">Start Date:</span>
                  <span class="text-sm text-gray-800 dark:text-gray-200">
                    {{
                      project?.createdAt
                        ? new Date(project.createdAt).toLocaleDateString(
                            "vi-VN"
                          )
                        : "N/A"
                    }}
                  </span>
                </div>

                <!-- Remaining Days -->
                <div
                  class="flex items-center gap-2 text-gray-600 dark:text-gray-400"
                >
                  <UIcon name="i-lucide-timer" class="w-4 h-4 text-gray-500" />
                  <span class="text-sm font-medium">Active for:</span>
                  <span class="text-sm text-gray-800 dark:text-gray-200">
                    {{
                      project?.createdAt
                        ? Math.max(
                            0,
                            Math.ceil(
                              (Date.now() -
                                new Date(project.createdAt).getTime()) /
                                (1000 * 60 * 60 * 24)
                            )
                          ) + " days"
                        : "N/A"
                    }}
                  </span>
                </div>
              </div>
            </UCard>
          </div>
        </div>

        <!-- Empty State -->
        <div v-if="filteredProjects.length === 0" class="text-center py-12">
          <UIcon
            name="i-heroicons-folder-open"
            class="mx-auto text-6xl text-gray-300 dark:text-gray-700 mb-4"
          />
          <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            No projects found
          </h3>
          <p class="text-gray-500 dark:text-gray-400 mb-6">
            {{
              searchTerm
                ? "Try adjusting your search"
                : "Get started by creating your first project"
            }}
          </p>
          <UButton
            v-if="!searchTerm"
            icon="i-heroicons-plus"
            size="lg"
            @click="isCreateModalOpen = true"
          >
            Create Project
          </UButton>
        </div>
      </div>
    </div>
  </div>

  <OrganismsCreateProjectModal
    :model-value="isCreateModalOpen"
    @update:modelValue="isCreateModalOpen = $event"
  />
</template>
