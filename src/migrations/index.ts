import * as migration_20260922_183530_initial from './20260922_183530_initial';

export const migrations = [
  {
    up: migration_20260922_183530_initial.up,
    down: migration_20260922_183530_initial.down,
    name: '20260922_183530_initial'
  },
];
