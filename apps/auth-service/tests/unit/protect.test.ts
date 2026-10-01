import { describe, it, expect, vi, beforeEach } from "vitest";
import { protect } from "../../src/middlewares/protect.js";
import { verifyAccessToken } from "../../src/utils/jwt.js";

vi.mock("../../src/utils/jwt.js", () => ({
  verifyAccessToken: vi.fn(),
}));

describe("protect()", () => {
  let req: any;
  let res: any;
  let next: any;

  const decodedToken = {
    authUserId: "auth-user-1",
    userId: "user-1",
    email: "test@gmail.com",
  };

  beforeEach(() => {
    vi.clearAllMocks();

    req = {
      cookies: {},
    };

    res = {};

    next = vi.fn();
  });

  it("protect(): Should authenticate a valid access token", () => {
    req.cookies.accessToken = "valid-access-token";

    vi.mocked(verifyAccessToken).mockReturnValue(decodedToken);

    protect(req, res, next);

    expect(verifyAccessToken).toHaveBeenCalledWith(
      "valid-access-token",
    );

    expect(req.user).toEqual({
      ...decodedToken,
      id: decodedToken.userId,
    });

    expect(next).toHaveBeenCalledWith();
  });

  it("protect(): Should pass error when access token verification fails", () => {
    req.cookies.accessToken = "invalid-token";

    const error = new Error("Invalid access token");

    vi.mocked(verifyAccessToken).mockImplementation(() => {
      throw error;
    });

    protect(req, res, next);

    expect(next).toHaveBeenCalledWith(error);

    expect(req.user).toBeUndefined();
  });

  it("protect(): Should handle missing access token", () => {
    const error = new Error("Access token missing");

    vi.mocked(verifyAccessToken).mockImplementation(() => {
      throw error;
    });

    protect(req, res, next);

    expect(verifyAccessToken).toHaveBeenCalledWith(undefined);

    expect(next).toHaveBeenCalledWith(error);

    expect(req.user).toBeUndefined();
  });

  it("protect(): Should not call next without an error when authentication fails", () => {
    req.cookies.accessToken = "invalid-token";

    const error = new Error("Invalid access token");

    vi.mocked(verifyAccessToken).mockImplementation(() => {
      throw error;
    });

    protect(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(next).toHaveBeenCalledWith(error);
  });
});

