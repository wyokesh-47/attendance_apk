import {describe, expect, it} from '@jest/globals';
import {getHourPresentation, resolveHourSubmission} from '@/components/hourStatus';

describe('hour submission indicator', () => {
  it('does not mark an empty roster complete', () => {
    expect(getHourPresentation(0, 0, false)).toEqual({complete: false, submitted: false});
  });

  it('does not show a submission check for a complete but unsubmitted draft', () => {
    expect(getHourPresentation(55, 55, false)).toEqual({complete: true, submitted: false});
  });

  it('shows the submission check only for a submitted session', () => {
    expect(getHourPresentation(55, 55, true)).toEqual({complete: true, submitted: true});
  });

  it('ignores local-only receipts for cloud-backed classes but preserves other local classes', () => {
    expect(resolveHourSubmission(true, false, true)).toBe(false);
    expect(resolveHourSubmission(false, false, true)).toBe(true);
  });
});
