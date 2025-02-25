// SPDX-License-Identifier: MIT

pragma solidity ^0.8.19;

import {LEAFEngine} from "src/LEAFEngine.sol";
import {LEAFStableCoin} from "src/LEAFStableCoin.sol";
import {DeployLeaf} from "script/DeployLeaf.s.sol";
import {Test, console} from "lib/forge-std/src/Test.sol";
import {HelperConfig} from "script/HelperConfig.s.sol";
import {ERC20Mock} from "lib/openzeppelin-contracts/contracts/mocks/token/ERC20Mock.sol";

contract LEAFEngineTest is Test {
    DeployLeaf _deployer;
    LEAFStableCoin _leaf;
    LEAFEngine _engine;
    HelperConfig _config;
    address _weth;
    address _ethUsdPriceFeed;
    address public USER = makeAddr("user");
    uint256 public constant AMOUNT_COLLATERAL = 10 ether;
    uint256 public constant STARTING_ERC20_BALANCE = 10 ether;

    function setUp() public {
        _deployer = new DeployLeaf();
        (_leaf, _engine, _config) = _deployer.run();
        (_ethUsdPriceFeed,, _weth, , ) = _config.activeNetworkConfig();

        ERC20Mock(_weth).mint(USER, STARTING_ERC20_BALANCE);
    }

    // PRICE TESTS //

    function testGetUsdValue() public view {
        uint256 ethAmount = 15e18;
        uint256 expectedUsd = 30000e18;
        uint256 actualUsd = _engine.getUsdValue(_weth, ethAmount);
        assertEq(expectedUsd, actualUsd);
    }

    // DEPOSIT COLLATERAL TESTS //

    function testRevertsIfCollateralZero() public {
        vm.startPrank(USER);
        ERC20Mock(_weth).approve(address(_engine), AMOUNT_COLLATERAL);

        vm.expectRevert(LEAFEngine.LEAFEngine__NeedsMoreThanZero.selector);
        _engine.depositCollateral(_weth, 0);
        vm.stopPrank();
    }
}
