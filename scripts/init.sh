#!/bin/sh

PORTNODE=9933;
PORTIPFS=5001;
PORTAPI=3001;
TOKEN="";

get_token() {
	echo GetToken;
	HOST=$1;
	PORT=$2;
	URL=http://${HOST}:${PORT}/v2/auth;
	DATA='{"client_id": "'${REACT_API_AUTH_CLIENT_ID}'", "client_secret": "'${REACT_API_AUTH_CLIENT_SECRET}'"}';
	TOKEN=$(curl -X POST -H 'content-type: application/json' -d "$DATA" $URL 2>/dev/null | sed "s/{.*\"access_token\":\"\([^\"]*\).*}/\1/g");
}

init_data_with_curl() {
	echo InjectingDataWithCURL;
	HOST=$1;
	PORT=$2;
	URL=http://${HOST}:${PORT}/v2/run-process; # URL=http://localhost:3001/v2/run-process;
	OWNER=$3;
	vitalamtmp=$4;
	REQ00='{"inputs":[],"outputs":[{ "owner":"'${OWNER}'","metadataFile":"00.txt"}]}';
	REQ01='{"inputs":[],"outputs":[{ "owner":"'${OWNER}'","metadataFile":"01.txt"}]}';
	REQ02='{"inputs":[],"outputs":[{ "owner":"'${OWNER}'","metadataFile":"02.txt"}]}';
	H1="Accept: application/json"
	H2="Authorization: Bearer ${TOKEN}"
	curl -X POST -H "$H1" -H "$H2" -F "request=${REQ00}" -F '00.txt=@'${vitalamtmp}'/00.txt' $URL; echo;
	curl -X POST -H "$H1" -H "$H2" -F "request=${REQ01}" -F '01.txt=@'${vitalamtmp}'/01.txt' $URL; echo;
	curl -X POST -H "$H1" -H "$H2" -F "request=${REQ02}" -F '02.txt=@'${vitalamtmp}'/02.txt' $URL; echo;
}

check_data_with_curl() {
	echo CheckingDataWithCURL;
	HOST=$1;
	PORT=$2;
	URL1=http://${HOST}:${PORT}/v2/item/1;
	URL2=http://${HOST}:${PORT}/v2/item/2;
	URL3=http://${HOST}:${PORT}/v2/item/3;
	H1="Accept: application/json"
	H2="Authorization: Bearer ${TOKEN}"
	curl -H "$H1" -H "$H2" $URL1; echo;
	curl -H "$H1" -H "$H2" $URL2; echo;
	curl -H "$H1" -H "$H2" $URL3; echo;
}


vitalamtmp=$(mktemp -d 2>/dev/null || mktemp -d -t 'vitalam-demo');

cat <<EOT >> ${vitalamtmp}/00.txt
{
	"type": "Powder",
	"powderReference": "MB000042",
	"material": "Aluminium",
	"alloy": "2014",
	"quantityKg": 200,
	"particleSizeUm": 37.4,
	"location": "Powder Room"
}
EOT

cat <<EOT >> ${vitalamtmp}/01.txt
{
	"type": "Powder",
	"powderReference": "MB000055",
	"material": "Titanium",
	"alloy": "Ti-6Al-4V",
	"quantityKg": 200,
	"particleSizeUm": 37.4,
	"location": "Powder Room"
}
EOT

cat <<EOT >> ${vitalamtmp}/02.txt
{
	"type": "Powder",
	"powderReference": "MB000056",
	"material": "Titanium",
	"alloy": "Ti-6Al-4V",
	"quantityKg": 100,
	"particleSizeUm": 37.4,
	"location": "Powder Room"
}
EOT

source .env;
OWNER=5FHneW46xGXgs5mUiveU4sbTyGBzmstUspZC92UhjJM694ty;
get_token localhost $PORTAPI;
init_data_with_curl localhost $PORTAPI $OWNER ${vitalamtmp};
check_data_with_curl localhost $PORTAPI;
rm ${vitalamtmp}/*; rmdir ${vitalamtmp};

echo Done;
