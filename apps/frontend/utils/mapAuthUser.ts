import { AuthUser } from "@/redux/features/authSlice";
import { BackendUserDTO } from "@/types/api/user.dto";

/**
 * Map backend user DTO to the client-side AuthUser model.
 *
 * This function acts as a boundary between API responses
 * and Redux state, ensuring consistent and predictable
 * user data throughout the application.
 */
export const mapAuthUser = (user: BackendUserDTO): AuthUser => ({
  _id: user._id,
  displayName: user.displayName,
  username: user.username,

  // Normalize optional media fields
  profilePicture: user.profilePicture,

  // Normalize optional text fields
  bio: user.bio ?? undefined,
  pronouns: user.pronouns ?? undefined,

  createdAt: user.createdAt,
  isActive: user.isActive,
  isBanned: user.isBanned,
});
