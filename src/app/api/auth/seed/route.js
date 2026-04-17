import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { getDb } from '@/lib/db';
import { gestorExists } from '@/lib/repositories/users';

export const runtime = 'nodejs';

const schema = z.object({
  key:      z.string().min(1),
  name:     z.string().min(1).max(120),
  email:    z.string().email(),
  password: z.string().min(8),
});

export async function POST(request) {
  const seedKey = process.env.SEED_KEY;
  if (!seedKey) {
    return Response.json({ error: 'Seed desabilitado.' }, { status: 403 });
  }

  const body = await request.json().catch(() => ({}));
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: 'Dados inválidos.' }, { status: 400 });
  }

  if (parsed.data.key !== seedKey) {
    return Response.json({ error: 'Chave inválida.' }, { status: 403 });
  }

  if (await gestorExists()) {
    return Response.json({ error: 'Gestor já existe.' }, { status: 409 });
  }

  const { name, email, password } = parsed.data;
  const passwordHash = await bcrypt.hash(password, 12);
  const sql = getDb();

  const rows = await sql`
    INSERT INTO users (name, email, password_hash, role, must_change_password)
    VALUES (${name}, ${email.toLowerCase()}, ${passwordHash}, 'gestor', false)
    RETURNING id, name, email, role
  `;

  return Response.json(rows[0], { status: 201 });
}
