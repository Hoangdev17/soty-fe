import { useWebSocketStore } from "~/stores/websocket/websocket.store";
import { useAuthStore } from "~/stores/auth/auth.store";
import {
  Room,
  RoomEvent,
  Track,
  RemoteTrack,
  RemoteParticipant,
  LocalTrack,
  createLocalTracks,
  Participant,
} from "livekit-client";

export interface VoiceTokenGeneratedData {
  token: string;
  livekitUrl: string;
  roomName: string;
  existingParticipants?: Array<{
    participantId: string;
    username: string;
    channelId: string;
    joinedAt: string;
  }>;
}

export interface VoiceChannelJoinedData {
  channelId: string;
  roomName: string;
  participantId: string;
  username: string;
  avatar?: string;
  avatarEffectId?: string;
}

export interface VoiceChannelLeftData {
  channelId: string;
  roomName: string;
  participantId: string;
  username: string;
}

// ============================================
// SINGLETON STATE - Shared across all instances
// ============================================
const room = ref<Room | null>(null);
const isConnected = ref(false);
const isConnecting = ref(false);

// Local media state
const localStream = ref<MediaStream | null>(null);
const localVideoTrack = ref<LocalTrack | null>(null);
const localAudioTrack = ref<LocalTrack | null>(null);
const localScreenTrack = ref<LocalTrack | null>(null);

// Remote participants and streams
const remoteStreams = ref<{ [participantId: string]: MediaStream }>({});
const remoteScreenStreams = ref<{ [participantId: string]: MediaStream }>({});
const participants = ref<{ [participantId: string]: Participant }>({});

// Media controls
const isVideoEnabled = ref(false);
const isAudioEnabled = ref(true);
const isScreenSharing = ref(false);

// User info for UI
const usersInfo = ref<
  Record<
    string,
    {
      avatar?: string;
      avatarEffectId?: string;
      name?: string;
      username?: string;
      isVideoEnabled: boolean;
      isAudioEnabled: boolean;
      isScreenSharing?: boolean;
    }
  >
>({});

// Track if room event listeners are already set up
let roomListenersSetup = false;
let webSocketListenersSetup = false;

