import { useDispatch } from 'react-redux'
import jwtDecode from 'jwt-decode'
import { updateNetworkStatus } from '../features/networkStatusSlice'

const API_HOST = process.env.REACT_APP_API_HOST || 'localhost'
const API_PORT = process.env.REACT_APP_API_PORT || '3001'

const useFetchWrapper = () => {
  const dispatch = useDispatch()

  const wrappedFetch = async (url, options) => {
    let request
    try {
      request = await fetch(url, options)
      if (request.ok) {
        dispatch(updateNetworkStatus(true))
      } else {
        dispatch(updateNetworkStatus(false))
      }
    } catch (err) {
      dispatch(updateNetworkStatus(false))
      throw err
    }
    return request.json()
  }

  return wrappedFetch
}

const checkJwt = (token) => {
  if (!token) return false
  try {
    const decoded = jwtDecode(token)
    const hasExpired = decoded.exp * 1000 < Date.now()
    return !hasExpired
  } catch (err) {
    return false
  }
}

const useApi = () => {
  const wrappedFetch = useFetchWrapper()

  const getAuthToken = async () => {
    let token = localStorage.getItem('token')

    if (!checkJwt(token)) {
      localStorage.clear('token')
      const response = await wrappedFetch(
        `http://${API_HOST}:${API_PORT}/v2/auth`,
        {
          method: 'POST',
          mode: 'cors',
          cache: 'no-cache',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            client_id: process.env.REACT_APP_AUTH_CLIENT_ID,
            client_secret: process.env.REACT_APP_AUTH_CLIENT_SECRET,
          }),
        }
      )

      token = response.access_token
      localStorage.setItem('token', token)
    }
    return token
  }

  const runProcess = async (body) =>
    wrappedFetch(`http://${API_HOST}:${API_PORT}/v2/run-process`, {
      method: 'POST',
      mode: 'cors',
      body,
      headers: {
        Authorization: `Bearer ${await getAuthToken()}`,
      },
    })

  const latestToken = async () => {
    return await wrappedFetch(`http://${API_HOST}:${API_PORT}/v2/last-token`, {
      method: 'GET',
      mode: 'cors',
      cache: 'no-cache',
      headers: {
        Authorization: `Bearer ${await getAuthToken()}`,
      },
    })
  }
  const tokenById = async (id) => {
    const token = await wrappedFetch(
      `http://${API_HOST}:${API_PORT}/v2/item/${id}`,
      {
        method: 'GET',
        mode: 'cors',
        cache: 'no-cache',
        headers: {
          Authorization: `Bearer ${await getAuthToken()}`,
        },
      }
    )
    token.metadata = await wrappedFetch(
      `http://${API_HOST}:${API_PORT}/v2/item/${id}/metadata`,
      {
        method: 'GET',
        mode: 'cors',
        cache: 'no-cache',
        headers: {
          Authorization: `Bearer ${await getAuthToken()}`,
        },
      }
    )
    return token
  }

  return { runProcess, latestToken, tokenById }
}

export default useApi
