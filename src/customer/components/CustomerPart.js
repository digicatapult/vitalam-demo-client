import React, { useState } from 'react'
import {
  Paper,
  CardContent,
  CardMedia,
  Grid,
  Typography,
  CircularProgress,
  Box,
  Container,
} from '@material-ui/core'
import Button from '@material-ui/core/Button'
import makeStyles from '@material-ui/core/styles/makeStyles'
import BackButton from './BackButton'
import { useNavigate, useParams } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'

import { addOrder } from '../../features/ordersSlice'
import { useApi, identities } from '../../utils'

const useStyles = makeStyles({
  card: {
    padding: '30px',
  },
  content: {
    position: 'relative',
    borderRight: '1px lightgrey solid',
    margin: '0px 30px 0px 30px',
  },
  backButton: {
    textDecoration: 'none',
  },
  orderButton: {
    width: 250,
    height: 42,
  },
  imagePlaceholder: {
    backgroundColor: '#ccc',
    height: 322,
  },
  inline: {
    display: 'inline',
  },
})

const DetailRow = ({ title, value }) => {
  const classes = useStyles()
  return (
    <Box>
      <Typography className={classes.inline} variant="body1">
        {title}:
      </Typography>
      &nbsp;
      <Typography
        className={classes.inline}
        variant="body2"
        color="textSecondary"
      >
        {value}
      </Typography>
    </Box>
  )
}

const CustomerPart = () => {
  const { partId: id } = useParams()
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const [isOrdering, setIsOrdering] = useState(false)

  const selectedCustomerPart = useSelector((state) =>
    state.customerParts.find(({ partId }) => partId === id)
  )
  const api = useApi()

  const { image, name, material, alloy } = selectedCustomerPart
  const classes = useStyles()

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
    setIsOrdering(true)

    const fileData = {
      type: 'SubmittedOrder',
      orderReference: `#${Math.floor(Math.random() * 100000000)}`,
      orderDetails: selectedCustomerPart,
      customerDetails: {},
    }

    const file = new Blob([JSON.stringify(fileData)])
    const formData = createFormData([], file)
    const response = await api.runProcess(formData)
    const token = { id: response[0], latestId: response[0], ...fileData }

    dispatch(addOrder(token))

    navigate('/app/my-orders')
  }

  return (
    // <Grid container direction="column" spacing={2}>
    <Container>
      <BackButton
        buttonClass={classes.backButton}
        backToLocation="/app/customer-parts"
        value="< Back"
      />

      <Paper elevation={0} className={classes.card}>
        <Grid container>
          <Grid item xs={3}>
            <CardMedia
              component="img"
              alt={name}
              width="450"
              height="322"
              image={image}
              title={name}
            />
          </Grid>
          <Grid
            container
            item
            xs={4}
            direction="column"
            justify="space-between"
            className={classes.content}
          >
            <CardContent>
              <Typography gutterBottom variant="h6">
                {name}
              </Typography>

              <DetailRow title="Part name" value={name}></DetailRow>
              <DetailRow title="Part Number" value={id}></DetailRow>
              <DetailRow title="Material" value={material}></DetailRow>
              <DetailRow title="Alloy" value={alloy}></DetailRow>
            </CardContent>
          </Grid>
          <Grid
            container
            item
            xs={3}
            direction="column"
            justify="space-between"
          >
            <Typography variant="h6">£1,200</Typography>
            <Box>
              <Typography variant="h6">Shipping Address:</Typography>
              <Typography color="textSecondary">Digital Catapult</Typography>
              <Typography color="textSecondary">101 Euston Road</Typography>
              <Typography color="textSecondary">London</Typography>
              <Typography color="textSecondary">NW1 2RA</Typography>
            </Box>
            <Button
              size="medium"
              variant="contained"
              color="primary"
              className={classes.orderButton}
              onClick={isOrdering ? null : onChange}
            >
              {isOrdering ? (
                <CircularProgress color="secondary" size="30px" />
              ) : (
                'Order'
              )}
            </Button>
          </Grid>
        </Grid>
      </Paper>
    </Container>
  )
}

export default CustomerPart
