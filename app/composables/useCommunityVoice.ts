import { useWebSocketStore } from "~/stores/websocket/websocket.store";

export interface VoiceParticipantData {
  participantId: string;
  username: string;
  avatar?: string;
  avatarEffectId?: string;
  channelId: string;
  joinedAt: string;
}

export interface VoiceChannelData {
  channelId: string;
  channelName?: string;
  participants: VoiceParticipantData[];
}

export interface CommunityVoiceChannelsData {
  communityId: string;
  voiceChannels: VoiceChannelData[];
}

// Singleton state - shared across all instances
const voiceParticipantsByChannel = ref<Record<string, VoiceParticipantData[]>>(
  {}
);

const communityVoiceChannels = ref<VoiceChannelData[]>([]);

let listenersSetup = false; // Track if listeners are already setup

/**
 * Handler function for adding participant (module scope for proper closure)
 */
const handleParticipantJoined = (data: VoiceParticipantData) => {
  const channelParticipants =
    voiceParticipantsByChannel.value[data.channelId] || [];

  const exists = channelParticipants.some(
    (p) => p.participantId === data.participantId
  );

  if (!exists) {
    voiceParticipantsByChannel.value = {
      ...voiceParticipantsByChannel.value,
      [data.channelId]: [...channelParticipants, data],
    };

    // Update channels list
    updateChannelsList();
  } else {
  }
};

/**
 * Update channels list from participants data (module scope)
 */
const updateChannelsList = () => {
  const channels: VoiceChannelData[] = [];

  Object.entries(voiceParticipantsByChannel.value).forEach(
    ([channelId, participants]) => {
      if (participants.length > 0) {
        // Find existing channel data for name
        const existingChannel = communityVoiceChannels.value.find(
          (ch) => ch.channelId === channelId
        );

        channels.push({
          channelId,
          channelName: existingChannel?.channelName,
          participants,
        });
      }
    }
  );

  communityVoiceChannels.value = channels;
};

/**
 * Handler for participant left event (module scope)
 */
const handleParticipantLeft = (data: any) => {
  const { participantId, channelId } = data;
  const channelParticipants = voiceParticipantsByChannel.value[channelId];

  if (channelParticipants) {
    voiceParticipantsByChannel.value[channelId] = channelParticipants.filter(
      (p) => p.participantId !== participantId
    );

    // Update channels list
    updateChannelsList();
  }
};

/**
 * Handler for voice channel left event (module scope)
 */
const handleVoiceChannelLeft = (response: any) => {
  if (response.success && response.data) {
    const data = response.data;

    const { participantId, channelId } = data;
    const channelParticipants = voiceParticipantsByChannel.value[channelId];

    if (channelParticipants) {
      voiceParticipantsByChannel.value[channelId] = channelParticipants.filter(
        (p) => p.participantId !== participantId
      );

      // Update channels list
      updateChannelsList();
    }
  }
};

/**
 * Cleanup listeners (module scope to access handler references)
 */
const cleanup = (socket: any) => {
  if (!socket) return;

  socket.off("community_voice_participants_list");
  socket.off("voice_participant_joined", handleParticipantJoined);
  socket.off("voice_participant_left", handleParticipantLeft);
  socket.off("voice_channel_left", handleVoiceChannelLeft);

  // Reset flag so it can be setup again
  listenersSetup = false;
};

export function useCommunityVoice() {
  const webSocketStore = useWebSocketStore();
  const socket = webSocketStore.connection;

  /**
   * Fetch voice participants for a community
   */
  const fetchCommunityVoiceParticipants = (communityId: string) => {
    if (!socket) {
      console.warn("WebSocket not connected");
      return;
    }

    // Emit request
    socket.emit("get_community_voice_participants", { communityId });
  };

  /**
   * Setup listeners for voice participant updates
   */
  const setupVoiceParticipantListeners = () => {
    // Get fresh socket reference from store
    const webSocketStore = useWebSocketStore();
    const socket = webSocketStore.connection;

    if (!socket) {
      console.warn(
        "⚠️ Cannot setup voice participant listeners - socket not available"
      );
      return;
    }

    // Check if already setup
    if (listenersSetup) {
      return;
    }

    listenersSetup = true;
    socket.on("community_voice_participants_list", (response: any) => {
      if (response.success && response.data) {
        const data: CommunityVoiceChannelsData = response.data;

        // Update channels list
        communityVoiceChannels.value = data.voiceChannels;

        const newParticipantsByChannel: Record<string, VoiceParticipantData[]> =
          { ...voiceParticipantsByChannel.value }; // Start with ALL existing data

        data.voiceChannels.forEach((channel) => {
          const existingParticipants =
            newParticipantsByChannel[channel.channelId] || [];
          const fetchedParticipants = channel.participants;

          // Create a map for efficient lookup and merging
          const participantMap = new Map(
            existingParticipants.map((p) => [p.participantId, p])
          );

          // Add or update with fetched participants
          fetchedParticipants.forEach((p) => {
            participantMap.set(p.participantId, p);
          });

          newParticipantsByChannel[channel.channelId] = Array.from(
            participantMap.values()
          );

          const finalParticipants = newParticipantsByChannel[channel.channelId];
        });

        voiceParticipantsByChannel.value = newParticipantsByChannel;
      } else {
        console.error("Failed to get voice participants:", response.error);
      }
    });

    // Listen for voice participant joined (from socket)
    socket.on("voice_participant_joined", handleParticipantJoined);

    // Listen for voice participant left
    socket.on("voice_participant_left", handleParticipantLeft);

    // Also listen for voice_channel_left (for compatibility)
    socket.on("voice_channel_left", handleVoiceChannelLeft);
  };

  /**
   * Get participants for a specific channel
   */
  const getChannelParticipants = (
    channelId: string
  ): VoiceParticipantData[] => {
    return voiceParticipantsByChannel.value[channelId] || [];
  };

  /**
   * Check if a user is in a voice channel
   */
  const isUserInVoiceChannel = (userId: string): boolean => {
    return Object.values(voiceParticipantsByChannel.value).some(
      (participants) => participants.some((p) => p.participantId === userId)
    );
  };

  /**
   * Get the channel a user is currently in
   */
  const getUserVoiceChannel = (userId: string): string | null => {
    for (const [channelId, participants] of Object.entries(
      voiceParticipantsByChannel.value
    )) {
      if (participants.some((p) => p.participantId === userId)) {
        return channelId;
      }
    }
    return null;
  };

  // Cleanup on unmount
  onUnmounted(() => {
    cleanup(socket);
  });

  return {
    voiceParticipantsByChannel,
    communityVoiceChannels,
    fetchCommunityVoiceParticipants,
    setupVoiceParticipantListeners,
    getChannelParticipants,
    isUserInVoiceChannel,
    getUserVoiceChannel,
    cleanup: () => cleanup(socket), // Wrap to pass socket
  };
}
