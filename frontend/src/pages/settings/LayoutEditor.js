import React, { useState, useEffect } from 'react';
import { Box, Typography, Button, TextField, Select, MenuItem, InputLabel, FormControl } from '@mui/material';
import Draggable from 'react-draggable';
import axios from 'axios';

const API_URL = 'http://localhost:3000/api';

const defaultElement = () => ({
  id: Date.now(),
  type: 'text',
  text: 'Neuer Text',
  x: 0,
  y: 0,
  fontSize: 14,
  fontFamily: 'Arial',
  color: '#000000'
});

const LayoutEditor = () => {
  const [templates, setTemplates] = useState([]);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [elements, setElements] = useState([]);
  const [logo, setLogo] = useState('');

  useEffect(() => {
    const fetchTemplates = async () => {
      try {
        const res = await axios.get(`${API_URL}/templates`);
        if (res.data && res.data.data) {
          setTemplates(res.data.data);
        }
      } catch (err) {
        console.error('Fehler beim Laden der Templates', err);
      }
    };

    fetchTemplates();
  }, []);

  const handleAddElement = () => {
    setElements([...elements, defaultElement()]);
  };

  const handleDrag = (index, e, data) => {
    const updated = [...elements];
    updated[index].x = data.x;
    updated[index].y = data.y;
    setElements(updated);
  };

  const handleChange = (index, field, value) => {
    const updated = [...elements];
    updated[index][field] = value;
    setElements(updated);
  };

  const handleLogoUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setLogo(reader.result);
    reader.readAsDataURL(file);
  };

  const handleSave = async () => {
    const layout = {
      logo,
      elements
    };

    try {
      await axios.post(`${API_URL}/templates`, {
        name: 'Template ' + new Date().toISOString(),
        layout_json: JSON.stringify(layout)
      });
      alert('Template gespeichert');
    } catch (err) {
      console.error('Fehler beim Speichern', err);
    }
  };

  return (
    <Box>
      <Typography variant="h4" gutterBottom>Einstellungen</Typography>
      <Box sx={{ mb: 2 }}>
        <FormControl sx={{ mr: 2, minWidth: 200 }} size="small">
          <InputLabel id="template-select-label">Vorlage</InputLabel>
          <Select
            labelId="template-select-label"
            value={selectedTemplate || ''}
            label="Vorlage"
            onChange={(e) => setSelectedTemplate(e.target.value)}
          >
            {templates.map((tpl) => (
              <MenuItem key={tpl.template_id} value={tpl.template_id}>{tpl.name}</MenuItem>
            ))}
          </Select>
        </FormControl>
        <Button variant="contained" onClick={handleAddElement}>Element hinzufügen</Button>
        <Button variant="outlined" component="label" sx={{ ml: 2 }}>
          Logo hochladen
          <input type="file" accept="image/jpeg" hidden onChange={handleLogoUpload} />
        </Button>
        <Button variant="contained" color="primary" sx={{ ml: 2 }} onClick={handleSave}>Speichern</Button>
      </Box>
      <Box sx={{ position: 'relative', width: '100%', height: 500, border: '1px solid #ccc' }}>
        {logo && <img src={logo} alt="Logo" style={{ position: 'absolute', top: 0, left: 0, height: 80 }} />}
        {elements.map((el, index) => (
          <Draggable key={el.id} position={{ x: el.x, y: el.y }} onDrag={(e, data) => handleDrag(index, e, data)}>
            <div style={{ position: 'absolute', cursor: 'move', fontFamily: el.fontFamily, fontSize: el.fontSize, color: el.color }}>
              <TextField
                value={el.text}
                onChange={(e) => handleChange(index, 'text', e.target.value)}
                size="small"
                sx={{ backgroundColor: 'white' }}
              />
              <TextField
                label="Schriftgröße"
                type="number"
                size="small"
                value={el.fontSize}
                onChange={(e) => handleChange(index, 'fontSize', parseInt(e.target.value, 10))}
                sx={{ width: 80, ml: 1 }}
              />
              <TextField
                label="Farbe"
                type="color"
                size="small"
                value={el.color}
                onChange={(e) => handleChange(index, 'color', e.target.value)}
                sx={{ width: 60, ml: 1 }}
              />
            </div>
          </Draggable>
        ))}
      </Box>
    </Box>
  );
};

export default LayoutEditor;
