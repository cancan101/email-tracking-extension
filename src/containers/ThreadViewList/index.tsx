import React from 'react';
import FormatView from '../FormatView';

function ThreadViewListItem({ view }: { view: any }) {
  return (
    <li>
      <FormatView view={view} />
    </li>
  );
}

export default function ThreadViewList({ views }: { views: any[] }) {
  if (views.length === 0) {
    return <div>No tracking info found for this thread</div>;
  }
  return (
    <ol>
      {views.map((view) => (
        <ThreadViewListItem key={view.id} view={view} />
      ))}
    </ol>
  );
}
