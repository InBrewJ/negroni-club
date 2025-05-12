# Script started on 2025-05-12
# Ideally this would check if things are installed and which versions
# Ideally this would be written in Go rather than in Bash

############### Install AWS CLI (probably requires Python)

curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "/home/inbrewj/Downloads/awscliv2.zip"
unzip /home/inbrewj/Downloads/awscliv2.zip -d /home/inbrewj/Downloads/awscliv2
sudo /home/inbrewj/Downloads/awscliv2/aws/install

############### Install psql (for Cockroach hunting)

sudo apt-get install -y postgresql-client

############### Install Go 1.24.3
wget -O /home/inbrewj/Downloads/go1.24.3.linux-amd64.tar.gz https://go.dev/dl/go1.24.3.linux-amd64.tar.gz
sudo rm -rf /usr/local/go && sudo tar -C /usr/local -xzf /home/inbrewj/Downloads/go1.24.3.linux-amd64.tar.gz
export PATH=$PATH:/usr/local/go/bin
go version

############### Install node via nvm (and therefore npm)

# Download and install nvm:
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.3/install.sh | bash

# in lieu of restarting the shell
\. "$HOME/.nvm/nvm.sh"

# Download and install Node.js:
nvm install 22

# Verify the Node.js version:
node -v # Should print "v22.15.0".
nvm current # Should print "v22.15.0".

# Verify npm version:
npm -v # Should print "10.9.2".

############### Installs docker

# Add Docker's official GPG key:
sudo apt-get update
sudo apt-get install ca-certificates curl
sudo install -m 0755 -d /etc/apt/keyrings
sudo curl -fsSL https://download.docker.com/linux/ubuntu/gpg -o /etc/apt/keyrings/docker.asc
sudo chmod a+r /etc/apt/keyrings/docker.asc

# Add the repository to Apt sources:
echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.asc] https://download.docker.com/linux/ubuntu \
  $(. /etc/os-release && echo "${UBUNTU_CODENAME:-$VERSION_CODENAME}") stable" | \
  sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
sudo apt-get update

sudo apt-get install docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

sudo docker run hello-world

# Sort out docker permissions to run without sudo
# (these commands don't work the second time round)

sudo groupadd docker
sudo usermod -aG docker $USER
newgrp docker

docker run hello-world

docker run --rm --name some-postgres -p 5432:5432 -e POSTGRES_PASSWORD=postgres postgres
