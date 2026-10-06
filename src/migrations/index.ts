import * as migration_20261006_135901_initial from './20261006_135901_initial';
import * as migration_20261006_221153_pricing from './20261006_221153_pricing';

export const migrations = [
  {
    up: migration_20261006_135901_initial.up,
    down: migration_20261006_135901_initial.down,
    name: '20261006_135901_initial',
  },
  {
    up: migration_20261006_221153_pricing.up,
    down: migration_20261006_221153_pricing.down,
    name: '20261006_221153_pricing'
  },
];
