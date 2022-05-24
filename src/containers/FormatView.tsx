import React from 'react';
import dayjs from 'dayjs';

import { View } from '../types';

export default function FormatView({
  view,
}: {
  view: View;
}): React.ReactElement {
  let ret = dayjs(view.createdAt).format('L LT');

  if (view.clientIpGeo != null && view.clientIpGeo.data != null) {
    ret = `${ret} (from: ${view.clientIpGeo.data.city}, ${view.clientIpGeo.data.region})`;
  }

  return <>{ret}</>;
}
