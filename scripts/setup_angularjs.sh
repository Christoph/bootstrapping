#!/bin/bash

# Clone Node.js
git clone https://github.com/joyent/node.git

# Install Node.js
cd ~/dev/node
./configure
make
sudo make install

# Install NPM
cd ..
curl https://npmjs.org/install.sh | sudo sh

# Install angularJS
sudo npm install grunt-cli -g
sudo npm install bower -g

# Install server for tern
cd ~/.vim/bundle/tern_for_vim
sudo npm install
