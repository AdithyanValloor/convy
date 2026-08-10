import { MongoUserRepository } from "../repositories/mongo-user.repository.js";
import { UserAccountService } from "../services/user.account.service.js";
import { UserPreferencesService } from "../services/user.preferences.service.js";
import { UserPrivacyService } from "../services/user.privacy.service.js";
import { UserProfileService } from "../services/user.profile.service.js";

const userRepository = new MongoUserRepository();

export const userAccountService = new UserAccountService(userRepository);
export const userPreferencesService = new UserPreferencesService(userRepository,);
export const userPrivacyService = new UserPrivacyService(userRepository);
export const userProfileService = new UserProfileService(userRepository);
