const { deployments, ethers, getNamedAccounts } = require('hardhat');
const { developmentChains } = require('../../helper-hardhat-config');
const { assert, expect } = require('chai');

// only run on development chains
!developmentChains.includes(network.name)
  ? describe.skip
  : describe('FundMe', async function () {
      let fundMe;
      let mockV3Aggregator;
      let deployer;
      const sendValue = ethers.utils.parseEther('1'); // 1 with 18 zeroes

      beforeEach(async function () {
        // deploy our FundMe contract using Hardhat-deploy
        deployer = (await getNamedAccounts()).deployer;
        await deployments.fixture(['all']);
        fundMe = await ethers.getContract('FundMe', deployer);
        mockV3Aggregator = await ethers.getContract(
          'MockV3Aggregator',
          deployer
        );
      });

      describe('constructor', async () => {
        it('Sets the aggregator address correctly', async function () {
          const response = await fundMe.getPriceFeed();
          assert.equal(response, mockV3Aggregator.address);
        });
      });

      describe('fund', async function () {
        it("Fails if you don't send enough ETH", async function () {
          await expect(fundMe.fund()).to.be.revertedWith(
            'You need to spend more ETH' //should be the same as in contract
          );
        });

        it('Updates the amount funded data structure', async function () {
          await fundMe.fund({ value: sendValue });
          const response = await fundMe.getAddressToAmountFunded(deployer);
          assert.equal(response.toString(), sendValue.toString());
        });

        it('Adds funder to array of getFunder', async function () {
          await fundMe.fund({ value: sendValue });
          const funder = await fundMe.getFunder(0);
          assert.equal(funder, deployer);
        });
      });

      describe('withdraw', async () => {
        // we need to have funds in our contract
        beforeEach(async function () {
          await fundMe.fund({ value: sendValue });
        });

        it('Withdraw ETH from a single funder', async function () {
          // Arrange
          const startingFundMeBalance = await ethers.provider.getBalance(
            fundMe.address
          );
          const startingDeployerBalance = await ethers.provider.getBalance(
            deployer
          );

          // Act
          const transactionResponse = await fundMe.withdraw();
          const transactionReceipt = await transactionResponse.wait(1);
          const { gasUsed, effectiveGasPrice } = transactionReceipt;
          const gasCost = gasUsed.mul(effectiveGasPrice);

          const endingFundMeBalance = await ethers.provider.getBalance(
            fundMe.address
          );
          const endingDeployerBalance = await ethers.provider.getBalance(
            deployer
          );

          // Gas cost

          // Assert
          assert.equal(endingFundMeBalance, 0);
          assert.equal(
            startingFundMeBalance.add(startingDeployerBalance).toString(),
            endingDeployerBalance.add(gasCost).toString()
          );
        });

        it('Withdraw ETH from a mutilple getFunder', async function () {
          // Arrange
          const accounts = await ethers.getSigners();
          // 0th acc is of Deployer's
          for (let i = 1; i < 6; i++) {
            // Deployer is connected initially
            const fundMeConnectedContract = await fundMe.connect(accounts[i]);
            await fundMeConnectedContract.fund({ value: sendValue });
          }
          const startingFundMeBalance = await ethers.provider.getBalance(
            fundMe.address
          );
          const startingDeployerBalance = await ethers.provider.getBalance(
            deployer
          );

          // Act
          const transactionResponse = await fundMe.withdraw();
          const transactionReceipt = await transactionResponse.wait(1);
          const { gasUsed, effectiveGasPrice } = transactionReceipt;
          const gasCost = gasUsed.mul(effectiveGasPrice);

          const endingFundMeBalance = await ethers.provider.getBalance(
            fundMe.address
          );
          const endingDeployerBalance = await ethers.provider.getBalance(
            deployer
          );

          // Assert
          assert.equal(endingFundMeBalance, 0);
          assert.equal(
            startingFundMeBalance.add(startingDeployerBalance).toString(),
            endingDeployerBalance.add(gasCost).toString()
          );

          // Make sure getFunder are reset properly
          await expect(fundMe.getFunder(0)).to.be.reverted;

          for (let i = 1; i < 6; i++) {
            assert.equal(
              await fundMe.getAddressToAmountFunded(accounts[i].address),
              0
            );
          }
        });

        it('Only allows owner to withdraw', async function () {
          const accounts = await ethers.getSigners();
          const attacker = accounts[1];
          const attackerConnectedContract = await fundMe.connect(attacker);

          await expect(attackerConnectedContract.withdraw()).to.be.revertedWith(
            'FundMe__NotOwner'
          );
        });

        it('Cheaper withdraw testing', async function () {
          // Arrange
          const accounts = await ethers.getSigners();
          // 0th acc is of Deployer's
          for (let i = 1; i < 6; i++) {
            // Deployer is connected initially
            const fundMeConnectedContract = await fundMe.connect(accounts[i]);
            await fundMeConnectedContract.fund({ value: sendValue });
          }
          const startingFundMeBalance = await ethers.provider.getBalance(
            fundMe.address
          );
          const startingDeployerBalance = await ethers.provider.getBalance(
            deployer
          );

          // Act
          const transactionResponse = await fundMe.cheapWithdraw();
          const transactionReceipt = await transactionResponse.wait(1);
          const { gasUsed, effectiveGasPrice } = transactionReceipt;
          const gasCost = gasUsed.mul(effectiveGasPrice);

          const endingFundMeBalance = await ethers.provider.getBalance(
            fundMe.address
          );
          const endingDeployerBalance = await ethers.provider.getBalance(
            deployer
          );

          // Assert
          assert.equal(endingFundMeBalance, 0);
          assert.equal(
            startingFundMeBalance.add(startingDeployerBalance).toString(),
            endingDeployerBalance.add(gasCost).toString()
          );

          // Make sure getFunder() are reset properly
          await expect(fundMe.getFunder(0)).to.be.reverted;

          for (let i = 1; i < 6; i++) {
            assert.equal(
              await fundMe.getAddressToAmountFunded(accounts[i].address),
              0
            );
          }
        });
      });
    });
