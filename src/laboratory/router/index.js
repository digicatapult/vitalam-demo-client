import React from 'react'
import { Route, Routes, Navigate } from 'react-router-dom'

import Request from '../components/Request'
import Tested from '../components/Tested'

const Routing = () => {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/app/requests" />} />
      <Route path="/app/requests" element={<Request />} />
      <Route path="/app/requests/:testId" element={<Request />} />
      <Route path="/app/tested" element={<Tested />} />
      <Route path="/app/tested/:testId" element={<Tested />} />
    </Routes>
  )
}

export default Routing
