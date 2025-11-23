# Task Manager Setup

If you want to try out the web app, you can visit this link: https://task-manager.jrcalderon.online

This gives you access to the webapp anywhere.

This document goes through the list of steps that I personally take to setup the whole app.

You need to have a docker inorder to start a local version of the web app.

If you already have a docker install please follow the steps below.


## 1. Clone the file and run the app using docker
```
# 
ssh root@your-server-ip

# Create a new user
adduser newuser

# Add the user to the sudo group
usermod -aG sudo newuser

# Test the new user
su - newuser
sudo apt update
```
