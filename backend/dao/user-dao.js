import { all, get, run, exec } from "../db/db.js";
import bcrypt from "bcryptjs";

// Get user by ID
export function getUserById(id) {
  return get("SELECT id, username, email, created_at FROM users WHERE id = ?", [
    id,
  ]);
}

// Get user by username (for login)
export function getUserByUsername(username) {
  return get("SELECT * FROM users WHERE username = ?", [username]);
}

// Get user by email
export function getUserByEmail(email) {
  return get("SELECT * FROM users WHERE email = ?", [email]);
}

// Verify password
export function verifyPassword(plainPassword, hashedPassword) {
  return bcrypt.compareSync(plainPassword, hashedPassword);
}

// Get all users (for admin purposes, without passwords)
export function getAllUsers() {
  return all("SELECT id, username, email, created_at FROM users");
}
