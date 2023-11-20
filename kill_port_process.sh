#!/bin/bash

PORTS="3005"

for PORT in ${PORTS}; do
  PROCESS=$(lsof -i -P | grep LISTEN | grep :${PORT} | awk '{print $2}')

  echo ${PROCESS}

  if [ ${PROCESS} ]; then
    ps -ax | grep '^\s${PROCESS}'

    echo -n "KILL [Y/n]?"
    read ANS
    echo ${ANS}
    if [ ${ANS} ] && [ ${ANS} == 'Y' ] || [ ! ${ANS} ]; then
      echo DIE PROCESS
      kill -9 ${PROCESS}
    fi
  fi
done