export function useVoiceChannelLiveKit() {
  const webSocketStore = useWebSocketStore();
  const socket = webSocketStore.connection;

  const usersInRoom = computed(() => Object.keys(participants.value));

  /**
   * Initialize and join a LiveKit voice channel
   */
  const init = async (channelId: string) => {
    if (isConnected.value) {
      console.warn("⚠️ Already connected to voice channel");
      return;
    }

    if (isConnecting.value) {
      console.warn("⚠️ Already connecting to voice channel");
      return;
    }

    try {
      isConnecting.value = true;

      // Get user info
      const authStore = useAuthStore();
      const username = authStore.user?.username || "Anonymous";

      // Request token from backend via WebSocket
      const tokenData = await requestVoiceChannelToken(channelId, username);

      if (!tokenData) {
        throw new Error("Failed to get voice channel token");
      }

      // Only create new Room if it doesn't exist
      if (!room.value) {
        room.value = new Room({
          adaptiveStream: false, // Disable adaptive stream để tránh downscaling
          dynacast: false, // Disable dynacast
          videoCaptureDefaults: {
            resolution: {
              width: 1280,
              height: 720,
              frameRate: 30,
            },
          },
          // Disable audio processors để tránh DataCloneError
          audioCaptureDefaults: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true,
            // Không sử dụng processors phức tạp
          },
        });
      } else {
      }

      // Setup event listeners (singleton pattern will prevent duplicates)
      setupRoomListeners();
      setupWebSocketListeners();

      // Connect to LiveKit server
      await room.value.connect(tokenData.livekitUrl, tokenData.token);

      // Create and publish local tracks
      await publishLocalTracks();

      // Check for existing remote participants và subscribe tracks của họ
      const remoteParticipants = Array.from(
        room.value.remoteParticipants.values()
      ) as RemoteParticipant[];

      remoteParticipants.forEach((participant: RemoteParticipant) => {
        // Add to participants list
        participants.value[participant.identity] = participant as Participant;

        // Initialize user info - merge with existing data if available
        if (!usersInfo.value[participant.identity]) {
          usersInfo.value[participant.identity] = {
            username: participant.name || participant.identity,
            isVideoEnabled: false,
            isAudioEnabled: false,
          };
        }
        // If already exists (from existingParticipants), keep avatar/avatarEffectId

        // Subscribe to existing tracks
        participant.trackPublications.forEach((publication) => {
          if (publication.track && publication.isSubscribed) {
            handleTrackSubscribed(
              publication.track as RemoteTrack,
              participant
            );
          }
        });
      });

      isConnected.value = true;
      isConnecting.value = false;
    } catch (error) {
      console.error("Error joining voice channel:", error);
      isConnecting.value = false;
      cleanup();
      throw error;
    }
  };

  /**
   * Request voice channel token from backend
   */
  const requestVoiceChannelToken = (
    channelId: string,
    username: string
  ): Promise<VoiceTokenGeneratedData | null> => {
    return new Promise((resolve, reject) => {
      if (!socket) {
        reject(new Error("WebSocket not connected"));
        return;
      }

      const timeout = setTimeout(() => {
        socket.off("voice_token_generated", responseHandler);
        reject(new Error("Timeout waiting for voice channel token"));
      }, 10000);

      const responseHandler = (data: any) => {
        clearTimeout(timeout);
        socket.off("voice_token_generated", responseHandler);

        // Backend trả về trực tiếp object { token, livekitUrl, roomName, existingParticipants }
        if (data && data.token && data.livekitUrl && data.roomName) {
          // Initialize user info cho existing participants
          if (
            data.existingParticipants &&
            Array.isArray(data.existingParticipants)
          ) {
            data.existingParticipants.forEach((participant: any) => {
              usersInfo.value[participant.participantId] = {
                username: participant.username,
                avatar: participant.avatar,
                avatarEffectId: participant.avatarEffectId,
                isVideoEnabled: false,
                isAudioEnabled: false,
              };
            });
          }

          resolve(data);
        } else {
          reject(new Error("Invalid token data format"));
        }
      };

      socket.on("voice_token_generated", responseHandler);

      // Send join request - không gửi metadata hoặc gửi string rỗng
      socket.emit("join_voice_channel", {
        channelId,
        username,
      });
    });
  };

  /**
   * Setup LiveKit room event listeners
   */
  const setupRoomListeners = () => {
    if (!room.value) return;

    // Prevent duplicate listener setup
    if (roomListenersSetup) {
      return;
    }

    roomListenersSetup = true;

    // Handle track subscribed (receiving remote media)
    room.value.on(
      RoomEvent.TrackSubscribed,
      (
        track: RemoteTrack,
        publication: any,
        participant: RemoteParticipant
      ) => {
        handleTrackSubscribed(track, participant);
      }
    );

    // Handle track unsubscribed
    room.value.on(
      RoomEvent.TrackUnsubscribed,
      (
        track: RemoteTrack,
        publication: any,
        participant: RemoteParticipant
      ) => {
        handleTrackUnsubscribed(track, participant);
      }
    );

    // Handle participant connected
    room.value.on(
      RoomEvent.ParticipantConnected,
      (participant: RemoteParticipant) => {
        participants.value[participant.identity] = participant;

        // Merge with existing user info (from socket event) instead of overwriting
        const existingInfo = usersInfo.value[participant.identity];
        usersInfo.value[participant.identity] = {
          username:
            existingInfo?.username || participant.name || participant.identity,
          avatar: existingInfo?.avatar, // Keep avatar from socket
          avatarEffectId: existingInfo?.avatarEffectId, // Keep avatarEffectId from socket
          isVideoEnabled: existingInfo?.isVideoEnabled ?? false,
          isAudioEnabled: existingInfo?.isAudioEnabled ?? false,
        };

        // Check if participant already has published tracks và subscribe chúng
        participant.trackPublications.forEach((publication) => {
          // Nếu track đã được published và subscribed, handle nó
          if (publication.track && publication.isSubscribed) {
            handleTrackSubscribed(
              publication.track as RemoteTrack,
              participant
            );
          }
        });
      }
    );

    // Handle participant disconnected
    room.value.on(
      RoomEvent.ParticipantDisconnected,
      (participant: RemoteParticipant) => {
        delete participants.value[participant.identity];
        delete remoteStreams.value[participant.identity];
        delete usersInfo.value[participant.identity];
      }
    );

    // Handle track muted/unmuted
    room.value.on(
      RoomEvent.TrackMuted,
      (publication: any, participant: Participant) => {
        const userInfo = usersInfo.value[participant.identity];
        if (userInfo) {
          if (publication.kind === Track.Kind.Video) {
            userInfo.isVideoEnabled = false;
          } else if (publication.kind === Track.Kind.Audio) {
            userInfo.isAudioEnabled = false;
          }
        }
      }
    );

    room.value.on(
      RoomEvent.TrackUnmuted,
      (publication: any, participant: Participant) => {
        const userInfo = usersInfo.value[participant.identity];
        if (userInfo) {
          if (publication.kind === Track.Kind.Video) {
            userInfo.isVideoEnabled = true;
          } else if (publication.kind === Track.Kind.Audio) {
            userInfo.isAudioEnabled = true;
          }
        }
      }
    );

    // Handle local track published (for screen share)
    room.value.on(RoomEvent.LocalTrackPublished, (publication: any) => {
      if (
        publication.source === Track.Source.ScreenShare &&
        publication.track
      ) {
        localScreenTrack.value = publication.track as LocalTrack;
        isScreenSharing.value = true;
      }
    });

    // Handle local track unpublished (for screen share)
    room.value.on(RoomEvent.LocalTrackUnpublished, (publication: any) => {
      if (publication.source === Track.Source.ScreenShare) {
        localScreenTrack.value = null;
        isScreenSharing.value = false;
      }
    });

    // Handle disconnection
    room.value.on(RoomEvent.Disconnected, () => {
      cleanup();
    });

    // Handle connection errors
    room.value.on(RoomEvent.ConnectionStateChanged, (state) => {});
  };

  /**
   * Setup WebSocket listeners for backend events
   */
  const setupWebSocketListeners = () => {
    if (!socket) return;

    // Prevent duplicate listener setup
    if (webSocketListenersSetup) {
      return;
    }

    webSocketListenersSetup = true;

    // Participant joined - Xác nhận join thành công (cho cả bản thân và người khác)
    socket.on("voice_participant_joined", (data: VoiceChannelJoinedData) => {
      // Lấy user ID của người dùng hiện tại
      const authStore = useAuthStore();
      const currentUserId = authStore.user?.id;

      if (data.participantId === currentUserId) {
      } else {
        const existing = usersInfo.value[data.participantId];
        usersInfo.value[data.participantId] = {
          username: data.username,
          avatar: data.avatar,
          avatarEffectId: data.avatarEffectId,
          isVideoEnabled: existing?.isVideoEnabled ?? false,
          isAudioEnabled: existing?.isAudioEnabled ?? false,
        };
      }
    });

    // Participant left - Xác nhận leave (cho cả bản thân và người khác)
    socket.on("voice_participant_left", (data: VoiceChannelLeftData) => {
      const authStore = useAuthStore();
      const currentUserId = authStore.user?.id;

      if (data.participantId === currentUserId) {
      } else {
      }
    });

    // Voice channel left confirmation (legacy support)
    socket.on("voice_channel_left", (data: VoiceChannelLeftData) => {});

    // Participant muted
    socket.on("voice_participant_muted", (data: any) => {
      const { participantId, kind } = data;
      if (usersInfo.value[participantId]) {
        // Create new object to trigger reactivity
        usersInfo.value[participantId] = {
          ...usersInfo.value[participantId],
          ...(kind === "audio" && { isAudioEnabled: false }),
          ...(kind === "video" && { isVideoEnabled: false }),
        };
      }
    });

    // Participant unmuted
    socket.on("voice_participant_unmuted", (data: any) => {
      const { participantId, kind } = data;
      if (usersInfo.value[participantId]) {
        // Create new object to trigger reactivity
        usersInfo.value[participantId] = {
          ...usersInfo.value[participantId],
          ...(kind === "audio" && { isAudioEnabled: true }),
          ...(kind === "video" && { isVideoEnabled: true }),
        };
      }
    });
  };

  /**
   * Handle remote track subscription
   */
  const handleTrackSubscribed = (
    track: RemoteTrack,
    participant: RemoteParticipant
  ) => {
    const participantId = participant.identity;

    // Add track to stream
    const mediaStreamTrack = track.mediaStreamTrack;
    if (!mediaStreamTrack) {
      console.warn(
        `⚠️ No mediaStreamTrack found for ${track.kind} from ${participantId}`
      );
      return;
    }

    // Check if this is a screen share track
    const isScreenShare = track.source === Track.Source.ScreenShare;

    // IMPORTANT: For video tracks, log mute status
    if (track.kind === Track.Kind.Video) {
      // If track is muted, wait for it to unmute (data flowing)
      if (mediaStreamTrack.muted) {
        // Set timeout to check
        const timeoutId = setTimeout(() => {
          if (mediaStreamTrack.muted) {
            console.warn(
              `⚠️ Video track still muted after 5s, may have connection issues`
            );
          }
          mediaStreamTrack.removeEventListener("unmute", onUnmute);
        }, 5000);

        // Set up unmute listener
        const onUnmute = () => {
          clearTimeout(timeoutId);
          mediaStreamTrack.removeEventListener("unmute", onUnmute);

          remoteStreams.value = { ...remoteStreams.value };
        };

        mediaStreamTrack.addEventListener("unmute", onUnmute);
      }
    }

    // Separate screen share tracks from camera/audio tracks
    if (isScreenShare) {
      // Handle screen share stream separately
      let screenStream = remoteScreenStreams.value[participantId];
      if (!screenStream) {
        screenStream = new MediaStream();
      }

      // Check if track already exists
      const existingTrack = screenStream
        .getTracks()
        .find((t) => t.id === mediaStreamTrack.id);
      if (!existingTrack) {
        screenStream.addTrack(mediaStreamTrack);

        // Update remoteScreenStreams
        remoteScreenStreams.value[participantId] = screenStream;

        // Trigger reactivity
        remoteScreenStreams.value = { ...remoteScreenStreams.value };

        // Update user info
        if (usersInfo.value[participantId]) {
          usersInfo.value[participantId] = {
            ...usersInfo.value[participantId],
            isScreenSharing: true,
          };
        }
      }
    } else {
      // Handle camera/audio streams (non-screen share)
      let stream = remoteStreams.value[participantId];
      if (!stream) {
        stream = new MediaStream();
      }

      // Check if track already exists in stream
      const existingTrack = stream
        .getTracks()
        .find((t) => t.id === mediaStreamTrack.id);
      if (!existingTrack) {
        stream.addTrack(mediaStreamTrack);

        // Update remoteStreams reference
        remoteStreams.value[participantId] = stream;

        // Trigger reactivity
        remoteStreams.value = { ...remoteStreams.value };
      } else {
      }

      // Update user info for camera/audio
      if (usersInfo.value[participantId]) {
        // Create new object to trigger reactivity
        if (track.kind === Track.Kind.Video) {
          // When video track is subscribed, it means camera is enabled
          // Even if temporarily muted, the intent is to show video
          usersInfo.value[participantId] = {
            ...usersInfo.value[participantId],
            isVideoEnabled: true,
          };
        } else if (track.kind === Track.Kind.Audio) {
          usersInfo.value[participantId] = {
            ...usersInfo.value[participantId],
            isAudioEnabled: !track.isMuted,
          };
        }
      }
    }
  };

  /**
   * Handle remote track unsubscription
   */
  const handleTrackUnsubscribed = (
    track: RemoteTrack,
    participant: RemoteParticipant
  ) => {
    const participantId = participant.identity;

    // Check if this is a screen share track
    const isScreenShare = track.source === Track.Source.ScreenShare;

    if (isScreenShare) {
      // Handle screen share removal
      const screenStream = remoteScreenStreams.value[participantId];
      if (screenStream && track.mediaStreamTrack) {
        screenStream.removeTrack(track.mediaStreamTrack);

        // Remove screen stream if no tracks left
        if (screenStream.getTracks().length === 0) {
          delete remoteScreenStreams.value[participantId];

          // Trigger reactivity
          remoteScreenStreams.value = { ...remoteScreenStreams.value };

          // Update user info
          if (usersInfo.value[participantId]) {
            usersInfo.value[participantId] = {
              ...usersInfo.value[participantId],
              isScreenSharing: false,
            };
          }
        }
      }
    } else {
      // Handle camera/audio tracks
      const stream = remoteStreams.value[participantId];

      // Update user info based on track kind
      if (usersInfo.value[participantId]) {
        if (track.kind === Track.Kind.Video) {
          usersInfo.value[participantId] = {
            ...usersInfo.value[participantId],
            isVideoEnabled: false,
            isAudioEnabled: usersInfo.value[participantId].isAudioEnabled,
          };
        } else if (track.kind === Track.Kind.Audio) {
          usersInfo.value[participantId] = {
            ...usersInfo.value[participantId],
            isVideoEnabled: usersInfo.value[participantId].isVideoEnabled,
            isAudioEnabled: false,
          };
        }
      }

      if (stream && track.mediaStreamTrack) {
        stream.removeTrack(track.mediaStreamTrack);

        // Remove stream if no tracks left
        if (stream.getTracks().length === 0) {
          delete remoteStreams.value[participantId];
        }
      }
    }
  };

  /**
   * Publish local audio and video tracks
   */
  const publishLocalTracks = async () => {
    if (!room.value) return;

    try {
      // Tạo tracks thủ công với constraints đơn giản (không dùng processors)
      const audioVideo: any = {
        audio: true, // Chỉ dùng boolean, không dùng object với processors
        video: false,
      };

      // Nếu video enabled, dùng constraints đơn giản
      if (isVideoEnabled.value) {
        // Try using simple boolean first, then fallback to constraints
        audioVideo.video = true; // Use simple boolean
      }

      const tracks = await createLocalTracks(audioVideo);

      // Publish tracks to room
      for (const track of tracks) {
        // Ensure video track is not muted before publishing
        if (track.kind === Track.Kind.Video && track.mediaStreamTrack) {
          track.mediaStreamTrack.enabled = true;

          // Wait for camera to be ready
          await new Promise((resolve) => setTimeout(resolve, 100));

          if (track.mediaStreamTrack.muted) {
            console.warn(
              `⚠️ Video track is STILL muted! Camera may not be working properly.`
            );
          }
        }

        await room.value.localParticipant.publishTrack(track, {
          ...(track.kind === Track.Kind.Video && {
            videoEncoding: {
              maxBitrate: 1500000,
              maxFramerate: 30,
            },
            simulcast: false,
          }),
        });

        // Verify video track after publish
        if (track.kind === Track.Kind.Video) {
          await new Promise((resolve) => setTimeout(resolve, 100));
          const publication = room.value.localParticipant.getTrackPublication(
            Track.Source.Camera
          );
          if (publication?.track?.mediaStreamTrack) {
            const mediaTrack = publication.track.mediaStreamTrack;
            const settings = mediaTrack.getSettings();

            if (!settings?.width || !settings?.height) {
              console.error(
                `❌ Video track has NO dimensions! Not capturing frames!`,
                settings
              );
            } else {
            }
          }
        }
      } // Get published tracks for UI
      const audioTrack = room.value.localParticipant.getTrackPublication(
        Track.Source.Microphone
      );
      const videoTrack = room.value.localParticipant.getTrackPublication(
        Track.Source.Camera
      );

      // Create local stream for UI
      localStream.value = new MediaStream();

      if (audioTrack?.track) {
        localAudioTrack.value = audioTrack.track as LocalTrack;
        if (audioTrack.track.mediaStreamTrack) {
          localStream.value.addTrack(audioTrack.track.mediaStreamTrack);
        }
      }

      if (videoTrack?.track) {
        localVideoTrack.value = videoTrack.track as LocalTrack;
        if (videoTrack.track.mediaStreamTrack) {
          localStream.value.addTrack(videoTrack.track.mediaStreamTrack);
        }
      }
    } catch (error) {
      console.error("❌ Error publishing local tracks:", error);
      throw error;
    }
  };

  /**
   * Toggle video on/off
   */
  const toggleVideo = async () => {
    if (!room.value) {
      console.warn("Room not initialized");
      return;
    }

    const previousState = isVideoEnabled.value;
    isVideoEnabled.value = !isVideoEnabled.value;

    try {
      if (isVideoEnabled.value) {
        const videoTracks = await createLocalTracks({
          audio: false,
          video: true,
        });

        for (const track of videoTracks) {
          if (track.mediaStreamTrack) {
            // Force enable
            track.mediaStreamTrack.enabled = true;

            // Check if muted
            if (track.mediaStreamTrack.muted) {
              console.error(
                `❌ Video track is MUTED before publish! Camera may not be working.`
              );
            } else {
            }
          }

          await room.value.localParticipant.publishTrack(track, {
            videoEncoding: {
              maxBitrate: 1500000, // 1.5 Mbps
              maxFramerate: 30,
            },
            simulcast: false, // Disable simulcast for debugging
          });

          // Verify publication
          await new Promise((resolve) => setTimeout(resolve, 100));
          const publication = room.value.localParticipant.getTrackPublication(
            Track.Source.Camera
          );
          if (publication) {
            const mediaTrack = publication.track?.mediaStreamTrack;
            const settings = mediaTrack?.getSettings();

            if (!settings?.width || !settings?.height) {
              console.error(
                `❌ Video track has NO dimensions! Not capturing frames!`,
                settings
              );
            } else {
            }

            if (publication.isMuted || mediaTrack?.muted) {
              console.error(`❌ Track became muted after publish!`);
            }
          }

          // Update local video track
          localVideoTrack.value = track as LocalTrack;

          // Add to local stream và trigger reactivity
          if (track.mediaStreamTrack) {
            if (!localStream.value) {
              localStream.value = new MediaStream();
            }
            localStream.value.addTrack(track.mediaStreamTrack);

            // Trigger reactivity bằng cách tạo MediaStream mới
            const newStream = new MediaStream();
            localStream.value.getTracks().forEach((t) => newStream.addTrack(t));
            localStream.value = newStream;
          }
        }
      } else {
        // Disable video - unpublish track

        // Sử dụng localVideoTrack
        if (localVideoTrack.value) {
          const track = localVideoTrack.value;

          // Remove from local stream trước
          if (localStream.value && track.mediaStreamTrack) {
            localStream.value.removeTrack(track.mediaStreamTrack);

            // Trigger reactivity
            const newStream = new MediaStream();
            localStream.value.getTracks().forEach((t) => newStream.addTrack(t));
            localStream.value = newStream;
          }

          // Unpublish track - cast to proper type
          try {
            await room.value.localParticipant.unpublishTrack(
              track as LocalTrack
            );
          } catch (e) {
            console.warn("⚠️ Error unpublishing track:", e);
          }

          // Stop track
          try {
            track.stop();
          } catch (e) {
            console.warn("⚠️ Error stopping track:", e);
          }

          localVideoTrack.value = null;
        } else {
          console.warn("⚠️ No local video track found to disable");
        }
      }
    } catch (error: any) {
      console.error("❌ Error toggling video:", error);
      // Revert state on error
      isVideoEnabled.value = previousState;

      // Show user-friendly error
      throw new Error(
        `Failed to ${isVideoEnabled.value ? "enable" : "disable"} camera: ${
          error?.message || "Unknown error"
        }`
      );
    }
  };

  /**
   * Toggle audio on/off
   */
  const toggleAudio = async () => {
    if (!room.value) {
      console.warn("Room not initialized");
      return;
    }

    const previousState = isAudioEnabled.value;
    isAudioEnabled.value = !isAudioEnabled.value;

    try {
      // Chỉ mute/unmute track hiện có, không tạo track mới
      const audioPublication = room.value.localParticipant.getTrackPublication(
        Track.Source.Microphone
      );

      if (audioPublication?.track) {
        if (!isAudioEnabled.value) {
          // Mute
          await audioPublication.track.mute();
        } else {
          // Unmute
          await audioPublication.track.unmute();
        }
      } else {
        console.warn("⚠️ No audio track found");
      }
    } catch (error: any) {
      console.error("❌ Error toggling audio:", error);
      // Revert state on error
      isAudioEnabled.value = previousState;

      throw new Error(
        `Failed to ${isAudioEnabled.value ? "enable" : "disable"} microphone: ${
          error?.message || "Unknown error"
        }`
      );
    }
  };

  /**
   * Toggle screen sharing on/off
   */
  const toggleScreenShare = async () => {
    if (!room.value) {
      return;
    }

    try {
      // LiveKit handles everything - events will update localScreenTrack and isScreenSharing
      await room.value.localParticipant.setScreenShareEnabled(
        !isScreenSharing.value
      );
    } catch (error: any) {
      // If user cancels screen share, don't show error
      if (error?.name === "NotAllowedError" || error?.name === "AbortError") {
        return;
      }

      throw new Error(
        `Failed to ${
          isScreenSharing.value ? "stop" : "start"
        } screen sharing: ${error?.message || "Unknown error"}`
      );
    }
  };

  /**
   * Leave the voice channel
   */
  const leave = async (channelId: string) => {
    try {
      // Notify backend about leaving
      if (socket) {
        socket.emit("leave_voice_channel", {
          channelId,
        });
      }

      // Disconnect from LiveKit room
      if (room.value) {
        await room.value.disconnect();

        room.value = null;
        roomListenersSetup = false;
        webSocketListenersSetup = false;
      }

      // Clean up local media and state
      cleanupLocalMedia();

      // Mark as disconnected
      isConnected.value = false;
      isConnecting.value = false;
    } catch (error) {
      console.error("❌ Error leaving voice channel:", error);
    }
  };

  /**
   * Cleanup local media only (not the room instance)
   */
  const cleanupLocalMedia = () => {
    // Stop local tracks
    if (localAudioTrack.value) {
      localAudioTrack.value.stop();
      localAudioTrack.value = null;
    }

    if (localVideoTrack.value) {
      localVideoTrack.value.stop();
      localVideoTrack.value = null;
    }

    if (localScreenTrack.value) {
      localScreenTrack.value.stop();
      localScreenTrack.value = null;
    }

    // Stop local stream
    if (localStream.value) {
      localStream.value.getTracks().forEach((track) => track.stop());
      localStream.value = null;
    }

    // Clear remote streams and participants
    remoteStreams.value = {};
    remoteScreenStreams.value = {};
    participants.value = {};
    usersInfo.value = {};
  };

  /**
   * Full cleanup including room instance (for onUnmounted)
   * CRITICAL: Only call this on component unmount, NOT on leave!
   */
  const cleanup = () => {
    // Clean up local media
    cleanupLocalMedia();

    // Clear room reference and listeners flag
    room.value = null;
    roomListenersSetup = false;
    webSocketListenersSetup = false;
    isConnected.value = false;
    isConnecting.value = false;
    isScreenSharing.value = false;
  };

  return {
    init,
    leave,
    localStream,
    localScreenTrack,
    remoteStreams,
    remoteScreenStreams,
    isVideoEnabled,
    isAudioEnabled,
    isScreenSharing,
    toggleVideo,
    toggleAudio,
    toggleScreenShare,
    usersInRoom,
    usersInfo,
    isConnected: readonly(isConnected),
    isConnecting: readonly(isConnecting),
  };
}
