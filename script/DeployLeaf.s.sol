// SPDX-License-Identifier: MIT

pragma solidity ^0.8.19;

import {Script} from "lib/forge-std/src/Script.sol";
import {LEAFStableCoin} from "src/LEAFStableCoin.sol";
import {LEAFEngine} from "src/LEAFEngine.sol";
import {HelperConfig} from "script/HelperConfig.s.sol";

contract DeployLeaf is Script {

    address[] public tokenAddresses;
    address[] public priceFeedAddresses;

    function run() external returns (LEAFStableCoin, LEAFEngine, HelperConfig) {
        HelperConfig config = new HelperConfig();

        (
            address wethUsdPriceFeed,
            address wbtcUsdPriceFeed,
            address weth,
            address wbtc,
            uint256 deployerKey
        ) = config.activeNetworkConfig();

        tokenAddresses = [weth, wbtc];
        priceFeedAddresses = [wethUsdPriceFeed, wbtcUsdPriceFeed];

        vm.startBroadcast(deployerKey);
        LEAFStableCoin leaf = new LEAFStableCoin();
        LEAFEngine engine = new LEAFEngine(
            tokenAddresses,
            priceFeedAddresses,
            address(leaf)
        );
        leaf.transferOwnership(address(engine));
        vm.stopBroadcast();
        return (leaf, engine, config);
    }
}
