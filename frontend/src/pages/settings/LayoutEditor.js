import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Draggable from 'react-draggable';
import Handlebars from 'handlebars';
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Divider,
  FormControl,
  Grid,
  IconButton,
  InputLabel,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  MenuItem,
  Select,
  Stack,
  TextField,
  Tooltip,
  Typography
} from '@mui/material';
import SaveIcon from '@mui/icons-material/Save';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import RefreshIcon from '@mui/icons-material/Refresh';
import VisibilityIcon from '@mui/icons-material/Visibility';
import ImageIcon from '@mui/icons-material/Image';
import TextFieldsIcon from '@mui/icons-material/TextFields';
import TableRowsIcon from '@mui/icons-material/TableRows';
import HorizontalRuleIcon from '@mui/icons-material/HorizontalRule';
import CropSquareIcon from '@mui/icons-material/CropSquare';
import { nanoid } from 'nanoid';
import {
  createTemplate,
  deleteTemplate,
  duplicateTemplate,
  fetchMockData,
  fetchPlaceholders,
  fetchTemplate,
  fetchTemplates,
  renderPdf,
  updateTemplate,
  uploadTemplateAsset,
  listTemplateAssets
} from '../../services/templateService';

const CANVAS_SIZE = { width: 595, height: 842 };
const DEFAULT_TEMPLATE = {
  name: 'Neue Vorlage',
  type: 'invoice',
  versionLabel: 'V1.0',
  headerHtml: '<div class="header"><strong>{{company.name}}</strong></div>',
  footerHtml: '<div class="footer">Seite {{page}} / {{totalPages}}</div>',
  cssContent: '',
  htmlContent: '',
  layout: { canvas: CANVAS_SIZE, elements: [] },
  metadata: { isDraft: true }
};

const BASE_PREVIEW_STYLES = `
  body { font-family: 'Helvetica Neue', Arial, sans-serif; color: #1f2933; margin: 0; }
  .page-preview { position: relative; width: ${CANVAS_SIZE.width}px; height: ${CANVAS_SIZE.height}px; margin: 0 auto; }
  .tpl-element { position: absolute; box-sizing: border-box; }
  table { border-collapse: collapse; width: 100%; }
  th, td { border: 1px solid #d1d5db; padding: 6px 8px; }
`;

const createElement = (type = 'text') => {
  const base = {
    id: nanoid(),
    type,
    x: 40,
    y: 40,
    width: 200,
    height: 48,
    rotation: 0,
    style: {
      fontFamily: 'Helvetica Neue, Arial, sans-serif',
      fontSize: 14,
      color: '#1f2933',
      fontWeight: 400,
      textAlign: 'left',
      backgroundColor: 'transparent',
      padding: 0
    }
  };

  switch (type) {
    case 'text':
      return { ...base, content: 'Neuer Text' };
    case 'placeholder':
      return { ...base, content: '{{company.name}}' };
    case 'image':
      return {
        ...base,
        width: 180,
        height: 90,
        data: { src: '', objectFit: 'contain' },
        style: { ...base.style, padding: 0, backgroundColor: 'transparent' }
      };
    case 'table':
      return {
        ...base,
        width: 400,
        height: 160,
        data: {
          columns: ['Beschreibung', 'Menge', 'Preis', 'Gesamt'],
          showHeader: true,
          rows: 3
        }
      };
    case 'line':
      return {
        ...base,
        height: 2,
        width: 400,
        style: { ...base.style, backgroundColor: '#1f2933' }
      };
    case 'box':
      return {
        ...base,
        width: 220,
        height: 120,
        style: {
          ...base.style,
          backgroundColor: '#f8fafc',
          borderColor: '#cbd5f5',
          borderWidth: 1,
          borderStyle: 'solid',
          padding: 12
        },
        content: 'Inhalt'
      };
    default:
      return base;
  }
};

