import React, { useEffect, useState } from 'react';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import useStore from './store';
import { View } from '../types';

// -------------------------------------------------
dayjs.extend(relativeTime);
// -------------------------------------------------

const POLL_INTERVAL_SEC = 10;

// -------------------------------------------------

export default function TrackingButton({
  getUserViews,
  renderTrackingInfo,
}: {
  getUserViews: () => Promise<View[] | null>;
  renderTrackingInfo: (views: View[]) => void;
}) {
  const isLoggedIn = useStore((state) => state.isLoggedIn());
  const isInsideEmail = useStore((state) => state.isInsideEmail);
  const isPopout = useStore((state) => state.isPopout);
  const [views, setViews] = useState<View[] | null | undefined>(undefined);

  const onClick = () => {
    if (views != null) {
      renderTrackingInfo(views);
    }
  };

  useEffect(() => {
    const update = async () => {
      if (isLoggedIn) {
        const views = await getUserViews();
        setViews(views);
      }
    };
    update();
    const handle = setInterval(update, POLL_INTERVAL_SEC * 1000);
    return () => {
      clearInterval(handle);
    };
  }, [isLoggedIn, getUserViews]);

  const style =
    isInsideEmail || isPopout || !isLoggedIn
      ? { display: 'none' }
      : { marginLeft: '12px', marginRight: '12px' };

  let extra = '';
  if (views != null && views.length > 0) {
    extra = ` (${dayjs().to(dayjs(views[0].createdAt), false)})`;
  }

  return (
    <div style={style} onClick={onClick}>
      Tracking{extra}
    </div>
  );
}
