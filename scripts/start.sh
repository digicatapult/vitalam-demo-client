#!/bin/sh
# RUN INIT DEFAULT (brings up cust, am, lab):
# ./scripts/start.sh
# RUN INIT ALL:
# ./scripts/start.sh [all]
# Where the argument is optional
# OR RUN INIT OF INDIVIDUAL PERSONA:
# ./scripts/start.sh [cust] [am] [lab] [amlab]
# Where all three arguments are optional but minimum two should be present

ARG1=$1;
ARG2=$2;
ARG3=$3;
ARG4=$4;
PROJECT="vitalam_demo";
ENVPATH=".env"
COMMONENVPATH="docker/docker.env";

CUSTPATH="docker/docker-compose-cust.yml";
AMPATH="docker/docker-compose-am.yml";
LABPATH="docker/docker-compose-lab.yml";
AMLABPATH="docker/docker-compose-am-lab.yml";

assert_env() {
	echo AssertEnv;
	trap 'rm -f "$COMBINEDENVPATH"' EXIT;
	COMBINEDENVPATH=$(mktemp);
	cat $ENVPATH $COMMONENVPATH > $COMBINEDENVPATH;
}


ipfs_init() {
	IPFS_PATH=$1;
	mkdir -p $IPFS_PATH;
	docker run --mount type=bind,src=$IPFS_PATH,dst=/ipfs --entrypoint='' ghcr.io/digicatapult/vitalam-ipfs:v1.0.0 /bin/sh -c "\
	set -ex; \
	ipfs init; \
	ipfs config Addresses.API /ip4/0.0.0.0/tcp/5001; \
	ipfs config Datastore.StorageMax 1GB; \
	ipfs config --json API.HTTPHeaders.Access-Control-Allow-Origin '[\"http://0.0.0.0:5001\", \"http://127.0.0.1:5001\"]'; \
	ipfs bootstrap rm --all; \
	"
}

stop_all() {
	echo StopAll;
	[ "$(docker-compose -p $PROJECT -f $CUSTPATH ps -q|wc -l)" -gt 0 ] && docker-compose -p $PROJECT -f $CUSTPATH --env-file $COMBINEDENVPATH down --remove-orphans;
	[ "$(docker-compose -p $PROJECT -f $AMPATH ps -q|wc -l)" -gt 0 ] && docker-compose -p $PROJECT -f $AMPATH --env-file $COMBINEDENVPATH down --remove-orphans;
	[ "$(docker-compose -p $PROJECT -f $LABPATH ps -q|wc -l)" -gt 0 ] && docker-compose -p $PROJECT -f $LABPATH --env-file $COMBINEDENVPATH down --remove-orphans;
	[ "$(docker-compose -p $PROJECT -f $AMLABPATH ps -q|wc -l)" -gt 0 ] && docker-compose -p $PROJECT -f $AMLABPATH --env-file $COMBINEDENVPATH down --remove-orphans;
}

init_all() {
	echo StartAll;
	ipfs_init $PWD/data/cust/ipfs
	ipfs_init $PWD/data/am/ipfs
	ipfs_init $PWD/data/lab/ipfs
	ipfs_init $PWD/data/am-lab/ipfs
	docker-compose -p $PROJECT -f $CUSTPATH -f $AMPATH -f $LABPATH -f $AMLABPATH --env-file $COMBINEDENVPATH up -d;
}

stop_default() {
	echo StopCust StopAM StopLab;
	[ "$(docker-compose -p $PROJECT -f $CUSTPATH ps -q|wc -l)" -gt 0 ] && docker-compose -p $PROJECT -f $CUSTPATH --env-file $COMBINEDENVPATH down --remove-orphans;
	[ "$(docker-compose -p $PROJECT -f $AMPATH ps -q|wc -l)" -gt 0 ] && docker-compose -p $PROJECT -f $AMPATH --env-file $COMBINEDENVPATH down --remove-orphans;
	[ "$(docker-compose -p $PROJECT -f $LABPATH ps -q|wc -l)" -gt 0 ] && docker-compose -p $PROJECT -f $LABPATH --env-file $COMBINEDENVPATH down --remove-orphans;
}

