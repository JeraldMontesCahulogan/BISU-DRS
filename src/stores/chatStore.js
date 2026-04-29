// src/stores/chatStore.js
/* eslint-disable no-empty */
import { create } from "zustand";
import { supabase } from "@/lib/supabase";
import { useAuthStore } from "@/stores/authStore";
import { decryptUserRow, decryptUserRows } from "@/lib/userCrypto";
import { encryptText, decryptText } from "@/lib/crypto";

const SEEN_CHAT_KEY = "seen_live_chat_created_at";

function readSeenChat() {
  try {
    return localStorage.getItem(SEEN_CHAT_KEY) || "";
  } catch {
    return "";
  }
}

function writeSeenChat(value) {
  try {
    localStorage.setItem(SEEN_CHAT_KEY, value || "");
  } catch {}
}

function convKey(a, b) {
  if (!a || !b) return "";
  return [a, b].sort().join("__");
}

function toTimeLabel(ts) {
  if (!ts) return "";
  const d = new Date(ts);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function safeName(firstname, lastname) {
  const name = `${firstname || ""} ${lastname || ""}`.trim();
  return name || "Unknown";
}

function upsertMessage(list, msg) {
  const arr = Array.isArray(list) ? list : [];
  const idx = arr.findIndex((x) => String(x.id) === String(msg.id));
  if (idx === -1) return [...arr, msg];
  const next = arr.slice();
  next[idx] = { ...next[idx], ...msg };
  return next;
}

function sortUsersByLastAt(users) {
  const rows = Array.isArray(users) ? users.slice() : [];
  rows.sort((a, b) => {
    const ta = a.lastAt ? new Date(a.lastAt).getTime() : 0;
    const tb = b.lastAt ? new Date(b.lastAt).getTime() : 0;
    return tb - ta;
  });
  return rows;
}

async function safeDecryptMessage(text) {
  const raw = String(text ?? "");
  if (!raw) return "";

  try {
    return await decryptText(raw);
  } catch {
    return raw;
  }
}

async function decryptMessageRow(row, me) {
  const decryptedBody = await safeDecryptMessage(row?.body);

  return {
    id: row?.message_id,
    sender: row?.sender_id === me ? "user" : "student",
    message: decryptedBody,
    timestamp: row?.created_at,
    created_at: row?.created_at,
    read_at: row?.read_at,
  };
}

async function decryptMessageRows(rows, me) {
  return Promise.all(
    (Array.isArray(rows) ? rows : []).map((row) => decryptMessageRow(row, me)),
  );
}

function applyIncomingToUsers({ users, me, activePeerId, row }) {
  const rows = Array.isArray(users) ? users.slice() : [];
  const peerId = row.sender_id === me ? row.receiver_id : row.sender_id;

  const idx = rows.findIndex((u) => String(u.peerId) === String(peerId));
  if (idx === -1) return rows;

  const prev = rows[idx];
  const next = { ...prev };

  next.lastMessage = row.body || "";
  next.lastAt = row.created_at || null;
  next.timestampLabel = row.created_at ? toTimeLabel(row.created_at) : "";

  const isInbound = row.receiver_id === me;
  const isUnread = isInbound && !row.read_at;

  if (isUnread) {
    const isActiveThread = String(activePeerId || "") === String(peerId || "");
    next.unread = isActiveThread ? 0 : (Number(prev.unread) || 0) + 1;
  }

  rows[idx] = next;
  return sortUsersByLastAt(rows);
}

let _usersRefreshTimer = null;

export const useChatStore = create((set, get) => ({
  users: [],
  usersLoading: false,
  usersError: null,

  activePeer: null,

  messages: [],
  messagesLoading: false,
  messagesError: null,

  sending: false,

  adminPeer: null,
  adminLoading: false,
  adminError: null,

  _usersChannel: null,
  _usersSubscribing: false,

  _adminChannel: null,
  _adminSubscribing: false,

  _chatChannel: null,
  _chatSubscribing: false,
  _activeConvKey: null,

  inboxUnread: 0,
  _inboxChannel: null,
  _inboxSubscribing: false,

  chatHasNew: false,
  chatLatestCreatedAt: "",
  chatSeenCreatedAt: readSeenChat(),

  chatOpen: false,
  setChatOpen: (open) => set({ chatOpen: !!open }),

  _tempToReal: {},

  _markReadTimer: null,
  _markReadPeer: null,

  markChatSeen: async () => {
    if (!get().chatLatestCreatedAt) {
      await get().refreshChatLatest();
    }

    const latest = get().chatLatestCreatedAt || "";
    set({ chatHasNew: false, chatSeenCreatedAt: latest });
    writeSeenChat(latest);
  },

  refreshChatLatest: async () => {
    const me = useAuthStore.getState().user?.id || null;

    if (!me) {
      set({ chatHasNew: false, chatLatestCreatedAt: "" });
      return { error: null };
    }

    const { data, error } = await supabase
      .from("messages")
      .select("created_at")
      .eq("receiver_id", me)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) return { error };

    const latestAt = data?.created_at ? String(data.created_at) : "";
    const seenAt = get().chatSeenCreatedAt || "";
    const hasNew = latestAt && (!seenAt || latestAt > seenAt);

    set({
      chatLatestCreatedAt: latestAt,
      chatHasNew: !!hasNew,
    });

    return { error: null };
  },

  _scheduleUsersRefresh: () => {
    if (_usersRefreshTimer) return;

    _usersRefreshTimer = setTimeout(() => {
      _usersRefreshTimer = null;
      get().fetchUsersDirectory();
    }, 350);
  },

  refreshInboxUnread: async () => {
    const me = useAuthStore.getState().user?.id || null;

    if (!me) {
      set({ inboxUnread: 0 });
      return { error: null, data: 0 };
    }

    const { count, error } = await supabase
      .from("messages")
      .select("message_id", { count: "exact", head: true })
      .eq("receiver_id", me)
      .is("read_at", null);

    if (error) return { error, data: null };

    const n = Number(count) || 0;
    set({ inboxUnread: n });
    return { error: null, data: n };
  },

  subscribeInboxUnread: () => {
    const me = useAuthStore.getState().user?.id || null;
    if (!me) return () => {};

    if (get()._inboxChannel) {
      get().refreshInboxUnread();
      get().refreshChatLatest();
      return () => {};
    }

    if (get()._inboxSubscribing) return () => {};
    set({ _inboxSubscribing: true });

    get().unsubscribeInboxUnread();

    const ch = supabase
      .channel(`inbox-unread-${me}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `receiver_id=eq.${me}`,
        },
        (payload) => {
          const row = payload?.new;
          if (!row) return;

          if (row.receiver_id !== me) return;

          const createdAt = row.created_at ? String(row.created_at) : "";
          const seenAt = get().chatSeenCreatedAt || "";

          if (createdAt && (!seenAt || createdAt > seenAt)) {
            if (get().chatOpen) {
              set((s) => ({
                chatHasNew: false,
                chatLatestCreatedAt:
                  s.chatLatestCreatedAt && s.chatLatestCreatedAt > createdAt
                    ? s.chatLatestCreatedAt
                    : createdAt,
                chatSeenCreatedAt:
                  s.chatSeenCreatedAt && s.chatSeenCreatedAt > createdAt
                    ? s.chatSeenCreatedAt
                    : createdAt,
              }));
              writeSeenChat(createdAt);
            } else {
              set((s) => ({
                chatHasNew: true,
                chatLatestCreatedAt:
                  s.chatLatestCreatedAt && s.chatLatestCreatedAt > createdAt
                    ? s.chatLatestCreatedAt
                    : createdAt,
              }));
            }
          }

          if (row.read_at) return;

          const activePeerId = get().activePeer?.peerId || null;

          const viewingThread =
            get().chatOpen &&
            String(activePeerId || "") === String(row.sender_id || "");

          if (!viewingThread) {
            set((s) => ({ inboxUnread: (Number(s.inboxUnread) || 0) + 1 }));
          }
        },
      )
      .subscribe((status) => {
        if (status === "SUBSCRIBED") {
          set({ _inboxChannel: ch, _inboxSubscribing: false });
          get().refreshInboxUnread();
          get().refreshChatLatest();
          return;
        }

        if (status === "CHANNEL_ERROR" || status === "TIMED_OUT") {
          set({
            _inboxChannel: null,
            _inboxSubscribing: false,
            messagesError:
              "Realtime connection failed. Enable replication for public.messages in Supabase Dashboard.",
          });
        }
      });

    return () => get().unsubscribeInboxUnread();
  },

  unsubscribeInboxUnread: async () => {
    const ch = get()._inboxChannel;
    if (!ch) return;

    set({ _inboxChannel: null });

    try {
      await supabase.removeChannel(ch);
    } catch {}
  },

  fetchFirstAdmin: async () => {
    const me = useAuthStore.getState().user?.id || null;

    if (!me) {
      set({ adminPeer: null, adminLoading: false, adminError: null });
      return { error: null, data: null };
    }

    set({
      adminLoading: !get().adminPeer,
      adminError: null,
    });

    const { data, error } = await supabase
      .from("profiles")
      .select("user_id, firstname, lastname, email, student_id, usertype_id")
      .eq("usertype_id", 1)
      .order("created_at", { ascending: true })
      .limit(1)
      .maybeSingle();

    if (error) {
      set({ adminPeer: null, adminLoading: false, adminError: error.message });
      return { error };
    }

    if (!data) {
      set({
        adminPeer: null,
        adminLoading: false,
        adminError: "No admin account found.",
      });
      return { error: new Error("No admin account found.") };
    }

    let decryptedAdmin = data;

    try {
      decryptedAdmin = await decryptUserRow(data);
    } catch (decryptError) {
      set({
        adminPeer: null,
        adminLoading: false,
        adminError: decryptError.message || "Failed to decrypt admin data.",
      });
      return { error: decryptError };
    }

    const peer = {
      peerId: decryptedAdmin.user_id,
      name:
        safeName(decryptedAdmin.firstname, decryptedAdmin.lastname) || "Admin",
      studentId: decryptedAdmin.student_id || "",
      email: decryptedAdmin.email || "",
      course: "Guidance Office",
      yearLevel: "",
      lastMessage: "",
      lastAt: null,
      timestampLabel: "",
      unread: 0,
      riskLevel: "low-risk",
    };

    set({ adminPeer: peer, adminLoading: false, adminError: null });
    return { error: null, data: peer };
  },

  subscribeFirstAdmin: () => {
    const me = useAuthStore.getState().user?.id || null;
    if (!me) return () => {};

    if (get()._adminChannel) {
      if (!get().adminPeer) {
        get().fetchFirstAdmin();
      }
      return () => {};
    }

    if (get()._adminSubscribing) return () => {};
    set({ _adminSubscribing: true });

    const ch = supabase
      .channel(`first-admin-${me}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "profiles" },
        (payload) => {
          const row = payload?.new || payload?.old;
          if (!row) return;

          if (
            row.usertype_id === 1 ||
            row.user_id === get().adminPeer?.peerId
          ) {
            get().fetchFirstAdmin();
          }
        },
      )
      .subscribe((status) => {
        if (status === "SUBSCRIBED") {
          set({ _adminChannel: ch, _adminSubscribing: false });
          get().fetchFirstAdmin();
          return;
        }

        if (status === "CHANNEL_ERROR" || status === "TIMED_OUT") {
          set({
            _adminChannel: null,
            _adminSubscribing: false,
            adminError:
              "Realtime connection failed. Enable replication for public.profiles in Supabase Dashboard.",
          });
        }
      });

    return () => get().unsubscribeFirstAdmin();
  },

  unsubscribeFirstAdmin: async () => {
    const ch = get()._adminChannel;
    if (!ch) return;

    set({ _adminChannel: null });

    try {
      await supabase.removeChannel(ch);
    } catch {}
  },

  fetchUsersDirectory: async () => {
    const me = useAuthStore.getState().user?.id || null;

    if (!me) {
      set({ users: [], usersLoading: false, usersError: null });
      return { error: null, data: [] };
    }

    set({
      usersLoading: (get().users?.length ?? 0) === 0,
      usersError: null,
    });

    const { data: people, error: peopleErr } = await supabase
      .from("profiles")
      .select(
        `
        user_id,
        firstname,
        lastname,
        email,
        student_id,
        approvalStatus_id,
        usertype_id,
        program_id,
        yearLevel_id,
        program:programs!users_program_id_fkey ( program ),
        year:year_level!users_yearLevel_id_fkey ( year_level )
      `,
      )
      .neq("user_id", me)
      .eq("approvalStatus_id", 2)
      .order("lastname", { ascending: true });

    if (peopleErr) {
      set({ users: [], usersLoading: false, usersError: peopleErr.message });
      return { error: peopleErr };
    }

    let decryptedPeople = people || [];

    try {
      decryptedPeople = await decryptUserRows(people || []);
    } catch (decryptError) {
      set({
        users: [],
        usersLoading: false,
        usersError:
          decryptError.message || "Failed to decrypt users directory.",
      });
      return { error: decryptError };
    }

    const { data: recentMsgs, error: msgErr } = await supabase
      .from("messages")
      .select("message_id, sender_id, receiver_id, body, read_at, created_at")
      .or(`sender_id.eq.${me},receiver_id.eq.${me}`)
      .order("created_at", { ascending: false })
      .limit(300);

    if (msgErr) {
      set({ usersLoading: false, usersError: msgErr.message });
      return { error: msgErr };
    }

    const recentWithDecryptedBody = await Promise.all(
      (recentMsgs || []).map(async (m) => ({
        ...m,
        body: await safeDecryptMessage(m.body),
      })),
    );

    const lastByPeer = new Map();
    const unreadByPeer = new Map();

    recentWithDecryptedBody.forEach((m) => {
      const peerId = m.sender_id === me ? m.receiver_id : m.sender_id;
      if (!lastByPeer.has(peerId)) lastByPeer.set(peerId, m);

      if (m.receiver_id === me && !m.read_at) {
        unreadByPeer.set(peerId, (unreadByPeer.get(peerId) || 0) + 1);
      }
    });

    const rows = decryptedPeople.map((p) => {
      const last = lastByPeer.get(p.user_id) || null;

      return {
        peerId: p.user_id,
        name: safeName(p.firstname, p.lastname),
        studentId: p.student_id || "",
        email: p.email || "",
        course: p.program?.program || "Not set",
        yearLevel: p.year?.year_level || "Not set",
        lastMessage: last?.body || "",
        lastAt: last?.created_at || null,
        timestampLabel: last?.created_at ? toTimeLabel(last.created_at) : "",
        unread: unreadByPeer.get(p.user_id) || 0,
        riskLevel: "low-risk",
      };
    });

    set({
      users: sortUsersByLastAt(rows),
      usersLoading: false,
      usersError: null,
    });

    return { error: null, data: rows };
  },

  subscribeUsersDirectory: () => {
    const me = useAuthStore.getState().user?.id || null;
    if (!me) return () => {};

    if (get()._usersChannel) {
      if ((get().users?.length ?? 0) === 0) {
        get().fetchUsersDirectory();
      }
      return () => {};
    }

    if (get()._usersSubscribing) return () => {};
    set({ _usersSubscribing: true });

    const ch = supabase
      .channel(`chat-users-${me}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages" },
        async (payload) => {
          const row = payload?.new;
          if (!row) return;
          if (row.sender_id !== me && row.receiver_id !== me) return;

          const decryptedBody = await safeDecryptMessage(row.body);

          set((s) => ({
            users: applyIncomingToUsers({
              users: s.users,
              me,
              activePeerId: s.activePeer?.peerId,
              row: {
                ...row,
                body: decryptedBody,
              },
            }),
          }));
        },
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "profiles" },
        () => {
          get()._scheduleUsersRefresh();
        },
      )
      .subscribe((status) => {
        if (status === "SUBSCRIBED") {
          set({ _usersChannel: ch, _usersSubscribing: false });
          get().fetchUsersDirectory();
          return;
        }

        if (status === "CHANNEL_ERROR" || status === "TIMED_OUT") {
          set({
            _usersChannel: null,
            _usersSubscribing: false,
            usersError:
              "Realtime connection failed. Enable replication for public.profiles and public.messages in Supabase Dashboard.",
          });
        }
      });

    return () => get().unsubscribeUsersDirectory();
  },

  unsubscribeUsersDirectory: async () => {
    const ch = get()._usersChannel;
    if (!ch) return;

    set({ _usersChannel: null });

    try {
      await supabase.removeChannel(ch);
    } catch {}
  },

  ensureChat: async (peer) => {
    const peerId = peer?.peerId || peer;
    const me = useAuthStore.getState().user?.id || null;
    if (!me || !peerId) return;

    const key = convKey(me, peerId);

    set((s) => ({
      activePeer: typeof peer === "object" ? peer : s.activePeer,
      messagesError: null,
    }));

    if (get()._activeConvKey !== key) {
      await get().fetchMessages(peerId, { setLoading: true });
      get().subscribeChat(peerId);

      if (get().chatOpen) get().markThreadReadDebounced(peerId);
      return;
    }

    get().subscribeChat(peerId);
    if (get().chatOpen) get().markThreadReadDebounced(peerId);
  },

  openChat: async (peer) => {
    if (!peer?.peerId) return;

    set({ activePeer: peer, messagesError: null });

    await get().fetchMessages(peer.peerId, { setLoading: true });
    get().subscribeChat(peer.peerId);

    if (get().chatOpen) get().markThreadReadDebounced(peer.peerId);

    set((s) => ({
      users: (Array.isArray(s.users) ? s.users : []).map((u) => {
        if (u.peerId !== peer.peerId) return u;
        if (u.unread === 0) return u;
        return { ...u, unread: 0 };
      }),
    }));
  },

  closeChat: () => {
    get().unsubscribeChat();
    set({
      activePeer: null,
      messages: [],
      messagesLoading: false,
      messagesError: null,
      _activeConvKey: null,
      _tempToReal: {},
    });
  },

  fetchMessages: async (peerId, opts = {}) => {
    const me = useAuthStore.getState().user?.id || null;
    const { setLoading = false } = opts;

    if (!me || !peerId) {
      set({ messages: [], messagesLoading: false, messagesError: null });
      return { error: null, data: [] };
    }

    if (setLoading) {
      set({
        messagesLoading: (get().messages?.length ?? 0) === 0,
        messagesError: null,
      });
    }

    const { data, error } = await supabase
      .from("messages")
      .select("message_id, sender_id, receiver_id, body, read_at, created_at")
      .or(
        `and(sender_id.eq.${me},receiver_id.eq.${peerId}),and(sender_id.eq.${peerId},receiver_id.eq.${me})`,
      )
      .order("created_at", { ascending: true })
      .limit(300);

    if (error) {
      set({
        messages: [],
        messagesLoading: false,
        messagesError: error.message,
      });
      return { error };
    }

    const mapped = await decryptMessageRows(data || [], me);

    set({ messages: mapped, messagesLoading: false, messagesError: null });
    return { error: null, data: mapped };
  },

  sendMessage: async (peerId, text) => {
    const me = useAuthStore.getState().user?.id || null;
    const body = String(text || "").trim();

    if (!me || !peerId || !body) return { error: null };

    const tempId = `tmp_${Date.now()}_${Math.random().toString(16).slice(2)}`;
    const nowIso = new Date().toISOString();

    const optimistic = {
      id: tempId,
      sender: "user",
      message: body,
      timestamp: nowIso,
      created_at: nowIso,
      read_at: null,
      _optimistic: true,
    };

    set((s) => ({
      messages: upsertMessage(s.messages, optimistic),
      sending: true,
      _tempToReal: { ...s._tempToReal, [tempId]: null },
    }));

    let encryptedBody = body;

    try {
      encryptedBody = await encryptText(body);
    } catch (encryptError) {
      set((s) => ({
        messages: (Array.isArray(s.messages) ? s.messages : []).filter(
          (m) => m.id !== tempId,
        ),
        sending: false,
        messagesError:
          encryptError?.message || "Failed to encrypt message before sending.",
        _tempToReal: (() => {
          const x = { ...s._tempToReal };
          delete x[tempId];
          return x;
        })(),
      }));
      return { error: encryptError };
    }

    const { data, error } = await supabase
      .from("messages")
      .insert([{ sender_id: me, receiver_id: peerId, body: encryptedBody }])
      .select("message_id, sender_id, receiver_id, body, read_at, created_at")
      .single();

    if (error) {
      set((s) => ({
        messages: (Array.isArray(s.messages) ? s.messages : []).filter(
          (m) => m.id !== tempId,
        ),
        sending: false,
        messagesError: error.message,
        _tempToReal: (() => {
          const x = { ...s._tempToReal };
          delete x[tempId];
          return x;
        })(),
      }));
      return { error };
    }

    const real = {
      id: data.message_id,
      sender: "user",
      message: body,
      timestamp: data.created_at,
      created_at: data.created_at,
      read_at: data.read_at,
    };

    set((s) => ({
      messages: (Array.isArray(s.messages) ? s.messages : [])
        .filter((m) => m.id !== tempId)
        .filter((m) => String(m.id) !== String(real.id))
        .concat([real]),
      sending: false,
      messagesError: null,
      users: applyIncomingToUsers({
        users: s.users,
        me,
        activePeerId: s.activePeer?.peerId,
        row: {
          sender_id: me,
          receiver_id: peerId,
          body,
          created_at: data.created_at,
          read_at: data.read_at,
        },
      }),
      _tempToReal: (() => {
        const x = { ...s._tempToReal };
        delete x[tempId];
        return x;
      })(),
    }));

    return { error: null, data: real };
  },

  markThreadReadDebounced: (peerId) => {
    const me = useAuthStore.getState().user?.id || null;
    if (!me || !peerId) return;

    if (!get().chatOpen) return;

    if (get()._markReadTimer) clearTimeout(get()._markReadTimer);

    set({ _markReadPeer: peerId });

    const t = setTimeout(() => {
      const pid = get()._markReadPeer;
      set({ _markReadTimer: null, _markReadPeer: null });
      get().markThreadRead(pid);
    }, 250);

    set({ _markReadTimer: t });
  },

  markThreadRead: async (peerId) => {
    const me = useAuthStore.getState().user?.id || null;
    if (!me || !peerId) return { error: null };

    const nowIso = new Date().toISOString();

    set((s) => ({
      messages: (Array.isArray(s.messages) ? s.messages : []).map((m) => {
        const inbound = m.sender === "student";
        if (!inbound) return m;
        if (m.read_at) return m;
        return { ...m, read_at: nowIso };
      }),
      users: (Array.isArray(s.users) ? s.users : []).map((u) => {
        if (u.peerId !== peerId) return u;
        if (u.unread === 0) return u;
        return { ...u, unread: 0 };
      }),
    }));

    const { error } = await supabase
      .from("messages")
      .update({ read_at: nowIso })
      .eq("sender_id", peerId)
      .eq("receiver_id", me)
      .is("read_at", null);

    await get().refreshInboxUnread();

    return { error };
  },

  subscribeChat: (peerId) => {
    const me = useAuthStore.getState().user?.id || null;
    if (!me || !peerId) return () => {};

    const key = convKey(me, peerId);

    if (get()._chatChannel && get()._activeConvKey === key) return () => {};
    if (get()._chatSubscribing) return () => {};

    set({ _chatSubscribing: true });
    get().unsubscribeChat();

    const ch = supabase
      .channel(`chat-${key}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages" },
        async (payload) => {
          const row = payload?.new;
          if (!row) return;

          const rowKey = convKey(row.sender_id, row.receiver_id);
          if (rowKey !== key) return;

          const decryptedBody = await safeDecryptMessage(row.body);

          const msg = {
            id: row.message_id,
            sender: row.sender_id === me ? "user" : "student",
            message: decryptedBody,
            timestamp: row.created_at,
            created_at: row.created_at,
            read_at: row.read_at,
          };

          set((s) => ({
            messages: upsertMessage(s.messages, msg),
            users: applyIncomingToUsers({
              users: s.users,
              me,
              activePeerId: s.activePeer?.peerId,
              row: {
                ...row,
                body: decryptedBody,
              },
            }),
          }));

          const inbound = row.sender_id === peerId && row.receiver_id === me;

          if (inbound) {
            if (get().chatOpen) {
              get().markThreadReadDebounced(peerId);
            }
          }
        },
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "messages" },
        () => {
          get().refreshInboxUnread();
        },
      )
      .subscribe((status) => {
        if (status === "SUBSCRIBED") {
          set({
            _chatChannel: ch,
            _chatSubscribing: false,
            _activeConvKey: key,
          });
          return;
        }

        if (status === "CHANNEL_ERROR" || status === "TIMED_OUT") {
          set({
            _chatChannel: null,
            _chatSubscribing: false,
            _activeConvKey: null,
            messagesError:
              "Realtime connection failed. Enable replication for public.messages in Supabase Dashboard.",
          });
        }
      });

    return () => get().unsubscribeChat();
  },

  unsubscribeChat: async () => {
    const ch = get()._chatChannel;
    if (!ch) return;

    set({ _chatChannel: null, _activeConvKey: null });

    try {
      await supabase.removeChannel(ch);
    } catch {}
  },
}));