const buildElementStyle = (element) => {
  const { style = {}, width, height, rotation } = element;
  return {
    width,
    height,
    transform: `rotate(${rotation || 0}deg)`,
    fontFamily: style.fontFamily,
    fontSize: style.fontSize,
    fontWeight: style.fontWeight,
    color: style.color,
    textAlign: style.textAlign,
    backgroundColor: style.backgroundColor,
    borderColor: style.borderColor,
    borderWidth: style.borderWidth,
    borderStyle: style.borderStyle,
    padding: style.padding,
    lineHeight: style.lineHeight,
    letterSpacing: style.letterSpacing,
    borderRadius: style.borderRadius
  };
};

const generateTableHtml = (element) => {
  const { data = {} } = element;
  const columns = data.columns || [];
  const rows = Array.from({ length: data.rows || 3 });
  const headerHtml = data.showHeader
    ? `<thead><tr>${columns.map((col) => `<th>${col}</th>`).join('')}</tr></thead>`
    : '';

  const bodyHtml = `<tbody>${rows
    .map(
      () =>
        `<tr>${columns
          .map((col, colIndex) => `<td>{{this.row${colIndex + 1} || ''}}</td>`)
          .join('')}</tr>`
    )
    .join('')}</tbody>`;

  return `<table>${headerHtml}${bodyHtml}</table>`;
};

const generateElementHtml = (element) => {
  const style = buildElementStyle(element);
  const styleString = Object.entries(style)
    .filter(([, value]) => value !== undefined && value !== '')
    .map(([key, value]) => `${key.replace(/[A-Z]/g, (match) => `-${match.toLowerCase()}`)}:${value}`)
    .join(';');

  const positionStyles = `left:${element.x}px;top:${element.y}px;`;

  if (element.type === 'image') {
    const src = element.data?.src || '';
    const objectFit = element.data?.objectFit || 'contain';
    return `<div class="tpl-element" style="${positionStyles}${styleString}"><img src="${src}" style="width:100%;height:100%;object-fit:${objectFit};" alt=""/></div>`;
  }

  if (element.type === 'table') {
    return `<div class="tpl-element" style="${positionStyles}${styleString}">${generateTableHtml(element)}</div>`;
  }

  if (element.type === 'line') {
    const thickness = element.style?.borderWidth || element.height;
    return `<div class="tpl-element" style="${positionStyles}width:${element.width}px;height:${thickness}px;background:${element.style?.backgroundColor || '#000'}"></div>`;
  }

  return `<div class="tpl-element" style="${positionStyles}${styleString}">${element.content || ''}</div>`;
};

const buildLayoutHtml = (layout) => {
  if (!layout?.elements?.length) {
    return '';
  }

  return layout.elements.map((el) => generateElementHtml(el)).join('');
};

const buildDocumentHtml = (template, layout) => {
  const htmlContent = buildLayoutHtml(layout);
  const css = `${BASE_PREVIEW_STYLES}\n${template.cssContent || ''}`;
  return `<!DOCTYPE html><html lang="de"><head><meta charset="utf-8"/><style>${css}</style></head><body><header>${
    template.headerHtml || ''
  }</header><main><div class="page-preview">${htmlContent}</div></main><footer>${template.footerHtml || ''}</footer></body></html>`;
};

