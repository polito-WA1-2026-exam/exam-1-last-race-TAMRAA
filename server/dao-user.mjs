// ============================================================
// DAO – User Authentication (Data Access Object)
// ============================================================
// Verifies user credentials using crypto.scrypt with salt.
// Never returns password hash to the caller.
// ============================================================

import db from "./db.mjs";
import crypto from "crypto";

/**
 * Verify a user's credentials
 * @param {string} email - User's email
 * @param {string} password - Plain-text password
 * @returns {Promise<false|object>} - User object {id, email, name} or false
 */
export const getUser = (email, password) => {
  return new Promise((resolve, reject) => {
    const sql = "SELECT * FROM user WHERE email = ?";
    db.get(sql, [email], (err, row) => {
      if (err) {
        reject(err);
      } else if (row === undefined) {
        resolve(false);
      } else {
        const salt = row.salt;
        const dbHashedPassword = row.saltedPassword;
        const user = { id: row.id, email: row.email, name: row.name };

        crypto.scrypt(password, salt, 32, (err, hashedPassword) => {
          if (err) reject(err);

          if (
            !crypto.timingSafeEqual(
              Buffer.from(dbHashedPassword, "hex"),
              hashedPassword,
            )
          ) {
            resolve(false);
          } else {
            resolve(user);
          }
        });
      }
    });
  });
};
