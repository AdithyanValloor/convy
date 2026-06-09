import { Chat } from "../../chat/models/chat.model.js";

export const findChatById = async (id: string) => {
    const group = await Chat.findById(id);
    return group;
}