const LayoutEditor = () => {
  const [templates, setTemplates] = useState([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState(null);
  const [templateState, setTemplateState] = useState(DEFAULT_TEMPLATE);
  const [elements, setElements] = useState(DEFAULT_TEMPLATE.layout.elements);
  const [selectedElementId, setSelectedElementId] = useState(null);
  const [placeholderGroups, setPlaceholderGroups] = useState([]);
  const [assets, setAssets] = useState([]);
  const [mockData, setMockData] = useState(null);
  const [previewHtml, setPreviewHtml] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const iframeRef = useRef(null);

  const selectedElement = useMemo(
    () => elements.find((element) => element.id === selectedElementId) || null,
    [elements, selectedElementId]
  );

  const mergedLayout = useMemo(
    () => ({ ...templateState.layout, canvas: CANVAS_SIZE, elements }),
    [templateState.layout, elements]
  );

  const refreshPreview = useCallback(
    (data) => {
      if (!data) {
        return;
      }

      const documentHtml = buildDocumentHtml(templateState, mergedLayout);
      try {
        const compile = Handlebars.compile(documentHtml, { noEscape: true });
        const html = compile({ ...data, page: 1, totalPages: 1 });
        setPreviewHtml(html);
      } catch (err) {
        console.error('Fehler beim Rendern der Vorschau', err);
        setPreviewHtml(documentHtml);
      }
    },
    [templateState, mergedLayout]
  );

  useEffect(() => {
    const init = async () => {
      try {
        setLoading(true);
        const [tpls, placeholders, mock, assetItems] = await Promise.all([
          fetchTemplates(),
          fetchPlaceholders(),
          fetchMockData(),
          listTemplateAssets()
        ]);
        setTemplates(tpls);
        setPlaceholderGroups(placeholders);
        setMockData(mock);
        setAssets(assetItems);
        if (tpls.length > 0) {
          const first = tpls[0];
          setSelectedTemplateId(first.id);
          setTemplateState({ ...DEFAULT_TEMPLATE, ...first });
          setElements(first.layout?.elements || []);
        }
        refreshPreview(mock);
      } catch (err) {
        console.error(err);
        setError('Templates konnten nicht geladen werden.');
      } finally {
        setLoading(false);
      }
    };

    init();
  }, [refreshPreview]);

  useEffect(() => {
    if (!mockData) {
      return;
    }
    refreshPreview(mockData);
  }, [elements, templateState, mockData, refreshPreview]);

  useEffect(() => {
    if (iframeRef.current && previewHtml) {
      const iframeDoc = iframeRef.current.contentDocument;
      if (iframeDoc) {
        iframeDoc.open();
        iframeDoc.write(previewHtml);
        iframeDoc.close();
      }
    }
  }, [previewHtml]);

  const handleTemplateSelect = async (id) => {
    try {
      setLoading(true);
      const template = templates.find((tpl) => tpl.id === id) || (await fetchTemplate(id));
      setSelectedTemplateId(id);
      setTemplateState({ ...DEFAULT_TEMPLATE, ...template });
      setElements(template.layout?.elements || []);
      setSelectedElementId(null);
      setError(null);
    } catch (err) {
      console.error(err);
      setError('Vorlage konnte nicht geladen werden.');
    } finally {
      setLoading(false);
    }
  };

  const handleAddElement = (type) => {
    const element = createElement(type);
    setElements((prev) => [...prev, element]);
    setSelectedElementId(element.id);
  };

  const handleUpdateElement = (id, updates) => {
    setElements((prev) =>
      prev.map((element) => {
        if (element.id !== id) {
          return element;
        }

        const { style: styleUpdates, ...rest } = updates || {};
        return {
          ...element,
          ...rest,
          style: styleUpdates ? { ...element.style, ...styleUpdates } : element.style
        };
      })
    );
  };

  const handleRemoveElement = (id) => {
    setElements((prev) => prev.filter((element) => element.id !== id));
    if (selectedElementId === id) {
      setSelectedElementId(null);
    }
  };

  const handleDragStop = (id, data) => {
    handleUpdateElement(id, { x: data.x, y: data.y });
  };

  const handlePlaceholderInsert = (token) => {
    if (!selectedElement) {
      return;
    }
    if (['text', 'placeholder', 'box'].includes(selectedElement.type)) {
      handleUpdateElement(selectedElement.id, { content: `${selectedElement.content || ''} ${token}`.trim() });
    }
  };

  const handleTemplateFieldChange = (field, value) => {
    setTemplateState((prev) => ({ ...prev, [field]: value }));
  };

  const buildPayload = () => {
    const layout = { ...mergedLayout, elements };
    const htmlContent = buildLayoutHtml(layout);
    return {
      ...templateState,
      layout,
      htmlContent
    };
  };

  const handleSaveTemplate = async () => {
    try {
      setSaving(true);
      const payload = buildPayload();
      let saved;
      if (templateState.id) {
        saved = await updateTemplate(templateState.id, payload);
      } else {
        saved = await createTemplate(payload);
      }
      setTemplateState(saved);
      setSelectedTemplateId(saved.id);
      setTemplates((prev) => {
        const exists = prev.some((tpl) => tpl.id === saved.id);
        if (exists) {
          return prev.map((tpl) => (tpl.id === saved.id ? saved : tpl));
        }
        return [saved, ...prev];
      });
      setError(null);
    } catch (err) {
      console.error(err);
      setError('Vorlage konnte nicht gespeichert werden.');
    } finally {
      setSaving(false);
    }
  };

  const handleDuplicateTemplate = async () => {
    if (!templateState.id) {
      return;
    }
    try {
      setSaving(true);
      const duplicate = await duplicateTemplate(templateState.id);
      setTemplates((prev) => [duplicate, ...prev]);
      setTemplateState(duplicate);
      setElements(duplicate.layout?.elements || []);
      setSelectedTemplateId(duplicate.id);
      setError(null);
    } catch (err) {
      console.error(err);
      setError('Vorlage konnte nicht dupliziert werden.');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteTemplate = async () => {
    if (!templateState.id) {
      setTemplateState(DEFAULT_TEMPLATE);
      setElements([]);
      setSelectedTemplateId(null);
      return;
    }

    if (!window.confirm('Vorlage wirklich löschen?')) {
      return;
    }

    try {
      await deleteTemplate(templateState.id);
      setTemplates((prev) => prev.filter((tpl) => tpl.id !== templateState.id));
      setTemplateState(DEFAULT_TEMPLATE);
      setElements([]);
      setSelectedTemplateId(null);
      setError(null);
    } catch (err) {
      console.error(err);
      setError('Vorlage konnte nicht gelöscht werden.');
    }
  };

  const handleRenderPdf = async () => {
    if (!templateState.id) {
      setError('Bitte speichern Sie die Vorlage, bevor Sie eine PDF-Vorschau erzeugen.');
      return;
    }

    try {
      const blob = await renderPdf(templateState.id, mockData || {});
      const url = URL.createObjectURL(blob);
      window.open(url, '_blank');
    } catch (err) {
      console.error(err);
      setError('PDF konnte nicht erzeugt werden.');
    }
  };

  const handleAssetUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    try {
      const asset = await uploadTemplateAsset(file);
      setAssets((prev) => [asset, ...prev]);
      if (selectedElement && selectedElement.type === 'image') {
        handleUpdateElement(selectedElement.id, { data: { ...selectedElement.data, src: asset.url } });
      }
    } catch (err) {
      console.error(err);
      setError('Upload fehlgeschlagen.');
    }
  };

  const handleAssetSelect = (asset) => {
    if (!selectedElement || selectedElement.type !== 'image') {
      return;
    }
    handleUpdateElement(selectedElement.id, { data: { ...selectedElement.data, src: asset.url } });
  };

  const renderElementControl = (element) => {
    const style = buildElementStyle(element);
    const isSelected = element.id === selectedElementId;
    return (
      <Draggable key={element.id} position={{ x: element.x, y: element.y }} onStop={(_event, data) => handleDragStop(element.id, data)}>
        <Box
          onClick={() => setSelectedElementId(element.id)}
          sx={{
            position: 'absolute',
            cursor: 'move',
            border: isSelected ? '2px solid #2563eb' : '1px dashed rgba(148, 163, 184, 0.6)',
            backgroundColor: 'transparent',
            ...style,
            '&:hover': { borderColor: '#2563eb' }
          }}
        >
          {element.type === 'image' ? (
            element.data?.src ? (
              <img src={element.data?.src} alt="" style={{ width: '100%', height: '100%', objectFit: element.data?.objectFit || 'contain' }} />
            ) : (
              <Stack alignItems="center" justifyContent="center" sx={{ width: '100%', height: '100%', color: '#94a3b8' }}>
                <ImageIcon />
                <Typography variant="caption">Bild wählen</Typography>
              </Stack>
            )
          ) : element.type === 'table' ? (
            <table style={{ width: '100%', height: '100%' }}>
              {element.data?.showHeader && (
                <thead>
                  <tr>
                    {(element.data?.columns || []).map((col) => (
                      <th key={col}>{col}</th>
                    ))}
                  </tr>
                </thead>
              )}
              <tbody>
                {Array.from({ length: element.data?.rows || 3 }).map((_, rowIndex) => (
                  <tr key={rowIndex}>
                    {(element.data?.columns || []).map((col) => (
                      <td key={col}>{col}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          ) : element.type === 'line' ? (
            <Box sx={{ width: '100%', height: element.height || 2, backgroundColor: element.style?.backgroundColor || '#1f2933' }} />
          ) : (
            <Typography component="div" sx={{ cursor: 'text', userSelect: 'none' }}>
              {element.content}
            </Typography>
          )}
        </Box>
      </Draggable>
    );
  };

  const inspector = selectedElement ? (
    <Stack spacing={2} sx={{ p: 2 }}>
      <Typography variant="subtitle1">Eigenschaften</Typography>
      {['text', 'placeholder', 'box'].includes(selectedElement.type) && (
        <TextField
          label="Inhalt"
          multiline
          minRows={3}
          value={selectedElement.content || ''}
          onChange={(event) => handleUpdateElement(selectedElement.id, { content: event.target.value })}
        />
      )}
      <Stack direction="row" spacing={2}>
        <TextField
          label="Breite"
          type="number"
          value={selectedElement.width || 0}
          onChange={(event) => handleUpdateElement(selectedElement.id, { width: Number(event.target.value) })}
        />
        <TextField
          label="Höhe"
          type="number"
          value={selectedElement.height || 0}
          onChange={(event) => handleUpdateElement(selectedElement.id, { height: Number(event.target.value) })}
        />
      </Stack>
      <Stack direction="row" spacing={2}>
        <TextField
          label="Schriftgröße"
          type="number"
          value={selectedElement.style?.fontSize || 14}
          onChange={(event) =>
            handleUpdateElement(selectedElement.id, {
              style: { fontSize: Number(event.target.value) }
            })
          }
        />
        <TextField
          label="Farbe"
          type="color"
          value={selectedElement.style?.color || '#1f2933'}
          onChange={(event) => handleUpdateElement(selectedElement.id, { style: { color: event.target.value } })}
          sx={{ width: 90 }}
        />
      </Stack>
      {selectedElement.type === 'image' && (
        <Stack spacing={1}>
          <Typography variant="subtitle2">Bild wählen</Typography>
          <Button component="label" startIcon={<ImageIcon />} variant="outlined">
            Datei hochladen
            <input type="file" hidden accept="image/png,image/jpeg,image/svg+xml" onChange={handleAssetUpload} />
          </Button>
          <List dense>
            {assets.map((asset) => (
              <ListItem key={asset.url} disablePadding>
                <ListItemButton onClick={() => handleAssetSelect(asset)}>
                  <ListItemText primary={asset.originalName || asset.fileName} secondary={asset.url} />
                </ListItemButton>
              </ListItem>
            ))}
          </List>
        </Stack>
      )}
      {selectedElement.type === 'table' && (
        <Stack spacing={2}>
          <TextField
            label="Anzahl Zeilen"
            type="number"
            value={selectedElement.data?.rows || 3}
            onChange={(event) =>
              handleUpdateElement(selectedElement.id, {
                data: { ...selectedElement.data, rows: Number(event.target.value) }
              })
            }
          />
          <TextField
            label="Spalten (Kommagetrennt)"
            value={(selectedElement.data?.columns || []).join(', ')}
            onChange={(event) =>
              handleUpdateElement(selectedElement.id, {
                data: { ...selectedElement.data, columns: event.target.value.split(',').map((item) => item.trim()) }
              })
            }
          />
        </Stack>
      )}
      <Button color="error" startIcon={<DeleteIcon />} onClick={() => handleRemoveElement(selectedElement.id)}>
        Element entfernen
      </Button>
    </Stack>
  ) : (
    <Stack spacing={2} sx={{ p: 2 }}>
      <Typography variant="subtitle1">Eigenschaften</Typography>
      <Typography variant="body2" color="text.secondary">
        Wählen Sie ein Element auf der Seite aus, um dessen Eigenschaften zu bearbeiten.
      </Typography>
    </Stack>
  );

  if (loading) {
    return (
      <Stack spacing={2} alignItems="center" justifyContent="center" sx={{ minHeight: 320 }}>
        <CircularProgress />
        <Typography>Editor wird geladen…</Typography>
      </Stack>
    );
  }

  return (
    <Stack spacing={3}>
      <Stack direction="row" spacing={2} alignItems="center">
        <Typography variant="h4">Dokumenten-Editor</Typography>
        <Chip label={templateState.type === 'invoice' ? 'Rechnung' : templateState.type === 'offer' ? 'Angebot' : 'Custom'} color="primary" />
        {saving && <CircularProgress size={20} />}
        <Box sx={{ flexGrow: 1 }} />
        <Tooltip title="Speichern">
          <span>
            <Button
              startIcon={<SaveIcon />}
              variant="contained"
              onClick={handleSaveTemplate}
              disabled={saving}
            >
              Speichern
            </Button>
          </span>
        </Tooltip>
        <Tooltip title="PDF Vorschau">
          <span>
            <Button startIcon={<FileDownloadIcon />} variant="outlined" onClick={handleRenderPdf}>
              PDF öffnen
            </Button>
          </span>
        </Tooltip>
        <Tooltip title="Vorlage duplizieren">
          <span>
            <Button startIcon={<ContentCopyIcon />} variant="outlined" onClick={handleDuplicateTemplate}>
              Duplizieren
            </Button>
          </span>
        </Tooltip>
        <Tooltip title="Vorlage löschen">
          <span>
            <Button startIcon={<DeleteIcon />} color="error" variant="outlined" onClick={handleDeleteTemplate}>
              Löschen
            </Button>
          </span>
        </Tooltip>
      </Stack>

      {error && <Alert severity="error">{error}</Alert>}

      <Grid container spacing={3}>
        <Grid item xs={12} md={3} lg={2.5}>
          <Stack spacing={3}>
            <Box>
              <Typography variant="subtitle1" gutterBottom>
                Vorlagen
              </Typography>
              <List dense sx={{ border: '1px solid #e2e8f0', borderRadius: 2, maxHeight: 320, overflow: 'auto' }}>
                {templates.map((template) => (
                  <ListItem key={template.id} disablePadding>
                    <ListItemButton selected={template.id === selectedTemplateId} onClick={() => handleTemplateSelect(template.id)}>
                      <ListItemText
                        primary={template.name}
                        secondary={template.versionLabel ? `Version ${template.versionLabel}` : undefined}
                      />
                    </ListItemButton>
                  </ListItem>
                ))}
              </List>
              <Button
                startIcon={<AddIcon />}
                sx={{ mt: 1 }}
                onClick={() => {
                  setTemplateState(DEFAULT_TEMPLATE);
                  setElements([]);
                  setSelectedTemplateId(null);
                  setSelectedElementId(null);
                }}
              >
                Neue Vorlage
              </Button>
            </Box>
            <Divider />
            <Box>
              <Typography variant="subtitle1" gutterBottom>
                Werkzeuge
              </Typography>
              <Stack spacing={1}>
                <Button startIcon={<TextFieldsIcon />} variant="outlined" onClick={() => handleAddElement('text')}>
                  Textfeld
                </Button>
                <Button startIcon={<TableRowsIcon />} variant="outlined" onClick={() => handleAddElement('table')}>
                  Tabelle
                </Button>
                <Button startIcon={<ImageIcon />} variant="outlined" onClick={() => handleAddElement('image')}>
                  Bild / Logo
                </Button>
                <Button startIcon={<HorizontalRuleIcon />} variant="outlined" onClick={() => handleAddElement('line')}>
                  Linie
                </Button>
                <Button startIcon={<CropSquareIcon />} variant="outlined" onClick={() => handleAddElement('box')}>
                  Box
                </Button>
                <Button startIcon={<AddIcon />} variant="outlined" onClick={() => handleAddElement('placeholder')}>
                  Platzhalter
                </Button>
              </Stack>
            </Box>
          </Stack>
        </Grid>

        <Grid item xs={12} md={6} lg={6.5}>
          <Stack spacing={2}>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
              <TextField
                label="Name"
                value={templateState.name}
                onChange={(event) => handleTemplateFieldChange('name', event.target.value)}
                fullWidth
              />
              <FormControl sx={{ minWidth: 180 }}>
                <InputLabel>Typ</InputLabel>
                <Select value={templateState.type} label="Typ" onChange={(event) => handleTemplateFieldChange('type', event.target.value)}>
                  <MenuItem value="invoice">Rechnung</MenuItem>
                  <MenuItem value="offer">Angebot</MenuItem>
                  <MenuItem value="custom">Individuell</MenuItem>
                </Select>
              </FormControl>
              <TextField
                label="Version"
                value={templateState.versionLabel || ''}
                onChange={(event) => handleTemplateFieldChange('versionLabel', event.target.value)}
              />
            </Stack>

            <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} alignItems="flex-start">
              <Box
                sx={{
                  position: 'relative',
                  width: CANVAS_SIZE.width,
                  height: CANVAS_SIZE.height,
                  border: '1px solid #e2e8f0',
                  backgroundColor: '#fff',
                  overflow: 'hidden',
                  boxShadow: 1
                }}
              >
                {elements.map((element) => renderElementControl(element))}
              </Box>
              <Box sx={{ flexGrow: 1, minWidth: 280, border: '1px solid #e2e8f0', borderRadius: 2 }}>{inspector}</Box>
            </Stack>

            <Divider />
            <Stack spacing={2}>
              <Typography variant="subtitle1">Kopf- und Fußzeilen</Typography>
              <TextField
                label="Header HTML"
                multiline
                minRows={3}
                value={templateState.headerHtml || ''}
                onChange={(event) => handleTemplateFieldChange('headerHtml', event.target.value)}
              />
              <TextField
                label="Footer HTML"
                multiline
                minRows={3}
                value={templateState.footerHtml || ''}
                onChange={(event) => handleTemplateFieldChange('footerHtml', event.target.value)}
              />
              <TextField
                label="Zusätzliche CSS-Regeln"
                multiline
                minRows={4}
                value={templateState.cssContent || ''}
                onChange={(event) => handleTemplateFieldChange('cssContent', event.target.value)}
              />
            </Stack>
          </Stack>
        </Grid>

        <Grid item xs={12} md={3} lg={3}>
          <Stack spacing={3}>
            <Box sx={{ border: '1px solid #e2e8f0', borderRadius: 2 }}>
              <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ p: 2 }}>
                <Typography variant="subtitle1">Platzhalter</Typography>
                <IconButton size="small" onClick={async () => setPlaceholderGroups(await fetchPlaceholders())}>
                  <RefreshIcon fontSize="small" />
                </IconButton>
              </Stack>
              <Divider />
              <Box sx={{ maxHeight: 320, overflow: 'auto' }}>
                {placeholderGroups.map((group) => (
                  <Box key={group.group} sx={{ p: 2 }}>
                    <Typography variant="subtitle2">{group.group}</Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                      {group.description}
                    </Typography>
                    <Stack spacing={1}>
                      {group.items.map((item) => (
                        <Button key={item.token} variant="outlined" size="small" onClick={() => handlePlaceholderInsert(item.token)}>
                          {item.label}
                        </Button>
                      ))}
                    </Stack>
                  </Box>
                ))}
              </Box>
            </Box>

            <Box sx={{ border: '1px solid #e2e8f0', borderRadius: 2 }}>
              <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ p: 2 }}>
                <Typography variant="subtitle1">Live Vorschau</Typography>
                <IconButton size="small" onClick={() => refreshPreview(mockData)}>
                  <VisibilityIcon fontSize="small" />
                </IconButton>
              </Stack>
              <Divider />
              <Box sx={{ p: 2 }}>
                <Box component="iframe" ref={iframeRef} title="PDF Vorschau" sx={{ width: '100%', height: 420, border: '1px solid #e2e8f0' }} />
              </Box>
            </Box>
          </Stack>
        </Grid>
      </Grid>
    </Stack>
  );
};

export default LayoutEditor;
