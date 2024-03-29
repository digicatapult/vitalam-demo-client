import React from 'react'
import 'reset-css'
import { createMuiTheme, ThemeProvider } from '@material-ui/core/styles'
import { makeStyles, Container } from '@material-ui/core'
import { BrowserRouter } from 'react-router-dom'

import Sidebar from './components/Sidebar'
import Router from './router'

const theme = createMuiTheme({
  palette: {
    primary: {
      main: '#718c9f',
      dark: '#3a617e',
    },
    highlight: {
      main: '#ff9900',
    },
    statusRequested: {
      main: '#f9cc8a',
    },
    statusAcceptedTested: {
      main: '#8ec8c4',
    },
    statusSent: {
      main: '#cccccc',
    },
  },
  typography: {
    subtitle1: {
      fontSize: 12,
    },
    subtitle2: {
      fontSize: 12,
    },
  },
})

const useStyles = makeStyles({
  content: {
    margin: '20px 0px',
    position: 'fixed',
    top: 0,
    bottom: 0,
    left: '250px',
    right: 0,
    maxWidth: 'min(calc(100vw - 250px), 1368px)',
    overflowY: 'scroll',
  },
})

const CustomerApp = () => {
  const classes = useStyles()

  return (
    <BrowserRouter>
      <ThemeProvider theme={theme}>
        <Sidebar />
        <Container className={classes.content}>
          <Router />
        </Container>
      </ThemeProvider>
    </BrowserRouter>
  )
}

export default CustomerApp
