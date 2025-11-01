import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import { User } from "../models/userModel";
import {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
} from "../utils/tokenUtils";
import { utils } from "../utils/common";
import { ROLES, STATUS_CODES } from "../utils/constants";


// ========== SIGNUP ==========
export const signup = async (req: Request, res: Response) => {
  try {
    const { name, email, password, role = ROLES.USER } = req.body;

    if (!name || !email || !password || !role) {
      return res
        .status(STATUS_CODES.BAD_REQUEST)
        .json({ message: "All fields are required" });
    }

    if (!utils.verifyEmail(email)) {
      return res
        .status(STATUS_CODES.BAD_REQUEST)
        .json({ message: "Invalid email format" });
    }

    if (password.length < 6) {
      return res
        .status(STATUS_CODES.BAD_REQUEST)
        .json({ message: "Password must be at least 6 characters long" });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser)
      return res
        .status(STATUS_CODES.CONFLICT)
        .json({ message: "Email already registered" });

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = new User({ name, email, password: hashedPassword, role });
    await newUser.save();

    const accessToken = generateAccessToken({
      id: String(newUser._id),
      role: newUser.role,
    });
    const refreshToken = generateRefreshToken(String(newUser._id));

    newUser.refreshToken = refreshToken;
    await newUser.save();

    res.cookie("accessToken", accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "none",
      maxAge: 15 * 60 * 1000,
    });

    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "none",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.status(STATUS_CODES.CREATED).json({
      message: "User registered successfully",
      user: {
        id: newUser._id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
      },
    });
  } catch (error: any) {
    res
      .status(STATUS_CODES.INTERNAL_SERVER_ERROR)
      .json({ message: "Server error", error: error.message });
  }
};

// ========== LOGIN ==========
export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res
        .status(STATUS_CODES.BAD_REQUEST)
        .json({ message: "Email and password are required" });
    }

    if (!utils.verifyEmail(email)) {
      return res
        .status(STATUS_CODES.BAD_REQUEST)
        .json({ message: "Invalid email format" });
    }

    const user = await User.findOne({ email });
    if (!user)
      return res
        .status(STATUS_CODES.BAD_REQUEST)
        .json({ message: "Invalid email or password" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch)
      return res
        .status(STATUS_CODES.BAD_REQUEST)
        .json({ message: "Invalid email or password" });

    const accessToken = generateAccessToken({
      id: String(user._id),
      role: user.role,
    });
    const refreshToken = generateRefreshToken(String(user._id));

    user.refreshToken = refreshToken;
    await user.save();

    res.cookie("accessToken", accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "none",
      maxAge: 15 * 60 * 1000,
    });

    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "none",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.status(STATUS_CODES.SUCCESS).json({
      message: "Login successful",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error: any) {
    res
      .status(STATUS_CODES.INTERNAL_SERVER_ERROR)
      .json({ message: "Server error", error: error.message });
  }
};

// ========== REFRESH TOKEN ==========
export const refreshAccessToken = async (req: Request, res: Response) => {
  try {
    const refreshToken = req.cookies?.refreshToken;

    if (!refreshToken)
      return res
        .status(STATUS_CODES.BAD_REQUEST)
        .json({ message: "Refresh token is required" });

    const decoded = verifyRefreshToken(refreshToken);
    if (!decoded)
      return res
        .status(STATUS_CODES.FORBIDDEN)
        .json({ message: "Invalid or expired refresh token" });

    const user = await User.findById(decoded.id);
    if (!user || user.refreshToken !== refreshToken)
      return res
        .status(STATUS_CODES.FORBIDDEN)
        .json({ message: "Invalid refresh token" });

    const newAccessToken = generateAccessToken({
      id: String(user._id),
      role: user.role,
    });

    res.cookie("accessToken", newAccessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "none",
      maxAge: 15 * 60 * 1000,
    });

    res
      .status(STATUS_CODES.SUCCESS)
      .json({ message: "New access token generated successfully" });
  } catch (error: any) {
    res
      .status(STATUS_CODES.INTERNAL_SERVER_ERROR)
      .json({ message: "Server error", error: error.message });
  }
};

// ========== LOGOUT ==========
export const logout = async (req: Request, res: Response) => {
  try {
    const refreshToken = req.cookies?.refreshToken;

    if (!refreshToken) {
      return res
        .status(STATUS_CODES.BAD_REQUEST)
        .json({ message: "No refresh token provided" });
    }

    const user = await User.findOne({ refreshToken });
    if (!user) {
      res.clearCookie("accessToken");
      res.clearCookie("refreshToken");
      return res
        .status(STATUS_CODES.SUCCESS)
        .json({ message: "Logged out successfully" });
    }

    user.refreshToken = "";
    await user.save();

    res.clearCookie("accessToken", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "none",
    });
    res.clearCookie("refreshToken", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "none",
    });

    res
      .status(STATUS_CODES.SUCCESS)
      .json({ message: "Logout successful" });
  } catch (error: any) {
    console.error("Logout error:", error.message);
    res
      .status(STATUS_CODES.INTERNAL_SERVER_ERROR)
      .json({ message: "Server error", error: error.message });
  }
};
