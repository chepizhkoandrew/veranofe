import React, { useState } from 'react';
import {
  Menu,
  MenuItem,
  IconButton,
  ListItemIcon,
  ListItemText,
  Tooltip,
} from '@mui/material';
import {
  MoreVert as MoreVertIcon,
  Edit as EditIcon,
  History as HistoryIcon,
} from '@mui/icons-material';
import { InventoryItem } from '../services/api';

interface ActionsMenuProps {
  item: InventoryItem;
  onEditItem?: (item: InventoryItem) => void;
  onViewHistory: (item: InventoryItem) => void;
}

const ActionsMenu: React.FC<ActionsMenuProps> = ({
  item,
  onEditItem,
  onViewHistory,
}) => {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);

  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleEditItem = () => {
    if (onEditItem) {
      onEditItem(item);
    }
    handleClose();
  };

  const handleViewHistory = () => {
    onViewHistory(item);
    handleClose();
  };

  return (
    <>
      <Tooltip title="Actions">
        <IconButton
          size="small"
          onClick={handleClick}
          aria-controls={open ? 'actions-menu' : undefined}
          aria-haspopup="true"
          aria-expanded={open ? 'true' : undefined}
        >
          <MoreVertIcon />
        </IconButton>
      </Tooltip>
      <Menu
        id="actions-menu"
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        MenuListProps={{
          'aria-labelledby': 'actions-button',
        }}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
      >
        {onEditItem && (
          <MenuItem onClick={handleEditItem}>
            <ListItemIcon>
              <EditIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>Manual balance update</ListItemText>
          </MenuItem>
        )}
        <MenuItem onClick={handleViewHistory}>
          <ListItemIcon>
            <HistoryIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>View History</ListItemText>
        </MenuItem>
      </Menu>
    </>
  );
};

export default ActionsMenu;