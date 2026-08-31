import * as migration_20260811_215940_initial from './20260811_215940_initial';
import * as migration_20260812_010852_core_collections from './20260812_010852_core_collections';
import * as migration_20260825_070906_player_appearance from './20260825_070906_player_appearance';
import * as migration_20260825_075036_innings_byes from './20260825_075036_innings_byes';
import * as migration_20260827_075412_match_drafts from './20260827_075412_match_drafts';
import * as migration_20260829_174552_add_player_playing_role from './20260829_174552_add_player_playing_role';
import * as migration_20260831_132736_add_enquiries from './20260831_132736_add_enquiries';
import * as migration_20260831_161839_add_held_reasons from './20260831_161839_add_held_reasons';

export const migrations = [
  {
    up: migration_20260811_215940_initial.up,
    down: migration_20260811_215940_initial.down,
    name: '20260811_215940_initial',
  },
  {
    up: migration_20260812_010852_core_collections.up,
    down: migration_20260812_010852_core_collections.down,
    name: '20260812_010852_core_collections',
  },
  {
    up: migration_20260825_070906_player_appearance.up,
    down: migration_20260825_070906_player_appearance.down,
    name: '20260825_070906_player_appearance',
  },
  {
    up: migration_20260825_075036_innings_byes.up,
    down: migration_20260825_075036_innings_byes.down,
    name: '20260825_075036_innings_byes',
  },
  {
    up: migration_20260827_075412_match_drafts.up,
    down: migration_20260827_075412_match_drafts.down,
    name: '20260827_075412_match_drafts',
  },
  {
    up: migration_20260829_174552_add_player_playing_role.up,
    down: migration_20260829_174552_add_player_playing_role.down,
    name: '20260829_174552_add_player_playing_role',
  },
  {
    up: migration_20260831_132736_add_enquiries.up,
    down: migration_20260831_132736_add_enquiries.down,
    name: '20260831_132736_add_enquiries',
  },
  {
    up: migration_20260831_161839_add_held_reasons.up,
    down: migration_20260831_161839_add_held_reasons.down,
    name: '20260831_161839_add_held_reasons'
  },
];
