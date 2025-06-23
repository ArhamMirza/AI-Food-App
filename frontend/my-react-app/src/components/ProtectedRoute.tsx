// components/ProtectedRoute.tsx
import React from 'react'
import { Navigate } from 'react-router-dom'
import { useSelector } from 'react-redux'
import type{ RootState } from '../redux/store'

const ProtectedRoute = ({ children }: { children: React.JSX.Element }) => {
  const user = useSelector((state: RootState) => state.user.user)

  if (!user || !user?.is_email_verified) {
    return <Navigate to="/auth" replace />
  }

  return children
}

export default ProtectedRoute
