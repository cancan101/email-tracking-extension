import React, { useEffect, useState } from 'react';
import useStore from './store';
import { View } from '../types';

export default function ThreadTrackingButton({
  getThreadViews,
  showThreadViews,
}: {
  getThreadViews: () => Promise<View[] | null>;
  showThreadViews: (views: View[] | null) => void;
}) {
  const [views, setViews] = useState<View[] | null | undefined>(undefined);
  const isLoggedIn = useStore((state) => state.isLoggedIn());

  useEffect(() => {
    // No way to cancel getThreadViews so we just keep track of unload
    let isCancelled = false;
    if (isLoggedIn) {
      getThreadViews().then((views) => !isCancelled && setViews(views));
    }
    return () => {
      isCancelled = true;
    };
  }, [isLoggedIn, getThreadViews]);

  const onClick = () => {
    if (views !== undefined) {
      showThreadViews(views);
    }
  };

  let labelExtra: string;
  if (views === undefined) {
    labelExtra = '';
  } else if (views === null) {
    labelExtra = ' (n/a)';
  } else {
    labelExtra = ` (${views.length})`;
  }

  const style = !isLoggedIn
    ? { display: 'none' }
    : { marginLeft: '12px', marginRight: '12px' };

  return (
    <div style={style} onClick={onClick}>
      Tracking{labelExtra}
    </div>
  );
}
