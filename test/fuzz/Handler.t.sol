// SPDX-License-Identifier: MIT

pragma solidity ^0.8.19;

import {Test} from "lib/forge-std/src/Test.sol";
import {LEAFEngine} from "src/LEAFEngine.sol";
import {LEAFStableCoin} from "src/LEAFStableCoin.sol";
import {ERC20Mock} from "lib/openzeppelin-contracts/contracts/mocks/token/ERC20Mock.sol";

contract Handler is Test {
    LEAFEngine engine;
    LEAFStableCoin leaf;
    ERC20Mock weth;
    ERC20Mock wbtc;

    uint256 MAX_DEPOSIT_SIZE = type(uint96).max;

    constructor(LEAFEngine _engine, LEAFStableCoin _leaf) {
        engine = _engine;
        leaf = _leaf;

        address[] memory collateralTokens = engine.getCollateralTokens();
        weth = ERC20Mock(collateralTokens[0]);
        wbtc = ERC20Mock(collateralTokens[1]);
    }

    function depositCollateral(
        uint256 collateralSeed,
        uint256 amountCollateral
    ) public {
        amountCollateral = bound(amountCollateral, 1, MAX_DEPOSIT_SIZE);
        ERC20Mock collateral = _getCollateralFromSeed(collateralSeed);

        vm.startPrank(msg.sender);
        collateral.mint(msg.sender, amountCollateral);
        collateral.approve(address(engine), amountCollateral);

        engine.depositCollateral(address(collateral), amountCollateral);
        vm.stopPrank();
    }

    function redeemCollateral(
        uint256 collateralSeed,
        uint256 amountCollateral
    ) public {
        ERC20Mock collateral = _getCollateralFromSeed(collateralSeed);
        uint256 maxCollateralToRedeem = engine.getCollateralBalanceOfUser(
            msg.sender,
            address(collateral)
        );
        amountCollateral = bound(amountCollateral, 1, maxCollateralToRedeem);
        engine.redeemCollateral(address(collateral), amountCollateral);
    }

    function mintLeaf(uint256 amount) public {
        (uint256 totalLeafMinted, uint256 collateralValueInUsd) = engine
            .getAccountInformation(msg.sender);

        int256 maxLeafToMint = (int256(collateralValueInUsd) / 2) -
            int256(totalLeafMinted);
        if (maxLeafToMint < 0) {
            return;
        }
        amount = bound(amount, 0, uint256(maxLeafToMint));
        if (amount == 0) {
            return;
        }

        vm.startPrank(msg.sender);
        engine.mintLEAF(amount);
        vm.stopPrank();
    }

    // HELPER FUNCTIONS //

    function _getCollateralFromSeed(
        uint256 collateralSeed
    ) private view returns (ERC20Mock) {
        if (collateralSeed % 2 == 0) {
            return weth;
        }
        return wbtc;
    }
}
