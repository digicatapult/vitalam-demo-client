# VITALam Demo Client

## Deprecation Notice
This application was deprecated on March 14th 2024, there will be no further dependency or security updates.
---

## Description

This demo has been built to demonstrate the benefits of distributed systems to the additive-manufacturing industry within aerospace. It provides simple web clients that let you perform the actions of four different personas in the industry. The demo relies on technologies built during the VITALam project.

## Getting started

### `git-lfs`

This repository makes use of [git-lfs](https://git-lfs.github.com/) to track certain assets (pdfs) that may be useful when presenting the demo. Therefore when pulling ensure you have `git-lfs` setup and enabled in order to get these assets.

### Managing the demo stack

The demo stack consists of three base personas: the customer (`cust`), additive manufacturer (`am`) and the lab (`lab`). A fourth persona, the additive manufacturer's lab (`am-lab`), can also be brought up to demonstrate [network incorruptibility](#Demoing-Network-Incorruptibility).

Each persona has four containers in its stack:

- A React client for performing actions such as creating and approving orders.
- A [Substrate-based blockchain](https://github.com/digicatapult/vitalam-node) node.
- An [`IPFS`](https://ipfs.io/) node for distributed file storage.
- An [API](https://github.com/digicatapult/vitalam-api) for communication between the client and the two nodes.

### Authentication

The [API](https://github.com/digicatapult/vitalam-api) uses an [Auth0](https://auth0.com/) Machine to Machine API to issue a JSON Web Token for authentication on its endpoints. First, you will need to create your own Auth0 API, which can be done for free. Then, so that the React clients can successfully authenticate with their respective APIs you need to set the following environment variables in a `.env` saved at the root of the `vitalam-demo-client` repository.

| variable                     | required | default | description                                                                                                          |
| :--------------------------- | :------: | :-----: | :------------------------------------------------------------------------------------------------------------------- |
| API_JWKS_URI                 |    Y     |    -    | JSON Web Key Set containing public keys used by the Auth0 API e.g. `https://test.eu.auth0.com/.well-known/jwks.json` |
| API_AUTH_AUDIENCE            |    Y     |    -    | Identifier of the Auth0 API                                                                                          |
| API_AUTH_ISSUER              |    Y     |    -    | Domain of the Auth0 API e.g. `https://test.eu.auth0.com/`                                                            |
| API_AUTH_TOKEN_URL           |    Y     |    -    | Auth0 API endpoint that issues an Authorisation (Bearer) access token e.g. `https://test.auth0.com/oauth/token`      |
| REACT_API_AUTH_CLIENT_ID     |    Y     |    -    | Client ID provided by Auth0 for the API                                                                              |
| REACT_API_AUTH_CLIENT_SECRET |    Y     |    -    | Client secret provided by Auth0 for the API                                                                          |

### Docker setup

In order to run the demo you will need to build and bring up the demo stack using Docker.

Install [Docker](https://docs.docker.com/get-docker/) and
[Docker Compose](https://docs.docker.com/compose/install/).

It's recommended to set your Docker resources higher than the default allocation:

- Minimum of 10 CPUs.
- Minimum of 8GB memory.

### Building the required images

Build the images for each persona's client and IPFS node. This can be done most easily using the [build.sh](./scripts/build.sh) script.

To rebuild all the different persona images, from the root directory of this repository run:

```sh
./scripts/build.sh
```

To rebuild images for individual personas:

```sh
./scripts/build.sh [cust] [am] [lab] [amlab]
```

The other two images for this repo, `vitalam-node` and `vitalam-api`, are pulled automatically from GHCR when bringing up the full set of containers in the next step.

### Bringing up the demo containers

In order to bring up the three main personas of the demo stack run:

```sh
./scripts/start.sh
```

Or to bring up individual personas:

```sh
./scripts/start.sh [cust] [am] [lab] [amlab]
```

To bring up a functioning chain, at least two of {`cust`, `am`, `lab`} should be running.

### Using the clients

If you now run `docker ps -a` or open the Docker Desktop dashboard you'll see there's four containers for each persona:

- React client e.g. `react-alice`
- API e.g. `api-alice`
- Substrate-based node e.g. `node-alice`
- IPFS node e.g. `ipfs-alice`

To view each persona's client in your browser, use the following ports:

- http://localhost:8001 for `customer`
- http://localhost:8002 for `additive manufacturer`
- http://localhost:8003 for `lab`
- http://localhost:8004 for `additive lab`

### Stopping the demo containers

You can knock down all instances with the following (argument is optional):

```sh
./scripts/stop.sh [all]
```

Or stop individual personas:

```sh
./scripts/stop.sh [cust] [am] [lab] [amlab]
```

### Initializing seed data

The scripts detailed above allow you to start/stop multiple personas easily, but to conduct the demo a small amount of seed data may be desired. To add seed data ensure that the `cust` persona is running as well as at least one of {`am`, `lab`} and then run:

```sh
./scripts/init.sh
```

This will add seed data including a couple of different `Powder` tokens to the blockchain. This script will NOT remove any existing data.

### Resetting the blockchain state

Reset the state of the blockchain and IPFS node with the following (argument is optional):

```sh
./scripts/reset.sh [all]
```

Or run reset for individual personas:

```sh
./scripts/reset.sh [cust] [am] [lab] [amlab]
```

Where all three arguments are optional.

### Checkpointing and restoring node state

Two scripts exist which can be used for checkpointing a blockchain node. Note this will not checkpoint an IPFS node. First to checkpoint a node for a given persona run:

```sh
./scripts/checkpoint.sh [cust|am|lab|amlab] [DIR]
```

Where one of {`cust`, `am`, `lab`, `amlab`} must be provided as the first argument and `DIR` is a path to the backup destination. The script will manage the lifecycle of the node and take a backup of the node state.

To restore a backup similarly run:

```sh
./scripts/restore.sh [cust|am|lab|amlab] [DIR]
```

### Managing chain connections

The final two scripts [`disconnect.sh`](scripts/disconnect.sh) and [`connect.sh`](scripts/connect.sh) allow the substrate node for the `cust`, `am` or `lab` to be disconnected from the others. To disconnect a node from the `chain` run

```sh
./scripts/disconnect.sh [cust|am|lab]
```

And to reconnect run:

```sh
./scripts/connect.sh [cust|am|lab]
```

This is generally used when [demoing network incorruptibility](#Demoing-Network-Incorruptibility).

## Demoing Network Resilience

The goal of this demo is to specifically show that data is redundant and the network will cope with those changes. This would normally take place after a substantial amount of demoing has been done so there is plenty of state in the chain. You should have the core personas up (`cust`, `am` and `lab`) and you should have the ability to conduct changes whilst a persona is down, such that they will then be replicated. As such the following scenario is recommended:

> In our story the customer has placed an order with the additive manufacturer and they have accepted it. After that though the customer suffers a catastrophic IT failure and loses all of their system data. They have to rebuild their system from scratch.
>
> Meanwhile the additive manufacturer has the part built and the powder used tested. The system works as though nothing has happened to the customer and is resilient.
>
> The customer brings up their blockchain and sees all the data restore; they lose nothing

To start this demo we assume that the `cust`, `am` and `lab` personas are running and that at least one powder has never been tested. The following technical steps are then required:

1. In the browser:
   - `cust` creates an order
   - `am` approves the order
2. [Stop](#Bringing-up-the-demo-containers) the `cust` persona
3. [Reset](#Resetting-the-blockchain-state) the `cust` persona
4. In the browser
   - `am` sends the powder for testing at the `lab`
   - `am` send the order for manufacture
   - `lab` uploads the test results
   - `am` confirms the tests are fine
5. [Start](#Bringing-up-the-demo-containers) the `cust` persona
6. In the browser demonstrate that the customer persona has all the relevant data

## Demoing Network Incorruptibility

To demo incorruptibility we present a story whereby one of the personas wishes to go back on a statement that has been made by them on the chain. In this case we imagine the following:

> In our story the customer has requested a part made from powder that confirms to a certain standard. The customer requests the order, the additive manufacturer accepts. Because the additive manufacturer thinks that their powder will pass the requirements, they manufacture the part at the same time as sending the powder off for testing. The part is made, but the powder fails the test. The additive manufacturer wishes to fake the test results.
>
> The additive manufacturer however thinks they are clever and has backed up their database state prior to sending the powder for testing. They disconnect from the chain network and restore their state prior to sending the powder for testing. They then instead send the powder to their internal lab who will always approve their request. The request is approved and from the point-of-view of the additive manufacturer everything looks good.
>
> The additive manufacturer then reconnects to the network to try to fool the other parties, but the system realises the config and restores the blockchain to the original state. Neither the honest lab nor the customer are fooled.

To start this demo we assume that the `cust`, `am` and `lab` personas are running and that the `amlab` persona has never been brought up and is NOT running. The following technical steps are then required:

1. In the browser:
   - `cust` creates an order
   - `am` approves the order
   - `am` manufacturers the order
2. [Checkpoint](#Checkpointing-and-restoring-node-state) the `am`
3. In the browser:
   - `am` sends the powder used in manufacturing for testing at the `lab`
   - `lab` fails the test
   - Demonstrate that this failed state is shown to the `cust` and `am`
4. [Disconnect](#Managing-chain-connections) the `am`
5. [Restore the checkpoint](#Checkpointing-and-restoring-node-state) for the `am`
6. [Bring up](#Bringing-up-the-demo-containers) the `amlab`
7. In the browser:
   - `am` sends the powder used in manufacturing for testing at the `amlab`
   - `amlab` passes the test
   - Demonstrate that this passed state is shown to the `am`
8. [Reconnect](#Managing-chain-connections) the `am`. Demonstrate that on refreshing the `am` that they see the failed test and that nothing has changed for the `cust` or `lab`.
