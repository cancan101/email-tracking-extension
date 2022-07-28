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
      const extraLocaleTxt =
        clientIpGeo.data.isMobile === true ? '; on mobile' : '';
      ret = `${ret} (from: ${clientIpGeo.data.city}, ${clientIpGeo.data.region}${extraLocaleTxt})`;
    }
    if (clientIpGeo.emailProvider != null) {
      ret = `${ret} (using: ${clientIpGeo.emailProvider})`;
    }
  }

  return <>{ret}</>;
}
