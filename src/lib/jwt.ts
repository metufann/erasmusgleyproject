import { SignJWT, jwtVerify } from 'jose'

const secret = new TextEncoder().encode(process.env.APP_JWT_SECRET!)

export interface JWTPayload {
  countryId: number
  countrySlug: string
  exp: number
  [key: string]: string | number | boolean
}

export async function signJWT(countryId: number, countrySlug: string): Promise<string> {
  const payload: JWTPayload = {
    countryId,
    countrySlug,
    exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60) // 24 hours
  }
  
  return await new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('24h')
    .sign(secret)
}

export async function verifyJWT(token: string): Promise<JWTPayload> {
  try {
    const { payload } = await jwtVerify(token, secret)
    return payload as JWTPayload
  } catch {
    throw new Error('Invalid token')
  }
} 