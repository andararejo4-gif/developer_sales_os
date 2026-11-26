import { describe, expect, it } from 'bun:test';
import {
  buildCreatorSmartLink,
  calculateKantongAAmount,
  calculatePph21Estimate,
} from '../src/lib/creator/creator-desk-store';

describe('Creator Desk (Paket 1 + Paket 2)', () => {
  it('membentuk smart link kreator dengan parameter ?p=&k=&c=', () => {
    const url = buildCreatorSmartLink({
      origin: 'https://developerproperti.giivepro.com',
      slug: 'the-park-sukoharjo',
      creatorCode: 'ac-rn27',
      contentCode: 'tpth-klip-0142',
      persona: 'keluarga',
    });
    expect(url).toBe(
      'https://developerproperti.giivepro.com/site/the-park-sukoharjo?p=keluarga&k=AC-RN27&c=tpth-klip-0142'
    );
  });

  it('menghitung CPM clipper sesuai minimum 1.000 view dan pagu Rp300.000/klip', () => {
    expect(
      calculateKantongAAmount({ contentType: 'KLIP', verifiedViews: 700, sessionMinutes: 0 }).cappedIdr
    ).toBe(0);

    expect(
      calculateKantongAAmount({ contentType: 'KLIP', verifiedViews: 48000, sessionMinutes: 0 }).cappedIdr
    ).toBe(144000);

    const overCap = calculateKantongAAmount({ contentType: 'KLIP', verifiedViews: 130000, sessionMinutes: 0 });
    expect(overCap.grossIdr).toBe(390000);
    expect(overCap.cappedIdr).toBe(300000);
  });

  it('menghitung fee sesi live sesuai minimum 60 menit dan maksimal 120 menit', () => {
    expect(
      calculateKantongAAmount({ contentType: 'LIVE', verifiedViews: 0, sessionMinutes: 45 }).cappedIdr
    ).toBe(0);

    expect(
      calculateKantongAAmount({ contentType: 'LIVE', verifiedViews: 0, sessionMinutes: 90 }).cappedIdr
    ).toBe(150000);

    expect(
      calculateKantongAAmount({ contentType: 'LIVE', verifiedViews: 0, sessionMinutes: 180 }).cappedIdr
    ).toBe(200000);
  });

  it('menghitung estimasi PPh 21 2,5% bruto', () => {
    const res = calculatePph21Estimate(1000000);
    expect(res.taxIdr).toBe(25000);
    expect(res.netIdr).toBe(975000);
  });
});
