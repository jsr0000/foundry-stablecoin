// SPDX-License-Identifier: MIT

pragma solidity ^0.8.19;

import {Script} from "lib/forge-std/src/Script.sol";
import {LEAFStableCoin} from "src/LEAFStableCoin.sol";
import {LEAFEngine} from "src/LEAFEngine.sol";

contract DeployLeaf is Script {
    function run() external returns (LEAFStableCoin, LEAFEngine) {}
}
