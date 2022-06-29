import React from 'react';
import FormatView from '../FormatView';
import { View } from '../../types';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemText from '@mui/material/ListItemText';

function ThreadViewListItem({ view, pos }: { view: View; pos: number }) {
  return (
    <ListItem disablePadding>
      <ListItemText
        primary={
          <>
            {pos + 1}
            {'. '}
            <FormatView view={view} />
          </>
        }
      ></ListItemText>
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
