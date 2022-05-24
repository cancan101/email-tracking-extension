import React from 'react';

export default function TrackingButton({
  getUserViews,
  renderTrackingInfo,
  isInsideEmail,
  isLoggedIn,
}: {
  getUserViews: () => Promise<any[] | null>;
  renderTrackingInfo: (views: any[]) => void;
  isInsideEmail: boolean;
  isLoggedIn: boolean;
}) {
  const onClick = async () => {
    const views = await getUserViews();
    if (views !== null) {
      renderTrackingInfo(views);
    }
  };

  const style =
    isInsideEmail || !isLoggedIn
      ? { display: 'none' }
      : { marginLeft: '12px', marginRight: '12px' };

  return (
    <div style={style} onClick={onClick}>
      Tracking
    </div>
  );
}
