import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Collapse,
  CircularProgress,
  Alert,
  Tooltip,
  Avatar,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  Visibility as ViewIcon,
  Edit as EditIcon,
  MoreVert as MoreVertIcon,
} from '@mui/icons-material';
import { apiService, PurchaseRequest } from '../services/api';

interface PurchaseRequestsListProps {
  onBack: () => void;
}

interface ExpandedRow {
  [key: string]: boolean;
}

const PurchaseRequestsList: React.FC<PurchaseRequestsListProps> = ({ onBack }) => {
  const navigate = useNavigate();
  const [purchaseRequests, setPurchaseRequests] = useState<PurchaseRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedRows, setExpandedRows] = useState<ExpandedRow>({});
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedRequest, setSelectedRequest] = useState<PurchaseRequest | null>(null);

  useEffect(() => {
    loadPurchaseRequests();
  }, []);

  const loadPurchaseRequests = async () => {
    try {
      setLoading(true);
      setError(null);
      const requests = await apiService.getPurchaseRequests();
      setPurchaseRequests(requests);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load purchase requests');
    } finally {
      setLoading(false);
    }
  };

  const handleExpandRow = (purchaseOrderId: string) => {
    setExpandedRows(prev => ({
      ...prev,
      [purchaseOrderId]: !prev[purchaseOrderId]
    }));
  };

  const handleMenuClick = (event: React.MouseEvent<HTMLElement>, request: PurchaseRequest) => {
    setAnchorEl(event.currentTarget);
    setSelectedRequest(request);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedRequest(null);
  };

  const handleEditRequest = () => {
    if (selectedRequest) {
      navigate(`/receive/pr/${selectedRequest.purchase_order_id}`);
    }
    handleMenuClose();
  };

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'created':
        return 'info';
      case 'confirmed by vendor':
        return 'success';
      case 'cancelled':
        return 'error';
      case 'received to stock':
        return 'success';
      case 'returned to vendor':
        return 'warning';
      case 'overdue':
        return 'error';
      default:
        return 'default';
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Not set';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getColorStyles = (color: string) => {
    const colorLower = color.toLowerCase();
    
    const colorMap: { [key: string]: { backgroundColor: string; color: string } } = {
      'burgundy': { backgroundColor: '#660033', color: 'white' },
      'peach': { backgroundColor: '#ffe5b4', color: 'black' },
      'mix': { 
        backgroundColor: 'linear-gradient(45deg, #ff0000, #ff8000, #ffff00, #80ff00, #00ff00, #00ff80, #00ffff, #0080ff, #0000ff, #8000ff, #ff00ff, #ff0080)',
        color: 'white' 
      },
      'white': { backgroundColor: 'white', color: 'black' },
      'cream': { backgroundColor: 'cream', color: 'black' },
      'yellow': { backgroundColor: 'yellow', color: 'black' },
    };

    return colorMap[colorLower] || { backgroundColor: colorLower, color: 'white' };
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <>
      {/* Header */}
      <Box display="flex" alignItems="center" gap={2} mb={3}>
        <IconButton
          onClick={onBack}
          sx={{ 
            bgcolor: 'grey.200', 
            '&:hover': { bgcolor: 'grey.300' }
          }}
        >
          <ArrowBackIcon />
        </IconButton>
        <Typography variant="h5" component="h2">
          Purchase Requests
        </Typography>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* Purchase Requests Table */}
      <TableContainer component={Paper} elevation={2}>
        <Table>
          <TableHead>
            <TableRow sx={{ bgcolor: 'grey.50' }}>
              <TableCell width="50px"></TableCell>
              <TableCell>Order ID</TableCell>
              <TableCell>Supplier</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Created</TableCell>
              <TableCell>Expected Delivery</TableCell>
              <TableCell>Items Count</TableCell>
              <TableCell width="50px">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {purchaseRequests.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} align="center" sx={{ py: 4 }}>
                  <Typography color="text.secondary">
                    No purchase requests found
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              purchaseRequests.map((request) => (
                <React.Fragment key={request.purchase_order_id}>
                  {/* Main Row */}
                  <TableRow 
                    hover 
                    sx={{ 
                      '&:hover': { bgcolor: 'grey.50' },
                      cursor: 'pointer'
                    }}
                    onClick={() => handleExpandRow(request.purchase_order_id)}
                  >
                    <TableCell>
                      <IconButton size="small">
                        {expandedRows[request.purchase_order_id] ? 
                          <ExpandLessIcon /> : <ExpandMoreIcon />
                        }
                      </IconButton>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" fontWeight="medium">
                        #{request.purchase_order_id.slice(-6)}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {request.supplier_name || 'Unknown Supplier'}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={request.Status || 'Unknown'}
                        color={getStatusColor(request.Status || '')}
                        size="small"
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {formatDate(request.Created_at)}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {formatDate(request.Expected_delivery)}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={`${request.items.length} items`}
                        size="small"
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell>
                      <IconButton
                        size="small"
                        onClick={(e) => {
                          e.stopPropagation(); // Prevent row expansion
                          handleMenuClick(e, request);
                        }}
                      >
                        <MoreVertIcon />
                      </IconButton>
                    </TableCell>
                  </TableRow>

                  {/* Expanded Row - Items */}
                  <TableRow>
                    <TableCell colSpan={8} sx={{ p: 0, border: 'none' }}>
                      <Collapse in={expandedRows[request.purchase_order_id]}>
                        <Box sx={{ p: 3, bgcolor: 'grey.25' }}>
                          <Typography variant="subtitle2" gutterBottom>
                            Requested Items:
                          </Typography>
                          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
                            {request.items.map((item) => (
                              <Paper 
                                key={item.requested_item_id}
                                elevation={1}
                                sx={{ 
                                  p: 2, 
                                  minWidth: 200,
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: 2
                                }}
                              >
                                <Avatar
                                  sx={{ 
                                    width: 40, 
                                    height: 40,
                                    bgcolor: 'grey.300',
                                    fontSize: '0.8rem'
                                  }}
                                  variant="rounded"
                                >
                                  {item.item_name.charAt(0).toUpperCase()}
                                </Avatar>
                                <Box sx={{ flex: 1 }}>
                                  <Typography variant="body2" fontWeight="medium">
                                    {item.item_name}
                                  </Typography>
                                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                                    <Chip 
                                      label={item.Color} 
                                      size="small" 
                                      sx={{
                                        ...getColorStyles(item.Color),
                                        fontSize: '0.7rem',
                                        height: 20
                                      }}
                                    />
                                    <Typography variant="body2" color="text.secondary">
                                      Qty: {item.quantity}
                                    </Typography>
                                  </Box>
                                </Box>
                              </Paper>
                            ))}
                          </Box>
                        </Box>
                      </Collapse>
                    </TableCell>
                  </TableRow>
                </React.Fragment>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Actions Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'right',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
      >
        <MenuItem onClick={handleEditRequest}>
          <ListItemIcon>
            <EditIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Edit Request</ListItemText>
        </MenuItem>
      </Menu>
    </>
  );
};

export default PurchaseRequestsList;