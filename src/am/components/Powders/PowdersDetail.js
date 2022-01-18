import React, { useEffect, useState } from 'react'
import {
  Box,
  Paper,
  Grid,
  Typography,
  FormControl,
  InputLabel,
  Select,
  Button,
  CircularProgress,
} from '@material-ui/core'
import { useSelector, useDispatch } from 'react-redux'
import makeStyles from '@material-ui/core/styles/makeStyles'

import { useParams, useNavigate } from 'react-router-dom'

import BackButton from './BackButton'
import PowderHeader from './Header'
import PowderStatus from './Status'
import TestDetails from './PowdersDetailsTests'
import Header from '../Header'

import { markPowderRead } from '../../../features/readPowdersSlice'
import { identities, useApi } from '../../../utils'
import { upsertPowder } from '../../../features/powdersSlice'
import { addLabTest } from '../../../features/labTestsSlice'

const useStyles = makeStyles({
  header: {
    marginBottom: '100px',
  },
  backButton: {
    textDecoration: 'none',
    marginBottom: '48px',
  },
  detailContainer: {
    padding: '16px 0px',
  },
  detailHeaderContainer: {
    borderBottom: '1px lightgrey solid',
  },
  detailHeaderRow: {
    paddingBottom: '16px',
    paddingLeft: '32px',
  },
  testDetailHack: {
    width: '1426px',
    height: '990px',
  },
  formControls: {
    marginTop: '16px',
    width: '100%',
    display: 'grid',
    gridTemplateColumns: 'auto auto',
  },
  formSelect: {
    width: '615px',
  },
  actionsContainer: {
    margin: '32px',
  },
  testButton: {
    marginLeft: 'auto',
    width: 250,
    height: 56,
  },
})

const testList = [
  ['ASTM B855', 'Flow rate using the hall flowmeter funnel'],
  ['ASTM E60', 'Chemical composition analysis by spectrophotometry'],
  ['ASTM E8', 'Test methods for tension testing of metallic materials'],
  ['ASTM B822', 'Particle size distribution by light scattering'],
  ['ASTM D8090', 'Particle size analysis by image analysis methods'],
  ['ASTM B795', 'Determining the percentage of contamination of powder'],
  ['ASTM B417', 'Density of non-free-flowing powders using the carney funnel'],
  ['ASTM E1409', 'Determination of oxygen and nitrogen by Inert gas fusion'],
]

const PowdersDetail = () => {
  const { powderId: idStr } = useParams()
  const id = parseInt(idStr)
  const navigate = useNavigate()

  const dispatch = useDispatch()
  const classes = useStyles()
  const { powder, labTest } = useSelector((state) => ({
    powder: state.powders.find(({ id: powderId }) => id === powderId) || {},
    labTest: state.labTests.find(({ powderId }) => id === powderId) || null,
  }))
  const api = useApi()

  useEffect(() => {
    dispatch(markPowderRead(id))
  }, [dispatch, id])

  const [isFetching, setIsFetching] = useState(false)
  const [labId, setLabId] = useState(null)

  const {
    powderReference,
    material,
    alloy,
    quantityKg,
    particleSizeUm,
    location,
  } = powder

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

  const onChange = async () => {
    setIsFetching(true)

    const outputData = [
      {
        type: 'PowderTestRequest',
        powderId: powder.id,
        powderReference,
        requiredTests: testList,
        owner: labId,
      },
      {
        type: 'Powder',
        powderReference,
        material,
        alloy,
        quantityKg: quantityKg - 0.05,
        particleSizeUm,
        location,
        owner: identities.am,
      },
    ]

    const outputs = outputData.map(({ owner, ...obj }) => ({
      owner,
      file: new Blob([JSON.stringify(obj)]),
    }))
    const formData = createFormData([powder.latestId], outputs)
    const response = await api.runProcess(formData)

    const powderToken = {
      id: powder.id,
      latestId: response[1],
      ...outputData[1],
    }
    const labTestToken = {
      id: response[0],
      latestId: response[0],
      ...outputData[0],
    }

    dispatch(addLabTest(labTestToken))
    dispatch(upsertPowder(powderToken))

    navigate('/app/powders')
  }

  return (
    <Box>
      <Header title="Powder Inventory" />

      <Box>
        <BackButton
          buttonClass={classes.backButton}
          backToLocation="/app/powders"
          value="< Back"
        />

        <Paper elevation={0} className={classes.detailContainer}>
          <Box className={classes.detailHeaderContainer}>
            <PowderHeader className={classes.detailHeaderRow} />
            <Grid className={classes.detailHeaderRow} container direction="row">
              <Grid className={classes.rowItem} item xs>
                <Typography>{powderReference}</Typography>
              </Grid>
              <Grid className={classes.rowItem} item xs>
                <Typography>{material}</Typography>
              </Grid>
              <Grid className={classes.rowItem} item xs>
                <Typography>{alloy}</Typography>
              </Grid>
              <Grid className={classes.rowItem} item xs>
                <Typography>{quantityKg + 'kg'}</Typography>
              </Grid>
              <Grid className={classes.rowItem} item xs>
                <Typography>{particleSizeUm + 'µm'}</Typography>
              </Grid>
              <Grid className={classes.rowItem} item xs>
                <Typography>{location}</Typography>
              </Grid>
              <Grid className={classes.rowItem} item xs>
                <PowderStatus labTest={labTest} />
              </Grid>
            </Grid>
          </Box>
          <TestDetails powder={powder} tests={testList} />
          {labTest === null ? (
            <Box className={classes.actionsContainer}>
              <Typography>
                Select a company to send the samples for testing:
              </Typography>
              <Box className={classes.formControls}>
                <FormControl variant="outlined" className={classes.formSelect}>
                  <InputLabel htmlFor="testing-company-name-select">
                    Testing company name
                  </InputLabel>
                  <Select
                    native
                    onChange={(event) => {
                      setLabId(event.target.value)
                    }}
                    inputProps={{
                      name: 'testing-company-name',
                      id: 'testing-company-name-select',
                    }}
                  >
                    <option aria-label="None" value="" />
                    <option value={identities.lab}>TruFORM</option>
                    <option value={identities.amlab}>Aero Labs</option>
                  </Select>
                </FormControl>
                <Button
                  size="medium"
                  variant="contained"
                  color="primary"
                  className={classes.testButton}
                  disabled={!labId}
                  onClick={isFetching ? null : onChange}
                >
                  {isFetching ? (
                    <CircularProgress color="secondary" size="30px" />
                  ) : (
                    'SEND FOR TESTING'
                  )}
                </Button>
              </Box>
            </Box>
          ) : null}
        </Paper>
      </Box>
    </Box>
  )
}

export default PowdersDetail
