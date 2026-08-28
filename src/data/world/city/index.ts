import type { DistrictDef, DistrictId, RoomPointDef } from '@core/types';
import { BOULEVARD } from './boulevard';
import { DOWNTOWN } from './downtown';
import { HILLS } from './hills';
import { PIER } from './pier';

export { STREET } from './plan';

/**
 * Город: четыре района подряд, от жилых холмов до причала. Порядок в
 * списке — порядок на улице: створ в конце каждого района ведёт к
 * соседу, а карта позволяет перескочить через весь город сразу.
 */
export const CITY: readonly DistrictDef[] = [HILLS, DOWNTOWN, BOULEVARD, PIER];

/** Район, где стоит квартира: с него начинается прогон. */
export const HOME_DISTRICT: DistrictId = 'hills';

const BY_ID = new Map(CITY.map((district) => [district.id, district]));

export function getDistrict(id: DistrictId): DistrictDef {
  const district = BY_ID.get(id);
  if (!district) throw new Error(`Неизвестный район: "${id}"`);
  return district;
}

/** В каком районе стоит дом этой локации. */
export function districtOfLocation(locationId: string): DistrictDef | undefined {
  return CITY.find((district) =>
    district.buildings.some((building) => building.locationId === locationId),
  );
}

/** Все площадки под открытым небом: они раскиданы по разным районам. */
export function findStreetPoint(pointId: string): RoomPointDef | undefined {
  for (const district of CITY) {
    const point = district.points.find((candidate) => candidate.id === pointId);
    if (point) return point;
  }
  return undefined;
}
