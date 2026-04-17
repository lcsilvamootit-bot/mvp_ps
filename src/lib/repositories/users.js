import crypto from 'crypto';
import { getDb } from '@/lib/db';
import { toCamel, toCamelAll } from '@/lib/utils';

export async function createUser({ name, email, role = 'vendedor' }) {
  const sql = getDb();
  const rows = await sql`
    INSERT INTO users (name, email, role, must_change_password)
    VALUES (${name}, ${email}, ${role}, true)
    RETURNING id, name, email, role, active, must_change_password, created_at
  `;
  return toCamel(rows[0]);
}

export async function findUserByEmail(email) {
  const sql = getDb();
  const rows = await sql`
    SELECT id, name, email, role, active, must_change_password, password_hash
    FROM users
    WHERE email = ${email.toLowerCase()}
    LIMIT 1
  `;
  return rows[0] ? toCamel(rows[0]) : null;
}

export async function findUserById(id) {
  const sql = getDb();
  const rows = await sql`
    SELECT id, name, email, role, active, must_change_password
    FROM users
    WHERE id = ${id}
    LIMIT 1
  `;
  return rows[0] ? toCamel(rows[0]) : null;
}

export async function setPassword(userId, passwordHash) {
  const sql = getDb();
  await sql`
    UPDATE users
    SET password_hash = ${passwordHash}, must_change_password = false, updated_at = NOW()
    WHERE id = ${userId}
  `;
}

export async function toggleUserActive(id) {
  const sql = getDb();
  const rows = await sql`
    UPDATE users
    SET active = NOT active, updated_at = NOW()
    WHERE id = ${id}
    RETURNING id, active
  `;
  return rows[0] ? toCamel(rows[0]) : null;
}

export async function getTeamIdsByUser(userId) {
  const sql = getDb();
  const rows = await sql`
    SELECT tm.team_id
    FROM team_members tm
    WHERE tm.user_id = ${userId}
  `;
  return rows.map(r => r.team_id);
}

export async function getTeamMemberIds(teamIds) {
  if (!teamIds || teamIds.length === 0) return [];
  const sql = getDb();
  const rows = await sql`
    SELECT DISTINCT tm.user_id
    FROM team_members tm
    WHERE tm.team_id = ANY(${teamIds})
  `;
  return rows.map(r => r.user_id);
}

export async function ensureGestorTeam(gestorId) {
  const sql = getDb();
  const existing = await sql`
    SELECT id FROM teams WHERE gestor_id = ${gestorId} LIMIT 1
  `;
  if (existing.length > 0) return existing[0].id;

  const rows = await sql`
    INSERT INTO teams (name, gestor_id)
    VALUES (${'Minha Equipe'}, ${gestorId})
    RETURNING id
  `;
  return rows[0].id;
}

export async function addUserToTeam(teamId, userId) {
  const sql = getDb();
  await sql`
    INSERT INTO team_members (team_id, user_id)
    VALUES (${teamId}, ${userId})
    ON CONFLICT DO NOTHING
  `;
}

export async function listVendedoresByGestor(gestorId) {
  const sql = getDb();
  const rows = await sql`
    SELECT u.id, u.name, u.email, u.active, u.must_change_password, u.created_at
    FROM users u
    JOIN team_members tm ON tm.user_id = u.id
    JOIN teams t ON t.id = tm.team_id
    WHERE t.gestor_id = ${gestorId} AND u.role = 'vendedor'
    ORDER BY u.created_at DESC
  `;
  return toCamelAll(rows);
}

export async function gestorExists() {
  const sql = getDb();
  const rows = await sql`SELECT 1 FROM users WHERE role = 'gestor' LIMIT 1`;
  return rows.length > 0;
}

// ── Invite tokens ─────────────────────────────────────────────

export async function createInviteToken(userId) {
  const sql = getDb();
  const token = crypto.randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + 72 * 60 * 60 * 1000).toISOString();

  await sql`DELETE FROM auth_tokens WHERE user_id = ${userId} AND type = 'invite'`;
  await sql`
    INSERT INTO auth_tokens (token, type, user_id, expires_at)
    VALUES (${token}, 'invite', ${userId}, ${expiresAt})
  `;
  return token;
}

export async function findAndConsumeInviteToken(token) {
  const sql = getDb();
  const rows = await sql`
    SELECT id, user_id, expires_at
    FROM auth_tokens
    WHERE token = ${token}
      AND type = 'invite'
      AND used_at IS NULL
      AND expires_at > NOW()
    LIMIT 1
  `;
  if (!rows[0]) return null;

  await sql`
    UPDATE auth_tokens SET used_at = NOW() WHERE id = ${rows[0].id}
  `;
  return rows[0].user_id;
}
