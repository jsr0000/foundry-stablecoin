// SPDX-License-Identifier: MIT

// Layout of Contract:
// version
// imports
// interfaces, libraries, contracts
// errors
// Type declarations
// State variables
// Events
// Modifiers
// Functions

// Layout of Functions:
// constructor
// receive function (if exists)
// fallback function (if exists)
// external
// public
// internal
// private
// view & pure functions

pragma solidity ^0.8.19;

/**
 * @author  Josh Regnart
 * @title   Leaf Engine
 *     The system is designed to be as minimal as possible, and have the tokens maintain a 1 token = $1 peg.
 *     This stablecoin has the properties:
 *     - Exogenous Collateral
 *     - Dollar pegged
 *     - Algorithmically stable
 *     It is si ilar to DAI if DAI had no governance or fees and was only backed by WETH and WBTC.
 * @notice  This contract is the core of the LEAF system. It handles all the logic for minting and redeeming DSC, as well as depositing and withdrawing collateral.
 * @notice  This contract is very loosely based on the MakerDAO DSS (DAI) system.
 */

import {DecentralisedStableCoin} from "src/DecentralisedStableCoin.sol";

contract LEAFEngine {
    constructor() {}

    function depositCollateralAndMintDsc() external {}

    function depositCollateral() external {}

    function redeemCollateralForDsc() external {}

    function redeemCollateral() external {}

    function mintDsc() external {}

    function burnDsc() external {}

    function liquidate() external {}

    function getHealthFactor() external view {}
}
