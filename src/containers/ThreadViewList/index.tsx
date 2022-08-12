import React from 'react';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemText from '@mui/material/ListItemText';
import Tooltip from '@mui/material/Tooltip';
import dayjs from 'dayjs';

import FormatView from '../FormatView';
import { View } from '../../types';

function ThreadViewListItem({ view, pos }: { view: View; pos: number }) {
  const extraDetails = `Email sent: ${dayjs(
    view.tracker.scheduledSendAt ?? view.tracker.createdAt
  ).format('L LT')}`;

  return (
    <ListItem disablePadding>
      <Tooltip title={extraDetails} placement="bottom-start" arrow>
        <ListItemText
          primary={
            <>
              {pos + 1}
              {'. '}
              <FormatView view={view} />
            </>
          }
        ></ListItemText>
      </Tooltip>
    </ListItem>
  );
}

const listMaxHeight = '75vh';

export default function ThreadViewList({ views }: { views: View[] | null }) {
  if (views === null) {
    return <div>No tracking info found for this thread</div>;
  } else if (views.length === 0) {
    return <div>No views yet for this thread</div>;
  }
  return (
    <List
      dense
      disablePadding
      component="ol"
      sx={{ overflow: 'auto', maxHeight: listMaxHeight }}
    >
      {views.map((view, pos) => (
        <ThreadViewListItem key={view.id} view={view} pos={pos} />
      ))}
    </List>
  );
}
