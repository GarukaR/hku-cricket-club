import * as migration_20260811_215940_initial from './20260811_215940_initial';
import * as migration_20260812_010852_core_collections from './20260812_010852_core_collections';
import * as migration_20260825_070906_player_appearance from './20260825_070906_player_appearance';
import * as migration_20260825_075036_innings_byes from './20260825_075036_innings_byes';
import * as migration_20260827_075412_match_drafts from './20260827_075412_match_drafts';

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
    name: '20260827_075412_match_drafts'
  },
];
