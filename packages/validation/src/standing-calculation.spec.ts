import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
  standingCalculationPreviewSchema,
  standingCalculationApplySchema,
} from '../dist/standing-calculation.js';

describe('Task 198 calculation validation', () => {
  it('accepts explicitly chosen season-level or stage scope', () => {
    assert.equal(standingCalculationPreviewSchema.parse({ stageId: null }).stageId, null);
    assert.equal(
      standingCalculationApplySchema.parse({
        stageId: null,
        expectedPreviewHash: 'a'.repeat(64),
        overwriteExisting: false,
      }).overwriteExisting,
      false,
    );
  });

  it('rejects missing stage choice, blank checksum and implicit overwrite consent', () => {
    for (const bad of [
      {},
      { stageId: 'bad' },
      { stageId: null, expectedPreviewHash: 'a'.repeat(64) },
      { stageId: null, expectedPreviewHash: '1234', overwriteExisting: false },
      { stageId: null, expectedPreviewHash: 'b'.repeat(64), overwriteExisting: 'true' },
      { stageId: null, expectedPreviewHash: 'c'.repeat(64), overwriteExisting: true, force: true },
    ]) {
      assert.equal(standingCalculationApplySchema.safeParse(bad).success, false);
    }
  });
});
