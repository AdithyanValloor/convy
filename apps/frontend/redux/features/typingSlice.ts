import { createSlice } from "@reduxjs/toolkit";

interface TypingState {
  byChat: Record<string, Record<string, string>>;
}

const typingSlice = createSlice({
  name: "typing",
  initialState: { byChat: {} } as TypingState,
  reducers: {
    typingStarted(state, action) {
      const { chatId, userId, name } = action.payload;
      state.byChat[chatId] ??= {};
      state.byChat[chatId][userId] = name;
    },
    typingStopped(state, action) {
      const { chatId, userId } = action.payload;
      delete state.byChat[chatId]?.[userId];
    },
    clearTypingForChat(state, action) {
      delete state.byChat[action.payload];
    },
  },
});

export const {
    typingStarted,
    typingStopped,
    clearTypingForChat,
} = typingSlice.actions;
export default typingSlice.reducer;

