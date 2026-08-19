import { BlockRepository } from "../repositories/mongo-block.repository.js";
import { FriendsRepository } from "../repositories/mongo-friends.repository.js";

import { RequestRepository } from "../repositories/mongo-request.repository.js";
import { BlockService } from "../services/block.service.js";
import { FriendsService } from "../services/friends.service.js";

export const friendsRespository = new FriendsRepository();
export const blockRepository = new BlockRepository();
export const requestRepository = new RequestRepository();

export const friendsService = new FriendsService(
  friendsRespository,
  requestRepository,
  blockRepository,
);
export const blockService = new BlockService(
  blockRepository,
  friendsRespository,
  requestRepository,
);
