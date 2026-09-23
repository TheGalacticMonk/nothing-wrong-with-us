import type { CollectionConfig } from 'payload'

import { adminField, isAdmin } from '@/access'

export const Users: CollectionConfig = {
  slug: 'users',
  labels: { singular: 'Team member', plural: 'Team' },
  admin: {
    hideAPIURL: true,
    useAsTitle: 'name',
    defaultColumns: ['name', 'email', 'role'],
    group: 'Settings',
    // Editors manage their own login from the account menu; the list is for the developer.
    hidden: ({ user }) => user?.role !== 'admin',
  },
  auth: {
    maxLoginAttempts: 5,
    lockTime: 15 * 60 * 1000,
    tokenExpiration: 60 * 60 * 24 * 7,
    cookies: { sameSite: 'Lax', secure: process.env.NODE_ENV === 'production' },
  },
  access: {
    // No public sign-up. Admins manage accounts; everyone can see and edit themselves.
    create: isAdmin,
    delete: isAdmin,
    read: ({ req }) => (isAdmin({ req }) ? true : req.user ? { id: { equals: req.user.id } } : false),
    update: ({ req }) => (isAdmin({ req }) ? true : req.user ? { id: { equals: req.user.id } } : false),
    admin: ({ req }) => Boolean(req.user),
  },
  fields: [
    { name: 'name', type: 'text', required: true, label: 'Name', admin: { description: 'Used to greet you on the dashboard.' } },
    {
      name: 'role',
      type: 'select',
      required: true,
      defaultValue: 'editor',
      saveToJWT: true,
      options: [
        { label: 'Editor (edits the website)', value: 'editor' },
        { label: 'Admin (developer)', value: 'admin' },
      ],
      access: { create: adminField, update: adminField },
    },
  ],
}
