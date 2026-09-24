import jwt from 'jsonwebtoken'
import bcrypt from 'bcryptjs'
import { cookies } from 'next/headers'
import { getDb } from './mongo'

const SECRET = process.env.JWT_SECRET || 'dev_secret'
const COOKIE = process.env.COOKIE_NAME || 'radar_session'
const DAYS = 30

export function signToken(userId) {
  return jwt.sign({ sub: userId }, SECRET, { expiresIn: `${DAYS}d` })
}

export function verifyToken(token) {
  try { return jwt.verify(token, SECRET) } catch { return null }
}

export async function setSessionCookie(userId) {
  const c = await cookies()
  c.set(COOKIE, signToken(userId), {
    httpOnly: true, path: '/', sameSite: 'lax', secure: true,
    maxAge: DAYS * 24 * 60 * 60,
  })
}

export async function clearSessionCookie() {
  const c = await cookies()
  c.delete(COOKIE)
}

export async function getSessionUserId() {
  const c = await cookies()
  const t = c.get(COOKIE)?.value
  if (!t) return null
  const p = verifyToken(t)
  return p?.sub || null
}

export async function getCurrentUser() {
  const userId = await getSessionUserId()
  if (!userId) return null
  const db = await getDb()
  const u = await db.collection('users').findOne({ id: userId })
  if (!u) return null
  const { passwordHash, ...safe } = u
  return safe
}

export async function hashPassword(pw) { return bcrypt.hash(pw, 10) }
export async function verifyPassword(pw, hash) { return bcrypt.compare(pw, hash) }
