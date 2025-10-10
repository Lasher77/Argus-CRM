const ServiceOrder = require('../models/serviceOrder');

const handleError = (res, error, message = 'Interner Serverfehler') => {
  console.error(message, error);
  res.status(500).json({ success: false, message });
};

const parseStatusFilter = (statusParam) => {
  if (!statusParam) {
    return undefined;
  }

  if (Array.isArray(statusParam)) {
    return statusParam;
  }

  if (typeof statusParam === 'string' && statusParam.includes(',')) {
    return statusParam.split(',').map((value) => value.trim()).filter(Boolean);
  }

  return statusParam;
};

exports.getServiceOrders = (req, res) => {
  try {
    const { from, to, employeeId, onlyActive } = req.query;
    const status = parseStatusFilter(req.query.status);
    const filters = {
      from,
      to,
      employeeId,
      status,
      onlyActive: onlyActive === 'true'
    };

    const orders = ServiceOrder.getAll(filters);
    res.json({ success: true, data: orders });
  } catch (error) {
    handleError(res, error, 'Fehler beim Abrufen der Aufträge');
  }
};

exports.getServiceOrderById = (req, res) => {
  try {
    const order = ServiceOrder.getById(Number(req.params.id));
    if (!order) {
      return res.status(404).json({ success: false, message: 'Auftrag nicht gefunden' });
    }

    res.json({ success: true, data: order });
  } catch (error) {
    handleError(res, error, 'Fehler beim Abrufen des Auftrags');
  }
};

exports.createServiceOrder = (req, res) => {
  try {
    const order = ServiceOrder.create(req.body);
    res.status(201).json({ success: true, data: order });
  } catch (error) {
    handleError(res, error, 'Fehler beim Anlegen des Auftrags');
  }
};

exports.updateServiceOrder = (req, res) => {
  try {
    const order = ServiceOrder.update(Number(req.params.id), req.body);
    if (!order) {
      return res.status(404).json({ success: false, message: 'Auftrag nicht gefunden' });
    }

    res.json({ success: true, data: order });
  } catch (error) {
    handleError(res, error, 'Fehler beim Aktualisieren des Auftrags');
  }
};

exports.updateServiceOrderStatus = (req, res) => {
  try {
    const { status } = req.body;
    if (!status) {
      return res.status(400).json({ success: false, message: 'Status ist erforderlich' });
    }

    const order = ServiceOrder.updateStatus(Number(req.params.id), status);
    if (!order) {
      return res.status(404).json({ success: false, message: 'Auftrag nicht gefunden' });
    }

    res.json({ success: true, data: order });
  } catch (error) {
    handleError(res, error, 'Fehler beim Aktualisieren des Auftragsstatus');
  }
};

exports.deleteServiceOrder = (req, res) => {
  try {
    const deleted = ServiceOrder.delete(Number(req.params.id));
    if (!deleted) {
      return res.status(404).json({ success: false, message: 'Auftrag nicht gefunden' });
    }

    res.json({ success: true });
  } catch (error) {
    handleError(res, error, 'Fehler beim Löschen des Auftrags');
  }
};

exports.addTimeEntry = (req, res) => {
  try {
    const order = ServiceOrder.addTimeEntry(Number(req.params.id), req.body);
    res.status(201).json({ success: true, data: order });
  } catch (error) {
    handleError(res, error, 'Fehler beim Hinzufügen der Zeiterfassung');
  }
};

exports.updateTimeEntry = (req, res) => {
  try {
    const order = ServiceOrder.updateTimeEntry(Number(req.params.entryId), req.body);
    if (!order) {
      return res.status(404).json({ success: false, message: 'Zeiterfassung nicht gefunden' });
    }

    res.json({ success: true, data: order });
  } catch (error) {
    handleError(res, error, 'Fehler beim Aktualisieren der Zeiterfassung');
  }
};

exports.deleteTimeEntry = (req, res) => {
  try {
    const order = ServiceOrder.deleteTimeEntry(Number(req.params.entryId));
    if (!order) {
      return res.status(404).json({ success: false, message: 'Zeiterfassung nicht gefunden' });
    }

    res.json({ success: true, data: order });
  } catch (error) {
    handleError(res, error, 'Fehler beim Löschen der Zeiterfassung');
  }
};

exports.addMaterialUsage = (req, res) => {
  try {
    const order = ServiceOrder.addMaterialUsage(Number(req.params.id), req.body);
    res.status(201).json({ success: true, data: order });
  } catch (error) {
    handleError(res, error, 'Fehler beim Erfassen des Materialverbrauchs');
  }
};

exports.updateMaterialUsage = (req, res) => {
  try {
    const order = ServiceOrder.updateMaterialUsage(Number(req.params.usageId), req.body);
    if (!order) {
      return res.status(404).json({ success: false, message: 'Materialverbrauch nicht gefunden' });
    }

    res.json({ success: true, data: order });
  } catch (error) {
    handleError(res, error, 'Fehler beim Aktualisieren des Materialverbrauchs');
  }
};

exports.deleteMaterialUsage = (req, res) => {
  try {
    const order = ServiceOrder.deleteMaterialUsage(Number(req.params.usageId));
    if (!order) {
      return res.status(404).json({ success: false, message: 'Materialverbrauch nicht gefunden' });
    }

    res.json({ success: true, data: order });
  } catch (error) {
    handleError(res, error, 'Fehler beim Löschen des Materialverbrauchs');
  }
};

exports.addPhoto = (req, res) => {
  try {
    const order = ServiceOrder.addPhoto(Number(req.params.id), req.body);
    res.status(201).json({ success: true, data: order });
  } catch (error) {
    handleError(res, error, 'Fehler beim Speichern des Fotos');
  }
};

exports.deletePhoto = (req, res) => {
  try {
    const order = ServiceOrder.deletePhoto(Number(req.params.photoId));
    if (!order) {
      return res.status(404).json({ success: false, message: 'Foto nicht gefunden' });
    }

    res.json({ success: true, data: order });
  } catch (error) {
    handleError(res, error, 'Fehler beim Löschen des Fotos');
  }
};

exports.setSignature = (req, res) => {
  try {
    if (!req.body.signature_data) {
      return res.status(400).json({ success: false, message: 'Signaturdaten sind erforderlich' });
    }

    const order = ServiceOrder.setSignature(Number(req.params.id), req.body);
    res.json({ success: true, data: order });
  } catch (error) {
    handleError(res, error, 'Fehler beim Speichern der Unterschrift');
  }
};

exports.clearSignature = (req, res) => {
  try {
    const order = ServiceOrder.clearSignature(Number(req.params.id));
    res.json({ success: true, data: order });
  } catch (error) {
    handleError(res, error, 'Fehler beim Entfernen der Unterschrift');
  }
};
