import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import MainLayout from './components/layout/MainLayout';
import RequireAuth from './components/auth/RequireAuth';
import Dashboard from './pages/Dashboard';
import ScheduleBoard from './pages/schedule/ScheduleBoard';
import ServiceOrderList from './pages/orders/ServiceOrderList';
import ServiceOrderDetail from './pages/orders/ServiceOrderDetail';
import ServiceOrderForm from './pages/orders/ServiceOrderForm';
import FieldCompanion from './pages/field/FieldCompanion';
import MaterialOverview from './pages/materials/MaterialOverview';
import CustomerWorkspace from './pages/customers/CustomerWorkspace';
import InvoiceList from './pages/invoices/InvoiceList';
import OperationsReports from './pages/reports/OperationsReports';

// Account components
import AccountList from './pages/accounts/AccountList';
import AccountDetail from './pages/accounts/AccountDetail';
import AccountForm from './pages/accounts/AccountForm';

// Contact components
import ContactList from './pages/contacts/ContactList';
import ContactDetail from './pages/contacts/ContactDetail';
import ContactForm from './pages/contacts/ContactForm';

// Property components
import PropertyList from './pages/properties/PropertyList';
import PropertyDetail from './pages/properties/PropertyDetail';
import PropertyForm from './pages/properties/PropertyForm';

// Quote components
import QuoteList from './pages/quotes/QuoteList';
import QuoteDetail from './pages/quotes/QuoteDetail';
import QuoteForm from './pages/quotes/QuoteForm';
import LayoutEditor from './pages/settings/LayoutEditor';
import Login from './pages/Login';

function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route
        path="/"
        element={(
          <RequireAuth>
            <MainLayout />
          </RequireAuth>
        )}
      >
        {/* Dashboard */}
        <Route index element={<Dashboard />} />

        {/* Schedule */}
        <Route path="schedule" element={<ScheduleBoard />} />

        {/* Service Orders */}
        <Route path="orders" element={<ServiceOrderList />} />
        <Route path="orders/new" element={<ServiceOrderForm />} />
        <Route path="orders/:id" element={<ServiceOrderDetail />} />
        <Route path="orders/:id/edit" element={<ServiceOrderForm />} />

        {/* Field Companion */}
        <Route path="field" element={<FieldCompanion />} />

        {/* Materials */}
        <Route path="materials" element={<MaterialOverview />} />

        {/* Customers workspace */}
        <Route path="customers" element={<CustomerWorkspace />} />

        {/* Accounts */}
        <Route path="accounts" element={<AccountList />} />
        <Route path="accounts/:id" element={<AccountDetail />} />
        <Route path="accounts/new" element={<AccountForm />} />
        <Route path="accounts/edit/:id" element={<AccountForm />} />
        
        {/* Contacts */}
        <Route path="contacts" element={<ContactList />} />
        <Route path="contacts/:id" element={<ContactDetail />} />
        <Route path="contacts/new" element={<ContactForm />} />
        <Route path="contacts/edit/:id" element={<ContactForm />} />
        
        {/* Properties */}
        <Route path="properties" element={<PropertyList />} />
        <Route path="properties/:id" element={<PropertyDetail />} />
        <Route path="properties/new" element={<PropertyForm />} />
        <Route path="properties/edit/:id" element={<PropertyForm />} />
        
        {/* Quotes */}
        <Route path="quotes" element={<QuoteList />} />
        <Route path="quotes/:id" element={<QuoteDetail />} />
        <Route path="quotes/new" element={<QuoteForm />} />
        <Route path="quotes/edit/:id" element={<QuoteForm />} />

        {/* Invoices */}
        <Route path="invoices" element={<InvoiceList />} />

        {/* Settings */}
        <Route path="settings" element={<LayoutEditor />} />

        {/* Reports */}
        <Route path="reports" element={<OperationsReports />} />

        {/* Fallback for unknown routes */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}

export default App;
