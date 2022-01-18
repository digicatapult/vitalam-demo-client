import React, { useState } from 'react'
import { useDispatch } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import {
  Button,
  CircularProgress,
  Grid,
  Paper,
  TextareaAutosize,
  Typography,
} from '@material-ui/core'
import makeStyles from '@material-ui/core/styles/makeStyles'
import { useDropzone } from 'react-dropzone'

import Attachment from './Attachment'
import images from '../../images'
import LabTestRow from './LabTestRow'
import { identities, useApi } from '../../utils'
import { updateLabTest } from '../../features/labTestsSlice'

const useStyles = makeStyles({
  root: { marginTop: '40px', marginBottom: '40px', padding: '8px' },
  border: { border: '1px lightgrey solid', borderLeft: 0, borderRight: 0 },
  button: { width: '290px', height: '55px', margin: '20px' },
  heading: { padding: '24px 30px 8px 30px' },
  textarea: { borderColor: '#c4c4c4', margin: '10px 0', width: '95%' },
  block: { display: 'block' },
  flex: { display: 'flex' },
  dnd: { cursor: 'pointer' },
  dndText: { marginBottom: '50px' },
  dndLink: { textDecoration: 'underline', display: 'inline' },
  img: { margin: '50px auto 30px auto' },
  dndbg: {
    padding: '30px',
    cursor: 'pointer',
    '& div': { background: '#fbfbfb' },
  },
})

const u8Array2base64URI = (obj) => {
  const type = obj.fileType
  const ext = obj.fileExt
  const u8 = obj.fileContent

  const CHUNK_SZ = 0x8000
  const parsedChunks = []
  for (let i = 0; i < u8.length; i += CHUNK_SZ) {
    parsedChunks.push(
      String.fromCharCode.apply(null, u8.subarray(i, i + CHUNK_SZ))
    )
  }
  const base64 = btoa(parsedChunks.join(''))

  const prefix = 'data:' + type + '/' + ext + ';base64,'
  const base64URI = base64 ? prefix + base64 : ''

  return base64URI
}

const LabTestDetailsEdit = ({ id }) => {
  const classes = useStyles()
  const [labTestPassOrFail, setLabTestPassOrFail] = useState('')
  const [labTestReason, setLabTestReason] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const [fileObject, setFileObject] = useState(null)

  const api = useApi()
  const dispatch = useDispatch()
  const navigate = useNavigate()

  const { getRootProps, getInputProps } = useDropzone({
    onDrop: (acceptedFiles) => {
      const file = acceptedFiles[0]
      const name = file.name
      const ext = name.split('.').slice(-1)[0]
      const images = ['png', 'gif', 'jpg']
      const type = images.includes(ext) ? 'image' : 'application'
      const reader = new FileReader()
      reader.onabort = () => console.log('File reading was aborted')
      reader.onerror = () => console.log('file reading has failed')
      reader.onload = () => {
        const u8 = new Uint8Array(reader.result)
        const obj = {
          fileName: name,
          fileExt: ext,
          fileType: type,
          fileContent: u8,
        }
        setFileObject(obj)
      }
      reader.readAsArrayBuffer(file)
    },
  })

  const handleClick = (event) => {
    setLabTestPassOrFail(event.currentTarget.value)
  }
  const handleChange = (event) => {
    setLabTestReason(event.target.value)
  }
  const createFormData = (inputs, file) => {
    const formData = new FormData()
    const outputs = [
      {
        owner: identities.am,
        metadataFile: 'file',
      },
    ]

    formData.set('request', JSON.stringify({ inputs, outputs }))
    formData.set('file', file, 'file')

    return formData
  }

  const onSubmit = async () => {
    setIsSubmitting(true)
    const base64 = u8Array2base64URI(fileObject)
    const fileData = {
      type: 'PowderTestResult',
      overallResult: labTestPassOrFail,
      testReason: labTestReason ? labTestReason : '',
      testReport: /*prefix +*/ base64,
    }
    const file = new Blob([JSON.stringify(fileData)])
    const formData = createFormData([id], file)
    const response = await api.runProcess(formData)
    const token = { id: id, latestId: response[0], ...fileData }
    dispatch(updateLabTest(token))
    navigate('/app/tested/' + id)
  }

  const hasFile = fileObject !== null

  return (
    <Grid container spacing={0} className={classes.root}>
      <Grid xs={12} spacing={1}>
        <Paper>
          <Grid xs={12} alignItems="center" className={classes.heading}>
            <Typography variant="h6" component="h6">
              Test results
            </Typography>
          </Grid>

          <Grid xs={12} container className={classes.border}>
            {!hasFile ? (
              <Grid xs={12} className={classes.dndbg}>
                <Grid
                  container
                  direction="column"
                  alignItems="center"
                  {...getRootProps()}
                >
                  <input {...getInputProps()} />
                  <Grid variant="contained" item className={classes.dnd}>
                    <img
                      src={images.dragAndDropBg}
                      className={classes.img}
                      alt
                    />
                  </Grid>
                  <Grid variant="contained" item className={classes.dnd}>
                    <Typography variant="subtitle2" className={classes.dndText}>
                      {'Drag & drop a file here or \xa0'}
                      <Typography
                        variant="subtitle2"
                        className={classes.dndLink}
                      >
                        choose files
                      </Typography>
                    </Typography>
                  </Grid>
                </Grid>
              </Grid>
            ) : (
              <>
                <Typography variant="subtitle2" className={classes.heading}>
                  Attached documents
                </Typography>
                <Attachment
                  name={fileObject.fileName}
                  downloadData={u8Array2base64URI(fileObject)}
                />
              </>
            )}
          </Grid>

          <Grid xs={12} container className={classes.border}>
            <LabTestRow
              title={
                'State the result of the tests and the reasons for this result:'
              }
              value=""
            />

            <Grid xs={6} container direction="column" alignItems="center">
              <Button
                size="small"
                variant={
                  labTestPassOrFail === 'passed' ? 'contained' : 'outlined'
                }
                color="primary"
                className={classes.button}
                value="passed"
                onClick={handleClick}
              >
                Pass
              </Button>
            </Grid>
            <Grid xs={6} container direction="column" alignItems="center">
              <Button
                size="small"
                variant={
                  labTestPassOrFail === 'failed' ? 'contained' : 'outlined'
                }
                color="default"
                className={classes.button}
                value="failed"
                onClick={handleClick}
              >
                Fail
              </Button>
            </Grid>

            <Grid xs={12} container className={classes.root}>
              <LabTestRow title={'Reason:'} value="" />
              <Grid xs={12} container direction="column" alignItems="center">
                <TextareaAutosize
                  rowsMin={5}
                  rowsMax={10}
                  item
                  aria-label="maximum height"
                  placeholder="Enter reason here..."
                  className={classes.textarea}
                  onChange={handleChange}
                  name="labTestReason"
                  value={labTestReason}
                />
              </Grid>
            </Grid>
          </Grid>

          <Grid container direction="column" alignItems="center">
            <Button
              size="medium"
              variant="contained"
              color="primary"
              item
              disabled={labTestPassOrFail ? false : true}
              className={classes.button}
              onClick={onSubmit}
            >
              {isSubmitting ? (
                <CircularProgress color="secondary" size="30px" />
              ) : (
                'Submit'
              )}
            </Button>
          </Grid>
        </Paper>
      </Grid>
    </Grid>
  )
}

export default LabTestDetailsEdit
