import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { ThemeProvider } from './contexts/ThemeContext'
import FlowBuilder from './pages/FlowBuilder'
import FlowList from './pages/FlowList'
import Login from './pages/Login'
import ProtectedRoute from './components/ProtectedRoute'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <ThemeProvider>
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <FlowList />
            </ProtectedRoute>
          }
        />
        <Route
          path="/flow/:id"
          element={
            <ProtectedRoute>
              <FlowBuilder />
            </ProtectedRoute>
          }
        />
        <Route
          path="/flow/new"
          element={
            <ProtectedRoute>
              <FlowBuilder />
            </ProtectedRoute>
          }
        />
      </Routes>
    </Router>
  </ThemeProvider>,
)
