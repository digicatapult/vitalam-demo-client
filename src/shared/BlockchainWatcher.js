import React, { useEffect, useRef } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { addOrder, updateOrder } from '../features/ordersSlice'
import { upsertPowder } from '../features/powdersSlice'
import { addLabTest, updateLabTest } from '../features/labTestsSlice'

import { useApi } from '../utils'

// will search for the equivalent token that exists in the list `items`
// to the passed `token`
const findOriginalId = (items, token) => {
  // First check if we have a matching id and return that if it exists
  const currentItem = items.find(({ latestId }) => token.id === latestId)

  if (currentItem) {
    return currentItem.id
  } else {
    // look for a token whose latest version is listed as a parent of `token`
    const parentItem = items.find(({ latestId }) =>
      token.parents.some((parentId) => parentId === latestId)
    )
    // if we don't find a parent this is a new item
    return parentItem ? parentItem.id : token.id
  }
}

// temporary version of the component that will poll the API
const BlockchainWatcher = ({ children }) => {
  const dispatch = useDispatch()
  const lastProcessedId = useRef(0)
  // orders, powders pull from redux state
  // these will change and cause a re-render when we dispatch a change in the effect
  const orders = useSelector((state) => state.customerOrders)
  const powders = useSelector((state) => state.powders)
  const labTests = useSelector((state) => state.labTests)
  const api = useApi()

  // This effect manages the polling for new tokens
  useEffect(() => {
    // will store the timeout id. This will be set for the first time lower down
    // note when this is null it means the timer has been cancelled which is caused
    // by a component render
    let timer = undefined

    const pollFunc = async () => {
      // get the latest token
      const { id: latestToken } = await api.latestToken()

      // if there are tokens to process
      if (latestToken > lastProcessedId.current) {
        // this loop is almost redundant. We will only loop more than once
        // if a token doesn't modify state
        for (let i = lastProcessedId.current + 1; i <= latestToken; i++) {
          // get the token to process
          const token = await api.tokenById(i)

          // if state has been modified and the effect canceled bail. The re-render will
          // generate the effect again with the correct state context. Note nothing asynchronous
          // should follow this point in the loop
          if (timer === null) {
            return
          }

          // Handle each token based on type
          switch (token.metadata.type) {
            case 'SubmittedOrder':
              dispatch(
                addOrder({
                  id: token.id,
                  latestId: token.id,
                  owner: token.roles.Admin,
                  latestOwner: token.roles.Admin,
                  ...token.metadata,
                })
              )
              break
            case 'AcceptedOrder':
              dispatch(
                updateOrder({
                  id: findOriginalId(orders, token),
                  latestId: token.id,
                  latestOwner: token.roles.Admin,
                  ...token.metadata,
                })
              )
              break
            case 'ManufacturedOrder':
              dispatch(
                updateOrder({
                  id: findOriginalId(orders, token),
                  latestId: token.id,
                  latestOwner: token.roles.Admin,
                  ...token.metadata,
                })
              )
              break
            case 'Powder':
              dispatch(
                upsertPowder({
                  id: findOriginalId(powders, token),
                  latestId: token.id,
                  owner:
                    findOriginalId(powders, token) === token.id
                      ? token.roles.Admin
                      : undefined,
                  latestOwner: token.roles.Admin,
                  ...token.metadata,
                })
              )
              break
            case 'PowderTestRequest':
              dispatch(
                addLabTest({
                  id: token.id,
                  latestId: token.id,
                  owner: token.roles.Admin,
                  latestOwner: token.roles.Admin,
                  ...token.metadata,
                })
              )
              break
            case 'PowderTestResult':
              dispatch(
                updateLabTest({
                  id: findOriginalId(labTests, token),
                  latestId: token.id,
                  latestOwner: token.roles.Admin,
                  ...token.metadata,
                })
              )
              break
            default:
              console.error(`Unknown token type ${token.metadata.type}`)
          }
          // update the `lastProcessedId` now we've processed the token
          lastProcessedId.current = i
        }
      }
    }

    // poll the blockchain. If after the pollFunc the timer has not been set to null
    // we should continue to loop. This is the general behaviour if there are no new tokens
    const timerFn = async () => {
      try {
        await pollFunc()
      } catch (err) {
        console.error(
          `Error polling for blockchain state. Error was ${
            `"${err.message}"` || JSON.stringify(err, null, 2)
          }`
        )
      }
      if (timer !== null) {
        timer = setTimeout(timerFn, 1000)
      }
    }
    // kick off the timer immediately. This is important so that we can deal with multiple new tokens
    // quickly. Each new token from the blockchain will cause a redux state change that will require
    // that this effect be reset. Therefore to keep the loop going without delay this call should occur
    // straight away
    timer = setTimeout(timerFn, 0)

    // The clean-up function clears the timer (as expected) but also sets it to null to indicate to the
    // `pollFunc` that this specific effect instantiation has been canceled
    return () => {
      clearTimeout(timer)
      timer = null
    }
  }, [orders, powders, labTests, dispatch, api]) // effect sensitivities.
  // These will force the effect to be canceled when redux state changes

  return <>{children}</>
}

export default BlockchainWatcher
