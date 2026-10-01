/**
 * User account service: registration, credential verification, profile reads.
 * Passwords are hashed with bcrypt using a cost factor of 12.
 */
import bcrypt from 'bcryptjs';
import { safeQuery, isDatabaseEnabled } from '../db.js';
import memoryStore from '../db/memoryStore.js';
import { signToken } from '../middleware/auth.js';
import { conflict, unauthorized, serverError } from '../utils/errors.js';

const BCRYPT_ROUNDS = 12;

const PUBLIC_COLUMNS = 'id, email, full_name, role, created_at';

function toPublicUser(row) {
  if (!row) return null;
  return {
    id: row.id,
    email: row.email,
    full_name: row.full_name,
    role: row.role,
    created_at: row.created_at
  };
}

/** True when the process is serving from the volatile in-memory store. */
export function isUsingMemoryStore() {
  return !isDatabaseEnabled();
}

export async function emailExists(email) {
  if (isUsingMemoryStore()) return Boolean(memoryStore.findUserByEmail(email));
  const result = await safeQuery('SELECT 1 FROM users WHERE email = $1 LIMIT 1', [email]);
  return Boolean(result?.rows?.length);
}

export async function createUser({ email, password, full_name: fullName, role = 'inspector' }) {
  if (await emailExists(email)) {
    throw conflict('An account with that email already exists');
  }

  const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);

  if (isUsingMemoryStore()) {
    return toPublicUser(memoryStore.insertUser({ email, passwordHash, fullName, role }));
  }

  const result = await safeQuery(
    `INSERT INTO users (email, password_hash, full_name, role)
     VALUES ($1, $2, $3, $4)
     RETURNING ${PUBLIC_COLUMNS}`,
    [email, passwordHash, fullName, role]
  );

  if (!result) throw serverError('Could not create the account. Please try again.');
  return toPublicUser(result.rows[0]);
}

export async function authenticate({ email, password }) {
  let user = null;

  if (isUsingMemoryStore()) {
    user = memoryStore.findUserByEmail(email);
  } else {
    const result = await safeQuery('SELECT * FROM users WHERE email = $1 LIMIT 1', [email]);
    user = result?.rows?.[0] ?? null;
  }

  // One generic message for unknown email and wrong password: no account enumeration.
  if (!user) throw unauthorized('Invalid email or password');

  const valid = await bcrypt.compare(password, user.password_hash);
  if (!valid) throw unauthorized('Invalid email or password');

  return toPublicUser(user);
}

export async function getUserById(id) {
  if (isUsingMemoryStore()) return toPublicUser(memoryStore.findUserById(id));
  const result = await safeQuery(`SELECT ${PUBLIC_COLUMNS} FROM users WHERE id = $1 LIMIT 1`, [id]);
  return toPublicUser(result?.rows?.[0]);
}

export async function buildSession(user) {
  return { token: signToken(user), user };
}

export default { createUser, authenticate, getUserById, emailExists, buildSession, isUsingMemoryStore };
