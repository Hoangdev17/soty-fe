<script setup>
import { useCommunityStore } from "~/stores/community/community.store";
import { onMounted, computed, ref } from "vue";

const communityStore = useCommunityStore();
const route = useRoute();
const guildId = route.params.guild_id;

const isLoading = ref(false);

const joinRequests = computed(() => communityStore.joinRequests || []);

onMounted(async () => {
  if (!guildId) return;
  isLoading.value = true;
  try {
    if (
      !communityStore.currentCommunity ||
      communityStore.currentCommunity.id !== guildId
    ) {
      await communityStore.fetchCommunityById(guildId);
    }
    await communityStore.fetchJoinRequests(guildId);
  } catch (e) {
    console.error("Failed to fetch join requests:", e);
  } finally {
    isLoading.value = false;
  }
});

const approveLoading = ref({});
const rejectLoading = ref({});

const approve = async (reqId) => {
  approveLoading.value[reqId] = true;
  try {
    await communityStore.approveJoinRequest(guildId, reqId);
  } catch (e) {
    console.error("Approve failed:", e);
  } finally {
    approveLoading.value[reqId] = false;
  }
};

const reject = async (reqId) => {
  rejectLoading.value[reqId] = true;
  try {
    await communityStore.rejectJoinRequest(guildId, reqId);
  } catch (e) {
    console.error("Reject failed:", e);
  } finally {
    rejectLoading.value[reqId] = false;
  }
};

const closeSettings = () => {
  navigateTo(`/community/introduce/${guildId}`);
};
</script>

<template>
  <div class="flex bg-dark-900 min-h-screen">
    <OrganismsSidebarSettingCommunity />

    <div class="w-full max-w-3xl mx-auto p-6 rounded">
      <div class="flex items-center justify-between mb-4">
        <div>
          <h2 class="text-2xl font-bold text-white">Join Requests</h2>
          <p class="text-gray-400">
            Approve or reject users requesting to join this community.
          </p>
        </div>

        <div class="fixed top-4 right-4 z-10 flex flex-col items-center gap-1">
          <UButton
            @click="closeSettings"
            class="w-9 h-9 rounded-full bg-dark-800 hover:bg-dark-700 transition-colors flex items-center justify-center border border-dark-600"
            title="Đóng Roles"
          >
            <UIcon name="i-lucide-x" class="w-4 h-4 text-white" />
          </UButton>
          <span class="text-xs text-gray-400 font-medium">ESC</span>
        </div>
      </div>

      <div v-if="isLoading" class="text-gray-400">Loading...</div>

      <div v-else>
        <div v-if="!joinRequests.length" class="text-gray-400">
          No pending requests.
        </div>

        <div class="overflow-x-auto">
          <table class="min-w-full table-auto">
            <thead>
              <tr class="text-left">
                <th class="px-4 py-2 text-gray-400">User</th>
                <th class="px-4 py-2 text-gray-400">Requested At</th>
                <th class="px-4 py-2 text-gray-400">Status</th>
                <th class="px-4 py-2 text-gray-400">Actions</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-dark-800">
              <tr v-for="r in joinRequests" :key="r.id" class="align-top">
                <td class="px-4 py-3">
                  <div class="flex items-center gap-3">
                    <UAvatar :src="r.user?.avatar" size="sm" />
                    <div>
                      <div class="text-white font-medium">
                        {{ r.user?.globalName || r.user?.username || "—" }}
                      </div>
                    </div>
                  </div>
                </td>

                <td class="px-4 py-3">
                  <div class="text-sm text-gray-300">
                    {{ new Date(r.createdAt).toLocaleString() }}
                  </div>
                </td>

                <td class="px-4 py-3">
                  <div>
                    <span
                      v-if="r.status === 'PENDING'"
                      class="inline-flex items-center px-2 py-0.5 rounded text-xs bg-yellow-100 text-yellow-800"
                      >Pending</span
                    >
                    <span
                      v-else-if="r.status === 'APPROVED'"
                      class="inline-flex items-center px-2 py-0.5 rounded text-xs bg-green-100 text-green-800"
                      >Approved</span
                    >
                    <span
                      v-else
                      class="inline-flex items-center px-2 py-0.5 rounded text-xs bg-red-100 text-red-800"
                      >Rejected</span
                    >
                  </div>
                </td>

                <td class="px-4 py-3">
                  <div class="flex items-center gap-2">
                    <UButton
                      size="sm"
                      color="primary"
                      variant="outline"
                      :loading="approveLoading[r.id]"
                      :disabled="r.status !== 'PENDING'"
                      @click="approve(r.id)"
                      >Approve</UButton
                    >
                    <UButton
                      size="sm"
                      color="error"
                      variant="outline"
                      :loading="rejectLoading[r.id]"
                      :disabled="r.status !== 'PENDING'"
                      @click="reject(r.id)"
                      >Reject</UButton
                    >
                  </div>
                </td>
              </tr>
              <tr v-if="!joinRequests.length">
                <td colspan="4" class="px-4 py-3 text-gray-400">
                  No pending requests.
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </div>
</template>
