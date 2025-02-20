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
import {ReentrancyGuard} from "lib/openzeppelin-contracts/contracts/utils/ReentrancyGuard.sol";
import {IERC20} from "lib/forge-std/src/interfaces/IERC20.sol";

contract LEAFEngine is ReentrancyGuard {
    /* ERRORS */

    error LEAFEngine__NeedsMoreThanZero();
    error LEAFEngine__TokenAddressesAndPriceFeedAddressesMustBeSameLength();
    error LEAFEngine__TokenNotAllowed();
    error LEAFEngine__TransferFailed();

    /* STATE VAIRABLES */

    mapping(address token => address priceFeed) private s_priceFeeds;
    mapping(address user => mapping(address token => uint256 amount))
        private s_collateralDeposited;
    mapping(address user => uint256 amountLeafMinted) private s_LEAFMinted;
    DecentralisedStableCoin private immutable i_dsc;
    address[] private s_collateralTokens;

    /* EVENTS */

    event collateralDeposited(
        address indexed user,
        address indexed token,
        uint256 indexed amount
    );

    /* MODIFIERS */

    modifier moreThanZero(uint256 amount) {
        if (amount <= 0) {
            revert LEAFEngine__NeedsMoreThanZero();
        }
        _;
    }

    modifier isAllowedToken(address token) {
        if (s_priceFeeds[token] == address(0)) {
            revert LEAFEngine__TokenNotAllowed();
        }
        _;
    }

    /* CONSTRUCTOR */

    constructor(
        address[] memory tokenAddresses,
        address[] memory priceFeedAddresses,
        address dscAddress
    ) {
        if (tokenAddresses.length != priceFeedAddresses.length) {
            revert LEAFEngine__TokenAddressesAndPriceFeedAddressesMustBeSameLength();
        }

        for (uint256 i = 0; i < tokenAddresses.length; i++) {
            s_priceFeeds[tokenAddresses[i]] = priceFeedAddresses[i];
        }
        i_dsc = DecentralisedStableCoin(dscAddress);
    }

    /* EXTERNAL FUNCTIONS */

    /**
     * @param   tokenCollateralAddress  The ERC20 token address of the collateral your depositing.
     * @param   amountCollateral  The amount of collateral your depositing.
     */
    function depositCollateral(
        address tokenCollateralAddress,
        uint256 amountCollateral
    )
        external
        moreThanZero(amountCollateral)
        isAllowedToken(tokenCollateralAddress)
        nonReentrant
    {
        s_collateralDeposited[msg.sender][
            tokenCollateralAddress
        ] += amountCollateral;
        emit collateralDeposited(
            msg.sender,
            tokenCollateralAddress,
            amountCollateral
        );
        bool success = IERC20(tokenCollateralAddress).transferFrom(
            msg.sender,
            address(this),
            amountCollateral
        );

        if (!success) {
            revert LEAFEngine__TransferFailed();
        }
    }

    /**
     * @param   amountDscToMint  The amount of LEAF you want to mint.
     * You can only mint LEAF if you have enough collateral.
     */
    function mintDsc(
        uint256 amountDscToMint
    ) public moreThanZero(amountLeafToMint) nonReentrant {
        s_LEAFMinted[msg.sender] += amountLeafToMint;
    }

    /* PRIVATE & INTERNAL VIEW FUNCTIONS */

    function _revertIfHealthFactorIsBroken(address user) {}

    /**
     * @param   user  .
     * @return  uint256  Returns how close to liquidation a user is.
     * If a user goes below 1, then they can be liquidated.
     */
    function _healthFactor(address user) private view returns (uint256) {}

    function _getAccountInformation(
        address user
    )
        private
        view
        returns (uint256 totalLeafMinted, uint256 collateralValueInUsd)
    {
        totalLeafMinted = s_LEAFMinted[user];
        collateralValueInUsd = getAccountCollateralValue(user);
    }

    /* PUBLIC & EXTERNAL VIEW FUNCTIONS */

    function getAccountCollateralValue(address user) public pure {}
}
