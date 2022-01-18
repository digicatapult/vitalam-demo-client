import React from 'react'
import { Route, Routes, Navigate } from 'react-router-dom'

import CustomerPart from '../components/CustomerPart'
import CustomerParts from '../components/CustomerParts'
import MyOrders from '../components/MyOrders'

const Routing = () => {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/app/customer-parts" />} />
      <Route path="/app/my-orders" element={<MyOrders />} />
      <Route path="/app/customer-part/:partId" element={<CustomerPart />} />
      <Route path="/app/customer-parts" element={<CustomerParts />} />
    </Routes>
  )
}

export default Routing
