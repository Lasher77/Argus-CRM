import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import MainLayout from './components/layout/MainLayout';
import Dashboard from './pages/Dashboard';

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

function App() {
  return (
    <Routes>
      <Route path="/" element={<MainLayout />}>
        {/* Dashboard */}
        <Route index element={<Dashboard />} />
        
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
        
        {/* Fallback for unknown routes */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}

export default App;
