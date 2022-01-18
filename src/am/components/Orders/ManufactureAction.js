import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  CircularProgress,
  Container,
  Grid,
  Typography,
} from '@material-ui/core'
import Button from '@material-ui/core/Button'
import makeStyles from '@material-ui/core/styles/makeStyles'
import { useDispatch, useSelector } from 'react-redux'

import { updateOrder } from '../../../features/ordersSlice'
import { useApi, identities } from '../../../utils'
import Select from '@material-ui/core/Select'
import MenuItem from '@material-ui/core/MenuItem'
import Box from '@material-ui/core/Box'
import { upsertPowder } from '../../../features/powdersSlice'

const useStyles = makeStyles({
  buttonWrapper: {
    padding: '16px 0px',
    width: '100%',
    display: 'grid',
    justifyContent: 'right',
  },
  manufactureButton: {
    width: 250,
    height: 42,
    marginTop: 16,
  },
  selectPowderWrapper: {
    padding: '24px 0px 16px 0px',
  },
  selectInputLabel: {
    fontWeight: 600,
  },
  selectInput: {
    marginTop: 16,
    padding: '0px 14px',
    border: 'solid 1px #ccc',
    width: '100%',
  },
})

const ManufactureOrderAction = ({ order }) => {
  const classes = useStyles()
  const powders = useSelector((state) => state.powders)
  const [isAccepting, setIsAccepting] = useState(false)
  const [selectedPowder, setSelectedPowder] = useState('')
  const dispatch = useDispatch()
  const navigate = useNavigate()

  const api = useApi()

  const createFormData = (inputs, outputs) => {
    const formData = new FormData()

    formData.set(
      'request',
      JSON.stringify({
        inputs,
        outputs: outputs.map(({ owner }, outputIndex) => ({
          owner,
          metadataFile: `file_${outputIndex}`,
        })),
      })
    )
    outputs.forEach(({ file }, outputIndex) => {
      formData.set(`file_${outputIndex}`, file, `file_${outputIndex}`)
    })

    return formData
  }

  const onButtonChange = async () => {
    setIsAccepting(true)

    const powder = powders.find((item) => item.id === selectedPowder)
    const outputData = [
      {
        type: 'ManufacturedOrder',
        powderId: selectedPowder,
        orderReference: order.orderReference,
        owner: identities.am,
      },
      {
        type: 'Powder',
        powderReference: powder.powderReference,
        material: powder.material,
        alloy: powder.alloy,
        quantityKg: powder.quantityKg - 50,
        particleSizeUm: powder.particleSizeUm,
        location: powder.location,
        owner: identities.am,
      },
    ]

    const outputs = outputData.map(({ owner, ...obj }) => ({
      owner,
      file: new Blob([JSON.stringify(obj)]),
    }))
    const formData = createFormData([order.latestId, powder.latestId], outputs)

    setTimeout(async () => {
      const response = await api.runProcess(formData)

      const orderToken = {
        id: order.id,
        latestId: response[0],
        ...outputData[0],
      }

      const powderToken = {
        id: powder.id,
        latestId: response[1],
        ...outputData[1],
      }

      dispatch(updateOrder(orderToken))
      dispatch(upsertPowder(powderToken))
    }, 10000)

    const manufacturingToken = { ...order, type: 'ManufacturingOrder' }
    dispatch(updateOrder(manufacturingToken))

    navigate('/app/orders')
  }

  const onPowderChange = async (event) => {
    setSelectedPowder(event.target.value)
  }

  return (
    <Box className={classes.selectPowderWrapper}>
      {order.type === 'AcceptedOrder' ? (
        <Grid container direction="column" className={classes.row}>
          <Grid item>
            <Typography variant="body2" className={classes.selectInputLabel}>
              Select a powder to assign to this order:
            </Typography>
          </Grid>
          <Grid item>
            <Select
              name="powder"
              className={classes.selectInput}
              onChange={onPowderChange}
            >
              {powders.map((item) => (
                <MenuItem key={item.id} value={item.id}>
                  {item.powderReference} ({item.material})
                </MenuItem>
              ))}
            </Select>
          </Grid>
        </Grid>
      ) : null}
      <Container className={classes.buttonWrapper}>
        <Button
          size="medium"
          variant="contained"
          color="primary"
          className={classes.manufactureButton}
          disabled={selectedPowder ? false : true}
          onClick={onButtonChange}
        >
          {isAccepting ? (
            <CircularProgress color="secondary" size="30px" />
          ) : (
            'Manufacture Part'
          )}
        </Button>
      </Container>
    </Box>
  )
}

export default ManufactureOrderAction
