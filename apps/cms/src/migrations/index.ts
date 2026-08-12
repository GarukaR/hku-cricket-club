import * as migration_20260811_215940_initial from './20260811_215940_initial';

export const migrations = [
  {
    up: migration_20260811_215940_initial.up,
    down: migration_20260811_215940_initial.down,
    name: '20260811_215940_initial'
  },
];
