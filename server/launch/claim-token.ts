import {
  createHash,
  randomBytes,
} from 'node:crypto'

export function createLaunchClaimToken() {
  const token =
    randomBytes(32).toString('hex')

  const tokenHash =
    hashLaunchClaimToken(token)

  return {
    token,
    tokenHash,
  }
}

export function hashLaunchClaimToken(
  token: string,
) {
  return createHash('sha256')
    .update(token)
    .digest('hex')
}