init_default() {
	echo StartCust StartAM StartLab;
	ipfs_init $PWD/data/cust/ipfs
	ipfs_init $PWD/data/am/ipfs
	ipfs_init $PWD/data/lab/ipfs
	docker-compose -p $PROJECT -f $CUSTPATH -f $AMPATH -f $LABPATH --env-file $COMBINEDENVPATH up -d;
}

stop_cust() {
	echo StopCust;
	[ "$(docker-compose -p $PROJECT -f $CUSTPATH ps -q|wc -l)" -gt 0 ] && docker-compose -p $PROJECT -f $CUSTPATH --env-file $COMBINEDENVPATH down;
}

init_cust() {
	echo StartCust;
	ipfs_init $PWD/data/cust/ipfs
	docker-compose -p $PROJECT -f $CUSTPATH --env-file $COMBINEDENVPATH up -d;
}

stop_am() {
	echo StopAM;
	[ "$(docker-compose -p $PROJECT -f $AMPATH ps -q|wc -l)" -gt 0 ] && docker-compose -p $PROJECT -f $AMPATH --env-file $COMBINEDENVPATH down;
}

init_am() {
	echo StartAM;
	ipfs_init $PWD/data/am/ipfs
	docker-compose -p $PROJECT -f $AMPATH --env-file $COMBINEDENVPATH up -d;
}

stop_lab() {
	echo StopLab;
	[ "$(docker-compose -p $PROJECT -f $LABPATH ps -q|wc -l)" -gt 0 ] && docker-compose -p $PROJECT -f $LABPATH --env-file $COMBINEDENVPATH down;
}

init_lab() {
	echo StartLab;
	ipfs_init $PWD/data/lab/ipfs
	docker-compose -p $PROJECT -f $LABPATH --env-file $COMBINEDENVPATH up -d;
}

stop_am_lab() {
	echo StopAMLab;
	[ "$(docker-compose -p $PROJECT -f $AMLABPATH ps -q|wc -l)" -gt 0 ] && docker-compose -p $PROJECT -f $AMLABPATH --env-file $COMBINEDENVPATH down;
}

init_am_lab() {
	echo StartAMLab;
	ipfs_init $PWD/data/am-lab/ipfs
	docker-compose -p $PROJECT -f $AMLABPATH --env-file $COMBINEDENVPATH up -d;
}

check_health_node() {
	echo CheckHealthNode;
	HOST=$1;
	PORT=$2;
	URL=http://${HOST}:${PORT}; # URL=http://localhost:9933;
	HEADER='Content-Type: application/json';
	DATA='{"jsonrpc":"2.0","id":1,"method":"system_health"}';
	HEALTHRAW=$(curl -s -X POST -H "$HEADER" -d ${DATA} $URL 2>&1);
	if [ "$HEALTHRAW" == "" ]; then
		echo ErrorConnecting;
		return 0;
	else
		PEERS=$(echo $HEALTHRAW|tr "," "\n"|head -n3|tail -n1);
		PEERSCOUNT=$(echo $PEERS|tr ":" "\n"|tail -n1);
		if [ $PEERSCOUNT -ge 0 ]; then
			echo HealthOK;
			return 1;
		else
			echo NotHealthOK;
			return 0;
		fi;
	fi;
}

check_health_ipfs() {
	echo CheckHealthIPFS;
	HOST=$1;
	PORT=$2;
	URL=http://${HOST}:${PORT}/api/v0/swarm/peers?verbose=false;
	HEALTHRAW=$(curl -s $URL 2>&1);
	PEERS=$(echo $HEALTHRAW|tr "," "\n"|head -n3|tail -n1);
	if [ "$HEALTHRAW" == "" ]; then
		echo ErrorConnecting;
	else
		if [ "$HEALTHRAW" != '{"Peers":null}' ]; then
			echo PeersNotNull;
			return 1;
		else
			echo IpfsNoPeers;
			return 0;
		fi;
	fi;
}

