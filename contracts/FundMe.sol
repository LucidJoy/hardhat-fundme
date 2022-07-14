// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import './PriceConverter.sol';

error FundMe__NotOwner();

/** @title A contract for crowd funding
 *  @author Patrick Collins
 *  @notice This contract is to demo a sample funding contract
 *  @dev This implements price feeds as our library
 */
contract FundMe {
    using PriceConverter for uint256;

    uint256 public constant MINIMUM_USD = 50 * 1e18;
    address[] private s_funders;
    mapping(address => uint256) private s_addressToAmountFunded;
    address private immutable i_owner;
    AggregatorV3Interface private s_priceFeed;

    modifier onlyOwner() {
        // require(msg.sender == i_owner, "Only i_owner can withdraw");
        if (msg.sender != i_owner) {
            revert FundMe__NotOwner();
        }
        _; // doing the rest of the code
    }

    constructor(address priceFeedAddress) {
        i_owner = msg.sender;
        s_priceFeed = AggregatorV3Interface(priceFeedAddress);
    }

    // if someone sends ETH to this contract without calling fund() func
    receive() external payable {
        fund();
    }

    fallback() external payable {
        fund();
    }

    function fund() public payable {
        // Want to be able to set a min fund amt in USD
        // 1. How do we send ETH to this contract?

        // Min 1 eth should be sent by a sender to this contract
        // we can access value property bc this is payable func
        // msg.value.getConversionRate() == getConversionRate(msg.value)
        require(
            msg.value.getConversionRate(s_priceFeed) >= MINIMUM_USD,
            'You need to spend more ETH'
        ); // 1e18 == 1 * 10^(18)
        s_funders.push(msg.sender);
        s_addressToAmountFunded[msg.sender] = msg.value;
    }

    function withdraw() public onlyOwner {
        for (uint256 i = 0; i < s_funders.length; i++) {
            address fundersAddress = s_funders[i];
            s_addressToAmountFunded[fundersAddress] = 0;
        }

        // Reset the array
        s_funders = new address[](0);

        // Actually withdraw funds

        // 1. TRANSFER
        // msg.sender = address
        // payable(msg.sender) = payable address
        /*payable(msg.sender).transfer(address(this).balance);*/

        // 2. SEND
        /*bool sendSuccess = payable(msg.sender).send(address(this).balance);
        require(sendSuccess, "Send Failed!");*/

        // 3. CALL
        (bool callSuccess, ) = payable(msg.sender).call{
            value: address(this).balance
        }('');
        require(callSuccess, 'Call failed');
    }

    function cheapWithdraw() public payable onlyOwner {
        //mappings can't be in memory
        address[] memory funders = s_funders;
        for (uint256 i = 0; i < funders.length; i++) {
            address funderAddress = funders[i];
            s_addressToAmountFunded[funderAddress] = 0;
        }
        s_funders = new address[](0);

        (bool success, ) = i_owner.call{value: address(this).balance}('');
        require(success);
    }

    function getOwner() public view returns (address) {
        return i_owner;
    }

    function getFunder(uint256 index) public view returns (address) {
        return s_funders[index];
    }

    function getAddressToAmountFunded(address funder)
        public
        view
        returns (uint256)
    {
        return s_addressToAmountFunded[funder];
    }

    function getPriceFeed() public view returns (AggregatorV3Interface) {
        return s_priceFeed;
    }
}
