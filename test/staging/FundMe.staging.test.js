const { ethers, getNamedAccounts, network } = require('hardhat');
const { developmentChains } = require('../../helper-hardhat-config');
const { assert } = require('chai');

// only run on testnets
developmentChains.includes(network.name)
  ? describe.skip
  : describe('FundMe', async () => {
      let fundMe;
      let deployer;
      const sendValue = ethers.utils.parseEther('0.01');

      beforeEach(async function () {
        deployer = (await getNamedAccounts()).deployer;
        fundMe = await ethers.getContract('FundMe', deployer);
      });

      it('Allows people to fund & withdraw', async function () {
        await fundMe.fund({ value: sendValue });
        const tx = await fundMe.withdraw();
        await tx.wait(1);

        const endingBalance = await fundMe.provider.getBalance(fundMe.address);
        assert.equal(endingBalance.toString(), '0');
      });
    });

// const { assert } = require('chai');
// const { network, ethers, getNamedAccounts } = require('hardhat');
// const { developmentChains } = require('../../helper-hardhat-config');

// developmentChains.includes(network.name)
//   ? describe.skip
//   : describe('FundMe Staging Tests', async function () {
//       let deployer;
//       let fundMe;
//       const sendValue = ethers.utils.parseEther('0.01');
//       beforeEach(async () => {
//         deployer = (await getNamedAccounts()).deployer;
//         fundMe = await ethers.getContract('FundMe', deployer);
//       });

//       it('allows people to fund and withdraw', async function () {
//         await fundMe.fund({ value: sendValue });
//         const tx = await fundMe.withdraw();
//         await tx(1);

//         const endingFundMeBalance = await fundMe.provider.getBalance(
//           fundMe.address
//         );
//         console.log(
//           endingFundMeBalance.toString() +
//             ' should equal 0, running assert equal...'
//         );
//         assert.equal(endingFundMeBalance.toString(), '0');
//       });
//     });
