# Generator Symfony With Benefits

## Getting Started

### Features

A basic latest Symfony project, with benefits (to come...)

### Requirements

Using this generator requires several dependencies :

* Node, as `npm` is needed

The following node packages need to be installed globally :

    npm install -g yo

* [Composer](https://getcomposer.org/download/)
* [Ansible](http://docs.ansible.com/intro_installation.html)
* [Vagrant](http://docs.vagrantup.com/v2/installation/)
* [VirtualBox](https://www.virtualbox.org/wiki/Downloads)
* NFS

NFS is included on OSX but can be installed on Ubuntu Using

    sudo apt-get install nfs-kernel-server

### Installing

This generator is still on its early stages of development, and is not yet available on npm.
To make it available, you will need to clone this project and run the following command:

    git clone https://github.com/wrousseau/generator-symfony-with-benefits
    npm link

## Using it

Create and `cd` into the folder you wish to start your project and run the following command :

    yo symfony-with-benefits

## License

MIT
