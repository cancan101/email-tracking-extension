import React from 'react';
import dayjs from 'dayjs';

export default function FormatView({
  view,
}: {
  view: any;
}): React.ReactElement {
  let ret = dayjs(view.createdAt).format('L LT');

  if (view.clientIpGeo) {
    ret = `${ret} (from: ${view.clientIpGeo.data.city}, ${view.clientIpGeo.data.region})`;
  }

  return <>{ret}</>;
}
