const Employee = require('../models/employee');
const { ApiError } = require('../utils/apiError');

exports.getEmployees = (req, res, next) => {
  try {
    const employees = Employee.getAll();
    res.json({ success: true, data: employees });
  } catch (error) {
    next(ApiError.from(error, {
      message: 'Fehler beim Abrufen der Mitarbeitenden',
      code: 'EMPLOYEE_LIST_FAILED'
    }));
  }
};

exports.getEmployeeById = (req, res, next) => {
  try {
    const employee = Employee.getById(req.params.id);
    if (!employee) {
      return next(new ApiError(404, 'Mitarbeiter nicht gefunden', { code: 'EMPLOYEE_NOT_FOUND' }));
    }

    res.json({ success: true, data: employee });
  } catch (error) {
    next(ApiError.from(error, {
      message: 'Fehler beim Abrufen des Mitarbeitenden',
      code: 'EMPLOYEE_DETAIL_FAILED'
    }));
  }
};

exports.createEmployee = (req, res, next) => {
  try {
    const employee = Employee.create(req.body);
    res.status(201).json({ success: true, data: employee });
  } catch (error) {
    next(ApiError.from(error, {
      message: 'Fehler beim Anlegen des Mitarbeitenden',
      code: 'EMPLOYEE_CREATE_FAILED'
    }));
  }
};

exports.updateEmployee = (req, res, next) => {
  try {
    const employee = Employee.update(req.params.id, req.body);
    if (!employee) {
      return next(new ApiError(404, 'Mitarbeiter nicht gefunden', { code: 'EMPLOYEE_NOT_FOUND' }));
    }

    res.json({ success: true, data: employee });
  } catch (error) {
    next(ApiError.from(error, {
      message: 'Fehler beim Aktualisieren des Mitarbeitenden',
      code: 'EMPLOYEE_UPDATE_FAILED'
    }));
  }
};

exports.deleteEmployee = (req, res, next) => {
  try {
    const deleted = Employee.delete(req.params.id);
    if (!deleted) {
      return next(new ApiError(404, 'Mitarbeiter nicht gefunden', { code: 'EMPLOYEE_NOT_FOUND' }));
    }

    res.json({ success: true });
  } catch (error) {
    next(ApiError.from(error, {
      message: 'Fehler beim Löschen des Mitarbeitenden',
      code: 'EMPLOYEE_DELETE_FAILED'
    }));
  }
};
