import React from 'react';
import FormatView from './FormatView';
import { GmailUrlDecoder } from '../utils/GmailUrlDecoder';
import { View } from '../types';

function InboxViewListItem({
  view,
  closeModal,
}: {
  view: View;
  closeModal: Function;
}) {
  return (
    <li
      className="link-like"
      onClick={() => {
        window.location.hash = `#all/${new GmailUrlDecoder().encode(
          view.tracker.threadId
        )}`;
        closeModal();
      }}
    >
      <div className="ellipsis-overflow bolder">
        {view.tracker.emailSubject || view.tracker.threadId}
      </div>
      <div>
        <FormatView view={view} />
      </div>
    </li>
  );
}

export default function InboxViewList({
  views,
  closeModal,
}: {
  views: View[];
  closeModal: Function;
}) {
  return (
    <ol>
      {views.map((view) => (
        <InboxViewListItem key={view.id} view={view} closeModal={closeModal} />
      ))}
    </ol>
  );
}
