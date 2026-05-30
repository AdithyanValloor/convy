NOTES

// Registration OTP routes.
router.post("/send-otp", sendOtp);
router.post("/verify-otp", verifyOtp);

// Public authentication routes.
router.post("/register", register);
router.post("/login", login);
router.post("/logout", logout);
router.post("/refresh", refreshToken);

// Authenticated user context.
router.get("/me", protect, currentUser);


New moved routes from /user -> /auth

---------------------------------------

// Sensitive-action password verification route.
router.post("/check-password", protect, checkPasswordController);

moved from accountRouter -> auth

----------------------------------------


router.post("/email/send-otp", protect, sendEmailChangeOtpController);
router.patch("/email", protect, updateEmailController);

// Password and account state management.
router.patch("/password", protect, changePasswordController);

moved from accountRouter -> auth

----------------------------------------
