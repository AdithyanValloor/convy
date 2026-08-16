import { ChatRepository } from "../repositories/mongo-chat.repository.js";
import { ChatUserStateRepository } from "../repositories/mongo-chatUserState.repository.js";

import { ChatService } from "../services/chat.service.js";
import { GroupService } from "../services/group.service.js";

const chatRepository = new ChatRepository();
const chatUserStateRepository = new ChatUserStateRepository();

export const chatService = new ChatService(chatRepository, chatUserStateRepository);
export const groupService = new GroupService(chatRepository)