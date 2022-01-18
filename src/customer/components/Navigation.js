import React from 'react'
import { NavLink } from 'react-router-dom'
import makeStyles from '@material-ui/core/styles/makeStyles'
import { Toolbar, Typography, Box } from '@material-ui/core'

import NetworkStatusIndicator from './NetworkStatusIndicator'
import images from '../../images'

const useStyles = makeStyles((theme) => ({
  root: {
    marginLeft: '100px',
    marginRight: '100px',
  },
  logo: {
    marginRight: 'auto',
    height: '50px',
    display: 'grid',
    gridTemplateColumns: 'auto auto',
    gridColumnGap: '10px',
    alignContent: 'center',
    textDecoration: 'none',
    color: 'white',
  },
  navActive: {
    borderBottom: '1px white solid',
  },
  navHover: {
    '&:hover': {
      borderBottom: '1px white solid',
    },
  },
  navButton: {
    height: '50px',
    display: 'grid',
    alignContent: 'center',
    textDecoration: 'none',
    color: theme.palette.primary.contrastText,
    marginLeft: '70px',
  },
  accountNameWrapper: {
    height: '50px',
    textDecoration: 'none',
    display: 'flex',
    gap: '10px',
    color: theme.palette.primary.contrastText,
    alignItems: 'center',
    justifyContent: 'right',
    marginLeft: '70px',
    '&:hover': {
      borderBottom: '1px white solid',
    },
  },
  avatar: {
    display: 'grid',
    alignItems: 'center',
    justifyContent: 'center',
    width: '32px',
    height: '32px',
    color: theme.palette.primary.main,
    background: theme.palette.primary.contrastText,
    borderRadius: '50%',
    fontSize: '1.2rem',
    fontWeight: '500',
  },
}))

const Navigation = () => {
  const classes = useStyles()
  const name = 'Stephen Turner'

  return (
    <Toolbar className={classes.root}>
      <div className={classes.logo}>
        <img src={images.logoCust}></img>
        <Typography variant="h6">Craft Works</Typography>
      </div>
      <NavLink
        to="/app/customer-parts"
        className={`${classes.navButton} ${classes.navHover}`}
        activeClassName={classes.navActive}
      >
        <Typography variant="subtitle2">Part inventory</Typography>
      </NavLink>
      <NavLink
        to="/app/my-orders"
        className={`${classes.navButton} ${classes.navHover}`}
        activeClassName={classes.navActive}
      >
        <Typography variant="subtitle2">My orders</Typography>
      </NavLink>
      <NavLink
        className={`${classes.accountNameWrapper} ${classes.navHover}`}
        to="#"
      >
        <Typography variant="subtitle2">{name}</Typography>
        <Typography className={classes.avatar}>
          {name.substring(0, 1)}
        </Typography>
      </NavLink>
      <Box className={classes.navButton}>
        <NetworkStatusIndicator />
      </Box>
    </Toolbar>
  )
}

export default Navigation
