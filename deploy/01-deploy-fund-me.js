// function deployFunc() {
//   console.log('Hi');
// }

// module.exports.default = deployFunc;

const {
  networkConfig,
  developmentChains,
} = require('../helper-hardhat-config');
const { network } = require('hardhat');
const { verify } = require('../utils/verify');

module.exports = async (hre) => {
  const { getNamedAccounts, deployments } = hre;

  const { deploy, log } = deployments;
  const { deployer } = await getNamedAccounts();
  const chainId = network.config.chainId;

  // const ethUsdPriceFeedAddress = networkConfig[chainId]['ethUsdPriceFeed'];
  let ethUsdPriceFeedAddress;
  if (developmentChains.includes(network.name)) {
    const ethUsdAggregator = await deployments.get('MockV3Aggregator');
    ethUsdPriceFeedAddress = ethUsdAggregator.address;
  } else {
    ethUsdPriceFeedAddress = networkConfig[chainId]['ethUsdPriceFeed'];
  }

  //when going for localhost or hardhat network we want to use Mock
  const args = [ethUsdPriceFeedAddress];
  const fundMe = await deploy('FundMe', {
    from: deployer,
    args: [ethUsdPriceFeedAddress],
    log: true,
    waitConfirmations: network.config.blockConfirmations || 1,
  });
  log('------------------------------------------------');
  log(`FundMe deployed at ${fundMe.address}`);

  if (
    !developmentChains.includes(network.name) &&
    process.env.ETHERSCAN_API_KEY
  ) {
    await verify(fundMe.address, args);
  }
};

module.exports.tags = ['all', 'fundme'];
