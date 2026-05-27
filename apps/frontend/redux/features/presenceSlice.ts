import { createSlice, PayloadAction } from "@reduxjs/toolkit";

/* -------------------- TYPES -------------------- */

export type PresenceStatus = "online" | "offline";

export interface PresenceState {
  users: Record<string, PresenceStatus>;
}

const initialState: PresenceState = {
  users: {},
};

interface UpdatePresencePayload {
  userId: string;
  status: PresenceStatus;
}

/* -------------------- SLICE -------------------- */

const presenceSlice = createSlice({
  name: "presence",
  initialState,
  reducers: {
    updatePresence: (
      state,
      action: PayloadAction<UpdatePresencePayload>
    ) => {
      const { userId, status } = action.payload;
      state.users[userId] = status;
    },

    resetPresence: (state) => {
      state.users = {};
    },
  },
});

export const { updatePresence, resetPresence } = presenceSlice.actions;
export default presenceSlice.reducer;