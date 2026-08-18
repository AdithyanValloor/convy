import { MessageRepository } from "../repositories/mongo-message.repository.js";
import { MessageRequestRepository } from "../repositories/mongo-messageRequest.repository.js";
import { MessageService } from "../services/message.service.js";
import { MessageRequestService } from "../services/messageRequest.service.js";

const messageRepository = new MessageRepository();
const messageRequestRepository = new MessageRequestRepository();

export const messageService = new MessageService(
  messageRepository,
  messageRequestRepository,
);
export const messageRequestService = new MessageRequestService(
  messageRequestRepository,
  messageRepository,
);
