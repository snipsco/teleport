#!/bin/bash

KERNEL=$(uname)

## node
if which node > /dev/null ; then
  echo "node is installed, checking the version..."
  # node --version
else
  echo "node is not installed"
  echo "please install node >6.0"
  exit 1
fi

## python
if which python > /dev/null ; then
  echo "python is installed, checking the version..."
  # $(python --version)
else
  echo "python is not installed"
  echo "please install python 2.7 on your computer"
  exit 1
fi

## pip
if which pip > /dev/null ; then
  echo "pip is installed, checking the version..."
  # $(pip --version)
else
  echo "pip is not installed"
  curl https://bootstrap.pypa.io/get-pip.py -o "get-pip.py"
  python get-pip.py
fi

## yarn
if which yarn > /dev/null ; then
  echo "yarn is installed, skipping..."
else
  echo "yarn is not installed"
  curl -o- -L https://yarnpkg.com/install.sh | bash
fi

## virtualenv
if which virtualenv > /dev/null ; then
  echo "virtualenv is installed, trying to upgrade it..."
  # sudo pip install virtualenv --upgrade
else
  echo "virtualenv is not installed"
  sudo pip install virtualenv
fi

## kubectl
if which kubectl > /dev/null ; then
  echo "kubectl is installed, skipping..."
else
  echo "kubectl is not installed"
  if [ '$(KERNEL)' = 'Darwin' ]; then \
    curl -O http://storage.googleapis.com/kubernetes-release/release/v1.2.3/bin/darwin/amd64/kubectl; \
  else \
    curl -O http://storage.googleapis.com/kubernetes-release/release/v1.2.3/bin/linux/amd64/kubectl; \
  fi
  chmod +x kubectl
  mv kubectl /usr/local/bin/
fi

## teleport
if which tpt > /dev/null ; then
  echo "teleport is installed, skipping..."
else
  echo "teleport is not installed"
  yarn global add teleport.js
  ## then your teleport.js is stored in your ~/.config/yarn/global/node_modules/teleport.js folder
fi

## python dependencies
echo "installing python dependencies"
sudo pip install -r requirements.txt

echo "Your Teleport checking is good!"
