import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { supabaseAdmin } from './supabase';

const JWT_SECRET = process.env.JWT_SECRET || 'digiboi-secret';

// Hash password
export async function hashPassword(password) {
  return bcrypt.hash(password, 10);
}

// Verify password
export async function verifyPassword(password, hash) {
  return bcrypt.compare(password, hash);
}

// Create JWT token
export function createToken(payload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
}

// Verify JWT token
export function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch {
    return null;
  }
}

// Get user from token in request
export function getUserFromRequest(request) {
  const authHeader = request.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) return null;
  const token = authHeader.slice(7);
  return verifyToken(token);
}

// Find user by phone or email
export async function findUser(identifier) {
  const isPhone = identifier.startsWith('+') || /^\d/.test(identifier);
  const field = isPhone ? 'phone' : 'email';
  const { data } = await supabaseAdmin
    .from('users')
    .select('*')
    .eq(field, identifier)
    .eq('is_active', true)
    .single();
  return data;
}

// Get shop for user
export async function getUserShop(userId) {
  const { data } = await supabaseAdmin
    .from('shops')
    .select('*')
    .eq('owner_id', userId)
    .eq('is_active', true)
    .single();
  return data;
}

// Log activity
export async function logActivity(userId, shopId, action, details = {}) {
  await supabaseAdmin.from('activity_logs').insert({
    user_id: userId,
    shop_id: shopId,
    action,
    details,
  });
}
