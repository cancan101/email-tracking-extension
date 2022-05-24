import React, { useEffect, useState } from 'react';

export default function ThreadTrackingButton({
  getThreadViews,
  showThreadViews,
  isLoggedIn,
}: {
  getThreadViews: () => Promise<any[] | null>;
  showThreadViews: (views: any[] | null) => void;
  isLoggedIn: boolean;
}) {
  const [views, setViews] = useState<any[] | null | undefined>(undefined);

  useEffect(() => {
    if (isLoggedIn) {
      getThreadViews().then((views) => setViews(views));
    }
  }, [isLoggedIn, getThreadViews]);

  const onClick = async () => {
    const views = await getThreadViews();
    showThreadViews(views);
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
