import React from 'react'
import { Route, Routes, Navigate } from 'react-router-dom'

import Orders from '../components/Orders'
import { Powders, PowdersDetails } from '../components/Powders'
import Tests from '../components/Tests'

const Routing = () => {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/app/orders" />} />
      <Route path="/app/orders" element={<Orders />} />
      <Route path="/app/orders/:orderId" element={<Orders />} />
      <Route path="/app/powders" element={<Powders />} />
      <Route path="/app/powders/:powderId" element={<PowdersDetails />} />
      <Route path="/app/tests" element={<Tests />} />
      <Route path="/app/tests/:testId" element={<Tests />} />
    </Routes>
  )
}

export default Routing
