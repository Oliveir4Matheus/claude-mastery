import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import pool from './db.js';

const SECRET = process.env.JWT_SECRET || 'claude-mastery-dev-secret-change-in-prod';
const EXPIRES = '30d';

export function signToken(userId) {
  return jwt.sign({ id: userId }, SECRET, { expiresIn: EXPIRES });
}

export function authMiddleware(req, res, next) {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) return res.status(401).json({ error: 'Token ausente' });

  try {
    const payload = jwt.verify(header.slice(7), SECRET);
    req.userId = payload.id;
    next();
  } catch {
    res.status(401).json({ error: 'Token invalido' });
  }
}

export async function register(req, res) {
  const { name, email, password } = req.body;
  if (!name || !email || !password) return res.status(400).json({ error: 'name, email e password obrigatorios' });
  if (password.length < 6) return res.status(400).json({ error: 'Senha deve ter pelo menos 6 caracteres' });

  try {
    const hash = await bcrypt.hash(password, 10);
    const result = await pool.query(
      'INSERT INTO users (name, email, password_hash) VALUES ($1, $2, $3) RETURNING id, name, email, created_at',
      [name.trim(), email.trim().toLowerCase(), hash]
    );
    const user = result.rows[0];
    const token = signToken(user.id);
    res.status(201).json({ user, token });
  } catch (err) {
    if (err.code === '23505') return res.status(409).json({ error: 'Email ja cadastrado' });
    throw err;
  }
}

export async function login(req, res) {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'email e password obrigatorios' });

  const result = await pool.query('SELECT * FROM users WHERE email = $1', [email.trim().toLowerCase()]);
  const user = result.rows[0];
  if (!user) return res.status(401).json({ error: 'Credenciais invalidas' });

  const valid = await bcrypt.compare(password, user.password_hash);
  if (!valid) return res.status(401).json({ error: 'Credenciais invalidas' });

  const token = signToken(user.id);
  res.json({
    user: { id: user.id, name: user.name, email: user.email, created_at: user.created_at },
    token,
  });
}

export async function me(req, res) {
  const result = await pool.query('SELECT id, name, email, created_at FROM users WHERE id = $1', [req.userId]);
  if (!result.rows[0]) return res.status(404).json({ error: 'Usuario nao encontrado' });
  res.json(result.rows[0]);
}
