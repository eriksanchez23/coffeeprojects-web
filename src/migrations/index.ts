import * as migration_20261006_135901_initial from './20261006_135901_initial';
import * as migration_20261006_221153_pricing from './20261006_221153_pricing';
import * as migration_20261008_200736_pricing_v4 from './20261008_200736_pricing_v4';
import * as migration_20261008_203534_partners from './20261008_203534_partners';
import * as migration_20261008_233103_media_object_key from './20261008_233103_media_object_key';
import * as migration_20261008_234103_contact_quoted_summary from './20261008_234103_contact_quoted_summary';
import * as migration_20261008_234606_contact_replies from './20261008_234606_contact_replies';
import * as migration_20261009_000317_contact_reply_channel from './20261009_000317_contact_reply_channel';

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
    name: '20261008_203534_partners',
  },
  {
    up: migration_20261008_233103_media_object_key.up,
    down: migration_20261008_233103_media_object_key.down,
    name: '20261008_233103_media_object_key',
  },
  {
    up: migration_20261008_234103_contact_quoted_summary.up,
    down: migration_20261008_234103_contact_quoted_summary.down,
    name: '20261008_234103_contact_quoted_summary',
  },
  {
    up: migration_20261008_234606_contact_replies.up,
    down: migration_20261008_234606_contact_replies.down,
    name: '20261008_234606_contact_replies',
  },
  {
    up: migration_20261009_000317_contact_reply_channel.up,
    down: migration_20261009_000317_contact_reply_channel.down,
    name: '20261009_000317_contact_reply_channel'
  },
];
