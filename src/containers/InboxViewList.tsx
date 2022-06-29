import React from 'react';
import FormatView from './FormatView';
import { GmailUrlDecoder } from '../utils/GmailUrlDecoder';
import { View } from '../types';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemText from '@mui/material/ListItemText';

function InboxViewListItem({
  view,
  closeModal,
  pos,
}: {
  view: View;
  closeModal: Function;
  pos: number;
}) {
  // emailSubject may be an empty string
  const emailLabel = view.tracker.emailSubject || view.tracker.threadId;
  // URLs use a different format for the threadId
  const threadIdSlug = new GmailUrlDecoder().encode(view.tracker.threadId);
  const threadPath = `#all/${threadIdSlug}`;

  return (
    <ListItem disablePadding>
      <ListItemButton
        onClick={() => {
          window.location.hash = threadPath;
          closeModal();
        }}
      >
        <ListItemText
          primary={`${pos + 1}. ${emailLabel}`}
          primaryTypographyProps={{ noWrap: true, variant: 'subtitle2' }}
          secondary={<FormatView view={view} />}
          secondaryTypographyProps={{ variant: 'caption' }}
          sx={{ marginTop: '0px', marginBottom: '0px' }}
        />
      </ListItemButton>
    </ListItem>
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
    <List dense disablePadding component="ol">
      {views.map((view, pos) => (
        <InboxViewListItem
          key={view.id}
          view={view}
          closeModal={closeModal}
          pos={pos}
        />
      ))}
    </List>
  );
}
