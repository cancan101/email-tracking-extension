import React from 'react';
import FormatView from './FormatView';
import { GmailUrlDecoder } from '../utils/GmailUrlDecoder';

function InboxViewListItem({
  view,
  closeModal,
}: {
  view: any;
  closeModal: Function;
}) {
  return (
    <li
      onClick={() => {
        window.location.hash = `#all/${new GmailUrlDecoder().encode(
          view.tracker.threadId
        )}`;
        closeModal();
      }}
    >
      <FormatView view={view} /> (
      {view.tracker.emailSubject || view.tracker.threadId})
    </li>
  );
}

export default function InboxViewList({
  views,
  closeModal,
}: {
  views: any[];
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
