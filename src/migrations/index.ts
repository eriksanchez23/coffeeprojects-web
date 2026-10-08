import * as migration_20261006_135901_initial from './20261006_135901_initial';
import * as migration_20261006_221153_pricing from './20261006_221153_pricing';
import * as migration_20261008_200736_pricing_v4 from './20261008_200736_pricing_v4';
import * as migration_20261008_203534_partners from './20261008_203534_partners';

export const migrations = [
  {
    up: migration_20261006_135901_initial.up,
    down: migration_20261006_135901_initial.down,
    name: '20261006_135901_initial',
  },
  {
    up: migration_20261006_221153_pricing.up,
    down: migration_20261006_221153_pricing.down,
    name: '20261006_221153_pricing',
  },
  {
    up: migration_20261008_200736_pricing_v4.up,
    down: migration_20261008_200736_pricing_v4.down,
    name: '20261008_200736_pricing_v4',
  },
  {
    up: migration_20261008_203534_partners.up,
    down: migration_20261008_203534_partners.down,
    name: '20261008_203534_partners'
  },
];
