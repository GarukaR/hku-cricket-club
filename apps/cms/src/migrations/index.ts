import * as migration_20260811_215940_initial from './20260811_215940_initial';
import * as migration_20260812_010852_core_collections from './20260812_010852_core_collections';

export const migrations = [
  {
    up: migration_20260811_215940_initial.up,
    down: migration_20260811_215940_initial.down,
    name: '20260811_215940_initial',
  },
  {
    up: migration_20260812_010852_core_collections.up,
    down: migration_20260812_010852_core_collections.down,
    name: '20260812_010852_core_collections'
  },
];
