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

import {LEAFStableCoin} from "src/LEAFStableCoin.sol";
import {ReentrancyGuard} from "lib/openzeppelin-contracts/contracts/utils/ReentrancyGuard.sol";
import {IERC20} from "lib/forge-std/src/interfaces/IERC20.sol";
import {AggregatorV3Interface} from "lib/chainlink-brownie-contracts/contracts/src/v0.8/shared/interfaces/AggregatorV3Interface.sol";

contract LEAFEngine is ReentrancyGuard {
    /* ERRORS */

    error LEAFEngine__NeedsMoreThanZero();
    error LEAFEngine__TokenAddressesAndPriceFeedAddressesMustBeSameLength();
    error LEAFEngine__TokenNotAllowed(address token);
    error LEAFEngine__TransferFailed();
    error LEAFEngine__BreaksHealthFactor(uint256 healthFactor);
    error LEAFEngine__MintFailed();
    error LEAFEngine__HealthFactorOk();
    error LEAFEngine__HealthFactorNotImproved();

    /* STATE VAIRABLES */

    mapping(address token => address priceFeed) private _s_priceFeeds;
    mapping(address user => mapping(address token => uint256 amount))
        private _s_collateralDeposited;
    mapping(address user => uint256 amountLeafMinted) private _s_LEAFMinted;
    LEAFStableCoin private immutable _i_leaf;
    address[] private _s_collateralTokens;

    uint256 private constant _ADDITIONAL_FEED_PRECISION = 1e10;
    uint256 private constant _PRECISION = 1e18;
    uint256 private constant _LIQUIDATION_THRESHOLD = 50;
    uint256 private constant _LIQUIDATION_PRECISION = 100;
    uint256 private constant _MIN_HEALTH_FACTOR = 1e18;
    uint256 private constant _LIQUIDATION_BONUS = 10;

    /* EVENTS */

    event CollateralDeposited(
        address indexed user,
        address indexed token,
        uint256 indexed amount
    );
    event CollateralRedeemed(
        address indexed redeemedFrom,
        address indexed redeemedTo,
        address indexed token,
        uint256 amount
    );

    /* MODIFIERS */

    modifier moreThanZero(uint256 amount) {
        if (amount <= 0) {
            revert LEAFEngine__NeedsMoreThanZero();
        }
        _;
    }

    modifier isAllowedToken(address token) {
        if (_s_priceFeeds[token] == address(0)) {
            revert LEAFEngine__TokenNotAllowed(token);
        }
        _;
    }

    /* CONSTRUCTOR */

    constructor(
        address[] memory tokenAddresses,
        address[] memory priceFeedAddresses,
        address leafAddress
    ) {
        if (tokenAddresses.length != priceFeedAddresses.length) {
            revert LEAFEngine__TokenAddressesAndPriceFeedAddressesMustBeSameLength();
        }

        for (uint256 i = 0; i < tokenAddresses.length; i++) {
            _s_priceFeeds[tokenAddresses[i]] = priceFeedAddresses[i];
            _s_collateralTokens.push(tokenAddresses[i]);
        }
        _i_leaf = LEAFStableCoin(leafAddress);
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
        public
        moreThanZero(amountCollateral)
        isAllowedToken(tokenCollateralAddress)
        nonReentrant
    {
        _s_collateralDeposited[msg.sender][
            tokenCollateralAddress
        ] += amountCollateral;
        emit CollateralDeposited(
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
     * @param   amountLeafToMint  The amount of LEAF you want to mint.
     * You can only mint LEAF if you have enough collateral.
     */
    function mintLEAF(
        uint256 amountLeafToMint
    ) public moreThanZero(amountLeafToMint) nonReentrant {
        _s_LEAFMinted[msg.sender] += amountLeafToMint;
        _revertIfHealthFactorIsBroken(msg.sender);
        bool minted = _i_leaf.mint(msg.sender, amountLeafToMint);

        if (!minted) {
            revert LEAFEngine__MintFailed();
        }
    }

    /**
     * @notice  This function will deposit collateral and mint LEAF in one function.
     * @param   tokenCollateralAddress  the address of the token to deposit as collateral
     * @param   amountCollateral  The amount of collateral to deposit
     * @param   amountLeafToMint  The amount of LEAF to mint.
     */
    function depositCollateralAndMintLEAF(
        address tokenCollateralAddress,
        uint256 amountCollateral,
        uint256 amountLeafToMint
    ) external {
        depositCollateral(tokenCollateralAddress, amountCollateral);
        mintLEAF(amountLeafToMint);
    }

    function redeemCollateral(
        address tokenCollateralAddress,
        uint256 amountCollateral
    ) public moreThanZero(amountCollateral) nonReentrant {
        _redeemCollateral(
            tokenCollateralAddress,
            amountCollateral,
            msg.sender,
            msg.sender
        );

        _revertIfHealthFactorIsBroken(msg.sender);
    }

    function burnLEAF(uint256 amount) public moreThanZero(amount) {
        _burnLEAF(amount, msg.sender, msg.sender);
        _revertIfHealthFactorIsBroken(msg.sender);
    }

    function redeemCollateralForLEAF(
        address tokenCollateralAddress,
        uint256 amountCollateral,
        uint256 amountLEAFToBurn
    ) external {
        burnLEAF(amountLEAFToBurn);
        redeemCollateral(tokenCollateralAddress, amountCollateral);
    }

    /**
     * @notice  You can partially liquidate a user.
     * @notice  You will get a 10% _LIQUIDATION_BONUS for taking the users funds.
     * @notice  This function working assumes that the protocol will be roughly 150% overcollateralized.
     * @param   collateral  The ERC20 token address of the collateral your using to make the protocol solvent again.
     * This is collateral that your going to take from the user who is insolvent.
     * In return, you have to burn your LEAF to pay off their debt, but you dont pay off your own.
     * @param   user  The user who is insolvent. They have to have a _healthFactor below _MIN_HEALTH_FACTOR.
     * @param   debtToCover  The amount of LEAF to burn in order to cover the users debt.
     */
    function liquidate(
        address collateral,
        address user,
        uint256 debtToCover
    ) external moreThanZero(debtToCover) nonReentrant {
        uint256 startingUserHealthFactor = _healthFactor(user);
        if (startingUserHealthFactor > _MIN_HEALTH_FACTOR) {
            revert LEAFEngine__HealthFactorOk();
        }

        uint256 tokenAmountFromDebtCovered = getTokenAmountFromUsd(
            collateral,
            debtToCover
        );

        uint256 bonusCollateral = (tokenAmountFromDebtCovered *
            _LIQUIDATION_BONUS) / _LIQUIDATION_PRECISION;

        uint256 totalCollateralToRedeem = tokenAmountFromDebtCovered +
            bonusCollateral;

        _redeemCollateral(
            collateral,
            totalCollateralToRedeem,
            user,
            msg.sender
        );

        _burnLEAF(debtToCover, user, msg.sender);

        uint256 endingUserHealthFactor = _healthFactor(user);
        if (endingUserHealthFactor <= startingUserHealthFactor) {
            revert LEAFEngine__HealthFactorNotImproved();
        }

        _revertIfHealthFactorIsBroken(msg.sender);
    }

    function getHealthFactor() external {}

    /* PRIVATE & INTERNAL VIEW FUNCTIONS */

    function _revertIfHealthFactorIsBroken(address user) internal view {
        uint256 userHealthFactor = _healthFactor(user);
        if (userHealthFactor < _MIN_HEALTH_FACTOR) {
            revert LEAFEngine__BreaksHealthFactor(userHealthFactor);
        }
    }

    /**
     * @param   user  .
     * @return  uint256  Returns how close to liquidation a user is.
     * If a user goes below 1, then they can be liquidated.
     */
    function _healthFactor(address user) private view returns (uint256) {
        (
            uint256 totalLeafMinted,
            uint256 collateralValueInUsd
        ) = _getAccountInformation(user);
        return _calculateHealthFactor(totalLeafMinted, collateralValueInUsd);
    }

    function _calculateHealthFactor(
        uint256 totalLeafMinted,
        uint256 collateralValueInUsd
    ) internal pure returns (uint256) {
        if (totalLeafMinted == 0) return type(uint256).max;
        uint256 collateralAdjustedForThreshold = (collateralValueInUsd *
            _LIQUIDATION_THRESHOLD) / _LIQUIDATION_PRECISION;
        return (collateralAdjustedForThreshold * _PRECISION) / totalLeafMinted;
    }

    function _getAccountInformation(
        address user
    )
        private
        view
        returns (uint256 totalLeafMinted, uint256 collateralValueInUsd)
    {
        totalLeafMinted = _s_LEAFMinted[user];
        collateralValueInUsd = getAccountCollateralValue(user);
    }

    function _redeemCollateral(
        address tokenCollateralAddress,
        uint256 amountCollateral,
        address from,
        address to
    ) private {
        _s_collateralDeposited[from][
            tokenCollateralAddress
        ] -= amountCollateral;
        emit CollateralRedeemed(
            from,
            to,
            tokenCollateralAddress,
            amountCollateral
        );
        bool success = IERC20(tokenCollateralAddress).transfer(
            to,
            amountCollateral
        );
        if (!success) {
            revert LEAFEngine__TransferFailed();
        }
        emit CollateralRedeemed(
            from,
            to,
            tokenCollateralAddress,
            amountCollateral
        );
    }

    function _burnLEAF(
        uint256 amountLeafToBurn,
        address onBehalfOf,
        address leafFrom
    ) private moreThanZero(amountLeafToBurn) {
        _s_LEAFMinted[onBehalfOf] -= amountLeafToBurn;
        bool success = _i_leaf.transferFrom(
            leafFrom,
            address(this),
            amountLeafToBurn
        );
        if (!success) {
            revert LEAFEngine__TransferFailed();
        }
        _i_leaf.burn(amountLeafToBurn);
    }

    /* PUBLIC & EXTERNAL VIEW FUNCTIONS */

    function getAccountCollateralValue(
        address user
    ) public view returns (uint256 totalCollateralValueInUsd) {
        for (uint256 i = 0; i < _s_collateralTokens.length; i++) {
            address token = _s_collateralTokens[i];
            uint256 amount = _s_collateralDeposited[user][token];
            totalCollateralValueInUsd += getUsdValue(token, amount);
        }
        return totalCollateralValueInUsd;
    }

    function getUsdValue(
        address token,
        uint256 amount
    ) public view returns (uint256) {
        AggregatorV3Interface priceFeed = AggregatorV3Interface(
            _s_priceFeeds[token]
        );
        (, int256 price, , , ) = priceFeed.latestRoundData();
        return
            ((uint256(price) * _ADDITIONAL_FEED_PRECISION) * amount) /
            _PRECISION;
    }

    function getTokenAmountFromUsd(
        address token,
        uint256 usdAmountInWei
    ) public view returns (uint256) {
        AggregatorV3Interface priceFeed = AggregatorV3Interface(
            _s_priceFeeds[token]
        );
        (, int256 price, , , ) = priceFeed.latestRoundData();

        return
            (usdAmountInWei * _PRECISION) /
            (uint256(price) * _ADDITIONAL_FEED_PRECISION);
    }

    function getPrecision() external pure returns (uint256) {
        return _PRECISION;
    }

    function getAdditionalFeedPrecision() external pure returns (uint256) {
        return _ADDITIONAL_FEED_PRECISION;
    }

    function getLiquidationThreshold() external pure returns (uint256) {
        return _LIQUIDATION_THRESHOLD;
    }

    function getLiquidationBonus() external pure returns (uint256) {
        return _LIQUIDATION_BONUS;
    }

    function getLiquidationPrecision() external pure returns (uint256) {
        return _LIQUIDATION_PRECISION;
    }

    function getMinHealthFactor() external pure returns (uint256) {
        return _MIN_HEALTH_FACTOR;
    }

    function getCollateralTokens() external view returns (address[] memory) {
        return s_collateralTokens;
    }

    function getLeaf() external view returns (address) {
        return address(i_leaf);
    }

    function getCollateralTokenPriceFeed(
        address token
    ) external view returns (address) {
        return s_priceFeeds[token];
    }

    function getHealthFactor(address user) external view returns (uint256) {
        return _healthFactor(user);
    }
}
