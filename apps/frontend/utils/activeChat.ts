let activeChatId: string | null = null;

export const setActiveChatId = (chatId: string | null) => {
  activeChatId = chatId;
};

export const getActiveChatId = () => activeChatId;