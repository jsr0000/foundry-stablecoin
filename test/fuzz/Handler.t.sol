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
        ERC20Mock collateral = _getCollateralFromSeed(collateralSeed);
        engine.depositCollateral(address(collateral), amountCollateral);
    }

    // HELPER FUNCTIONS //

    function _getCollateralFromSeed(uint256 collateralSeed) private view returns (ERC20Mock) {
        if (collateralSeed % 2 == 0) {
            return weth;
        } 
        return wbtc;
    }
}
