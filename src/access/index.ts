import type { Access, FieldAccess, PayloadRequest } from 'payload'

type Role = 'admin' | 'editor'

const hasRole = (req: PayloadRequest, role: Role) =>
  Boolean(req.user && 'role' in req.user && req.user.role === role)

export const isAdmin = ({ req }: { req: PayloadRequest }) => hasRole(req, 'admin')

/** Any signed-in person (admin or editor). */
export const signedIn: Access = ({ req }) => Boolean(req.user)

/** Admins only, for field-level access. */
export const adminField: FieldAccess = ({ req }) => hasRole(req, 'admin')

/**
 * Public read for published content; signed-in people can also read drafts.
 * Used on every collection/global with drafts enabled so unpublished work never leaks.
 */
export const publishedOrSignedIn: Access = ({ req }) => {
  if (req.user) return true
  return { _status: { equals: 'published' } }
}
