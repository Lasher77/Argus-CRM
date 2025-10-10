const Employee = require('../models/employee');

const handleError = (res, error, message = 'Interner Serverfehler') => {
  console.error(message, error);
  res.status(500).json({ success: false, message });
};

exports.getEmployees = (req, res) => {
  try {
    const employees = Employee.getAll();
    res.json({ success: true, data: employees });
  } catch (error) {
    handleError(res, error, 'Fehler beim Abrufen der Mitarbeitenden');
  }
};

exports.getEmployeeById = (req, res) => {
  try {
    const employee = Employee.getById(Number(req.params.id));
    if (!employee) {
      return res.status(404).json({ success: false, message: 'Mitarbeiter nicht gefunden' });
    }

    res.json({ success: true, data: employee });
  } catch (error) {
    handleError(res, error, 'Fehler beim Abrufen des Mitarbeitenden');
  }
};

exports.createEmployee = (req, res) => {
  try {
    const employee = Employee.create(req.body);
    res.status(201).json({ success: true, data: employee });
  } catch (error) {
    handleError(res, error, 'Fehler beim Anlegen des Mitarbeitenden');
  }
};

exports.updateEmployee = (req, res) => {
  try {
    const employee = Employee.update(Number(req.params.id), req.body);
    if (!employee) {
      return res.status(404).json({ success: false, message: 'Mitarbeiter nicht gefunden' });
    }

    res.json({ success: true, data: employee });
  } catch (error) {
    handleError(res, error, 'Fehler beim Aktualisieren des Mitarbeitenden');
  }
};

exports.deleteEmployee = (req, res) => {
  try {
    const deleted = Employee.delete(Number(req.params.id));
    if (!deleted) {
      return res.status(404).json({ success: false, message: 'Mitarbeiter nicht gefunden' });
    }

    res.json({ success: true });
  } catch (error) {
    handleError(res, error, 'Fehler beim Löschen des Mitarbeitenden');
  }
};
