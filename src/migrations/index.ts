import * as migration_20261006_133710_initial from './20261006_133710_initial';

export const migrations = [
  {
    up: migration_20261006_133710_initial.up,
    down: migration_20261006_133710_initial.down,
    name: '20261006_133710_initial'
  },
];
