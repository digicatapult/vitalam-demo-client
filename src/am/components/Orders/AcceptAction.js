import React, { useState } from 'react'
import { CircularProgress, Container } from '@material-ui/core'
import Button from '@material-ui/core/Button'
import makeStyles from '@material-ui/core/styles/makeStyles'
import { useDispatch } from 'react-redux'

import { updateOrder } from '../../../features/ordersSlice'
import { identities, useApi } from '../../../utils'

const useStyles = makeStyles({
  buttonWrapper: {
    padding: '16px 32px',
    width: '100%',
    display: 'grid',
    justifyContent: 'right',
  },
  acceptButton: {
    width: 250,
    height: 42,
  },
})

const AcceptOrderAction = ({ order }) => {
  const classes = useStyles()
  const [isAccepting, setIsAccepting] = useState(false)
  const dispatch = useDispatch()
  const api = useApi()

  const createFormData = (inputs, file) => {
    const formData = new FormData()
    const outputs = [
      {
        owner: identities.am,
        metadataFile: 'file',
      },
    ]

    formData.set(
      'request',
      JSON.stringify({
        inputs,
        outputs,
      })
    )

    formData.set('file', file, 'file')

    return formData
  }

  const onChange = async () => {
    setIsAccepting(true)

    const fileData = {
      type: 'AcceptedOrder',
      orderReference: order.orderReference,
    }

    const file = new Blob([JSON.stringify(fileData)])
    const formData = createFormData([order.latestId], file)
    const response = await api.runProcess(formData)
    const token = { id: order.latestId, latestId: response[0], ...fileData }

    dispatch(updateOrder(token))
  }

  return (
    <Container className={classes.buttonWrapper}>
      <Button
        size="medium"
        variant="contained"
        color="primary"
        className={classes.acceptButton}
        onClick={isAccepting ? null : onChange}
      >
        {isAccepting ? (
          <CircularProgress color="secondary" size="30px" />
        ) : (
          'Accept'
        )}
      </Button>
    </Container>
  )
}

export default AcceptOrderAction
