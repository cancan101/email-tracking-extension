import React from 'react';
import FormatView from '../FormatView';
import { View } from '../../types';

function ThreadViewListItem({ view }: { view: View }) {
  return (
    <li>
      <FormatView view={view} />
    </li>
  );
}

export default function ThreadViewList({ views }: { views: View[] | null }) {
  if (views === null) {
    return <div>No tracking info found for this thread</div>;
  } else if (views.length === 0) {
    return <div>No views yet for this thread</div>;
  }
  return (
    <ol>
      {views.map((view) => (
        <ThreadViewListItem key={view.id} view={view} />
      ))}
    </ol>
  );
}
