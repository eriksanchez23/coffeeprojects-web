import * as migration_20261006_135901_initial from './20261006_135901_initial';

export const migrations = [
  {
    up: migration_20261006_135901_initial.up,
    down: migration_20261006_135901_initial.down,
    name: '20261006_135901_initial'
  },
];