check_health_api() {
	echo CheckHealthApi;
	HOST=$1;
	PORT=$2;
	URL=http://${HOST}:${PORT}/health;
	HEALTHRAW=$(curl -o /dev/null -s -w "%{http_code}" $URL);
	if [ "$HEALTHRAW" == "000" ]; then
		echo ErrorConnecting;
	else
		if [ "$HEALTHRAW" == '200' ]; then
			echo ApiOK;
			return 1;
		else
			echo ApiError;
			return 0;
		fi;
	fi;
}

assert_env;
if [ "$ARG1" == "all" ]; then

	stop_all; init_all;

elif [ "$ARG1" == "" ]; then

	stop_default; init_default;

else

	if [ "$ARG1" == "cust" ] || \
	[ "$ARG2" == "cust" ] || \
	[ "$ARG3" == "cust" ] || \
	[ "$ARG4" == "cust" ]; then stop_cust; init_cust; fi;

	if [ "$ARG1" == "am" ] || \
	[ "$ARG2" == "am" ] || \
	[ "$ARG3" == "am" ] || \
	[ "$ARG4" == "am" ]; then stop_am; init_am; fi;

	if [ "$ARG1" == "lab" ] || \
	[ "$ARG2" == "lab" ] || \
	[ "$ARG3" == "lab" ] || \
	[ "$ARG4" == "lab" ]; then stop_lab; init_lab; fi;

	if [ "$ARG1" == "amlab" ] || \
	[ "$ARG2" == "amlab" ] || \
	[ "$ARG3" == "amlab" ] || \
	[ "$ARG4" == "amlab" ]; then stop_am_lab; init_am_lab; fi;

fi;

if [ "$ARG1" == "all" ] || \
[ "$ARG1" == "" ]; then
	PORTNODE=9933; PORTIPFS=5001; PORTAPI=3001;
fi;

if [ "$ARG1" == "cust" ] || \
[ "$ARG2" == "cust" ] || \
[ "$ARG3" == "cust" ] || \
[ "$ARG4" == "cust" ]; then
	PORTNODE=9933; PORTIPFS=5001; PORTAPI=3001;
fi;

if [ "$ARG1" == "am" ] || \
[ "$ARG2" == "am" ] || \
[ "$ARG3" == "am" ] || \
[ "$ARG4" == "am" ]; then
	PORTNODE=9934; PORTIPFS=5002; PORTAPI=3002;
fi;

if [ "$ARG1" == "lab" ] || \
[ "$ARG2" == "lab" ] || \
[ "$ARG3" == "lab" ] || \
[ "$ARG4" == "lab" ]; then
	PORTNODE=9935; PORTIPFS=5003; PORTAPI=3003;
fi;

if [ "$ARG1" == "amlab" ] || \
[ "$ARG2" == "amlab" ] || \
[ "$ARG3" == "amlab" ] || \
[ "$ARG4" == "amlab" ]; then
	PORTNODE=9936; PORTIPFS=5004; PORTAPI=3004;
fi;

echo "WaitingForNode (need at least one other peer)";
RESULT=0; while [[ $RESULT -eq 0 ]]; do
	sleep 2; check_health_node localhost $PORTNODE; RESULT=$?;
done;
echo DoneWaitingForNode;

echo "WaitingForIPFS (need at least one other peer)";
RESULT=0; while [[ $RESULT -eq 0 ]]; do
	sleep 2; check_health_ipfs localhost $PORTIPFS; RESULT=$?;
done;
echo DoneWaitingForIPFS;

echo WaitingForApi;
RESULT=0; while [[ $RESULT -eq 0 ]]; do
	sleep 2; check_health_api localhost $PORTAPI; RESULT=$?;
done;
echo DoneWaitingForApi;

echo Done;
