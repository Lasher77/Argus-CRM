import React, { useEffect, useState } from 'react';
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  CircularProgress,
  Alert,
  Stack,
  TextField
} from '@mui/material';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import SendIcon from '@mui/icons-material/Send';
import templateService from '../../services/templateService';

const InvoiceTemplateDialog = ({ open, onClose, invoice, onDownload, onSend }) => {
  const [templates, setTemplates] = useState([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [email, setEmail] = useState('');
  const [showEmailInput, setShowEmailInput] = useState(false);

  useEffect(() => {
    if (open) {
      loadTemplates();
      setShowEmailInput(false);
      if (invoice) {
          setEmail(invoice.contact_email || invoice.account_email || '');
      }
    }
  }, [open, invoice]);

  const loadTemplates = async () => {
    try {
      setLoading(true);
      setError(null);
      const allTemplates = await templateService.fetchTemplates();
      // Filter for invoice templates
      const invoiceTemplates = allTemplates.filter(t => t.type === 'invoice');
      setTemplates(invoiceTemplates);

      if (invoiceTemplates.length > 0) {
        // Try to find a default or pick the first one
        const defaultTpl = invoiceTemplates.find(t => t.metadata?.isDefault) || invoiceTemplates[0];
        setSelectedTemplateId(defaultTpl.id);
      }
    } catch (err) {
      console.error(err);
      setError('Vorlagen konnten nicht geladen werden.');
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = () => {
    if (selectedTemplateId) {
      onDownload(selectedTemplateId, invoice);
      onClose();
    }
  };

  const handleSendClick = () => {
      setShowEmailInput(true);
  };

  const handleConfirmSend = () => {
      if (selectedTemplateId && email) {
          onSend(selectedTemplateId, invoice, email);
          onClose();
      }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>PDF Vorlage & Aktion wählen</DialogTitle>
      <DialogContent>
        <DialogContentText sx={{ mb: 2 }}>
          Bitte wählen Sie das Layout für die Rechnung {invoice?.invoice_number}.
        </DialogContentText>

        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

        {loading ? (
          <CircularProgress />
        ) : (
          <Stack spacing={3}>
            <FormControl fullWidth>
                <InputLabel id="template-select-label">Vorlage</InputLabel>
                <Select
                labelId="template-select-label"
                value={selectedTemplateId}
                label="Vorlage"
                onChange={(e) => setSelectedTemplateId(e.target.value)}
                >
                {templates.map((tpl) => (
                    <MenuItem key={tpl.id} value={tpl.id}>
                    {tpl.name} {tpl.versionLabel ? `(${tpl.versionLabel})` : ''}
                    </MenuItem>
                ))}
                </Select>
            </FormControl>

            {showEmailInput && (
                <TextField
                    label="Empfänger E-Mail"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    fullWidth
                    autoFocus
                />
            )}
          </Stack>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Abbrechen</Button>
        {!showEmailInput ? (
            <>
                <Button
                    onClick={handleSendClick}
                    variant="outlined"
                    disabled={!selectedTemplateId || loading}
                    startIcon={<SendIcon />}
                >
                    Per E-Mail senden
                </Button>
                <Button
                    onClick={handleDownload}
                    variant="contained"
                    disabled={!selectedTemplateId || loading}
                    startIcon={<PictureAsPdfIcon />}
                >
                    PDF Generieren
                </Button>
            </>
        ) : (
             <Button
                onClick={handleConfirmSend}
                variant="contained"
                disabled={!selectedTemplateId || loading || !email}
                startIcon={<SendIcon />}
            >
                Jetzt senden
            </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};

export default InvoiceTemplateDialog;
