import React from 'react';
import dayjs from 'dayjs';

import { View } from '../types';

export default function FormatView({
  view,
}: {
  view: View;
}): React.ReactElement {
  let ret = dayjs(view.createdAt).format('L LT');

  const { clientIpGeo } = view;

  if (clientIpGeo != null) {
    if (clientIpGeo.data != null) {
      const geoData = clientIpGeo.data;
      const regionStr = geoData.region ?? geoData.regionCode;

      const extraLocaleTxt = geoData.isMobile === true ? '; on mobile' : '';
      ret = `${ret} (from: ${geoData.city}, ${regionStr}${extraLocaleTxt})`;
    }
    if (clientIpGeo.emailProvider != null) {
      ret = `${ret} (using: ${clientIpGeo.emailProvider})`;
    }
  }

  return <>{ret}</>;
}
